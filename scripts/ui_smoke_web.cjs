/** Browser-only synthetic UI checks. Every API request is intercepted, never forwarded. */
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.UI_SMOKE_URL || 'http://127.0.0.1:4173';
const debugBase = process.env.UI_SMOKE_DEBUG_URL;
const output = process.env.UI_SMOKE_OUTPUT || '/tmp/bloodsugar-ui-web';
const now = new Date().toISOString();
const seedRecord = { id: 'demo-record', profile_id: 'demo-profile', record_type: 'glucose', occurred_at: now,
  payload_json: { value: 118, unit: 'mg/dL', timing: 'fasting' }, metadata_json: {}, source: 'manual' };
const candidate = { ...seedRecord, source: 'ai_parse_preview', confidence: .96 };
const overview = { generated_at: now, days: 30, total_requests: 120, total_errors: 2, total_tokens: 18240,
  endpoints: [{ method: 'GET', route: '/records', request_count: 80, error_count: 0, average_duration_ms: 24, max_duration_ms: 110 }],
  daily: [{ date: now.slice(0, 10), request_count: 120, error_count: 2, average_duration_ms: 28 }],
  models: [{ provider: 'demo', model_id: 'demo-parser-v1', request_count: 12, success_count: 12, failure_count: 0,
    usage_reported_count: 12, input_tokens: 16240, output_tokens: 2000, total_tokens: 18240 }] };

(async () => {
  await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ locale: 'zh-TW', reducedMotion: 'reduce' });
  let adminSignedIn = false;
  let parseCount = 0, createCount = 0, updateCount = 0, deleteCount = 0;
  let previewRecords = [candidate], failSecondOnce = false, failParser = false;
  const createsByValue = {};
  let releaseParser;
  const parserGate = new Promise(resolve => { releaseParser = resolve; });
  const errors = [], captures = [], blocked = [];
  await context.route('**/*', async route => {
    const request = route.request();
    const url = new URL(request.url());
    const pathname = url.pathname.replace(/^\/api(?=\/)/, '');
    const json = (body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    if (pathname === '/health') return json({ status: 'ok', service: 'ui-fixture', env: 'test' });
    if (pathname === '/auth/dev-login') return json({ id: 'demo-account', email: 'ui@example.invalid', display_name: '範例' });
    if (pathname === '/ai/models') return json({ stt_models: [{ id: 'browser-web-speech', available: true, label: '瀏覽器語音' }], llm_models: [{ id: 'deepseek-chat', available: true, label: '範例整理' }] });
    if (pathname === '/subscriptions/voice-quota') return json({ plan_code: 'trial', status: 'active', daily_limit_seconds: 300, used_seconds_today: 0, remaining_seconds_today: 300 });
    if (pathname === '/profiles') return json([{ id: 'demo-profile', account_id: 'demo-account', display_name: '自己', relationship: 'self' }]);
    if (pathname === '/records') {
      if (request.method() === 'POST') {
        createCount++;
        const body = request.postDataJSON();
        const value = body.payload_json.value;
        createsByValue[value] = (createsByValue[value] || 0) + 1;
        if (value === 130 && failSecondOnce) { failSecondOnce = false; return json({ detail: 'synthetic-save-failure' }, 500); }
        return json({ ...body, id: `saved-demo-${value}` });
      }
      return json([seedRecord]);
    }
    if (pathname.startsWith('/records/')) {
      if (request.method() === 'DELETE') { deleteCount++; return route.fulfill({ status: 204 }); }
      if (request.method() === 'PATCH') { updateCount++; return json({ ...seedRecord, ...request.postDataJSON() }); }
    }
    if (pathname === '/ai/parse-preview/progress-stream') {
      parseCount++;
      await parserGate;
      if (failParser) return json({ detail: { code: 'local_parser_failed' } }, 502);
      return route.fulfill({ status: 200, contentType: 'application/x-ndjson', body: JSON.stringify({ event: 'final', preview: {
        records: previewRecords, segments: [], rejected_events: [], stt_model_id: 'demo', llm_model_id: 'demo'
      } }) + '\n' });
    }
    if (pathname === '/admin/session') return json({ authenticated: adminSignedIn, username: 'demo-admin' }, adminSignedIn ? 200 : 401);
    if (pathname === '/admin/login') { adminSignedIn = true; return json({ authenticated: true, username: 'demo-admin' }); }
    if (pathname === '/admin/usage') return json(overview);
    if ([base, debugBase].filter(Boolean).some(origin => url.origin === new URL(origin).origin)
      && request.resourceType() !== 'fetch' && request.resourceType() !== 'xhr') return route.continue();
    blocked.push(pathname);
    return route.abort('blockedbyclient');
  });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('dialog', dialog => dialog.accept());
  async function capture(name) {
    await page.evaluate(() => document.fonts.ready);
    const size = await page.evaluate(() => ({ viewport: innerWidth, content: document.documentElement.scrollWidth }));
    assert.ok(size.content <= size.viewport + 1, `${name}: horizontal overflow ${JSON.stringify(size)}`);
    await page.screenshot({ path: path.join(output, `${name}.png`), fullPage: true });
    captures.push(name);
  }
  async function navigate(label) {
    const primaryDestination = page.locator('.core-nav button').filter({ hasText: label });
    if (await primaryDestination.count()) {
      await primaryDestination.click();
      return;
    }
    await page.getByRole('button', { name: '開啟功能選單' }).click();
    await page.locator('.app-menu button').filter({ has: page.locator('strong', { hasText: label }) }).click();
  }
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(base);
    await page.getByText('今日 1 筆', { exact: false }).waitFor();
    await capture(`home-${width}`);
    for (const [label, id] of [['今日', 'today'], ['歷史', 'history'], ['分析', 'analysis'], ['帳號設定', 'settings'], ['使用教學', 'tutorial']]) {
      await navigate(label);
      await capture(`${id}-${width}`);
    }
    await page.goto(`${base}/admin`);
    await page.getByRole('button', { name: '登入' }).waitFor();
    await capture(`admin-login-${width}`);
    adminSignedIn = true;
    await page.reload();
    await page.getByRole('heading', { name: 'API 與模型用量' }).waitFor();
    await capture(`admin-dashboard-${width}`);
    adminSignedIn = false;
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base);
  await page.getByText('今日 1 筆', { exact: false }).waitFor();
  await page.getByLabel('要記錄的內容').fill('範例：早上血糖 118。');
  await page.getByRole('button', { name: '整理預覽', exact: true }).click();
  await capture('transcript-review');
  await page.getByRole('button', { name: '下一步整理' }).evaluate(button => { button.click(); button.click(); });
  await page.getByText('把日常，整理成紀錄').waitFor();
  assert.equal(await page.getByRole('textbox').count(), 0, 'parser must not expose editable transcript');
  assert.equal(await page.getByRole('button', { name: '開啟功能選單' }).isDisabled(), true);
  await capture('parser-loading');
  assert.equal(parseCount, 1, 'double submit must parse once');
  assert.equal(createCount, 0, 'parser must not save');
  releaseParser();
  await page.getByRole('heading', { name: '看看整理得對不對' }).waitFor();
  await capture('candidate-confirmation');
  await page.getByLabel('候選紀錄 1 數值', { exact: true }).fill('120');
  await page.getByRole('button', { name: '確認儲存', exact: true }).evaluate(button => { button.click(); button.click(); });
  await page.getByRole('status').filter({ hasText: '紀錄已儲存' }).waitFor();
  assert.equal(createCount, 1, 'double save must create once');
  await capture('save-success');
  await navigate('今日紀錄');
  await page.getByRole('button', { name: '詳情', exact: true }).last().click();
  await page.getByLabel('紀錄 數值', { exact: true }).fill('121');
  await capture('record-edit');
  await page.getByRole('button', { name: '儲存修改' }).click();
  await page.getByRole('status').filter({ hasText: '紀錄已更新' }).waitFor();
  assert.equal(updateCount, 1);
  await page.getByRole('button', { name: '刪除', exact: true }).click();
  assert.equal(deleteCount, 0, 'opening delete confirmation must not delete');
  await capture('delete-confirmation');
  await page.getByRole('button', { name: '保留紀錄' }).click();
  assert.equal(deleteCount, 0);
  await page.getByRole('button', { name: '刪除', exact: true }).click();
  await page.getByRole('button', { name: '確認刪除', exact: true }).evaluate(button => { button.click(); button.click(); });
  await page.getByRole('status').filter({ hasText: '紀錄已刪除' }).waitFor();
  assert.equal(deleteCount, 1, 'double delete must delete once');
  // Partial success must remove acknowledged records, leaving only the failed item for retry.
  await navigate('首頁');
  previewRecords = [119, 130].map(value => ({ ...candidate, payload_json: { ...candidate.payload_json, value } }));
  failSecondOnce = true;
  await page.getByLabel('要記錄的內容').fill('範例：兩筆待確認紀錄。');
  await page.getByRole('button', { name: '整理預覽', exact: true }).click();
  await page.getByRole('button', { name: '下一步整理' }).click();
  await page.getByRole('heading', { name: '看看整理得對不對' }).waitFor();
  await page.getByRole('button', { name: '確認儲存', exact: true }).click();
  await page.getByRole('status').filter({ hasText: '還有紀錄尚未儲存' }).waitFor();
  assert.equal(await page.locator('.confirmation dl').count(), 1);
  assert.equal(await page.getByLabel('候選紀錄 1 數值', { exact: true }).inputValue(), '130');
  await capture('partial-save-recovery');
  await page.getByRole('button', { name: '確認儲存', exact: true }).click();
  await page.getByRole('status').filter({ hasText: '紀錄已儲存' }).waitFor();
  assert.equal(createsByValue[119], 1, 'acknowledged item must not be retried');
  assert.equal(createsByValue[130], 2, 'only the failed item should retry');
  failParser = true;
  await page.getByLabel('要記錄的內容').fill('範例：服務失敗時應保留文字。');
  await page.getByRole('button', { name: '整理預覽', exact: true }).click();
  await page.getByRole('button', { name: '下一步整理' }).click();
  await page.getByRole('status').filter({ hasText: 'AI 整理暫時失敗' }).waitFor();
  assert.equal(await page.getByLabel('要記錄的內容').inputValue(), '範例：服務失敗時應保留文字。');
  assert.equal(await page.getByRole('button', { name: '開啟功能選單' }).isEnabled(), true);
  await capture('parser-error-recovery');
  if (debugBase) {
    for (const width of [320, 390, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(debugBase);
      await page.getByText('今日 1 筆', { exact: false }).waitFor();
      for (const [label, id] of [['訂閱方案', 'subscription'], ['試用狀態', 'trial'], ['成就榜', 'achievements'],
        ['年度回顧', 'year'], ['商城', 'store'], ['食物拍照', 'food'], ['帳號設定', 'debug-settings']]) {
        await navigate(label);
        await capture(`${id}-${width}`);
      }
    }
  }
  assert.deepEqual(errors, []);
  assert.deepEqual(blocked, []);
  const report = { captures, viewports: [320, 390, 1280], parseCount, createCount, createsByValue, updateCount, deleteCount,
    realApiCalls: 0, syntheticDataOnly: true, browserErrors: errors, unexpectedRequests: blocked };
  await fs.writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });

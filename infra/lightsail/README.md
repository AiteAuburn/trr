# Lightsail staging deployment for APK testing

This is the low-cost, single-user staging path. It runs Caddy, a static web
container, the FastAPI backend, and PostgreSQL on one 1 GB Lightsail instance
with a 2 GB swap file.
DeepSeek remains a hosted API; no local LLM container runs on this host.
The backend joins the private database network and a public Docker network for
outbound DeepSeek HTTPS/DNS, but port 8000 is not published on the host; inbound
API traffic still enters only through Caddy on ports 80/443.

This topology is intentionally not high availability. Do not use real customer
traffic until authentication, backups, restore testing, monitoring, and the
ECS/RDS production path are complete.

## AWS resources

- Ubuntu 24.04 Lightsail instance, `micro_3_0` / 1 GB plan.
- Static IPv4 attached to the instance.
- TCP 22 restricted to the operator IP; TCP 80/443 public for Caddy.
- AWS Budget at USD 10/month with actual 80% and forecasted 100% email alerts.

## Deployment sequence

1. Create the instance, static IP, firewall, and budget using an authenticated
   AWS CLI session.
2. Run `bootstrap.sh` as root through Lightsail SSH.
3. Upload the repository to `/opt/bloodsugar` without `.git`, `.env`, caches,
   local devices, or credentials.
4. Run `initialize-env.sh DOMAIN` once to generate the database/JWT secrets and
   server `.env` with mode `0600`. Run `set-deepseek-key.sh` interactively to
   enter the rotated DeepSeek key only on that server. Run
   `set-admin-credentials.sh` interactively to hash the admin password and
   generate a separate session secret; plaintext is never stored.
5. Run migrations with the backend image, then start `compose.yml`.
6. Verify `https://DOMAIN/`, `https://DOMAIN/admin`,
   `https://DOMAIN/healthz`, `https://DOMAIN/readyz`, and a bounded DeepSeek
   parser smoke test without real health data.
7. Build the APK with `EXPO_PUBLIC_API_BASE_URL=https://DOMAIN/api`.

The new website and APK use `/api`. Root-level API prefixes remain proxied for
the previously installed APK during the staging transition. Remove that
compatibility routing only after supported clients have upgraded.

Admin analytics are stored as compact UTC daily aggregates. The database keeps
API route/status-class counts and duration totals/maxima, plus provider/model ID
and input/output/total token counts. It does not store request bodies, prompts,
transcripts, raw model responses, or per-user analytics events.

For the initial test hostname, an IP-based wildcard DNS service can avoid a
domain purchase. A domain controlled by the project is required before real
customer use.

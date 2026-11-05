#!/usr/bin/env python3
"""Keep the native/web palette aligned and protect readable primary text pairs."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
native = (ROOT / 'mobile/designTokens.ts').read_text()
web = (ROOT / 'web/src/styles.css').read_text()
mapping = {
    'canvas': 'soft', 'surface': 'card', 'ink': 'brand-ink', 'text': 'ink',
    'secondary': 'muted', 'brand': 'brand', 'wash': 'mint', 'border': 'border', 'danger': 'danger',
}

def normalize(color):
    raw = color.lstrip('#').lower()
    return ''.join(char * 2 for char in raw) if len(raw) == 3 else raw

colors = dict(re.findall(r'(\w+):\s*"(#[0-9A-Fa-f]+)"', native))
for mobile_name, web_name in mapping.items():
    match = re.search(rf'--color-{web_name}:\s*(#[0-9a-fA-F]+)', web)
    assert match and normalize(colors[mobile_name]) == normalize(match[1]), (mobile_name, web_name)

def luminance(color):
    raw = normalize(color)
    channels = [int(raw[index:index+2], 16) / 255 for index in (0, 2, 4)]
    linear = [value / 12.92 if value <= .04045 else ((value + .055) / 1.055) ** 2.4 for value in channels]
    return sum(weight * value for weight, value in zip((.2126, .7152, .0722), linear))

for foreground, background in [('surface', 'brand'), ('text', 'canvas'), ('secondary', 'canvas'), ('danger', 'surface')]:
    light, dark = sorted([luminance(colors[foreground]), luminance(colors[background])], reverse=True)
    contrast = (light + .05) / (dark + .05)
    assert contrast >= 4.5, (foreground, background, contrast)
    print(f'{foreground}/{background}: {contrast:.2f}:1')
print('Native/web design tokens aligned. This is not a full accessibility audit.')

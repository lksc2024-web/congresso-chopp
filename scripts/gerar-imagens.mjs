#!/usr/bin/env node
/**
 * gerar-imagens.mjs
 * Gera os assets binários do site (OG image e ícones PWA) renderizando HTML
 * no Chromium — assim o repositório não depende de nenhum editor gráfico e
 * a identidade visual fica versionada como código.
 *
 * Uso: node scripts/gerar-imagens.mjs
 */
import { chromium } from 'playwright';
import { mkdir, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'assets', 'img');

const AMBER = '#F5A524';
const AMBER_STRONG = '#FFBB47';
const BG = '#12100E';

/** Copo de chopp — mesmo desenho do favicon e do cabeçalho. */
const mark = (size, stroke = AMBER) => `
<svg width="${size}" height="${size}" viewBox="0 0 48 48" fill="none">
  <path d="M13 9h18a3 3 0 0 1 3 3v25a3 3 0 0 1-3 3H13a3 3 0 0 1-3-3V12a3 3 0 0 1 3-3Zm21 6h4a5 5 0 0 1 5 5v6a5 5 0 0 1-5 5h-4"
        stroke="${stroke}" stroke-width="3" stroke-linejoin="round"/>
  <path d="M15 20h14M15 26h14" stroke="${AMBER_STRONG}" stroke-width="2.5" stroke-linecap="round" opacity=".75"/>
</svg>`;

const base = `
  margin:0;background:${BG};color:#F6F1EA;
  font-family:Georgia,'Times New Roman',serif;
  display:flex;align-items:center;justify-content:center;
`;

const glow = `
  background:
    radial-gradient(120% 90% at 80% 5%, rgba(226,84,43,.42) 0%, transparent 58%),
    radial-gradient(90% 80% at 5% 100%, rgba(245,165,36,.32) 0%, transparent 60%),
    linear-gradient(170deg,#1D1813 0%,${BG} 65%);
`;

const OG = `<body style="${base}width:1200px;height:630px">
  <div style="${glow}width:1200px;height:630px;display:flex;flex-direction:column;justify-content:center;padding:0 84px;box-sizing:border-box">
    <div style="display:flex;align-items:center;gap:18px;margin-bottom:30px">
      ${mark(64)}
      <div style="line-height:1">
        <div style="font-size:36px;font-weight:700">Congresso</div>
        <div style="font-family:system-ui,sans-serif;font-size:15px;letter-spacing:.28em;color:${AMBER};font-weight:700;margin-top:4px">DO CHOPP</div>
      </div>
    </div>
    <div style="font-size:78px;line-height:1.06;letter-spacing:-.02em;max-width:940px">
      O rodízio mais completo de <span style="color:${AMBER_STRONG}">Campo Grande</span>
    </div>
    <div style="font-family:system-ui,sans-serif;font-size:27px;color:#C4B7A8;margin-top:26px;max-width:880px;line-height:1.45">
      Pizzas, massas, petiscos e buffet livre com carnes, frutos do mar e comida japonesa. Refri liberado.
    </div>
    <div style="display:flex;gap:14px;margin-top:38px;font-family:system-ui,sans-serif;font-size:21px;font-weight:700">
      <span style="background:${AMBER};color:#1A1207;padding:12px 26px;border-radius:999px">R$ 59,90 seg–qui</span>
      <span style="border:2px solid #3A312B;padding:10px 26px;border-radius:999px;color:#C4B7A8">R$ 64,90 sex–dom</span>
    </div>
  </div>
</body>`;

const icon = (size, maskable = false) => {
  const pad = maskable ? Math.round(size * 0.22) : Math.round(size * 0.12);
  const radius = maskable ? 0 : Math.round(size * 0.22);
  return `<body style="${base}width:${size}px;height:${size}px">
    <div style="width:${size}px;height:${size}px;border-radius:${radius}px;${glow}display:flex;align-items:center;justify-content:center;box-sizing:border-box;padding:${pad}px">
      ${mark(size - pad * 2)}
    </div>
  </body>`;
};

const TARGETS = [
  { file: 'og-congresso-do-chopp.png', html: OG, w: 1200, h: 630 },
  { file: 'apple-touch-icon.png', html: icon(180), w: 180, h: 180 },
  { file: 'icon-192.png', html: icon(192), w: 192, h: 192 },
  { file: 'icon-512.png', html: icon(512), w: 512, h: 512 },
  { file: 'icon-maskable-512.png', html: icon(512, true), w: 512, h: 512 },
];

async function resolveExecutablePath() {
  if (process.env.PW_CHROMIUM_PATH) return process.env.PW_CHROMIUM_PATH;
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (!root || !existsSync(root)) return undefined;
  const symlink = path.join(root, 'chromium');
  if (existsSync(symlink)) return symlink;
  const dirs = (await readdir(root)).filter((d) => d.startsWith('chromium-'));
  for (const d of dirs.sort().reverse()) {
    const bin = path.join(root, d, 'chrome-linux', 'chrome');
    if (existsSync(bin)) return bin;
  }
  return undefined;
}

const browser = await chromium.launch({
  executablePath: await resolveExecutablePath(),
  args: ['--no-sandbox'],
});
await mkdir(OUT, { recursive: true });

for (const t of TARGETS) {
  const page = await browser.newPage({ viewport: { width: t.w, height: t.h }, deviceScaleFactor: 1 });
  await page.setContent(`<!doctype html><html>${t.html}</html>`);
  await page.screenshot({ path: path.join(OUT, t.file), omitBackground: false });
  await page.close();
  console.log(`✓ ${t.file} (${t.w}×${t.h})`);
}

await browser.close();
console.log('\nAssets gerados em assets/img/');

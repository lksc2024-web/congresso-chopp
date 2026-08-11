#!/usr/bin/env node
/**
 * gerar-ilustracoes.mjs
 * Renderiza as ilustrações de scripts/ilustracoes.js em PNG usando o Chromium.
 *
 *   node scripts/gerar-ilustracoes.mjs            # tudo
 *   node scripts/gerar-ilustracoes.mjs pratos     # só os pratos
 *   node scripts/gerar-ilustracoes.mjs cenas      # só as cenas de ambiente
 *
 * Saída (WebP: estas ilustrações são gradientes suaves, onde o PNG fica ~10x
 * maior sem ganho visual nenhum):
 *   assets/img/pratos/<chave>.webp   400×400
 *   assets/img/cenas/<chave>.webp   1000×750
 *   assets/img/imagens.json          catálogo com os textos alternativos
 */
import { chromium } from 'playwright';
import { mkdir, writeFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LIB = path.join(ROOT, 'scripts', 'ilustracoes.js');
const IMG = path.join(ROOT, 'assets', 'img');

const TAM_PRATO = 400;
const CENA_W = 1000;
const CENA_H = 750;
const QUALIDADE = 0.82;

const alvo = process.argv[2];
const fazerPratos = !alvo || alvo === 'pratos';
const fazerCenas = !alvo || alvo === 'cenas';

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
const page = await browser.newPage({ viewport: { width: CENA_W, height: CENA_H } });
await page.setContent('<!doctype html><html><body style="margin:0"></body></html>');
await page.addScriptTag({ path: LIB });

const catalogo = { pratos: {}, cenas: {} };

async function render(tipo, chave, w, h, destino) {
  const { alt, dataUrl } = await page.evaluate(
    ([tipo, chave, w, h, q]) => {
      const cv = document.createElement('canvas');
      cv.width = w;
      cv.height = h;
      document.body.replaceChildren(cv);
      const alt =
        tipo === 'prato'
          ? window.Ilustracoes.desenharPrato(cv, chave)
          : window.Ilustracoes.desenharCena(cv, chave);
      return { alt, dataUrl: cv.toDataURL('image/webp', q) };
    },
    [tipo, chave, w, h, QUALIDADE],
  );

  if (!dataUrl.startsWith('data:image/webp')) {
    throw new Error('este Chromium não codificou WebP — verifique a versão do navegador');
  }
  await writeFile(destino, Buffer.from(dataUrl.split(',')[1], 'base64'));
  return alt;
}

if (fazerPratos) {
  await mkdir(path.join(IMG, 'pratos'), { recursive: true });
  const chaves = await page.evaluate(() => Object.keys(window.Ilustracoes.pratos));
  for (const chave of chaves) {
    const destino = path.join(IMG, 'pratos', `${chave}.webp`);
    catalogo.pratos[chave] = await render('prato', chave, TAM_PRATO, TAM_PRATO, destino);
    console.log(`✓ pratos/${chave}.webp`);
  }
}

if (fazerCenas) {
  await mkdir(path.join(IMG, 'cenas'), { recursive: true });
  const chaves = await page.evaluate(() => Object.keys(window.Ilustracoes.cenas));
  for (const chave of chaves) {
    const destino = path.join(IMG, 'cenas', `${chave}.webp`);
    catalogo.cenas[chave] = await render('cena', chave, CENA_W, CENA_H, destino);
    console.log(`✓ cenas/${chave}.webp`);
  }
}

await writeFile(path.join(IMG, 'imagens.json'), JSON.stringify(catalogo, null, 2) + '\n');
await browser.close();

const n = Object.keys(catalogo.pratos).length + Object.keys(catalogo.cenas).length;
console.log(`\n${n} ilustrações geradas em assets/img/`);

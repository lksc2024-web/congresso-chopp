#!/usr/bin/env node
/**
 * gerar-preview.mjs
 * Monta uma versão de arquivo único do site (CSS, JS e imagens embutidos)
 * para publicar como preview compartilhável.
 *
 * O conteúdo é sempre lido de index.html / styles.css / app.js, então o
 * preview nunca sai do ar em relação ao site de verdade — basta rodar de novo.
 *
 * Uso: node scripts/gerar-preview.mjs [destino.html]
 */
import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.resolve(process.argv[2] || path.join(ROOT, 'preview-artifact.html'));

const read = (p) => readFile(path.join(ROOT, p), 'utf8');

const [html, css, js] = await Promise.all([
  read('index.html'),
  read('assets/css/styles.css'),
  read('assets/js/app.js'),
]);

/** Toda imagem sob assets/img vira data URI, para o arquivo ficar autocontido. */
const imagens = {};
async function coletar(relativo) {
  const dir = path.join(ROOT, relativo);
  for (const entrada of await readdir(dir, { withFileTypes: true })) {
    const rel = `${relativo}/${entrada.name}`;
    if (entrada.isDirectory()) {
      await coletar(rel);
    } else if (entrada.name.endsWith('.webp')) {
      imagens[rel] = 'data:image/webp;base64,' + (await readFile(path.join(ROOT, rel))).toString('base64');
    }
  }
}
await coletar('assets/img');

// 1. Fica só com o miolo do <body>, já que a plataforma de publicação injeta
//    o próprio esqueleto de documento.
const corpo = html.slice(html.indexOf('<body>') + '<body>'.length, html.lastIndexOf('</body>'));

let out = corpo
  // 2. Imagens viram data URI.
  .replace(/src="(assets\/img\/[^"]+\.webp)"/g, (m, p1) => `src="${imagens[p1] ?? p1}"`)
  // 3. O iframe do Google Maps é bloqueado pela CSP da plataforma de preview;
  //    sem data-src a fachada continua sendo apenas um link para o Maps.
  .replace(/\n\s*data-src="[^"]*"/, '')
  // 4. Troca a tag do script externo pelo código embutido.
  .replace(/<script src="assets\/js\/app\.js" defer><\/script>/, `<script>\n${js}\n</script>`);

const titulo = 'Congresso do Chopp — Rodízio de Pizza em Campo Grande, RJ';

await writeFile(
  OUT,
  `<title>${titulo}</title>\n<style>\n${css}\n</style>\n${out}\n`,
  'utf8',
);

console.log(`✓ preview gerado: ${path.relative(ROOT, OUT)} (${(out.length / 1024).toFixed(0)} KB)`);

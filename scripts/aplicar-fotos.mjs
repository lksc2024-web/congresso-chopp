#!/usr/bin/env node
/**
 * aplicar-fotos.mjs
 * Troca no index.html as ilustrações pelas fotos reais que existirem em
 * assets/img/fotos/, ajustando src, alt e dimensões.
 *
 *   node scripts/aplicar-fotos.mjs          # aplica
 *   node scripts/aplicar-fotos.mjs --check  # só relata, sem gravar
 *
 * É idempotente: rodar de novo não muda nada. Quando o restaurante mandar mais
 * fotos, basta acrescentá-las em preparar-fotos.mjs, rodar os dois scripts e o
 * item deixa de usar a ilustração automaticamente.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HTML = path.join(ROOT, 'index.html');
const FOTOS = path.join(ROOT, 'assets', 'img', 'fotos');
const CATALOGO = path.join(FOTOS, 'fotos.json');
const apenasChecar = process.argv.includes('--check');

if (!existsSync(CATALOGO)) {
  console.error('Nenhum catálogo de fotos. Rode scripts/preparar-fotos.mjs antes.');
  process.exit(1);
}

const catalogo = JSON.parse(await readFile(CATALOGO, 'utf8'));
let html = await readFile(HTML, 'utf8');

const escapar = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

let trocadas = 0;
const restantes = [];

// Casa tanto a ilustração quanto a foto já aplicada, para ser idempotente.
// O `src` não é necessariamente o primeiro atributo: quem já foi marcado
// carrega `data-ilustracao` antes dele, e ignorar esse caso prenderia a
// imagem como ilustração para sempre.
const padrao =
  /<img\s+([^>]*?)src="assets\/img\/(?:fotos\/)?(pratos|cenas)\/([a-z0-9-]+)\.webp"([^>]*?)>/g;

const partes = [];
let ultimo = 0;
for (const m of html.matchAll(padrao)) {
  const [tudo, antes, pasta, nome, depois] = m;
  const resto = antes + depois;
  const chave = `${pasta}/${nome}`;
  partes.push(html.slice(ultimo, m.index));
  ultimo = m.index + tudo.length;

  // Sem foto: continua na ilustração e recebe a marca que o CSS exibe no
  // canto da imagem, para ninguém confundir desenho com o prato servido.
  if (!catalogo[chave] || !existsSync(path.join(FOTOS, chave + '.webp'))) {
    restantes.push(chave);
    partes.push(
      resto.includes('data-ilustracao') ? tudo : tudo.replace('<img ', '<img data-ilustracao '),
    );
    continue;
  }

  const { width, height } = await sharp(path.join(FOTOS, chave + '.webp')).metadata();
  const atributos = (' ' + resto)
    .replace(/\s+width="\d+"/, '')
    .replace(/\s+height="\d+"/, '')
    .replace(/\s+alt="[^"]*"/, '')
    .replace(/\s*data-ilustracao/, '')
    .replace(/\s+/g, ' ')
    .trimEnd();

  partes.push(
    `<img src="assets/img/fotos/${chave}.webp" width="${width}" height="${height}"${atributos}\n` +
      `               alt="${escapar(catalogo[chave])}">`,
  );
  trocadas++;
}
partes.push(html.slice(ultimo));
html = partes.join('');

if (!apenasChecar) await writeFile(HTML, html);

console.log(`${trocadas} imagens usando foto real.`);
if (restantes.length) {
  console.log(`${restantes.length} ainda em ilustração: ${restantes.join(', ')}`);
}
if (apenasChecar) console.log('(--check: nada gravado)');

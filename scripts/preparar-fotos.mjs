#!/usr/bin/env node
/**
 * preparar-fotos.mjs
 * Recorta, redimensiona e converte para WebP as fotos reais do restaurante.
 *
 *   node scripts/preparar-fotos.mjs <pasta-de-origem>
 *
 * A pasta de origem contém as capturas enviadas pelo restaurante. As fotos
 * finais vão para assets/img/fotos/ e são versionadas no repositório — o
 * material bruto não é, porque é grande e não precisa estar no Git.
 *
 * Critérios aplicados na seleção (ver README):
 *  - nada com rosto de cliente identificável;
 *  - nada com marca d'água, sobreposição de rede social ou contador de views;
 *  - quando a foto não presta, o item continua com a ilustração.
 */
import sharp from 'sharp';
import { mkdir, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ORIGEM = process.argv[2];
const CELULAS = process.argv[3];
const OUT = path.join(ROOT, 'assets', 'img', 'fotos');

if (!ORIGEM || !existsSync(ORIGEM)) {
  console.error('Informe a pasta com as capturas originais.');
  process.exit(1);
}

/** Fotos recortadas direto das capturas cheias (tela inteira do celular). */
const DAS_CAPTURAS = [
  {
    destino: 'cenas/salao-principal',
    arquivo: 'aab8d51a-1000477800.jpg',
    // corta o rodapé, onde ficam o mascote do site de avaliação e os botões
    extrair: { left: 90, top: 300, width: 1045, height: 1330 },
    largura: 1200,
    altura: 900,
    alt: 'Salão do Congresso do Chopp com mesas de madeira postas com pratos brancos, cadeiras pretas de assento claro, colunas de tijolinho e luminárias pendentes.',
  },
  {
    destino: 'pratos/drinks-e-coqueteis',
    arquivo: '115456be-1000477815.jpg',
    // enquadra só as taças na bancada de granito
    extrair: { left: 64, top: 420, width: 1092, height: 1092 },
    largura: 700,
    altura: 700,
    alt: 'Três coquetéis do bar do Congresso do Chopp em taças com sombrinha de papel, sobre a bancada de granito.',
  },
];

/**
 * Imagens de catálogo entregues em montagem (várias num arquivo só).
 * Recortes por caixa fixa, medida a partir das divisórias da montagem.
 * Nas bebidas a legenda vem queimada na base da célula, e o recorte quadrado
 * a descarta — o site já mostra esse texto em HTML, e duplicar quebraria o
 * responsivo e a leitura por leitor de tela.
 */
const DAS_MONTAGENS = [
  { destino: 'pratos/refrigerante', arquivo: 'dcab275b-1000477928.png',
    extrair: { left: 43, top: 0, width: 419, height: 419 }, lado: 620,
    alt: 'Copo de refrigerante com gelo, servido no copo da casa com o logo do Congresso do Chopp.' },
  { destino: 'pratos/agua', arquivo: 'dcab275b-1000477928.png',
    extrair: { left: 558, top: 0, width: 419, height: 419 }, lado: 620,
    alt: 'Copo de água gelada com rodela de limão, no copo da casa com o logo do Congresso do Chopp.' },
  { destino: 'pratos/chopp-e-cervejas', arquivo: 'dcab275b-1000477928.png',
    extrair: { left: 1072, top: 0, width: 419, height: 419 }, lado: 620,
    alt: 'Caneca de chopp gelado com colarinho de espuma, na caneca da casa com o logo do Congresso do Chopp.' },
  { destino: 'cenas/area-kids', arquivo: 'dcab275b-1000477928.png',
    extrair: { left: 330, top: 548, width: 635, height: 476 }, largura: 1200, altura: 900,
    alt: 'Área kids do Congresso do Chopp, com brinquedão, piscina de bolinhas, escorregador e mesinhas coloridas.' },

  { destino: 'pratos/batata-frita', arquivo: '1eb87f52-1000477926.png',
    extrair: { left: 388, top: 2, width: 330, height: 330 }, lado: 620,
    alt: 'Porção de batata frita dourada servida no prato.' },
  { destino: 'pratos/batata-queijo-bacon', arquivo: '1eb87f52-1000477926.png',
    extrair: { left: 772, top: 2, width: 330, height: 330 }, lado: 620,
    alt: 'Batata frita coberta com queijo derretido e bacon.' },
  { destino: 'pratos/frutos-do-mar', arquivo: '1eb87f52-1000477926.png',
    extrair: { left: 1153, top: 345, width: 330, height: 330 }, lado: 620,
    alt: 'Travessa de frutos do mar com camarões, mexilhões e limão.' },
  { destino: 'pratos/caldos-e-sopas', arquivo: '1eb87f52-1000477926.png',
    extrair: { left: 24, top: 685, width: 330, height: 330 }, lado: 620,
    alt: 'Tigela de caldo quente finalizado com cebolinha.' },
];

/**
 * Fotos vindas do grid do Instagram. Recortadas do arquivo original em
 * resolução cheia (não da célula já fatiada), usando a geometria do grid
 * medida em grid.json.
 *
 *   celula   — <prefixo do arquivo>_<linha><coluna>
 *   dy       — ajuste fino vertical, em pixels, quando a célula sangra a vizinha
 *   cortaTopo— fração do topo a descartar; remove o selo ▶ de vídeo do Instagram
 */
const DAS_CELULAS = {
  'pratos/pizzas-salgadas': { celula: '24063bc7_000', cortaTopo: 0.2,
    alt: 'Pizza portuguesa servida na tábua de madeira, com ovo, tomate, cebola e azeitona.' },
  'pratos/bordas-recheadas': { celula: '9f2064e6_031',
    alt: 'Pizza da casa com cobertura farta e borda alta.' },
  'pratos/pizzas-doces': { celula: 'b7e8e57d_021', cortaBaixo: 0.07, dy: -18,
    alt: 'Pizza doce coberta com creme, paçoca e morangos fatiados.' },
  'pratos/massas': { celula: '24063bc7_022', cortaBaixo: 0.22,
    alt: 'Massa ao molho servida no buffet do Congresso do Chopp.' },
  'pratos/frango-a-passarinho': { celula: '24063bc7_001',
    alt: 'Porção de frango a passarinho dourado.' },
  'pratos/churrasco-no-espeto': { celula: 'a002b507_030',
    alt: 'Espeto de churrasco servido no salão do Congresso do Chopp.' },
  'pratos/carnes': { celula: 'b7e8e57d_030',
    alt: 'Peça de carne assada, pronta para ser fatiada.' },
  'pratos/comida-japonesa': { celula: 'a002b507_000', cortaTopo: 0.18,
    alt: 'Travessa de sushi com fileiras de hossomaki, servida no buffet.' },
  'pratos/saladas-e-acompanhamentos': { celula: '9f2064e6_022', cortaBaixo: 0.06,
    alt: 'Salada de maionese com frutas, servida no buffet.' },
  'pratos/sobremesas': { celula: 'b7e8e57d_020', cortaBaixo: 0.15,
    alt: 'Pudim de leite condensado com calda de caramelo.' },
  'cenas/buffet-completo': { celula: '43f2be6a_041',
    alt: 'Balcão de buffet do Congresso do Chopp com as cubas cheias.' },
  'cenas/eventos': { celula: 'f047eccf_022', cortaBaixo: 0.06,
    alt: 'Mesa de bolo decorada para casamento no salão de eventos do Congresso do Chopp.' },
};

await mkdir(path.join(OUT, 'pratos'), { recursive: true });
await mkdir(path.join(OUT, 'cenas'), { recursive: true });

const catalogo = {};

for (const item of DAS_CAPTURAS) {
  let src = path.join(ORIGEM, item.arquivo);
  if (item.substituto && existsSync(path.join(ORIGEM, item.substituto))) {
    src = path.join(ORIGEM, item.substituto);
  }
  if (!existsSync(src)) {
    console.warn('· pulado (origem ausente):', item.destino);
    continue;
  }
  const destino = path.join(OUT, item.destino + '.webp');
  await sharp(src)
    .extract(item.extrair)
    .resize(item.largura, item.altura, { fit: 'cover', position: 'centre' })
    .webp({ quality: 82 })
    .toFile(destino);
  catalogo[item.destino] = item.alt;
  console.log('✓', item.destino + '.webp');
}

for (const item of DAS_MONTAGENS) {
  const src = path.join(ORIGEM, item.arquivo);
  if (!existsSync(src)) {
    console.warn('· pulado (origem ausente):', item.destino);
    continue;
  }
  const largura = item.largura ?? item.lado;
  const altura = item.altura ?? item.lado;
  await sharp(src)
    .extract(item.extrair)
    .resize(largura, altura, { fit: 'cover', position: 'centre' })
    .webp({ quality: 84 })
    .toFile(path.join(OUT, item.destino + '.webp'));
  catalogo[item.destino] = item.alt;
  console.log('✓', item.destino + '.webp');
}

const gridPath = CELULAS && path.join(CELULAS, 'grid.json');
if (gridPath && existsSync(gridPath)) {
  const grid = JSON.parse(await (await import('node:fs/promises')).readFile(gridPath, 'utf8'));

  for (const [destino, cfg] of Object.entries(DAS_CELULAS)) {
    const [prefixo, pos] = cfg.celula.split('_');
    const g = grid[prefixo];
    if (!g || !existsSync(path.join(ORIGEM, g.arquivo))) {
      console.warn('· pulado (origem ausente):', destino);
      continue;
    }
    const linha = Number(pos.slice(0, 2));
    const coluna = Number(pos.slice(2));

    const src = path.join(ORIGEM, g.arquivo);
    const { width: W, height: H } = await sharp(src).metadata();
    const larguraCel = W / 3;

    let left = Math.round(coluna * larguraCel) + 4;
    const topEstimado = Math.round(g.fase + linha * g.periodo) + (cfg.dy ?? 0);

    // A geometria global do grid erra alguns pixels e o resíduo aparece como
    // uma faixa do bloco vizinho. Aqui procuramos as divisórias reais — as
    // linhas mais escuras — dentro de uma janela em volta da estimativa.
    const margem = 90;
    const janelaTopo = Math.max(0, topEstimado - margem);
    const janelaAlt = Math.min(H - janelaTopo, Math.round(g.periodo) + margem * 2);
    const faixa = await sharp(src)
      .extract({ left, top: janelaTopo, width: Math.round(larguraCel) - 8, height: janelaAlt })
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const brilho = [];
    for (let y = 0; y < faixa.info.height; y++) {
      let s = 0;
      for (let x = 0; x < faixa.info.width; x += 3) s += faixa.data[y * faixa.info.width + x];
      brilho.push(s / Math.ceil(faixa.info.width / 3));
    }
    const maisEscura = (ini, fim) => {
      let melhorY = ini, melhorV = Infinity;
      for (let y = ini; y < fim; y++) if (brilho[y] < melhorV) { melhorV = brilho[y]; melhorY = y; }
      return melhorY;
    };
    const bordaSup = maisEscura(0, margem * 2);
    const bordaInf = maisEscura(faixa.info.height - margem * 2, faixa.info.height);

    let top = janelaTopo + bordaSup + 3;
    let lado = Math.min(bordaInf - bordaSup - 6, Math.round(larguraCel) - 8);
    if (lado < Math.round(larguraCel) * 0.7) lado = Math.round(larguraCel) - 8; // detecção falhou

    // Descarta a faixa superior (selo de vídeo, indicador de carrossel) ou
    // inferior (sangria do bloco vizinho), mantendo o recorte quadrado.
    if (cfg.cortaTopo) {
      const corte = Math.round(lado * cfg.cortaTopo);
      top += corte;
      lado -= corte;
      left += Math.round(corte / 2);
    }
    if (cfg.cortaBaixo) {
      const corte = Math.round(lado * cfg.cortaBaixo);
      lado -= corte;
      left += Math.round(corte / 2);
    }

    // Margem de segurança em todos os lados: a detecção acerta a divisória,
    // mas o JPEG do print deixa alguns pixels de transição na borda.
    const folga = Math.round(lado * 0.035);
    top += folga;
    left += folga;
    lado -= folga * 2;

    top = Math.max(0, Math.min(top, H - lado));
    left = Math.max(0, Math.min(left, W - lado));

    const cena = destino.startsWith('cenas/');
    await sharp(src)
      .extract({ left, top, width: lado, height: lado })
      .resize(cena ? 1200 : 620, cena ? 900 : 620, { fit: 'cover', position: 'centre' })
      .webp({ quality: 84 })
      .toFile(path.join(OUT, destino + '.webp'));
    catalogo[destino] = cfg.alt;
    console.log('✓', destino + '.webp');
  }
}

const { writeFile } = await import('node:fs/promises');
await writeFile(path.join(OUT, 'fotos.json'), JSON.stringify(catalogo, null, 2) + '\n');
console.log(`\n${Object.keys(catalogo).length} fotos preparadas em assets/img/fotos/`);

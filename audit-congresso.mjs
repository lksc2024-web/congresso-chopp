#!/usr/bin/env node
/**
 * audit-congresso.mjs
 * ---------------------------------------------------------------------------
 * Auditoria automatizada (Playwright) do site do Congresso do Chopp.
 *
 * Verifica SEO, acessibilidade, performance, responsividade, segurança de
 * links, erros de console/rede e a presença dos dados de negócio (endereço,
 * telefone, WhatsApp, horários).
 *
 * Uso:
 *   node audit-congresso.mjs                        # audita a URL padrão
 *   node audit-congresso.mjs <url>                  # audita uma URL qualquer
 *   node audit-congresso.mjs <url> --out relatorio  # diretório de saída
 *   node audit-congresso.mjs <url> --no-screenshots
 *   node audit-congresso.mjs <url> --strict         # exit 1 se houver erro
 *
 * Saídas: <out>/audit.json, <out>/audit.md e <out>/screenshots/*.png
 *
 * Requer: npm i -D playwright  (o binário do Chromium é resolvido
 * automaticamente, inclusive em imagens com PLAYWRIGHT_BROWSERS_PATH).
 */

import { chromium } from 'playwright';
import { mkdir, writeFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

// ---------------------------------------------------------------------------
// Configuração
// ---------------------------------------------------------------------------

const DEFAULT_URL = 'https://congresso-chopp.preview.emergentagent.com/#experiencia';

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844, isMobile: true },
  { name: 'tablet', width: 768, height: 1024, isMobile: false },
  { name: 'desktop', width: 1440, height: 900, isMobile: false },
];

/** Dados de negócio que precisam aparecer no site. */
const BUSINESS_FACTS = [
  { key: 'whatsapp', label: 'WhatsApp (21) 98489-9170', re: /98489[\s.-]?9170/ },
  { key: 'ddd', label: 'DDD 21', re: /\(?21\)?/ },
  { key: 'endereco', label: 'Endereço (Estrada do Monteiro)', re: /estrada\s+do\s+monteiro/i },
  { key: 'bairro', label: 'Bairro (Campo Grande)', re: /campo\s+grande/i },
  { key: 'rodizio', label: 'Rodízio', re: /rod[íi]zio/i },
  { key: 'horario', label: 'Horário de funcionamento', re: /\d{1,2}\s*h(\s*[àa]s|\s*-|\s*às)?\s*\d{1,2}\s*h|hor[áa]rio/i },
];

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith('--')));
const positional = args.filter((a) => !a.startsWith('--'));
const outIdx = args.indexOf('--out');
const TARGET_URL = positional[0] || DEFAULT_URL;
const OUT_DIR = path.resolve(outIdx !== -1 && args[outIdx + 1] ? args[outIdx + 1] : 'audit-report');
const SHOTS = !flags.has('--no-screenshots');
const STRICT = flags.has('--strict');

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

const findings = [];
/** @param {'error'|'warn'|'info'} level */
const add = (level, area, message, detail) =>
  findings.push({ level, area, message, ...(detail !== undefined ? { detail } : {}) });

const ok = (area, message, detail) => add('info', area, message, detail);
const warn = (area, message, detail) => add('warn', area, message, detail);
const err = (area, message, detail) => add('error', area, message, detail);

/**
 * Resolve o executável do Chromium. Playwright às vezes procura uma build
 * diferente da que existe na imagem; caímos para o symlink/glob quando isso
 * acontece, em vez de tentar baixar um browser novo.
 */
async function resolveExecutablePath() {
  if (process.env.PW_CHROMIUM_PATH) return process.env.PW_CHROMIUM_PATH;
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (!root || !existsSync(root)) return undefined;

  const symlink = path.join(root, 'chromium');
  if (existsSync(symlink)) return symlink;

  try {
    const dirs = (await readdir(root)).filter((d) => d.startsWith('chromium-'));
    for (const d of dirs.sort().reverse()) {
      const bin = path.join(root, d, 'chrome-linux', 'chrome');
      if (existsSync(bin)) return bin;
    }
  } catch {
    /* ignore */
  }
  return undefined;
}

async function launch() {
  const executablePath = await resolveExecutablePath();
  try {
    return await chromium.launch({ executablePath, args: ['--no-sandbox'] });
  } catch (e) {
    if (!executablePath) throw e;
    // Última tentativa: deixar o Playwright resolver sozinho.
    return chromium.launch({ args: ['--no-sandbox'] });
  }
}

/** Rola a página do topo ao fim e volta, em passos de um viewport. */
async function autoScroll(page) {
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.8;
    const max = document.body.scrollHeight;
    for (let y = 0; y < max; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 200));
  });
}

// ---------------------------------------------------------------------------
// Coletores dentro da página
// ---------------------------------------------------------------------------

/** Extrai head/SEO, headings, imagens, links, formulários e landmarks. */
function collectDom() {
  const text = (el) => (el.textContent || '').replace(/\s+/g, ' ').trim();
  const attr = (sel, name) => document.querySelector(sel)?.getAttribute(name) ?? null;

  const metas = {};
  for (const m of document.querySelectorAll('meta[name], meta[property]')) {
    const k = m.getAttribute('name') || m.getAttribute('property');
    if (k) metas[k.toLowerCase()] = m.getAttribute('content');
  }

  const jsonLd = [];
  for (const s of document.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      jsonLd.push(JSON.parse(s.textContent || 'null'));
    } catch (e) {
      jsonLd.push({ __parseError: String(e && e.message) });
    }
  }

  const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((h) => ({
    level: Number(h.tagName[1]),
    text: text(h).slice(0, 120),
  }));

  const images = [...document.querySelectorAll('img')].map((img) => {
    const r = img.getBoundingClientRect();
    return {
      src: (img.currentSrc || img.src || '').slice(0, 200),
      alt: img.getAttribute('alt'),
      hasDimensions: Boolean(img.getAttribute('width') && img.getAttribute('height')),
      loading: img.getAttribute('loading'),
      natural: { w: img.naturalWidth, h: img.naturalHeight },
      displayed: { w: Math.round(r.width), h: Math.round(r.height) },
      // "Acima da dobra" no carregamento inicial — somamos o scroll atual
      // porque auditar uma âncora (#experiencia) já rola a página.
      aboveFold: r.top + window.scrollY < window.innerHeight,
      broken: img.complete && img.naturalWidth === 0,
    };
  });

  const links = [...document.querySelectorAll('a')].map((a) => ({
    href: a.getAttribute('href'),
    resolved: a.href,
    text: text(a).slice(0, 80),
    hasAccessibleName: Boolean(
      text(a) || a.getAttribute('aria-label') || a.querySelector('img[alt]:not([alt=""])'),
    ),
    target: a.getAttribute('target'),
    rel: a.getAttribute('rel'),
  }));

  const controls = [...document.querySelectorAll('button,[role="button"],input,select,textarea')].map(
    (el) => {
      const id = el.getAttribute('id');
      const labelled =
        Boolean(el.getAttribute('aria-label')) ||
        Boolean(el.getAttribute('aria-labelledby')) ||
        Boolean(el.getAttribute('title')) ||
        Boolean(text(el)) ||
        Boolean(id && document.querySelector(`label[for="${CSS.escape(id)}"]`)) ||
        Boolean(el.closest('label')) ||
        (el.tagName === 'INPUT' && ['hidden', 'submit', 'button'].includes(el.type));
      return { tag: el.tagName.toLowerCase(), type: el.getAttribute('type'), labelled };
    },
  );

  const landmarks = {
    header: !!document.querySelector('header, [role="banner"]'),
    nav: !!document.querySelector('nav, [role="navigation"]'),
    main: !!document.querySelector('main, [role="main"]'),
    footer: !!document.querySelector('footer, [role="contentinfo"]'),
    skipLink: !!document.querySelector('a[href^="#"][class*="skip"], a[href^="#"][class*="pular"]'),
  };

  const nav = performance.getEntriesByType('navigation')[0] || {};
  const paints = Object.fromEntries(
    performance.getEntriesByType('paint').map((p) => [p.name, Math.round(p.startTime)]),
  );

  return {
    url: location.href,
    lang: document.documentElement.getAttribute('lang'),
    charset: document.characterSet,
    title: document.title,
    metas,
    canonical: attr('link[rel="canonical"]', 'href'),
    favicon: attr('link[rel~="icon"]', 'href'),
    manifest: attr('link[rel="manifest"]', 'href'),
    jsonLd,
    headings,
    images,
    links,
    controls,
    landmarks,
    bodyText: (document.body.innerText || '').replace(/\s+/g, ' ').slice(0, 200000),
    domNodes: document.getElementsByTagName('*').length,
    inlineStyleAttrs: document.querySelectorAll('[style]').length,
    timing: {
      ttfbMs: Math.round((nav.responseStart || 0) - (nav.requestStart || 0)),
      domContentLoadedMs: Math.round(nav.domContentLoadedEventEnd || 0),
      loadMs: Math.round(nav.loadEventEnd || 0),
      transferBytes: nav.transferSize || 0,
      ...paints,
    },
  };
}

/** Overflow horizontal + alvos de toque pequenos (rodado por viewport). */
function collectViewportIssues() {
  const docW = document.documentElement.clientWidth;
  const overflowing = [];
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    if (r.right > docW + 2 || r.left < -2) {
      const cs = getComputedStyle(el);
      if (cs.position === 'fixed' || cs.visibility === 'hidden' || cs.display === 'none') continue;
      overflowing.push({
        tag: el.tagName.toLowerCase(),
        cls: (el.className && String(el.className).slice(0, 60)) || '',
        right: Math.round(r.right),
      });
    }
    if (overflowing.length > 15) break;
  }

  const smallTargets = [];
  for (const el of document.querySelectorAll('a[href], button, [role="button"], input, select')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (getComputedStyle(el).display === 'inline' && el.closest('p, li')) continue; // link em texto corrido
    if (r.width < 44 || r.height < 44) {
      smallTargets.push({
        tag: el.tagName.toLowerCase(),
        text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40),
        size: `${Math.round(r.width)}x${Math.round(r.height)}`,
      });
    }
    if (smallTargets.length > 15) break;
  }

  return {
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: docW,
    hasHorizontalScroll: document.documentElement.scrollWidth > docW + 2,
    overflowing,
    smallTargets,
  };
}

/** Contraste aproximado de texto (WCAG AA) sobre o fundo pintado mais próximo. */
function collectContrast() {
  const parse = (c) => {
    const m = c.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const [r, g, b, a = 1] = m[1].split(',').map((n) => parseFloat(n));
    return { r, g, b, a };
  };
  const lum = ({ r, g, b }) => {
    const f = (v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const ratio = (a, b) => {
    const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
    return (l1 + 0.05) / (l2 + 0.05);
  };
  /**
   * Fundo pintado mais próximo. Retorna null quando encontramos um gradiente
   * ou imagem antes de uma cor sólida — nesse caso o contraste real não pode
   * ser deduzido do CSS computado e o texto é ignorado em vez de virar um
   * falso positivo.
   */
  const bgOf = (el) => {
    let n = el;
    while (n && n !== document.documentElement) {
      const cs = getComputedStyle(n);
      if (cs.backgroundImage && cs.backgroundImage !== 'none') return null;
      const c = parse(cs.backgroundColor);
      if (c && c.a > 0.5) return c;
      n = n.parentElement;
    }
    return { r: 255, g: 255, b: 255, a: 1 };
  };

  const issues = [];
  const nodes = document.querySelectorAll('p,li,a,span,h1,h2,h3,h4,h5,h6,button,label,small,td,th');
  for (const el of nodes) {
    const t = (el.textContent || '').trim();
    if (!t || el.children.length > 0) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) < 0.1) continue;
    const fg = parse(cs.color);
    if (!fg) continue;
    const bg = bgOf(el);
    if (!bg) continue; // fundo não determinável (gradiente/imagem)
    const size = parseFloat(cs.fontSize);
    const bold = Number(cs.fontWeight) >= 700;
    const large = size >= 24 || (size >= 18.66 && bold);
    const cr = ratio(fg, bg);
    const min = large ? 3 : 4.5;
    if (cr < min) {
      issues.push({
        text: t.slice(0, 50),
        ratio: Math.round(cr * 100) / 100,
        required: min,
        color: cs.color,
        fontSize: cs.fontSize,
      });
    }
    if (issues.length > 20) break;
  }
  return issues;
}

// ---------------------------------------------------------------------------
// Análise dos dados coletados
// ---------------------------------------------------------------------------

function auditResponse(response, redirects) {
  if (!response) {
    err('rede', 'A página não retornou resposta HTTP.');
    return;
  }
  const status = response.status();
  if (status >= 400) err('rede', `HTTP ${status} na URL principal.`);
  else ok('rede', `HTTP ${status} na URL principal.`);

  if (redirects.length) warn('rede', `${redirects.length} redirecionamento(s) antes do HTML final.`, redirects);

  const h = response.headers();
  const secHeaders = {
    'strict-transport-security': 'HSTS',
    'content-security-policy': 'CSP',
    'x-content-type-options': 'X-Content-Type-Options',
    'referrer-policy': 'Referrer-Policy',
  };
  const missing = Object.entries(secHeaders)
    .filter(([k]) => !h[k])
    .map(([, label]) => label);
  if (missing.length) warn('segurança', `Cabeçalhos ausentes: ${missing.join(', ')}.`);
  else ok('segurança', 'Cabeçalhos de segurança principais presentes.');

  if (!/gzip|br|zstd/.test(h['content-encoding'] || ''))
    warn('performance', 'HTML servido sem compressão (gzip/brotli).');
  if (!h['cache-control']) warn('performance', 'Sem Cache-Control no documento principal.');
}

function auditSeo(d) {
  if (!d.lang) err('seo', 'Falta o atributo lang em <html> (impacta SEO e leitores de tela).');
  else if (!/^pt/i.test(d.lang)) warn('seo', `lang="${d.lang}" — o conteúdo é PT-BR.`);
  else ok('seo', `lang="${d.lang}".`);

  const t = d.title || '';
  if (!t) err('seo', 'Sem <title>.');
  else if (t.length < 15 || t.length > 65)
    warn('seo', `<title> com ${t.length} caracteres (ideal 15–65).`, t);
  else ok('seo', `<title> com ${t.length} caracteres.`, t);

  const desc = d.metas['description'] || '';
  if (!desc) err('seo', 'Sem meta description.');
  else if (desc.length < 70 || desc.length > 165)
    warn('seo', `meta description com ${desc.length} caracteres (ideal 70–165).`);
  else ok('seo', `meta description com ${desc.length} caracteres.`);

  if (!d.metas['viewport']) err('seo', 'Sem meta viewport — o site não será responsivo no celular.');
  else ok('seo', 'meta viewport presente.');

  if (!d.canonical) warn('seo', 'Sem link rel="canonical".');
  else ok('seo', `canonical: ${d.canonical}`);

  const og = ['og:title', 'og:description', 'og:image', 'og:url', 'og:type'].filter((k) => !d.metas[k]);
  if (og.length) warn('seo', `Open Graph incompleto (falta ${og.join(', ')}) — links feios no WhatsApp.`);
  else ok('seo', 'Open Graph completo.');

  if (!d.metas['twitter:card']) warn('seo', 'Sem twitter:card.');
  if (!d.favicon) warn('seo', 'Sem favicon.');
  if (!d.metas['theme-color']) warn('seo', 'Sem theme-color (barra do navegador no mobile).');

  const types = d.jsonLd.flatMap((n) => {
    const arr = Array.isArray(n) ? n : [n];
    return arr.flatMap((x) => (x && x['@graph'] ? x['@graph'] : [x])).map((x) => x && x['@type']);
  });
  if (!d.jsonLd.length) err('seo', 'Sem JSON-LD — sem rich snippet de restaurante no Google.');
  else if (!types.some((x) => /Restaurant|LocalBusiness|FoodEstablishment/i.test(String(x))))
    warn('seo', `JSON-LD presente mas sem Restaurant/LocalBusiness (tipos: ${types.join(', ')}).`);
  else ok('seo', `JSON-LD: ${[...new Set(types.filter(Boolean))].join(', ')}.`);
}

function auditHeadings(d) {
  const h1 = d.headings.filter((h) => h.level === 1);
  if (h1.length === 0) err('a11y', 'Nenhum <h1> na página.');
  else if (h1.length > 1) warn('a11y', `${h1.length} elementos <h1> (ideal: 1).`, h1.map((h) => h.text));
  else ok('a11y', `Um <h1>: "${h1[0].text}".`);

  const skips = [];
  let prev = 0;
  for (const h of d.headings) {
    if (prev && h.level > prev + 1) skips.push(`h${prev} → h${h.level} ("${h.text}")`);
    prev = h.level;
  }
  if (skips.length) warn('a11y', `Níveis de heading pulados: ${skips.length}.`, skips);
  else if (d.headings.length) ok('a11y', 'Hierarquia de headings consistente.');
}

function auditImages(d) {
  if (!d.images.length) {
    warn('conteúdo', 'Nenhuma tag <img> — site sem fotos do restaurante converte menos.');
    return;
  }
  const noAlt = d.images.filter((i) => i.alt === null || i.alt.trim() === '');
  const noDim = d.images.filter((i) => !i.hasDimensions);
  const broken = d.images.filter((i) => i.broken);
  const lazyFold = d.images.filter((i) => i.aboveFold && i.loading === 'lazy');
  const eagerBelow = d.images.filter((i) => !i.aboveFold && i.loading !== 'lazy');
  const oversized = d.images.filter(
    (i) => i.displayed.w > 0 && i.natural.w > i.displayed.w * 2.5 && i.natural.w > 800,
  );

  if (broken.length) err('imagens', `${broken.length} imagem(ns) quebrada(s).`, broken.map((i) => i.src));
  if (noAlt.length) err('a11y', `${noAlt.length} de ${d.images.length} imagens sem alt.`, noAlt.map((i) => i.src));
  else ok('a11y', `Todas as ${d.images.length} imagens têm alt.`);
  if (noDim.length) warn('performance', `${noDim.length} imagens sem width/height (causa layout shift/CLS).`);
  if (lazyFold.length) warn('performance', `${lazyFold.length} imagens acima da dobra com loading="lazy" (atrasa o LCP).`);
  if (eagerBelow.length) warn('performance', `${eagerBelow.length} imagens abaixo da dobra sem loading="lazy".`);
  if (oversized.length)
    warn('performance', `${oversized.length} imagens servidas muito maiores que o exibido.`,
      oversized.map((i) => `${i.src} (${i.natural.w}px → ${i.displayed.w}px)`));
}

function auditLinks(d) {
  const empty = d.links.filter((l) => !l.hasAccessibleName);
  if (empty.length) err('a11y', `${empty.length} link(s) sem texto acessível.`, empty.map((l) => l.href));

  const unsafe = d.links.filter((l) => l.target === '_blank' && !/noopener/.test(l.rel || ''));
  if (unsafe.length) warn('segurança', `${unsafe.length} link(s) target="_blank" sem rel="noopener".`, unsafe.map((l) => l.href));

  // Só href absolutos em http:// são problema; links relativos herdam o
  // protocolo da página (e ficam http:// quando auditamos localhost).
  const insecure = d.links.filter((l) => /^http:\/\//i.test(l.href || ''));
  if (insecure.length) err('segurança', `${insecure.length} link(s) apontando para http:// .`, insecure.map((l) => l.href));

  const dead = d.links.filter((l) => !l.href || l.href === '#' || /^javascript:void/i.test(l.href));
  if (dead.length) warn('ux', `${dead.length} link(s) sem destino real (href="#").`);

  const wa = d.links.filter((l) => /wa\.me|api\.whatsapp|whatsapp:/i.test(l.resolved || ''));
  if (!wa.length) err('conversão', 'Nenhum link de WhatsApp — principal canal de reserva/pedido.');
  else {
    ok('conversão', `${wa.length} link(s) de WhatsApp.`, wa.map((l) => l.resolved));
    const right = wa.some((l) => /5521984899170/.test(l.resolved));
    if (!right) err('conversão', 'Links de WhatsApp não usam o número (21) 98489-9170 (wa.me/5521984899170).');
    else ok('conversão', 'WhatsApp aponta para 5521984899170.');
    const noMsg = wa.filter((l) => !/[?&]text=/.test(l.resolved));
    if (noMsg.length) warn('conversão', `${noMsg.length} link(s) de WhatsApp sem mensagem pré-preenchida (?text=).`);
  }

  if (!d.links.some((l) => /^tel:/i.test(l.href || ''))) warn('conversão', 'Sem link tel: para ligação direta.');
  if (!d.links.some((l) => /maps\.|google\.com\/maps|geo:/i.test(l.resolved || '')))
    warn('conversão', 'Sem link para o Google Maps / rota até o restaurante.');
}

function auditContent(d) {
  const text = d.bodyText;
  if (text.length < 400) err('conteúdo', `Só ${text.length} caracteres de texto visível — pouco para SEO.`);
  for (const f of BUSINESS_FACTS) {
    if (f.re.test(text)) ok('conteúdo', `${f.label}: presente.`);
    else warn('conteúdo', `${f.label}: não encontrado no texto da página.`);
  }
}

function auditA11yStructure(d) {
  const l = d.landmarks;
  const missing = Object.entries({ header: l.header, nav: l.nav, main: l.main, footer: l.footer })
    .filter(([, v]) => !v)
    .map(([k]) => `<${k}>`);
  if (missing.length) warn('a11y', `Landmarks ausentes: ${missing.join(', ')}.`);
  else ok('a11y', 'header, nav, main e footer presentes.');
  if (!l.skipLink) warn('a11y', 'Sem link "pular para o conteúdo".');

  const unlabeled = d.controls.filter((c) => !c.labelled);
  if (unlabeled.length) err('a11y', `${unlabeled.length} controle(s) sem nome acessível.`, unlabeled);
}

function auditPerformance(d) {
  const t = d.timing;
  if (t.ttfbMs > 800) warn('performance', `TTFB de ${t.ttfbMs}ms (ideal < 800ms).`);
  else ok('performance', `TTFB: ${t.ttfbMs}ms.`);

  const fcp = t['first-contentful-paint'];
  if (fcp != null) {
    if (fcp > 1800) warn('performance', `First Contentful Paint em ${fcp}ms (ideal < 1800ms).`);
    else ok('performance', `First Contentful Paint: ${fcp}ms.`);
  }
  if (t.loadMs > 4000) warn('performance', `Load completo em ${t.loadMs}ms.`);
  if (d.domNodes > 1500) warn('performance', `${d.domNodes} nós no DOM (ideal < 1500).`);
  if (d.inlineStyleAttrs > 60) warn('manutenção', `${d.inlineStyleAttrs} elementos com atributo style inline.`);
}

// ---------------------------------------------------------------------------
// Relatório
// ---------------------------------------------------------------------------

function score() {
  if (findings.some((f) => f.area === 'fatal')) return 0;
  const e = findings.filter((f) => f.level === 'error').length;
  const w = findings.filter((f) => f.level === 'warn').length;
  return Math.max(0, 100 - e * 8 - w * 2);
}

function toMarkdown(meta) {
  const byLevel = (lvl) => findings.filter((f) => f.level === lvl);
  const icon = { error: '🔴', warn: '🟡', info: '🟢' };
  const line = (f) => {
    const detail =
      f.detail === undefined
        ? ''
        : `\n  <details><summary>detalhe</summary>\n\n  \`\`\`\n  ${JSON.stringify(f.detail, null, 2)
            .split('\n')
            .join('\n  ')}\n  \`\`\`\n  </details>`;
    return `- ${icon[f.level]} **[${f.area}]** ${f.message}${detail}`;
  };

  return `# Auditoria — Congresso do Chopp

- **URL:** ${meta.url}
- **Data:** ${meta.finishedAt}
- **Navegador:** Chromium ${meta.browserVersion}
- **Nota:** **${meta.score}/100** — ${byLevel('error').length} erros, ${byLevel('warn').length} avisos, ${byLevel('info').length} checagens OK

## 🔴 Erros (${byLevel('error').length})

${byLevel('error').map(line).join('\n') || '_Nenhum._'}

## 🟡 Avisos (${byLevel('warn').length})

${byLevel('warn').map(line).join('\n') || '_Nenhum._'}

## 🟢 Checagens aprovadas (${byLevel('info').length})

${byLevel('info').map(line).join('\n') || '_Nenhuma._'}

## Responsividade

| Viewport | Largura | Scroll horizontal | Elementos vazando | Alvos de toque < 44px |
|---|---|---|---|---|
${meta.viewports
  .map(
    (v) =>
      `| ${v.name} | ${v.width}px | ${v.hasHorizontalScroll ? '❌ sim' : '✅ não'} | ${v.overflowing.length} | ${v.smallTargets.length} |`,
  )
  .join('\n')}

## Console e rede

- Erros de console: **${meta.console.errors.length}**
- Avisos de console: **${meta.console.warnings.length}**
- Requisições falhas: **${meta.failedRequests.length}**

${meta.console.errors.slice(0, 10).map((m) => `- 🔴 \`${m}\``).join('\n') || ''}
${meta.failedRequests.slice(0, 10).map((r) => `- 🔴 \`${r.status ?? r.failure} ${r.url}\``).join('\n') || ''}

## Métricas

| Métrica | Valor |
|---|---|
| TTFB | ${meta.timing.ttfbMs} ms |
| First Paint | ${meta.timing['first-paint'] ?? '—'} ms |
| First Contentful Paint | ${meta.timing['first-contentful-paint'] ?? '—'} ms |
| DOMContentLoaded | ${meta.timing.domContentLoadedMs} ms |
| Load | ${meta.timing.loadMs} ms |
| Nós no DOM | ${meta.domNodes} |
| Imagens | ${meta.imageCount} |
| Links | ${meta.linkCount} |
`;
}

// ---------------------------------------------------------------------------
// Execução
// ---------------------------------------------------------------------------

async function main() {
  console.log(`\n🔎 Auditando: ${TARGET_URL}\n`);
  await mkdir(OUT_DIR, { recursive: true });
  if (SHOTS) await mkdir(path.join(OUT_DIR, 'screenshots'), { recursive: true });

  const browser = await launch();
  const consoleMsgs = { errors: [], warnings: [] };
  const failedRequests = [];
  const redirects = [];
  let dom = null;
  let mainResponse = null;
  const viewportResults = [];

  try {
    for (const vp of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        isMobile: vp.isMobile,
        hasTouch: vp.isMobile,
        deviceScaleFactor: vp.isMobile ? 2 : 1,
        locale: 'pt-BR',
        timezoneId: 'America/Sao_Paulo',
        userAgent: vp.isMobile
          ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
          : undefined,
      });
      const page = await context.newPage();

      // Só instrumentamos console/rede uma vez, no primeiro viewport.
      if (vp === VIEWPORTS[0]) {
        page.on('console', (m) => {
          if (m.type() === 'error') consoleMsgs.errors.push(m.text().slice(0, 300));
          if (m.type() === 'warning') consoleMsgs.warnings.push(m.text().slice(0, 300));
        });
        page.on('pageerror', (e) => consoleMsgs.errors.push(`[pageerror] ${e.message}`.slice(0, 300)));
        page.on('requestfailed', (r) =>
          failedRequests.push({ url: r.url().slice(0, 200), failure: r.failure()?.errorText }),
        );
        page.on('response', (r) => {
          if (r.status() >= 400)
            failedRequests.push({ url: r.url().slice(0, 200), status: r.status() });
          if (r.status() >= 300 && r.status() < 400 && r.request().isNavigationRequest())
            redirects.push(`${r.status()} ${r.url().slice(0, 120)}`);
        });
      }

      const response = await page.goto(TARGET_URL, { waitUntil: 'load', timeout: 45000 });
      await page.waitForTimeout(1200);
      // Percorre a página inteira para disparar lazy-load e animações de
      // entrada; sem isso o screenshot de página inteira sai com buracos.
      await autoScroll(page);
      await page.waitForTimeout(900);

      if (vp === VIEWPORTS[0]) mainResponse = response;

      const issues = await page.evaluate(collectViewportIssues);
      viewportResults.push({ ...vp, ...issues });

      if (vp === VIEWPORTS[VIEWPORTS.length - 1]) {
        dom = await page.evaluate(collectDom);
        dom.contrastIssues = await page.evaluate(collectContrast);
      }

      if (SHOTS) {
        await page.screenshot({
          path: path.join(OUT_DIR, 'screenshots', `${vp.name}.png`),
          fullPage: true,
        });
      }
      await context.close();
    }

    // --- análises ---
    auditResponse(mainResponse, redirects);
    auditSeo(dom);
    auditHeadings(dom);
    auditImages(dom);
    auditLinks(dom);
    auditContent(dom);
    auditA11yStructure(dom);
    auditPerformance(dom);

    if (dom.contrastIssues.length)
      warn('a11y', `${dom.contrastIssues.length} trecho(s) de texto abaixo do contraste AA.`, dom.contrastIssues);
    else ok('a11y', 'Nenhum problema de contraste AA detectado.');

    for (const v of viewportResults) {
      if (v.hasHorizontalScroll)
        err('responsivo', `Scroll horizontal em ${v.name} (${v.width}px): ${v.scrollWidth}px > ${v.clientWidth}px.`, v.overflowing);
      else ok('responsivo', `Sem scroll horizontal em ${v.name} (${v.width}px).`);
      if (v.isMobile && v.smallTargets.length)
        warn('a11y', `${v.smallTargets.length} alvo(s) de toque menores que 44px em ${v.name}.`, v.smallTargets);
    }

    if (consoleMsgs.errors.length) err('console', `${consoleMsgs.errors.length} erro(s) no console.`, consoleMsgs.errors.slice(0, 10));
    else ok('console', 'Console sem erros.');
    if (consoleMsgs.warnings.length) warn('console', `${consoleMsgs.warnings.length} aviso(s) no console.`);
    if (failedRequests.length) err('rede', `${failedRequests.length} requisição(ões) falharam.`, failedRequests.slice(0, 10));
    else ok('rede', 'Nenhuma requisição falhou.');
  } catch (e) {
    err('fatal', `Falha ao auditar: ${e.message.split('\n')[0]}`);
  }

  const meta = {
    url: TARGET_URL,
    finishedAt: new Date().toISOString(),
    browserVersion: browser.version(),
    score: score(),
    viewports: viewportResults.length
      ? viewportResults
      : VIEWPORTS.map((v) => ({ ...v, hasHorizontalScroll: false, overflowing: [], smallTargets: [] })),
    console: consoleMsgs,
    failedRequests,
    timing: dom?.timing ?? { ttfbMs: 0, domContentLoadedMs: 0, loadMs: 0 },
    domNodes: dom?.domNodes ?? 0,
    imageCount: dom?.images.length ?? 0,
    linkCount: dom?.links.length ?? 0,
  };

  await browser.close();

  await writeFile(path.join(OUT_DIR, 'audit.json'), JSON.stringify({ meta, findings, dom }, null, 2));
  await writeFile(path.join(OUT_DIR, 'audit.md'), toMarkdown(meta));

  const errors = findings.filter((f) => f.level === 'error');
  const warns = findings.filter((f) => f.level === 'warn');
  console.log(`Nota: ${meta.score}/100`);
  console.log(`🔴 ${errors.length} erros | 🟡 ${warns.length} avisos | 🟢 ${findings.length - errors.length - warns.length} OK`);
  for (const f of errors) console.log(`  🔴 [${f.area}] ${f.message}`);
  for (const f of warns) console.log(`  🟡 [${f.area}] ${f.message}`);
  console.log(`\n📄 Relatório: ${path.join(OUT_DIR, 'audit.md')}\n`);

  if (findings.some((f) => f.area === 'fatal')) process.exitCode = 2;
  else if (STRICT && errors.length) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});

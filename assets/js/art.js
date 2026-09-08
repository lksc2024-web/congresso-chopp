/* ============================================================
   JOYCE BEAUTY — Arte vetorial dos produtos
   Toda a imagética da prévia é gerada em SVG: nada depende de
   CDN externo, nada quebra, e a linha inteira fica coerente.
   ============================================================ */
const Art = (() => {
  let n = 0;
  const u = () => 'jb' + (++n);
  const SANS = "Jost,-apple-system,Segoe UI,Helvetica,Arial,sans-serif";
  const SERIF = "Cormorant Garamond,Times New Roman,Georgia,serif";
  const BASE = 434;               // todas as silhuetas apoiam nesta linha
  const esc = s => String(s || '').replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));

  /* ---- gradiente cilíndrico (dá volume ao frasco) ---- */
  const cyl = (id, c) => `
    <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${c[2]}"/><stop offset=".10" stop-color="${c[1]}"/>
      <stop offset=".33" stop-color="${c[0]}"/><stop offset=".52" stop-color="${c[1]}"/>
      <stop offset=".86" stop-color="${c[2]}"/><stop offset="1" stop-color="${c[3] || c[2]}"/>
    </linearGradient>`;

  const goldGrad = id => `
    <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#8A6A3E"/><stop offset=".22" stop-color="#D9BF92"/>
      <stop offset=".45" stop-color="#F2E4C9"/><stop offset=".72" stop-color="#B48F5B"/>
      <stop offset="1" stop-color="#7E6036"/>
    </linearGradient>`;

  const darkGrad = id => `
    <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#15110F"/><stop offset=".3" stop-color="#403631"/>
      <stop offset=".5" stop-color="#57493F"/><stop offset=".8" stop-color="#241D19"/>
      <stop offset="1" stop-color="#100C0A"/>
    </linearGradient>`;

  /* ---- silhuetas (todas terminam em y = 434) ---- */
  const SHAPES = {
    bottle: {
      cap: `<rect x="170" y="62" width="60" height="54" rx="7"/>`,
      neck: `<rect x="180" y="110" width="40" height="32"/>`,
      body: `M132,216 C132,170 176,162 176,140 L224,140 C224,162 268,170 268,216 L268,416 A18,18 0 0 1 250,434 L150,434 A18,18 0 0 1 132,416 Z`,
      band: [246, 122], top: 150, w: 96
    },
    pump: {
      cap: `<rect x="150" y="46" width="60" height="18" rx="9"/><rect x="191" y="58" width="16" height="46"/><rect x="174" y="100" width="52" height="22" rx="5"/>`,
      neck: ``,
      body: `M132,216 C132,174 176,166 176,120 L224,120 C224,166 268,174 268,216 L268,416 A18,18 0 0 1 250,434 L150,434 A18,18 0 0 1 132,416 Z`,
      band: [248, 120], top: 150, w: 96
    },
    jar: {
      cap: `<rect x="114" y="176" width="172" height="54" rx="11"/>`,
      neck: ``,
      body: `M118,228 L282,228 L282,412 A22,22 0 0 1 260,434 L140,434 A22,22 0 0 1 118,412 Z`,
      band: [268, 116], top: 238, w: 116
    },
    tube: {
      cap: `<rect x="146" y="116" width="108" height="15" rx="3"/>`,
      foot: `<rect x="156" y="400" width="88" height="34" rx="9"/>`,
      neck: ``,
      body: `M148,130 L252,130 L264,386 A16,16 0 0 1 248,402 L152,402 A16,16 0 0 1 136,386 Z`,
      band: [224, 114], top: 148, w: 88
    }
  };

  /* posiciona uma silhueta com a base em (cx, by) */
  const place = (cx, by, k) => `translate(${cx},${by}) scale(${k}) translate(-200,${-BASE})`;

  /* ---- um frasco completo ---- */
  function vessel(spec, o = {}) {
    const s = SHAPES[spec.shape] || SHAPES.bottle;
    const gB = u(), gC = u(), gL = u(), cl = u(), gBand = u();
    const gold = spec.cap === 'gold', dark = spec.cap === 'dark';
    const capFill = gold || dark ? `url(#${gC})` : `url(#${gB})`;
    const capDef = gold ? goldGrad(gC) : dark ? darkGrad(gC) : '';

    return `
    <defs>
      ${cyl(gB, spec.body)}${capDef}
      <linearGradient id="${gL}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#fff" stop-opacity="0"/>
        <stop offset=".45" stop-color="#fff" stop-opacity=".55"/>
        <stop offset="1" stop-color="#fff" stop-opacity="0"/>
      </linearGradient>
      <clipPath id="${cl}"><path d="${s.body}"/></clipPath>
    </defs>
    <g>
      ${s.foot ? `<g fill="${gold ? `url(#${gC})` : `url(#${gB})`}">${s.foot}</g>` : ''}
      <g fill="${capFill}">${s.cap}</g>
      ${s.neck ? `<g fill="url(#${gB})">${s.neck}</g>` : ''}
      <path d="${s.body}" fill="url(#${gB})"/>
      <g clip-path="url(#${cl})">
        <rect x="150" y="${s.top - 24}" width="26" height="340" fill="url(#${gL})"/>
        <rect x="244" y="${s.top - 24}" width="38" height="340" fill="#1C1714" opacity=".13"/>
        ${o.mini ? '' : bandLabel(spec, s, gBand)}
      </g>
    </g>`;
  }

  /* ---- faixa de rótulo (envolve o frasco) ---- */
  function bandLabel(spec, s, gBand) {
    const [y, h] = s.band, cx = 200;
    const lines = String(spec.label || '').split('\n').slice(0, 2);
    const dark = spec.labelDark;
    const fg = dark ? '#F6EFE6' : '#241D19';
    const ac = dark ? '#D9BF92' : '#B08A55';
    const vol = String(spec.vol || 'PROFESSIONAL');
    const vFs = vol.length > 14 ? 5.8 : 7;
    const vLs = vol.length > 14 ? 1.7 : 2.4;
    // rótulo adaptativo: o nome nunca invade a linha do volume
    const volY = y + h - 13;
    const brandY = y + Math.round(h * .22) + 4, ruleY = brandY + 8;
    let nFs = Math.max(13, Math.min(21, Math.round(s.w * 1.85 / Math.max(...lines.map(l => l.length), 1))));
    while (nFs > 12 && ruleY + nFs + 4 + (lines.length - 1) * (nFs + 3) + 5 > volY - 6) nFs--;
    const startY = ruleY + nFs + 4;
    return `
      <defs>
        <linearGradient id="${gBand}" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="${dark ? '#181310' : '#EDE4D9'}"/>
          <stop offset=".34" stop-color="${dark ? '#3A312B' : '#FFFDFA'}"/>
          <stop offset=".62" stop-color="${dark ? '#241E1A' : '#F7F1E9'}"/>
          <stop offset="1" stop-color="${dark ? '#100C0A' : '#DFD2C4'}"/>
        </linearGradient>
      </defs>
      <rect x="100" y="${y}" width="200" height="${h}" fill="url(#${gBand})"/>
      <rect x="100" y="${y}" width="200" height="1" fill="#000" opacity=".07"/>
      <rect x="100" y="${y + h - 1}" width="200" height="1" fill="#000" opacity=".07"/>
      <text x="${cx}" y="${brandY}" text-anchor="middle" font-family="${SANS}" font-size="9.5"
            letter-spacing="4.4" fill="${fg}" opacity=".85">JOYCE</text>
      <rect x="${cx - 19}" y="${ruleY}" width="38" height="1" fill="${ac}"/>
      ${lines.map((l, i) => `<text x="${cx}" y="${startY + i * (nFs + 3)}" text-anchor="middle"
            font-family="${SERIF}" font-style="italic" font-size="${nFs}" fill="${fg}">${esc(l)}</text>`).join('')}
      <text x="${cx}" y="${volY}" text-anchor="middle" font-family="${SANS}" font-size="${vFs}"
            letter-spacing="${vLs}" fill="${fg}" opacity=".55">${esc(vol)}</text>`;
  }

  const blur = (id, sd) => `<filter id="${id}" x="-50%" y="-70%" width="200%" height="240%"><feGaussianBlur stdDeviation="${sd}"/></filter>`;
  const shadow = (cx, cy, rx, f, op) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${Math.round(rx * .15)}" fill="#7C6042" opacity="${op || .26}" filter="url(#${f})"/>`;

  /* ---- cena padrão: fundo + sombra + produto ---- */
  function scene(spec, o = {}) {
    const gBg = u(), gLt = u(), fB = u();
    const k = spec.k || 1;
    const bg = spec.bg || ['#F4EBE1', '#E4D4C2'];
    const inner = o.body || `${shadow(200, 440, Math.round((spec.shape === 'jar' ? 104 : 88) * k), fB)}
      <g transform="${place(200, 436, k)}">${vessel(spec, o)}</g>`;
    return `
    <svg viewBox="0 0 400 500" xmlns="http://www.w3.org/2000/svg" class="art" role="img"
         aria-label="${esc(o.alt || 'Produto Joyce Beauty')}" style="width:100%;height:auto">
      <defs>
        <linearGradient id="${gBg}" x1="0" y1="0" x2=".6" y2="1">
          <stop offset="0" stop-color="${bg[0]}"/><stop offset="1" stop-color="${bg[1]}"/></linearGradient>
        <radialGradient id="${gLt}"><stop offset="0" stop-color="#fff" stop-opacity=".9"/>
          <stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
        ${blur(fB, 11)}
      </defs>
      <rect width="400" height="500" fill="url(#${gBg})"/>
      <ellipse cx="182" cy="188" rx="210" ry="190" fill="url(#${gLt})" opacity=".75"/>
      ${inner}
    </svg>`;
  }

  /* ---- kit: três peças da linha ---- */
  function kitScene(spec, o = {}) {
    const f1 = u();
    const mk = (shape, body) => ({ shape, body: body || spec.body, cap: spec.cap, labelDark: spec.labelDark });
    const body = `
      ${shadow(204, 442, 52, f1, .18)}${shadow(140, 456, 68, f1, .24)}${shadow(264, 460, 60, f1, .24)}
      <g transform="${place(204, 438, .58)}">${vessel(mk('tube', spec.body3), { mini: 1 })}</g>
      <g transform="${place(140, 452, .70)}">${vessel(mk('bottle'), { mini: 1 })}</g>
      <g transform="${place(264, 456, .62)}">${vessel(mk('jar', spec.body2), { mini: 1 })}</g>`;
    return scene(spec, { ...o, body: `<defs>${blur(f1, 9)}</defs>${body}` });
  }

  /* ---- ícone quadrado (categorias / necessidades) ---- */
  function icon(spec, o = {}) {
    const gBg = u(), fB = u();
    const bg = spec.bg || ['#F4EBE1', '#E4D4C2'];
    return `
    <svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg" class="art" role="img"
         aria-label="${esc(o.alt || 'Categoria')}" style="width:100%;height:auto">
      <defs>
        <linearGradient id="${gBg}" x1="0" y1="0" x2=".7" y2="1">
          <stop offset="0" stop-color="${bg[0]}"/><stop offset="1" stop-color="${bg[1]}"/></linearGradient>
        ${blur(fB, 7)}
      </defs>
      <rect width="300" height="300" fill="url(#${gBg})"/>
      <ellipse cx="130" cy="108" rx="150" ry="130" fill="#fff" opacity=".36"/>
      ${shadow(150, 270, 70, fB, .22)}
      <g transform="${place(150, 268, .62)}">${vessel(spec, { mini: 1 })}</g>
    </svg>`;
  }

  /* ---- hero: composição editorial com reflexo ---- */
  function hero() {
    const g1 = u(), g2 = u(), gr = u(), mk = u(), fB = u();
    const SH = 452;   // linha da bancada
    const main = { shape: 'pump', body: ['#F8F3EC', '#E9DED0', '#CBB9A1', '#BAA78D'], cap: 'gold', label: 'Rotina', vol: 'HAIR CARE' };
    const side = { shape: 'jar', body: ['#3C332C', '#251F1A', '#141010', '#0D0A09'], cap: 'gold', label: 'Ritual', vol: 'HAIR MASK', labelDark: 1 };
    const pair = mini => `
      <g transform="${place(238, SH, 1)}">${vessel(main, { mini })}</g>
      <g transform="${place(430, SH, .6)}">${vessel(side, { mini })}</g>`;
    return `
    <svg viewBox="0 0 620 580" xmlns="http://www.w3.org/2000/svg" class="art" role="img"
         aria-label="Composição de produtos profissionais para cabelo" style="width:100%;height:auto">
      <defs>
        <linearGradient id="${g1}" x1=".1" y1="0" x2=".9" y2="1">
          <stop offset="0" stop-color="#F8F1E8"/><stop offset=".5" stop-color="#EBDECD"/>
          <stop offset="1" stop-color="#D8C3AB"/></linearGradient>
        <radialGradient id="${g2}"><stop offset="0" stop-color="#fff" stop-opacity=".95"/>
          <stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
        <linearGradient id="${gr}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#fff" stop-opacity=".42"/>
          <stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
        <mask id="${mk}" maskUnits="userSpaceOnUse" x="0" y="${SH}" width="620" height="128">
          <rect x="0" y="${SH}" width="620" height="128" fill="url(#${gr})"/></mask>
        ${blur(fB, 13)}
      </defs>
      <rect width="620" height="580" fill="url(#${g1})"/>
      <ellipse cx="250" cy="190" rx="290" ry="250" fill="url(#${g2})"/>
      <circle cx="452" cy="140" r="84" fill="#fff" opacity=".3"/>
      <path d="M0,${SH} H620" stroke="#B79B78" stroke-opacity=".4" stroke-width="1"/>
      <g mask="url(#${mk})"><g transform="translate(0,${SH * 2}) scale(1,-1)">${pair(1)}</g></g>
      ${shadow(238, SH + 5, 100, fB, .3)}${shadow(430, SH + 4, 74, fB, .26)}
      <g transform="${place(430, SH, .6)}">${vessel(side)}</g>
      <g transform="${place(238, SH, 1)}">${vessel(main)}</g>
    </svg>`;
  }

  /* ---- painel escuro da seção "Sobre" ---- */
  function aboutArt() {
    const g1 = u(), g2 = u(), fB = u();
    const v = { shape: 'bottle', body: ['#4A3F36', '#2A2320', '#151110', '#0E0B0A'], cap: 'gold', label: 'Essencial', vol: 'HAIR CARE', labelDark: 1 };
    return `
    <svg viewBox="0 0 520 420" xmlns="http://www.w3.org/2000/svg" class="art" role="img"
         aria-label="Produto profissional Joyce Beauty" style="width:100%;height:auto">
      <defs>
        <linearGradient id="${g1}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#3A302A"/><stop offset=".55" stop-color="#241D19"/>
          <stop offset="1" stop-color="#12100E"/></linearGradient>
        <radialGradient id="${g2}"><stop offset="0" stop-color="#C9A87A" stop-opacity=".5"/>
          <stop offset="1" stop-color="#C9A87A" stop-opacity="0"/></radialGradient>
        ${blur(fB, 10)}
      </defs>
      <rect width="520" height="420" fill="url(#${g1})"/>
      <ellipse cx="330" cy="120" rx="230" ry="200" fill="url(#${g2})"/>
      <ellipse cx="260" cy="378" rx="88" ry="12" fill="#000" opacity=".55" filter="url(#${fB})"/>
      <g transform="translate(260,376) scale(.8) translate(-200,${-BASE})">${vessel(v)}</g>
    </svg>`;
  }

  return { scene, kitScene, icon, hero, aboutArt, vessel };
})();

/* ==========================================================================
   ilustracoes.js — biblioteca de desenho das imagens do site
   --------------------------------------------------------------------------
   Roda dentro do Chromium (Canvas 2D) e é chamada por gerar-ilustracoes.mjs.
   Tudo é determinístico: o mesmo nome de prato sempre gera exatamente a mesma
   imagem, então regerar os assets não polui o histórico do Git.

   Nenhuma foto é usada. As ilustrações são desenhadas a partir do nome do
   prato — não substituem foto real, servem enquanto o restaurante não envia
   o material próprio.
   ========================================================================== */
(function (global) {
  'use strict';

  /* ---------------------------------------------------------- Aleatório fixo */

  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  /** mulberry32 — pequeno, rápido e reprodutível. */
  function rng(seed) {
    let a = typeof seed === 'string' ? hash(seed) : seed;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const between = (r, min, max) => min + r() * (max - min);

  /* ------------------------------------------------------------- Paleta base */

  const P = {
    fundoTopo: '#2A211A',
    fundoBase: '#14110E',
    amber: '#F5A524',
    amberClaro: '#FFBB47',
    ember: '#E2542B',
    creme: '#F6F1EA',
    linha: '#3A312B',

    massa: '#E3B577',
    massaEscura: '#C9954F',
    queijo: '#F2C55C',
    molho: '#BE3520',
    tomate: '#D9412B',
    verde: '#4E8B3C',
    verdeClaro: '#7CB05A',
    frito: '#EDB44E',
    fritoEscuro: '#CE8E2A',
    carne: '#7A2E22',
    carneClara: '#B04A38',
    salmao: '#E8703C',
    arroz: '#F4EFE4',
    nori: '#1F211C',
    madeira: '#6B4A2F',
    madeiraClara: '#8A6238',
    prato: '#E8E2D6',
    pratoSombra: '#B9B0A1',
    vidro: 'rgba(246,241,234,0.16)',
  };

  /* ------------------------------------------------------- Primitivas comuns */

  /**
   * Cenário dos pratos: bancada de granito com o salão desfocado ao fundo.
   * É o enquadramento das fotos reais do restaurante — e o desfoque dá a
   * profundidade de campo que separa a comida do fundo, que é o que faz uma
   * foto de cardápio parecer profissional em vez de recorte chapado.
   */
  function fundoMesa(ctx, w, h, cor, rnd) {
    const yMesa = h * 0.6;
    const luz = cor || P.amber;

    // --- ambiente ao fundo, fora de foco ---
    ctx.save();
    const g = ctx.createLinearGradient(0, 0, 0, yMesa);
    g.addColorStop(0, '#2A211A');
    g.addColorStop(1, '#3A2E24');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, yMesa + 2);

    ctx.filter = 'blur(' + Math.round(w * 0.035) + 'px)';
    // bokeh das luminárias
    for (let i = 0; i < 9; i++) {
      const x = between(rnd, -w * 0.05, w * 1.05);
      const y = between(rnd, 0, yMesa * 0.9);
      const r = between(rnd, w * 0.035, w * 0.1);
      circulo(ctx, x, y, r, hexA(i % 3 === 0 ? '#FFD98A' : luz, between(rnd, 0.1, 0.3)));
    }
    // massa de luz quente vinda de cima
    const gl = ctx.createRadialGradient(w * 0.35, 0, 0, w * 0.35, 0, w * 0.9);
    gl.addColorStop(0, hexA(luz, 0.34));
    gl.addColorStop(1, hexA(luz, 0));
    ctx.fillStyle = gl;
    ctx.fillRect(0, 0, w, yMesa + 2);
    ctx.restore();

    // --- bancada de granito ---
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, yMesa, w, h - yMesa);
    ctx.clip();
    const gm = ctx.createLinearGradient(0, yMesa, 0, h);
    gm.addColorStop(0, '#4A4038');
    gm.addColorStop(0.25, '#6B5F52');
    gm.addColorStop(1, '#3A322B');
    ctx.fillStyle = gm;
    ctx.fillRect(0, yMesa, w, h - yMesa);

    // pedrisco do granito, mais denso à frente
    for (let i = 0; i < 900; i++) {
      const t = Math.pow(rnd(), 0.55);
      const y = yMesa + t * (h - yMesa);
      const x = between(rnd, 0, w);
      const r = between(rnd, 0.6, 2.4) * (0.5 + t);
      const tom = rnd();
      circulo(
        ctx,
        x,
        y,
        r,
        tom > 0.72 ? 'rgba(235,225,205,0.5)' : tom > 0.4 ? 'rgba(30,24,18,0.45)' : 'rgba(150,132,110,0.4)',
      );
    }
    // brilho do tampo polido
    const gb = ctx.createLinearGradient(0, yMesa, w * 0.7, h);
    gb.addColorStop(0, 'rgba(255,214,150,0.16)');
    gb.addColorStop(0.5, 'rgba(255,214,150,0)');
    ctx.fillStyle = gb;
    ctx.fillRect(0, yMesa, w, h - yMesa);
    ctx.restore();

    // linha de encontro da bancada com o fundo
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(0, yMesa - 1, w, 3);

    return yMesa;
  }

  /** Sombra de contato: o que “assenta” o objeto na mesa. */
  function sombraContato(ctx, cx, cy, rx, ry, forca) {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry));
    g.addColorStop(0, `rgba(0,0,0,${forca ?? 0.5})`);
    g.addColorStop(0.55, `rgba(0,0,0,${(forca ?? 0.5) * 0.45})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1, ry / rx);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, rx, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /** Realce especular vindo do canto superior esquerdo. */
  function especular(ctx, cx, cy, rx, ry, rot, intensidade) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot || 0);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(rx, ry));
    g.addColorStop(0, `rgba(255,255,255,${intensidade ?? 0.35})`);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.scale(1, ry / rx);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, rx, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /** Vinheta + grão fino: tira o aspecto de vetor chapado. */
  function acabamento(ctx, w, h, rnd) {
    const g = ctx.createRadialGradient(w / 2, h * 0.45, h * 0.28, w / 2, h * 0.5, w * 0.78);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.globalAlpha = 0.045;
    for (let i = 0; i < w * h * 0.006; i++) {
      const x = between(rnd, 0, w);
      const y = between(rnd, 0, h);
      ctx.fillStyle = rnd() > 0.5 ? '#FFFFFF' : '#000000';
      ctx.fillRect(x, y, 1.4, 1.4);
    }
    ctx.restore();
  }

  function hexA(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }

  function sombra(ctx, fn, blur, cor) {
    ctx.save();
    ctx.shadowColor = cor || 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = blur || 24;
    ctx.shadowOffsetY = (blur || 24) * 0.28;
    fn();
    ctx.restore();
  }

  function circulo(ctx, x, y, r, fill) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
  }

  /** Contorno orgânico — evita o aspecto de círculo perfeito da comida. */
  function blob(ctx, x, y, r, irregular, rnd, pontos) {
    const n = pontos || 12;
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const ang = (i / n) * Math.PI * 2;
      const rr = r * (1 + (rnd() - 0.5) * 2 * irregular);
      const px = x + Math.cos(ang) * rr;
      const py = y + Math.sin(ang) * rr;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }

  function retanguloArredondado(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  /** Prato branco visto de cima. */
  function prato(ctx, cx, cy, r) {
    sombra(ctx, () => circulo(ctx, cx, cy, r, P.pratoSombra), 30);
    const g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.35, r * 0.1, cx, cy, r);
    g.addColorStop(0, '#FFFDF8');
    g.addColorStop(1, P.pratoSombra);
    circulo(ctx, cx, cy, r, g);
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.86, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth = r * 0.03;
    ctx.stroke();
  }

  /** Tábua de madeira vista de cima. */
  function tabua(ctx, cx, cy, w, h, rnd) {
    sombra(
      ctx,
      () => {
        retanguloArredondado(ctx, cx - w / 2, cy - h / 2, w, h, h * 0.12);
        ctx.fillStyle = P.madeira;
        ctx.fill();
      },
      30,
    );
    ctx.save();
    retanguloArredondado(ctx, cx - w / 2, cy - h / 2, w, h, h * 0.12);
    ctx.clip();
    const g = ctx.createLinearGradient(cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2);
    g.addColorStop(0, P.madeiraClara);
    g.addColorStop(1, P.madeira);
    ctx.fillStyle = g;
    ctx.fillRect(cx - w / 2, cy - h / 2, w, h);
    ctx.strokeStyle = 'rgba(0,0,0,0.16)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 7; i++) {
      const y = cy - h / 2 + between(rnd, 0.05, 0.95) * h;
      ctx.beginPath();
      ctx.moveTo(cx - w / 2, y);
      ctx.bezierCurveTo(cx - w * 0.2, y + 6, cx + w * 0.2, y - 6, cx + w / 2, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  /** Tigela vista de cima, devolvendo o raio interno útil. */
  function tigela(ctx, cx, cy, r, corInterna) {
    sombra(ctx, () => circulo(ctx, cx, cy, r, '#CFC6B6'), 28);
    const g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
    g.addColorStop(0, '#FFFDF8');
    g.addColorStop(1, '#C2B8A7');
    circulo(ctx, cx, cy, r, g);
    circulo(ctx, cx, cy, r * 0.82, 'rgba(0,0,0,0.12)');
    circulo(ctx, cx, cy, r * 0.79, corInterna);
    return r * 0.79;
  }

  /** Copo visto de frente. Retorna a região interna do líquido. */
  function copo(ctx, cx, base, largTopo, largBase, altura) {
    const topo = base - altura;
    ctx.beginPath();
    ctx.moveTo(cx - largTopo / 2, topo);
    ctx.lineTo(cx + largTopo / 2, topo);
    ctx.lineTo(cx + largBase / 2, base);
    ctx.lineTo(cx - largBase / 2, base);
    ctx.closePath();
    return { topo, base, largTopo, largBase };
  }

  function vidroPorCima(ctx, forma, cx) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx - forma.largTopo / 2, forma.topo);
    ctx.lineTo(cx + forma.largTopo / 2, forma.topo);
    ctx.lineTo(cx + forma.largBase / 2, forma.base);
    ctx.lineTo(cx - forma.largBase / 2, forma.base);
    ctx.closePath();
    ctx.strokeStyle = 'rgba(246,241,234,0.55)';
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.fillRect(cx - forma.largTopo / 2, forma.topo, forma.largTopo * 0.18, forma.base - forma.topo);
    ctx.restore();
  }

  function gelo(ctx, x, y, s, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    retanguloArredondado(ctx, -s / 2, -s / 2, s, s, s * 0.22);
    ctx.fillStyle = 'rgba(255,255,255,0.30)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  function bolhas(ctx, cx, y0, y1, larg, n, rnd, cor) {
    for (let i = 0; i < n; i++) {
      const x = cx + between(rnd, -larg / 2, larg / 2);
      const y = between(rnd, y0, y1);
      circulo(ctx, x, y, between(rnd, 2, 5), cor || 'rgba(255,255,255,0.45)');
    }
  }

  function folhaVerde(ctx, x, y, r, rot, cor) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.beginPath();
    ctx.moveTo(-r, 0);
    ctx.quadraticCurveTo(0, -r * 0.75, r, 0);
    ctx.quadraticCurveTo(0, r * 0.75, -r, 0);
    ctx.closePath();
    ctx.fillStyle = cor || P.verde;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-r * 0.8, 0);
    ctx.lineTo(r * 0.8, 0);
    ctx.stroke();
    ctx.restore();
  }

  function fatiaLimao(ctx, x, y, r) {
    circulo(ctx, x, y, r, '#F2D65C');
    circulo(ctx, x, y, r * 0.82, '#FBEE9C');
    ctx.save();
    ctx.strokeStyle = '#E8C846';
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(a) * r * 0.78, y + Math.sin(a) * r * 0.78);
      ctx.stroke();
    }
    ctx.restore();
  }

  /* ------------------------------------------------------ Base comum: pizza */

  function basePizza(ctx, cx, cy, r, rnd) {
    // borda
    const gb = ctx.createRadialGradient(cx, cy, r * 0.7, cx, cy, r);
    gb.addColorStop(0, P.massa);
    gb.addColorStop(1, P.massaEscura);
    blob(ctx, cx, cy, r, 0.02, rnd, 40);
    ctx.fillStyle = gb;
    sombra(ctx, () => ctx.fill(), 26);
    ctx.fill();
    // manchas de forno na borda
    ctx.save();
    ctx.globalAlpha = 0.35;
    for (let i = 0; i < 14; i++) {
      const a = rnd() * Math.PI * 2;
      const rr = r * between(rnd, 0.88, 0.97);
      circulo(ctx, cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, between(rnd, 3, 8), '#8A5A22');
    }
    ctx.restore();
  }

  function cortesPizza(ctx, cx, cy, r) {
    ctx.save();
    ctx.strokeStyle = 'rgba(90,50,20,0.28)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI;
      ctx.beginPath();
      ctx.moveTo(cx - Math.cos(a) * r * 0.86, cy - Math.sin(a) * r * 0.86);
      ctx.lineTo(cx + Math.cos(a) * r * 0.86, cy + Math.sin(a) * r * 0.86);
      ctx.stroke();
    }
    ctx.restore();
  }

  /* ----------------------------------------------------------- Os pratos ---- */

  const pratos = {
    'pizzas-salgadas': {
      alt: 'Ilustração de uma pizza salgada inteira, com molho de tomate, queijo derretido, fatias de calabresa e manjericão.',
      cor: P.ember,
      draw(ctx, S, rnd) {
        const cx = S / 2,
          cy = S / 2,
          r = S * 0.36;
        basePizza(ctx, cx, cy, r, rnd);
        blob(ctx, cx, cy, r * 0.87, 0.015, rnd, 36);
        ctx.fillStyle = P.molho;
        ctx.fill();
        blob(ctx, cx, cy, r * 0.84, 0.03, rnd, 30);
        ctx.fillStyle = P.queijo;
        ctx.fill();
        // queijo derretido irregular
        ctx.save();
        ctx.globalAlpha = 0.5;
        for (let i = 0; i < 16; i++) {
          const a = rnd() * Math.PI * 2;
          const rr = between(rnd, 0, r * 0.7);
          blob(ctx, cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, between(rnd, 8, 18), 0.3, rnd, 8);
          ctx.fillStyle = '#FFE0A0';
          ctx.fill();
        }
        ctx.restore();
        // calabresa
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2 + rnd() * 0.5;
          const rr = between(rnd, r * 0.22, r * 0.68);
          const x = cx + Math.cos(a) * rr;
          const y = cy + Math.sin(a) * rr;
          circulo(ctx, x, y, r * 0.115, '#A32C1C');
          circulo(ctx, x - r * 0.02, y - r * 0.02, r * 0.09, '#C4402A');
        }
        // manjericão
        for (let i = 0; i < 5; i++) {
          const a = rnd() * Math.PI * 2;
          const rr = between(rnd, r * 0.2, r * 0.72);
          folhaVerde(ctx, cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, r * 0.09, rnd() * Math.PI);
        }
        // gratinado e orégano — sem isso o queijo fica chapado demais
        ctx.save();
        blob(ctx, cx, cy, r * 0.84, 0.03, rnd, 30);
        ctx.clip();
        for (let i = 0; i < 24; i++) {
          const a = rnd() * Math.PI * 2;
          const rr = between(rnd, 0, r * 0.76);
          circulo(ctx, cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, between(rnd, 2, 5), 'rgba(150,88,20,0.45)');
        }
        for (let i = 0; i < 30; i++) {
          const a = rnd() * Math.PI * 2;
          const rr = between(rnd, 0, r * 0.8);
          ctx.save();
          ctx.translate(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
          ctx.rotate(rnd() * Math.PI);
          ctx.fillStyle = 'rgba(74,110,50,0.7)';
          ctx.fillRect(-2.5, -1, 5, 2);
          ctx.restore();
        }
        ctx.restore();
        especular(ctx, cx - r * 0.35, cy - r * 0.42, r * 0.3, r * 0.15, -0.5, 0.2);
        cortesPizza(ctx, cx, cy, r);
      },
    },

    'pizzas-doces': {
      alt: 'Ilustração de uma pizza doce coberta com chocolate, fios de leite condensado e pedaços de morango.',
      cor: '#C4553A',
      draw(ctx, S, rnd) {
        const cx = S / 2,
          cy = S / 2,
          r = S * 0.36;
        basePizza(ctx, cx, cy, r, rnd);
        blob(ctx, cx, cy, r * 0.86, 0.02, rnd, 36);
        ctx.fillStyle = '#4A2C1A';
        ctx.fill();
        blob(ctx, cx, cy, r * 0.8, 0.04, rnd, 24);
        ctx.fillStyle = '#5D3721';
        ctx.fill();
        // fios de leite condensado
        ctx.save();
        ctx.strokeStyle = '#FFF6E6';
        ctx.lineWidth = r * 0.055;
        ctx.lineCap = 'round';
        for (let i = 0; i < 5; i++) {
          const y = cy - r * 0.55 + (i / 4) * r * 1.1;
          ctx.beginPath();
          ctx.moveTo(cx - r * 0.72, y);
          ctx.bezierCurveTo(cx - r * 0.25, y - r * 0.2, cx + r * 0.25, y + r * 0.2, cx + r * 0.72, y);
          ctx.stroke();
        }
        ctx.restore();
        // morangos
        for (let i = 0; i < 7; i++) {
          const a = (i / 7) * Math.PI * 2 + rnd() * 0.4;
          const rr = between(rnd, r * 0.2, r * 0.62);
          const x = cx + Math.cos(a) * rr;
          const y = cy + Math.sin(a) * rr;
          blob(ctx, x, y, r * 0.09, 0.18, rnd, 9);
          ctx.fillStyle = '#D42F3C';
          ctx.fill();
          circulo(ctx, x - r * 0.02, y - r * 0.03, r * 0.03, '#F2657A');
        }
        cortesPizza(ctx, cx, cy, r);
      },
    },

    'bordas-recheadas': {
      alt: 'Ilustração de uma pizza de borda recheada com uma fatia retirada, mostrando o queijo derretido dentro da borda.',
      cor: P.amber,
      draw(ctx, S, rnd) {
        const cx = S / 2,
          cy = S * 0.54,
          r = S * 0.34;
        // borda bem mais grossa
        blob(ctx, cx, cy, r * 1.16, 0.02, rnd, 40);
        const gb = ctx.createRadialGradient(cx, cy, r * 0.8, cx, cy, r * 1.16);
        gb.addColorStop(0, P.massaEscura);
        gb.addColorStop(0.6, P.massa);
        gb.addColorStop(1, '#B9822F');
        ctx.fillStyle = gb;
        sombra(ctx, () => ctx.fill(), 26);
        ctx.fill();
        // ondulação da borda recheada
        ctx.save();
        ctx.strokeStyle = 'rgba(120,75,25,0.45)';
        ctx.lineWidth = 3;
        for (let i = 0; i < 18; i++) {
          const a = (i / 18) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(a) * r * 0.94, cy + Math.sin(a) * r * 0.94);
          ctx.lineTo(cx + Math.cos(a) * r * 1.14, cy + Math.sin(a) * r * 1.14);
          ctx.stroke();
        }
        ctx.restore();
        blob(ctx, cx, cy, r * 0.9, 0.02, rnd, 30);
        ctx.fillStyle = P.molho;
        ctx.fill();
        blob(ctx, cx, cy, r * 0.86, 0.03, rnd, 26);
        ctx.fillStyle = P.queijo;
        ctx.fill();

        // textura de queijo gratinado: manchas claras e pontos tostados
        ctx.save();
        blob(ctx, cx, cy, r * 0.86, 0.03, rnd, 26);
        ctx.clip();
        for (let i = 0; i < 26; i++) {
          const a = rnd() * Math.PI * 2;
          const rr = between(rnd, 0, r * 0.78);
          blob(ctx, cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, between(rnd, r * 0.07, r * 0.17), 0.3, rnd, 9);
          ctx.fillStyle = rnd() > 0.45 ? 'rgba(255,228,160,0.55)' : 'rgba(226,168,60,0.45)';
          ctx.fill();
        }
        for (let i = 0; i < 30; i++) {
          const a = rnd() * Math.PI * 2;
          const rr = between(rnd, 0, r * 0.8);
          circulo(ctx, cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, between(rnd, 2, 5), 'rgba(150,88,20,0.5)');
        }
        // orégano
        for (let i = 0; i < 34; i++) {
          const a = rnd() * Math.PI * 2;
          const rr = between(rnd, 0, r * 0.82);
          ctx.save();
          ctx.translate(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
          ctx.rotate(rnd() * Math.PI);
          ctx.fillStyle = 'rgba(74,110,50,0.75)';
          ctx.fillRect(-2.5, -1, 5, 2);
          ctx.restore();
        }
        ctx.restore();
        especular(ctx, cx - r * 0.35, cy - r * 0.4, r * 0.3, r * 0.16, -0.5, 0.22);
        // Uma fatia retirada. Apagamos a cunha em vez de pintá-la de preto,
        // para que a bancada apareça no vão — pintar de escuro deixaria um
        // buraco chapado no meio da pizza.
        const a0 = -Math.PI * 0.6;
        const a1 = -Math.PI * 0.44;
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r * 1.35, a0, a1);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // corte revelando o recheio de queijo dentro da borda
        for (const a of [a0, a1]) {
          const xi = cx + Math.cos(a) * r * 0.9;
          const yi = cy + Math.sin(a) * r * 0.9;
          const xo = cx + Math.cos(a) * r * 1.15;
          const yo = cy + Math.sin(a) * r * 1.15;
          ctx.save();
          ctx.strokeStyle = '#F7D98C';
          ctx.lineWidth = r * 0.14;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(xi, yi);
          ctx.lineTo(xo, yo);
          ctx.stroke();
          ctx.strokeStyle = P.massaEscura;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(xo, yo);
          ctx.stroke();
          ctx.restore();
        }

        // fios de queijo atravessando o vão
        ctx.save();
        ctx.strokeStyle = '#F7D98C';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        for (let i = 0; i < 2; i++) {
          const t = 0.6 + i * 0.24;
          const xa = cx + Math.cos(a0) * r * t;
          const ya = cy + Math.sin(a0) * r * t;
          const xb = cx + Math.cos(a1) * r * t;
          const yb = cy + Math.sin(a1) * r * t;
          ctx.beginPath();
          ctx.moveTo(xa, ya);
          ctx.quadraticCurveTo((xa + xb) / 2, (ya + yb) / 2 + r * 0.12, xb, yb);
          ctx.stroke();
        }
        ctx.restore();
      },
    },

    massas: {
      alt: 'Ilustração de um prato de massa com molho de tomate, queijo ralado e folhas de manjericão.',
      cor: '#D06A2A',
      draw(ctx, S, rnd) {
        const cx = S / 2,
          cy = S / 2,
          r = S * 0.38;
        prato(ctx, cx, cy, r);
        // ninho de espaguete
        ctx.save();
        ctx.strokeStyle = '#F0C980';
        ctx.lineWidth = S * 0.022;
        ctx.lineCap = 'round';
        for (let i = 0; i < 26; i++) {
          const a0 = rnd() * Math.PI * 2;
          const rr = between(rnd, r * 0.18, r * 0.66);
          ctx.beginPath();
          ctx.arc(cx + between(rnd, -12, 12), cy + between(rnd, -12, 12), rr, a0, a0 + between(rnd, 1.2, 3.4));
          ctx.strokeStyle = rnd() > 0.5 ? '#F0C980' : '#E0B466';
          ctx.stroke();
        }
        ctx.restore();
        // molho
        blob(ctx, cx, cy - r * 0.05, r * 0.34, 0.22, rnd, 14);
        ctx.fillStyle = P.molho;
        ctx.fill();
        blob(ctx, cx - r * 0.06, cy - r * 0.12, r * 0.18, 0.25, rnd, 10);
        ctx.fillStyle = '#D24A2E';
        ctx.fill();
        // queijo ralado
        ctx.save();
        for (let i = 0; i < 30; i++) {
          const a = rnd() * Math.PI * 2;
          const rr = between(rnd, 0, r * 0.6);
          ctx.save();
          ctx.translate(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
          ctx.rotate(rnd() * Math.PI);
          ctx.fillStyle = '#FFF6DF';
          ctx.fillRect(-5, -1.5, 10, 3);
          ctx.restore();
        }
        ctx.restore();
        folhaVerde(ctx, cx + r * 0.08, cy - r * 0.22, r * 0.13, -0.4);
        folhaVerde(ctx, cx - r * 0.12, cy + r * 0.1, r * 0.11, 0.7);
      },
    },

    'batata-frita': {
      alt: 'Ilustração de uma porção de batata frita dourada servida em uma cesta.',
      cor: P.amber,
      draw(ctx, S, rnd) {
        const cx = S / 2,
          cy = S * 0.56,
          r = S * 0.34;
        const dentro = tigela(ctx, cx, cy, r, '#8A5A22');
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, dentro, 0, Math.PI * 2);
        ctx.clip();
        for (let i = 0; i < 40; i++) {
          const x = cx + between(rnd, -dentro, dentro) * 0.85;
          const y = cy + between(rnd, -dentro, dentro) * 0.85;
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(rnd() * Math.PI);
          const larg = S * between(rnd, 0.035, 0.05);
          const alt = S * between(rnd, 0.16, 0.26);
          retanguloArredondado(ctx, -larg / 2, -alt / 2, larg, alt, larg * 0.35);
          const g = ctx.createLinearGradient(-larg / 2, 0, larg / 2, 0);
          g.addColorStop(0, P.frito);
          g.addColorStop(1, P.fritoEscuro);
          ctx.fillStyle = g;
          ctx.fill();
          ctx.strokeStyle = 'rgba(120,75,20,0.5)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.restore();
        }
        ctx.restore();
        // sal
        for (let i = 0; i < 22; i++) {
          const a = rnd() * Math.PI * 2;
          const rr = between(rnd, 0, dentro * 0.9);
          circulo(ctx, cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, 2, 'rgba(255,255,255,0.8)');
        }
      },
    },

    'batata-queijo-bacon': {
      alt: 'Ilustração de batata frita coberta com queijo derretido, tiras de bacon e cebolinha.',
      cor: '#D9622A',
      draw(ctx, S, rnd) {
        const cx = S / 2,
          cy = S * 0.56,
          r = S * 0.34;
        const dentro = tigela(ctx, cx, cy, r, '#8A5A22');
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, dentro, 0, Math.PI * 2);
        ctx.clip();
        for (let i = 0; i < 30; i++) {
          const x = cx + between(rnd, -dentro, dentro) * 0.85;
          const y = cy + between(rnd, -dentro, dentro) * 0.85;
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(rnd() * Math.PI);
          const larg = S * 0.042;
          const alt = S * between(rnd, 0.16, 0.24);
          retanguloArredondado(ctx, -larg / 2, -alt / 2, larg, alt, larg * 0.35);
          ctx.fillStyle = P.frito;
          ctx.fill();
          ctx.strokeStyle = 'rgba(120,75,20,0.45)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.restore();
        }
        // queijo derretido por cima
        for (let i = 0; i < 7; i++) {
          const a = rnd() * Math.PI * 2;
          const rr = between(rnd, 0, dentro * 0.55);
          blob(ctx, cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, between(rnd, dentro * 0.2, dentro * 0.34), 0.28, rnd, 12);
          ctx.fillStyle = 'rgba(242,197,92,0.92)';
          ctx.fill();
        }
        // bacon
        for (let i = 0; i < 9; i++) {
          const x = cx + between(rnd, -dentro * 0.75, dentro * 0.75);
          const y = cy + between(rnd, -dentro * 0.7, dentro * 0.7);
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(rnd() * Math.PI);
          ctx.beginPath();
          ctx.moveTo(-S * 0.06, 0);
          ctx.quadraticCurveTo(0, -S * 0.03, S * 0.06, 0);
          ctx.quadraticCurveTo(0, S * 0.02, -S * 0.06, 0);
          ctx.fillStyle = '#A63A22';
          ctx.fill();
          ctx.restore();
        }
        ctx.restore();
        // cebolinha
        for (let i = 0; i < 18; i++) {
          const a = rnd() * Math.PI * 2;
          const rr = between(rnd, 0, dentro * 0.85);
          circulo(ctx, cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, 3, P.verdeClaro);
        }
      },
    },

    'frango-a-passarinho': {
      alt: 'Ilustração de uma porção de frango a passarinho dourado com alho e limão.',
      cor: '#D89A3E',
      draw(ctx, S, rnd) {
        const cx = S / 2,
          cy = S / 2,
          r = S * 0.38;
        prato(ctx, cx, cy, r);
        for (let i = 0; i < 9; i++) {
          const a = (i / 9) * Math.PI * 2 + rnd() * 0.6;
          const rr = i === 0 ? 0 : between(rnd, r * 0.22, r * 0.55);
          const x = cx + Math.cos(a) * rr;
          const y = cy + Math.sin(a) * rr;
          blob(ctx, x, y, S * between(rnd, 0.07, 0.095), 0.24, rnd, 11);
          const g = ctx.createRadialGradient(x - 6, y - 6, 2, x, y, S * 0.1);
          g.addColorStop(0, '#E8B45C');
          g.addColorStop(1, '#B0721F');
          ctx.fillStyle = g;
          sombra(ctx, () => ctx.fill(), 10);
          ctx.fill();
          // crocância
          ctx.save();
          ctx.globalAlpha = 0.5;
          for (let k = 0; k < 6; k++) {
            circulo(ctx, x + between(rnd, -14, 14), y + between(rnd, -14, 14), between(rnd, 1.5, 3), '#7A4A12');
          }
          ctx.restore();
        }
        // alho frito
        for (let i = 0; i < 14; i++) {
          const a = rnd() * Math.PI * 2;
          const rr = between(rnd, 0, r * 0.7);
          circulo(ctx, cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, between(rnd, 2.5, 5), '#F6E3B0');
        }
        fatiaLimao(ctx, cx + r * 0.62, cy + r * 0.52, S * 0.075);
        folhaVerde(ctx, cx - r * 0.6, cy + r * 0.55, S * 0.06, 0.5);
      },
    },

    'comida-japonesa': {
      // Referência: as travessas de uramaki do perfil do restaurante — rolinhos
      // enfileirados numa travessa branca oval, cobertos de salmão/manga, com
      // alface e laranja na borda.
      alt: 'Ilustração de uma travessa branca com fileiras de uramaki cobertos de salmão, com alface e laranja na borda.',
      cor: '#E8703C',
      draw(ctx, S, rnd) {
        const cx = S / 2,
          cy = S * 0.54;
        // travessa oval
        ctx.beginPath();
        ctx.ellipse(cx, cy, S * 0.42, S * 0.3, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#CFC6B6';
        sombra(ctx, () => ctx.fill(), 26);
        ctx.fill();
        const g = ctx.createRadialGradient(cx - S * 0.1, cy - S * 0.1, S * 0.05, cx, cy, S * 0.42);
        g.addColorStop(0, '#FFFDF8');
        g.addColorStop(1, '#DCD3C3');
        ctx.beginPath();
        ctx.ellipse(cx, cy, S * 0.42, S * 0.3, 0, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();

        // alface na borda de trás
        for (let i = 0; i < 7; i++) {
          const t = i / 6;
          blob(ctx, cx - S * 0.3 + t * S * 0.6, cy - S * 0.24 + Math.sin(t * Math.PI) * -S * 0.02, S * 0.06, 0.35, rnd, 10);
          ctx.fillStyle = i % 2 ? '#5F9B3E' : '#7CB05A';
          ctx.fill();
        }

        // fileiras de uramaki
        const linhas = [
          { y: cy - S * 0.07, n: 7, r: S * 0.048 },
          { y: cy + S * 0.05, n: 7, r: S * 0.05 },
          { y: cy + S * 0.17, n: 6, r: S * 0.048 },
        ];
        for (const linha of linhas) {
          for (let i = 0; i < linha.n; i++) {
            const x = cx - (linha.n - 1) * linha.r * 1.15 + i * linha.r * 2.3;
            // arroz externo
            circulo(ctx, x, linha.y, linha.r, '#EDE5D4');
            circulo(ctx, x, linha.y - linha.r * 0.12, linha.r * 0.94, P.arroz);
            // grãos
            ctx.save();
            ctx.globalAlpha = 0.5;
            for (let k = 0; k < 7; k++) {
              circulo(ctx, x + between(rnd, -linha.r * 0.6, linha.r * 0.6), linha.y + between(rnd, -linha.r * 0.6, linha.r * 0.6), 1.6, '#FFFFFF');
            }
            ctx.restore();
            // nori e recheio no miolo
            circulo(ctx, x, linha.y, linha.r * 0.5, P.nori);
            circulo(ctx, x, linha.y, linha.r * 0.32, '#F0E7D6');
            // cobertura de salmão
            ctx.save();
            ctx.translate(x, linha.y - linha.r * 0.28);
            ctx.rotate(between(rnd, -0.25, 0.25));
            retanguloArredondado(ctx, -linha.r * 0.86, -linha.r * 0.34, linha.r * 1.72, linha.r * 0.68, linha.r * 0.3);
            const gs = ctx.createLinearGradient(0, -linha.r * 0.34, 0, linha.r * 0.34);
            gs.addColorStop(0, '#F79A5E');
            gs.addColorStop(1, '#D95C2C');
            ctx.fillStyle = gs;
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.4)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(-linha.r * 0.5, -linha.r * 0.1);
            ctx.lineTo(linha.r * 0.5, -linha.r * 0.1);
            ctx.stroke();
            ctx.restore();
            // gergelim preto
            for (let k = 0; k < 3; k++) {
              circulo(ctx, x + between(rnd, -linha.r * 0.5, linha.r * 0.5), linha.y - linha.r * 0.4, 1.4, '#2A2622');
            }
          }
        }

        // laranja decorativa
        fatiaLimao(ctx, cx - S * 0.3, cy + S * 0.19, S * 0.055);
        folhaVerde(ctx, cx + S * 0.31, cy + S * 0.2, S * 0.055, 0.5, '#4E8B3C');
      },
    },

    'frutos-do-mar': {
      alt: 'Ilustração de um prato de frutos do mar com camarões, mexilhões e limão.',
      cor: '#E8703C',
      draw(ctx, S, rnd) {
        const cx = S / 2,
          cy = S / 2,
          r = S * 0.38;
        prato(ctx, cx, cy, r);
        // camarões
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2 + 0.4;
          const x = cx + Math.cos(a) * r * 0.42;
          const y = cy + Math.sin(a) * r * 0.42;
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(a + Math.PI / 2);
          ctx.beginPath();
          ctx.arc(0, 0, S * 0.075, 0.5, Math.PI * 1.75);
          ctx.lineWidth = S * 0.042;
          ctx.lineCap = 'round';
          const g = ctx.createLinearGradient(-S * 0.08, 0, S * 0.08, 0);
          g.addColorStop(0, '#F08A55');
          g.addColorStop(1, '#D14E22');
          ctx.strokeStyle = g;
          sombra(ctx, () => ctx.stroke(), 10);
          ctx.stroke();
          ctx.strokeStyle = 'rgba(255,255,255,0.35)';
          ctx.lineWidth = 2;
          for (let k = 0; k < 4; k++) {
            const aa = 0.7 + k * 0.32;
            ctx.beginPath();
            ctx.moveTo(Math.cos(aa) * S * 0.055, Math.sin(aa) * S * 0.055);
            ctx.lineTo(Math.cos(aa) * S * 0.095, Math.sin(aa) * S * 0.095);
            ctx.stroke();
          }
          ctx.restore();
        }
        // mexilhões
        for (let i = 0; i < 3; i++) {
          const a = (i / 3) * Math.PI * 2 - 0.6;
          const x = cx + Math.cos(a) * r * 0.66;
          const y = cy + Math.sin(a) * r * 0.66;
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(a);
          ctx.beginPath();
          ctx.ellipse(0, 0, S * 0.07, S * 0.045, 0, 0, Math.PI * 2);
          ctx.fillStyle = '#2E2A33';
          sombra(ctx, () => ctx.fill(), 10);
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(0, 0, S * 0.05, S * 0.03, 0, 0, Math.PI * 2);
          ctx.fillStyle = '#E8A66A';
          ctx.fill();
          ctx.restore();
        }
        fatiaLimao(ctx, cx, cy, S * 0.072);
        folhaVerde(ctx, cx + r * 0.5, cy + r * 0.62, S * 0.06, -0.5);
      },
    },

    carnes: {
      // Referência: as fatias de picanha cortadas na tábua no perfil do
      // restaurante — largas, com capa de gordura clara e miolo rosado.
      alt: 'Ilustração de uma tábua com fatias largas de picanha, com capa de gordura dourada e miolo rosado.',
      cor: '#B04A38',
      draw(ctx, S, rnd) {
        tabua(ctx, S / 2, S * 0.56, S * 0.82, S * 0.5, rnd);

        // fatias em leque, sobrepostas
        for (let i = 0; i < 5; i++) {
          const x = S * 0.26 + i * S * 0.115;
          const y = S * 0.56 + Math.sin((i / 4) * Math.PI) * -S * 0.03;
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(-0.16 + i * 0.08);
          const w = S * 0.24,
            hh = S * 0.115;

          // corpo da fatia, vista de cima
          ctx.beginPath();
          ctx.ellipse(0, 0, w / 2, hh / 2, 0, 0, Math.PI * 2);
          const g = ctx.createLinearGradient(0, -hh / 2, 0, hh / 2);
          g.addColorStop(0, '#5A2018');
          g.addColorStop(0.5, '#7E3023');
          g.addColorStop(1, '#4A1912');
          ctx.fillStyle = g;
          sombra(ctx, () => ctx.fill(), 14);
          ctx.fill();

          // miolo rosado
          ctx.beginPath();
          ctx.ellipse(0, hh * 0.04, w * 0.36, hh * 0.3, 0, 0, Math.PI * 2);
          ctx.fillStyle = '#C4564A';
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(0, hh * 0.04, w * 0.22, hh * 0.17, 0, 0, Math.PI * 2);
          ctx.fillStyle = '#D97A6A';
          ctx.fill();

          // capa de gordura na borda superior
          ctx.save();
          ctx.beginPath();
          ctx.ellipse(0, 0, w / 2, hh / 2, 0, 0, Math.PI * 2);
          ctx.clip();
          ctx.beginPath();
          ctx.ellipse(0, -hh * 0.46, w / 2, hh * 0.34, 0, 0, Math.PI * 2);
          ctx.fillStyle = '#EFDCB0';
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(0, -hh * 0.52, w / 2, hh * 0.3, 0, 0, Math.PI * 2);
          ctx.fillStyle = '#C99A52';
          ctx.fill();
          ctx.restore();

          // borda selada
          ctx.beginPath();
          ctx.ellipse(0, 0, w / 2, hh / 2, 0, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(40,18,12,0.6)';
          ctx.lineWidth = 3;
          ctx.stroke();

          // sal grosso
          for (let k = 0; k < 6; k++) {
            circulo(ctx, between(rnd, -w * 0.4, w * 0.4), between(rnd, -hh * 0.35, hh * 0.35), 1.8, 'rgba(255,255,255,0.75)');
          }
          ctx.restore();
        }

        // faca insinuada e alecrim
        ctx.save();
        ctx.translate(S * 0.74, S * 0.74);
        ctx.rotate(-0.5);
        ctx.strokeStyle = '#3F6B32';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-S * 0.08, 0);
        ctx.lineTo(S * 0.08, 0);
        ctx.stroke();
        for (let i = -4; i <= 4; i++) {
          folhaVerde(ctx, i * S * 0.018, 0, S * 0.022, i % 2 ? 1 : -1, '#4E8B3C');
        }
        ctx.restore();
      },
    },

    'caldos-e-sopas': {
      alt: 'Ilustração de uma tigela de caldo quente com cebolinha e vapor subindo.',
      cor: '#D98A2A',
      draw(ctx, S, rnd) {
        const cx = S / 2,
          cy = S * 0.58,
          r = S * 0.33;
        const dentro = tigela(ctx, cx, cy, r, '#C86A2A');
        // superfície
        const g = ctx.createRadialGradient(cx - dentro * 0.3, cy - dentro * 0.3, 4, cx, cy, dentro);
        g.addColorStop(0, '#E89A3E');
        g.addColorStop(1, '#B45A1E');
        circulo(ctx, cx, cy, dentro, g);
        // gordura / pedaços
        for (let i = 0; i < 12; i++) {
          const a = rnd() * Math.PI * 2;
          const rr = between(rnd, 0, dentro * 0.8);
          circulo(ctx, cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, between(rnd, 4, 10), 'rgba(255,214,120,0.5)');
        }
        for (let i = 0; i < 14; i++) {
          const a = rnd() * Math.PI * 2;
          const rr = between(rnd, 0, dentro * 0.75);
          circulo(ctx, cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, 3.5, P.verdeClaro);
        }
        // vapor
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 7;
        ctx.lineCap = 'round';
        for (let i = 0; i < 3; i++) {
          const x = cx - r * 0.4 + i * r * 0.4;
          ctx.beginPath();
          ctx.moveTo(x, cy - r * 1.1);
          ctx.bezierCurveTo(x + 22, cy - r * 1.4, x - 22, cy - r * 1.7, x + 8, cy - r * 2.0);
          ctx.stroke();
        }
        ctx.restore();
      },
    },

    'saladas-e-acompanhamentos': {
      alt: 'Ilustração de uma tigela de salada com folhas verdes, tomate e pepino.',
      cor: P.verde,
      draw(ctx, S, rnd) {
        const cx = S / 2,
          cy = S * 0.55,
          r = S * 0.34;
        const dentro = tigela(ctx, cx, cy, r, '#25351E');
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, dentro, 0, Math.PI * 2);
        ctx.clip();
        for (let i = 0; i < 22; i++) {
          const a = rnd() * Math.PI * 2;
          const rr = between(rnd, 0, dentro * 0.85);
          const x = cx + Math.cos(a) * rr;
          const y = cy + Math.sin(a) * rr;
          blob(ctx, x, y, S * between(rnd, 0.05, 0.085), 0.35, rnd, 10);
          ctx.fillStyle = rnd() > 0.5 ? P.verde : P.verdeClaro;
          ctx.globalAlpha = 0.95;
          ctx.fill();
          ctx.globalAlpha = 1;
        }
        for (let i = 0; i < 5; i++) {
          const a = rnd() * Math.PI * 2;
          const rr = between(rnd, 0, dentro * 0.7);
          const x = cx + Math.cos(a) * rr;
          const y = cy + Math.sin(a) * rr;
          circulo(ctx, x, y, S * 0.045, '#D9412B');
          circulo(ctx, x - 3, y - 3, S * 0.018, '#F2705A');
        }
        for (let i = 0; i < 4; i++) {
          const a = rnd() * Math.PI * 2;
          const rr = between(rnd, 0, dentro * 0.72);
          const x = cx + Math.cos(a) * rr;
          const y = cy + Math.sin(a) * rr;
          circulo(ctx, x, y, S * 0.04, '#5F9B3E');
          circulo(ctx, x, y, S * 0.028, '#CFE4A8');
        }
        ctx.restore();
      },
    },

    refrigerante: {
      alt: 'Ilustração de um copo de refrigerante com gelo, canudo e bolhas.',
      cor: '#C4553A',
      draw(ctx, S, rnd) {
        const cx = S / 2;
        const forma = copo(ctx, cx, S * 0.82, S * 0.36, S * 0.26, S * 0.56);
        ctx.save();
        ctx.clip();
        const g = ctx.createLinearGradient(0, forma.topo, 0, forma.base);
        g.addColorStop(0, '#5A2A18');
        g.addColorStop(1, '#2A120A');
        ctx.fillStyle = g;
        ctx.fillRect(cx - S * 0.2, forma.topo + S * 0.05, S * 0.4, S * 0.6);
        bolhas(ctx, cx, forma.topo + S * 0.08, forma.base - 10, S * 0.28, 34, rnd, 'rgba(255,255,255,0.35)');
        gelo(ctx, cx - S * 0.06, forma.topo + S * 0.12, S * 0.1, 0.3);
        gelo(ctx, cx + S * 0.07, forma.topo + S * 0.2, S * 0.09, -0.4);
        gelo(ctx, cx - S * 0.01, forma.topo + S * 0.3, S * 0.085, 0.8);
        ctx.restore();
        vidroPorCima(ctx, forma, cx);
        // canudo
        ctx.save();
        ctx.strokeStyle = P.amberClaro;
        ctx.lineWidth = S * 0.032;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(cx + S * 0.06, forma.topo - S * 0.1);
        ctx.lineTo(cx - S * 0.04, forma.base - S * 0.06);
        ctx.stroke();
        ctx.restore();
      },
    },

    agua: {
      alt: 'Ilustração de um copo de água gelada com rodela de limão.',
      cor: '#5FA8C4',
      draw(ctx, S, rnd) {
        const cx = S / 2;
        const forma = copo(ctx, cx, S * 0.82, S * 0.34, S * 0.24, S * 0.56);
        ctx.save();
        ctx.clip();
        const g = ctx.createLinearGradient(0, forma.topo, 0, forma.base);
        g.addColorStop(0, 'rgba(150,205,225,0.55)');
        g.addColorStop(1, 'rgba(70,140,170,0.75)');
        ctx.fillStyle = g;
        ctx.fillRect(cx - S * 0.2, forma.topo + S * 0.06, S * 0.4, S * 0.6);
        bolhas(ctx, cx, forma.topo + S * 0.1, forma.base - 10, S * 0.26, 26, rnd, 'rgba(255,255,255,0.6)');
        gelo(ctx, cx - S * 0.05, forma.topo + S * 0.14, S * 0.095, 0.4);
        gelo(ctx, cx + S * 0.06, forma.topo + S * 0.26, S * 0.085, -0.6);
        ctx.restore();
        vidroPorCima(ctx, forma, cx);
        fatiaLimao(ctx, cx + S * 0.15, forma.topo + S * 0.02, S * 0.07);
      },
    },

    'chopp-e-cervejas': {
      // Referência: a foto da casa — caneca alta, colarinho branco e denso,
      // líquido dourado cheio de bolhas e vidro coberto de condensação.
      alt: 'Ilustração de uma caneca de chopp gelado, com colarinho denso de espuma, líquido dourado e condensação no vidro.',
      cor: P.amber,
      draw(ctx, S, rnd) {
        const cx = S * 0.47;
        const topo = S * 0.26,
          base = S * 0.84;
        const larg = S * 0.36;
        const alt = base - topo;

        sombraContato(ctx, cx, base + S * 0.012, larg * 0.7, S * 0.03, 0.55);

        // alça
        ctx.save();
        ctx.strokeStyle = 'rgba(232,242,246,0.42)';
        ctx.lineWidth = S * 0.042;
        ctx.beginPath();
        ctx.arc(cx + larg * 0.52, topo + alt * 0.5, S * 0.115, -Math.PI * 0.42, Math.PI * 0.42);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = S * 0.008;
        ctx.beginPath();
        ctx.arc(cx + larg * 0.52, topo + alt * 0.5, S * 0.135, -Math.PI * 0.4, Math.PI * 0.4);
        ctx.stroke();
        ctx.restore();

        // Líquido e espuma. O clip precisa começar acima da borda, senão o
        // colarinho é cortado e sobra uma faixa escura no topo da caneca.
        ctx.save();
        retanguloArredondado(ctx, cx - larg / 2, topo - S * 0.1, larg, alt + S * 0.1, S * 0.028);
        ctx.clip();
        const g = ctx.createLinearGradient(cx - larg / 2, 0, cx + larg / 2, 0);
        g.addColorStop(0, '#C87F16');
        g.addColorStop(0.28, '#F9C051');
        g.addColorStop(0.55, '#EFA02C');
        g.addColorStop(1, '#B86E10');
        ctx.fillStyle = g;
        ctx.fillRect(cx - larg / 2, topo, larg, alt);
        // fundo mais escuro
        const gf = ctx.createLinearGradient(0, base - alt * 0.35, 0, base);
        gf.addColorStop(0, 'rgba(120,66,8,0)');
        gf.addColorStop(1, 'rgba(120,66,8,0.5)');
        ctx.fillStyle = gf;
        ctx.fillRect(cx - larg / 2, base - alt * 0.35, larg, alt * 0.35);

        // colunas de bolhas subindo
        for (let c = 0; c < 5; c++) {
          const bx = cx - larg * 0.34 + c * larg * 0.17 + between(rnd, -4, 4);
          for (let i = 0; i < 13; i++) {
            const by = base - (i / 13) * alt * 0.9 - between(rnd, 0, 10);
            circulo(ctx, bx + between(rnd, -5, 5), by, between(rnd, 1.4, 3.4), 'rgba(255,246,214,0.65)');
          }
        }
        bolhas(ctx, cx, topo + S * 0.08, base - 10, larg * 0.9, 45, rnd, 'rgba(255,250,225,0.4)');

        // colarinho denso
        const yEsp = topo + S * 0.1;
        ctx.fillStyle = '#FFFDF6';
        ctx.beginPath();
        ctx.moveTo(cx - larg / 2, yEsp);
        for (let i = 0; i <= 10; i++) {
          const x = cx - larg / 2 + (i / 10) * larg;
          ctx.quadraticCurveTo(x, yEsp - S * 0.035, x + larg / 20, yEsp - S * 0.005);
        }
        ctx.lineTo(cx + larg / 2, topo - S * 0.1);
        ctx.lineTo(cx - larg / 2, topo - S * 0.1);
        ctx.closePath();
        ctx.fill();
        // textura da espuma
        for (let i = 0; i < 70; i++) {
          const x = cx + between(rnd, -larg * 0.48, larg * 0.48);
          const y = between(rnd, topo - S * 0.08, yEsp - 2);
          circulo(ctx, x, y, between(rnd, 1.5, 4.5), rnd() > 0.5 ? 'rgba(228,218,198,0.55)' : 'rgba(255,255,255,0.7)');
        }
        ctx.restore();

        // vidro e condensação
        ctx.save();
        retanguloArredondado(ctx, cx - larg / 2, topo - S * 0.1, larg, alt + S * 0.1, S * 0.028);
        ctx.clip();
        // gotas
        for (let i = 0; i < 55; i++) {
          const x = cx + between(rnd, -larg * 0.48, larg * 0.48);
          const y = between(rnd, topo, base);
          const r = between(rnd, 1.6, 4.2);
          circulo(ctx, x, y, r, 'rgba(255,255,255,0.34)');
          circulo(ctx, x - r * 0.3, y - r * 0.3, r * 0.4, 'rgba(255,255,255,0.6)');
        }
        // escorridos
        ctx.strokeStyle = 'rgba(255,255,255,0.22)';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        for (let i = 0; i < 5; i++) {
          const x = cx + between(rnd, -larg * 0.42, larg * 0.42);
          const y0 = between(rnd, topo + 10, base - alt * 0.5);
          ctx.beginPath();
          ctx.moveTo(x, y0);
          ctx.lineTo(x + between(rnd, -3, 3), y0 + between(rnd, alt * 0.12, alt * 0.3));
          ctx.stroke();
        }
        // reflexos nas laterais
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(cx - larg * 0.46, topo - S * 0.1, larg * 0.1, alt + S * 0.1);
        ctx.fillStyle = 'rgba(255,255,255,0.11)';
        ctx.fillRect(cx + larg * 0.33, topo - S * 0.1, larg * 0.07, alt + S * 0.1);
        ctx.restore();

        // contorno do vidro
        retanguloArredondado(ctx, cx - larg / 2, topo - S * 0.1, larg, alt + S * 0.1, S * 0.028);
        ctx.strokeStyle = 'rgba(246,250,252,0.7)';
        ctx.lineWidth = 4;
        ctx.stroke();

        especular(ctx, cx - larg * 0.34, topo + alt * 0.22, S * 0.03, S * 0.1, -0.12, 0.45);
      },
    },

    'drinks-e-coqueteis': {
      // Referência: a foto do bar da casa — três taças na bancada de granito,
      // com sombrinha de papel: uma azul com hortelã, uma laranja em degradê
      // sobre granadina e uma cremosa com abacaxi.
      alt: 'Ilustração de três coquetéis do bar do Congresso do Chopp em taças com sombrinha: um azul com hortelã, um laranja em degradê e um cremoso com abacaxi.',
      cor: '#E8913A',
      draw(ctx, S, rnd) {
        /** Taça de coquetel: pé, haste e bojo, com o líquido em degradê. */
        function taca(cx, base, escala, cores, opts) {
          const s = escala;
          const bojoR = S * 0.115 * s;
          const yBojo = base - S * 0.2 * s;
          const alturaHaste = S * 0.115 * s;

          // pé
          ctx.beginPath();
          ctx.ellipse(cx, base, S * 0.072 * s, S * 0.02 * s, 0, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(228,240,244,0.55)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,0.6)';
          ctx.lineWidth = 2;
          ctx.stroke();
          // haste
          ctx.fillStyle = 'rgba(230,242,246,0.45)';
          ctx.fillRect(cx - S * 0.011 * s, base - alturaHaste, S * 0.022 * s, alturaHaste);

          // bojo: perfil de taça (mais largo em cima)
          const topo = yBojo - bojoR * 1.15;
          const contorno = () => {
            ctx.beginPath();
            ctx.moveTo(cx - bojoR, topo);
            ctx.bezierCurveTo(
              cx - bojoR * 1.02, topo + bojoR * 1.5,
              cx - bojoR * 0.34, yBojo + bojoR * 0.72,
              cx, yBojo + bojoR * 0.78,
            );
            ctx.bezierCurveTo(
              cx + bojoR * 0.34, yBojo + bojoR * 0.72,
              cx + bojoR * 1.02, topo + bojoR * 1.5,
              cx + bojoR, topo,
            );
            ctx.closePath();
          };

          // líquido
          ctx.save();
          contorno();
          ctx.clip();
          const g = ctx.createLinearGradient(0, topo, 0, yBojo + bojoR * 0.8);
          cores.forEach((c, i) => g.addColorStop(i / (cores.length - 1), c));
          ctx.fillStyle = g;
          ctx.fillRect(cx - bojoR * 1.1, topo + bojoR * 0.22, bojoR * 2.2, bojoR * 3);
          // bolhas e brilho interno
          bolhas(ctx, cx, topo + bojoR * 0.5, yBojo + bojoR * 0.5, bojoR * 1.4, 16, rnd, 'rgba(255,255,255,0.3)');
          if (opts && opts.gelo) {
            gelo(ctx, cx - bojoR * 0.35, topo + bojoR * 0.6, bojoR * 0.6, 0.4);
            gelo(ctx, cx + bojoR * 0.3, topo + bojoR * 0.95, bojoR * 0.52, -0.5);
          }
          ctx.restore();

          // vidro
          contorno();
          ctx.strokeStyle = 'rgba(246,250,252,0.75)';
          ctx.lineWidth = 3.5;
          ctx.stroke();
          ctx.save();
          contorno();
          ctx.clip();
          ctx.fillStyle = 'rgba(255,255,255,0.2)';
          ctx.fillRect(cx - bojoR, topo, bojoR * 0.3, bojoR * 3);
          ctx.restore();
          especular(ctx, cx - bojoR * 0.5, topo + bojoR * 0.7, bojoR * 0.22, bojoR * 0.5, -0.3, 0.5);

          // sombrinha de papel
          if (opts && opts.sombrinha) {
            const sx = cx + bojoR * 0.35;
            const sy = topo - bojoR * 0.5;
            ctx.save();
            ctx.strokeStyle = '#C9B79A';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(sx - bojoR * 0.12, sy + bojoR * 1.1);
            ctx.stroke();
            ctx.translate(sx, sy);
            ctx.rotate(-0.12);
            const raio = bojoR * 0.66;
            for (let i = 0; i < 8; i++) {
              const a0 = Math.PI + (i / 8) * Math.PI;
              const a1 = Math.PI + ((i + 1) / 8) * Math.PI;
              ctx.beginPath();
              ctx.moveTo(0, 0);
              ctx.arc(0, 0, raio, a0, a1);
              ctx.closePath();
              ctx.fillStyle = i % 2 ? opts.sombrinha : '#F6F1EA';
              ctx.fill();
              ctx.strokeStyle = 'rgba(0,0,0,0.18)';
              ctx.lineWidth = 1;
              ctx.stroke();
            }
            ctx.restore();
          }

          // guarnição na borda
          if (opts && opts.enfeite === 'laranja') {
            const gx = cx + bojoR * 0.82;
            const gy = topo + bojoR * 0.12;
            ctx.save();
            ctx.translate(gx, gy);
            ctx.rotate(0.35);
            ctx.beginPath();
            ctx.arc(0, 0, bojoR * 0.5, Math.PI * 0.1, Math.PI * 1.1);
            ctx.closePath();
            ctx.fillStyle = '#F0A33A';
            ctx.fill();
            ctx.strokeStyle = '#D9822A';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
          } else if (opts && opts.enfeite === 'abacaxi') {
            const gx = cx + bojoR * 0.25;
            ctx.save();
            ctx.translate(gx, topo - bojoR * 0.1);
            ctx.rotate(0.12);
            retanguloArredondado(ctx, -bojoR * 0.17, -bojoR * 0.85, bojoR * 0.34, bojoR * 1.1, bojoR * 0.08);
            ctx.fillStyle = '#EFD470';
            ctx.fill();
            ctx.strokeStyle = '#C9A93E';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.restore();
          } else if (opts && opts.enfeite === 'hortela') {
            folhaVerde(ctx, cx - bojoR * 0.5, topo - bojoR * 0.08, bojoR * 0.42, -0.5, '#4E8B3C');
            folhaVerde(ctx, cx - bojoR * 0.75, topo + bojoR * 0.1, bojoR * 0.34, 0.4, '#6FA84B');
            fatiaLimao(ctx, cx - bojoR * 0.62, topo + bojoR * 0.42, bojoR * 0.3);
          }
        }

        const base = S * 0.855;
        // atrás: taça azul
        sombraContato(ctx, S * 0.27, base + S * 0.012, S * 0.1, S * 0.028, 0.45);
        taca(S * 0.27, base - S * 0.02, 0.88, ['#7FD8F2', '#2E8FD6', '#1B5FAF'], {
          sombrinha: '#6EC8E8',
          enfeite: 'hortela',
          gelo: true,
        });
        // atrás: taça cremosa
        sombraContato(ctx, S * 0.74, base + S * 0.012, S * 0.1, S * 0.028, 0.45);
        taca(S * 0.74, base - S * 0.02, 0.88, ['#FBF3E4', '#F0E2C8', '#D9C29A'], {
          sombrinha: '#8FD3B8',
          enfeite: 'abacaxi',
        });
        // frente: taça laranja (a principal)
        sombraContato(ctx, S * 0.5, base + S * 0.016, S * 0.13, S * 0.034, 0.55);
        taca(S * 0.5, base, 1.08, ['#FBC65A', '#F0842E', '#D4321F', '#8E1020'], {
          sombrinha: '#E86B9A',
          enfeite: 'laranja',
        });
      },
    },

    'churrasco-no-espeto': {
      alt: 'Ilustração de um espeto de churrasco com picanha, linguiça e frango, servido na mesa.',
      cor: '#B04A38',
      draw(ctx, S, rnd) {
        const cx = S * 0.5;
        // prato de base
        ctx.beginPath();
        ctx.ellipse(cx, S * 0.86, S * 0.2, S * 0.05, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFDF8';
        sombra(ctx, () => ctx.fill(), 16);
        ctx.fill();
        // espeto
        ctx.save();
        ctx.strokeStyle = '#C9C2B4';
        ctx.lineWidth = S * 0.022;
        ctx.beginPath();
        ctx.moveTo(cx, S * 0.16);
        ctx.lineTo(cx, S * 0.86);
        ctx.stroke();
        // cabo de madeira no topo
        ctx.strokeStyle = '#6B4A2F';
        ctx.lineWidth = S * 0.032;
        ctx.beginPath();
        ctx.moveTo(cx, S * 0.14);
        ctx.lineTo(cx, S * 0.24);
        ctx.stroke();
        ctx.restore();

        // peças enfiadas, de cima para baixo
        const pecas = [
          { y: 0.34, tipo: 'picanha' },
          { y: 0.48, tipo: 'linguica' },
          { y: 0.6, tipo: 'linguica' },
          { y: 0.73, tipo: 'picanha' },
        ];
        for (const p of pecas) {
          const y = S * p.y;
          if (p.tipo === 'picanha') {
            const w = S * 0.3,
              hh = S * 0.15;
            retanguloArredondado(ctx, cx - w / 2, y - hh / 2, w, hh, hh * 0.35);
            const g = ctx.createLinearGradient(0, y - hh / 2, 0, y + hh / 2);
            g.addColorStop(0, '#8A392A');
            g.addColorStop(0.5, '#6E2A20');
            g.addColorStop(1, '#4A1912');
            ctx.fillStyle = g;
            sombra(ctx, () => ctx.fill(), 14);
            ctx.fill();
            // capa de gordura
            retanguloArredondado(ctx, cx - w / 2, y - hh / 2, w, hh * 0.26, hh * 0.2);
            ctx.fillStyle = '#EFE2C4';
            ctx.fill();
            // ponto rosado
            retanguloArredondado(ctx, cx - w * 0.36, y - hh * 0.1, w * 0.72, hh * 0.34, 4);
            ctx.fillStyle = hexA('#C4564A', 0.8);
            ctx.fill();
            // sal grosso
            for (let i = 0; i < 10; i++) {
              circulo(ctx, cx + between(rnd, -w * 0.44, w * 0.44), y + between(rnd, -hh * 0.3, hh * 0.4), 2, 'rgba(255,255,255,0.8)');
            }
          } else {
            // Gomos de linguiça: elipse achatada, tom mais marrom e a marca da
            // tripa, senão a peça vira um tomate vermelho no espeto.
            for (let k = -1; k <= 1; k++) {
              const x = cx + k * S * 0.088;
              ctx.save();
              ctx.translate(x, y);
              ctx.rotate(between(rnd, -0.12, 0.12));
              ctx.beginPath();
              ctx.ellipse(0, 0, S * 0.062, S * 0.05, 0, 0, Math.PI * 2);
              const g = ctx.createLinearGradient(0, -S * 0.05, 0, S * 0.05);
              g.addColorStop(0, '#9C4A22');
              g.addColorStop(0.45, '#7E3418');
              g.addColorStop(1, '#4E1D0E');
              ctx.fillStyle = g;
              sombra(ctx, () => ctx.fill(), 10);
              ctx.fill();
              // tripa tostada
              ctx.beginPath();
              ctx.ellipse(0, 0, S * 0.062, S * 0.05, 0, 0, Math.PI * 2);
              ctx.strokeStyle = 'rgba(40,18,8,0.65)';
              ctx.lineWidth = 3;
              ctx.stroke();
              // gordura entremeada
              ctx.save();
              ctx.beginPath();
              ctx.ellipse(0, 0, S * 0.055, S * 0.044, 0, 0, Math.PI * 2);
              ctx.clip();
              ctx.globalAlpha = 0.5;
              for (let i = 0; i < 9; i++) {
                circulo(ctx, between(rnd, -18, 18), between(rnd, -14, 14), between(rnd, 1.8, 3.6), '#E8C79A');
              }
              ctx.restore();
              especular(ctx, -S * 0.018, -S * 0.016, S * 0.02, S * 0.012, -0.3, 0.3);
              ctx.restore();
            }
          }
        }
      },
    },

    sobremesas: {
      alt: 'Ilustração de um pudim de leite condensado com calda de caramelo escorrendo.',
      cor: '#C4864A',
      draw(ctx, S, rnd) {
        const cx = S / 2,
          cy = S * 0.6;
        // prato
        ctx.beginPath();
        ctx.ellipse(cx, cy + S * 0.16, S * 0.34, S * 0.1, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFDF8';
        sombra(ctx, () => ctx.fill(), 24);
        ctx.fill();
        // poça de calda
        ctx.beginPath();
        ctx.ellipse(cx, cy + S * 0.16, S * 0.26, S * 0.072, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#8A4A16';
        ctx.fill();

        // corpo do pudim (tronco de cone com furo no meio)
        const rTopo = S * 0.19,
          rBase = S * 0.23,
          alt = S * 0.24;
        ctx.beginPath();
        ctx.moveTo(cx - rTopo, cy - alt / 2);
        ctx.lineTo(cx + rTopo, cy - alt / 2);
        ctx.lineTo(cx + rBase, cy + alt / 2);
        ctx.lineTo(cx - rBase, cy + alt / 2);
        ctx.closePath();
        const g = ctx.createLinearGradient(cx - rBase, 0, cx + rBase, 0);
        g.addColorStop(0, '#D99A3E');
        g.addColorStop(0.4, '#F6D488');
        g.addColorStop(1, '#C98A32');
        ctx.fillStyle = g;
        sombra(ctx, () => ctx.fill(), 18);
        ctx.fill();
        // base arredondada
        ctx.beginPath();
        ctx.ellipse(cx, cy + alt / 2, rBase, S * 0.05, 0, 0, Math.PI);
        ctx.fillStyle = '#C98A32';
        ctx.fill();
        // topo
        ctx.beginPath();
        ctx.ellipse(cx, cy - alt / 2, rTopo, S * 0.055, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#F8DC9A';
        ctx.fill();
        // furo central
        ctx.beginPath();
        ctx.ellipse(cx, cy - alt / 2, rTopo * 0.34, S * 0.02, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#A8631F';
        ctx.fill();
        // calda escorrendo
        ctx.save();
        ctx.strokeStyle = '#A8631F';
        ctx.lineWidth = S * 0.026;
        ctx.lineCap = 'round';
        for (let i = 0; i < 5; i++) {
          const x = cx - rTopo * 0.85 + (i / 4) * rTopo * 1.7;
          ctx.beginPath();
          ctx.moveTo(x, cy - alt / 2 + S * 0.02);
          ctx.quadraticCurveTo(x + between(rnd, -8, 8), cy, x + between(rnd, -10, 10), cy + between(rnd, alt * 0.3, alt * 0.5));
          ctx.stroke();
        }
        ctx.restore();
        // brilho
        ctx.save();
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.ellipse(cx - rTopo * 0.45, cy - alt * 0.12, S * 0.03, S * 0.075, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      },
    },
  };

  /* -------------------------------------------------------- Cenas do salão -- */

  function chao(ctx, w, h, yHorizonte) {
    const g = ctx.createLinearGradient(0, yHorizonte, 0, h);
    g.addColorStop(0, '#2E2018');
    g.addColorStop(1, '#191310');
    ctx.fillStyle = g;
    ctx.fillRect(0, yHorizonte, w, h - yHorizonte);
    ctx.save();
    ctx.globalAlpha = 0.14;
    ctx.strokeStyle = '#C99A5A';
    ctx.lineWidth = 2;
    for (let i = -20; i < 40; i++) {
      const x = (i / 20) * w;
      ctx.beginPath();
      ctx.moveTo(w / 2 + (x - w / 2) * 0.25, yHorizonte);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    ctx.restore();
  }

  function parede(ctx, w, yHorizonte) {
    const g = ctx.createLinearGradient(0, 0, 0, yHorizonte);
    g.addColorStop(0, '#231C17');
    g.addColorStop(1, '#33261D');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, yHorizonte);
  }

  function luminaria(ctx, x, yTeto, comprimento, raio) {
    ctx.strokeStyle = '#4A3B30';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x, yTeto);
    ctx.lineTo(x, yTeto + comprimento);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - raio, yTeto + comprimento + raio * 0.8);
    ctx.quadraticCurveTo(x, yTeto + comprimento - raio * 0.5, x + raio, yTeto + comprimento + raio * 0.8);
    ctx.closePath();
    ctx.fillStyle = '#3D3129';
    ctx.fill();
    circulo(ctx, x, yTeto + comprimento + raio * 0.7, raio * 0.3, P.amberClaro);
    const g = ctx.createRadialGradient(x, yTeto + comprimento + raio, 0, x, yTeto + comprimento + raio, raio * 5);
    g.addColorStop(0, hexA(P.amber, 0.3));
    g.addColorStop(1, hexA(P.amber, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, yTeto + comprimento + raio, raio * 5, 0, Math.PI * 2);
    ctx.fill();
  }

  function mesaComCadeiras(ctx, x, y, escala) {
    const s = escala;
    // cadeiras
    for (const dx of [-1, 1]) {
      ctx.save();
      ctx.translate(x + dx * 62 * s, y + 6 * s);
      retanguloArredondado(ctx, -14 * s, -34 * s, 28 * s, 46 * s, 6 * s);
      ctx.fillStyle = '#3E2E23';
      ctx.fill();
      ctx.restore();
    }
    // tampo
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(x, y, 62 * s, 20 * s, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#7A5433';
    sombra(ctx, () => ctx.fill(), 18 * s);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x, y - 4 * s, 62 * s, 20 * s, 0, 0, Math.PI * 2);
    const g = ctx.createLinearGradient(x - 62 * s, y, x + 62 * s, y);
    g.addColorStop(0, '#96693F');
    g.addColorStop(1, '#6E4A2C');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.restore();
    // pé
    ctx.fillStyle = '#3E2E23';
    ctx.fillRect(x - 6 * s, y, 12 * s, 44 * s);
    ctx.beginPath();
    ctx.ellipse(x, y + 46 * s, 26 * s, 8 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    // pratos e copos
    for (const dx of [-26, 26]) {
      ctx.beginPath();
      ctx.ellipse(x + dx * s, y - 6 * s, 16 * s, 6 * s, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#EFE8DA';
      ctx.fill();
    }
    ctx.fillStyle = hexA(P.amberClaro, 0.85);
    ctx.fillRect(x - 4 * s, y - 22 * s, 9 * s, 16 * s);
  }

  /* Paleta observada nas fotos reais do salão: parede creme com faixa bordô,
     colunas de tijolinho bege, piso de cerâmica clara, mesas de madeira
     escura e cadeiras pretas com assento creme. */
  const R = {
    parede: '#E4DAC8',
    paredeSombra: '#CFC2AC',
    bordo: '#7A1F2B',
    tijolo: '#C9B08A',
    tijoloEscuro: '#B3986E',
    piso: '#D8D2C6',
    pisoLinha: '#BDB6A8',
    teto: '#F2EFE9',
    madeiraMesa: '#3A2318',
    madeiraTampo: '#4E3020',
    cadeira: '#1E1A18',
    assento: '#EFE9DC',
    granito: '#5A544C',
    inox: '#B9BDC2',
  };

  function pisoCeramico(ctx, w, h, yH) {
    ctx.fillStyle = R.piso;
    ctx.fillRect(0, yH, w, h - yH);
    ctx.save();
    ctx.strokeStyle = R.pisoLinha;
    ctx.lineWidth = 2;
    // fugas em perspectiva
    for (let i = -14; i <= 14; i++) {
      const x = w / 2 + (i / 7) * w;
      ctx.beginPath();
      ctx.moveTo(w / 2 + (x - w / 2) * 0.14, yH);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    let y = yH;
    let passo = (h - yH) * 0.07;
    while (y < h) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
      y += passo;
      passo *= 1.32;
    }
    ctx.restore();
  }

  function colunaTijolo(ctx, x, yTopo, yBase, larg) {
    const g = ctx.createLinearGradient(x, 0, x + larg, 0);
    g.addColorStop(0, R.tijolo);
    g.addColorStop(0.6, '#DCC7A4');
    g.addColorStop(1, R.tijoloEscuro);
    ctx.fillStyle = g;
    ctx.fillRect(x, yTopo, larg, yBase - yTopo);
    ctx.save();
    ctx.strokeStyle = 'rgba(120,95,60,0.35)';
    ctx.lineWidth = 2;
    let n = 0;
    for (let y = yTopo; y < yBase; y += 16) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + larg, y);
      ctx.stroke();
      const off = n % 2 ? larg / 2 : 0;
      ctx.beginPath();
      ctx.moveTo(x + off, y);
      ctx.lineTo(x + off, y + 16);
      ctx.stroke();
      n++;
    }
    ctx.restore();
  }

  function paredeSalao(ctx, w, yH) {
    ctx.fillStyle = R.teto;
    ctx.fillRect(0, 0, w, yH * 0.3);
    const g = ctx.createLinearGradient(0, yH * 0.3, 0, yH);
    g.addColorStop(0, R.parede);
    g.addColorStop(1, R.paredeSombra);
    ctx.fillStyle = g;
    ctx.fillRect(0, yH * 0.3, w, yH * 0.7);
    // faixa bordô no alto da parede
    ctx.fillStyle = R.bordo;
    ctx.fillRect(0, yH * 0.3, w, yH * 0.14);
  }

  function luminariaEmbutida(ctx, x, y, larg) {
    retanguloArredondado(ctx, x - larg / 2, y - larg * 0.22, larg, larg * 0.44, 4);
    ctx.fillStyle = '#FFFDF2';
    ctx.fill();
    const g = ctx.createRadialGradient(x, y, 0, x, y, larg * 1.6);
    g.addColorStop(0, 'rgba(255,246,214,0.5)');
    g.addColorStop(1, 'rgba(255,246,214,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, larg * 1.6, 0, Math.PI * 2);
    ctx.fill();
  }

  function pendenteCone(ctx, x, yTeto, comprimento, raio) {
    ctx.strokeStyle = '#1E1A18';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x, yTeto);
    ctx.lineTo(x, yTeto + comprimento);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - raio, yTeto + comprimento + raio);
    ctx.lineTo(x + raio, yTeto + comprimento + raio);
    ctx.lineTo(x + raio * 0.35, yTeto + comprimento);
    ctx.lineTo(x - raio * 0.35, yTeto + comprimento);
    ctx.closePath();
    ctx.fillStyle = '#22201E';
    ctx.fill();
    circulo(ctx, x, yTeto + comprimento + raio * 0.9, raio * 0.34, '#FFD98A');
    const g = ctx.createRadialGradient(
      x, yTeto + comprimento + raio, 0,
      x, yTeto + comprimento + raio, raio * 4.5,
    );
    g.addColorStop(0, 'rgba(255,196,90,0.32)');
    g.addColorStop(1, 'rgba(255,196,90,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, yTeto + comprimento + raio, raio * 4.5, 0, Math.PI * 2);
    ctx.fill();
  }

  /** Encosto de cadeira preta com ripas horizontais (o modelo da casa). */
  function encostoCadeira(ctx, cx, yTopo, larg, alt) {
    ctx.fillStyle = R.cadeira;
    retanguloArredondado(ctx, cx - larg / 2, yTopo, larg, alt, larg * 0.1);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    const ripas = 3;
    for (let k = 0; k < ripas; k++) {
      ctx.fillRect(cx - larg * 0.38, yTopo + alt * (0.16 + k * 0.26), larg * 0.76, alt * 0.13);
    }
  }

  /**
   * Mesa retangular de madeira escura, posta, com cadeiras pretas de assento
   * creme. Desenhada em três planos (cadeiras de trás, mesa, cadeiras da
   * frente) para dar profundidade sem precisar de perspectiva real.
   */
  function mesaSalao(ctx, x, y, escala, lugares) {
    const s = escala;
    const larg = 230 * s;
    const prof = 74 * s;
    const passo = larg / lugares;

    // cadeiras do fundo — só o encosto aparece acima do tampo
    for (let i = 0; i < lugares; i++) {
      const cx = x - larg / 2 + (i + 0.5) * passo;
      encostoCadeira(ctx, cx, y - 52 * s, passo * 0.62, 56 * s);
    }

    // tampo em leve perspectiva
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x - larg / 2, y);
    ctx.lineTo(x + larg / 2, y);
    ctx.lineTo(x + larg / 2 + 16 * s, y + prof);
    ctx.lineTo(x - larg / 2 - 16 * s, y + prof);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, y, 0, y + prof);
    g.addColorStop(0, '#6B4128');
    g.addColorStop(0.45, R.madeiraTampo);
    g.addColorStop(1, R.madeiraMesa);
    ctx.fillStyle = g;
    sombra(ctx, () => ctx.fill(), 26 * s);
    ctx.fill();
    // veio da madeira
    ctx.strokeStyle = 'rgba(0,0,0,0.16)';
    ctx.lineWidth = 1.5 * s;
    for (let i = 1; i < 4; i++) {
      const yy = y + (i / 4) * prof;
      ctx.beginPath();
      ctx.moveTo(x - larg / 2 - 16 * s * (i / 4), yy);
      ctx.lineTo(x + larg / 2 + 16 * s * (i / 4), yy);
      ctx.stroke();
    }
    // brilho da luz pendente no tampo
    const gl = ctx.createRadialGradient(x, y + prof * 0.3, 0, x, y + prof * 0.3, larg * 0.5);
    gl.addColorStop(0, 'rgba(255,200,110,0.18)');
    gl.addColorStop(1, 'rgba(255,200,110,0)');
    ctx.fillStyle = gl;
    ctx.fill();
    ctx.restore();

    // pratos brancos e talheres
    for (let i = 0; i < lugares; i++) {
      const cx = x - larg / 2 + (i + 0.5) * passo;
      const py = y + prof * 0.38;
      const pr = passo * 0.3;
      ctx.beginPath();
      ctx.ellipse(cx, py, pr, pr * 0.36, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFDF8';
      sombra(ctx, () => ctx.fill(), 8 * s);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx, py, pr * 0.64, pr * 0.23, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0,0,0,0.12)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // jogo americano
      ctx.strokeStyle = 'rgba(255,255,255,0.14)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(cx, py, pr * 1.35, pr * 0.5, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // porta-guardanapo bordô no centro
    ctx.fillStyle = R.bordo;
    retanguloArredondado(ctx, x - 11 * s, y + prof * 0.06, 22 * s, 20 * s, 3 * s);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(x - 7 * s, y + prof * 0.1, 14 * s, 4 * s);

    // cadeiras da frente — assento creme visível e encosto de costas
    for (let i = 0; i < lugares; i++) {
      const cx = x - larg / 2 + (i + 0.5) * passo;
      ctx.fillStyle = R.assento;
      retanguloArredondado(ctx, cx - passo * 0.33, y + prof + 2 * s, passo * 0.66, 16 * s, 4 * s);
      sombra(ctx, () => ctx.fill(), 8 * s);
      ctx.fill();
      encostoCadeira(ctx, cx, y + prof + 16 * s, passo * 0.7, 58 * s);
    }
  }

  const cenas = {
    'salao-principal': {
      alt: 'Ilustração do salão do Congresso do Chopp: mesas de madeira postas com pratos brancos, cadeiras pretas com assento claro, colunas de tijolinho e luminárias pendentes.',
      draw(ctx, w, h, rnd) {
        const yH = h * 0.52;
        paredeSalao(ctx, w, yH);
        pisoCeramico(ctx, w, h, yH);

        // luminárias embutidas no teto
        for (let i = 0; i < 5; i++) luminariaEmbutida(ctx, w * (0.12 + i * 0.19), yH * 0.13, w * 0.055);

        // colunas de tijolinho
        colunaTijolo(ctx, w * 0.055, yH * 0.16, yH, w * 0.075);
        colunaTijolo(ctx, w * 0.87, yH * 0.16, yH, w * 0.075);

        // televisão na parede
        retanguloArredondado(ctx, w * 0.44, yH * 0.34, w * 0.14, h * 0.1, 5);
        ctx.fillStyle = '#15181C';
        ctx.fill();
        ctx.fillStyle = 'rgba(120,190,215,0.55)';
        ctx.fillRect(w * 0.447, yH * 0.34 + 6, w * 0.126, h * 0.1 - 12);

        // vãos laterais: buffet e balcão iluminados ao fundo
        for (const vao of [
          { x: w * 0.16, larg: w * 0.22 },
          { x: w * 0.62, larg: w * 0.21 },
        ]) {
          retanguloArredondado(ctx, vao.x, yH * 0.48, vao.larg, yH * 0.52, 4);
          ctx.fillStyle = '#3B342C';
          ctx.fill();
          // brilho quente do balcão
          const g = ctx.createLinearGradient(0, yH * 0.48, 0, yH);
          g.addColorStop(0, 'rgba(255,196,90,0.10)');
          g.addColorStop(0.55, 'rgba(255,196,90,0.34)');
          g.addColorStop(1, 'rgba(255,196,90,0.06)');
          ctx.fillStyle = g;
          ctx.fill();
          // cubas do buffet insinuadas
          ctx.fillStyle = 'rgba(215,220,226,0.55)';
          ctx.fillRect(vao.x + 6, yH * 0.74, vao.larg - 12, yH * 0.05);
          ctx.fillStyle = 'rgba(120,80,30,0.45)';
          ctx.fillRect(vao.x + 6, yH * 0.79, vao.larg - 12, yH * 0.21);
          ctx.strokeStyle = 'rgba(0,0,0,0.28)';
          ctx.lineWidth = 3;
          ctx.strokeRect(vao.x, yH * 0.48, vao.larg, yH * 0.52);
        }

        // pendentes
        pendenteCone(ctx, w * 0.24, yH * 0.05, h * 0.1, 22);
        pendenteCone(ctx, w * 0.4, yH * 0.05, h * 0.14, 20);
        pendenteCone(ctx, w * 0.62, yH * 0.05, h * 0.1, 22);

        // mesas, da mais distante para a mais próxima
        mesaSalao(ctx, w * 0.5, h * 0.56, 0.62, 3);
        mesaSalao(ctx, w * 0.3, h * 0.68, 0.85, 3);
        mesaSalao(ctx, w * 0.76, h * 0.72, 0.92, 3);
        mesaSalao(ctx, w * 0.5, h * 0.9, 1.25, 4);
      },
    },

    'buffet-completo': {
      alt: 'Ilustração do balcão de buffet do Congresso do Chopp, com cubas de inox cheias, protetor de vidro e iluminação quente.',
      draw(ctx, w, h, rnd) {
        const yH = h * 0.5;
        paredeSalao(ctx, w, yH);
        pisoCeramico(ctx, w, h, yH);
        for (let i = 0; i < 4; i++) luminariaEmbutida(ctx, w * (0.16 + i * 0.23), yH * 0.12, w * 0.05);

        const yTampo = h * 0.62;
        const yBase = h * 0.95;

        // corpo do balcão em madeira escura
        ctx.fillStyle = R.madeiraMesa;
        ctx.fillRect(w * 0.04, yTampo, w * 0.92, yBase - yTampo);
        ctx.save();
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 3;
        for (let i = 1; i < 6; i++) {
          const x = w * 0.04 + (i / 6) * w * 0.92;
          ctx.beginPath();
          ctx.moveTo(x, yTampo);
          ctx.lineTo(x, yBase);
          ctx.stroke();
        }
        ctx.restore();

        // tampo de granito
        ctx.fillStyle = R.granito;
        ctx.fillRect(w * 0.03, yTampo - h * 0.035, w * 0.94, h * 0.04);
        ctx.save();
        ctx.globalAlpha = 0.25;
        for (let i = 0; i < 60; i++) {
          circulo(ctx, between(rnd, w * 0.03, w * 0.97), between(rnd, yTampo - h * 0.033, yTampo), between(rnd, 1, 3), '#D8D2C6');
        }
        ctx.restore();

        // cubas de inox com comida
        const comidas = ['#C4402A', '#E8A93E', '#7CB05A', '#F2C55C', '#8A5A22', '#D9622A', '#B04A38'];
        for (let i = 0; i < 7; i++) {
          const cw = w * 0.115;
          const x = w * 0.07 + i * (cw + w * 0.015);
          const yc = yTampo - h * 0.075;
          // cuba
          retanguloArredondado(ctx, x, yc, cw, h * 0.045, 4);
          ctx.fillStyle = R.inox;
          ctx.fill();
          ctx.strokeStyle = '#8E9298';
          ctx.lineWidth = 2;
          ctx.stroke();
          // comida
          ctx.save();
          retanguloArredondado(ctx, x + 4, yc + 4, cw - 8, h * 0.03, 3);
          ctx.clip();
          ctx.fillStyle = comidas[i];
          ctx.fillRect(x + 4, yc + 4, cw - 8, h * 0.03);
          for (let k = 0; k < 18; k++) {
            circulo(ctx, between(rnd, x + 6, x + cw - 6), between(rnd, yc + 6, yc + h * 0.032), between(rnd, 2, 5), 'rgba(255,255,255,0.22)');
          }
          ctx.restore();
        }

        // protetor de vidro
        ctx.save();
        ctx.strokeStyle = 'rgba(230,240,245,0.75)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(w * 0.05, yTampo - h * 0.075);
        ctx.lineTo(w * 0.05, yTampo - h * 0.2);
        ctx.lineTo(w * 0.95, yTampo - h * 0.2);
        ctx.lineTo(w * 0.95, yTampo - h * 0.075);
        ctx.stroke();
        ctx.fillStyle = 'rgba(220,240,250,0.12)';
        ctx.fillRect(w * 0.05, yTampo - h * 0.2, w * 0.9, h * 0.125);
        ctx.restore();

        // trilho de luz quente sobre o buffet
        ctx.fillStyle = '#2B2724';
        ctx.fillRect(w * 0.05, yTampo - h * 0.235, w * 0.9, h * 0.018);
        for (let i = 0; i < 6; i++) {
          const x = w * 0.12 + i * w * 0.152;
          circulo(ctx, x, yTampo - h * 0.222, 7, '#FFD98A');
          const g = ctx.createRadialGradient(x, yTampo - h * 0.21, 0, x, yTampo - h * 0.21, h * 0.14);
          g.addColorStop(0, 'rgba(255,196,90,0.3)');
          g.addColorStop(1, 'rgba(255,196,90,0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(x, yTampo - h * 0.21, h * 0.14, 0, Math.PI * 2);
          ctx.fill();
        }

        // pilha de pratos na ponta
        for (let i = 0; i < 7; i++) {
          ctx.beginPath();
          ctx.ellipse(w * 0.9, yTampo - h * 0.045 - i * 5, 30, 9, 0, 0, Math.PI * 2);
          ctx.fillStyle = i % 2 ? '#FFFDF8' : '#EDE7DA';
          ctx.fill();
        }
      },
    },

    'area-kids': {
      alt: 'Ilustração da área kids do Congresso do Chopp, com escorregador, piscina de bolinhas e balões.',
      draw(ctx, w, h, rnd) {
        const yH = h * 0.56;
        paredeSalao(ctx, w, yH);
        pisoCeramico(ctx, w, h, yH);
        for (let i = 0; i < 4; i++) luminariaEmbutida(ctx, w * (0.16 + i * 0.23), yH * 0.12, w * 0.05);
        colunaTijolo(ctx, w * 0.9, yH * 0.16, yH, w * 0.07);
        // tapete emborrachado colorido
        ctx.beginPath();
        ctx.ellipse(w * 0.5, h * 0.82, w * 0.42, h * 0.16, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#3E7F8C';
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(w * 0.5, h * 0.82, w * 0.36, h * 0.13, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#4C93A0';
        ctx.fill();
        // escorregador
        ctx.save();
        ctx.fillStyle = '#C4402A';
        retanguloArredondado(ctx, w * 0.16, yH - h * 0.22, w * 0.1, h * 0.28, 10);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(w * 0.26, yH - h * 0.2);
        ctx.quadraticCurveTo(w * 0.36, yH + h * 0.06, w * 0.46, h * 0.79);
        ctx.lineTo(w * 0.46, h * 0.85);
        ctx.quadraticCurveTo(w * 0.34, yH + h * 0.11, w * 0.26, yH - h * 0.13);
        ctx.closePath();
        ctx.fillStyle = P.amber;
        ctx.fill();
        ctx.strokeStyle = '#B07213';
        ctx.lineWidth = 4;
        ctx.stroke();
        // escada
        ctx.strokeStyle = '#8FBF6A';
        ctx.lineWidth = 7;
        for (let i = 0; i < 4; i++) {
          const y = yH - h * 0.18 + i * h * 0.06;
          ctx.beginPath();
          ctx.moveTo(w * 0.16, y);
          ctx.lineTo(w * 0.26, y);
          ctx.stroke();
        }
        ctx.restore();
        // piscina de bolinhas
        ctx.beginPath();
        ctx.ellipse(w * 0.72, h * 0.8, w * 0.2, h * 0.11, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#2E5A6B';
        ctx.fill();
        const cores = ['#E2542B', '#F5A524', '#7CB05A', '#5FA8C4', '#E86B9A', '#F6F1EA'];
        for (let i = 0; i < 46; i++) {
          const a = rnd() * Math.PI * 2;
          const rr = Math.sqrt(rnd());
          const x = w * 0.72 + Math.cos(a) * rr * w * 0.19;
          const y = h * 0.8 + Math.sin(a) * rr * h * 0.1;
          circulo(ctx, x, y, between(rnd, 9, 15), cores[Math.floor(rnd() * cores.length)]);
        }
        // balões
        for (let i = 0; i < 5; i++) {
          const x = w * (0.1 + i * 0.2) + between(rnd, -20, 20);
          const y = h * between(rnd, 0.1, 0.26);
          const cor = cores[i % cores.length];
          ctx.beginPath();
          ctx.ellipse(x, y, 26, 32, 0, 0, Math.PI * 2);
          ctx.fillStyle = cor;
          ctx.fill();
          circulo(ctx, x - 8, y - 10, 6, 'rgba(255,255,255,0.4)');
          ctx.strokeStyle = 'rgba(246,241,234,0.35)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x, y + 32);
          ctx.quadraticCurveTo(x + 12, y + 70, x - 4, y + 110);
          ctx.stroke();
        }
      },
    },

    eventos: {
      alt: 'Ilustração da decoração de um casamento no salão de eventos do Congresso do Chopp: arco florido, bolo de andares e mesa de doces.',
      draw(ctx, w, h, rnd) {
        const yH = h * 0.72;

        // fundo ripado de madeira, como nas decorações do salão
        ctx.fillStyle = '#4A3121';
        ctx.fillRect(0, 0, w, yH);
        ctx.save();
        ctx.strokeStyle = 'rgba(0,0,0,0.32)';
        ctx.lineWidth = 5;
        for (let x = 0; x < w; x += w * 0.028) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, yH);
          ctx.stroke();
        }
        ctx.restore();
        pisoCeramico(ctx, w, h, yH);

        // lâmpadas quentes embutidas no ripado
        for (let i = 0; i < 3; i++) {
          const x = w * (0.3 + i * 0.2);
          const y = h * 0.3;
          circulo(ctx, x, y, 11, '#FFD98A');
          const g = ctx.createRadialGradient(x, y, 0, x, y, h * 0.16);
          g.addColorStop(0, 'rgba(255,200,110,0.4)');
          g.addColorStop(1, 'rgba(255,200,110,0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(x, y, h * 0.16, 0, Math.PI * 2);
          ctx.fill();
        }

        // arco florido
        const flores = ['#F2F0EA', '#E8A9C0', '#D4587E', '#F5C6D6', '#EFE3B8'];
        const folhas = ['#4E8B3C', '#3F6B32', '#6FA84B'];
        for (let i = 0; i <= 60; i++) {
          const t = i / 60;
          const x = w * 0.12 + t * w * 0.76;
          const y = h * 0.62 - Math.sin(t * Math.PI) * h * 0.44;
          // folhagem
          for (let k = 0; k < 2; k++) {
            folhaVerde(
              ctx,
              x + between(rnd, -16, 16),
              y + between(rnd, -16, 16),
              between(rnd, 10, 19),
              rnd() * Math.PI,
              folhas[Math.floor(rnd() * folhas.length)],
            );
          }
          if (i % 2 === 0) {
            const fx = x + between(rnd, -14, 14);
            const fy = y + between(rnd, -14, 14);
            const fr = between(rnd, 8, 15);
            const cor = flores[Math.floor(rnd() * flores.length)];
            for (let p = 0; p < 5; p++) {
              const a = (p / 5) * Math.PI * 2;
              circulo(ctx, fx + Math.cos(a) * fr * 0.55, fy + Math.sin(a) * fr * 0.55, fr * 0.5, cor);
            }
            circulo(ctx, fx, fy, fr * 0.32, '#F6E3B0');
          }
        }

        // mesa de doces com toalha
        const yM = h * 0.74;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(w * 0.16, yM);
        ctx.lineTo(w * 0.84, yM);
        ctx.lineTo(w * 0.88, h * 0.99);
        ctx.lineTo(w * 0.12, h * 0.99);
        ctx.closePath();
        const gt = ctx.createLinearGradient(0, yM, 0, h);
        gt.addColorStop(0, '#FFFDF8');
        gt.addColorStop(1, '#D9CFBC');
        ctx.fillStyle = gt;
        sombra(ctx, () => ctx.fill(), 26);
        ctx.fill();
        ctx.restore();
        ctx.beginPath();
        ctx.ellipse(w * 0.5, yM, w * 0.34, h * 0.022, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFDF8';
        ctx.fill();

        // bolo de três andares
        ctx.save();
        ctx.translate(w * 0.5, yM - 4);
        const andares = [
          { w: 118, h: 52 },
          { w: 88, h: 44 },
          { w: 58, h: 38 },
        ];
        let base = 0;
        for (const a of andares) {
          retanguloArredondado(ctx, -a.w / 2, base - a.h, a.w, a.h, 6);
          const g = ctx.createLinearGradient(-a.w / 2, 0, a.w / 2, 0);
          g.addColorStop(0, '#FFFFFF');
          g.addColorStop(1, '#E6DCCB');
          ctx.fillStyle = g;
          sombra(ctx, () => ctx.fill(), 10);
          ctx.fill();
          // babados
          ctx.strokeStyle = 'rgba(190,175,150,0.6)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-a.w / 2, base - a.h + 8);
          ctx.lineTo(a.w / 2, base - a.h + 8);
          ctx.stroke();
          // flores no andar
          for (let k = 0; k < 3; k++) {
            const fx = between(rnd, -a.w / 2 + 10, a.w / 2 - 10);
            circulo(ctx, fx, base - a.h + 6, 6, flores[Math.floor(rnd() * flores.length)]);
          }
          base -= a.h;
        }
        ctx.restore();

        // doces e taças na mesa
        for (let i = 0; i < 10; i++) {
          const x = w * 0.2 + i * w * 0.067;
          if (Math.abs(x - w * 0.5) < w * 0.08) continue;
          const y = yM - 6;
          // bandeja
          ctx.beginPath();
          ctx.ellipse(x, y, 20, 6, 0, 0, Math.PI * 2);
          ctx.fillStyle = '#E4C77A';
          ctx.fill();
          // docinhos
          for (let k = -1; k <= 1; k++) {
            circulo(ctx, x + k * 8, y - 6, 5, k === 0 ? '#8A5A22' : flores[Math.floor(rnd() * flores.length)]);
          }
        }

        // pétalas caindo
        for (let i = 0; i < 26; i++) {
          ctx.save();
          ctx.translate(between(rnd, 0, w), between(rnd, h * 0.05, h * 0.7));
          ctx.rotate(rnd() * Math.PI);
          ctx.beginPath();
          ctx.ellipse(0, 0, between(rnd, 4, 8), between(rnd, 2, 4), 0, 0, Math.PI * 2);
          ctx.fillStyle = hexA(flores[Math.floor(rnd() * flores.length)], 0.75);
          ctx.fill();
          ctx.restore();
        }
      },
    },
  };

  /* --------------------------------------------------------------- API ----- */

  global.Ilustracoes = {
    pratos,
    cenas,
    rng,
    fundoMesa,
    /** Desenha um prato num canvas quadrado, com fundo, reflexo e acabamento. */
    desenharPrato(canvas, chave) {
      const item = pratos[chave];
      if (!item) throw new Error('prato desconhecido: ' + chave);
      const ctx = canvas.getContext('2d');
      const S = canvas.width;
      const yMesa = fundoMesa(ctx, S, S, item.cor, rng(chave + ':fundo'));

      // O prato é desenhado à parte para que possa ser espelhado no granito.
      const off = document.createElement('canvas');
      off.width = S;
      off.height = S;
      const octx = off.getContext('2d');
      item.draw(octx, S, rng(chave));

      // Reflexo na bancada polida, preso à área da mesa.
      const yContato = S * 0.86;
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, yMesa, S, S - yMesa);
      ctx.clip();
      ctx.globalAlpha = 0.15;
      ctx.filter = 'blur(' + Math.round(S * 0.014) + 'px)';
      ctx.translate(0, yContato * 2);
      ctx.scale(1, -1);
      ctx.drawImage(off, 0, 0);
      ctx.restore();

      ctx.drawImage(off, 0, 0);
      acabamento(ctx, S, S, rng(chave + ':grao'));
      return item.alt;
    },
    /** Desenha uma cena de ambiente num canvas 4:3. */
    desenharCena(canvas, chave) {
      const item = cenas[chave];
      if (!item) throw new Error('cena desconhecida: ' + chave);
      const ctx = canvas.getContext('2d');
      const rnd = rng(chave);
      item.draw(ctx, canvas.width, canvas.height, rnd);
      // vinheta, para casar com o fundo escuro do site
      const g = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, canvas.height * 0.3,
        canvas.width / 2, canvas.height / 2, canvas.width * 0.75,
      );
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,0.45)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      return item.alt;
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);

/* ============================================================
   JOYCE BEAUTY — Prévia comercial
   Navegação por hash, carrinho local e renderização das telas.
   Nenhuma integração real: checkout e WhatsApp são demonstrativos.
   ============================================================ */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const money = v => 'R$ ' + v.toFixed(2).replace('.', ',');
  const inst = v => `ou 3x de ${money(v / 3)} sem juros`;
  const byId = id => PRODUCTS.find(p => p.id === id) || KITS.find(k => k.id === id);

  /* ---------- ícones ---------- */
  const I = {
    menu: '<svg viewBox="0 0 24 24"><path d="M3 6h18M3 12h18M3 18h12"/></svg>',
    search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
    cart: '<svg viewBox="0 0 24 24"><path d="M6 8h12l-1 12H7L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
    close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
    minus: '<svg viewBox="0 0 24 24"><path d="M5 12h14"/></svg>',
    trash: '<svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/></svg>',
    arrow: '<svg viewBox="0 0 24 24"><path d="M4 12h15M13 6l6 6-6 6"/></svg>',
    chev: '<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="M4 12.5l5.5 5.5L20 7"/></svg>',
    bag: '<svg viewBox="0 0 24 24"><path d="M5 8h14l-1.2 12H6.2L5 8Z"/><path d="M8.5 8V6.2a3.5 3.5 0 0 1 7 0V8"/></svg>',
    card: '<svg viewBox="0 0 24 24"><rect x="2.5" y="5.5" width="19" height="13" rx="2.5"/><path d="M2.5 10h19M6 15h4"/></svg>',
    spark: '<svg viewBox="0 0 24 24"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/></svg>',
    wa: '<svg viewBox="0 0 24 24"><path d="M12.04 2C6.6 2 2.2 6.4 2.2 11.84c0 1.9.5 3.7 1.5 5.3L2 22l5-1.62a9.8 9.8 0 0 0 5.04 1.38h.01c5.43 0 9.84-4.4 9.84-9.84C21.9 6.4 17.48 2 12.04 2Zm5.76 14.06c-.24.68-1.4 1.3-1.94 1.34-.5.05-.96.22-3.24-.68-2.72-1.08-4.46-3.85-4.6-4.03-.13-.18-1.1-1.46-1.1-2.8 0-1.32.7-1.97.94-2.24.25-.27.54-.34.72-.34h.52c.17 0 .4-.06.62.48.24.57.8 1.98.87 2.12.07.14.11.3.02.48-.09.18-.13.29-.27.45l-.4.46c-.13.13-.27.28-.12.55.15.27.67 1.1 1.44 1.79.99.88 1.82 1.15 2.08 1.29.26.13.41.11.56-.07.15-.18.64-.75.81-1.01.17-.27.34-.22.57-.13.23.09 1.47.69 1.72.82.25.13.42.2.48.31.06.11.06.63-.18 1.31Z"/></svg>'
  };

  /* ---------- carrinho ---------- */
  const KEY = 'jb_cart_v1';
  let cart = [];
  try { cart = JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { cart = []; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) {} };
  const count = () => cart.reduce((a, i) => a + i.qty, 0);
  const subtotal = () => cart.reduce((a, i) => { const p = byId(i.id); return a + (p ? p.price * i.qty : 0); }, 0);

  function addToCart(id, qty = 1) {
    const it = cart.find(i => i.id === id);
    if (it) it.qty = Math.min(99, it.qty + qty); else cart.push({ id, qty });
    save(); syncCart(); toast('Produto adicionado ao carrinho');
  }
  function setQty(id, q) {
    const it = cart.find(i => i.id === id); if (!it) return;
    it.qty = q; if (it.qty < 1) cart = cart.filter(i => i.id !== id);
    save(); syncCart(); renderCart();
  }
  function removeFromCart(id) {
    cart = cart.filter(i => i.id !== id); save(); syncCart(); renderCart();
    toast('Produto removido');
  }
  function syncCart() {
    const b = $('#cartCount'); const c = count();
    b.textContent = c; b.classList.toggle('is-on', c > 0);
    if (c > 0) { b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); }
    renderCart();
  }

  /* ---------- toast ---------- */
  let tTimer;
  function toast(msg) {
    const t = $('#toast');
    t.innerHTML = I.check + '<span>' + msg + '</span>';
    t.classList.add('is-on');
    clearTimeout(tTimer); tTimer = setTimeout(() => t.classList.remove('is-on'), 2400);
  }

  /* ---------- overlays ---------- */
  const scrim = () => $('#scrim');
  function openPanel(sel) {
    closeAll(true); $(sel).classList.add('is-open'); scrim().classList.add('is-open');
    document.body.classList.add('is-locked');
    if (sel === '#search') setTimeout(() => $('#searchInput').focus(), 340);
  }
  function closeAll(keepLock) {
    $$('.panel, .search').forEach(p => p.classList.remove('is-open'));
    scrim().classList.remove('is-open');
    if (!keepLock) document.body.classList.remove('is-locked');
  }
  function openModal(html) {
    const m = $('#modal'); $('#modalBody').innerHTML = html;
    m.classList.add('is-open'); document.body.classList.add('is-locked');
  }
  const closeModal = () => { $('#modal').classList.remove('is-open'); document.body.classList.remove('is-locked'); };

  /* ---------- WhatsApp (placeholder configurável) ---------- */
  function whatsapp(texto) {
    if (CONFIG.whatsapp) {
      window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(texto || 'Olá! Vim pela loja Joyce Beauty.')}`, '_blank', 'noopener');
      return;
    }
    openModal(`
      <button class="icon-btn modal__x" data-close-modal aria-label="Fechar">${I.close}</button>
      <div class="modal__ico">${I.wa}</div>
      <h3>WhatsApp da loja</h3>
      <p>Esta prévia ainda não tem um número configurado. Basta informar o número da Joyce
         e o botão passa a abrir a conversa direto no WhatsApp.</p>
      <div class="modal__list"><ul>
        <li>Configurável em <b>&nbsp;assets/js/data.js → CONFIG.whatsapp</b></li>
        <li>Formato: 55 + DDD + número</li>
        <li>Mensagem inicial já vem preenchida com o produto</li>
      </ul></div>
      <div class="modal__acts"><button class="btn btn--dark btn--full" data-close-modal>Entendi</button></div>`);
  }

  /* ---------- checkout demonstrativo ---------- */
  function checkout() {
    if (!cart.length) return;
    closeAll();
    openModal(`
      <button class="icon-btn modal__x" data-close-modal aria-label="Fechar">${I.close}</button>
      <div class="modal__ico">${I.card}</div>
      <h3>Checkout da versão final</h3>
      <p>Esta é uma prévia de apresentação. O pagamento não está integrado — na versão
         definitiva, esta etapa levaria o cliente ao checkout completo.</p>
      <div class="modal__list"><ul>
        <li>Pix, cartão e boleto</li>
        <li>Cálculo de frete e prazo de entrega</li>
        <li>Confirmação do pedido por e-mail e WhatsApp</li>
        <li>Acompanhamento do envio</li>
      </ul></div>
      <p style="margin-top:16px;font-size:13px">
        Resumo desta simulação: <b>${count()} item(ns)</b> — <b>${money(subtotal())}</b>
      </p>
      <div class="modal__acts">
        <button class="btn btn--gold btn--full" data-wa="Olá! Gostaria de finalizar meu pedido na loja Joyce Beauty.">Falar no WhatsApp</button>
        <button class="btn btn--ghost btn--full" data-close-modal>Continuar navegando</button>
      </div>`);
  }

  /* ---------- carrinho: painel ---------- */
  function renderCart() {
    const body = $('#cartBody'), foot = $('#cartFoot');
    if (!cart.length) {
      body.innerHTML = `<div class="cart-empty">${I.bag}
        <p>Seu carrinho está vazio.</p>
        <button class="btn btn--dark" data-go="#/produtos">Ver produtos</button></div>`;
      foot.innerHTML = ''; return;
    }
    body.innerHTML = cart.map(i => {
      const p = byId(i.id); if (!p) return '';
      const a = p.art && p.art.shape ? Art.scene(p.art, { alt: p.name }) : Art.kitScene(p.art, { alt: p.name });
      return `<div class="cart-item">
        <div class="cart-item__img">${a}</div>
        <div>
          <div class="cart-item__top">
            <div><small>${p.catName || 'Kit'}</small><h4>${p.name}</h4></div>
            <button class="cart-item__rm" data-rm="${p.id}" aria-label="Remover ${p.name}">${I.trash}</button>
          </div>
          <div class="cart-item__bot">
            <div class="qty">
              <button data-dec="${p.id}" aria-label="Diminuir">${I.minus}</button>
              <span>${i.qty}</span>
              <button data-inc="${p.id}" aria-label="Aumentar">${I.plus}</button>
            </div>
            <b>${money(p.price * i.qty)}</b>
          </div>
        </div></div>`;
    }).join('');
    foot.innerHTML = `
      <div class="cart-sum"><span>Subtotal</span><b>${money(subtotal())}</b></div>
      <p class="cart-note">Frete e impostos calculados na etapa seguinte. Valores demonstrativos.</p>
      <button class="btn btn--dark btn--full" data-checkout>Finalizar compra</button>`;
  }

  /* ---------- componentes ---------- */
  const card = p => `
    <article class="card rv">
      <div class="card__media">
        <a href="#/produto/${p.id}" aria-label="${p.name}">${Art.scene(p.art, { alt: p.name })}</a>
        ${p.badge ? `<span class="card__badge${p.badge === 'Novo' ? ' card__badge--gold' : ''}">${p.badge}</span>` : ''}
        <button class="card__quick" data-add="${p.id}" aria-label="Adicionar ${p.name} ao carrinho">${I.cart}</button>
      </div>
      <div class="card__body">
        <span class="card__cat">${p.catName}</span>
        <a href="#/produto/${p.id}"><h3 class="card__name">${p.name}</h3></a>
        <div class="card__price">
          <b>${money(p.price)}</b>${p.old ? `<s>${money(p.old)}</s>` : ''}
          <span class="card__inst">${inst(p.price)}</span>
        </div>
        <a class="btn btn--ghost btn--sm" href="#/produto/${p.id}">Comprar</a>
      </div>
    </article>`;

  const catCard = c => `
    <a class="cat rv" href="#/produtos/${c.id}">
      <div class="cat__img">${Art.icon(c.art, { alt: c.name })}</div>
      <b>${c.name}</b><small>${c.sub}</small>
    </a>`;

  /* ---------- telas ---------- */
  function viewHome() {
    return `
    <section class="hero">
      <div class="wrap hero__in">
        <div class="hero__copy">
          <span class="eyebrow">${CONFIG.tagline}</span>
          <h1 class="display">Cuidado profissional<br>para seus cabelos,<br><em>onde você estiver.</em></h1>
          <p class="hero__sub">Produtos selecionados para transformar sua rotina de cuidados —
             com a mesma leitura de fio que a Joyce faz dentro do salão.</p>
          <div class="hero__cta">
            <a class="btn btn--dark" href="#/produtos">Ver produtos</a>
            <a class="btn btn--ghost" href="#/produto/serum-reparador">Comprar agora</a>
          </div>
        </div>
        <div class="hero__art">
          ${Art.hero()}
          <span class="hero__tag hero__tag--1"><i></i>Curadoria profissional</span>
          <span class="hero__tag hero__tag--2"><i></i>Rotina personalizada</span>
        </div>
      </div>
    </section>

    <div class="strip"><div class="strip__track">${[1, 2].map(() =>
      ['Curadoria profissional', 'Indicação por tipo de fio', 'Rotina montada para você', 'Atendimento por WhatsApp', 'Kits com preço fechado']
        .map(t => `<span class="strip__item">${t}</span>`).join('')).join('')}</div></div>

    <section class="section" id="categorias">
      <div class="wrap">
        <div class="sec-head"><span class="eyebrow">Navegue por</span>
          <h2 class="display">Categorias</h2></div>
        <div class="cats">${CATEGORIES.map(catCard).join('')}</div>
      </div>
    </section>

    <section class="section" id="produtos">
      <div class="wrap">
        <div class="sec-head sec-head--row">
          <div><span class="eyebrow">Seleção da Joyce</span><h2 class="display">Produtos em destaque</h2></div>
          <a class="link-more" href="#/produtos">Ver todos ${I.arrow}</a>
        </div>
        <div class="grid">${PRODUCTS.map(card).join('')}</div>
      </div>
    </section>

    <section class="section" id="necessidade">
      <div class="wrap">
        <div class="sec-head"><span class="eyebrow">Compre por</span>
          <h2 class="display">Necessidade</h2>
          <p class="lede">O mesmo raciocínio de diagnóstico do salão, traduzido para a loja.</p></div>
        <div class="needs">${NEEDS.map(n => `
          <a class="need rv" href="#/produtos/${n.cat}">
            <div class="need__ico">${Art.icon(n.art, { alt: n.sol })}</div>
            <div class="need__tx"><small>${n.need}</small><b>${n.sol}</b><span>${n.tip}</span></div>
            <span class="need__go">${I.arrow}</span>
          </a>`).join('')}</div>
      </div>
    </section>

    <section class="section" id="kits">
      <div class="wrap">
        <div class="sec-head sec-head--row">
          <div><span class="eyebrow">Rotina completa</span><h2 class="display">Kits e combos</h2></div>
        </div>
        <div class="kits">${KITS.map(k => `
          <article class="kit rv">
            <div class="kit__media">${Art.kitScene(k.art, { alt: k.name })}
              <span class="kit__off">-${Math.round((1 - k.price / k.old) * 100)}%</span></div>
            <div class="kit__body">
              <h3>${k.name}</h3><p>${k.desc}</p>
              <div class="kit__price"><b>${money(k.price)}</b><s>${money(k.old)}</s></div>
              <button class="btn btn--dark btn--sm" style="margin-top:14px" data-add="${k.id}">Adicionar ao carrinho</button>
            </div>
          </article>`).join('')}</div>
      </div>
    </section>

    <section class="about" id="sobre">
      <div class="wrap about__in">
        <div>
          <span class="eyebrow">Sobre a Joyce</span>
          <h2>A experiência do salão<br><em>agora também no digital.</em></h2>
          <p>A Joyce Beauty nasce da vivência profissional no segmento de beleza: a mesma
             leitura de fio, a mesma indicação cuidadosa e a mesma conversa que acontecem
             na cadeira do salão, agora disponíveis para quem quer manter o resultado em casa.</p>
          <p>A proposta da loja é simples — reunir produtos profissionais para cabelo e
             orientar cada cliente sobre o que realmente faz sentido para o seu tipo de fio.</p>
          <button class="btn btn--gold" data-wa="Olá, Joyce! Vi a loja e gostaria de uma indicação de produtos.">Falar com a Joyce</button>
          <div class="about__pts">
            <div><b>Curadoria</b><span>Produtos selecionados</span></div>
            <div><b>Indicação</b><span>Por tipo de fio</span></div>
            <div><b>Rotina</b><span>Passo a passo claro</span></div>
          </div>
        </div>
        <div class="about__art">${Art.aboutArt()}</div>
      </div>
    </section>

    <section class="wa-band">
      <div class="wrap wa-band__in">
        <div>
          <h3 class="display">Em dúvida sobre o que usar?</h3>
          <p>Conte como está o seu cabelo e receba uma indicação personalizada da Joyce.</p>
        </div>
        <button class="btn btn--dark" data-wa="Olá, Joyce! Quero uma indicação para o meu cabelo.">${I.wa} Chamar no WhatsApp</button>
      </div>
    </section>`;
  }

  function viewCatalog(catId) {
    const c = CATEGORIES.find(x => x.id === catId);
    const list = catId === 'kits' ? [] : (catId ? PRODUCTS.filter(p => p.cat === catId) : PRODUCTS);
    const showKits = !catId || catId === 'kits';
    return `
    <section class="cat-hero">
      <div class="wrap">
        <span class="eyebrow">${CONFIG.tagline}</span>
        <h1>${c ? c.name : 'Todos os produtos'}</h1>
        <p>${c ? 'Seleção da linha ' + c.name.toLowerCase() + ' para a sua rotina.' : 'Catálogo demonstrativo da prévia — produtos e preços ilustrativos.'}</p>
      </div>
    </section>
    <div class="wrap">
      <div class="chips">
        <a class="chip${!catId ? ' is-on' : ''}" href="#/produtos">Todos</a>
        ${CATEGORIES.map(x => `<a class="chip${catId === x.id ? ' is-on' : ''}" href="#/produtos/${x.id}">${x.name}</a>`).join('')}
      </div>
    </div>
    <section class="section section--tight">
      <div class="wrap">
        ${list.length ? `<div class="grid">${list.map(card).join('')}</div>` : ''}
        ${showKits ? `
          ${list.length ? '<div class="sec-head" style="margin-top:52px"><span class="eyebrow">Rotina completa</span><h2 class="display">Kits e combos</h2></div>' : ''}
          <div class="kits">${KITS.map(k => `
            <article class="kit rv">
              <div class="kit__media">${Art.kitScene(k.art, { alt: k.name })}
                <span class="kit__off">-${Math.round((1 - k.price / k.old) * 100)}%</span></div>
              <div class="kit__body"><h3>${k.name}</h3><p>${k.desc}</p>
                <div class="kit__price"><b>${money(k.price)}</b><s>${money(k.old)}</s></div>
                <button class="btn btn--dark btn--sm" style="margin-top:14px" data-add="${k.id}">Adicionar ao carrinho</button>
              </div></article>`).join('')}</div>` : ''}
        ${!list.length && !showKits ? '<p class="lede">Nenhum produto demonstrativo nesta categoria ainda.</p>' : ''}
      </div>
    </section>`;
  }

  function viewProduct(id) {
    const p = PRODUCTS.find(x => x.id === id);
    if (!p) return viewCatalog(null);
    const alt = [p.art, { ...p.art, bg: ['#F4EFE8', '#E6DACA'] }, { ...p.art, bg: ['#EFEAE3', '#DED2C2'] }];
    const rel = PRODUCTS.filter(x => x.id !== p.id && (x.cat === p.cat)).concat(
      PRODUCTS.filter(x => x.id !== p.id && x.cat !== p.cat)).slice(0, 4);
    return `
    <div class="wrap">
      <nav class="crumbs"><a href="#/">Início</a>${I.chev}
        <a href="#/produtos/${p.cat}">${p.catName}</a>${I.chev}<span>${p.name}</span></nav>
      <div class="pdp">
        <div class="pdp__gal">
          <div class="pdp__main" id="pdpMain">${Art.scene(alt[0], { alt: p.name })}</div>
          <div class="pdp__thumbs">
            ${alt.map((a, i) => `<button class="${i === 0 ? 'is-on' : ''}" data-thumb="${i}"
                aria-label="Imagem ${i + 1}">${Art.scene(a, { alt: p.name })}</button>`).join('')}
          </div>
        </div>
        <div class="pdp__info">
          <span class="eyebrow">${p.catName}</span>
          <h1>${p.name}</h1>
          <div class="pdp__price"><b>${money(p.price)}</b>
            ${p.old ? `<s>${money(p.old)}</s><em>-${Math.round((1 - p.price / p.old) * 100)}%</em>` : ''}</div>
          <p class="pdp__inst">${inst(p.price)} &middot; ${p.vol}</p>
          <p class="pdp__desc">${p.desc}</p>
          <div class="pdp__ind">${I.spark}
            <div><small>Indicação</small><p>${p.ind}</p></div></div>
          <div class="bens">${p.bens.map(b => `<div class="ben">${I.check}<span>${b}</span></div>`).join('')}</div>
          <div class="pdp__buy">
            <div class="pdp__qty-row"><span class="eyebrow">Quantidade</span>
              <div class="qty qty--lg">
                <button data-pq="-1" aria-label="Diminuir">${I.minus}</button>
                <span id="pdpQty">1</span>
                <button data-pq="1" aria-label="Aumentar">${I.plus}</button>
              </div></div>
            <div class="pdp__acts">
              <button class="btn btn--ghost" data-pdp-add="${p.id}">Adicionar ao carrinho</button>
              <button class="btn btn--dark" data-pdp-buy="${p.id}">Comprar agora</button>
            </div>
            <button class="btn btn--light" style="border:1px solid var(--line)"
              data-wa="Olá, Joyce! Tenho interesse no produto ${p.name}.">${I.wa} Tirar dúvida no WhatsApp</button>
          </div>
          <div class="acc">
            ${[['Modo de uso', `<ol>${p.how.map(h => `<li>${h}</li>`).join('')}</ol>`],
               ['Benefícios', `<div>${p.bens.join(' &middot; ')}</div>`],
               ['Entrega e trocas', '<div>Conteúdo demonstrativo. Na versão final desta loja, esta área traz prazos de entrega, política de trocas e rastreamento do pedido.</div>']]
              .map(([q, a], i) => `
              <div class="acc__i${i === 0 ? ' is-open' : ''}">
                <button class="acc__q" data-acc>${q}${I.plus}</button>
                <div class="acc__a"><div>${a}</div></div>
              </div>`).join('')}
          </div>
        </div>
      </div>
    </div>
    <section class="section">
      <div class="wrap">
        <div class="sec-head"><span class="eyebrow">Combina com</span><h2 class="display">Você também pode gostar</h2></div>
        <div class="grid">${rel.map(card).join('')}</div>
      </div>
    </section>`;
  }

  /* ---------- roteador ---------- */
  function route() {
    const raw = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
    const app = $('#app');
    let scrollTo = null;

    if (raw.startsWith('@')) { app.innerHTML = viewHome(); scrollTo = raw.slice(1); }
    else if (raw.startsWith('produto/')) app.innerHTML = viewProduct(raw.slice(8));
    else if (raw.startsWith('produtos/')) app.innerHTML = viewCatalog(raw.slice(9));
    else if (raw === 'produtos') app.innerHTML = viewCatalog(null);
    else app.innerHTML = viewHome();

    closeAll(); reveal();
    $$('.acc__i.is-open .acc__a').forEach(a => { a.style.maxHeight = a.scrollHeight + 'px'; });
    if (scrollTo) {
      const el = document.getElementById(scrollTo);
      if (el) { requestAnimationFrame(() => window.scrollTo({ top: el.offsetTop - 70, behavior: 'smooth' })); return; }
    }
    window.scrollTo(0, 0);
  }

  /* ---------- reveal ao rolar ---------- */
  let io;
  function reveal() {
    if (io) io.disconnect();
    io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -8% 0px' });
    $$('.rv').forEach(el => io.observe(el));
  }

  /* ---------- busca ---------- */
  function doSearch(q) {
    const res = $('#searchRes');
    const t = q.trim().toLowerCase();
    if (!t) { res.innerHTML = ''; return; }
    const norm = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const hits = [...PRODUCTS, ...KITS].filter(p =>
      norm(p.name).includes(norm(t)) || norm(p.catName || 'kit').includes(norm(t))).slice(0, 6);
    res.innerHTML = hits.length
      ? hits.map(p => `<a class="search__hit" href="#/produto/${p.id}" data-close-search>
          <div class="thumb">${p.art.shape ? Art.icon(p.art, { alt: p.name }) : Art.kitScene(p.art, { alt: p.name })}</div>
          <div><small>${p.catName || 'Kit'}</small><b>${p.name}</b></div></a>`).join('')
      : `<p class="search__empty">Nada encontrado para “${q}”.</p>`;
  }

  /* ---------- eventos globais ---------- */
  document.addEventListener('click', e => {
    const t = e.target;
    const hit = s => t.closest(s);

    if (hit('[data-open-menu]')) return openPanel('#menu');
    if (hit('[data-open-cart]')) return openPanel('#cart');
    if (hit('[data-open-search]')) return openPanel('#search');
    if (hit('[data-close]') || t.id === 'scrim') return closeAll();
    if (hit('[data-close-modal]')) return closeModal();
    if (t.id === 'modal') return closeModal();
    if (hit('[data-close-search]')) closeAll();

    const soon = hit('[data-soon]');
    if (soon) {
      e.preventDefault(); closeAll();
      return openModal(`
        <button class="icon-btn modal__x" data-close-modal aria-label="Fechar">${I.close}</button>
        <div class="modal__ico">${I.spark}</div>
        <h3>Conteúdo da versão final</h3>
        <p>Esta prévia foca na experiência de compra. Páginas institucionais, redes sociais
           e textos jurídicos entram na etapa seguinte do projeto.</p>
        <div class="modal__acts"><button class="btn btn--dark btn--full" data-close-modal>Entendi</button></div>`);
    }

    const wa = hit('[data-wa]');
    if (wa) { e.preventDefault(); closeModal(); closeAll(); return whatsapp(wa.dataset.wa); }
    if (hit('[data-checkout]')) return checkout();

    const add = hit('[data-add]');
    if (add) {
      addToCart(add.dataset.add);
      if (add.classList.contains('card__quick')) {
        add.classList.add('done'); add.innerHTML = I.check;
        setTimeout(() => { add.classList.remove('done'); add.innerHTML = I.cart; }, 1300);
      }
      return;
    }

    const pAdd = hit('[data-pdp-add]'), pBuy = hit('[data-pdp-buy]');
    if (pAdd || pBuy) {
      const q = parseInt($('#pdpQty').textContent, 10) || 1;
      addToCart((pAdd || pBuy).dataset[pAdd ? 'pdpAdd' : 'pdpBuy'], q);
      return pBuy ? checkout() : openPanel('#cart');
    }

    const pq = hit('[data-pq]');
    if (pq) {
      const el = $('#pdpQty');
      el.textContent = Math.max(1, Math.min(99, (+el.textContent) + (+pq.dataset.pq)));
      return;
    }

    const th = hit('[data-thumb]');
    if (th) {
      $$('.pdp__thumbs button').forEach(b => b.classList.remove('is-on'));
      th.classList.add('is-on');
      $('#pdpMain').innerHTML = th.innerHTML;
      return;
    }

    const acc = hit('[data-acc]');
    if (acc) {
      const it = acc.parentElement;
      it.classList.toggle('is-open');
      const a = it.querySelector('.acc__a');
      a.style.maxHeight = it.classList.contains('is-open') ? a.scrollHeight + 'px' : 0;
      return;
    }

    const inc = hit('[data-inc]'), dec = hit('[data-dec]'), rm = hit('[data-rm]');
    if (inc) return setQty(inc.dataset.inc, (cart.find(i => i.id === inc.dataset.inc) || {}).qty + 1);
    if (dec) return setQty(dec.dataset.dec, (cart.find(i => i.id === dec.dataset.dec) || {}).qty - 1);
    if (rm) return removeFromCart(rm.dataset.rm);

    const go = hit('[data-go]'); if (go) { closeAll(); location.hash = go.dataset.go; return; }
    if (hit('.panel a[href^="#"]')) closeAll();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeAll(); closeModal(); }
  });

  $('#searchInput').addEventListener('input', e => doSearch(e.target.value));

  window.addEventListener('hashchange', route);
  window.addEventListener('scroll', () => {
    $('#header').classList.toggle('is-stuck', window.scrollY > 8);
  }, { passive: true });

  /* ---------- boot ---------- */
  $('#waFloat').addEventListener('click', () => whatsapp('Olá, Joyce! Vim pela loja e gostaria de uma indicação.'));
  route(); syncCart();
})();

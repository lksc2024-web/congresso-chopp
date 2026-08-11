/* ==========================================================================
   Congresso do Chopp — comportamento da página
   Progressive enhancement: sem JS o site continua 100% navegável e legível.
   Zero dependências.
   ========================================================================== */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------- Ano */
  var ano = document.getElementById('ano');
  if (ano) ano.textContent = String(new Date().getFullYear());

  /* ------------------------------------------------- Menu mobile (drawer) */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('menu-principal');

  function closeNav() {
    if (!toggle || !nav) return;
    toggle.setAttribute('aria-expanded', 'false');
    nav.classList.remove('is-open');
  }

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      nav.classList.toggle('is-open', !open);
    });

    // Fecha ao clicar num link do menu.
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeNav();
    });

    // Fecha com Escape e devolve o foco ao botão.
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        closeNav();
        toggle.focus();
      }
    });

    // Fecha ao clicar fora.
    document.addEventListener('click', function (e) {
      if (!nav.contains(e.target) && !toggle.contains(e.target)) closeNav();
    });

    // Ao voltar para desktop, garante o estado limpo.
    window.matchMedia('(min-width: 62rem)').addEventListener('change', closeNav);
  }

  /* ------------------------------------------------ Sombra do header fixo */
  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-stuck', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ------------------------------- Seção ativa no menu (scroll spy leve) */
  var navLinks = Array.prototype.slice.call(
    document.querySelectorAll('.site-nav a[href^="#"]')
  );
  var sections = navLinks
    .map(function (a) { return document.querySelector(a.getAttribute('href')); })
    .filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    var spy = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          navLinks.forEach(function (a) {
            var active = a.getAttribute('href') === '#' + entry.target.id;
            if (active) a.setAttribute('aria-current', 'true');
            else a.removeAttribute('aria-current');
          });
        });
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
    );
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ------------------------------------------ Revelação suave das seções */
  if (!reduceMotion && 'IntersectionObserver' in window) {
    var targets = document.querySelectorAll(
      '.section .card, .section .feature, .section .prato, .evento-media, .cta-box, .faq details'
    );
    var revealed = 0;
    var revealer = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          revealed++;
          obs.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
    );
    Array.prototype.forEach.call(targets, function (el, i) {
      el.classList.add('reveal');
      el.style.transitionDelay = Math.min(i % 6, 5) * 60 + 'ms';
      revealer.observe(el);
    });

    // Rede de segurança: se o observer não disparar por nada (bug de browser,
    // aba em segundo plano, renderizador headless), o conteúdo NUNCA pode
    // ficar invisível. Se em 1,5 s nada foi revelado, mostramos tudo.
    window.setTimeout(function () {
      if (revealed > 0) return;
      revealer.disconnect();
      Array.prototype.forEach.call(targets, function (el) {
        el.style.transitionDelay = '';
        el.classList.add('is-visible');
      });
    }, 1500);
  }

  /* ------------------------------------------- Mapa carregado sob demanda
     Sem JS (ou antes do clique) o bloco continua sendo um link para o Google
     Maps; nenhum recurso de terceiro é baixado no carregamento da página. */
  var mapBox = document.querySelector('[data-map]');
  if (mapBox && mapBox.getAttribute('data-src')) {
    var facade = mapBox.querySelector('.map-facade');
    if (facade) {
      facade.addEventListener('click', function (e) {
        // Ctrl/Cmd/clique do meio: deixa abrir o Google Maps em nova aba.
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        var iframe = document.createElement('iframe');
        iframe.src = mapBox.getAttribute('data-src');
        iframe.title =
          'Mapa com a localização do Congresso do Chopp na Estrada do Monteiro, 450, Campo Grande';
        iframe.loading = 'lazy';
        iframe.referrerPolicy = 'no-referrer-when-downgrade';
        iframe.setAttribute('allowfullscreen', '');
        mapBox.replaceChildren(iframe);
      });
    }
  }

  /* -------------------------------------------------- Rastreio de cliques
     Ganchos prontos para Google Analytics / Meta Pixel, sem carregar nada
     por padrão (nenhum script de terceiros = página rápida e sem cookies). */
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href*="wa.me"], a[href^="tel:"]');
    if (!link) return;
    var tipo = link.href.indexOf('wa.me') !== -1 ? 'whatsapp' : 'telefone';
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'contato', { method: tipo, link_url: link.href });
    }
    window.dispatchEvent(new CustomEvent('congresso:contato', { detail: { tipo: tipo } }));
  });
})();

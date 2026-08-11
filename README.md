# Congresso do Chopp — site institucional

Site estático do **Congresso do Chopp Bar e Restaurante** (Estrada do Monteiro, 450 —
Campo Grande, Rio de Janeiro/RJ), reescrito com foco em três coisas: **carregar rápido
no 4G**, **converter em WhatsApp** e **aparecer no Google** para quem procura
"rodízio de pizza em Campo Grande".

- **Página única**, sem framework, sem build, sem dependência de runtime.
- **Nenhuma requisição a terceiros no carregamento** — o mapa do Google só é
  baixado quando a pessoa clica.
- Auditoria automatizada com Playwright (`audit-congresso.mjs`) rodando no CI.

---

## Rodando localmente

```bash
npm install                # instala o Playwright (só para auditoria/imagens)
npm run dev                # serve em http://127.0.0.1:8080
```

Como o site é 100% estático, qualquer servidor de arquivos serve. Abrir o
`index.html` direto pelo `file://` também funciona, exceto o manifest do PWA.

## Auditoria

```bash
npm run audit:local                        # audita http://127.0.0.1:8080
node audit-congresso.mjs <url>             # audita qualquer URL
node audit-congresso.mjs <url> --strict    # exit code 1 se houver erro
node audit-congresso.mjs <url> --no-screenshots
```

Saídas em `audit-report/` (ou no `--out` informado):

| Arquivo | Conteúdo |
|---|---|
| `audit.md` | relatório legível, com nota de 0 a 100 |
| `audit.json` | todos os dados brutos coletados |
| `screenshots/{mobile,tablet,desktop}.png` | página inteira nos três breakpoints |

O que ele checa: status HTTP e redirecionamentos, cabeçalhos de segurança e
cache, `lang`/`title`/`description`/canonical/Open Graph/JSON-LD, hierarquia de
headings, `alt` e dimensões de imagens, links quebrados ou inseguros,
**presença e formato correto do link de WhatsApp**, landmarks e nomes
acessíveis, contraste WCAG AA, scroll horizontal e alvos de toque em três
viewports, erros de console, requisições falhas e métricas de carregamento.

O CI (`.github/workflows/audit.yml`) roda a auditoria a cada push e PR, publica o
relatório no resumo do job e guarda os screenshots como artefato.

## Assets gerados

Os PNGs (Open Graph, ícones do PWA) são **gerados por código**, não versionados
à mão:

```bash
npm run imagens        # renderiza assets/img/*.png via Chromium
```

Editar a identidade visual = editar `scripts/gerar-imagens.mjs` e rodar de novo.

---

## Trocar as ilustrações por fotos reais

As três imagens da seção **Experiência** são SVGs ilustrados
(`assets/img/salao-principal.svg`, `area-kids.svg`, `bar-chopp.svg`), usados
porque o ambiente onde o site foi montado não tinha acesso de rede às fotos do
restaurante.

Para trocar por fotos de verdade, **basta apontar o `src`** — nenhuma mudança de
CSS é necessária (o `object-fit: cover` e o `aspect-ratio: 4/3` já cuidam do
enquadramento):

```html
<img src="assets/img/salao-principal.webp" width="1600" height="1200" ...>
```

Recomendações: WebP ou JPEG progressivo, proporção 4:3, ~1600 px de largura,
abaixo de 250 KB cada. Mantenha `width`/`height` no HTML para não gerar layout
shift, e reescreva o `alt` descrevendo a foto real.

O mesmo vale para a imagem de compartilhamento (`og-congresso-do-chopp.png`):
uma foto real do salão ou de uma pizza rende muito mais clique no WhatsApp do
que o card tipográfico atual.

---

## Publicação

Hospedado no **GitHub Pages** via `.github/workflows/deploy.yml`, que dispara a
cada push na `main`.

**Habilitar (uma única vez):** `Settings → Pages → Source: GitHub Actions`.

Sem domínio próprio o site fica em
`https://<usuario>.github.io/congresso-chopp/` — por isso todos os caminhos de
asset são **relativos**, e o site funciona tanto na raiz quanto em subpasta.

### Apontar um domínio próprio

1. Registre o domínio (ver [`DOMINIO.md`](DOMINIO.md)).
2. Crie um arquivo `CNAME` na raiz do repositório com o domínio, sem `https://`:
   ```
   www.congressodochopp.com.br
   ```
3. No DNS do registrador:
   | Tipo | Nome | Valor |
   |---|---|---|
   | CNAME | `www` | `<usuario>.github.io` |
   | A | `@` | `185.199.108.153` |
   | A | `@` | `185.199.109.153` |
   | A | `@` | `185.199.110.153` |
   | A | `@` | `185.199.111.153` |
4. Em `Settings → Pages`, preencha o **Custom domain** e marque
   **Enforce HTTPS** (o certificado é emitido de graça, leva alguns minutos).
5. **Troque as URLs absolutas** de `https://www.congressodochopp.com.br/` para o
   domínio real em: `index.html` (canonical, `og:url`, `og:image`,
   `twitter:image` e o bloco JSON-LD), `robots.txt` e `sitemap.xml`.

### Cabeçalhos HTTP

O GitHub Pages já entrega gzip/brotli, `Cache-Control`, HSTS e
`X-Content-Type-Options`, mas **não permite configurar cabeçalhos próprios** —
por isso a CSP vai como `<meta http-equiv>` no `index.html`. Se um dia o site
migrar para Cloudflare Pages, Netlify ou Vercel, mova a CSP para cabeçalho de
verdade e adicione `Referrer-Policy: strict-origin-when-cross-origin` e
`Permissions-Policy`.

---

## Conferir antes de ir ao ar

Os dados abaixo vieram de fontes públicas (perfis do restaurante em guias
gastronômicos, redes sociais e cadastro de CNPJ) e **precisam de uma conferência
rápida com o restaurante** antes da publicação definitiva:

- [ ] **Número da rua**: as fontes divergem entre **440** e **450** na Estrada do
      Monteiro. O site está usando **450**.
- [ ] **Preços do rodízio**: R$ 59,90 (seg–qui) e R$ 64,90 (sex–dom e feriados).
- [ ] **Horários**: o JSON-LD declara 18h–23h de segunda a sexta e 12h–23h aos
      sábados e domingos. O horário de fechamento não foi confirmado.
- [ ] **Formas de pagamento**: a lista inclui Pix e VR, além de dinheiro e cartões.
- [ ] **Condição da cortesia de aniversário** (acima de 10 convidados).
- [ ] **Política de preço para crianças** — hoje o FAQ só diz "consulte".
- [ ] **Nota 4,3 do Google** exibida na faixa de destaques.
- [ ] Telefone fixo **(21) 3356-5532** ainda ativo.

O WhatsApp **(21) 98489-9170** foi informado diretamente e está em todos os CTAs.

> A nota do Google aparece apenas como texto na página. Ela **não** foi declarada
> como `aggregateRating` no JSON-LD de propósito: o Google exige que a nota
> estruturada seja coletada pelo próprio site, e marcá-la indevidamente é motivo
> de penalização manual.

---

## Estrutura

```
index.html                     página única (todo o conteúdo)
404.html                       página de erro
favicon.svg  site.webmanifest  robots.txt  sitemap.xml
assets/css/styles.css          folha única, tokens em custom properties
assets/js/app.js               menu mobile, scroll spy, reveal, mapa sob demanda
assets/img/                    SVGs ilustrados + PNGs gerados
audit-congresso.mjs            auditoria Playwright
scripts/gerar-imagens.mjs      gera os PNGs
.github/workflows/deploy.yml   publica no GitHub Pages
.github/workflows/audit.yml    roda a auditoria no CI
```

## Analytics

Nenhum script de terceiros é carregado — o site não usa cookies e não precisa de
banner de consentimento. Há um gancho pronto no fim do `assets/js/app.js`: todo
clique em WhatsApp ou telefone dispara `window.gtag('event', 'contato', …)` se o
Google Analytics existir, e sempre emite o evento `congresso:contato` no
`window`. Basta colar o snippet do GA4 (e ajustar a CSP) se quiser medir.

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

## Imagens: tudo gerado por código

Nenhuma imagem do site é um arquivo binário editado à mão. São dois pipelines,
ambos renderizando no Chromium:

```bash
npm run imagens        # OG image + ícones do PWA  → assets/img/*.png
npm run ilustracoes    # pratos e cenas de ambiente → assets/img/{pratos,cenas}/*.webp
npm run ilustracoes -- pratos   # só os pratos
npm run ilustracoes -- cenas    # só as cenas
```

As ilustrações vivem em `scripts/ilustracoes.js`, desenhadas em Canvas 2D com
um gerador pseudoaleatório de semente fixa: **a mesma chave sempre produz
exatamente a mesma imagem**, então regerar não suja o histórico do Git. O
catálogo com os textos alternativos sai em `assets/img/imagens.json`.

São exportadas em **WebP** direto do canvas: as 22 ilustrações somam ~300 KB.
Em PNG somavam 5,4 MB — gradiente suave é o pior caso possível para PNG.

## Fotos reais

**14 das 22 imagens já são fotos do próprio restaurante**, recortadas das
capturas do perfil do Instagram e da ficha em site de avaliação. Ficam em
`assets/img/fotos/`, com o catálogo de textos alternativos em `fotos.json`.

```bash
# 1. recorta e converte as capturas (o material bruto não vai para o Git)
node scripts/preparar-fotos.mjs <pasta-com-as-capturas> <pasta-com-as-celulas>

# 2. troca no index.html as ilustrações pelas fotos que existirem
npm run fotos
npm run fotos -- --check   # só relata, sem gravar
```

`aplicar-fotos.mjs` é idempotente e faz a ponte entre os dois mundos: onde há
foto, usa a foto e ajusta `src`, `alt` e dimensões; onde não há, mantém a
ilustração e marca a imagem com `data-ilustracao`, que o CSS transforma num
selo **"ilustração"** no canto. Quando novas fotos chegarem, acrescente-as em
`preparar-fotos.mjs`, rode os dois comandos e o selo some sozinho.

### Como as fotos foram escolhidas

As capturas eram telas inteiras do celular, com o grid do Instagram. O script
mede período e fase do grid, detecta as divisórias reais de cada célula e
recorta do arquivo original em resolução cheia. Três regras de exclusão:

- **nada com rosto de cliente identificável** — as fotos de casamento com os
  noivos, a foto do salão cheio e as de clientes ficaram de fora; a de eventos
  mostra só a decoração e o bolo;
- **nada com sobreposição de rede social** — selo de vídeo, contador de
  visualizações, marca d'água ou legenda queimada na imagem;
- **quando a foto não presta, o item continua com a ilustração** — é o caso do
  chopp, cuja única foto está coberta por texto e miniaturas de outros vídeos.

Ainda em ilustração: batata frita, batata com queijo e bacon, frutos do mar,
caldos, refrigerante, água, chopp e a área kids.

### Substituindo por fotos profissionais

Estas vieram de capturas de tela e têm a resolução que isso permite. Quando o
restaurante tiver fotos originais, coloque-as em `assets/img/fotos/` com o
mesmo nome (`pratos/<item>.webp`, `cenas/<cena>.webp`), acrescente o texto
alternativo em `fotos.json` e rode `npm run fotos`. Recomendações: WebP ou
JPEG progressivo, 1:1 para pratos e 4:3 para cenas, abaixo de 250 KB cada.

O mesmo vale para a imagem de compartilhamento (`og-congresso-do-chopp.png`):
uma foto real do salão cheio rende muito mais clique no WhatsApp do que o card
tipográfico atual.

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

Já confirmado pela bio do Instagram do restaurante:

- ✅ **Horários** — rodízio todos os dias das **18h às 00h**; almoço **sábado e
  domingo, das 12h às 16h**. Está no texto da página e no JSON-LD.
- ✅ **Linktree** `linktr.ee/congressodochopp`, no rodapé e no `sameAs`.

Ainda **precisa de conferência com o restaurante** antes da publicação:

- [ ] **Número da rua**: as fontes divergem entre **440** e **450** na Estrada do
      Monteiro. O site está usando **450**.
- [ ] **Preços do rodízio**: R$ 59,90 (seg–qui) e R$ 64,90 (sex–dom e feriados).
- [ ] **Formas de pagamento**: a lista inclui Pix e VR, além de dinheiro e cartões.
- [ ] **Condição da cortesia de aniversário** (acima de 10 convidados).
- [ ] **Política de preço para crianças** — hoje o FAQ só diz "consulte".
- [ ] **Nota 4,3 do Google** exibida na faixa de destaques.
- [ ] Telefone fixo **(21) 3356-5532** ainda ativo.
- [ ] Se o **churrasco no espeto** entra no rodízio ou é só à la carte — o site
      diz "na mesa" sem afirmar que está incluso.

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
assets/img/                    OG image e ícones (PNG)
assets/img/fotos/              14 fotos reais do restaurante (WebP) + fotos.json
assets/img/pratos/             18 ilustrações do cardápio (WebP)
assets/img/cenas/              4 cenas de ambiente e eventos (WebP)
assets/img/imagens.json        catálogo das ilustrações com os textos alternativos
audit-congresso.mjs            auditoria Playwright
scripts/ilustracoes.js         biblioteca de desenho em Canvas 2D
scripts/gerar-ilustracoes.mjs  renderiza pratos e cenas em WebP
scripts/gerar-imagens.mjs      gera OG image e ícones do PWA
scripts/preparar-fotos.mjs     recorta as capturas e gera assets/img/fotos/
scripts/aplicar-fotos.mjs      troca ilustração por foto no index.html
scripts/gerar-preview.mjs      monta a versão de arquivo único
.github/workflows/deploy.yml   publica no GitHub Pages
.github/workflows/audit.yml    roda a auditoria no CI
```

## Analytics

Nenhum script de terceiros é carregado — o site não usa cookies e não precisa de
banner de consentimento. Há um gancho pronto no fim do `assets/js/app.js`: todo
clique em WhatsApp ou telefone dispara `window.gtag('event', 'contato', …)` se o
Google Analytics existir, e sempre emite o evento `congresso:contato` no
`window`. Basta colar o snippet do GA4 (e ajustar a CSP) se quiser medir.

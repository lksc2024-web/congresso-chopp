# Joyce Beauty — Prévia comercial

Demonstração visual e navegável de uma futura loja virtual de produtos
profissionais para cabelo. **Não é o site definitivo**: é uma prévia feita para
apresentação, para que a ideia possa ser avaliada antes de decidir pelo projeto
completo.

## Como abrir

Basta abrir o arquivo `index.html` no navegador — não há build, dependências nem
instalação. Para servir localmente (opcional):

```bash
python3 -m http.server 8000
# depois acesse http://localhost:8000
```

## Telas

| Tela | Rota |
|---|---|
| Home | `#/` |
| Catálogo completo | `#/produtos` |
| Catálogo por categoria | `#/produtos/hidratacao` |
| Página de produto | `#/produto/serum-reparador` |

## O que funciona de verdade

Menu mobile, busca, cards de produto, página de produto completa, carrinho
(adicionar, remover, alterar quantidade, subtotal), carrinho salvo no navegador
e layout responsivo — pensado primeiro para o celular (390px).

## O que é apenas demonstrativo

- **Produtos, descrições, preços e kits** — conteúdo fictício de apresentação.
- **Checkout** — o botão "Finalizar compra" abre um aviso explicando que o
  pagamento entra na versão definitiva. Não há cobrança nem integração.
- **Imagens** — os frascos são ilustrações vetoriais criadas para a prévia, para
  que a linha tenha aparência coerente sem depender de fotos de terceiros.
- **Páginas institucionais** (privacidade, trocas, prazos) — ainda não escritas.

## Configuração

Em `assets/js/data.js`, no objeto `CONFIG`:

```js
const CONFIG = {
  brand: 'Joyce Beauty',
  tagline: 'Professional Hair Care',
  whatsapp: '',   // 55 + DDD + número, ex.: '5511999999999'
  instagram: ''   // ex.: 'joycebeauty'
};
```

Enquanto `whatsapp` estiver vazio, os botões abrem um aviso explicando que o
número ainda não foi configurado. Ao preencher, todos passam a abrir a conversa
no WhatsApp com uma mensagem inicial já pronta.

Produtos, categorias, kits e necessidades também ficam nesse arquivo e podem ser
editados livremente.

## Estrutura

```
index.html              estrutura da página, header, rodapé, gavetas e modais
assets/css/styles.css   estilo completo (mobile-first)
assets/js/data.js       conteúdo demonstrativo e configurações
assets/js/art.js        geração das ilustrações dos produtos em SVG
assets/js/app.js        navegação, carrinho, busca e interações
```

# Domínio — recomendação

## Recomendação principal

### `congressodochopp.com.br`

É o nome que as pessoas efetivamente digitam e falam. O restaurante já é
conhecido como "Congresso do Chopp", o perfil no Instagram é
[@restaurantecongressodochopp](https://www.instagram.com/restaurantecongressodochopp/)
e a página no Facebook é `/Congressodochopp/` — o domínio fecha a identidade
sem introduzir um nome novo.

**Por que `.com.br` e não `.com`:** o público é 100% local (Zona Oeste do Rio).
O `.com.br` passa mais confiança para consumidor brasileiro, custa pouco
(≈ R$ 40/ano no [registro.br](https://registro.br)) e o registro é direto com o
NIC.br, sem intermediário.

**Configure junto:**
- `www.congressodochopp.com.br` como endereço canônico (é o que está no
  `<link rel="canonical">` e no JSON-LD do site);
- redirecionamento de `congressodochopp.com.br` (sem `www`) para o `www`;
- um e-mail profissional no mesmo domínio — `contato@congressodochopp.com.br`
  em vez de um Gmail pessoal.

## Alternativas, em ordem de preferência

| Domínio | Quando faz sentido |
|---|---|
| `congressodochopp.com.br` | **primeira escolha** — nome exato da marca |
| `congressodochopp.com` | se quiser proteger a marca também no `.com`; aponte para o `.com.br` |
| `congressochopp.com.br` | versão curta; registre como defensivo e redirecione |
| `rodiziocongresso.com.br` | bom para campanha paga focada em "rodízio", não como principal |
| `congressodochoppcampogrande.com.br` | longo demais para digitar ou ditar no telefone |

**Evite** domínios com hífen (`congresso-do-chopp.com.br`): dão trabalho para
ditar e são associados a site improvisado.

## Já existe um domínio na praça

As buscas apontam um `restaurantecongresso.com.br` associado ao restaurante, e o
cardápio digital vive em `congressodochopp-2.ola.click`.

Antes de registrar qualquer coisa, vale confirmar com o proprietário:

- Se `restaurantecongresso.com.br` **já é do restaurante**, o caminho mais barato
  é apontá-lo para este site e registrar `congressodochopp.com.br` como domínio
  principal, com o antigo redirecionando 301 para ele (preserva o histórico de
  SEO).
- Se **não é**, ignore e siga com `congressodochopp.com.br`.

O `ola.click` deve continuar existindo — ele é a plataforma de pedidos. O ideal
é o site novo linkar para ele em vez de tentar substituí-lo.

## Como registrar

1. Entre em [registro.br](https://registro.br) e consulte a disponibilidade.
2. Registre em nome do **CNPJ 08.839.825/0001-06** (Congresso do Chopp Bar e
   Restaurante Ltda.), não no CPF de um sócio — evita dor de cabeça em caso de
   troca de sociedade.
3. Pague por **3 anos de uma vez**: sai mais barato e o Google considera
   domínios com registro longo levemente mais confiáveis.
4. Ative a renovação automática. Domínio expirado é o jeito mais rápido de
   perder todo o tráfego orgânico conquistado.
5. Siga o passo a passo de DNS em [`README.md`](README.md#apontar-um-domínio-próprio).

> **Disponibilidade não foi verificada.** O ambiente onde este site foi montado
> não tem acesso de rede ao registro.br, então nenhum dos domínios acima foi
> consultado. Confirme cada um antes de decidir.

## Depois de publicar

- [ ] Cadastrar o domínio no [Google Search Console](https://search.google.com/search-console)
      e enviar o `sitemap.xml`.
- [ ] Colocar o site no **Google Business Profile** do restaurante — é de onde
      vem a maior parte do tráfego de um negócio local.
- [ ] Atualizar o link na bio do Instagram e na página do Facebook.
- [ ] Pedir atualização do endereço do site nos guias onde o restaurante já
      aparece (Restaurant Guru, Apontador, Kekanto, Foursquare, Guia do Rodízio).

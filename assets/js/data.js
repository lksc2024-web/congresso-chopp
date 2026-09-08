/* ============================================================
   JOYCE BEAUTY — Dados demonstrativos
   ATENÇÃO: conteúdo fictício, criado apenas para a prévia.
   Produtos, preços e descrições são ilustrativos.
   ============================================================ */

/* Configurações que a cliente poderá ajustar depois */
const CONFIG = {
  brand: 'Joyce Beauty',
  tagline: 'Professional Hair Care',
  // Substituir pelo número real no formato 55DDNÚMERO (ex.: 5511999999999)
  whatsapp: '',
  instagram: '' // ex.: 'joycebeauty'
};

/* Paletas dos frascos */
const PAL = {
  cream: ['#F7F1E8', '#E8DCCC', '#CAB79D', '#B9A58A'],
  sand:  ['#F3E7D7', '#E1CEB5', '#C0A789', '#AF9575'],
  sage:  ['#E7EEE8', '#D0DDD2', '#AABDAF', '#97AC9D'],
  lilac: ['#EEE8F4', '#D9CCE7', '#B3A1CC', '#A08DBC'],
  amber: ['#F7E5C7', '#E8CC9D', '#CAA76C', '#B79358'],
  blue:  ['#E7EEF4', '#D0DDE8', '#A9BFCE', '#96AFC0'],
  plum:  ['#F0E1E7', '#DDC4CF', '#BA9AA9', '#A88797'],
  dark:  ['#4A3F36', '#2A2320', '#151110', '#0E0B0A'],
  rose:  ['#F7E8E3', '#E9D0C8', '#CCA89D', '#BA968B']
};
const BG = {
  warm:  ['#F6EDE3', '#E5D6C4'],
  linen: ['#F7F1E9', '#E8DCCB'],
  sage:  ['#EFF2ED', '#DCE3D9'],
  lilac: ['#F2EEF6', '#E0D8EA'],
  blue:  ['#EDF2F5', '#DAE3EA'],
  rose:  ['#F8EEE9', '#EBD9D1']
};

const CATEGORIES = [
  { id: 'shampoos',   name: 'Shampoos',    sub: 'Limpeza',      art: { shape: 'bottle', body: PAL.cream, cap: 'gold', bg: BG.linen } },
  { id: 'mascaras',   name: 'Máscaras',    sub: 'Tratamento',   art: { shape: 'jar',    body: PAL.dark,  cap: 'gold', bg: BG.warm } },
  { id: 'hidratacao', name: 'Hidratação',  sub: 'Água',         art: { shape: 'jar',    body: PAL.sage,  cap: 'gold', bg: BG.sage } },
  { id: 'nutricao',   name: 'Nutrição',    sub: 'Lipídios',     art: { shape: 'bottle', body: PAL.sand,  cap: 'gold', bg: BG.warm } },
  { id: 'reconstrucao', name: 'Reconstrução', sub: 'Proteína',  art: { shape: 'pump',   body: PAL.amber, cap: 'gold', bg: BG.linen } },
  { id: 'loiros',     name: 'Cabelos Loiros', sub: 'Matização', art: { shape: 'bottle', body: PAL.lilac, cap: 'gold', bg: BG.lilac } },
  { id: 'termicos',   name: 'Protetores Térmicos', sub: 'Proteção', art: { shape: 'pump', body: PAL.blue, cap: 'gold', bg: BG.blue } },
  { id: 'finalizadores', name: 'Finalizadores', sub: 'Brilho',   art: { shape: 'bottle', body: PAL.dark, cap: 'gold', bg: BG.warm } },
  { id: 'kits',       name: 'Kits',        sub: 'Rotina',       art: { shape: 'tube',   body: PAL.rose,  cap: 'gold', bg: BG.rose } }
];

const PRODUCTS = [
  {
    id: 'serum-reparador',
    name: 'Sérum Reparador Fio a Fio',
    cat: 'reconstrucao', catName: 'Reconstrução',
    price: 129.9, old: 149.9, vol: '60 ml', badge: 'Mais vendido',
    art: { shape: 'pump', body: PAL.amber, cap: 'gold', bg: BG.linen, label: 'Sérum\nReparador', vol: '60 ML' },
    desc: 'Sérum concentrado de toque seco, desenvolvido para atuar ponto a ponto nas áreas mais frágeis do fio. Sela as cutículas, reduz o aspecto poroso e devolve alinhamento ao comprimento sem pesar.',
    bens: ['Selagem das cutículas', 'Reduz frizz e pontas duplas', 'Toque seco, não pesa', 'Uso diário no comprimento'],
    ind: 'Cabelos quimicamente tratados, com quebra ou pontas fragilizadas.',
    how: ['Aplique de 2 a 3 gotas nas mãos.', 'Distribua no comprimento e nas pontas, com os cabelos úmidos ou secos.', 'Finalize normalmente. Não enxágue.']
  },
  {
    id: 'mascara-hidratacao',
    name: 'Máscara Hidratação Intensa',
    cat: 'hidratacao', catName: 'Hidratação',
    price: 149.9, old: null, vol: '300 g',
    art: { shape: 'jar', body: PAL.sage, cap: 'gold', bg: BG.sage, label: 'Máscara\nHidratação', vol: '300 G' },
    desc: 'Máscara de alta densidade para reposição de água. Textura cremosa que envolve o fio, devolvendo maciez, movimento e maleabilidade já na primeira aplicação.',
    bens: ['Reposição intensa de água', 'Maciez e maleabilidade', 'Desembaraço imediato', 'Textura rica, fácil de enxaguar'],
    ind: 'Cabelos ressecados, ásperos ou com aspecto opaco.',
    how: ['Lave com o shampoo da linha e retire o excesso de água.', 'Aplique nos comprimentos e pontas.', 'Deixe agir de 5 a 10 minutos e enxágue.']
  },
  {
    id: 'shampoo-nutricao',
    name: 'Shampoo Nutrição Profunda',
    cat: 'shampoos', catName: 'Shampoos',
    price: 89.9, old: null, vol: '250 ml',
    art: { shape: 'bottle', body: PAL.cream, cap: 'gold', bg: BG.linen, label: 'Shampoo\nNutrição', vol: '250 ML' },
    desc: 'Shampoo de limpeza equilibrada, formulado para higienizar sem retirar os lipídios naturais do fio. Prepara o cabelo para receber o tratamento seguinte.',
    bens: ['Limpeza suave e equilibrada', 'Preserva a nutrição do fio', 'Espuma cremosa e densa', 'Ideal como primeiro passo da rotina'],
    ind: 'Cabelos secos, porosos ou que perdem brilho com facilidade.',
    how: ['Aplique no couro cabeludo úmido.', 'Massageie e emulsione.', 'Enxágue e repita se necessário.']
  },
  {
    id: 'condicionador-selagem',
    name: 'Condicionador Selagem Diária',
    cat: 'nutricao', catName: 'Nutrição',
    price: 94.9, old: null, vol: '250 ml',
    art: { shape: 'bottle', body: PAL.sand, cap: 'gold', bg: BG.warm, label: 'Condicionador', vol: '250 ML' },
    desc: 'Condicionador de uso diário que fecha a cutícula logo após a lavagem, deixando o fio alinhado, brilhante e protegido contra a perda de nutrientes.',
    bens: ['Selagem imediata da cutícula', 'Brilho e alinhamento', 'Facilita a escovação', 'Uso diário'],
    ind: 'Todos os tipos de cabelo, especialmente os que embaraçam com facilidade.',
    how: ['Após o shampoo, retire o excesso de água.', 'Aplique nos comprimentos e pontas.', 'Deixe agir 2 minutos e enxágue.']
  },
  {
    id: 'matizador-blond',
    name: 'Matizador Blond Perfeito',
    cat: 'loiros', catName: 'Cabelos Loiros',
    price: 119.9, old: 139.9, vol: '250 ml', badge: 'Novo',
    art: { shape: 'bottle', body: PAL.lilac, cap: 'gold', bg: BG.lilac, label: 'Blond\nPerfeito', vol: '250 ML' },
    desc: 'Máscara matizadora de pigmentação violeta, criada para neutralizar tons amarelados e prolongar o resultado do salão entre uma visita e outra.',
    bens: ['Neutraliza tons amarelados', 'Prolonga o loiro do salão', 'Hidrata enquanto matiza', 'Intensidade controlável pelo tempo de pausa'],
    ind: 'Cabelos loiros, grisalhos, platinados ou com mechas.',
    how: ['Aplique nos cabelos limpos e úmidos.', 'Deixe agir de 3 a 10 minutos conforme a intensidade desejada.', 'Enxágue bem.']
  },
  {
    id: 'protetor-termico',
    name: 'Protetor Térmico Leve',
    cat: 'termicos', catName: 'Protetores Térmicos',
    price: 79.9, old: null, vol: '200 ml',
    art: { shape: 'pump', body: PAL.blue, cap: 'gold', bg: BG.blue, label: 'Protetor\nTérmico', vol: '200 ML' },
    desc: 'Spray leve que forma um véu protetor entre o fio e a fonte de calor, reduzindo o impacto do secador, da prancha e do babyliss na rotina de finalização.',
    bens: ['Barreira contra o calor', 'Textura leve, sem resíduo', 'Ajuda a controlar o frizz', 'Facilita a modelagem'],
    ind: 'Quem usa secador, prancha ou modelador com frequência.',
    how: ['Borrife nos cabelos úmidos ou secos, a 20 cm de distância.', 'Distribua com o pente.', 'Finalize com a fonte de calor.']
  },
  {
    id: 'oleo-finalizador',
    name: 'Óleo Finalizador Brilho Seda',
    cat: 'finalizadores', catName: 'Finalizadores',
    price: 109.9, old: null, vol: '60 ml',
    art: { shape: 'bottle', body: PAL.dark, cap: 'gold', bg: BG.warm, label: 'Brilho\nSeda', vol: '60 ML', labelDark: 1 },
    desc: 'Óleo finalizador de absorção rápida que entrega brilho de acabamento profissional, alinhando o fio e controlando o volume indesejado ao final da escova.',
    bens: ['Brilho de acabamento', 'Controle do volume', 'Absorção rápida', 'Não deixa aspecto oleoso'],
    ind: 'Cabelos sem brilho, opacos ou com aspecto arrepiado.',
    how: ['Aqueça 1 a 2 gotas entre as mãos.', 'Passe pelo comprimento e pontas.', 'Use no cabelo seco, como último passo.']
  },
  {
    id: 'ampola-express',
    name: 'Ampola Reconstrução Express',
    cat: 'reconstrucao', catName: 'Reconstrução',
    price: 39.9, old: null, vol: '15 ml',
    art: { shape: 'tube', body: PAL.plum, cap: 'gold', bg: BG.rose, label: 'Ampola\nExpress', vol: '15 ML' },
    desc: 'Dose única de ativos reconstrutores para momentos de emergência capilar. Repõe massa no fio e devolve resistência em poucos minutos de pausa.',
    bens: ['Reposição de massa', 'Resultado em minutos', 'Dose única e prática', 'Ideal antes de eventos'],
    ind: 'Cabelos elásticos, quebradiços ou após química.',
    how: ['Aplique em todo o comprimento, no cabelo lavado.', 'Deixe agir de 3 a 5 minutos.', 'Enxágue e finalize.']
  }
];

const KITS = [
  {
    id: 'kit-hidratacao', name: 'Kit Hidratação', price: 259.9, old: 314.7,
    desc: 'Shampoo, máscara e finalizador para repor água e devolver maciez ao fio.',
    art: { body: PAL.sage, body2: PAL.cream, body3: PAL.sand, cap: 'gold', bg: BG.sage }
  },
  {
    id: 'kit-reconstrucao', name: 'Kit Reconstrução', price: 289.9, old: 349.6,
    desc: 'Rotina de reposição de massa para cabelos com quebra e elasticidade.',
    art: { body: PAL.amber, body2: PAL.plum, body3: PAL.cream, cap: 'gold', bg: BG.linen }
  },
  {
    id: 'kit-cronograma', name: 'Kit Cronograma Capilar', price: 379.9, old: 464.5,
    desc: 'As três etapas — hidratação, nutrição e reconstrução — em um só combo.',
    art: { body: PAL.cream, body2: PAL.dark, body3: PAL.sage, cap: 'gold', bg: BG.warm }
  },
  {
    id: 'kit-loiros', name: 'Kit Loiros', price: 274.9, old: 329.7,
    desc: 'Matização e cuidado para manter o loiro limpo e iluminado por mais tempo.',
    art: { body: PAL.lilac, body2: PAL.cream, body3: PAL.blue, cap: 'gold', bg: BG.lilac }
  }
];

const NEEDS = [
  { need: 'Cabelos ressecados', sol: 'Hidratação',       cat: 'hidratacao', tip: 'Reposição de água e maciez', art: { shape: 'jar', body: PAL.sage, cap: 'gold', bg: BG.sage } },
  { need: 'Cabelos danificados', sol: 'Reconstrução',    cat: 'reconstrucao', tip: 'Reposição de massa e força', art: { shape: 'pump', body: PAL.amber, cap: 'gold', bg: BG.linen } },
  { need: 'Cabelos sem brilho', sol: 'Nutrição',         cat: 'nutricao', tip: 'Lipídios, brilho e alinhamento', art: { shape: 'bottle', body: PAL.sand, cap: 'gold', bg: BG.warm } },
  { need: 'Cabelos loiros', sol: 'Linha para Loiros',    cat: 'loiros', tip: 'Matização e controle do amarelado', art: { shape: 'bottle', body: PAL.lilac, cap: 'gold', bg: BG.lilac } },
  { need: 'Uso de calor', sol: 'Proteção Térmica',       cat: 'termicos', tip: 'Barreira para secador e prancha', art: { shape: 'pump', body: PAL.blue, cap: 'gold', bg: BG.blue } }
];

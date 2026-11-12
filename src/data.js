// Conteúdo de exemplo: pets, parceiros e bairros fictícios de São Paulo.

export const PETS = {
  pacoca: {
    key: 'pacoca', name: 'Paçoca', article: 'da', breed: 'Vira-lata caramelo', age: '3 anos',
    photo: 'pacoca', color: '#D9923B', colorText: '#9A5B14', colorDark: '#E6AE66', onColor: '#2B1B08',
    status: 'passeando', mine: true,
  },
  luna: {
    key: 'luna', name: 'Luna', article: 'da', breed: 'Gata sem raça definida', age: '5 anos',
    photo: 'luna', color: '#3F9B7C', colorText: '#1F6F57', colorDark: '#6CC7A6', onColor: '#06231A',
    status: 'dormindo', mine: true,
  },
  amora: {
    key: 'amora', name: 'Amora', article: 'da', breed: 'Spitz alemão', age: '1 ano',
    photo: 'amora', color: '#D9708F', colorText: '#A8456A', colorDark: '#F09BB4', onColor: '#33101D',
    status: 'em casa', mine: true,
  },
  mel: { key: 'mel', name: 'Mel', article: 'da', photo: 'mel', color: '#C79A3E', colorDark: '#E2BC6A', status: 'no banho' },
  thor: { key: 'thor', name: 'Thor', article: 'do', photo: 'thor', color: '#E0B12E', colorDark: '#EDC95A', status: 'dormindo' },
  bidu: { key: 'bidu', name: 'Bidu', article: 'do', photo: 'bidu', color: '#C98F86', colorDark: '#E2B0A8' },
  frida: { key: 'frida', name: 'Frida', article: 'da', photo: 'frida', color: '#D07A3A', colorDark: '#E79A5E' },
  nina: { key: 'nina', name: 'Nina', article: 'da', photo: 'nina', color: '#C58BA0', colorDark: '#DDA9BB' },
  pipoca: { key: 'pipoca', name: 'Pipoca', article: 'da', photo: 'pipoca', color: '#5E8F5A', colorDark: '#8DBF88' },
};

export const MY_PETS = ['pacoca', 'luna', 'amora'];

export const PARTNERS = {
  bichoBom: { key: 'bichoBom', name: 'Pet Shop Bicho Bom', initials: 'BB', color: '#5B7C6E', area: 'Vila Madalena', verified: true },
  quatroPatas: { key: 'quatroPatas', name: 'Clínica Quatro Patas', initials: 'QP', color: '#4E6E91', area: 'Pinheiros', verified: true },
  banhoCia: {
    key: 'banhoCia', name: 'Banho & Cia', initials: 'B&', color: '#8A6BA3', area: 'Perdizes', verified: true,
    rating: '4,8', reviews: 312, distance: '1,2 km', price: '$$', open: true, nextSlot: 'hoje, 16h30', photo: 'pipoca',
  },
};

// Semana de 9 a 15 de novembro de 2026. Hoje é quinta, dia 12.
export const TODAY_INDEX = 3;
export const WEEK = [
  { short: 'S', label: 'Seg', day: 9 },
  { short: 'T', label: 'Ter', day: 10 },
  { short: 'Q', label: 'Qua', day: 11 },
  { short: 'Q', label: 'Qui', day: 12 },
  { short: 'S', label: 'Sex', day: 13 },
  { short: 'S', label: 'Sáb', day: 14 },
  { short: 'D', label: 'Dom', day: 15 },
];
export const TODAY_LONG = 'Quinta, 12 de novembro';

// Compromissos por pet, pelo índice do dia na semana.
export const AGENDA = {
  pacoca: {
    1: { icon: 'check', title: 'Vermífugo', time: 'feito às 8h', where: 'Registrado por você', done: true },
    3: { icon: 'drop', title: 'Banho e tosa', time: '14h', where: 'Pet Shop Bicho Bom · Vila Madalena', partner: 'bichoBom' },
    5: { icon: 'shield', title: 'Reforço da vacina V10', time: '10h', where: 'Clínica Quatro Patas · Pinheiros', partner: 'quatroPatas' },
  },
  luna: {
    3: { icon: 'pill', title: 'Remédio do rim', time: '20h', where: 'Meio comprimido, com a ração' },
    4: { icon: 'shield', title: 'Consulta de rotina', time: '9h30', where: 'Clínica Quatro Patas · Pinheiros', partner: 'quatroPatas' },
  },
  amora: {
    0: { icon: 'check', title: 'Pesagem', time: 'feito às 19h', where: '4,2 kg, dentro da meta', done: true },
    6: { icon: 'drop', title: 'Banho', time: '11h', where: 'Banho & Cia · Perdizes', partner: 'banhoCia' },
  },
};

export const STORIES = ['mel', 'thor', 'bidu', 'frida', 'nina', 'pipoca'];

export const POSTS = [
  {
    id: 'p1', type: 'beforeAfter', pet: 'mel', partner: 'bichoBom', place: 'Vila Madalena', time: '2 h',
    photos: ['melAntes', 'melDepois'], ratio: 1,
    caption: 'Dia de banho. Saiu cheirosa e já pedindo petisco.', paws: 248, comments: 18,
  },
  {
    id: 'p2', type: 'photo', pet: 'thor', place: 'Pinheiros', time: '5 h',
    photos: ['thor'], ratio: 4 / 5,
    caption: 'Descobriu que frio combina com cachecol.', paws: 1204, comments: 96,
  },
  {
    id: 'p3', type: 'sponsored', partner: 'quatroPatas', place: 'Pinheiros',
    photos: ['amigos'], ratio: 1.5,
    caption: 'Vacinas em dia para cães e gatos. Novos clientes ganham 15% na primeira consulta.',
    cta: 'Agendar consulta',
  },
  {
    id: 'p4', type: 'carousel', pet: 'luna', place: 'Perdizes', time: 'ontem',
    photos: ['luna2', 'luna3', 'frida'], ratio: 1,
    caption: 'Três jeitos de ignorar o arranhador novo.', paws: 532, comments: 41,
  },
  { id: 'p5', type: 'suggestion', partner: 'banhoCia' },
  {
    id: 'p6', type: 'video', pet: 'amora', place: 'Parque da Água Branca', time: 'ontem',
    photos: ['amora2'], ratio: 4 / 5, duration: '0:24',
    caption: 'Primeiro passeio sem puxar a guia. Sequência de 12 dias.', paws: 87, comments: 9,
  },
];

export const TABS = [
  { key: 'inicio', label: 'Início', icon: 'home' },
  { key: 'servicos', label: 'Serviços', icon: 'store', stage: 4 },
  { key: 'criar', label: 'Criar', icon: 'plus' },
  { key: 'matilhas', label: 'Matilhas', icon: 'users', stage: 5 },
  { key: 'pet', label: 'Pet', icon: 'paw', stage: 6 },
];

export const fmt = (n) => n.toLocaleString('pt-BR');

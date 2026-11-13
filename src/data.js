// Conteúdo de exemplo: pets, tutores, parceiros e bairros fictícios de São Paulo.
// Hoje, no app, é quinta-feira, 12 de novembro de 2026.

export const ME = { name: 'David', handle: '@david', area: 'Perdizes, São Paulo', address: 'Rua Cardoso de Almeida, 1200 · ap 54' };

export const PETS = {
  pacoca: {
    key: 'pacoca', name: 'Paçoca', article: 'do', breed: 'Vira-lata caramelo', species: 'Cão', age: '3 anos', born: '14/03/2023',
    size: 'Médio', coat: 'Curta', weight: '14,2 kg',
    photo: 'pacoca', color: '#D9923B', colorText: '#9A5B14', colorDark: '#E6AE66', onColor: '#2B1B08',
    status: 'passeando', mine: true, followers: 1284, following: 312, posts: 86,
    bio: 'Caramelo, curioso e fã de petisco de batata-doce. Resgatado em 2023.',
  },
  luna: {
    key: 'luna', name: 'Luna', article: 'da', breed: 'Gata sem raça definida', species: 'Gato', age: '5 anos', born: '02/08/2021',
    size: 'Pequeno', coat: 'Curta', weight: '4,1 kg',
    photo: 'luna', color: '#3F9B7C', colorText: '#1F6F57', colorDark: '#6CC7A6', onColor: '#06231A',
    status: 'dormindo', mine: true, followers: 842, following: 97, posts: 54,
    bio: 'Dona do sofá. Aceita carinho só das 21h às 21h05.',
  },
  amora: {
    key: 'amora', name: 'Amora', article: 'da', breed: 'Spitz alemão', species: 'Cão', age: '1 ano', born: '20/09/2025',
    size: 'Pequeno', coat: 'Longa', weight: '4,2 kg',
    photo: 'amora', color: '#D9708F', colorText: '#A8456A', colorDark: '#F09BB4', onColor: '#33101D',
    status: 'em casa', mine: true, followers: 2310, following: 140, posts: 41,
    bio: 'Uma nuvem que late. Aprendendo a passear sem puxar.',
  },
  mel: { key: 'mel', name: 'Mel', article: 'da', breed: 'Golden retriever', age: '4 anos', photo: 'mel', color: '#C79A3E', colorDark: '#E2BC6A', status: 'no banho', tutor: 'Camila', area: 'Vila Madalena' },
  thor: { key: 'thor', name: 'Thor', article: 'do', breed: 'Pug', age: '6 anos', photo: 'thor', color: '#E0B12E', colorDark: '#EDC95A', status: 'dormindo', tutor: 'Rafael', area: 'Pinheiros' },
  bidu: { key: 'bidu', name: 'Bidu', article: 'do', breed: 'Jack Russell', age: '2 anos', photo: 'bidu', color: '#C98F86', colorDark: '#E2B0A8', tutor: 'Marina', area: 'Perdizes' },
  frida: { key: 'frida', name: 'Frida', article: 'da', breed: 'Gata laranja', age: '3 anos', photo: 'frida', color: '#D07A3A', colorDark: '#E79A5E', tutor: 'Bruno', area: 'Pompeia' },
  nina: { key: 'nina', name: 'Nina', article: 'da', breed: 'Cavalier King Charles', age: '1 ano', photo: 'nina', color: '#C58BA0', colorDark: '#DDA9BB', tutor: 'Júlia', area: 'Higienópolis' },
  pipoca: { key: 'pipoca', name: 'Pipoca', article: 'da', breed: 'Poodle', age: '2 anos', photo: 'pipoca', color: '#5E8F5A', colorDark: '#8DBF88', tutor: 'Lucas', area: 'Lapa' },
};

export const MY_PETS = ['pacoca', 'luna', 'amora'];
export const OTHER_PETS = ['mel', 'thor', 'bidu', 'frida', 'nina', 'pipoca'];

// ——— Parceiros ———

export const CATEGORIES = [
  { key: 'banho', label: 'Banho e tosa', icon: 'drop' },
  { key: 'vet', label: 'Veterinário', icon: 'stethoscope' },
  { key: 'hotel', label: 'Hotel', icon: 'bed' },
  { key: 'creche', label: 'Creche', icon: 'school' },
  { key: 'adestrador', label: 'Adestrador', icon: 'whistle' },
  { key: 'passeador', label: 'Passeador', icon: 'leash' },
];

const SIZES = ['Pequeno', 'Médio', 'Grande'];
export { SIZES };

export const PARTNERS = {
  bichoBom: {
    key: 'bichoBom', name: 'Pet Shop Bicho Bom', initials: 'BB', color: '#5B7C6E', area: 'Vila Madalena', category: 'banho',
    verified: true, rating: '4,9', reviews: 518, distance: '0,8 km', price: '$$', open: true, nextSlot: 'hoje, 15h30', cover: 'pacoca2',
    address: 'Rua Harmonia, 410 · Vila Madalena', hours: 'Seg a sáb, 8h às 19h', delivery: true, eta: '12 min',
    about: 'Banho e tosa sem pressa, com secagem em baixa temperatura e produtos hipoalergênicos. Desde 2014.',
  },
  quatroPatas: {
    key: 'quatroPatas', name: 'Clínica Quatro Patas', initials: 'QP', color: '#4E6E91', area: 'Pinheiros', category: 'vet',
    verified: true, rating: '4,8', reviews: 904, distance: '2,1 km', price: '$$$', open: true, nextSlot: 'amanhã, 9h', cover: 'amigos',
    address: 'Rua dos Pinheiros, 1580 · Pinheiros', hours: 'Todos os dias, 24 horas', delivery: false, eta: '',
    about: 'Clínica geral, vacinas, exames e emergência 24 horas. Atendimento para cães e gatos.',
  },
  banhoCia: {
    key: 'banhoCia', name: 'Banho & Cia', initials: 'B&', color: '#8A6BA3', area: 'Perdizes', category: 'banho',
    verified: true, rating: '4,8', reviews: 312, distance: '1,2 km', price: '$$', open: true, nextSlot: 'hoje, 16h30', cover: 'pipoca',
    address: 'Rua Monte Alegre, 820 · Perdizes', hours: 'Ter a dom, 9h às 18h', delivery: true, eta: '15 min',
    about: 'Estética animal com hidratação, tosa na tesoura e spa para pelagem longa.',
  },
  hotelLatido: {
    key: 'hotelLatido', name: 'Hotel Latido', initials: 'HL', color: '#9A6B3C', area: 'Pompeia', category: 'hotel',
    verified: true, rating: '4,7', reviews: 187, distance: '2,8 km', price: '$$$', open: true, nextSlot: 'sex, 13 de nov', cover: 'dupla',
    address: 'Rua Tucuna, 77 · Pompeia', hours: 'Check-in das 8h às 20h', delivery: true, eta: '20 min',
    about: 'Hospedagem com quintal, monitoramento por câmera e passeios duas vezes ao dia.',
  },
  crecheAuau: {
    key: 'crecheAuau', name: 'Creche Pé de Pano', initials: 'PP', color: '#6E8A3C', area: 'Lapa', category: 'creche',
    verified: false, rating: '4,6', reviews: 96, distance: '3,4 km', price: '$$', open: false, nextSlot: 'seg, 16 de nov', cover: 'filhotes',
    address: 'Rua Guaicurus, 1300 · Lapa', hours: 'Seg a sex, 7h às 19h', delivery: true, eta: '25 min',
    about: 'Creche com turmas por porte e energia, relatório do dia com fotos.',
  },
  adestraJu: {
    key: 'adestraJu', name: 'Ju Adestra', initials: 'JA', color: '#B0603F', area: 'Atende em casa', category: 'adestrador',
    verified: true, rating: '5,0', reviews: 64, distance: 'vai até você', price: '$$', open: true, nextSlot: 'sáb, 14 de nov', cover: 'amora2',
    address: 'Atendimento a domicílio · zona oeste', hours: 'Seg a sáb, 8h às 20h', delivery: false, eta: '',
    about: 'Adestramento positivo, guia frouxa e socialização de filhotes.',
  },
  passeioZe: {
    key: 'passeioZe', name: 'Passeios do Zé', initials: 'PZ', color: '#3F7F8C', area: 'Perdizes e Pompeia', category: 'passeador',
    verified: true, rating: '4,9', reviews: 141, distance: '0,5 km', price: '$', open: true, nextSlot: 'hoje, 17h', cover: 'filhotes',
    address: 'Atende Perdizes, Pompeia e Água Branca', hours: 'Todos os dias, 6h às 20h', delivery: false, eta: '',
    about: 'Passeios de 30 ou 60 minutos em grupos de até 3, com GPS e foto no fim.',
  },
};

export const PARTNER_ORDER = ['bichoBom', 'banhoCia', 'quatroPatas', 'passeioZe', 'hotelLatido', 'adestraJu', 'crecheAuau'];
export const NEARBY = ['bichoBom', 'passeioZe', 'banhoCia', 'quatroPatas', 'hotelLatido'];
export const FEATURED = ['banhoCia', 'hotelLatido', 'adestraJu'];

// Serviços com preço por porte (pequeno, médio, grande). Pelagem longa soma o adicional.
export const SERVICES = {
  bichoBom: [
    { key: 'banho', name: 'Banho', mins: 60, prices: [55, 70, 90], desc: 'Shampoo neutro, secagem em baixa temperatura, ouvidos e unhas.' },
    { key: 'banhoTosa', name: 'Banho e tosa higiênica', mins: 80, prices: [70, 85, 110], desc: 'Banho completo e tosa nas patas, barriga e região íntima.' },
    { key: 'tosaCompleta', name: 'Banho e tosa completa', mins: 120, prices: [95, 120, 160], desc: 'Tosa na máquina ou tesoura, no estilo que você pedir.' },
  ],
  banhoCia: [
    { key: 'banho', name: 'Banho', mins: 60, prices: [50, 65, 85], desc: 'Banho com secagem e perfume suave.' },
    { key: 'spa', name: 'Spa de hidratação', mins: 90, prices: [80, 95, 120], desc: 'Hidratação profunda para pelagem longa ou ressecada.' },
  ],
  quatroPatas: [
    { key: 'consulta', name: 'Consulta clínica', mins: 40, prices: [180, 180, 180], desc: 'Avaliação completa com o clínico geral.' },
    { key: 'vacina', name: 'Vacina V10 ou V4', mins: 20, prices: [120, 120, 120], desc: 'Aplicação com registro direto na carteirinha.' },
    { key: 'retorno', name: 'Retorno', mins: 20, prices: [0, 0, 0], desc: 'Até 30 dias depois da consulta.' },
  ],
  hotelLatido: [{ key: 'diaria', name: 'Diária', mins: 1440, prices: [110, 130, 150], desc: 'Hospedagem com dois passeios e câmera ao vivo.' }],
  crecheAuau: [{ key: 'dia', name: 'Dia de creche', mins: 600, prices: [75, 85, 95], desc: 'Das 7h às 19h, com relatório e fotos.' }],
  adestraJu: [{ key: 'aula', name: 'Aula de adestramento', mins: 60, prices: [150, 150, 150], desc: 'Aula em casa, com plano de exercícios.' }],
  passeioZe: [
    { key: 'p30', name: 'Passeio de 30 min', mins: 30, prices: [35, 35, 40], desc: 'Volta no quarteirão com foto no fim.' },
    { key: 'p60', name: 'Passeio de 60 min', mins: 60, prices: [55, 55, 60], desc: 'Parque da Água Branca ou praça mais próxima.' },
  ],
};

export const EXTRAS = [
  { key: 'hidratacao', name: 'Hidratação', price: 25 },
  { key: 'dentes', name: 'Escovação de dentes', price: 15 },
  { key: 'perfume', name: 'Perfume e laço', price: 8 },
  { key: 'pelagem', name: 'Pelagem longa', price: 20 },
];

export const TEAM = {
  bichoBom: [
    { key: 'carla', name: 'Carla', role: 'Tosadora · 9 anos de casa', initials: 'CA', color: '#B57B55' },
    { key: 'rogerio', name: 'Rogério', role: 'Banhista', initials: 'RO', color: '#6D8A79' },
    { key: 'qualquer', name: 'Sem preferência', role: 'Primeiro horário livre', initials: '··', color: '#8A8178' },
  ],
};

export const REVIEWS = [
  { who: 'Camila, tutora da Mel', stars: 5, when: 'há 2 dias', text: 'A Mel tem medo de secador e a Carla teve uma paciência enorme. Voltou cheirosa e tranquila.' },
  { who: 'Rafael, tutor do Thor', stars: 5, when: 'há 1 semana', text: 'Mandaram foto em cada etapa. O leva e traz chegou no horário.', reply: 'Obrigado, Rafael! O Thor é sempre bem-vindo.' },
  { who: 'Júlia, tutora da Nina', stars: 4, when: 'há 2 semanas', text: 'Ótimo atendimento. Só demorou uns 15 minutos a mais do que o previsto.' },
];

export const DAYS_AHEAD = [
  { key: 'qui12', label: 'Hoje', sub: 'qui, 12' },
  { key: 'sex13', label: 'Amanhã', sub: 'sex, 13' },
  { key: 'sab14', label: 'Sábado', sub: '14 nov' },
  { key: 'seg16', label: 'Segunda', sub: '16 nov' },
  { key: 'ter17', label: 'Terça', sub: '17 nov' },
];
export const SLOTS = {
  qui12: ['15h30', '16h00', '17h30'],
  sex13: ['9h00', '10h30', '11h00', '14h00', '15h30', '17h00'],
  sab14: ['8h30', '9h00', '13h00', '14h30'],
  seg16: ['9h00', '10h00', '11h30', '14h00', '16h00', '17h30'],
  ter17: ['8h30', '10h00', '13h30', '15h00', '16h30'],
};

export const COUPONS = [
  { code: 'PRIMEIRO15', label: '15% no primeiro agendamento', pct: 15 },
  { code: 'BANHO10', label: 'R$ 10 de desconto em banho', off: 10 },
];

export const SERVICE_FEE_PCT = 5;

// ——— Agenda da semana (9 a 15 de novembro) ———

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

export const AGENDA = {
  pacoca: {
    1: { icon: 'check', title: 'Vermífugo', time: 'feito às 8h', where: 'Registrado por você', done: true },
    3: { icon: 'drop', title: 'Banho e tosa', time: '14h', where: 'Pet Shop Bicho Bom · Vila Madalena', partner: 'bichoBom', booking: 'b1' },
    5: { icon: 'shield', title: 'Reforço da vacina V10', time: '10h', where: 'Clínica Quatro Patas · Pinheiros', partner: 'quatroPatas', booking: 'b2' },
  },
  luna: {
    3: { icon: 'pill', title: 'Remédio do rim', time: '20h', where: 'Meio comprimido, com a ração' },
    4: { icon: 'shield', title: 'Consulta de rotina', time: '9h30', where: 'Clínica Quatro Patas · Pinheiros', partner: 'quatroPatas', booking: 'b3' },
  },
  amora: {
    0: { icon: 'check', title: 'Pesagem', time: 'feito às 19h', where: '4,2 kg, dentro da meta', done: true },
    6: { icon: 'drop', title: 'Banho', time: '11h', where: 'Banho & Cia · Perdizes', partner: 'banhoCia', booking: 'b4' },
  },
};

// ——— Agendamentos ———

export const BOOKINGS = [
  {
    id: 'b1', pet: 'pacoca', partner: 'bichoBom', service: 'Banho e tosa higiênica', extras: ['Hidratação'], pro: 'Carla',
    day: 'Hoje, qui 12', time: '14h', total: 110, pay: 'Pix', status: 'live', stage: 2, delivery: true, note: 'Tem medo de secador.',
  },
  { id: 'b2', pet: 'pacoca', partner: 'quatroPatas', service: 'Vacina V10', extras: [], pro: 'Dra. Helena', day: 'Sáb, 14 de nov', time: '10h', total: 120, pay: 'Cartão', status: 'upcoming' },
  { id: 'b3', pet: 'luna', partner: 'quatroPatas', service: 'Consulta clínica', extras: [], pro: 'Dr. Paulo', day: 'Sex, 13 de nov', time: '9h30', total: 180, pay: 'No local', status: 'upcoming' },
  { id: 'b4', pet: 'amora', partner: 'banhoCia', service: 'Banho', extras: ['Pelagem longa'], pro: 'Sem preferência', day: 'Dom, 15 de nov', time: '11h', total: 70, pay: 'Pix', status: 'upcoming' },
  { id: 'b5', pet: 'pacoca', partner: 'bichoBom', service: 'Banho', extras: [], pro: 'Rogério', day: '29 de out', time: '10h', total: 70, pay: 'Pix', status: 'done', rated: 5 },
  { id: 'b6', pet: 'pacoca', partner: 'passeioZe', service: 'Passeio de 60 min', extras: [], pro: 'Zé', day: '24 de out', time: '17h', total: 55, pay: 'Cartão', status: 'done' },
  { id: 'b7', pet: 'luna', partner: 'quatroPatas', service: 'Retorno', extras: [], pro: 'Dr. Paulo', day: '2 de out', time: '9h', total: 0, pay: '—', status: 'canceled' },
];

export const LIVE_STEPS = [
  { key: 'confirmado', label: 'Confirmado', sub: 'O Bicho Bom aceitou seu horário', at: '13h10' },
  { key: 'buscando', label: 'Leva e traz a caminho', sub: 'Rogério saiu para buscar o Paçoca', at: '13h35' },
  { key: 'chegou', label: 'Chegou', sub: 'Entregue à Carla, que leu as suas observações', at: '13h58' },
  { key: 'banho', label: 'No banho', sub: 'Shampoo neutro e hidratação', at: '14h05' },
  { key: 'secando', label: 'Secando', sub: 'Baixa temperatura, como você pediu', at: '' },
  { key: 'pronto', label: 'Pronto', sub: 'Saindo para entrega', at: '' },
];

// ——— Feed ———

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
    id: 'p4', type: 'carousel', pet: 'luna', place: 'Perdizes', time: 'ontem', mine: true,
    photos: ['luna2', 'luna3', 'frida'], ratio: 1,
    caption: 'Três jeitos de ignorar o arranhador novo.', paws: 532, comments: 41,
  },
  { id: 'p5', type: 'suggestion', partner: 'banhoCia' },
  {
    id: 'p6', type: 'video', pet: 'amora', place: 'Parque da Água Branca', time: 'ontem', mine: true,
    photos: ['amora2'], ratio: 4 / 5, duration: '0:24',
    caption: 'Primeiro passeio sem puxar a guia. Sequência de 12 dias.', paws: 87, comments: 9,
  },
  {
    id: 'p7', type: 'photo', pet: 'bidu', place: 'Perdizes', time: '2 dias',
    photos: ['bidu'], ratio: 1,
    caption: 'Esperando a pizza chegar. Ninguém me avisou que não era pra mim.', paws: 311, comments: 22,
  },
];

export const MY_GRID = {
  pacoca: ['pacoca', 'pacoca2', 'filhotes', 'dupla', 'pipoca', 'amigos', 'pacoca2', 'pacoca'],
  luna: ['luna', 'luna2', 'luna3', 'frida', 'luna2', 'luna'],
  amora: ['amora', 'amora2', 'amora', 'nina', 'amora2'],
};

export const COMMENTS = [
  { pet: 'thor', text: 'Que tosa linda! Onde foi?', time: '1 h', paws: 4 },
  { pet: 'pacoca', text: 'No Bicho Bom! A Carla é ótima com quem tem medo de secador.', time: '58 min', paws: 6, reply: true },
  { pet: 'nina', text: 'Mel sempre maravilhosa 🧡', time: '40 min', paws: 2 },
  { pet: 'bidu', text: 'Queria esse petisco também.', time: '12 min', paws: 1 },
];

export const NOTIFICATIONS = [
  { group: 'Agendamentos', items: [
    { icon: 'drop', title: 'O Paçoca está no banho', text: 'Pet Shop Bicho Bom · previsão de entrega às 15h20', time: 'agora', go: ['Live', { id: 'b1' }], tone: true },
    { icon: 'calendar', title: 'Lembrete: vacina V10 no sábado', text: 'Clínica Quatro Patas, às 10h', time: '1 h', go: ['BookingDetail', { id: 'b2' }] },
  ] },
  { group: 'Patinhas e comentários', items: [
    { pet: 'thor', title: 'Thor e mais 38 deram patinha', text: 'no post "Três jeitos de ignorar o arranhador novo."', time: '2 h', go: ['Post', { id: 'p4' }] },
    { pet: 'nina', title: 'Nina comentou', text: '"Amora sempre linda!"', time: '3 h', go: ['Post', { id: 'p6' }] },
  ] },
  { group: 'Matilhas', items: [
    { icon: 'alert', title: 'Pet perdido perto de você', text: 'Bob, beagle, visto na Rua Turiassu há 40 min', time: '40 min', go: ['Lost', {}], alert: true },
    { icon: 'hash', title: '#dicas em Vira-latas de SP', text: 'Marina: "Alguém indica petisco para filhote?"', time: '5 h', go: ['Channel', { matilha: 'viralatas', channel: 'dicas' }] },
  ] },
  { group: 'Saúde', items: [
    { icon: 'syringe', title: 'Antirrábica da Luna vence em 20 dias', text: 'Toque para agendar com quem já atendeu a Luna', time: 'ontem', go: ['Carteirinha', { pet: 'luna' }] },
  ] },
];

// ——— Matilhas ———

export const MATILHAS = [
  {
    key: 'viralatas', name: 'Vira-latas de SP', initials: 'VL', color: '#C98A3A', members: '12,4 mil', online: 318, kind: 'Raça',
    desc: 'Para quem ama SRD. Dicas, adoção e muita foto de caramelo.',
    channels: [
      { key: 'avisos', name: 'avisos', unread: 0, locked: true },
      { key: 'fotos', name: 'fotos', unread: 12 },
      { key: 'dicas', name: 'dicas', unread: 3 },
      { key: 'adocao', name: 'adoção', unread: 0 },
      { key: 'perdidos', name: 'perdidos', unread: 1, alert: true },
      { key: 'encontros', name: 'encontros', unread: 0 },
    ],
  },
  {
    key: 'perdizes', name: 'Pets de Perdizes', initials: 'PE', color: '#4F7F6E', members: '2,1 mil', online: 64, kind: 'Bairro',
    desc: 'Vizinhos de quatro patas de Perdizes, Pompeia e Água Branca.',
    channels: [
      { key: 'avisos', name: 'avisos', unread: 0, locked: true },
      { key: 'fotos', name: 'fotos', unread: 4 },
      { key: 'dicas', name: 'dicas', unread: 0 },
      { key: 'perdidos', name: 'perdidos', unread: 0, alert: true },
      { key: 'encontros', name: 'encontros', unread: 2 },
    ],
  },
  {
    key: 'gatos', name: 'Gateiros', initials: 'GA', color: '#5D6FA3', members: '8,7 mil', online: 201, kind: 'Interesse',
    desc: 'Gatos, arranhadores e a eterna luta contra o vaso de planta.',
    channels: [
      { key: 'fotos', name: 'fotos', unread: 0 },
      { key: 'saude', name: 'saúde', unread: 0 },
      { key: 'adocao', name: 'adoção', unread: 0 },
    ],
  },
  {
    key: 'spitz', name: 'Clube do Spitz', initials: 'SP', color: '#B85F7E', members: '3,3 mil', online: 77, kind: 'Raça',
    desc: 'Escovação, tosa e fofura em nível nuvem.',
    channels: [
      { key: 'fotos', name: 'fotos', unread: 0 },
      { key: 'dicas', name: 'dicas', unread: 0 },
    ],
  },
];

export const DISCOVER_MATILHAS = [
  { key: 'golden', name: 'Golden Lovers SP', initials: 'GL', color: '#C79A3E', members: '5,8 mil', kind: 'Raça', desc: 'Pelos dourados e muita energia.' },
  { key: 'agua', name: 'Parque da Água Branca', initials: 'AB', color: '#4B8A5C', members: '1,6 mil', kind: 'Bairro', desc: 'Encontros aos domingos de manhã.' },
  { key: 'adocao', name: 'Adote um Amigo', initials: 'AA', color: '#B0603F', members: '21 mil', kind: 'Interesse', desc: 'Feiras de adoção e lares temporários.' },
  { key: 'senior', name: 'Pets Idosos', initials: 'PI', color: '#7A6B8E', members: '2,9 mil', kind: 'Interesse', desc: 'Cuidados para quem já passou dos 8.' },
];

export const CHANNEL_MESSAGES = [
  { id: 'm1', who: 'Marina', pet: 'bidu', role: 'Moderadora', time: '10:12', text: 'Alguém indica petisco natural para filhote de 3 meses? O Bidu tá trocando os dentes.', reactions: [['🦴', 6], ['🧡', 3]], replies: 4 },
  { id: 'm2', who: 'Dra. Helena', pet: null, partner: 'quatroPatas', role: 'Veterinária verificada', time: '10:20', text: 'Cenoura gelada em pedaços grandes ajuda na troca de dentes. Evite osso cozido, ele lasca.', reactions: [['👏', 14]], replies: 2, pinned: true },
  { id: 'm3', who: 'Camila', pet: 'mel', time: '10:31', text: 'A Mel adora orelha de boi desidratada, mas só com supervisão.', photo: null, reactions: [['🐶', 2]] },
  { id: 'm4', who: 'Rafael', pet: 'thor', time: '10:44', text: 'Mandando a foto do Thor de cachecol porque sim.', photo: 'thor', reactions: [['😂', 9], ['🧡', 11]] },
];

export const THREAD_REPLIES = [
  { who: 'Bruno', pet: 'frida', time: '10:15', text: 'Batata-doce assada sem tempero, cortada em palitos.' },
  { who: 'Júlia', pet: 'nina', time: '10:18', text: 'Aqui a Nina curte maçã sem semente.' },
  { who: 'Dra. Helena', partner: 'quatroPatas', role: 'Veterinária verificada', time: '10:20', text: 'Boas opções! Só fiquem de olho na quantidade: petisco é até 10% das calorias do dia.' },
];

export const DMS = [
  { key: 'camila', name: 'Camila', pet: 'mel', last: 'Bora no parque domingo?', time: '14:02', unread: 2 },
  { key: 'bichoBom', partner: 'bichoBom', name: 'Pet Shop Bicho Bom', last: 'O Paçoca está no banho, tudo tranquilo!', time: '14:05', unread: 1, verified: true },
  { key: 'rafael', name: 'Rafael', pet: 'thor', last: 'Valeu pela dica do cachecol 😂', time: 'ontem' },
  { key: 'quatroPatas', partner: 'quatroPatas', name: 'Clínica Quatro Patas', last: 'Confirmado: sábado às 10h.', time: 'ter', verified: true },
  { key: 'julia', name: 'Júlia', pet: 'nina', last: 'Você: A Amora vai amar!', time: 'seg' },
];

export const DM_THREAD = [
  { me: false, text: 'Oi! Aqui é a Carla, do Bicho Bom. Li que o Paçoca tem medo de secador.', time: '13:59' },
  { me: false, text: 'Vou usar a toalha e o soprador no mínimo, tá bom?', time: '13:59' },
  { me: true, text: 'Perfeito, obrigado! Ele fica mais calmo se alguém falar com ele.', time: '14:01' },
  { me: false, text: 'Combinado 🧡 Ele já está no banho, tudo tranquilo!', time: '14:05' },
];

export const LOST_ALERT = {
  pet: 'Bob', breed: 'Beagle, 4 anos', photo: 'filhotes', lastSeen: 'Rua Turiassu, perto do número 900', when: 'há 40 min', distance: '650 m de você',
  tutor: 'Patrícia', phone: '(11) 9 8765-4321', detail: 'Coleira azul com plaquinha netpet. É dócil, mas assustado com barulho.',
};

// ——— Saúde ———

export const VACCINES = {
  pacoca: [
    { name: 'V10', last: '14/11/2025', next: '14/11/2026', state: 'soon', note: 'Agendada para sábado' },
    { name: 'Antirrábica', last: '02/02/2026', next: '02/02/2027', state: 'ok' },
    { name: 'Gripe canina', last: '10/06/2026', next: '10/06/2027', state: 'ok' },
    { name: 'Giárdia', last: '03/12/2024', next: '03/12/2025', state: 'late' },
  ],
  luna: [
    { name: 'V4 felina', last: '05/09/2026', next: '05/09/2027', state: 'ok' },
    { name: 'Antirrábica', last: '02/12/2025', next: '02/12/2026', state: 'soon', note: 'Vence em 20 dias' },
  ],
  amora: [
    { name: 'V10 (3ª dose)', last: '20/12/2025', next: '20/12/2026', state: 'ok' },
    { name: 'Antirrábica', last: '20/12/2025', next: '20/12/2026', state: 'ok' },
  ],
};

export const WEIGHTS = {
  pacoca: { goal: [13.5, 14.5], unit: 'kg', points: [[ 'jun', 15.1], ['jul', 14.9], ['ago', 14.6], ['set', 14.5], ['out', 14.3], ['nov', 14.2]] },
  luna: { goal: [3.8, 4.4], unit: 'kg', points: [['jun', 4.4], ['jul', 4.3], ['ago', 4.2], ['set', 4.2], ['out', 4.1], ['nov', 4.1]] },
  amora: { goal: [3.8, 4.6], unit: 'kg', points: [['jun', 3.2], ['jul', 3.5], ['ago', 3.8], ['set', 4.0], ['out', 4.1], ['nov', 4.2]] },
};

export const MEDS = {
  pacoca: [{ name: 'Vermífugo', dose: '1 comprimido', every: 'a cada 3 meses', next: '10/02/2027' }, { name: 'Antipulgas', dose: '1 pipeta', every: 'todo mês', next: '01/12/2026' }],
  luna: [{ name: 'Remédio do rim', dose: '½ comprimido com a ração', every: 'todo dia, 20h', next: 'hoje, 20h' }],
  amora: [{ name: 'Antipulgas', dose: '1 pipeta', every: 'todo mês', next: '20/11/2026' }],
};

export const ALLERGIES = { pacoca: ['Frango (coceira)', 'Medo de secador'], luna: ['Sem alergias registradas'], amora: ['Shampoo com perfume forte'] };

export const VISITS = {
  pacoca: [
    { date: '29/10/2026', where: 'Pet Shop Bicho Bom', what: 'Banho' },
    { date: '18/08/2026', where: 'Clínica Quatro Patas', what: 'Consulta: otite leve, tratada com gotas por 7 dias' },
    { date: '10/06/2026', where: 'Clínica Quatro Patas', what: 'Vacina gripe canina' },
  ],
  luna: [{ date: '05/09/2026', where: 'Clínica Quatro Patas', what: 'Exame de sangue: creatinina levemente alta, dieta renal' }],
  amora: [{ date: '20/12/2025', where: 'Clínica Quatro Patas', what: 'Última dose de vacinas de filhote' }],
};

export const DOCS = [
  { name: 'Exame de sangue · set 2026', kind: 'PDF' },
  { name: 'Receita do remédio do rim', kind: 'Foto' },
];

export const CARE_ROUTINE = {
  pacoca: [
    { icon: 'drop', title: 'Banho', every: 'A cada 15 dias', next: 'Hoje, 14h', partner: 'bichoBom', on: true },
    { icon: 'syringe', title: 'Vacina V10', every: 'Todo ano', next: 'Sáb, 14 de nov', on: true },
    { icon: 'pill', title: 'Vermífugo', every: 'A cada 3 meses', next: '10 de fev', on: true },
    { icon: 'drop', title: 'Antipulgas', every: 'Todo mês', next: '1º de dez', on: true },
    { icon: 'walk', title: 'Passeio', every: 'Todo dia, 7h e 19h', next: 'Hoje, 19h', on: true },
    { icon: 'scale', title: 'Pesagem', every: 'Todo mês', next: '1º de dez', on: false },
  ],
  luna: [
    { icon: 'pill', title: 'Remédio do rim', every: 'Todo dia, 20h', next: 'Hoje, 20h', on: true },
    { icon: 'stethoscope', title: 'Consulta de rotina', every: 'A cada 6 meses', next: 'Amanhã, 9h30', on: true },
    { icon: 'syringe', title: 'Antirrábica', every: 'Todo ano', next: '2 de dez', on: true },
  ],
  amora: [
    { icon: 'drop', title: 'Banho', every: 'A cada 30 dias', next: 'Dom, 15 de nov', partner: 'banhoCia', on: true },
    { icon: 'scissors', title: 'Escovação', every: 'Todo dia', next: 'Hoje, 21h', on: true },
    { icon: 'walk', title: 'Passeio com guia', every: 'Todo dia, 18h', next: 'Hoje, 18h', on: true },
  ],
};

export const GROWTH = {
  pacoca: [
    { photo: 'filhotes', label: 'Resgate', date: 'mar 2023', note: '3 meses e 4,1 kg' },
    { photo: 'dupla', label: 'Primeiro passeio', date: 'jun 2023', note: '6 meses' },
    { photo: 'pacoca2', label: 'Praia em Ubatuba', date: 'jan 2025', note: 'Primeiro mar' },
    { photo: 'pacoca', label: 'Hoje', date: 'nov 2026', note: '3 anos e 14,2 kg' },
  ],
  luna: [
    { photo: 'luna3', label: 'Chegou em casa', date: 'out 2021', note: '2 meses' },
    { photo: 'luna2', label: 'Um ano', date: 'ago 2022', note: '3,8 kg' },
    { photo: 'luna', label: 'Hoje', date: 'nov 2026', note: '5 anos' },
  ],
  amora: [
    { photo: 'nina', label: 'Chegou em casa', date: 'nov 2025', note: '2 meses e 900 g' },
    { photo: 'amora2', label: 'Primeiro parque', date: 'mar 2026', note: '6 meses' },
    { photo: 'amora', label: 'Hoje', date: 'nov 2026', note: '1 ano e 4,2 kg' },
  ],
};

export const STREAK = { days: 12, best: 31, month: [1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0] };

export const CHALLENGES = [
  { key: 'c1', title: '20 passeios em novembro', progress: 12, total: 20, prize: 'Selo Patas Ativas', icon: 'walk' },
  { key: 'c2', title: 'Foto no parque', progress: 1, total: 1, prize: 'Selo Explorador', icon: 'camera', done: true },
  { key: 'c3', title: 'Carteirinha completa', progress: 4, total: 5, prize: 'Selo Saúde em Dia', icon: 'shieldCheck' },
  { key: 'c4', title: 'Desafio Petisco Natural', progress: 2, total: 5, prize: '15% em petiscos', icon: 'gift', sponsor: 'Patrocinado por Horta Pet' },
];

export const BADGES = [
  { icon: 'trophy', label: 'Patas Ativas' },
  { icon: 'shieldCheck', label: 'Vacinas em dia' },
  { icon: 'camera', label: 'Explorador' },
  { icon: 'heart', label: 'Resgatado' },
];

export const WRAPPED = {
  pacoca: [
    { big: '312', label: 'passeios em 2026', sub: 'Mais de 480 km de cheiros novos.' },
    { big: '18', label: 'banhos no Bicho Bom', sub: 'A Carla já sabe que ele tem medo de secador.' },
    { big: '9.420', label: 'patinhas recebidas', sub: 'O post mais amado foi a praia em Ubatuba.' },
    { big: 'Parque da Água Branca', label: 'lugar favorito', sub: '64 visitas, quase sempre aos domingos.' },
  ],
};

// ——— Pets sugeridos e interesses ———

export const INTERESTS = ['Cães', 'Gatos', 'Adoção', 'Adestramento', 'Saúde', 'Passeios', 'Raças pequenas', 'Vira-latas', 'Pets idosos', 'Fotografia', 'Receitas para pets', 'Viagens com pet'];
export const BREEDS = {
  Cão: ['Vira-lata (SRD)', 'Shih-tzu', 'Golden retriever', 'Spitz alemão', 'Pug', 'Bulldog francês', 'Labrador', 'Poodle', 'Border collie', 'Beagle', 'Outra'],
  Gato: ['Sem raça definida', 'Siamês', 'Persa', 'Maine coon', 'Angorá', 'Bengal', 'Outra'],
};
export const PET_COLORS = ['#D9923B', '#3F9B7C', '#D9708F', '#5D7FB3', '#8C6BB0', '#C2563F', '#5E8F5A', '#7A7068'];

// ——— Modo parceiro (Pet Shop Bicho Bom) ———

export const PARTNER_SELF = 'bichoBom';

export const PARTNER_TODAY = [
  { id: 'q1', time: '9h00', pet: 'thor', tutor: 'Rafael', service: 'Banho', pro: 'Rogério', state: 'done' },
  { id: 'q2', time: '10h30', pet: 'nina', tutor: 'Júlia', service: 'Banho e tosa completa', pro: 'Carla', state: 'done' },
  { id: 'q3', time: '14h00', pet: 'pacoca', tutor: 'David', service: 'Banho e tosa higiênica + hidratação', pro: 'Carla', state: 'live', stage: 3, note: 'Medo de secador. Alergia a frango.', delivery: true },
  { id: 'q4', time: '15h30', pet: 'mel', tutor: 'Camila', service: 'Banho', pro: 'Rogério', state: 'next', note: 'Primeira vez com o Rogério.' },
  { id: 'q5', time: '17h00', pet: 'pipoca', tutor: 'Lucas', service: 'Banho e tosa completa', pro: 'Carla', state: 'next', delivery: true },
];

export const PARTNER_REQUESTS = [
  { id: 'r1', pet: 'bidu', tutor: 'Marina', service: 'Banho', when: 'Sáb, 14 de nov · 9h', price: 55, note: 'Primeira vez. Ele é agitado.', fresh: true },
  { id: 'r2', pet: 'frida', tutor: 'Bruno', service: 'Banho (gato)', when: 'Seg, 16 de nov · 10h', price: 80, note: '' },
  { id: 'r3', pet: 'amora', tutor: 'David', service: 'Banho + pelagem longa', when: 'Ter, 17 de nov · 13h30', price: 75, note: 'Shampoo sem perfume, por favor.' },
];

export const PARTNER_WEEK = [
  { day: 'Seg 9', slots: 9, booked: 8 },
  { day: 'Ter 10', slots: 9, booked: 7 },
  { day: 'Qua 11', slots: 9, booked: 9 },
  { day: 'Qui 12', slots: 9, booked: 5 },
  { day: 'Sex 13', slots: 9, booked: 6 },
  { day: 'Sáb 14', slots: 7, booked: 6 },
];

export const PARTNER_AGENDA = {
  Carla: [
    { time: '8h', label: '', kind: 'free' },
    { time: '9h', label: '', kind: 'free' },
    { time: '10h30', label: 'Nina · Banho e tosa completa', kind: 'done' },
    { time: '12h', label: 'Almoço', kind: 'block' },
    { time: '14h', label: 'Paçoca · Banho e tosa higiênica', kind: 'live' },
    { time: '15h30', label: '', kind: 'free' },
    { time: '17h', label: 'Pipoca · Banho e tosa completa', kind: 'next' },
  ],
  Rogério: [
    { time: '8h', label: '', kind: 'free' },
    { time: '9h', label: 'Thor · Banho', kind: 'done' },
    { time: '10h30', label: '', kind: 'free' },
    { time: '12h', label: 'Almoço', kind: 'block' },
    { time: '13h35', label: 'Leva e traz · Paçoca', kind: 'done' },
    { time: '15h30', label: 'Mel · Banho', kind: 'next' },
    { time: '17h', label: '', kind: 'free' },
  ],
};

export const PARTNER_CLIENTS = [
  { pet: 'pacoca', tutor: 'David', visits: 18, last: 'hoje', next: 'Retorno sugerido: 26 de nov' },
  { pet: 'mel', tutor: 'Camila', visits: 11, last: '29 de out', next: 'Agendada hoje, 15h30' },
  { pet: 'thor', tutor: 'Rafael', visits: 24, last: 'hoje', next: 'Retorno sugerido: 26 de nov' },
  { pet: 'nina', tutor: 'Júlia', visits: 6, last: 'hoje', next: 'Retorno sugerido: 3 de dez' },
  { pet: 'pipoca', tutor: 'Lucas', visits: 3, last: '15 de out', next: 'Lembrete enviado ontem', late: true },
];

export const FINANCE = {
  month: 'novembro',
  gross: 14820, fee: 1186, net: 13634, nextPayout: 'seg, 16 de nov', nextPayoutValue: 3420,
  byWeek: [3120, 3880, 4210, 3610],
  rows: [
    { label: 'Paçoca · Banho e tosa higiênica', when: 'hoje', value: 110, fee: 8.8, via: 'Pix' },
    { label: 'Nina · Banho e tosa completa', when: 'hoje', value: 95, fee: 7.6, via: 'Cartão' },
    { label: 'Thor · Banho', when: 'hoje', value: 70, fee: 0, via: 'No local' },
    { label: 'Repasse para a conta Itaú ••• 4821', when: 'seg, 9 de nov', value: -3880, payout: true },
  ],
};

export const PLANS = [
  {
    key: 'gratis', name: 'Grátis', price: 'R$ 0', per: '', fee: '12% por agendamento pago no app',
    items: ['Perfil e catálogo de serviços', 'Agenda do dia', 'Mensagens com tutores'],
  },
  {
    key: 'pro', name: 'Parceiro Pro', price: 'R$ 89', per: '/mês', fee: '8% por agendamento pago no app', highlight: true,
    items: ['Agenda completa por profissional', 'Lembretes automáticos de retorno', 'Relatórios de visitas e vendas', 'Cupons e campanhas', 'Selo Pro na busca'],
  },
];

export const TABS = [
  { key: 'inicio', label: 'Início', icon: 'home' },
  { key: 'servicos', label: 'Serviços', icon: 'store' },
  { key: 'criar', label: 'Criar', icon: 'plus' },
  { key: 'matilhas', label: 'Matilhas', icon: 'users' },
  { key: 'pet', label: 'Pet', icon: 'paw' },
];

export const PARTNER_TABS = [
  { key: 'hoje', label: 'Hoje', icon: 'clock' },
  { key: 'agenda', label: 'Agenda', icon: 'calendar' },
  { key: 'pedidos', label: 'Pedidos', icon: 'bell' },
  { key: 'mensagens', label: 'Mensagens', icon: 'chat' },
  { key: 'negocio', label: 'Negócio', icon: 'store' },
];

export const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
export const brl = (n) => {
  const neg = n < 0;
  const v = Math.abs(n);
  const s = v.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${neg ? '− ' : ''}R$ ${s}`;
};

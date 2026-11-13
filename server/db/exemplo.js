// Preenche o banco com os dados de exemplo do protótipo (David, Paçoca, Bicho Bom...).
// Passa pelas mesmas rotas que o app usa, então as regras valem aqui também.
// Uso: npm run db:exemplo   (senha de todas as contas: netpet123)
import { criarApp } from '../src/app.js';
import { pool } from '../src/db.js';

const app = await criarApp({ logger: false });
const chamar = async (method, url, payload, token) => {
  const r = await app.inject({ method, url, payload, headers: token ? { authorization: `Bearer ${token}` } : {} });
  const corpo = r.body ? JSON.parse(r.body) : null;
  if (r.statusCode >= 400) throw new Error(`${method} ${url}: ${r.statusCode} ${r.body}`);
  return corpo;
};
const conta = (email, nome, tipo, extra = {}) =>
  chamar('POST', '/contas/cadastro', { email, nome, tipo, senha: 'netpet123', aceitou_termos: true, cidade: 'São Paulo', ...extra });
const todoDia = (abre, fecha, dias = [1, 2, 3, 4, 5, 6]) => dias.map((d) => ({ dia_semana: d, abre, fecha }));

const ja = await pool.query(`select 1 from contas where email = 'david@netpet.app'`);
if (ja.rowCount) {
  console.log('Os dados de exemplo já estão no banco.');
  process.exit(0);
}

// ── Tutores ──
const david = await conta('david@netpet.app', 'David', 'tutor', {
  usuario: 'david', bairro: 'Perdizes',
  pet: { nome: 'Paçoca', usuario: 'pacoca', especie: 'cao', raca: 'Vira-lata caramelo', porte: 'medio', pelagem: 'Curta', peso_kg: 14.2,
    nascimento: '2023-03-14', cor: '#D9923B', bio: 'Caramelo, curioso e fã de petisco de batata-doce. Resgatado em 2023.' },
});
await chamar('PATCH', '/eu', { endereco: 'Rua Cardoso de Almeida, 1200 · ap 54' }, david.acesso);
const luna = await chamar('POST', '/pets', { nome: 'Luna', usuario: 'luna', especie: 'gato', raca: 'Sem raça definida', porte: 'pequeno', peso_kg: 4.1, cor: '#3F9B7C', bio: 'Dona do sofá.' }, david.acesso);
const amora = await chamar('POST', '/pets', { nome: 'Amora', usuario: 'amora', especie: 'cao', raca: 'Spitz alemão', porte: 'pequeno', pelagem: 'Longa', peso_kg: 4.2, cor: '#D9708F', bio: 'Uma nuvem que late.' }, david.acesso);
await chamar('POST', `/pets/${david.pet_id}/alergias`, { texto: 'Frango (coceira)' }, david.acesso);
await chamar('POST', `/pets/${david.pet_id}/alergias`, { texto: 'Medo de secador' }, david.acesso);
await chamar('POST', `/pets/${luna.id}/medicamentos`, { nome: 'Remédio do rim', dose: '½ comprimido com a ração', frequencia: 'todo dia, 20h' }, david.acesso);

const camila = await conta('camila@netpet.app', 'Camila', 'tutor', { usuario: 'camila', pet: { nome: 'Mel', usuario: 'mel', especie: 'cao', raca: 'Shih-tzu', porte: 'pequeno' } });
const rafael = await conta('rafael@netpet.app', 'Rafael', 'tutor', { usuario: 'rafael', pet: { nome: 'Thor', usuario: 'thor', especie: 'cao', raca: 'Golden retriever', porte: 'grande' } });

// ── Estabelecimentos ──
const carla = await conta('carla@bichobom.app', 'Carla', 'estabelecimento', {
  estabelecimento: { nome: 'Pet Shop Bicho Bom', categoria: 'banho', bairro: 'Vila Madalena', endereco: 'Rua Harmonia, 410', cidade: 'São Paulo',
    sobre: 'Banho e tosa sem pressa, com secagem em baixa temperatura e produtos hipoalergênicos. Desde 2014.',
    leva_e_traz: true, taxa_leva_traz: 1500, faixa_preco: 2, cor: '#5B7C6E', latitude: -23.5568, longitude: -46.6912,
    horarios: todoDia('08:00', '19:00') },
});
const bb = carla.estabelecimento_id;
for (const s of [
  { nome: 'Banho', duracao_min: 60, preco_pequeno: 5500, preco_medio: 7000, preco_grande: 9000, descricao: 'Shampoo neutro, secagem em baixa temperatura, ouvidos e unhas.' },
  { nome: 'Banho e tosa higiênica', duracao_min: 80, preco_pequeno: 7000, preco_medio: 8500, preco_grande: 11000, descricao: 'Banho completo e tosa nas patas, barriga e região íntima.' },
  { nome: 'Banho e tosa completa', duracao_min: 120, preco_pequeno: 9500, preco_medio: 12000, preco_grande: 16000, descricao: 'Tosa na máquina ou tesoura, no estilo que você pedir.' },
]) await chamar('POST', `/estabelecimentos/${bb}/servicos`, s, carla.acesso);
for (const a of [['Hidratação', 2500], ['Escovação de dentes', 1500], ['Perfume e laço', 800], ['Pelagem longa', 2000]]) {
  await chamar('POST', `/estabelecimentos/${bb}/adicionais`, { nome: a[0], preco: a[1] }, carla.acesso);
}
await chamar('POST', `/estabelecimentos/${bb}/equipe`, { nome: 'Rogério', funcao: 'Banhista' }, carla.acesso);

const helena = await conta('helena@quatropatas.app', 'Dra. Helena', 'estabelecimento', {
  estabelecimento: { nome: 'Clínica Quatro Patas', categoria: 'vet', bairro: 'Pinheiros', endereco: 'Rua dos Pinheiros, 1580', cidade: 'São Paulo',
    sobre: 'Clínica geral, vacinas, exames e emergência 24 horas.', faixa_preco: 3, cor: '#4E6E91', aceite_automatico: true,
    horarios: todoDia('00:00', '23:59', [0, 1, 2, 3, 4, 5, 6]) },
});
for (const s of [
  { nome: 'Consulta clínica', duracao_min: 40, preco_pequeno: 18000, preco_medio: 18000, preco_grande: 18000 },
  { nome: 'Vacina V10 ou V4', duracao_min: 20, preco_pequeno: 12000, preco_medio: 12000, preco_grande: 12000 },
]) await chamar('POST', `/estabelecimentos/${helena.estabelecimento_id}/servicos`, s, helena.acesso);

const ze = await conta('ze@passeios.app', 'Zé', 'estabelecimento', {
  estabelecimento: { nome: 'Passeios do Zé', categoria: 'passeador', bairro: 'Perdizes', atende_em_casa: true, raio_km: 3, faixa_preco: 1, cor: '#3F7F8C',
    aceite_automatico: true, horarios: todoDia('06:00', '20:00', [0, 1, 2, 3, 4, 5, 6]) },
});
await chamar('POST', `/estabelecimentos/${ze.estabelecimento_id}/servicos`, { nome: 'Passeio de 60 min', duracao_min: 60, preco_pequeno: 5500, preco_medio: 5500, preco_grande: 6000 }, ze.acesso);

// Verificados pela netpet (isso só o time da netpet faz, direto no banco).
await pool.query(`update estabelecimentos set verificado = true where id = any($1)`, [[bb, helena.estabelecimento_id, ze.estabelecimento_id]]);

// ── Social ──
for (const [tok, pet] of [[david.acesso, camila.pet_id], [david.acesso, rafael.pet_id], [camila.acesso, david.pet_id], [rafael.acesso, david.pet_id]]) {
  await chamar('POST', `/pets/${pet}/seguir`, undefined, tok);
}
const vira = await chamar('POST', '/matilhas', { nome: 'Vira-latas de SP', tipo: 'raca', descricao: 'Para quem ama SRD.', cor: '#C98A3A' }, camila.acesso);
await chamar('POST', '/matilhas', { nome: 'Pets de Perdizes', tipo: 'bairro', descricao: 'Vizinhos de quatro patas.', cor: '#4F7F6E' }, david.acesso);
await chamar('POST', `/matilhas/${vira.id}/entrar`, undefined, david.acesso);
await chamar('POST', `/matilhas/${vira.id}/entrar`, undefined, helena.acesso);

// ── Um agendamento de verdade, passando pelos horários livres ──
const servicos = (await chamar('GET', `/estabelecimentos/${bb}`)).servicos;
let livres = [];
for (let d = 1; d <= 7 && !livres.length; d++) {
  const dia = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date(Date.now() + 86400000 * d));
  livres = await chamar('GET', `/estabelecimentos/${bb}/horarios-livres?servico=${servicos[1].id}&data=${dia}`);
}
if (livres.length) {
  const ag = await chamar('POST', '/agendamentos', {
    pet_id: david.pet_id, servico_id: servicos[1].id, inicio: livres[0].inicio, leva_e_traz: true, forma_pagamento: 'pix', observacoes: 'Tem medo de secador.',
  }, david.acesso);
  await chamar('POST', `/agendamentos/${ag.id}/responder`, { aceitar: true }, carla.acesso);
}

console.log(`Pronto! Entre com david@netpet.app (tutor) ou carla@bichobom.app (estabelecimento). Senha: netpet123.
Pets do David: Paçoca, Luna (${luna.id.slice(0, 8)}…), Amora (${amora.id.slice(0, 8)}…).`);
await app.close();
await pool.end();

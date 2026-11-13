// Teste de ponta a ponta: tutor e estabelecimento, do cadastro à avaliação.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { preparar, diaFuturo } from './ajuda.js';

let api, fechar, pool;
const t = {}; // guarda ids e tokens entre os passos

before(async () => {
  ({ chamar: api, fechar, pool } = await preparar());
});
after(async () => fechar());

const cadastro = (extra) => ({ senha: 'senha-forte-1', aceitou_termos: true, ...extra });

test('cadastro de tutor com o primeiro pet', async () => {
  const r = await api('POST', '/contas/cadastro', {
    corpo: cadastro({ email: 'david@exemplo.com', nome: 'David', usuario: 'david', tipo: 'tutor',
      pet: { nome: 'Paçoca', especie: 'cao', raca: 'Vira-lata caramelo', porte: 'medio', peso_kg: 14.2, cor: '#D9923B' } }),
  });
  assert.equal(r.status, 201, JSON.stringify(r.corpo));
  assert.ok(r.acesso && r.renovacao && r.pet_id);
  t.david = r.acesso; t.pacoca = r.pet_id; t.davidId = r.perfil_id;

  const eu = await api('GET', '/eu', { token: t.david });
  assert.equal(eu.pets.length, 1);
  assert.equal(eu.pets[0].papel, 'dono');
  assert.equal(eu.pode_modo_parceiro, false);
});

test('e-mail repetido e senha curta são recusados', async () => {
  const r1 = await api('POST', '/contas/cadastro', { corpo: cadastro({ email: 'DAVID@exemplo.com', nome: 'Outro', tipo: 'tutor' }) });
  assert.equal(r1.status, 409);
  const r2 = await api('POST', '/contas/cadastro', { corpo: cadastro({ email: 'x@exemplo.com', nome: 'X', tipo: 'tutor', senha: '123' }) });
  assert.equal(r2.status, 400);
  const disp = await api('GET', '/contas/disponivel?email=david@exemplo.com&usuario=livre_aqui');
  assert.deepEqual(disp.corpo, { email: false, usuario: true });
});

test('cadastro de estabelecimento: a pessoa vira dona e ganha o modo parceiro', async () => {
  const r = await api('POST', '/contas/cadastro', {
    corpo: cadastro({ email: 'carla@bichobom.com', nome: 'Carla', tipo: 'estabelecimento',
      estabelecimento: { nome: 'Pet Shop Bicho Bom', categoria: 'banho', bairro: 'Vila Madalena', cidade: 'São Paulo',
        leva_e_traz: true, taxa_leva_traz: 1500, antecedencia_min: 60, cancelamento_horas: 2,
        horarios: [0, 1, 2, 3, 4, 5, 6].map((d) => ({ dia_semana: d, abre: '08:00', fecha: '19:00' })) } }),
  });
  assert.equal(r.status, 201, JSON.stringify(r.corpo));
  t.carla = r.acesso; t.bichoBom = r.estabelecimento_id;
  const eu = await api('GET', '/eu', { token: t.carla });
  assert.equal(eu.pode_modo_parceiro, true);
  assert.equal(eu.estabelecimentos[0].acesso, 'dono');
  const e = await api('GET', '/estabelecimentos/pet-shop-bicho-bom');
  assert.equal(e.id, t.bichoBom);
  assert.equal(e.documento, undefined);
  t.carlaEquipe = e.equipe[0].id;
});

test('estabelecimento cadastra serviço, adicional e um segundo profissional', async () => {
  const s = await api('POST', `/estabelecimentos/${t.bichoBom}/servicos`, {
    token: t.carla, corpo: { nome: 'Banho', duracao_min: 60, preco_pequeno: 5500, preco_medio: 7000, preco_grande: 9000 } });
  assert.equal(s.status, 201, JSON.stringify(s.corpo));
  t.banho = s.id;
  const g = await api('POST', `/estabelecimentos/${t.bichoBom}/servicos`, {
    token: t.carla, corpo: { nome: 'Banho de gato', duracao_min: 60, preco_pequeno: 8000, preco_medio: 8000, preco_grande: 8000, especies: ['gato'] } });
  t.banhoGato = g.id;
  const a = await api('POST', `/estabelecimentos/${t.bichoBom}/adicionais`, { token: t.carla, corpo: { nome: 'Hidratação', preco: 2500 } });
  t.hidratacao = a.id;
  const m = await api('POST', `/estabelecimentos/${t.bichoBom}/equipe`, { token: t.carla, corpo: { nome: 'Rogério', funcao: 'Banhista' } });
  assert.equal(m.status, 201);
  t.rogerio = m.id;
});

test('tutor não mexe no estabelecimento dos outros', async () => {
  const r = await api('POST', `/estabelecimentos/${t.bichoBom}/servicos`, {
    token: t.david, corpo: { nome: 'Golpe', duracao_min: 10, preco_pequeno: 1, preco_medio: 1, preco_grande: 1 } });
  assert.equal(r.status, 403);
  const r2 = await api('PATCH', `/estabelecimentos/${t.bichoBom}`, { token: t.david, corpo: { verificado: true } });
  assert.equal(r2.status, 403);
});

test('horários livres: dois profissionais, de 30 em 30 minutos', async () => {
  t.dia = diaFuturo(3);
  const r = await api('GET', `/estabelecimentos/${t.bichoBom}/horarios-livres?servico=${t.banho}&data=${t.dia}`);
  assert.equal(r.status, 200);
  // 8h às 19h, serviço de 60 min: último começa 18h → 21 horários
  assert.equal(r.lista.length, 21);
  assert.equal(r.lista[0].equipe_livre.length, 2);
  t.slot10 = r.lista.find((s) => new Date(s.inicio).getUTCHours() === 13).inicio; // 10h em SP
});

test('agendamento: preço pelo porte, adicional, leva e traz e taxa', async () => {
  const previa = await api('POST', '/agendamentos/previa', {
    token: t.david, corpo: { pet_id: t.pacoca, servico_id: t.banho, adicionais: [t.hidratacao], forma_pagamento: 'pix' } });
  assert.equal(previa.subtotal, 9500);
  assert.equal(previa.total, 9975);

  const semEndereco = await api('POST', '/agendamentos', {
    token: t.david, corpo: { pet_id: t.pacoca, servico_id: t.banho, inicio: t.slot10, leva_e_traz: true, forma_pagamento: 'pix' } });
  assert.equal(semEndereco.status, 400);

  const r = await api('POST', '/agendamentos', {
    token: t.david, corpo: { pet_id: t.pacoca, servico_id: t.banho, inicio: t.slot10, equipe_id: t.carlaEquipe,
      adicionais: [t.hidratacao], leva_e_traz: true, endereco_busca: 'Rua Cardoso de Almeida, 1200', forma_pagamento: 'pix',
      observacoes: 'Tem medo de secador.' } });
  assert.equal(r.status, 201, JSON.stringify(r.corpo));
  assert.equal(r.status === 201 && r.corpo.status, 'pendente');
  assert.equal(r.total, 9500 + 1500 + 475);
  assert.equal(r.comissao, 1140);
  assert.equal(r.pagamento.status, 'pago');
  t.ag1 = r.id;
});

test('o mesmo horário com a mesma profissional não pode ser marcado de novo', async () => {
  const r = await api('POST', '/agendamentos', {
    token: t.david, corpo: { pet_id: t.pacoca, servico_id: t.banho, inicio: t.slot10, equipe_id: t.carlaEquipe, forma_pagamento: 'pix' } });
  assert.equal(r.status, 409);
  // Sem preferência, o horário ainda tem o Rogério livre.
  const livres = await api('GET', `/estabelecimentos/${t.bichoBom}/horarios-livres?servico=${t.banho}&data=${t.dia}`);
  const s = livres.lista.find((x) => x.inicio === t.slot10);
  assert.deepEqual(s.equipe_livre, [t.rogerio]);
});

test('gato não entra em serviço de cão e serviço de gato recusa cão', async () => {
  const r = await api('POST', '/agendamentos/previa', {
    token: t.david, corpo: { pet_id: t.pacoca, servico_id: t.banhoGato, forma_pagamento: 'pix' } });
  assert.equal(r.status, 400);
});

test('outro tutor não vê nem agenda com o pet dos outros', async () => {
  const r = await api('POST', '/contas/cadastro', { corpo: cadastro({ email: 'ana@exemplo.com', nome: 'Ana', tipo: 'tutor' }) });
  t.ana = r.acesso; t.anaId = r.perfil_id;
  assert.equal((await api('GET', `/agendamentos/${t.ag1}`, { token: t.ana })).status, 404);
  const r2 = await api('POST', '/agendamentos', {
    token: t.ana, corpo: { pet_id: t.pacoca, servico_id: t.banho, inicio: t.slot10, forma_pagamento: 'pix' } });
  assert.equal(r2.status, 403);
});

test('estabelecimento vê o pedido com alergias e aceita', async () => {
  await api('POST', `/pets/${t.pacoca}/alergias`, { token: t.david, corpo: { texto: 'Frango (coceira)' } });
  const pedidos = await api('GET', `/estabelecimentos/${t.bichoBom}/pedidos`, { token: t.carla });
  assert.equal(pedidos.lista.length, 1);
  const det = await api('GET', `/agendamentos/${t.ag1}`, { token: t.carla });
  assert.deepEqual(det.alergias, [{ texto: 'Frango (coceira)' }]);
  assert.equal(det.comissao, 1140);
  const detTutor = await api('GET', `/agendamentos/${t.ag1}`, { token: t.david });
  assert.equal(detTutor.comissao, undefined); // tutor não vê a comissão

  // Tutor não pode aceitar o próprio pedido.
  assert.equal((await api('POST', `/agendamentos/${t.ag1}/responder`, { token: t.david, corpo: { aceitar: true } })).status, 403);
  const r = await api('POST', `/agendamentos/${t.ag1}/responder`, { token: t.carla, corpo: { aceitar: true } });
  assert.equal(r.corpo.status, 'confirmado');
  const n = await api('GET', '/notificacoes', { token: t.david });
  assert.ok(n.lista.some((x) => x.titulo === 'Agendamento confirmado'));
});

test('acompanhamento ao vivo até concluir, e entra na carteirinha', async () => {
  let r;
  for (let i = 0; i < 4; i++) r = await api('POST', `/agendamentos/${t.ag1}/avancar`, { token: t.carla, corpo: {} });
  assert.equal(r.corpo.status, 'concluido');
  assert.equal(r.corpo.etapa, 5);
  const extra = await api('POST', `/agendamentos/${t.ag1}/avancar`, { token: t.carla, corpo: {} });
  assert.equal(extra.status, 409);
  const cart = await api('GET', `/pets/${t.pacoca}/carteirinha`, { token: t.david });
  assert.equal(cart.historico[0].titulo, 'Banho');
  assert.equal(cart.historico[0].estabelecimento, 'Pet Shop Bicho Bom');
});

test('o banco recusa pular etapas do status, mesmo sem passar pela API', async () => {
  await assert.rejects(pool.query(`update agendamentos set status = 'pendente' where id = $1`, [t.ag1]), /Mudança de status inválida/);
});

test('avaliação: só uma vez, só o tutor, e atualiza a nota', async () => {
  assert.equal((await api('POST', `/agendamentos/${t.ag1}/avaliar`, { token: t.carla, corpo: { nota: 5 } })).status, 403);
  const r = await api('POST', `/agendamentos/${t.ag1}/avaliar`, { token: t.david, corpo: { nota: 4, texto: 'Ótimo!' } });
  assert.equal(r.status, 201);
  assert.equal((await api('POST', `/agendamentos/${t.ag1}/avaliar`, { token: t.david, corpo: { nota: 5 } })).status, 409);
  const e = await api('GET', `/estabelecimentos/${t.bichoBom}`);
  assert.equal(e.nota_media, 4);
  assert.equal(e.avaliacoes, 1);
  const resp = await api('POST', `/avaliacoes/${r.id}/responder`, { token: t.carla, corpo: { resposta: 'Obrigada!' } });
  assert.equal(resp.resposta, 'Obrigada!');
});

test('cancelamento: no prazo tem estorno; estabelecimento precisa dar motivo', async () => {
  const livres = await api('GET', `/estabelecimentos/${t.bichoBom}/horarios-livres?servico=${t.banho}&data=${t.dia}`);
  const r = await api('POST', '/agendamentos', {
    token: t.david, corpo: { pet_id: t.pacoca, servico_id: t.banho, inicio: livres.lista[0].inicio, forma_pagamento: 'cartao' } });
  assert.equal(r.status, 201);
  const c = await api('POST', `/agendamentos/${r.id}/cancelar`, { token: t.david, corpo: { motivo: 'Imprevisto' } });
  assert.equal(c.reembolso, true);
  const p = await pool.query(`select status from pagamentos where agendamento_id = $1`, [r.id]);
  assert.equal(p.rows[0].status, 'estornado');
  // Horário volta a ficar livre para os dois profissionais.
  const de_novo = await api('GET', `/estabelecimentos/${t.bichoBom}/horarios-livres?servico=${t.banho}&data=${t.dia}`);
  assert.equal(de_novo.lista[0].equipe_livre.length, 2);

  const r2 = await api('POST', '/agendamentos', {
    token: t.david, corpo: { pet_id: t.pacoca, servico_id: t.banho, inicio: livres.lista[1].inicio, forma_pagamento: 'pix' } });
  assert.equal((await api('POST', `/agendamentos/${r2.id}/cancelar`, { token: t.carla, corpo: {} })).status, 400);
  assert.equal((await api('POST', `/agendamentos/${r2.id}/cancelar`, { token: t.carla, corpo: { motivo: 'Falta de energia' } })).reembolso, true);
});

test('bloqueio de agenda (almoço) some com os horários', async () => {
  const [ano, mes, dia] = t.dia.split('-');
  const r = await api('POST', `/estabelecimentos/${t.bichoBom}/bloqueios`, {
    token: t.carla, corpo: { inicio: `${ano}-${mes}-${dia}T12:00:00-03:00`, fim: `${ano}-${mes}-${dia}T13:00:00-03:00`, motivo: 'Almoço' } });
  assert.equal(r.status, 201);
  const livres = await api('GET', `/estabelecimentos/${t.bichoBom}/horarios-livres?servico=${t.banho}&data=${t.dia}`);
  const horas = livres.lista.map((s) => new Date(s.inicio).toISOString().slice(11, 16));
  assert.ok(!horas.includes('15:00') && !horas.includes('14:30') && !horas.includes('15:30')); // 12h, 11h30, 12h30 em SP
  assert.ok(horas.includes('16:00')); // 13h volta
});

test('cupom: só no primeiro agendamento e só no plano Pro', async () => {
  const semPro = await api('POST', `/estabelecimentos/${t.bichoBom}/cupons`, { token: t.carla, corpo: { codigo: 'BANHO10', descricao: 'R$ 10', valor_fixo: 1000 } });
  assert.equal(semPro.status, 409);
  await api('POST', '/webhooks/assinaturas', {
    headers: { 'x-webhook-segredo': 'segredo-local-de-webhook' },
    corpo: { loja: 'gateway', loja_ref: 'pro-1', plano: 'parceiro_pro', estabelecimento_id: t.bichoBom, status: 'ativa' } });
  const cupom = await api('POST', `/estabelecimentos/${t.bichoBom}/cupons`, { token: t.carla, corpo: { codigo: 'PRIMEIRO15', descricao: '15%', percentual: 15, so_primeiro: true } });
  assert.equal(cupom.status, 201);
  // David já tem agendamento; Ana não.
  const pd = await api('POST', '/agendamentos/previa', { token: t.david, corpo: { pet_id: t.pacoca, servico_id: t.banho, forma_pagamento: 'pix', cupom: 'primeiro15' } });
  assert.equal(pd.status, 400);
  const nina = await api('POST', '/pets', { token: t.ana, corpo: { nome: 'Nina', especie: 'cao', porte: 'pequeno' } });
  const pa = await api('POST', '/agendamentos/previa', { token: t.ana, corpo: { pet_id: nina.id, servico_id: t.banho, forma_pagamento: 'pix', cupom: 'PRIMEIRO15' } });
  assert.equal(pa.desconto, 825);
  assert.equal(pa.subtotal, 5500);
  t.nina = nina.id;
});

test('webhook sem segredo é recusado', async () => {
  const r = await api('POST', '/webhooks/pagamentos', { corpo: { gateway_ref: 'x', status: 'pago' } });
  assert.equal(r.status, 401);
});

test('assinante netpet+ não paga taxa de serviço', async () => {
  await api('POST', '/webhooks/assinaturas', {
    headers: { 'x-webhook-segredo': 'segredo-local-de-webhook' },
    corpo: { loja: 'app_store', loja_ref: 'plus-1', plano: 'netpet_plus', perfil_id: t.davidId, status: 'ativa' } });
  const p = await api('POST', '/agendamentos/previa', { token: t.david, corpo: { pet_id: t.pacoca, servico_id: t.banho, forma_pagamento: 'pix' } });
  assert.equal(p.taxa_servico, 0);
  assert.equal(p.comissao, 560); // e agora o Bicho Bom é Pro: 8%
  assert.equal((await api('GET', '/eu', { token: t.david })).netpet_plus, true);
});

test('família vê a carteirinha; estranho não', async () => {
  assert.equal((await api('GET', `/pets/${t.pacoca}/carteirinha`, { token: t.ana })).status, 403);
  await api('POST', `/pets/${t.pacoca}/familia`, { token: t.david, corpo: { email: 'ana@exemplo.com' } });
  assert.equal((await api('GET', `/pets/${t.pacoca}/carteirinha`, { token: t.ana })).status, 200);
  // Família não remove o pet nem convida outros.
  assert.equal((await api('DELETE', `/pets/${t.pacoca}`, { token: t.ana })).status, 403);
  await api('DELETE', `/pets/${t.pacoca}/familia/${t.anaId}`, { token: t.ana });
  assert.equal((await api('GET', `/pets/${t.pacoca}/carteirinha`, { token: t.ana })).status, 403);
});

test('estabelecimento que atendeu lança vacina verificada', async () => {
  const v = await api('POST', `/pets/${t.pacoca}/vacinas`, { token: t.carla, corpo: { nome: 'V10', aplicada_em: '2026-11-10', proxima_em: '2027-11-10' } });
  assert.equal(v.status, 201);
  assert.equal(v.verificada, true);
  assert.equal(v.estabelecimento_id, t.bichoBom);
  const v2 = await api('POST', `/pets/${t.nina}/vacinas`, { token: t.carla, corpo: { nome: 'V10' } });
  assert.equal(v2.status, 403); // nunca atendeu a Nina
});

test('rede social: post, patinha, comentário, contadores e bloqueio', async () => {
  const p = await api('POST', '/posts', { token: t.david, corpo: { pet_id: t.pacoca, tipo: 'foto', legenda: 'Dia de banho', midias: [{ path: `posts/${t.davidId}/a.jpg`, tipo: 'imagem' }] } });
  assert.equal(p.status, 201, JSON.stringify(p.corpo));
  const roubo = await api('POST', '/posts', { token: t.ana, corpo: { pet_id: t.nina, tipo: 'foto', midias: [{ path: `posts/${t.davidId}/a.jpg`, tipo: 'imagem' }] } });
  assert.equal(roubo.status, 403);
  await api('POST', `/pets/${t.pacoca}/seguir`, { token: t.ana });
  const feed = await api('GET', '/feed', { token: t.ana });
  assert.equal(feed.lista.length, 1);
  await api('POST', `/posts/${p.id}/patinha`, { token: t.ana });
  await api('POST', `/posts/${p.id}/patinha`, { token: t.ana }); // repetir não conta duas vezes
  await api('POST', `/posts/${p.id}/comentarios`, { token: t.ana, corpo: { texto: 'Que lindo!', pet_id: t.nina } });
  const visto = await api('GET', `/posts/${p.id}`, { token: t.ana });
  assert.equal(visto.patinhas, 1);
  assert.equal(visto.comentarios, 1);
  assert.equal(visto.dei_patinha, true);
  const pet = await api('GET', `/pets/${t.pacoca}`, { token: t.ana });
  assert.equal(pet.seguidores, 1);
  assert.equal(pet.posts, 1);
  const notifs = await api('GET', '/notificacoes', { token: t.david });
  assert.ok(notifs.lista.some((n) => n.titulo === 'Nina comentou'));

  await api('POST', '/bloqueios', { token: t.david, corpo: { perfil_id: t.anaId } });
  assert.equal((await api('GET', `/posts/${p.id}`, { token: t.ana })).status, 404);
  assert.equal((await api('GET', '/feed', { token: t.ana })).lista.length, 0);
  await api('DELETE', `/bloqueios/${t.anaId}`, { token: t.david });
});

test('notificações respeitam o que a pessoa desligou', async () => {
  await api('PATCH', '/eu', { token: t.david, corpo: { notificacoes: { patinhas: false } } });
  const post = (await api('GET', `/pets/${t.pacoca}/posts`, { token: t.david })).lista[0];
  await api('DELETE', `/posts/${post.id}/patinha`, { token: t.ana });
  const antes = (await api('GET', '/notificacoes', { token: t.david })).lista.length;
  await api('POST', `/posts/${post.id}/patinha`, { token: t.ana });
  assert.equal((await api('GET', '/notificacoes', { token: t.david })).lista.length, antes);
});

test('matilhas: canais padrão, #avisos só para moderadores, não lidas', async () => {
  const m = await api('POST', '/matilhas', { token: t.david, corpo: { nome: 'Vira-latas de SP', tipo: 'raca' } });
  assert.equal(m.status, 201);
  const minhas = await api('GET', '/matilhas', { token: t.david });
  const canais = minhas.lista[0].canais;
  assert.equal(canais.length, 5);
  const avisos = canais.find((c) => c.slug === 'avisos');
  const dicas = canais.find((c) => c.slug === 'dicas');
  assert.equal((await api('POST', `/canais/${dicas.id}/mensagens`, { token: t.ana, corpo: { texto: 'oi' } })).status, 403); // não é membro
  await api('POST', `/matilhas/${m.id}/entrar`, { token: t.ana });
  assert.equal((await api('POST', `/canais/${avisos.id}/mensagens`, { token: t.ana, corpo: { texto: 'spam' } })).status, 403);
  assert.equal((await api('POST', `/canais/${dicas.id}/mensagens`, { token: t.ana, corpo: { texto: 'Petisco para filhote?' } })).status, 201);
  // Carla fala como estabelecimento verificado? Precisa ser membro primeiro.
  await api('POST', `/matilhas/${m.id}/entrar`, { token: t.carla });
  const msg = await api('POST', `/canais/${dicas.id}/mensagens`, { token: t.carla, corpo: { texto: 'Cenoura gelada!', estabelecimento_id: t.bichoBom } });
  assert.equal(msg.status, 201);
  assert.equal((await api('POST', `/canais/${dicas.id}/mensagens`, { token: t.ana, corpo: { texto: 'fake', estabelecimento_id: t.bichoBom } })).status, 403);
  const minhas2 = await api('GET', '/matilhas', { token: t.david });
  assert.equal(minhas2.lista[0].canais.find((c) => c.slug === 'dicas').nao_lidas, 2);
  await api('POST', `/canais/${dicas.id}/lido`, { token: t.david });
  const minhas3 = await api('GET', '/matilhas', { token: t.david });
  assert.equal(minhas3.lista[0].canais.find((c) => c.slug === 'dicas').nao_lidas, 0);
  const lista = await api('GET', `/canais/${dicas.id}/mensagens`, { token: t.david });
  assert.equal(lista.lista[0].estabelecimento_verificado, false);
  assert.equal(lista.lista[0].estabelecimento_nome, 'Pet Shop Bicho Bom');
});

test('mensagem direta com o estabelecimento chega para a equipe', async () => {
  const c = await api('POST', '/conversas', { token: t.david, corpo: { estabelecimento_id: t.bichoBom } });
  await api('POST', `/conversas/${c.id}/mensagens`, { token: t.david, corpo: { texto: 'Vocês abrem domingo?' } });
  const caixa = await api('GET', `/conversas?estabelecimento=${t.bichoBom}`, { token: t.carla });
  assert.ok(caixa.lista.some((x) => x.id === c.id));
  const resp = await api('POST', `/conversas/${c.id}/mensagens`, { token: t.carla, corpo: { texto: 'Abrimos sim!' } });
  assert.equal(resp.status, 201);
  assert.equal((await api('GET', `/conversas/${c.id}/mensagens`, { token: t.ana })).status, 404);
  const minhas = await api('GET', '/conversas', { token: t.david });
  assert.equal(minhas.lista.find((x) => x.id === c.id).nao_lidas, 1);
});

test('tutor que também abre um estabelecimento tem os dois modos', async () => {
  const e = await api('POST', '/estabelecimentos', { token: t.david, corpo: { nome: 'Passeios do David', categoria: 'passeador' } });
  assert.equal(e.status, 201);
  const eu = await api('GET', '/eu', { token: t.david });
  assert.equal(eu.pets.length, 1);
  assert.equal(eu.pode_modo_parceiro, true);
});

test('login, renovação e saída', async () => {
  assert.equal((await api('POST', '/contas/entrar', { corpo: { email: 'david@exemplo.com', senha: 'errada' } })).status, 401);
  const l = await api('POST', '/contas/entrar', { corpo: { email: 'David@Exemplo.com', senha: 'senha-forte-1' } });
  assert.equal(l.status, 200);
  const r = await api('POST', '/contas/renovar', { corpo: { renovacao: l.renovacao } });
  assert.ok(r.acesso);
  // O token antigo de renovação não vale mais.
  assert.equal((await api('POST', '/contas/renovar', { corpo: { renovacao: l.renovacao } })).status, 401);
  await api('POST', '/contas/sair', { corpo: { renovacao: r.renovacao } });
  assert.equal((await api('POST', '/contas/renovar', { corpo: { renovacao: r.renovacao } })).status, 401);
  assert.equal((await api('GET', '/eu', { token: 'lixo' })).status, 401);
});

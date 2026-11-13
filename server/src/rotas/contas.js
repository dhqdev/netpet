// Cadastro, login e "meu perfil".
// O cadastro tem dois caminhos, escolhidos na primeira tela do app:
//   tipo "tutor"           → cria a conta e, se vier, o primeiro pet
//   tipo "estabelecimento" → cria a conta, o estabelecimento e põe a pessoa como dona
// Depois, qualquer conta pode ter pets E estabelecimentos (ex.: dono de pet shop que tem cachorro).
import { z } from 'zod';
import { transacao, um, varios, q } from '../db.js';
import { gerarHash, conferirSenha, abrirSessao, renovarSessao, fecharSessao, exigirLogin } from '../auth.js';
import { ErroApp, invalido } from '../erros.js';
import { esquemaPet, criarPet } from './pets.js';
import { esquemaEstabelecimento, criarEstabelecimento } from './estabelecimentos.js';

const senha = z.string().min(8, 'A senha precisa de pelo menos 8 caracteres').max(72);
const usuario = z.string().toLowerCase().regex(/^[a-z0-9_.]{3,30}$/, 'Use de 3 a 30 letras, números, ponto ou _');

const esquemaCadastro = z.object({
  email: z.email(),
  senha,
  nome: z.string().trim().min(1).max(80),
  usuario: usuario.optional(),
  telefone: z.string().max(20).optional(),
  bairro: z.string().max(80).optional(),
  cidade: z.string().max(80).optional(),
  aceitou_termos: z.literal(true, { message: 'É preciso aceitar os termos' }),
  tipo: z.enum(['tutor', 'estabelecimento']),
  pet: esquemaPet.optional(),
  estabelecimento: esquemaEstabelecimento.optional(),
});

export default async function rotas(app) {
  // Confere se o e-mail ou @usuario já existe (para a tela de cadastro avisar na hora).
  app.get('/contas/disponivel', async (req) => {
    const { email, usuario: u } = req.query;
    const r = {};
    if (email) r.email = !(await um(`select 1 from contas where email = $1`, [email]));
    if (u) r.usuario = !(await um(`select 1 from perfis where usuario = $1 union select 1 from pets where usuario = $1`, [u]));
    return r;
  });

  app.post('/contas/cadastro', async (req, reply) => {
    const d = esquemaCadastro.parse(req.body);
    if (d.tipo === 'estabelecimento' && !d.estabelecimento) throw invalido('Conte sobre o estabelecimento (nome e categoria)');
    const hash = await gerarHash(d.senha);
    const r = await transacao(async (db) => {
      const conta = await um(`insert into contas (email, senha_hash) values ($1, $2) returning id`, [d.email, hash], db);
      await db.query(
        `insert into perfis (id, tipo_inicial, nome, usuario, telefone, bairro, cidade, aceitou_termos_em)
         values ($1, $2, $3, $4, $5, $6, $7, now())`,
        [conta.id, d.tipo, d.nome, d.usuario ?? null, d.telefone ?? null, d.bairro ?? null, d.cidade ?? null],
      );
      const pet = d.pet ? await criarPet(db, conta.id, d.pet) : null;
      const estabelecimento = d.estabelecimento ? await criarEstabelecimento(db, conta.id, d.nome, d.estabelecimento) : null;
      const sessao = await abrirSessao(conta.id, db);
      return { perfil_id: conta.id, pet_id: pet?.id ?? null, estabelecimento_id: estabelecimento?.id ?? null, ...sessao };
    });
    return reply.status(201).send(r);
  });

  app.post('/contas/entrar', async (req) => {
    const { email, senha: s } = z.object({ email: z.email(), senha: z.string() }).parse(req.body);
    const c = await um(`select id, senha_hash, ativa from contas where email = $1`, [email]);
    // Mesma mensagem para e-mail inexistente e senha errada (não revela quem tem conta).
    if (!c || !c.ativa || !(await conferirSenha(s, c.senha_hash))) throw new ErroApp(401, 'E-mail ou senha incorretos', 'login_invalido');
    return { perfil_id: c.id, ...(await abrirSessao(c.id)) };
  });

  app.post('/contas/renovar', async (req) => {
    const { renovacao } = z.object({ renovacao: z.string() }).parse(req.body);
    return renovarSessao(renovacao);
  });

  app.post('/contas/sair', async (req) => {
    const { renovacao } = z.object({ renovacao: z.string() }).parse(req.body);
    await fecharSessao(renovacao);
    return { ok: true };
  });

  app.post('/contas/senha', async (req) => {
    const eu = exigirLogin(req);
    const d = z.object({ atual: z.string(), nova: senha }).parse(req.body);
    const c = await um(`select senha_hash from contas where id = $1`, [eu]);
    if (!(await conferirSenha(d.atual, c.senha_hash))) throw new ErroApp(401, 'Senha atual incorreta', 'login_invalido');
    await q(`update contas set senha_hash = $2 where id = $1`, [eu, await gerarHash(d.nova)]);
    await q(`delete from sessoes where conta_id = $1`, [eu]); // desloga os outros celulares
    return { ok: true };
  });

  // Tudo o que o app precisa ao abrir: perfil, pets, estabelecimentos e assinatura.
  app.get('/eu', async (req) => {
    const eu = exigirLogin(req);
    const perfil = await um(`select p.*, c.email from perfis p join contas c on c.id = p.id where p.id = $1`, [eu]);
    const pets = await varios(
      `select pt.*, t.papel from pet_tutores t join pets pt on pt.id = t.pet_id where t.perfil_id = $1 order by pt.criado_em`, [eu]);
    const estabelecimentos = await varios(
      `select e.id, e.slug, e.nome, e.categoria, e.plano, e.verificado, eq.acesso
         from equipe_estabelecimento eq join estabelecimentos e on e.id = eq.estabelecimento_id
        where eq.perfil_id = $1 and eq.ativo and eq.acesso is not null`, [eu]);
    const plus = await um(
      `select status, renova_em from assinaturas where perfil_id = $1 and plano = 'netpet_plus' and status = 'ativa' limit 1`, [eu]);
    return {
      perfil, pets, estabelecimentos,
      netpet_plus: !!plus, assinatura: plus,
      // o app mostra o "modo parceiro" se isto for verdadeiro
      pode_modo_parceiro: estabelecimentos.length > 0,
    };
  });

  app.patch('/eu', async (req) => {
    const eu = exigirLogin(req);
    const d = z.object({
      nome: z.string().trim().min(1).max(80),
      usuario,
      foto_path: z.string().max(300).nullable(),
      telefone: z.string().max(20).nullable(),
      bairro: z.string().max(80).nullable(),
      cidade: z.string().max(80).nullable(),
      endereco: z.string().max(200).nullable(),
      notificacoes: z.record(z.string(), z.boolean()),
      privacidade: z.object({
        perfil: z.enum(['todos', 'seguidores']),
        carteirinha: z.enum(['familia', 'parceiros', 'todos']),
        localizacao: z.enum(['bairro', 'oculta']),
        posts: z.enum(['todos', 'seguidores']),
      }).partial(),
    }).partial().parse(req.body);
    const sets = [];
    const vals = [eu];
    for (const [k, v] of Object.entries(d)) {
      const json = k === 'notificacoes' || k === 'privacidade';
      vals.push(json ? JSON.stringify(v) : v);
      sets.push(json ? `${k} = ${k} || $${vals.length}::jsonb` : `${k} = $${vals.length}`);
    }
    if (!sets.length) throw invalido('Nada para mudar');
    return um(`update perfis set ${sets.join(', ')} where id = $1 returning *`, vals);
  });

  app.post('/eu/dispositivos', async (req) => {
    const eu = exigirLogin(req);
    const d = z.object({ push_token: z.string().min(10), plataforma: z.enum(['ios', 'android', 'web']) }).parse(req.body);
    await q(
      `insert into dispositivos (perfil_id, push_token, plataforma) values ($1, $2, $3)
       on conflict (push_token) do update set perfil_id = excluded.perfil_id`,
      [eu, d.push_token, d.plataforma]);
    return { ok: true };
  });

  // Excluir a conta (exigência da App Store e do Google Play).
  app.delete('/eu', async (req) => {
    const eu = exigirLogin(req);
    const { senha: s } = z.object({ senha: z.string() }).parse(req.body ?? {});
    const c = await um(`select senha_hash from contas where id = $1`, [eu]);
    if (!(await conferirSenha(s, c.senha_hash))) throw new ErroApp(401, 'Senha incorreta', 'login_invalido');
    const abertos = await um(
      `select count(*) n from agendamentos where tutor_id = $1 and status in ('pendente','confirmado','em_andamento')`, [eu]);
    if (abertos.n > 0) throw new ErroApp(409, 'Cancele ou conclua seus agendamentos antes de excluir a conta', 'agendamentos_abertos');
    await transacao(async (db) => {
      // Pets em que a pessoa é a única dona e que nunca foram atendidos somem junto.
      await db.query(
        `delete from pets p
          where exists (select 1 from pet_tutores t where t.pet_id = p.id and t.perfil_id = $1 and t.papel = 'dono')
            and not exists (select 1 from pet_tutores t where t.pet_id = p.id and t.perfil_id <> $1 and t.papel = 'dono')
            and not exists (select 1 from agendamentos a where a.pet_id = p.id)`, [eu]);
      // A conta é anonimizada (histórico de agendamentos e pagamentos precisa ficar, por lei fiscal).
      await db.query(`update contas set ativa = false, email = 'excluida+' || id || '@netpet.invalid' where id = $1`, [eu]);
      await db.query(`delete from sessoes where conta_id = $1`, [eu]);
      await db.query(`delete from dispositivos where perfil_id = $1`, [eu]);
      await db.query(
        `update perfis set nome = 'Conta excluída', usuario = null, foto_path = null, telefone = null, endereco = null where id = $1`, [eu]);
    });
    return { ok: true };
  });
}

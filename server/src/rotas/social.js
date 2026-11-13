// Rede social: feed, posts, patinhas, comentários, salvos, bloqueios e denúncias.
import { z } from 'zod';
import { transacao, um, varios, q } from '../db.js';
import { exigirLogin } from '../auth.js';
import { exigirTutor, exigirEstabelecimento, papelNoPet, bloqueado } from '../permissoes.js';
import { naoEncontrado, proibido } from '../erros.js';
import { notificar } from '../notificar.js';

// Quem pode ver um post: público para todos; "seguidores" para quem segue o pet;
// "familia" só para os tutores. Bloqueios escondem nos dois sentidos.
const PODE_VER = `(
  p.autor_id = $1
  or (p.visibilidade = 'todos')
  or (p.visibilidade = 'seguidores' and exists (select 1 from seguidores s where s.pet_id = p.pet_id and s.perfil_id = $1))
  or (exists (select 1 from pet_tutores t where t.pet_id = p.pet_id and t.perfil_id = $1))
) and not exists (select 1 from bloqueios b where (b.quem = $1 and b.bloqueado = p.autor_id) or (b.quem = p.autor_id and b.bloqueado = $1))`;

const CAMPOS_POST = `p.*, pt.nome as pet_nome, pt.usuario as pet_usuario, pt.foto_path as pet_foto, pt.cor as pet_cor,
  e.nome as estabelecimento_nome, e.verificado as estabelecimento_verificado,
  coalesce((select json_agg(json_build_object('path', m.path, 'tipo', m.tipo, 'largura', m.largura, 'altura', m.altura, 'duracao_s', m.duracao_s) order by m.ordem)
            from post_midias m where m.post_id = p.id), '[]') as midias,
  exists (select 1 from patinhas x where x.post_id = p.id and x.perfil_id = $1) as dei_patinha,
  exists (select 1 from salvos x where x.post_id = p.id and x.perfil_id = $1) as salvei`;

async function postVisivel(eu, id, db) {
  const p = await um(`select p.* from posts p where p.id = $2 and ${PODE_VER}`, [eu, id], db);
  if (!p) throw naoEncontrado('Post');
  return p;
}

export default async function rotas(app) {
  // Feed do Início: pets que sigo + meus pets, e posts patrocinados ativos misturados.
  // Paginação por data: ?antes=<criado_em do último>
  app.get('/feed', async (req) => {
    const eu = exigirLogin(req);
    const antes = req.query.antes ? new Date(req.query.antes) : new Date(Date.now() + 1000);
    const posts = await varios(
      `select ${CAMPOS_POST}, false as patrocinado from posts p
         left join pets pt on pt.id = p.pet_id left join estabelecimentos e on e.id = p.estabelecimento_id
        where p.criado_em < $2 and ${PODE_VER}
          and (p.pet_id in (select pet_id from seguidores where perfil_id = $1)
               or p.pet_id in (select pet_id from pet_tutores where perfil_id = $1)
               or p.autor_id = $1)
        order by p.criado_em desc limit 20`, [eu, antes]);
    const patrocinados = req.query.antes ? [] : await varios(
      `select ${CAMPOS_POST}, true as patrocinado, i.chamada from impulsionamentos i
         join posts p on p.id = i.post_id left join pets pt on pt.id = p.pet_id left join estabelecimentos e on e.id = p.estabelecimento_id
        where i.ativo and i.periodo @> now() and ${PODE_VER}
        order by random() limit 2`, [eu]);
    // Um patrocinado a cada 4 posts.
    const r = [];
    posts.forEach((p, i) => { r.push(p); if (i % 4 === 2 && patrocinados.length) r.push(patrocinados.shift()); });
    return r;
  });

  // Descobrir: posts públicos mais curtidos dos últimos 7 dias.
  app.get('/explorar', async (req) => {
    const eu = exigirLogin(req);
    return varios(
      `select ${CAMPOS_POST} from posts p left join pets pt on pt.id = p.pet_id left join estabelecimentos e on e.id = p.estabelecimento_id
        where p.visibilidade = 'todos' and p.criado_em > now() - interval '7 days' and ${PODE_VER}
        order by p.patinhas desc, p.criado_em desc limit 30`, [eu]);
  });

  app.get('/pets/:id/posts', async (req) => {
    const eu = exigirLogin(req);
    return varios(
      `select ${CAMPOS_POST} from posts p left join pets pt on pt.id = p.pet_id left join estabelecimentos e on e.id = p.estabelecimento_id
        where p.pet_id = $2 and ${PODE_VER} order by p.criado_em desc limit 60`, [eu, req.params.id]);
  });

  // Criar post. As mídias são enviadas antes em POST /uploads, e aqui vêm só os caminhos.
  app.post('/posts', async (req, reply) => {
    const eu = exigirLogin(req);
    const d = z.object({
      pet_id: z.uuid().optional(),
      estabelecimento_id: z.uuid().optional(),     // post do estabelecimento, ou marcação do lugar
      como_estabelecimento: z.boolean().default(false),
      tipo: z.enum(['foto', 'video', 'carrossel', 'antes_depois']),
      legenda: z.string().max(2200).optional(),
      local: z.string().max(80).optional(),
      visibilidade: z.enum(['todos', 'seguidores', 'familia']).default('todos'),
      midias: z.array(z.object({
        path: z.string().max(300), tipo: z.enum(['imagem', 'video']),
        largura: z.number().int().optional(), altura: z.number().int().optional(), duracao_s: z.number().max(180).optional(),
      })).min(1).max(10),
    }).parse(req.body);
    if (d.pet_id) await exigirTutor(eu, d.pet_id);
    if (d.como_estabelecimento) {
      if (!d.estabelecimento_id) throw proibido('Informe o estabelecimento');
      await exigirEstabelecimento(eu, d.estabelecimento_id, 'equipe');
    }
    if (!d.pet_id && !d.como_estabelecimento) throw proibido('O post precisa ser de um pet seu ou do seu estabelecimento');
    if (d.tipo === 'antes_depois' && d.midias.length !== 2) throw proibido('Antes e depois precisa de exatamente 2 fotos');
    for (const m of d.midias) if (!m.path.startsWith(`posts/${eu}/`)) throw proibido('Mídia de outra pessoa');
    const post = await transacao(async (db) => {
      const p = await um(
        `insert into posts (autor_id, pet_id, estabelecimento_id, tipo, legenda, local, visibilidade) values ($1,$2,$3,$4,$5,$6,$7) returning *`,
        [eu, d.pet_id ?? null, d.estabelecimento_id ?? null, d.tipo, d.legenda ?? null, d.local ?? null, d.visibilidade], db);
      for (const [i, m] of d.midias.entries()) {
        await db.query(`insert into post_midias (post_id, path, tipo, ordem, largura, altura, duracao_s) values ($1,$2,$3,$4,$5,$6,$7)`,
          [p.id, m.path, m.tipo, i, m.largura ?? null, m.altura ?? null, m.duracao_s ?? null]);
      }
      return p;
    });
    return reply.status(201).send(post);
  });

  app.get('/posts/:id', async (req) => {
    const eu = exigirLogin(req);
    await postVisivel(eu, req.params.id);
    return um(`select ${CAMPOS_POST} from posts p left join pets pt on pt.id = p.pet_id left join estabelecimentos e on e.id = p.estabelecimento_id where p.id = $2`, [eu, req.params.id]);
  });

  app.delete('/posts/:id', async (req) => {
    const eu = exigirLogin(req);
    const p = await um(`select * from posts where id = $1`, [req.params.id]);
    if (!p) throw naoEncontrado('Post');
    const podeApagar = p.autor_id === eu || (p.pet_id && (await papelNoPet(eu, p.pet_id)) === 'dono');
    if (!podeApagar) throw proibido();
    await q(`delete from posts where id = $1`, [p.id]);
    return { ok: true };
  });

  app.post('/posts/:id/patinha', async (req) => {
    const eu = exigirLogin(req);
    const p = await postVisivel(eu, req.params.id);
    const r = await q(`insert into patinhas (post_id, perfil_id) values ($1, $2) on conflict do nothing`, [p.id, eu]);
    if (r.rowCount && p.autor_id !== eu) {
      const quem = await um(`select nome from perfis where id = $1`, [eu]);
      await notificar(undefined, p.autor_id, { grupo: 'patinhas', titulo: `${quem.nome} deu patinha`, destino: ['Post', { id: p.id }] });
    }
    return { ok: true };
  });

  app.delete('/posts/:id/patinha', async (req) => {
    const eu = exigirLogin(req);
    await q(`delete from patinhas where post_id = $1 and perfil_id = $2`, [req.params.id, eu]);
    return { ok: true };
  });

  app.post('/posts/:id/salvar', async (req) => {
    const eu = exigirLogin(req);
    await postVisivel(eu, req.params.id);
    await q(`insert into salvos (post_id, perfil_id) values ($1, $2) on conflict do nothing`, [req.params.id, eu]);
    return { ok: true };
  });

  app.delete('/posts/:id/salvar', async (req) => {
    const eu = exigirLogin(req);
    await q(`delete from salvos where post_id = $1 and perfil_id = $2`, [req.params.id, eu]);
    return { ok: true };
  });

  app.get('/salvos', async (req) => {
    const eu = exigirLogin(req);
    return varios(
      `select ${CAMPOS_POST} from salvos sv join posts p on p.id = sv.post_id
         left join pets pt on pt.id = p.pet_id left join estabelecimentos e on e.id = p.estabelecimento_id
        where sv.perfil_id = $1 and ${PODE_VER} order by sv.criado_em desc`, [eu]);
  });

  app.get('/posts/:id/comentarios', async (req) => {
    const eu = exigirLogin(req);
    await postVisivel(eu, req.params.id);
    return varios(
      `select c.*, pr.nome as autor_nome, pt.nome as pet_nome, pt.foto_path as pet_foto
         from comentarios c join perfis pr on pr.id = c.autor_id left join pets pt on pt.id = c.pet_id
        where c.post_id = $2
          and not exists (select 1 from bloqueios b where (b.quem = $1 and b.bloqueado = c.autor_id) or (b.quem = c.autor_id and b.bloqueado = $1))
        order by c.criado_em`, [eu, req.params.id]);
  });

  app.post('/posts/:id/comentarios', async (req, reply) => {
    const eu = exigirLogin(req);
    const d = z.object({ texto: z.string().trim().min(1).max(1000), pet_id: z.uuid().optional(), resposta_a: z.uuid().optional() }).parse(req.body);
    const p = await postVisivel(eu, req.params.id);
    if (d.pet_id) await exigirTutor(eu, d.pet_id);
    const c = await um(`insert into comentarios (post_id, autor_id, pet_id, resposta_a, texto) values ($1,$2,$3,$4,$5) returning *`,
      [p.id, eu, d.pet_id ?? null, d.resposta_a ?? null, d.texto]);
    if (p.autor_id !== eu) {
      const quem = await um(`select coalesce(pt.nome, pr.nome) as nome from perfis pr left join pets pt on pt.id = $2 where pr.id = $1`, [eu, d.pet_id ?? null]);
      await notificar(undefined, p.autor_id, { grupo: 'comentarios', titulo: `${quem.nome} comentou`, texto: `"${d.texto.slice(0, 80)}"`, destino: ['Post', { id: p.id }] });
    }
    return reply.status(201).send(c);
  });

  app.delete('/comentarios/:id', async (req) => {
    const eu = exigirLogin(req);
    const c = await um(`select c.*, p.autor_id as dono_post from comentarios c join posts p on p.id = c.post_id where c.id = $1`, [req.params.id]);
    if (!c) throw naoEncontrado('Comentário');
    if (c.autor_id !== eu && c.dono_post !== eu) throw proibido(); // quem escreveu ou o dono do post
    await q(`delete from comentarios where id = $1`, [c.id]);
    return { ok: true };
  });

  app.post('/bloqueios', async (req) => {
    const eu = exigirLogin(req);
    const { perfil_id } = z.object({ perfil_id: z.uuid() }).parse(req.body);
    await q(`insert into bloqueios (quem, bloqueado) values ($1, $2) on conflict do nothing`, [eu, perfil_id]);
    // Bloquear também deixa de seguir os pets um do outro.
    await q(`delete from seguidores where perfil_id = $1 and pet_id in (select pet_id from pet_tutores where perfil_id = $2)`, [eu, perfil_id]);
    await q(`delete from seguidores where perfil_id = $2 and pet_id in (select pet_id from pet_tutores where perfil_id = $1)`, [eu, perfil_id]);
    return { ok: true };
  });

  app.delete('/bloqueios/:perfil', async (req) => {
    const eu = exigirLogin(req);
    await q(`delete from bloqueios where quem = $1 and bloqueado = $2`, [eu, req.params.perfil]);
    return { ok: true };
  });

  app.get('/bloqueios', async (req) => {
    const eu = exigirLogin(req);
    return varios(`select p.id, p.nome, p.usuario, p.foto_path from bloqueios b join perfis p on p.id = b.bloqueado where b.quem = $1`, [eu]);
  });

  app.post('/denuncias', async (req, reply) => {
    const eu = exigirLogin(req);
    const d = z.object({
      alvo_tipo: z.enum(['post', 'comentario', 'mensagem', 'perfil', 'pet', 'estabelecimento']),
      alvo_id: z.uuid(), motivo: z.string().min(3).max(300),
    }).parse(req.body);
    await q(`insert into denuncias (autor_id, alvo_tipo, alvo_id, motivo) values ($1, $2, $3, $4)`, [eu, d.alvo_tipo, d.alvo_id, d.motivo]);
    return reply.status(201).send({ ok: true });
  });

  // ───── Pet perdido ─────

  app.get('/perdidos', async (req) => {
    exigirLogin(req);
    return varios(`select * from alertas_perdido where not encontrado and criado_em > now() - interval '30 days' order by criado_em desc limit 50`);
  });

  app.post('/perdidos', async (req, reply) => {
    const eu = exigirLogin(req);
    const d = z.object({
      pet_id: z.uuid().optional(), nome: z.string().max(40), descricao: z.string().max(500).optional(), foto_path: z.string().optional(),
      visto_em: z.string().max(200), latitude: z.number().optional(), longitude: z.number().optional(), telefone: z.string().max(20).optional(),
    }).parse(req.body);
    if (d.pet_id) await exigirTutor(eu, d.pet_id);
    const a = await um(
      `insert into alertas_perdido (autor_id, pet_id, nome, descricao, foto_path, visto_em, latitude, longitude, telefone)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9) returning *`,
      [eu, d.pet_id ?? null, d.nome, d.descricao ?? null, d.foto_path ?? null, d.visto_em, d.latitude ?? null, d.longitude ?? null, d.telefone ?? null]);
    // Avisa quem está nas matilhas de bairro em que o autor está.
    const vizinhos = await varios(
      `select distinct m2.perfil_id from matilha_membros m1 join matilhas mt on mt.id = m1.matilha_id and mt.tipo = 'bairro'
         join matilha_membros m2 on m2.matilha_id = m1.matilha_id where m1.perfil_id = $1 and m2.perfil_id <> $1`, [eu]);
    await notificar(undefined, vizinhos.map((v) => v.perfil_id), {
      grupo: 'perdidos', icone: 'alert', titulo: 'Pet perdido perto de você', texto: `${d.nome}, visto em ${d.visto_em}`, destino: ['Lost', { id: a.id }],
    });
    return reply.status(201).send(a);
  });

  app.post('/perdidos/:id/encontrado', async (req) => {
    const eu = exigirLogin(req);
    const r = await q(`update alertas_perdido set encontrado = true where id = $1 and autor_id = $2`, [req.params.id, eu]);
    if (!r.rowCount) throw naoEncontrado('Alerta');
    return { ok: true };
  });

  app.get('/perfis/:id', async (req) => {
    const eu = exigirLogin(req);
    if (await bloqueado(eu, req.params.id)) throw naoEncontrado('Perfil');
    const p = await um(`select id, nome, usuario, foto_path, bairro, privacidade from perfis where id = $1`, [req.params.id]);
    if (!p) throw naoEncontrado('Perfil');
    if (p.privacidade?.localizacao === 'oculta') delete p.bairro;
    delete p.privacidade;
    p.pets = await varios(`select pt.id, pt.nome, pt.usuario, pt.foto_path, pt.cor from pet_tutores t join pets pt on pt.id = t.pet_id where t.perfil_id = $1 and pt.publico`, [p.id]);
    return p;
  });
}

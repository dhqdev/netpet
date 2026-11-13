// Notificações, envio de fotos/vídeos, categorias, desafios e webhooks de pagamento e assinatura.
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { createWriteStream } from 'node:fs';
import { z } from 'zod';
import { transacao, um, varios, q } from '../db.js';
import { exigirLogin } from '../auth.js';
import { exigirTutor } from '../permissoes.js';
import { ErroApp, invalido, naoEncontrado } from '../erros.js';
import { config } from '../config.js';
import { notificar } from '../notificar.js';

// Pastas de arquivos. "documentos" e "conversas" são privadas (só com token).
const PASTAS = {
  avatares: { publica: true, tipos: /^image\//, maxMb: 5 },
  posts: { publica: true, tipos: /^(image|video)\//, maxMb: 60 },
  estabelecimentos: { publica: true, tipos: /^image\//, maxMb: 8 },
  conversas: { publica: false, tipos: /^(image|video)\//, maxMb: 30 },
  documentos: { publica: false, tipos: /^(image\/|application\/pdf)/, maxMb: 15 },
};
const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/heic': 'heic', 'video/mp4': 'mp4', 'video/quicktime': 'mov', 'application/pdf': 'pdf' };

function conferirWebhook(req) {
  const recebido = Buffer.from(String(req.headers['x-webhook-segredo'] ?? ''));
  const esperado = Buffer.from(config.webhookSegredo);
  if (recebido.length !== esperado.length || !crypto.timingSafeEqual(recebido, esperado)) throw new ErroApp(401, 'Assinatura do webhook inválida', 'webhook');
}

export default async function rotas(app) {
  app.get('/saude', async () => {
    await q('select 1');
    return { ok: true };
  });

  app.get('/categorias', async () => varios(`select * from categorias order by ordem`));

  // ───── Notificações ─────

  app.get('/notificacoes', async (req) => {
    const eu = exigirLogin(req);
    return varios(`select * from notificacoes where perfil_id = $1 order by criado_em desc limit 60`, [eu]);
  });

  app.get('/notificacoes/contagem', async (req) => {
    const eu = exigirLogin(req);
    return um(`select count(*) as nao_lidas from notificacoes where perfil_id = $1 and lida_em is null`, [eu]);
  });

  app.post('/notificacoes/lidas', async (req) => {
    const eu = exigirLogin(req);
    const { ids } = z.object({ ids: z.array(z.uuid()).optional() }).parse(req.body ?? {});
    await q(`update notificacoes set lida_em = now() where perfil_id = $1 and lida_em is null and ($2::uuid[] is null or id = any($2))`, [eu, ids ?? null]);
    return { ok: true };
  });

  // ───── Upload de fotos e vídeos ─────
  // POST /uploads/:pasta (multipart, campo "arquivo"). Devolve o "path" para usar no post, perfil etc.
  // Os arquivos ficam no disco do servidor; para produção, troque por um storage
  // (Cloudflare R2, Amazon S3) sem mudar o resto: o app só guarda o "path".
  app.post('/uploads/:pasta', async (req, reply) => {
    const eu = exigirLogin(req);
    const pasta = PASTAS[req.params.pasta];
    if (!pasta) throw invalido('Pasta inválida');
    const arquivo = await req.file({ limits: { fileSize: pasta.maxMb * 1024 * 1024 } });
    if (!arquivo) throw invalido('Envie o arquivo no campo "arquivo"');
    if (!pasta.tipos.test(arquivo.mimetype) || !EXT[arquivo.mimetype]) throw invalido(`Tipo de arquivo não aceito: ${arquivo.mimetype}`);
    const rel = `${req.params.pasta}/${eu}/${crypto.randomUUID()}.${EXT[arquivo.mimetype]}`;
    const destino = path.join(config.pastaUploads, rel);
    await fs.mkdir(path.dirname(destino), { recursive: true });
    await pipeline(arquivo.file, createWriteStream(destino));
    if (arquivo.file.truncated) {
      await fs.rm(destino, { force: true });
      throw invalido(`Arquivo maior que ${pasta.maxMb} MB`);
    }
    return reply.status(201).send({ path: rel, url: pasta.publica ? `/arquivos/${rel}` : `/arquivos-privados/${rel}` });
  });

  // Arquivos privados: só o dono do arquivo ou quem tem acesso ao pet/conversa.
  app.get('/arquivos-privados/*', async (req, reply) => {
    const eu = exigirLogin(req);
    const rel = path.normalize(req.params['*']).replace(/^(\.\.(\/|\\|$))+/, '');
    const [pasta, dono] = rel.split('/');
    if (!['documentos', 'conversas'].includes(pasta)) throw naoEncontrado('Arquivo');
    let pode = dono === eu;
    if (!pode && pasta === 'documentos') {
      pode = !!(await um(`select 1 from documentos_pet d join pet_tutores t on t.pet_id = d.pet_id where d.path = $1 and t.perfil_id = $2`, [rel, eu]));
    }
    if (!pode && pasta === 'conversas') {
      pode = !!(await um(
        `select 1 from mensagens m join conversas c on c.id = m.conversa_id
          where m.midia_path = $1 and (exists (select 1 from conversa_membros cm where cm.conversa_id = c.id and cm.perfil_id = $2)
             or exists (select 1 from equipe_estabelecimento e where e.estabelecimento_id = c.estabelecimento_id and e.perfil_id = $2 and e.acesso is not null))`, [rel, eu]));
    }
    if (!pode) throw naoEncontrado('Arquivo');
    return reply.sendFile(rel, config.pastaUploads);
  });

  // ───── Desafios ─────

  app.get('/desafios', async (req) => {
    const eu = exigirLogin(req);
    const pet = z.uuid().parse(req.query.pet);
    await exigirTutor(eu, pet);
    return varios(
      `select d.*, e.nome as patrocinador, coalesce(p.progresso, 0) as progresso, p.concluido_em
         from desafios d left join desafio_progresso p on p.desafio_id = d.id and p.pet_id = $1
         left join estabelecimentos e on e.id = d.patrocinador_id
        where current_date between d.inicio and d.fim order by p.concluido_em nulls first, d.fim`, [pet]);
  });

  // ───── Webhooks (chamados pelo gateway de pagamento / lojas, nunca pelo app) ─────

  // Pagamento aprovado, recusado ou estornado.
  app.post('/webhooks/pagamentos', async (req) => {
    conferirWebhook(req);
    const d = z.object({ gateway_ref: z.string(), status: z.enum(['pago', 'falhou', 'estornado']) }).parse(req.body);
    return transacao(async (db) => {
      const p = await um(
        `update pagamentos set status = $2, pago_em = case when $2 = 'pago' then now() else pago_em end where gateway_ref = $1 returning *`,
        [d.gateway_ref, d.status], db);
      if (!p) throw naoEncontrado('Pagamento');
      // Pagamento recusado antes do atendimento: o pedido é cancelado e o horário liberado.
      if (d.status === 'falhou' && p.agendamento_id) {
        const a = await um(`update agendamentos set status = 'cancelado', motivo_cancelamento = 'Pagamento não aprovado'
                             where id = $1 and status in ('pendente', 'confirmado') returning tutor_id`, [p.agendamento_id], db);
        if (a) await notificar(db, a.tutor_id, { grupo: 'agendamentos', icone: 'x', titulo: 'Pagamento não aprovado', texto: 'O agendamento foi cancelado. Tente outra forma de pagamento.', destino: ['BookingDetail', { id: p.agendamento_id }] });
      }
      return { ok: true };
    });
  });

  // Assinaturas (netpet+ e Parceiro Pro), vindas da App Store, Google Play ou gateway.
  app.post('/webhooks/assinaturas', async (req) => {
    conferirWebhook(req);
    const d = z.object({
      loja: z.enum(['app_store', 'google_play', 'gateway']), loja_ref: z.string(),
      plano: z.enum(['netpet_plus', 'parceiro_pro']),
      perfil_id: z.uuid().optional(), estabelecimento_id: z.uuid().optional(),
      status: z.enum(['ativa', 'em_atraso', 'cancelada', 'expirada']), renova_em: z.iso.datetime({ offset: true }).optional(),
    }).parse(req.body);
    return transacao(async (db) => {
      const a = await um(
        `insert into assinaturas (plano, perfil_id, estabelecimento_id, status, loja, loja_ref, renova_em)
         values ($1,$2,$3,$4,$5,$6,$7)
         on conflict (loja_ref) do update set status = excluded.status, renova_em = excluded.renova_em returning *`,
        [d.plano, d.perfil_id ?? null, d.estabelecimento_id ?? null, d.status, d.loja, d.loja_ref, d.renova_em ?? null], db);
      // Parceiro Pro muda a comissão e libera cupons.
      if (a.plano === 'parceiro_pro') {
        await db.query(`update estabelecimentos set plano = $2 where id = $1`, [a.estabelecimento_id, a.status === 'ativa' ? 'pro' : 'gratis']);
      }
      return { ok: true };
    });
  });
}

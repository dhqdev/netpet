// Erros com mensagem em português e código HTTP certo.
export class ErroApp extends Error {
  constructor(status, mensagem, codigo) {
    super(mensagem);
    this.status = status;
    this.codigo = codigo;
  }
}

export const naoEncontrado = (o = 'Item') => new ErroApp(404, `${o} não encontrado`, 'nao_encontrado');
export const proibido = (m = 'Você não tem permissão para isso') => new ErroApp(403, m, 'proibido');
export const invalido = (m) => new ErroApp(400, m, 'invalido');
export const conflito = (m) => new ErroApp(409, m, 'conflito');

// Converte erros do Postgres e do zod em respostas legíveis.
export function tratarErro(err, req, reply) {
  if (err instanceof ErroApp) return reply.status(err.status).send({ erro: err.message, codigo: err.codigo });
  if (err.name === 'ZodError') {
    const p = err.issues[0];
    return reply.status(400).send({ erro: `Campo inválido: ${p.path.join('.') || 'corpo'} (${p.message})`, codigo: 'invalido' });
  }
  if (err.code === '23P01') return reply.status(409).send({ erro: 'Esse horário acabou de ser ocupado. Escolha outro.', codigo: 'horario_ocupado' });
  if (err.code === '23505') return reply.status(409).send({ erro: 'Já existe um cadastro com esses dados', codigo: 'duplicado', detalhe: err.constraint });
  if (err.code === '23514') return reply.status(400).send({ erro: err.message, codigo: 'regra' });
  if (err.code === '23503') return reply.status(400).send({ erro: 'Referência inválida', codigo: 'referencia', detalhe: err.constraint });
  if (err.code === '22P02') return reply.status(400).send({ erro: 'Identificador inválido', codigo: 'invalido' });
  if (err.statusCode && err.statusCode < 500) return reply.status(err.statusCode).send({ erro: err.message, codigo: err.code });
  req.log.error(err);
  return reply.status(500).send({ erro: 'Erro interno', codigo: 'interno' });
}

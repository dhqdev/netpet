// Configuração lida das variáveis de ambiente (arquivo .env, ver .env.example).

const exigir = (nome, padrao) => {
  const v = process.env[nome] ?? padrao;
  if (v === undefined) throw new Error(`Falta a variável de ambiente ${nome} (veja server/.env.example)`);
  return v;
};

export const config = {
  porta: Number(process.env.PORT || 3333),
  bancoUrl: exigir('DATABASE_URL', 'postgres://netpet:netpet@localhost:5432/netpet'),
  jwtSegredo: exigir('JWT_SEGREDO', process.env.NODE_ENV === 'production' ? undefined : 'troque-este-segredo-em-producao'),
  webhookSegredo: exigir('WEBHOOK_SEGREDO', process.env.NODE_ENV === 'production' ? undefined : 'segredo-local-de-webhook'),
  pastaUploads: process.env.PASTA_UPLOADS || new URL('../uploads/', import.meta.url).pathname,
  fuso: process.env.FUSO || 'America/Sao_Paulo',
  // "simulado" aprova Pix e cartão na hora (para testar sem gateway).
  pagamentos: process.env.PAGAMENTOS || 'simulado',
  enviarPush: process.env.ENVIAR_PUSH === '1',
};

// Regras de dinheiro (em %). Mude aqui para mudar o modelo de negócio.
export const taxas = {
  servicoTutor: 5,          // taxa de serviço que o tutor paga (zero para assinante netpet+)
  comissaoGratis: 12,       // o que a netpet fica do estabelecimento no plano Grátis
  comissaoPro: 8,           // ... e no Parceiro Pro
};

-- netpet · 001 · Tabelas
-- Postgres 16. Quem pode ler/escrever o quê é decidido pela API (server/src).
-- Convenção: nomes em português sem acento, dinheiro em centavos (integer),
-- datas com fuso (timestamptz) e ids uuid.

create extension if not exists btree_gist;   -- impede dois agendamentos no mesmo horário
create extension if not exists citext;       -- @usuario e e-mail sem diferenciar maiúsculas
create extension if not exists pgcrypto;     -- gen_random_uuid()

-- ─────────────────────────── Tipos ───────────────────────────

create type tipo_conta        as enum ('tutor', 'estabelecimento');
create type especie           as enum ('cao', 'gato', 'outro');
create type porte             as enum ('pequeno', 'medio', 'grande');
create type papel_tutor       as enum ('dono', 'familia');
create type papel_equipe      as enum ('dono', 'admin', 'equipe');
create type plano_parceiro    as enum ('gratis', 'pro');
create type status_agendamento as enum (
  'pendente',      -- tutor pediu, aguardando o estabelecimento
  'confirmado',    -- estabelecimento aceitou (ou aceite automático)
  'em_andamento',  -- pet chegou / está sendo atendido
  'concluido',
  'cancelado',     -- cancelado pelo tutor ou pelo estabelecimento
  'recusado',      -- estabelecimento recusou o pedido
  'nao_compareceu'
);
create type forma_pagamento   as enum ('pix', 'cartao', 'no_local');
create type status_pagamento  as enum ('aguardando', 'pago', 'falhou', 'estornado', 'no_local');
create type tipo_post         as enum ('foto', 'video', 'carrossel', 'antes_depois');
create type visibilidade      as enum ('todos', 'seguidores', 'familia');
create type papel_matilha     as enum ('dono', 'moderador', 'membro');
create type tipo_matilha      as enum ('raca', 'bairro', 'interesse');
create type plano_assinatura  as enum ('netpet_plus', 'parceiro_pro');
create type status_assinatura as enum ('ativa', 'em_atraso', 'cancelada', 'expirada');

-- ─────────────────────────── Contas ───────────────────────────

-- Login. A senha nunca é guardada, só o hash (bcrypt).
create table contas (
  id               uuid primary key default gen_random_uuid(),
  email            citext unique not null check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  senha_hash       text not null,
  email_verificado boolean not null default false,
  ativa            boolean not null default true,
  criado_em        timestamptz not null default now()
);

-- Sessões abertas (um "refresh token" por celular). Sair = apagar a linha.
create table sessoes (
  id          uuid primary key default gen_random_uuid(),
  conta_id    uuid not null references contas (id) on delete cascade,
  token_hash  text unique not null,
  expira_em   timestamptz not null,
  criado_em   timestamptz not null default now()
);

-- Perfil público da pessoa (criado junto com a conta no cadastro).
-- A mesma pessoa pode ser tutor E fazer parte de um estabelecimento:
-- o "modo parceiro" aparece para quem está em equipe_estabelecimento.
create table perfis (
  id               uuid primary key references contas (id) on delete cascade,
  tipo_inicial     tipo_conta not null default 'tutor',   -- o que escolheu no cadastro
  nome             text not null check (char_length(nome) between 1 and 80),
  usuario          citext unique check (usuario ~ '^[a-z0-9_.]{3,30}$'),
  foto_path        text,
  telefone         text,
  bairro           text,
  cidade           text,
  endereco         text,           -- usado no leva e traz; só o próprio vê
  aceitou_termos_em timestamptz,
  notificacoes     jsonb not null default
    '{"agendamentos":true,"patinhas":true,"comentarios":true,"matilhas":true,"perdidos":true,"saude":true,"ofertas":false}',
  privacidade      jsonb not null default
    '{"perfil":"todos","carteirinha":"familia","localizacao":"bairro","posts":"todos"}',
  criado_em        timestamptz not null default now(),
  atualizado_em    timestamptz not null default now()
);

-- Celulares para notificação push (Expo push token).
create table dispositivos (
  id          uuid primary key default gen_random_uuid(),
  perfil_id   uuid not null references perfis (id) on delete cascade,
  push_token  text not null unique,
  plataforma  text check (plataforma in ('ios', 'android', 'web')),
  criado_em   timestamptz not null default now()
);

-- ─────────────────────────── Pets ───────────────────────────

create table pets (
  id            uuid primary key default gen_random_uuid(),
  nome          text not null check (char_length(nome) between 1 and 40),
  usuario       citext unique check (usuario ~ '^[a-z0-9_.]{3,30}$'),
  especie       especie not null,
  raca          text,
  sexo          text check (sexo in ('macho', 'femea')),
  nascimento    date,
  porte         porte not null default 'medio',   -- define o preço do serviço
  pelagem       text,
  peso_kg       numeric(5, 2) check (peso_kg > 0),
  castrado      boolean,
  cor           text check (cor ~ '^#[0-9A-Fa-f]{6}$'),  -- "cor do pet" do app
  bio           text check (char_length(bio) <= 300),
  foto_path     text,
  status        text,                                 -- "passeando", "dormindo"...
  publico       boolean not null default true,       -- perfil aparece no feed/busca
  seguidores    integer not null default 0,
  seguindo      integer not null default 0,
  posts         integer not null default 0,
  criado_por    uuid not null references perfis (id),
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- Quem cuida do pet. O "dono" pode convidar a família, que vê a carteirinha.
create table pet_tutores (
  pet_id     uuid not null references pets (id) on delete cascade,
  perfil_id  uuid not null references perfis (id) on delete cascade,
  papel      papel_tutor not null default 'dono',
  criado_em  timestamptz not null default now(),
  primary key (pet_id, perfil_id)
);
create index on pet_tutores (perfil_id);

-- ─────────────────────── Estabelecimentos ───────────────────────

create table categorias (
  slug   text primary key,       -- banho, vet, hotel, creche, adestrador, passeador
  nome   text not null,
  icone  text not null,
  ordem  smallint not null default 0
);

create table estabelecimentos (
  id               uuid primary key default gen_random_uuid(),
  slug             citext unique not null check (slug ~ '^[a-z0-9-]{3,40}$'),
  nome             text not null,
  categoria        text not null references categorias (slug),
  documento        text,                 -- CNPJ ou CPF (só a equipe vê)
  verificado       boolean not null default false,  -- só a netpet marca
  ativo            boolean not null default true,
  sobre            text,
  telefone         text,
  endereco         text,
  bairro           text,
  cidade           text,
  latitude         double precision,
  longitude        double precision,
  atende_em_casa   boolean not null default false,
  raio_km          numeric(4, 1),
  leva_e_traz      boolean not null default false,
  taxa_leva_traz   integer not null default 0 check (taxa_leva_traz >= 0),   -- centavos
  aceite_automatico boolean not null default false,  -- confirma pedidos sozinho
  antecedencia_min integer not null default 60,      -- pedido com pelo menos X min
  cancelamento_horas integer not null default 2,     -- tutor cancela grátis até X horas antes
  faixa_preco      smallint check (faixa_preco between 1 and 4),   -- $, $$, $$$
  cor              text,
  logo_path        text,
  capa_path        text,
  plano            plano_parceiro not null default 'gratis',
  nota_media       numeric(2, 1) not null default 0,
  avaliacoes       integer not null default 0,
  criado_em        timestamptz not null default now(),
  atualizado_em    timestamptz not null default now()
);
create index on estabelecimentos (categoria) where ativo;
create index on estabelecimentos (cidade, bairro) where ativo;

-- Equipe do estabelecimento. Serve para duas coisas:
--  1) quem pode mexer no estabelecimento pelo app (perfil_id + acesso);
--  2) os profissionais que o tutor escolhe ao agendar (Carla, Rogério...).
-- Um profissional pode não ter conta (perfil_id vazio).
create table equipe_estabelecimento (
  id                uuid primary key default gen_random_uuid(),
  estabelecimento_id uuid not null references estabelecimentos (id) on delete cascade,
  perfil_id         uuid references perfis (id) on delete set null,
  acesso            papel_equipe,                    -- vazio = sem acesso ao app
  nome              text not null,
  funcao            text,                            -- "Tosadora", "Veterinária"
  atende            boolean not null default true,   -- aparece para agendar
  cor               text,
  ativo             boolean not null default true,
  criado_em         timestamptz not null default now(),
  unique (estabelecimento_id, perfil_id)
);
create index on equipe_estabelecimento (perfil_id);

-- Horário de funcionamento. Vários intervalos por dia (ex.: 8h-12h e 13h-19h).
-- equipe_id preenchido = horário específico daquele profissional.
create table horarios (
  id                 uuid primary key default gen_random_uuid(),
  estabelecimento_id uuid not null references estabelecimentos (id) on delete cascade,
  equipe_id          uuid references equipe_estabelecimento (id) on delete cascade,
  dia_semana         smallint not null check (dia_semana between 0 and 6),  -- 0 = domingo
  abre               time not null,
  fecha              time not null,
  check (fecha > abre)
);
create index on horarios (estabelecimento_id, dia_semana);

-- Folgas, almoço, feriado, manutenção. equipe_id vazio = fecha o estabelecimento todo.
create table bloqueios_agenda (
  id                 uuid primary key default gen_random_uuid(),
  estabelecimento_id uuid not null references estabelecimentos (id) on delete cascade,
  equipe_id          uuid references equipe_estabelecimento (id) on delete cascade,
  periodo            tstzrange not null,
  motivo             text
);
create index on bloqueios_agenda using gist (estabelecimento_id, periodo);

create table servicos (
  id                 uuid primary key default gen_random_uuid(),
  estabelecimento_id uuid not null references estabelecimentos (id) on delete cascade,
  nome               text not null,
  descricao          text,
  duracao_min        integer not null check (duracao_min between 5 and 1440 * 30),
  -- preço por porte, em centavos (o app mostra P/M/G)
  preco_pequeno      integer not null check (preco_pequeno >= 0),
  preco_medio        integer not null check (preco_medio >= 0),
  preco_grande       integer not null check (preco_grande >= 0),
  especies           especie[] not null default '{cao,gato}',
  ativo              boolean not null default true,
  ordem              smallint not null default 0
);
create index on servicos (estabelecimento_id) where ativo;

create table adicionais (
  id                 uuid primary key default gen_random_uuid(),
  estabelecimento_id uuid not null references estabelecimentos (id) on delete cascade,
  nome               text not null,
  preco              integer not null check (preco >= 0),
  ativo              boolean not null default true
);

create table cupons (
  id                 uuid primary key default gen_random_uuid(),
  codigo             citext unique not null,
  descricao          text not null,
  estabelecimento_id uuid references estabelecimentos (id) on delete cascade, -- vazio = vale em todos (netpet paga)
  percentual         smallint check (percentual between 1 and 100),
  valor_fixo         integer check (valor_fixo > 0),
  minimo             integer not null default 0,
  so_primeiro        boolean not null default false,   -- só no primeiro agendamento do tutor
  usos_max           integer,
  usos               integer not null default 0,
  valido_ate         timestamptz,
  ativo              boolean not null default true,
  check ((percentual is null) <> (valor_fixo is null))
);

-- ─────────────────────────── Agendamentos ───────────────────────────

create table agendamentos (
  id                 uuid primary key default gen_random_uuid(),
  codigo             text unique not null default upper(substr(md5(gen_random_uuid()::text), 1, 6)),
  tutor_id           uuid not null references perfis (id),
  pet_id             uuid not null references pets (id),
  estabelecimento_id uuid not null references estabelecimentos (id),
  servico_id         uuid not null references servicos (id),
  equipe_id          uuid references equipe_estabelecimento (id),   -- vazio = sem preferência (escolhido ao confirmar)
  inicio             timestamptz not null,
  fim                timestamptz not null,
  status             status_agendamento not null default 'pendente',
  etapa              smallint not null default 0,      -- acompanhamento ao vivo (0 a 5)
  leva_e_traz        boolean not null default false,
  endereco_busca     text,
  observacoes        text check (char_length(observacoes) <= 500),
  -- foto dos valores no momento do pedido (preço muda depois, o pedido não)
  servico_nome       text not null,
  porte              porte not null,
  subtotal           integer not null,   -- serviço + adicionais
  desconto           integer not null default 0,
  taxa_leva_traz     integer not null default 0,
  taxa_servico       integer not null default 0,   -- paga pelo tutor (5%)
  total              integer not null,             -- o que o tutor paga
  comissao           integer not null default 0,   -- netpet retém do estabelecimento (12% ou 8%)
  repasse            integer not null default 0,   -- o que o estabelecimento recebe
  forma_pagamento    forma_pagamento not null,
  cupom_id           uuid references cupons (id),
  motivo_cancelamento text,
  cancelado_por      uuid references perfis (id),
  criado_em          timestamptz not null default now(),
  atualizado_em      timestamptz not null default now(),
  check (fim > inicio),
  check (total >= 0),
  -- O mesmo profissional não pode ter dois atendimentos ao mesmo tempo.
  constraint sem_conflito exclude using gist (
    equipe_id with =, tstzrange(inicio, fim) with &&
  ) where (status in ('pendente', 'confirmado', 'em_andamento') and equipe_id is not null)
);
create index on agendamentos (tutor_id, inicio desc);
create index on agendamentos (pet_id, inicio desc);
create index on agendamentos (estabelecimento_id, inicio);

create table agendamento_adicionais (
  agendamento_id uuid not null references agendamentos (id) on delete cascade,
  adicional_id   uuid not null references adicionais (id),
  nome           text not null,
  preco          integer not null,
  primary key (agendamento_id, adicional_id)
);

-- Linha do tempo do "ao vivo": confirmado, buscando, chegou, no banho, secando, pronto.
create table agendamento_eventos (
  id             uuid primary key default gen_random_uuid(),
  agendamento_id uuid not null references agendamentos (id) on delete cascade,
  etapa          smallint not null,
  titulo         text not null,
  detalhe        text,
  foto_path      text,
  autor_id       uuid references perfis (id),
  criado_em      timestamptz not null default now()
);
create index on agendamento_eventos (agendamento_id, criado_em);

-- Pagamentos: só o servidor escreve (Edge Function que fala com o gateway, ex.: Mercado Pago, Stripe, Pagar.me).
create table pagamentos (
  id             uuid primary key default gen_random_uuid(),
  agendamento_id uuid references agendamentos (id),
  assinatura_id  uuid,
  perfil_id      uuid not null references perfis (id),
  forma          forma_pagamento not null,
  valor          integer not null,
  status         status_pagamento not null default 'aguardando',
  gateway        text,
  gateway_ref    text unique,
  pix_copia_cola text,
  pago_em        timestamptz,
  criado_em      timestamptz not null default now()
);
create index on pagamentos (agendamento_id);

-- Repasses ao estabelecimento (semanal). Só o servidor escreve.
create table repasses (
  id                 uuid primary key default gen_random_uuid(),
  estabelecimento_id uuid not null references estabelecimentos (id),
  valor              integer not null,
  periodo            daterange not null,
  previsto_para      date not null,
  pago_em            timestamptz,
  conta_final        text           -- "Itaú ••• 4821"
);

create table avaliacoes (
  id                 uuid primary key default gen_random_uuid(),
  agendamento_id     uuid unique not null references agendamentos (id) on delete cascade,
  estabelecimento_id uuid not null references estabelecimentos (id) on delete cascade,
  autor_id           uuid not null references perfis (id) on delete cascade,
  nota               smallint not null check (nota between 1 and 5),
  texto              text check (char_length(texto) <= 1000),
  resposta           text,
  respondida_em      timestamptz,
  criado_em          timestamptz not null default now()
);
create index on avaliacoes (estabelecimento_id, criado_em desc);

create table favoritos (
  perfil_id          uuid not null references perfis (id) on delete cascade,
  estabelecimento_id uuid not null references estabelecimentos (id) on delete cascade,
  criado_em          timestamptz not null default now(),
  primary key (perfil_id, estabelecimento_id)
);

-- ─────────────────────────── Assinaturas ───────────────────────────
-- netpet+ (tutor) e Parceiro Pro (estabelecimento). Só o servidor escreve,
-- a partir do webhook da App Store / Google Play / gateway.

create table assinaturas (
  id                 uuid primary key default gen_random_uuid(),
  plano              plano_assinatura not null,
  perfil_id          uuid references perfis (id) on delete cascade,
  estabelecimento_id uuid references estabelecimentos (id) on delete cascade,
  status             status_assinatura not null,
  loja               text check (loja in ('app_store', 'google_play', 'gateway')),
  loja_ref           text unique,
  inicio             timestamptz not null default now(),
  renova_em          timestamptz,
  check ((plano = 'netpet_plus' and perfil_id is not null) or (plano = 'parceiro_pro' and estabelecimento_id is not null))
);
alter table pagamentos add foreign key (assinatura_id) references assinaturas (id);

-- ─────────────────────────── Rede social ───────────────────────────

create table posts (
  id                 uuid primary key default gen_random_uuid(),
  autor_id           uuid not null references perfis (id) on delete cascade,
  pet_id             uuid references pets (id) on delete cascade,               -- post de pet
  estabelecimento_id uuid references estabelecimentos (id) on delete cascade,   -- post de estabelecimento ou marcação
  tipo               tipo_post not null,
  legenda            text check (char_length(legenda) <= 2200),
  local              text,
  visibilidade       visibilidade not null default 'todos',
  patinhas           integer not null default 0,
  comentarios        integer not null default 0,
  criado_em          timestamptz not null default now(),
  check (pet_id is not null or estabelecimento_id is not null)
);
create index on posts (criado_em desc);
create index on posts (pet_id, criado_em desc);

create table post_midias (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references posts (id) on delete cascade,
  path        text not null,        -- caminho no bucket "posts"
  tipo        text not null check (tipo in ('imagem', 'video')),
  ordem       smallint not null default 0,
  largura     integer,
  altura      integer,
  duracao_s   numeric(6, 2)
);
create index on post_midias (post_id, ordem);

create table patinhas (
  post_id    uuid not null references posts (id) on delete cascade,
  perfil_id  uuid not null references perfis (id) on delete cascade,
  criado_em  timestamptz not null default now(),
  primary key (post_id, perfil_id)
);

create table salvos (
  post_id    uuid not null references posts (id) on delete cascade,
  perfil_id  uuid not null references perfis (id) on delete cascade,
  criado_em  timestamptz not null default now(),
  primary key (post_id, perfil_id)
);

create table comentarios (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references posts (id) on delete cascade,
  autor_id   uuid not null references perfis (id) on delete cascade,
  pet_id     uuid references pets (id) on delete set null,   -- comenta "como" o pet
  resposta_a uuid references comentarios (id) on delete cascade,
  texto      text not null check (char_length(texto) between 1 and 1000),
  criado_em  timestamptz not null default now()
);
create index on comentarios (post_id, criado_em);

-- Seguir é sempre um pet (o perfil é do pet, não do tutor).
create table seguidores (
  perfil_id  uuid not null references perfis (id) on delete cascade,
  pet_id     uuid not null references pets (id) on delete cascade,
  criado_em  timestamptz not null default now(),
  primary key (perfil_id, pet_id)
);
create index on seguidores (pet_id);

create table bloqueios (
  quem       uuid not null references perfis (id) on delete cascade,
  bloqueado  uuid not null references perfis (id) on delete cascade,
  criado_em  timestamptz not null default now(),
  primary key (quem, bloqueado),
  check (quem <> bloqueado)
);

create table denuncias (
  id          uuid primary key default gen_random_uuid(),
  autor_id    uuid not null references perfis (id) on delete cascade,
  alvo_tipo   text not null check (alvo_tipo in ('post', 'comentario', 'mensagem', 'perfil', 'pet', 'estabelecimento')),
  alvo_id     uuid not null,
  motivo      text not null,
  resolvida   boolean not null default false,
  criado_em   timestamptz not null default now()
);

-- Destaque pago e posts patrocinados (monetização).
create table impulsionamentos (
  id                 uuid primary key default gen_random_uuid(),
  estabelecimento_id uuid not null references estabelecimentos (id) on delete cascade,
  post_id            uuid references posts (id) on delete cascade,  -- vazio = destaque na busca
  chamada            text,                                          -- "Agendar consulta"
  periodo            tstzrange not null,
  orcamento          integer not null,
  ativo              boolean not null default false                 -- liga quando o pagamento cai
);

-- ─────────────────────────── Matilhas ───────────────────────────

create table matilhas (
  id          uuid primary key default gen_random_uuid(),
  slug        citext unique not null,
  nome        text not null,
  tipo        tipo_matilha not null,
  descricao   text,
  cor         text,
  foto_path   text,
  publica     boolean not null default true,
  membros     integer not null default 0,
  criado_por  uuid references perfis (id) on delete set null,
  criado_em   timestamptz not null default now()
);

create table matilha_membros (
  matilha_id  uuid not null references matilhas (id) on delete cascade,
  perfil_id   uuid not null references perfis (id) on delete cascade,
  papel       papel_matilha not null default 'membro',
  criado_em   timestamptz not null default now(),
  primary key (matilha_id, perfil_id)
);
create index on matilha_membros (perfil_id);

create table canais (
  id          uuid primary key default gen_random_uuid(),
  matilha_id  uuid not null references matilhas (id) on delete cascade,
  slug        text not null,
  nome        text not null,
  so_moderadores boolean not null default false,  -- #avisos
  alerta      boolean not null default false,     -- #perdidos
  ordem       smallint not null default 0,
  unique (matilha_id, slug)
);

create table mensagens_canal (
  id                 uuid primary key default gen_random_uuid(),
  canal_id           uuid not null references canais (id) on delete cascade,
  autor_id           uuid not null references perfis (id) on delete cascade,
  pet_id             uuid references pets (id) on delete set null,
  estabelecimento_id uuid references estabelecimentos (id) on delete set null,  -- fala como "Veterinária verificada"
  resposta_a         uuid references mensagens_canal (id) on delete cascade,     -- conversa em fio
  texto              text check (char_length(texto) <= 4000),
  foto_path          text,
  fixada             boolean not null default false,
  criado_em          timestamptz not null default now(),
  check (texto is not null or foto_path is not null)
);
create index on mensagens_canal (canal_id, criado_em desc);

create table reacoes (
  mensagem_id uuid not null references mensagens_canal (id) on delete cascade,
  perfil_id   uuid not null references perfis (id) on delete cascade,
  emoji       text not null check (char_length(emoji) <= 16),
  primary key (mensagem_id, perfil_id, emoji)
);

-- Até onde cada pessoa leu, para o contador de não lidas.
create table leituras_canal (
  canal_id   uuid not null references canais (id) on delete cascade,
  perfil_id  uuid not null references perfis (id) on delete cascade,
  lido_em    timestamptz not null default now(),
  primary key (canal_id, perfil_id)
);

-- ─────────────────────────── Mensagens diretas ───────────────────────────
-- Conversa entre pessoas, ou entre tutor e estabelecimento (aí a equipe toda vê).

create table conversas (
  id                 uuid primary key default gen_random_uuid(),
  estabelecimento_id uuid references estabelecimentos (id) on delete cascade,
  agendamento_id     uuid references agendamentos (id) on delete set null,
  ultima_em          timestamptz not null default now(),
  criado_em          timestamptz not null default now()
);

create table conversa_membros (
  conversa_id uuid not null references conversas (id) on delete cascade,
  perfil_id   uuid not null references perfis (id) on delete cascade,
  lido_em     timestamptz,
  primary key (conversa_id, perfil_id)
);
create index on conversa_membros (perfil_id);

create table mensagens (
  id           uuid primary key default gen_random_uuid(),
  conversa_id  uuid not null references conversas (id) on delete cascade,
  autor_id     uuid not null references perfis (id) on delete cascade,
  texto        text check (char_length(texto) <= 4000),
  midia_path   text,
  criado_em    timestamptz not null default now(),
  check (texto is not null or midia_path is not null)
);
create index on mensagens (conversa_id, criado_em desc);

-- ─────────────────────────── Pet perdido ───────────────────────────

create table alertas_perdido (
  id           uuid primary key default gen_random_uuid(),
  autor_id     uuid not null references perfis (id) on delete cascade,
  pet_id       uuid references pets (id) on delete set null,
  nome         text not null,
  descricao    text,
  foto_path    text,
  visto_em     text not null,         -- "Rua Turiassu, perto do 900"
  latitude     double precision,
  longitude    double precision,
  visto_quando timestamptz not null default now(),
  telefone     text,
  encontrado   boolean not null default false,
  criado_em    timestamptz not null default now()
);
create index on alertas_perdido (criado_em desc) where not encontrado;

-- ─────────────────────────── Carteirinha (saúde) ───────────────────────────

create table vacinas (
  id                 uuid primary key default gen_random_uuid(),
  pet_id             uuid not null references pets (id) on delete cascade,
  nome               text not null,
  aplicada_em        date,
  proxima_em         date,
  lote               text,
  estabelecimento_id uuid references estabelecimentos (id) on delete set null,
  agendamento_id     uuid references agendamentos (id) on delete set null,
  registrado_por     uuid references perfis (id) on delete set null,
  verificada         boolean not null default false,   -- lançada pela clínica
  criado_em          timestamptz not null default now()
);
create index on vacinas (pet_id);
create index on vacinas (proxima_em);

create table medicamentos (
  id          uuid primary key default gen_random_uuid(),
  pet_id      uuid not null references pets (id) on delete cascade,
  nome        text not null,
  dose        text,
  frequencia  text,           -- "todo dia, 20h"
  proxima_em  timestamptz,
  ativo       boolean not null default true,
  criado_em   timestamptz not null default now()
);

create table pesagens (
  id        uuid primary key default gen_random_uuid(),
  pet_id    uuid not null references pets (id) on delete cascade,
  medido_em date not null default current_date,
  peso_kg   numeric(5, 2) not null check (peso_kg > 0),
  unique (pet_id, medido_em)
);

create table alergias (
  id      uuid primary key default gen_random_uuid(),
  pet_id  uuid not null references pets (id) on delete cascade,
  texto   text not null
);

-- Consultas, exames, banhos: o histórico da carteirinha.
create table registros_saude (
  id                 uuid primary key default gen_random_uuid(),
  pet_id             uuid not null references pets (id) on delete cascade,
  data               date not null default current_date,
  titulo             text not null,
  descricao          text,
  estabelecimento_id uuid references estabelecimentos (id) on delete set null,
  agendamento_id     uuid references agendamentos (id) on delete set null,
  registrado_por     uuid references perfis (id) on delete set null,
  criado_em          timestamptz not null default now()
);
create index on registros_saude (pet_id, data desc);

create table documentos_pet (
  id          uuid primary key default gen_random_uuid(),
  pet_id      uuid not null references pets (id) on delete cascade,
  nome        text not null,
  path        text not null,        -- bucket privado "documentos"
  tipo        text,                 -- PDF, Foto
  criado_em   timestamptz not null default now()
);

-- Rotina de cuidados e lembretes (banho a cada 15 dias, remédio todo dia...).
create table rotinas (
  id                 uuid primary key default gen_random_uuid(),
  pet_id             uuid not null references pets (id) on delete cascade,
  icone              text not null,
  titulo             text not null,
  a_cada_dias        integer check (a_cada_dias > 0),
  horario            time,
  proxima_em         timestamptz,
  estabelecimento_id uuid references estabelecimentos (id) on delete set null,
  ligada             boolean not null default true,
  criado_em          timestamptz not null default now()
);

-- Agenda do pet: tarefas avulsas ("Vermífugo, feito às 8h").
create table tarefas_pet (
  id         uuid primary key default gen_random_uuid(),
  pet_id     uuid not null references pets (id) on delete cascade,
  rotina_id  uuid references rotinas (id) on delete set null,
  icone      text,
  titulo     text not null,
  quando     timestamptz not null,
  feito_em   timestamptz,
  nota       text
);
create index on tarefas_pet (pet_id, quando);

-- Linha do tempo de crescimento.
create table marcos_pet (
  id        uuid primary key default gen_random_uuid(),
  pet_id    uuid not null references pets (id) on delete cascade,
  foto_path text,
  titulo    text not null,
  data      date not null,
  nota      text
);

-- ─────────────────────────── Desafios e selos ───────────────────────────

create table desafios (
  id                 uuid primary key default gen_random_uuid(),
  titulo             text not null,
  icone              text not null,
  meta               integer not null check (meta > 0),
  premio             text,
  patrocinador_id    uuid references estabelecimentos (id) on delete set null,
  inicio             date not null,
  fim                date not null
);

create table desafio_progresso (
  desafio_id uuid not null references desafios (id) on delete cascade,
  pet_id     uuid not null references pets (id) on delete cascade,
  progresso  integer not null default 0,
  concluido_em timestamptz,
  primary key (desafio_id, pet_id)
);

create table selos (
  slug   text primary key,
  nome   text not null,
  icone  text not null
);

create table pet_selos (
  pet_id    uuid not null references pets (id) on delete cascade,
  selo      text not null references selos (slug),
  ganho_em  timestamptz not null default now(),
  primary key (pet_id, selo)
);

-- ─────────────────────────── Notificações ───────────────────────────

create table notificacoes (
  id            uuid primary key default gen_random_uuid(),
  perfil_id     uuid not null references perfis (id) on delete cascade,
  grupo         text not null check (grupo in ('agendamentos', 'patinhas', 'comentarios', 'matilhas', 'perdidos', 'saude', 'ofertas')),
  titulo        text not null,
  texto         text,
  icone         text,
  destino       jsonb,           -- ["BookingDetail", {"id": "..."}] para abrir a tela certa
  lida_em       timestamptz,
  criado_em     timestamptz not null default now()
);
create index on notificacoes (perfil_id, criado_em desc);

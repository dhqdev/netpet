# netpet · servidor e banco de dados

A API do netpet em **Node.js** com **Postgres**. Ela guarda contas, pets, estabelecimentos, agendamentos, posts, matilhas, mensagens e a carteirinha de saúde, e decide quem pode ver e mudar cada coisa.

O app (Expo) ainda usa os dados de exemplo de `src/data.js`. O próximo passo é trocar cada tela para chamar esta API.

## Rodar no seu computador

Você precisa do [Node 20+](https://nodejs.org) e do [Docker Desktop](https://www.docker.com/products/docker-desktop/) (para o Postgres).

```bash
cd server
cp .env.example .env          # configurações locais
docker compose up -d          # sobe o Postgres
npm install
npm run db:migrar             # cria as tabelas
npm run db:exemplo            # opcional: David, Paçoca, Bicho Bom, Quatro Patas...
npm run dev                   # API em http://localhost:3333
```

Teste no navegador: <http://localhost:3333/estabelecimentos>. Contas de exemplo: `david@netpet.app` (tutor) e `carla@bichobom.app` (estabelecimento), senha `netpet123`.

Para o celular com Expo Go falar com a API, use o IP do computador na rede (ex.: `http://192.168.0.12:3333`), não `localhost`.

### Testes

```bash
DATABASE_URL_TESTE=postgres://netpet:netpet@localhost:5432/postgres npm test
```

São 32 testes. Eles criam um banco temporário, passam pelo fluxo completo (cadastro dos dois tipos de conta, horários livres, agendamento, aceite, acompanhamento ao vivo, avaliação, cancelamento com estorno, cupom, assinaturas, carteirinha, feed, matilhas e mensagens) e conferem que um tutor não consegue mexer no que é de outro.

## Os dois tipos de conta

No cadastro a pessoa escolhe **Tenho um pet** ou **Tenho um estabelecimento**:

| | Tutor | Estabelecimento |
|---|---|---|
| O que o cadastro cria | conta + perfil + (opcional) o primeiro pet | conta + perfil + estabelecimento, com a pessoa como **dona** |
| O que vê ao entrar | Início, Serviços, Matilhas, Pet | o **modo parceiro**: Hoje, Agenda, Pedidos, Mensagens, Negócio |

As duas coisas não se excluem. O dono de um pet shop também pode ter cachorro, e uma tutora pode abrir um negócio depois (`POST /estabelecimentos`). O app mostra o modo parceiro quando `GET /eu` responde `pode_modo_parceiro: true`.

### Quem pode o quê

- **Pet:** o **dono** pode tudo, inclusive convidar a **família** (que vê a carteirinha, agenda e posta pelo pet). Só o dono remove o pet ou convida outras pessoas.
- **Estabelecimento:** a equipe tem três níveis.
  - **dono:** tudo, e é o único que dá acesso de admin a alguém.
  - **admin:** muda serviços, preços, horários, equipe, cupons e vê o financeiro.
  - **equipe:** opera o dia a dia: aceita pedidos, avança o atendimento, bloqueia horários e responde mensagens.
  - Um profissional pode estar na equipe **sem conta no app** (ex.: um banhista que só aparece para o tutor escolher).
- **Carteirinha:** os tutores sempre veem. O estabelecimento que atendeu o pet no último ano **lança** vacinas e consultas, que aparecem como *verificadas*. Se ele também pode **ver** o histórico, quem decide é o dono, em Ajustes > Privacidade.
- **Bloqueio:** esconde posts, comentários, mensagens e perfis nos dois sentidos, e desfaz os "seguir".
- O selo de **verificado** do estabelecimento só a equipe netpet marca.

## Agendamento: as regras

```
tutor pede ──► pendente ──aceita──► confirmado ──pet chegou──► em_andamento ──► concluido
                 │ └─recusa─► recusado      │ └─não veio─► nao_compareceu
                 └──────cancela──────► cancelado ◄┘
```

1. **Horários livres** (`GET /estabelecimentos/:id/horarios-livres?servico=&data=`): a API corta o horário de funcionamento em intervalos de 30 minutos em que o serviço inteiro cabe, e tira o que já está agendado, o que cai num bloqueio (almoço, folga, feriado) e o que está em cima da hora (antecedência mínima). Cada horário diz quais profissionais estão livres. Um profissional pode ter horário próprio.
2. **Sem conflito:** o banco impede que o mesmo profissional tenha dois atendimentos ao mesmo tempo, mesmo que duas pessoas toquem em "Agendar" no mesmo segundo.
3. **Preço:** o serviço tem preço por porte (P, M, G). A API soma os adicionais, o cupom e o leva e traz, e guarda tudo no agendamento. Se o estabelecimento mudar o preço depois, o pedido não muda.
4. **Aceite:** o pedido fica *pendente* até a equipe aceitar. Com **aceite automático** ligado, ele já nasce confirmado.
5. **Ao vivo:** a equipe avança as etapas (*Confirmado, Leva e traz a caminho, Chegou, Em atendimento, Pronto*). A etapa "a caminho" é pulada quando não há leva e traz. Ao concluir, o atendimento entra sozinho no histórico da carteirinha.
6. **Cancelamento:** o tutor cancela de graça até X horas antes (cada estabelecimento define X, o padrão é 2). Depois desse prazo, o valor pago não volta. Quando é o estabelecimento que cancela, ele precisa dar o motivo e o tutor recebe tudo de volta.
7. **Avaliação:** só o tutor avalia, uma vez, depois de concluído. A nota média do estabelecimento é recalculada sozinha, e o estabelecimento pode responder.

## Dinheiro

Todos os valores são guardados em **centavos**. As porcentagens ficam em `src/config.js`:

| | Quem paga | Valor |
|---|---|---|
| Taxa de serviço | tutor | 5% (zero para quem assina o **netpet+**) |
| Comissão | estabelecimento, plano Grátis | 12% |
| Comissão | estabelecimento, **Parceiro Pro** (R$ 89/mês) | 8% |
| Leva e traz | tutor | o valor vai inteiro para o estabelecimento |

- **Pagamento no local** não tem taxa nem comissão, porque o dinheiro não passa pelo app.
- O **cupom do estabelecimento** sai do repasse dele. O **cupom da netpet** sai da comissão da netpet.
- Cupons e campanhas só aparecem no Parceiro Pro.

**Pagamentos:** com `PAGAMENTOS=simulado`, Pix e cartão são aprovados na hora, para testar. Para cobrar de verdade, liga-se uma processadora (Mercado Pago, Pagar.me ou Stripe) em `criarPagamento` (`src/rotas/agendamentos.js`), e ela avisa a API por `POST /webhooks/pagamentos`. As assinaturas (netpet+ e Parceiro Pro) chegam por `POST /webhooks/assinaturas`, vindas da App Store, do Google Play ou do gateway. A API nunca recebe número de cartão.

## O banco

São 55 tabelas, em `db/migrations/`. Para mudar o banco, crie um arquivo novo (`004_...sql`). Não edite os que já rodaram.

```mermaid
erDiagram
  contas ||--|| perfis : "login de"
  perfis ||--o{ pet_tutores : cuida
  pets ||--o{ pet_tutores : "é cuidado por"
  perfis ||--o{ equipe_estabelecimento : trabalha
  estabelecimentos ||--o{ equipe_estabelecimento : tem
  estabelecimentos ||--o{ servicos : oferece
  estabelecimentos ||--o{ horarios : abre
  estabelecimentos ||--o{ bloqueios_agenda : fecha
  pets ||--o{ agendamentos : recebe
  servicos ||--o{ agendamentos : "é pedido em"
  equipe_estabelecimento ||--o{ agendamentos : atende
  agendamentos ||--o{ agendamento_eventos : "ao vivo"
  agendamentos ||--o{ pagamentos : "é pago por"
  agendamentos ||--o| avaliacoes : "é avaliado em"
  pets ||--o{ posts : publica
  posts ||--o{ post_midias : tem
  posts ||--o{ patinhas : recebe
  posts ||--o{ comentarios : recebe
  perfis ||--o{ seguidores : segue
  pets ||--o{ seguidores : "é seguido"
  matilhas ||--o{ canais : tem
  matilhas ||--o{ matilha_membros : reúne
  canais ||--o{ mensagens_canal : tem
  conversas ||--o{ mensagens : tem
  pets ||--o{ vacinas : carteirinha
  pets ||--o{ registros_saude : histórico
```

| Grupo | Tabelas |
|---|---|
| Contas | `contas`, `sessoes`, `perfis`, `dispositivos` |
| Pets | `pets`, `pet_tutores` |
| Estabelecimentos | `categorias`, `estabelecimentos`, `equipe_estabelecimento`, `horarios`, `bloqueios_agenda`, `servicos`, `adicionais`, `cupons`, `favoritos`, `avaliacoes` |
| Agendamento e dinheiro | `agendamentos`, `agendamento_adicionais`, `agendamento_eventos`, `pagamentos`, `repasses`, `assinaturas`, `impulsionamentos` |
| Social | `posts`, `post_midias`, `patinhas`, `salvos`, `comentarios`, `seguidores`, `bloqueios`, `denuncias`, `alertas_perdido` |
| Matilhas e mensagens | `matilhas`, `matilha_membros`, `canais`, `mensagens_canal`, `reacoes`, `leituras_canal`, `conversas`, `conversa_membros`, `mensagens` |
| Saúde | `vacinas`, `medicamentos`, `pesagens`, `alergias`, `registros_saude`, `documentos_pet`, `rotinas`, `tarefas_pet`, `marcos_pet` |
| Jogo | `desafios`, `desafio_progresso`, `selos`, `pet_selos` |
| Avisos | `notificacoes` |

O próprio banco também garante algumas regras, mesmo que alguém escreva nele sem passar pela API: a ordem dos status do agendamento, os contadores (patinhas, comentários, seguidores, membros), a nota média e o uso dos cupons.

## Rotas principais

| Área | Rotas |
|---|---|
| Conta | `POST /contas/cadastro`, `/contas/entrar`, `/contas/renovar`, `/contas/sair`, `GET/PATCH/DELETE /eu` |
| Pets | `POST /pets`, `GET/PATCH/DELETE /pets/:id`, `POST /pets/:id/familia`, `POST/DELETE /pets/:id/seguir` |
| Vitrine | `GET /estabelecimentos?categoria=&busca=&lat=&lng=&aberto=1`, `GET /estabelecimentos/:id` |
| Parceiro | `PATCH /estabelecimentos/:id`, `/servicos`, `/adicionais`, `/equipe`, `PUT /horarios`, `/bloqueios`, `/cupons`, `/agenda`, `/pedidos`, `/clientes`, `/financeiro` |
| Agendar | `GET /estabelecimentos/:id/horarios-livres`, `POST /agendamentos/previa`, `POST /agendamentos`, `GET /agendamentos`, `GET /agendamentos/:id` |
| Atender | `POST /agendamentos/:id/responder`, `/avancar`, `/cancelar`, `/nao-compareceu`, `/avaliar` |
| Social | `GET /feed`, `/explorar`, `POST /posts`, `/posts/:id/patinha`, `/salvar`, `/comentarios`, `/bloqueios`, `/denuncias`, `/perdidos` |
| Matilhas | `GET /matilhas`, `/matilhas/descobrir`, `POST /matilhas/:id/entrar`, `GET/POST /canais/:id/mensagens`, `/canais/:id/lido` |
| Mensagens | `GET/POST /conversas`, `GET/POST /conversas/:id/mensagens` |
| Saúde | `GET /pets/:id/carteirinha`, `POST /pets/:id/vacinas`, `/registros`, `/pesagens`, `/medicamentos`, `/alergias`, `/documentos`, `/rotinas`, `/tarefas`, `/marcos` |
| Outros | `POST /uploads/:pasta`, `GET /notificacoes`, `GET /desafios`, `GET /categorias`, `POST /webhooks/pagamentos`, `/webhooks/assinaturas` |

O login usa dois tokens. O **token de acesso** dura 15 minutos e vai em `Authorization: Bearer ...`. O **token de renovação** dura 60 dias, troca por um par novo em `/contas/renovar` e deve ficar guardado no `expo-secure-store`.

## Fotos e vídeos

`POST /uploads/:pasta` (multipart, campo `arquivo`) devolve um `path`, que vai no post, no perfil ou na mensagem. As pastas `avatares`, `posts` e `estabelecimentos` são públicas, em `/arquivos/...`. As pastas `documentos` e `conversas` são privadas, em `/arquivos-privados/...`, e só abrem com login de quem tem acesso. Os arquivos ficam no disco do servidor. Em produção, a troca é por um storage como Cloudflare R2 ou Amazon S3, sem mudar o app.

## Colocar no ar

Qualquer hospedagem de Node com Postgres serve. Por exemplo: Railway, Render ou Fly.io para a API, e Neon, Supabase (só o Postgres) ou o Postgres da própria hospedagem para o banco. Antes de publicar:

- [ ] `NODE_ENV=production`, com `JWT_SEGREDO` e `WEBHOOK_SEGREDO` longos e aleatórios
- [ ] Ligar a processadora de pagamento e os webhooks
- [ ] Trocar o disco de uploads por R2 ou S3
- [ ] Backup diário do banco
- [ ] Confirmação de e-mail e "esqueci a senha" (a coluna `email_verificado` já existe)
- [ ] Limite de tentativas no login (ex.: `@fastify/rate-limit`)

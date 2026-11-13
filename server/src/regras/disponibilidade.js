// Horários livres de um serviço num dia.
//
// Como funciona:
//  1. Pega os profissionais que atendem (ou só o escolhido).
//  2. Para cada um, pega as janelas do dia: o horário próprio dele, se tiver,
//     senão o horário do estabelecimento.
//  3. Corta a janela em horários de 30 em 30 minutos onde o serviço inteiro cabe
//     (diária de hotel e afins só precisam que o check-in caia na janela).
//  4. Tira o que já tem agendamento ativo, o que cai num bloqueio (almoço, folga,
//     feriado) e o que está em cima da hora (antecedência mínima).
//  5. Junta por horário, dizendo quais profissionais estão livres em cada um.
import { varios } from '../db.js';
import { config } from '../config.js';

export const PASSO_MIN = 30;

export async function horariosLivres({ estabelecimentoId, servicoId, data, equipeId = null }, db) {
  return varios(
    `with s as (
       select sv.duracao_min, e.antecedencia_min
         from servicos sv join estabelecimentos e on e.id = sv.estabelecimento_id
        where sv.id = $2 and sv.estabelecimento_id = $1 and sv.ativo and e.ativo
     ),
     profissionais as (
       select id from equipe_estabelecimento
        where estabelecimento_id = $1 and atende and ativo and ($4::uuid is null or id = $4)
     ),
     janelas as (
       select p.id as equipe_id,
              (($3::date + h.abre) at time zone $5) as ini,
              (($3::date + h.fecha) at time zone $5) as fim
         from profissionais p
         join horarios h on h.estabelecimento_id = $1
                        and h.dia_semana = extract(dow from $3::date)
                        and (h.equipe_id = p.id
                             or (h.equipe_id is null and not exists (
                                   select 1 from horarios h2 where h2.equipe_id = p.id)))
     ),
     candidatos as (
       select j.equipe_id, g as inicio, g + make_interval(mins => s.duracao_min) as fim
         from janelas j cross join s,
              generate_series(
                j.ini,
                case when s.duracao_min >= 720 then j.fim - interval '${PASSO_MIN} minutes'
                     else j.fim - make_interval(mins => s.duracao_min) end,
                interval '${PASSO_MIN} minutes') g
        where g >= now() + make_interval(mins => s.antecedencia_min)
     )
     select c.inicio, min(c.fim) as fim, array_agg(c.equipe_id order by c.equipe_id) as equipe_livre
       from candidatos c
      where not exists (
              select 1 from agendamentos a
               where a.equipe_id = c.equipe_id
                 and a.status in ('pendente', 'confirmado', 'em_andamento')
                 and tstzrange(a.inicio, a.fim) && tstzrange(c.inicio, c.fim))
        and not exists (
              select 1 from bloqueios_agenda b
               where b.estabelecimento_id = $1
                 and (b.equipe_id is null or b.equipe_id = c.equipe_id)
                 and b.periodo && tstzrange(c.inicio, c.fim))
      group by c.inicio
      order by c.inicio`,
    [estabelecimentoId, servicoId, data, equipeId, config.fuso], db,
  );
}

// Data local (AAAA-MM-DD) de um instante, no fuso do app.
export function dataLocal(instante) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: config.fuso }).format(new Date(instante));
}

-- netpet · 002 · Gatilhos
-- Regras que o banco garante sozinho, não importa quem escreva:
-- contadores, data de atualização e a máquina de estados do agendamento.

-- atualizado_em sempre em dia
create function tocar_atualizado_em() returns trigger language plpgsql as $$
begin
  new.atualizado_em := now();
  return new;
end $$;

create trigger perfis_atualizado before update on perfis for each row execute function tocar_atualizado_em();
create trigger pets_atualizado before update on pets for each row execute function tocar_atualizado_em();
create trigger estab_atualizado before update on estabelecimentos for each row execute function tocar_atualizado_em();
create trigger agend_atualizado before update on agendamentos for each row execute function tocar_atualizado_em();

-- ───────────── Máquina de estados do agendamento ─────────────
-- Caminhos permitidos:
--   pendente     → confirmado | recusado | cancelado
--   confirmado   → em_andamento | cancelado | nao_compareceu
--   em_andamento → concluido
-- concluido, cancelado, recusado e nao_compareceu são finais.
create function validar_status_agendamento() returns trigger language plpgsql as $$
begin
  if new.status = old.status then
    return new;
  end if;
  if not (
       (old.status = 'pendente'     and new.status in ('confirmado', 'recusado', 'cancelado'))
    or (old.status = 'confirmado'   and new.status in ('em_andamento', 'cancelado', 'nao_compareceu'))
    or (old.status = 'em_andamento' and new.status = 'concluido')
  ) then
    raise exception 'Mudança de status inválida: % → %', old.status, new.status
      using errcode = 'check_violation';
  end if;
  return new;
end $$;

create trigger agend_status before update of status on agendamentos
  for each row execute function validar_status_agendamento();

-- ───────────── Contadores ─────────────

create function contar_patinhas() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update posts set patinhas = patinhas + 1 where id = new.post_id;
  else
    update posts set patinhas = greatest(patinhas - 1, 0) where id = old.post_id;
  end if;
  return null;
end $$;
create trigger patinhas_contador after insert or delete on patinhas for each row execute function contar_patinhas();

create function contar_comentarios() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update posts set comentarios = comentarios + 1 where id = new.post_id;
  else
    update posts set comentarios = greatest(comentarios - 1, 0) where id = old.post_id;
  end if;
  return null;
end $$;
create trigger comentarios_contador after insert or delete on comentarios for each row execute function contar_comentarios();

create function contar_seguidores() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update pets set seguidores = seguidores + 1 where id = new.pet_id;
  else
    update pets set seguidores = greatest(seguidores - 1, 0) where id = old.pet_id;
  end if;
  return null;
end $$;
create trigger seguidores_contador after insert or delete on seguidores for each row execute function contar_seguidores();

create function contar_posts_pet() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' and new.pet_id is not null then
    update pets set posts = posts + 1 where id = new.pet_id;
  elsif tg_op = 'DELETE' and old.pet_id is not null then
    update pets set posts = greatest(posts - 1, 0) where id = old.pet_id;
  end if;
  return null;
end $$;
create trigger posts_contador after insert or delete on posts for each row execute function contar_posts_pet();

create function contar_membros_matilha() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update matilhas set membros = membros + 1 where id = new.matilha_id;
  else
    update matilhas set membros = greatest(membros - 1, 0) where id = old.matilha_id;
  end if;
  return null;
end $$;
create trigger membros_contador after insert or delete on matilha_membros for each row execute function contar_membros_matilha();

-- Nota média do estabelecimento sempre recalculada.
create function recalcular_nota() returns trigger language plpgsql as $$
declare
  alvo uuid := coalesce(new.estabelecimento_id, old.estabelecimento_id);
begin
  update estabelecimentos e
     set nota_media = coalesce((select round(avg(nota), 1) from avaliacoes where estabelecimento_id = alvo), 0),
         avaliacoes = (select count(*) from avaliacoes where estabelecimento_id = alvo)
   where e.id = alvo;
  return null;
end $$;
create trigger avaliacoes_nota after insert or update of nota or delete on avaliacoes
  for each row execute function recalcular_nota();

-- Última mensagem da conversa sobe a conversa na lista.
create function tocar_conversa() returns trigger language plpgsql as $$
begin
  update conversas set ultima_em = new.criado_em where id = new.conversa_id;
  return null;
end $$;
create trigger mensagens_conversa after insert on mensagens for each row execute function tocar_conversa();

-- Uso do cupom conta quando o agendamento é criado com ele.
create function contar_uso_cupom() returns trigger language plpgsql as $$
begin
  if new.cupom_id is not null then
    update cupons set usos = usos + 1 where id = new.cupom_id;
  end if;
  return null;
end $$;
create trigger cupom_uso after insert on agendamentos for each row execute function contar_uso_cupom();

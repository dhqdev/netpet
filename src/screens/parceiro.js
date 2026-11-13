import React, { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Icon } from '../icons';
import { useTheme, alpha } from '../theme';
import { useStore } from '../store';
import { useNav } from '../nav';
import {
  Screen, T, Btn, Card, Section, Group, Row, Chip, ChipRow, Segmented, Field, Tap, PetAvatar, PartnerMark, Pill, StatePill,
  Empty, Note, NavHeader, IconTile, Toggle, RoundButton, Progress, InitialAvatar, Stars, Divider,
} from '../kit';
import { Composer } from './matilhas';
import {
  PETS, PARTNERS, PARTNER_SELF, PARTNER_WEEK, PARTNER_AGENDA, PARTNER_CLIENTS, FINANCE, PLANS, SERVICES, SIZES, TEAM, REVIEWS,
  LIVE_STEPS, ALLERGIES, brl, fmt,
} from '../data';

// Modo parceiro: o app do Pet Shop Bicho Bom. Fila do dia, agenda por profissional,
// pedidos, mensagens com tutores e o painel do negócio.

const ME_P = PARTNERS[PARTNER_SELF];
const STAGE_LABEL = (stage) => (LIVE_STEPS[stage] ? LIVE_STEPS[stage].label : 'Pronto');

function TabTitle({ title, sub, right }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 10 }}>
      <View style={{ flex: 1 }}>
        <T kind="display">{title}</T>
        {sub ? <T kind="sub" style={{ marginTop: 2 }}>{sub}</T> : null}
      </View>
      {right ? <View style={{ flexDirection: 'row', gap: 8 }}>{right}</View> : null}
    </View>
  );
}

function Stat({ value, label, tone }) {
  const t = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: tone ? alpha(t.tone, t.dark ? 0.2 : 0.14) : t.c.surface, borderRadius: t.radius.tile, padding: 12 }}>
      <Text style={{ fontFamily: t.fonts.titleStrong, fontSize: 22, color: tone ? t.toneText : t.c.text }}>{value}</Text>
      <T kind="small" style={{ marginTop: 2 }}>{label}</T>
    </View>
  );
}

// ——— Hoje: a fila do dia ———

function QueueCard({ q }) {
  const t = useTheme();
  const s = useStore();
  const nav = useNav();
  const p = PETS[q.pet];
  const live = q.state === 'live';
  return (
    <Card onPress={() => nav.push('PartnerAttend', { id: q.id })} label={`${p.name}, ${q.time}`} style={live ? { borderWidth: 2, borderColor: t.tone } : null}>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ alignItems: 'center', width: 46 }}>
          <Text style={{ color: q.state === 'done' ? t.c.text2 : t.c.text, fontWeight: '700', fontSize: 15 }}>{q.time}</Text>
          <View style={{ marginTop: 8 }}><PetAvatar pet={q.pet} size={40} muted={q.state === 'done'} /></View>
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ flex: 1, color: t.c.text, fontSize: 16, fontWeight: '600' }} numberOfLines={1}>{p.name} <Text style={{ color: t.c.text2, fontWeight: '400' }}>· {q.tutor}</Text></Text>
            {q.state === 'done' ? <StatePill state="ok" text="Pronto" icon="check" /> : live ? <StatePill state="soon" text={STAGE_LABEL(q.stage)} /> : <StatePill state="info" text="A seguir" />}
          </View>
          <T kind="sub" style={{ marginTop: 2 }}>{q.service} · com {q.pro}</T>
          {q.note && q.state !== 'done' ? (
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 8, alignItems: 'flex-start' }}>
              <Icon name="alert" size={15} color={t.toneText} />
              <Text style={{ flex: 1, color: t.toneText, fontSize: 13.5 }}>{q.note}</Text>
            </View>
          ) : null}
          {q.delivery && q.state !== 'done' ? <Pill icon="truck" text="Leva e traz" style={{ marginTop: 8 }} /> : null}
          {live ? <Progress value={(q.stage || 0) / 5} style={{ marginTop: 12 }} /> : null}
          {q.state === 'next' ? (
            <Btn small full={false} title="Iniciar atendimento" icon="play" style={{ marginTop: 12, alignSelf: 'flex-start' }}
              onPress={() => { s.startQueue(q.id); s.toast(`${q.tutor} foi avisado que ${p.name} chegou`); }} />
          ) : null}
          {live ? (
            <Btn small full={false} title={q.stage >= 4 ? 'Marcar como pronto' : `Avançar para ${STAGE_LABEL((q.stage || 0) + 1).toLowerCase()}`} icon="check" style={{ marginTop: 10, alignSelf: 'flex-start' }}
              onPress={() => { s.advanceQueue(q.id); s.toast(`${q.tutor} recebeu: ${STAGE_LABEL((q.stage || 0) + 1)}`); }} />
          ) : null}
        </View>
      </View>
    </Card>
  );
}

export function PartnerToday() {
  const t = useTheme();
  const s = useStore();
  const nav = useNav();
  const done = s.queue.filter((q) => q.state === 'done').length;
  const fresh = s.requests.filter((r) => !r.answer).length;
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 130 }}>
      <TabTitle title="Hoje" sub={`Quinta, 12 de novembro · ${ME_P.name}`} right={<RoundButton icon="settings" label="Ajustes" onPress={() => nav.push('Settings')} />} />
      <View style={{ paddingHorizontal: 16 }}>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Stat tone value={`${done}/${s.queue.length}`} label="atendimentos" />
          <Stat value={brl(275).replace(',00', '')} label="recebido hoje" />
          <Stat value={ME_P.rating} label={`${fmt(ME_P.reviews)} avaliações`} />
        </View>
        {fresh ? (
          <Card style={{ marginTop: 12 }} onPress={() => nav.setTab('pedidos')} label="Ver pedidos novos">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <IconTile icon="bell" />
              <View style={{ flex: 1 }}>
                <T kind="h">{fresh} {fresh > 1 ? 'pedidos esperando' : 'pedido esperando'}</T>
                <T kind="sub">Responda em até 2 horas para manter o selo de resposta rápida</T>
              </View>
              <Icon name="chevRight" size={18} color={t.c.text2} />
            </View>
          </Card>
        ) : null}
        <Section title="Fila do dia">
          <View style={{ gap: 10 }}>
            {s.queue.map((q) => <QueueCard key={q.id} q={q} />)}
          </View>
        </Section>
        <Note style={{ marginTop: 18 }} icon="paw">Cada etapa que você marca chega na hora para o tutor, na tela Ao vivo.</Note>
      </View>
    </ScrollView>
  );
}

// ——— Atendimento (detalhe de um pet da fila) ———

export function PartnerAttendScreen({ id }) {
  const t = useTheme();
  const s = useStore();
  const nav = useNav();
  const q = s.queue.find((x) => x.id === id) || s.queue[0];
  const p = PETS[q.pet];
  const stage = q.state === 'done' ? 5 : q.state === 'live' ? q.stage || 0 : -1;
  const [sentPhoto, setSentPhoto] = useState(false);
  return (
    <Screen title={`${p.name} · ${q.time}`} footer={q.state === 'done' ? (
      <Btn title={sentPhoto ? 'Foto do depois enviada' : 'Enviar foto do depois'} icon={sentPhoto ? 'check' : 'camera'} kind={sentPhoto ? 'secondary' : 'primary'}
        onPress={() => { setSentPhoto(true); s.toast(`${q.tutor} recebeu a foto do depois`); }} />
    ) : q.state === 'live' ? (
      <Btn title={stage >= 4 ? 'Marcar como pronto' : `Avançar para ${STAGE_LABEL(stage + 1).toLowerCase()}`} icon="check" onPress={() => s.advanceQueue(q.id)} />
    ) : (
      <Btn title="Iniciar atendimento" icon="play" onPress={() => s.startQueue(q.id)} />
    )}>
      <View style={{ alignItems: 'center', marginTop: 6 }}>
        <PetAvatar pet={q.pet} size={84} />
        <T kind="title" style={{ marginTop: 10 }}>{p.name}</T>
        <T kind="sub">{p.breed} · {p.size || 'Médio'} · tutor {q.tutor}</T>
      </View>
      <Group style={{ marginTop: 18 }}>
        <Row icon="scissors" title={q.service} sub={`Com ${q.pro} · ${q.time}`} chevron={false} />
        {q.delivery ? <Row icon="truck" title="Leva e traz" sub="Buscar e devolver no endereço do tutor" chevron={false} /> : null}
        <Row icon="chat" title={`Mensagem para ${q.tutor}`} onPress={() => nav.push('PartnerChat', { id: q.pet })} />
      </Group>
      <Section title="Atenção">
        <Card>
          {q.note ? <T kind="body">{q.note}</T> : <T kind="sub">Sem observações do tutor.</T>}
          {ALLERGIES[q.pet] ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
              {ALLERGIES[q.pet].map((a) => <StatePill key={a} state="late" text={a} icon="alert" />)}
            </View>
          ) : null}
        </Card>
      </Section>
      <Section title="Etapas">
        <Card>
          {LIVE_STEPS.map((st, i) => {
            const on = i <= stage;
            const cur = i === stage && q.state === 'live';
            return (
              <View key={st.key} style={{ flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 8 }}>
                <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: on ? t.tone : t.c.surface2, alignItems: 'center', justifyContent: 'center' }}>
                  {on ? <Icon name="check" size={15} color={t.onTone} stroke={2.4} /> : <Text style={{ color: t.c.text2, fontSize: 12 }}>{i + 1}</Text>}
                </View>
                <Text style={{ flex: 1, color: on ? t.c.text : t.c.text2, fontSize: 15, fontWeight: cur ? '700' : '400' }}>{st.label}</Text>
                {cur ? <StatePill state="soon" text="Agora" /> : null}
              </View>
            );
          })}
        </Card>
      </Section>
    </Screen>
  );
}

// ——— Agenda por profissional ———

const KIND = {
  free: { label: 'Livre' },
  done: { state: 'ok', label: 'Feito' },
  live: { state: 'soon', label: 'Agora' },
  next: { state: 'info', label: 'A seguir' },
  block: { label: 'Bloqueado' },
};

export function PartnerAgenda() {
  const t = useTheme();
  const s = useStore();
  const pros = Object.keys(PARTNER_AGENDA);
  const [pro, setPro] = useState(pros[0]);
  const [day, setDay] = useState(3);
  const [blocked, setBlocked] = useState({});
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 130 }}>
      <TabTitle title="Agenda" sub="Semana de 9 a 14 de novembro" right={<RoundButton icon="plus" label="Bloquear horário" onPress={() => s.toast('Toque num horário livre para bloquear')} />} />
      <View style={{ paddingHorizontal: 16 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {PARTNER_WEEK.map((d, i) => {
            const on = i === day;
            const full = d.booked >= d.slots;
            return (
              <Tap key={d.day} onPress={() => setDay(i)} label={d.day} style={{ width: 66, borderRadius: 16, paddingVertical: 10, alignItems: 'center', gap: 6, backgroundColor: on ? t.tone : t.c.surface }}>
                <Text style={{ color: on ? t.onTone : t.c.text, fontWeight: '600', fontSize: 14 }}>{d.day}</Text>
                <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: on ? alpha('#FFFFFF', 0.35) : t.c.surface2, overflow: 'hidden' }}>
                  <View style={{ width: `${(d.booked / d.slots) * 100}%`, height: '100%', backgroundColor: on ? t.onTone : full ? '#C2453A' : t.tone }} />
                </View>
                <Text style={{ color: on ? t.onTone : t.c.text2, fontSize: 11.5 }}>{full ? 'lotado' : `${d.slots - d.booked} livres`}</Text>
              </Tap>
            );
          })}
        </ScrollView>
        <Segmented style={{ marginTop: 16 }} options={pros} value={pro} onChange={setPro} />
        {day !== 3 ? <Note style={{ marginTop: 12 }} icon="calendar">Mostrando o modelo do dia. Os horários de hoje, quinta, estão completos.</Note> : null}
        <View style={{ marginTop: 14, gap: 8 }}>
          {PARTNER_AGENDA[pro].map((slot) => {
            const k = `${pro}-${slot.time}`;
            const kind = slot.kind === 'free' && blocked[k] ? 'block' : slot.kind;
            const meta = KIND[kind];
            const free = kind === 'free';
            return (
              <View key={slot.time} style={{ flexDirection: 'row', gap: 12, alignItems: 'stretch' }}>
                <Text style={{ width: 48, color: t.c.text2, fontSize: 13.5, paddingTop: 16, textAlign: 'right' }}>{slot.time}</Text>
                <Tap onPress={free || (slot.kind === 'free' && blocked[k]) ? () => { setBlocked((b) => ({ ...b, [k]: !b[k] })); s.toast(blocked[k] ? 'Horário liberado' : 'Horário bloqueado'); } : undefined}
                  label={free ? `Bloquear ${slot.time}` : slot.label || meta.label} outerStyle={{ flex: 1 }} scale={0.99} hitSlop={0}
                  style={{ minHeight: 52, borderRadius: 14, paddingHorizontal: 14, justifyContent: 'center',
                    backgroundColor: free ? 'transparent' : kind === 'block' ? t.c.surface2 : t.c.surface,
                    borderWidth: free ? 1.2 : kind === 'live' ? 2 : 0, borderStyle: free ? 'dashed' : 'solid', borderColor: free ? t.c.line : t.tone }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ flex: 1, color: free ? t.c.text2 : t.c.text, fontSize: 15 }}>{free ? 'Livre · toque para bloquear' : slot.label || 'Bloqueado'}</Text>
                    {meta.state ? <StatePill state={meta.state} text={meta.label} /> : null}
                  </View>
                </Tap>
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

// ——— Pedidos ———

const ALT_TIMES = ['Mesmo dia, 15h30', 'Dia seguinte, 9h', 'Dia seguinte, 14h'];

function RequestCard({ r }) {
  const t = useTheme();
  const s = useStore();
  const [proposing, setProposing] = useState(false);
  const p = PETS[r.pet];
  const ans = r.answer;
  return (
    <Card>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <PetAvatar pet={r.pet} size={44} />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <T kind="h">{p.name}</T>
            {r.fresh && !ans ? <StatePill state="soon" text="Novo" /> : null}
          </View>
          <T kind="sub">{p.breed} · tutor {r.tutor}</T>
        </View>
        <Text style={{ color: t.c.text, fontWeight: '700', fontSize: 16 }}>{brl(r.price).replace(',00', '')}</Text>
      </View>
      <Divider style={{ marginVertical: 12 }} />
      <View style={{ gap: 6 }}>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}><Icon name="scissors" size={16} color={t.c.text2} /><T kind="body">{r.service}</T></View>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}><Icon name="calendar" size={16} color={t.c.text2} /><T kind="body">{r.when}</T></View>
        {r.note ? <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}><Icon name="comment" size={16} color={t.c.text2} /><T kind="sub" style={{ flex: 1 }}>{r.note}</T></View> : null}
      </View>
      {ans ? (
        <View style={{ marginTop: 14 }}>
          {ans === 'aceito' ? <StatePill state="ok" icon="check" text="Aceito. O tutor já foi avisado." /> : null}
          {ans === 'recusado' ? <StatePill state="late" text="Recusado. O tutor recebeu outras opções perto." /> : null}
          {ans.startsWith('proposto') ? <StatePill state="info" text={`Você sugeriu: ${ans.slice(9)}`} /> : null}
        </View>
      ) : proposing ? (
        <View style={{ marginTop: 14, gap: 8 }}>
          <T kind="label">Sugerir outro horário</T>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {ALT_TIMES.map((a) => <Chip key={a} title={a} onPress={() => { s.answerRequest(r.id, `proposto ${a}`); s.toast(`${r.tutor} recebeu a sugestão`); }} />)}
          </View>
          <Btn small kind="ghost" title="Voltar" onPress={() => setProposing(false)} />
        </View>
      ) : (
        <View style={{ marginTop: 14, gap: 8 }}>
          <Btn small title="Aceitar" icon="check" onPress={() => { s.answerRequest(r.id, 'aceito'); s.toast(`Agendado: ${p.name}, ${r.when}`); }} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Btn small kind="secondary" title="Outro horário" style={{ flex: 1 }} full={false} onPress={() => setProposing(true)} />
            <Btn small kind="danger" title="Recusar" full={false} style={{ flex: 1 }} onPress={() => s.answerRequest(r.id, 'recusado')} />
          </View>
        </View>
      )}
    </Card>
  );
}

export function PartnerRequests() {
  const s = useStore();
  const [tab, setTab] = useState('novos');
  const list = s.requests.filter((r) => (tab === 'novos' ? !r.answer : !!r.answer));
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 130 }}>
      <TabTitle title="Pedidos" sub="Tutores pedindo horário" />
      <View style={{ paddingHorizontal: 16 }}>
        <Segmented options={[{ key: 'novos', label: `Novos (${s.requests.filter((r) => !r.answer).length})` }, { key: 'respondidos', label: 'Respondidos' }]} value={tab} onChange={setTab} />
        <View style={{ gap: 12, marginTop: 14 }}>
          {list.length ? list.map((r) => <RequestCard key={r.id} r={r} />) : (
            <Empty icon="bell" title={tab === 'novos' ? 'Tudo respondido' : 'Nada por aqui ainda'} text={tab === 'novos' ? 'Quando um tutor pedir horário, ele aparece aqui e você recebe um aviso.' : 'Os pedidos que você responder ficam aqui.'} compact />
          )}
        </View>
      </View>
    </ScrollView>
  );
}

// ——— Mensagens com tutores ———

const PARTNER_THREADS = [
  { pet: 'pacoca', tutor: 'David', last: 'Perfeito, obrigado! Ele fica mais calmo se alguém falar com ele.', time: '14:01', unread: 1 },
  { pet: 'mel', tutor: 'Camila', last: 'Chego 15h20, pode ser?', time: '13:12', unread: 1 },
  { pet: 'pipoca', tutor: 'Lucas', last: 'Você: Lembrete: o Pipoca está há 4 semanas sem banho 🛁', time: 'ontem' },
  { pet: 'thor', tutor: 'Rafael', last: 'Valeu! Ele voltou lindo.', time: 'ter' },
];

export function PartnerMessages() {
  const t = useTheme();
  const nav = useNav();
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 130 }}>
      <TabTitle title="Mensagens" sub="Conversas com tutores" />
      <View style={{ paddingHorizontal: 16 }}>
        <Group>
          {PARTNER_THREADS.map((d) => (
            <Row key={d.pet} onPress={() => nav.push('PartnerChat', { id: d.pet })} chevron={false}
              left={<PetAvatar pet={d.pet} size={42} />} title={`${d.tutor} · ${PETS[d.pet].name}`} sub={d.last} numberOfLines={1}
              right={(
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <T kind="small">{d.time}</T>
                  {d.unread ? <View style={{ minWidth: 20, height: 20, borderRadius: 10, backgroundColor: t.tone, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 }}><Text style={{ color: t.onTone, fontSize: 11.5, fontWeight: '700' }}>{d.unread}</Text></View> : null}
                </View>
              )} />
          ))}
        </Group>
        <Note style={{ marginTop: 14 }} icon="clock">Respostas rápidas: “Chegou bem”, “Está no banho”, “Pronto para buscar”. Toque e segure no campo de mensagem para usar.</Note>
      </View>
    </ScrollView>
  );
}

export function PartnerChatScreen({ id = 'pacoca' }) {
  const t = useTheme();
  const meta = PARTNER_THREADS.find((d) => d.pet === id) || { pet: id, tutor: 'Tutor', last: 'Oi!', time: '' };
  const [msgs, setMsgs] = useState(id === 'pacoca' ? [
    { me: true, text: 'Oi! Aqui é a Carla, do Bicho Bom. Li que o Paçoca tem medo de secador.', time: '13:59' },
    { me: true, text: 'Vou usar a toalha e o soprador no mínimo, tá bom?', time: '13:59' },
    { me: false, text: meta.last, time: meta.time },
  ] : [{ me: meta.last.startsWith('Você: '), text: meta.last.replace('Você: ', ''), time: meta.time }]);
  const scroller = useRef(null);
  const quick = ['Chegou bem 🐾', 'Está no banho', 'Pronto para buscar!'];
  const send = (text) => setMsgs((m) => [...m, { me: true, text, time: 'agora' }]);
  return (
    <View style={{ flex: 1, backgroundColor: t.c.bg }}>
      <NavHeader title={`${meta.tutor} · ${PETS[id].name}`} />
      <ScrollView ref={scroller} onContentSizeChange={() => scroller.current && scroller.current.scrollToEnd({ animated: false })} contentContainerStyle={{ padding: 16, gap: 8 }}>
        <View style={{ alignItems: 'center', paddingBottom: 12 }}>
          <PetAvatar pet={id} size={56} />
          <T kind="h" style={{ marginTop: 8 }}>{meta.tutor}</T>
          <T kind="small">Tutor {PETS[id].article} {PETS[id].name}</T>
        </View>
        {msgs.map((m, i) => (
          <View key={i} style={{ alignSelf: m.me ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
            <View style={{ backgroundColor: m.me ? t.tone : t.c.surface, borderRadius: 20, borderBottomRightRadius: m.me ? 6 : 20, borderBottomLeftRadius: m.me ? 20 : 6, paddingHorizontal: 14, paddingVertical: 10 }}>
              <Text style={{ color: m.me ? t.onTone : t.c.text, fontSize: 15.5, lineHeight: 21 }}>{m.text}</Text>
            </View>
            <T kind="small" style={{ alignSelf: m.me ? 'flex-end' : 'flex-start', marginTop: 3, marginHorizontal: 6 }}>{m.time}</T>
          </View>
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ paddingHorizontal: 12, gap: 8, paddingBottom: 8 }}>
        {quick.map((q) => <Chip key={q} title={q} onPress={() => send(q)} />)}
      </ScrollView>
      <Composer placeholder="Mensagem" onSend={send} />
    </View>
  );
}

// ——— Negócio ———

export function PartnerBusiness() {
  const t = useTheme();
  const s = useStore();
  const nav = useNav();
  const tiles = [
    ['wallet', 'Financeiro', brl(FINANCE.net).replace(',00', ''), 'Finance'],
    ['scissors', 'Catálogo', `${SERVICES[PARTNER_SELF].length} serviços`, 'Catalog'],
    ['users', 'Clientes', `${PARTNER_CLIENTS.length} pets`, 'Clients'],
    ['star', 'Avaliações', `${ME_P.rating} · ${fmt(ME_P.reviews)}`, 'PartnerReviews'],
  ];
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 130 }}>
      <TabTitle title="Negócio" right={<RoundButton icon="settings" label="Ajustes" onPress={() => nav.push('Settings')} />} />
      <View style={{ paddingHorizontal: 16 }}>
        <Card onPress={() => nav.push('Partner', { id: PARTNER_SELF })} label="Ver meu perfil como tutor">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <PartnerMark partner={PARTNER_SELF} size={56} />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <T kind="h" numberOfLines={1} style={{ flexShrink: 1 }}>{ME_P.name}</T>
                <Icon name="verified" size={17} color={t.toneText} filled />
              </View>
              <T kind="sub">{ME_P.area} · {s.partnerPro ? 'Parceiro Pro' : 'Plano grátis'}</T>
              <T kind="small" style={{ marginTop: 2, color: t.toneText }}>Ver como os tutores me veem</T>
            </View>
            <Icon name="chevRight" size={18} color={t.c.text2} />
          </View>
        </Card>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
          {tiles.map(([icon, title, sub, screen]) => (
            <View key={title} style={{ width: '48.4%' }}>
              <Card onPress={() => nav.push(screen)} label={title} pad={14}>
                <IconTile icon={icon} size={38} />
                <T kind="h" style={{ marginTop: 10 }}>{title}</T>
                <T kind="sub">{sub}</T>
              </Card>
            </View>
          ))}
        </View>
        <Section title="Crescer">
          <Group>
            <Row icon="crown" tone title={s.partnerPro ? 'Parceiro Pro' : 'Conheça o Parceiro Pro'} sub={s.partnerPro ? 'Taxa de 8% e relatórios completos' : 'Taxa menor, lembretes automáticos e selo na busca'} onPress={() => nav.push('Plans')} />
            <Row icon="rocket" tone title="Destaque na busca" sub="Apareça primeiro, sempre marcado como Patrocinado" onPress={() => nav.push('Boost')} />
            <Row icon="ticket" tone title="Cupons e campanhas" sub="Traga clientes novos e quem sumiu" onPress={() => nav.push('PartnerCoupons')} />
          </Group>
        </Section>
        <Section title="Cadastro">
          <Group>
            <Row icon="shieldCheck" title="Cadastro e verificação" sub="Documentos, endereço e conta para repasse" value="Completo" onPress={() => nav.push('Verify')} />
            <Row icon="users" title="Equipe" sub={TEAM[PARTNER_SELF].filter((m) => m.key !== 'qualquer').map((m) => m.name).join(' e ')} onPress={() => nav.push('Team')} />
            <Row icon="clock" title="Horário de funcionamento" value="Seg a sáb" onPress={() => s.toast('Horário salvo')} />
          </Group>
        </Section>
        <Group style={{ marginTop: 26 }}>
          <Row icon="swap" title="Voltar para o modo tutor" onPress={() => { s.setMode('tutor'); nav.resetTo('inicio'); s.toast('Modo tutor'); }} />
        </Group>
      </View>
    </ScrollView>
  );
}

// ——— Financeiro ———

export function FinanceScreen() {
  const t = useTheme();
  const s = useStore();
  const max = Math.max(...FINANCE.byWeek);
  return (
    <Screen title="Financeiro">
      <T kind="label" style={{ marginTop: 8, marginLeft: 4 }}>Líquido em {FINANCE.month}</T>
      <T kind="display" style={{ marginLeft: 4, marginTop: 4 }}>{brl(FINANCE.net)}</T>
      <T kind="sub" style={{ marginLeft: 4 }}>{brl(FINANCE.gross)} em vendas · {brl(FINANCE.fee)} de taxa netpet</T>
      <Card style={{ marginTop: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 14, height: 130 }}>
          {FINANCE.byWeek.map((v, i) => (
            <View key={i} style={{ flex: 1, alignItems: 'center', gap: 6, justifyContent: 'flex-end', height: '100%' }}>
              <T kind="small">{(v / 1000).toFixed(1).replace('.', ',')} mil</T>
              <View style={{ width: '100%', height: (v / max) * 86, borderRadius: 8, backgroundColor: i === FINANCE.byWeek.length - 1 ? t.tone : alpha(t.tone, 0.35) }} />
            </View>
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: 14, marginTop: 6 }}>
          {FINANCE.byWeek.map((_, i) => <T key={i} kind="small" center style={{ flex: 1 }}>Sem {i + 1}</T>)}
        </View>
      </Card>
      <Card style={{ marginTop: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <IconTile icon="wallet" />
          <View style={{ flex: 1 }}>
            <T kind="h">Próximo repasse: {brl(FINANCE.nextPayoutValue)}</T>
            <T kind="sub">{FINANCE.nextPayout} · Itaú ••• 4821</T>
          </View>
        </View>
        <Btn small kind="secondary" title="Antecipar repasse (taxa de 1,5%)" style={{ marginTop: 12 }} onPress={() => s.toast('Pedido de antecipação enviado')} />
      </Card>
      <Section title="Movimentações">
        <Group>
          {FINANCE.rows.map((r, i) => (
            <Row key={i} icon={r.payout ? 'upload' : r.via === 'Pix' ? 'pix' : r.via === 'Cartão' ? 'card' : 'cash'} title={r.label}
              sub={r.payout ? r.when : `${r.when} · ${r.via}${r.fee ? ` · taxa ${brl(r.fee)}` : ' · sem taxa'}`} chevron={false}
              right={<Text style={{ color: r.payout ? t.c.text2 : t.c.text, fontWeight: '600', fontSize: 15 }}>{brl(r.value)}</Text>} />
          ))}
        </Group>
      </Section>
      <Note style={{ marginTop: 14 }}>Pagamentos no local não têm taxa netpet. A taxa vale só para o que é pago pelo app: {s.partnerPro ? '8% no Parceiro Pro' : '12% no plano grátis'}.</Note>
    </Screen>
  );
}

// ——— Catálogo ———

export function CatalogScreen() {
  const t = useTheme();
  const s = useStore();
  const [items, setItems] = useState(SERVICES[PARTNER_SELF].map((x) => ({ ...x, on: true })));
  const [edit, setEdit] = useState(null);
  return (
    <Screen title="Catálogo" footer={<Btn title="Adicionar serviço" icon="plus" onPress={() => { setItems((l) => [...l, { key: `n${l.length}`, name: 'Hidratação', mins: 30, prices: [30, 40, 50], desc: 'Máscara hidratante para pelagem ressecada.', on: true }]); s.toast('Serviço adicionado'); }} />}>
      <T kind="sub" style={{ marginTop: 6, marginLeft: 4 }}>Preços por porte. Os tutores veem o preço do porte do pet deles.</T>
      <View style={{ gap: 10, marginTop: 12 }}>
        {items.map((it, i) => (
          <Card key={it.key} style={{ opacity: it.on ? 1 : 0.6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <T kind="h">{it.name}</T>
                <T kind="small">{it.mins} min · {it.on ? 'visível' : 'pausado'}</T>
              </View>
              <Toggle value={it.on} label={`Mostrar ${it.name}`} onChange={(v) => setItems((l) => l.map((x, j) => (j === i ? { ...x, on: v } : x)))} />
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              {it.prices.map((p, j) => (
                <Tap key={j} onPress={() => setEdit(edit === `${i}-${j}` ? null : `${i}-${j}`)} label={`Preço ${SIZES[j]}`} outerStyle={{ flex: 1 }}
                  style={{ borderRadius: 12, backgroundColor: edit === `${i}-${j}` ? alpha(t.tone, 0.18) : t.c.surface2, padding: 10 }}>
                  <T kind="small">{SIZES[j]}</T>
                  <Text style={{ color: t.c.text, fontSize: 16, fontWeight: '700', marginTop: 2 }}>R$ {p}</Text>
                </Tap>
              ))}
            </View>
            {edit && edit.startsWith(`${i}-`) ? (
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, alignItems: 'center' }}>
                <Btn small kind="secondary" full={false} icon="minus" title="R$ 5" onPress={() => setItems((l) => l.map((x, k) => (k === i ? { ...x, prices: x.prices.map((p, m) => (m === +edit.split('-')[1] ? Math.max(0, p - 5) : p)) } : x)))} />
                <Btn small kind="secondary" full={false} icon="plus" title="R$ 5" onPress={() => setItems((l) => l.map((x, k) => (k === i ? { ...x, prices: x.prices.map((p, m) => (m === +edit.split('-')[1] ? p + 5 : p)) } : x)))} />
                <View style={{ flex: 1 }} />
                <Btn small full={false} title="Pronto" onPress={() => { setEdit(null); s.toast('Preço atualizado'); }} />
              </View>
            ) : null}
            <T kind="sub" style={{ marginTop: 10 }}>{it.desc}</T>
          </Card>
        ))}
      </View>
    </Screen>
  );
}

// ——— Clientes ———

export function ClientsScreen() {
  const t = useTheme();
  const s = useStore();
  const nav = useNav();
  const [sent, setSent] = useState({});
  return (
    <Screen title="Clientes">
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
        <Stat tone value={String(PARTNER_CLIENTS.length)} label="pets ativos" />
        <Stat value="68%" label="voltam em 30 dias" />
      </View>
      <View style={{ gap: 10, marginTop: 14 }}>
        {PARTNER_CLIENTS.map((c) => (
          <Card key={c.pet}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <PetAvatar pet={c.pet} size={44} />
              <View style={{ flex: 1 }}>
                <T kind="h">{PETS[c.pet].name} <Text style={{ color: t.c.text2, fontWeight: '400', fontSize: 14 }}>· {c.tutor}</Text></T>
                <T kind="sub">{c.visits} visitas · última {c.last}</T>
              </View>
              <Tap onPress={() => nav.push('PartnerChat', { id: c.pet })} label={`Conversar com ${c.tutor}`} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: t.c.surface2, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="chat" size={19} color={t.c.text} />
              </Tap>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 }}>
              <StatePill state={c.late ? 'late' : 'info'} text={c.next} />
              {c.late ? (
                <Btn small full={false} kind={sent[c.pet] ? 'secondary' : 'outline'} title={sent[c.pet] ? 'Enviado' : 'Lembrar'} style={{ marginLeft: 'auto', height: 34 }}
                  onPress={() => { setSent((x) => ({ ...x, [c.pet]: true })); s.toast(`${c.tutor} recebeu um lembrete`); }} />
              ) : null}
            </View>
          </Card>
        ))}
      </View>
      {!s.partnerPro ? <Note style={{ marginTop: 14 }} icon="crown">No Parceiro Pro, os lembretes de retorno saem sozinhos no dia certo.</Note> : null}
    </Screen>
  );
}

// ——— Avaliações com resposta ———

export function PartnerReviewsScreen() {
  const t = useTheme();
  const s = useStore();
  const [replies, setReplies] = useState({});
  const [draft, setDraft] = useState({});
  const [open, setOpen] = useState(null);
  const dist = [[5, 0.86], [4, 0.1], [3, 0.03], [2, 0.01], [1, 0]];
  return (
    <Screen title="Avaliações" keyboard>
      <Card style={{ marginTop: 6 }}>
        <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontFamily: t.fonts.titleStrong, fontSize: 40, color: t.c.text }}>{ME_P.rating}</Text>
            <Stars value={5} />
            <T kind="small" style={{ marginTop: 4 }}>{fmt(ME_P.reviews)} avaliações</T>
          </View>
          <View style={{ flex: 1, gap: 5 }}>
            {dist.map(([n, v]) => (
              <View key={n} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <T kind="small" style={{ width: 10 }}>{n}</T>
                <Progress value={v} height={6} style={{ flex: 1 }} />
              </View>
            ))}
          </View>
        </View>
      </Card>
      <View style={{ gap: 10, marginTop: 14 }}>
        {REVIEWS.map((r, i) => {
          const reply = replies[i] || r.reply;
          return (
            <Card key={i}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <T kind="h" style={{ flex: 1, fontSize: 15 }}>{r.who}</T>
                <T kind="small">{r.when}</T>
              </View>
              <View style={{ marginTop: 4 }}><Stars value={r.stars} /></View>
              <T kind="body" style={{ marginTop: 8 }}>{r.text}</T>
              {reply ? (
                <View style={{ marginTop: 10, padding: 12, borderRadius: 12, backgroundColor: t.c.surface2 }}>
                  <T kind="small" style={{ fontWeight: '600' }}>Sua resposta</T>
                  <T kind="sub" style={{ marginTop: 2 }}>{reply}</T>
                </View>
              ) : open === i ? (
                <View style={{ marginTop: 10, gap: 8 }}>
                  <Field value={draft[i] || ''} onChangeText={(v) => setDraft((d) => ({ ...d, [i]: v }))} placeholder="Escreva com carinho e sem dados pessoais" multiline autoFocus />
                  <Btn small title="Publicar resposta" disabled={!(draft[i] || '').trim()} onPress={() => { setReplies((x) => ({ ...x, [i]: draft[i].trim() })); setOpen(null); s.toast('Resposta publicada'); }} />
                </View>
              ) : (
                <Btn small kind="ghost" full={false} icon="reply" title="Responder" style={{ alignSelf: 'flex-start', marginTop: 6, paddingHorizontal: 0 }} onPress={() => setOpen(i)} />
              )}
            </Card>
          );
        })}
      </View>
    </Screen>
  );
}

// ——— Planos ———

export function PlansScreen() {
  const t = useTheme();
  const s = useStore();
  return (
    <Screen title="Planos">
      <T kind="title" style={{ marginTop: 6, marginLeft: 4 }}>Escolha como crescer</T>
      <T kind="sub" style={{ marginLeft: 4, marginTop: 4 }}>Mude ou cancele quando quiser. Pagamentos no local nunca têm taxa.</T>
      <View style={{ gap: 12, marginTop: 16 }}>
        {PLANS.map((p) => {
          const current = (p.key === 'pro') === s.partnerPro;
          return (
            <Card key={p.key} style={{ borderWidth: p.highlight ? 2 : 0, borderColor: t.tone }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <T kind="title" style={{ flex: 1 }}>{p.name}</T>
                {current ? <StatePill state="ok" text="Seu plano" icon="check" /> : p.highlight ? <Pill text="Mais escolhido" bg={alpha(t.tone, 0.18)} color={t.toneText} /> : null}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginTop: 6 }}>
                <Text style={{ fontFamily: t.fonts.titleStrong, fontSize: 30, color: t.c.text }}>{p.price}</Text>
                <T kind="sub" style={{ marginBottom: 6 }}>{p.per}</T>
              </View>
              <T kind="sub">{p.fee}</T>
              <View style={{ gap: 8, marginTop: 12 }}>
                {p.items.map((it) => (
                  <View key={it} style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                    <Icon name="check" size={16} color={t.toneText} />
                    <T kind="body" style={{ flex: 1, fontSize: 15 }}>{it}</T>
                  </View>
                ))}
              </View>
              {!current ? (
                <Btn style={{ marginTop: 14 }} kind={p.highlight ? 'primary' : 'secondary'} title={p.key === 'pro' ? 'Assinar o Pro · 14 dias grátis' : 'Voltar para o grátis'}
                  onPress={() => { s.setPartnerPro(p.key === 'pro'); s.toast(p.key === 'pro' ? 'Bem-vindo ao Parceiro Pro!' : 'Plano grátis a partir do próximo mês'); }} />
              ) : null}
            </Card>
          );
        })}
      </View>
    </Screen>
  );
}

// ——— Destaque na busca (impulsionar) ———

export function BoostScreen() {
  const t = useTheme();
  const s = useStore();
  const nav = useNav();
  const [budget, setBudget] = useState(15);
  const [days, setDays] = useState(7);
  const [where, setWhere] = useState('banho');
  const reach = Math.round(budget * days * 38);
  return (
    <Screen title="Destaque na busca" footer={(
      <View style={{ gap: 6 }}>
        <Btn title={`Impulsionar por ${brl(budget * days).replace(',00', '')}`} icon="rocket" onPress={() => { s.toast('Destaque no ar em até 1 hora'); nav.back(); }} />
        <T kind="small" center>Cobrado só pelos dias em que o destaque ficar no ar.</T>
      </View>
    )}>
      <Card style={{ marginTop: 6 }}>
        <T kind="label">Prévia na busca</T>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10 }}>
          <PartnerMark partner={PARTNER_SELF} size={48} />
          <View style={{ flex: 1 }}>
            <T kind="h" numberOfLines={1}>{ME_P.name}</T>
            <T kind="sub">{ME_P.rating} ★ · {ME_P.distance} · {ME_P.price}</T>
          </View>
          <Pill text="Patrocinado" />
        </View>
      </Card>
      <Note style={{ marginTop: 10 }} icon="info">Todo destaque aparece com a etiqueta Patrocinado. A ordem dos resultados comuns não muda.</Note>
      <Section title="Onde aparecer">
        <ChipRow>
          {[['banho', 'Banho e tosa'], ['inicio', 'Início dos tutores'], ['mapa', 'Mapa']].map(([k, l]) => <Chip key={k} title={l} active={where === k} onPress={() => setWhere(k)} />)}
        </ChipRow>
      </Section>
      <Section title="Quanto por dia">
        <ChipRow>
          {[10, 15, 25, 40].map((b) => <Chip key={b} title={`R$ ${b}`} active={budget === b} onPress={() => setBudget(b)} />)}
        </ChipRow>
      </Section>
      <Section title="Por quantos dias">
        <ChipRow>
          {[3, 7, 14, 30].map((d) => <Chip key={d} title={`${d} dias`} active={days === d} onPress={() => setDays(d)} />)}
        </ChipRow>
      </Section>
      <Card style={{ marginTop: 18 }}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <T kind="small">Tutores alcançados</T>
            <T kind="title">{fmt(reach)}</T>
          </View>
          <View style={{ flex: 1 }}>
            <T kind="small">Agendamentos estimados</T>
            <T kind="title">{Math.max(1, Math.round(reach / 160))} a {Math.max(2, Math.round(reach / 95))}</T>
          </View>
        </View>
        <T kind="small" style={{ marginTop: 8 }}>Num raio de 3 km de {ME_P.area}. Estimativa com base em parceiros parecidos.</T>
      </Card>
    </Screen>
  );
}

// ——— Cupons do parceiro ———

export function PartnerCouponsScreen() {
  const t = useTheme();
  const s = useStore();
  const [list, setList] = useState([
    { code: 'BICHOBOM10', text: '10% no primeiro banho', used: 41, on: true },
    { code: 'VOLTA15', text: 'R$ 15 para quem não vem há 60 dias', used: 12, on: true },
  ]);
  const [kind, setKind] = useState('novos');
  const [value, setValue] = useState('10%');
  return (
    <Screen title="Cupons e campanhas" footer={<Btn title="Criar cupom" icon="ticket" onPress={() => { setList((l) => [{ code: `BB${value.replace(/\D/g, '')}${l.length}`, text: `${value} para ${kind === 'novos' ? 'clientes novos' : kind === 'sumidos' ? 'quem sumiu' : 'todos'}`, used: 0, on: true }, ...l]); s.toast('Cupom criado'); }} />}>
      <View style={{ gap: 10, marginTop: 6 }}>
        {list.map((c, i) => (
          <Card key={c.code}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <IconTile icon="ticket" />
              <View style={{ flex: 1 }}>
                <T kind="h">{c.code}</T>
                <T kind="sub">{c.text} · usado {c.used} vezes</T>
              </View>
              <Toggle value={c.on} label={`Ativar ${c.code}`} onChange={(v) => setList((l) => l.map((x, j) => (j === i ? { ...x, on: v } : x)))} />
            </View>
          </Card>
        ))}
      </View>
      <Section title="Novo cupom">
        <T kind="label" style={{ marginLeft: 4, marginBottom: 8 }}>Para quem</T>
        <ChipRow>
          {[['novos', 'Clientes novos'], ['sumidos', 'Quem sumiu'], ['todos', 'Todos']].map(([k, l]) => <Chip key={k} title={l} active={kind === k} onPress={() => setKind(k)} />)}
        </ChipRow>
        <T kind="label" style={{ marginLeft: 4, marginBottom: 8, marginTop: 16 }}>Desconto</T>
        <ChipRow>
          {['10%', '15%', 'R$ 10', 'R$ 20'].map((v) => <Chip key={v} title={v} active={value === v} onPress={() => setValue(v)} />)}
        </ChipRow>
      </Section>
    </Screen>
  );
}

// ——— Cadastro e verificação ———

export function VerifyScreen() {
  const s = useStore();
  const steps = [
    ['doc', 'CNPJ', '12.345.678/0001-90 · conferido', 'ok'],
    ['pin', 'Endereço', ME_P.address, 'ok'],
    ['camera', 'Fotos do espaço', '8 fotos · aprovadas', 'ok'],
    ['wallet', 'Conta para repasse', 'Itaú ••• 4821', 'ok'],
    ['shieldCheck', 'Responsável técnico', 'Opcional para banho e tosa', 'info'],
  ];
  return (
    <Screen title="Cadastro e verificação">
      <Card style={{ marginTop: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <IconTile icon="verified" size={44} />
          <View style={{ flex: 1 }}>
            <T kind="h">Parceiro verificado</T>
            <T kind="sub">O selo aparece no seu perfil e na busca desde março de 2024.</T>
          </View>
        </View>
      </Card>
      <Group style={{ marginTop: 14 }}>
        {steps.map(([icon, title, sub, st]) => (
          <Row key={title} icon={icon} title={title} sub={sub} onPress={() => s.toast(`${title}: tudo certo`)}
            right={<StatePill state={st} text={st === 'ok' ? 'Ok' : 'Opcional'} />} />
        ))}
      </Group>
      <Note style={{ marginTop: 14 }} icon="lock">Seus documentos só são vistos pela equipe de verificação do netpet.</Note>
    </Screen>
  );
}

// ——— Equipe ———

export function TeamScreen() {
  const s = useStore();
  const team = TEAM[PARTNER_SELF].filter((m) => m.key !== 'qualquer');
  return (
    <Screen title="Equipe" footer={<Btn title="Convidar profissional" icon="plus" onPress={() => s.toast('Convite enviado por WhatsApp')} />}>
      <Group style={{ marginTop: 6 }}>
        {team.map((m) => (
          <Row key={m.key} left={<InitialAvatar name={m.name} size={44} color={m.color} />} title={m.name} sub={m.role} onPress={() => s.toast(`Agenda de ${m.name} aberta`)} />
        ))}
      </Group>
      <Note style={{ marginTop: 14 }}>Cada profissional tem a própria agenda e recebe só os atendimentos dele.</Note>
    </Screen>
  );
}

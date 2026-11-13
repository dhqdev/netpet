import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Path, Rect, Circle, Line as SvgLine, Text as SvgText } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from '../icons';
import { useTheme, alpha } from '../theme';
import { useStore } from '../store';
import { useNav } from '../nav';
import { ND } from '../ui';
import {
  Screen, T, Btn, Card, Section, Group, Row, Chip, ChipRow, Segmented, Field, Tap, Photo, PetAvatar, PartnerMark, Pill, StatePill,
  Empty, Note, useInsets, NavHeader, IconTile, Toggle, RoundButton, Progress, InitialAvatar, oa,
} from '../kit';
import {
  PETS, MY_PETS, PARTNERS, MY_GRID, VACCINES, WEIGHTS, MEDS, ALLERGIES, VISITS, DOCS, GROWTH, STREAK, CHALLENGES, BADGES, WRAPPED, fmt,
} from '../data';

const petColor = (t, p) => (t.dark ? p.colorDark : p.color);

// ——— Perfil do pet (aba Pet e perfis de outros pets) ———

export function PetProfile({ pet: petParam, tabRoot }) {
  const t = useTheme();
  const s = useStore();
  const nav = useNav();
  const { width } = useWindowDimensions();
  const key = petParam || s.petKey;
  const p = PETS[key];
  const mine = !!p.mine;
  const col = petColor(t, p);
  const grid = MY_GRID[key] || [p.photo, 'dupla', 'filhotes', p.photo];
  const cell = (Math.min(width, 520) - 32 - 8) / 3;
  const myPosts = s.posts.filter((x) => x.pet === key && x.photos);
  const following = !!s.following[key];

  const content = (
    <>
      <View style={{ height: 150, marginHorizontal: tabRoot ? 0 : 0 }}>
        <Photo name={grid[1] || p.photo} style={{ width: '100%', height: 150 }} />
        <LinearGradient colors={[alpha(col, 0.25), alpha(t.c.bg, 1)]} style={StyleSheet.absoluteFill} />
      </View>
      <View style={{ paddingHorizontal: 16, marginTop: -64 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
          <Tap onPress={() => (mine ? s.openSheet('pets') : null)} label={mine ? 'Trocar de pet' : p.name}>
            <PetAvatar pet={key} size={104} ring={4} gap={3} status={!!p.status} />
          </Tap>
          <View style={{ flex: 1 }} />
          {mine ? (
            <View style={{ flexDirection: 'row', gap: 8, paddingBottom: 6 }}>
              <RoundButton icon="share" label="Cartão para compartilhar" onPress={() => nav.push('ShareCard', { pet: key })} />
              <RoundButton icon="settings" label="Ajustes" onPress={() => nav.push('Settings')} />
            </View>
          ) : null}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 }}>
          <T kind="display">{p.name}</T>
          {p.status ? <Pill text={p.status} color={t.dark ? '#7FD1A4' : '#2F7A55'} bg={alpha('#2F7A55', 0.14)} icon="dot" /> : null}
        </View>
        <T kind="sub" style={{ fontSize: 15 }}>{p.breed} · {p.age}{p.area ? ` · ${p.area}` : ' · Perdizes'}</T>
        {p.bio ? <T kind="body" style={{ marginTop: 8 }}>{p.bio}</T> : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 6 }}>
          <Icon name="users" size={16} color={t.c.text2} />
          <T kind="sub">{mine ? 'Tutores: David e Ana' : `Tutor: ${p.tutor}`}</T>
        </View>
        <View style={{ flexDirection: 'row', marginTop: 16, gap: 10 }}>
          {[[fmt(p.posts || myPosts.length + 12), 'posts'], [fmt(p.followers || 640), 'seguidores'], [fmt(p.following || 180), 'seguindo']].map(([n, l]) => (
            <View key={l} style={{ flex: 1, paddingVertical: 10, borderRadius: 16, backgroundColor: t.c.surface, alignItems: 'center' }}>
              <Text style={{ fontFamily: t.fonts.titleStrong, fontSize: 20, color: t.c.text }}>{n}</Text>
              <T kind="small">{l}</T>
            </View>
          ))}
        </View>
        {mine ? (
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
            <Btn title="Editar perfil" kind="secondary" small full={false} style={{ flex: 1 }} onPress={() => nav.push('EditPet', { pet: key })} />
            <Btn title="Família" kind="secondary" small full={false} icon="users" style={{ flex: 1 }} onPress={() => nav.push('Family', { pet: key })} />
          </View>
        ) : (
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
            <Btn title={following ? 'Seguindo' : 'Seguir'} kind={following ? 'secondary' : 'primary'} small full={false} style={{ flex: 1 }} onPress={() => s.toggleFollow(key)} />
            <Btn title="Mensagem" kind="secondary" small full={false} style={{ flex: 1 }} onPress={() => nav.push('Dm', { id: { mel: 'camila', thor: 'rafael', nina: 'julia' }[key] || 'camila' })} />
            <Tap onPress={() => s.openSheet('more', { who: p.name })} label="Mais opções: denunciar, bloquear" style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: t.c.surface2, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="more" size={20} color={t.c.text} />
            </Tap>
          </View>
        )}
      </View>

      {mine ? (
        <View style={{ paddingHorizontal: 16 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 20 }}>
            <Shortcut icon="shieldCheck" title="Carteirinha" sub={key === 'pacoca' ? '1 vacina atrasada' : 'Vacinas em dia'} warn={key === 'pacoca'} onPress={() => nav.push('Carteirinha', { pet: key })} />
            <Shortcut icon="calendar" title="Agenda de cuidados" sub="Rotina e lembretes" onPress={() => nav.push('CareSchedule', { pet: key })} />
            <Shortcut icon="flame" title="Sequência" sub={`${STREAK.days} dias de passeio`} onPress={() => nav.push('Streak', { pet: key })} />
            <Shortcut icon="image" title="Crescimento" sub="De filhote a adulto" onPress={() => nav.push('Growth', { pet: key })} />
            <Shortcut icon="qr" title="Plaquinha" sub="Código da coleira" onPress={() => nav.push('Tag', { pet: key })} />
            <Shortcut icon="sparkle" title="Retrospectiva" sub="O ano de 2026" onPress={() => nav.push('Wrapped', { pet: key })} />
          </View>
        </View>
      ) : null}

      <View style={{ paddingHorizontal: 16 }}>
        <Section title="Selos e conquistas">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
            {BADGES.map((b) => (
              <View key={b.label} style={{ width: 96, alignItems: 'center', paddingVertical: 12, borderRadius: 18, backgroundColor: t.c.surface }}>
                <View style={{ width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: col, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={b.icon} size={24} color={col} />
                </View>
                <T kind="small" center style={{ marginTop: 6, color: t.c.text }}>{b.label}</T>
              </View>
            ))}
          </ScrollView>
        </Section>
        <Section title="Posts">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
            {[...myPosts.map((x) => ({ photo: x.photos[0], id: x.id })), ...grid.map((g) => ({ photo: g, id: null }))].slice(0, 12).map((g, i) => (
              <Tap key={i} onPress={() => nav.push('Post', { id: g.id || (key === 'luna' ? 'p4' : key === 'amora' ? 'p6' : 'p1') })} hitSlop={0} scale={0.97} label="Abrir post">
                <Photo name={g.photo} style={{ width: cell, height: cell, borderRadius: 10 }} />
              </Tap>
            ))}
          </View>
        </Section>
      </View>
    </>
  );

  if (tabRoot) {
    return <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 130 }}>{content}</ScrollView>;
  }
  return (
    <View style={{ flex: 1, backgroundColor: t.c.bg }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>{content}</ScrollView>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0 }}><NavHeader transparent light /></View>
    </View>
  );
}

function Shortcut({ icon, title, sub, onPress, warn }) {
  const t = useTheme();
  return (
    <Tap onPress={onPress} label={title} outerStyle={{ width: '48.5%' }} scale={0.97}
      style={{ backgroundColor: t.c.surface, borderRadius: 18, padding: 14, gap: 10, minHeight: 104 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <IconTile icon={icon} size={38} />
        {warn ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#C2453A' }} /> : null}
      </View>
      <View>
        <T kind="body" style={{ fontWeight: '600' }}>{title}</T>
        <T kind="small" style={{ color: warn ? (t.dark ? '#F08A80' : '#A8332A') : t.c.text2 }}>{sub}</T>
      </View>
    </Tap>
  );
}

// ——— Editar perfil ———

export function EditPetScreen({ pet = 'pacoca' }) {
  const s = useStore();
  const nav = useNav();
  const p = PETS[pet];
  const [name, setName] = useState(p.name);
  const [bio, setBio] = useState(p.bio || '');
  const [status, setStatus] = useState(p.status);
  return (
    <Screen title="Editar perfil" keyboard footer={<Btn title="Salvar" onPress={() => { s.toast('Perfil atualizado'); nav.back(); }} />}>
      <View style={{ alignItems: 'center', marginVertical: 12 }}>
        <PetAvatar pet={pet} size={96} ring={3} />
        <Btn small full={false} kind="ghost" title="Trocar foto" icon="camera" onPress={() => s.toast('Foto atualizada')} />
      </View>
      <Field label="Nome" value={name} onChangeText={setName} />
      <Field label="Bio" value={bio} onChangeText={setBio} multiline style={{ marginTop: 12 }} />
      <Section title="Status">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {['em casa', 'passeando', 'dormindo', 'brincando', 'no banho'].map((x) => <Chip key={x} title={x} active={status === x} onPress={() => setStatus(x)} />)}
        </View>
        <Note style={{ marginTop: 10 }}>Durante um atendimento, o status muda sozinho: "no banho", "na consulta", "pronto".</Note>
      </Section>
      <Section title="Dados">
        <Group>
          <Row icon="paw" title={p.breed} sub="Raça" />
          <Row icon="cake" title={p.born} sub="Nascimento" />
          <Row icon="scale" title={`${p.size} · pelagem ${p.coat.toLowerCase()}`} sub="Porte" />
        </Group>
      </Section>
    </Screen>
  );
}

// ——— Família ———

export function FamilyScreen({ pet = 'pacoca' }) {
  const t = useTheme();
  const s = useStore();
  const nav = useNav();
  return (
    <Screen big="Família" sub="Seus pets e quem cuida junto">
      <Section title="Seus pets">
        <Group>
          {MY_PETS.map((k) => (
            <Row key={k} left={<PetAvatar pet={k} size={40} />} title={PETS[k].name} sub={`${PETS[k].breed} · ${PETS[k].age}`}
              right={s.petKey === k ? <Pill text="Ativo" /> : <Btn small full={false} kind="secondary" title="Usar" onPress={() => { s.setPetKey(k); s.toast(`Agora você está como ${PETS[k].name}`); }} />} />
          ))}
          <Row icon="plus" tone title="Adicionar pet" onPress={() => s.toast('Fluxo de criar pet: uma pergunta por tela')} />
        </Group>
      </Section>
      <Section title={`Tutores ${PETS[pet].article} ${PETS[pet].name}`}>
        <Group>
          <Row left={<InitialAvatar name="David" size={40} color="#8A6BA3" />} title="David (você)" sub="Tutor principal" />
          <Row left={<InitialAvatar name="Ana" size={40} color="#4F7F6E" />} title="Ana" sub="Pode agendar e ver a carteirinha" />
          <Row icon="mail" tone title="Convidar outro tutor" sub="Mande um link por mensagem" onPress={() => s.toast('Convite copiado')} />
        </Group>
      </Section>
      <Note style={{ marginTop: 16 }}>Tutores da família recebem os mesmos lembretes e podem acompanhar os atendimentos ao vivo.</Note>
    </Screen>
  );
}

// ——— Carteirinha ———

export function CarteirinhaScreen({ pet = 'pacoca' }) {
  const t = useTheme();
  const s = useStore();
  const nav = useNav();
  const p = PETS[pet];
  const col = petColor(t, p);
  const [tab, setTab] = useState('vacinas');
  const records = s.records.filter((r) => r.pet === pet);
  return (
    <Screen title="Carteirinha" right={<Tap onPress={() => (s.plus ? s.toast('PDF pronto para enviar ao veterinário') : nav.push('Plus'))} label="Exportar em PDF" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><Icon name="download" size={22} color={t.c.text} /></Tap>}>
      <View style={{ borderRadius: t.radius.card, overflow: 'hidden', marginTop: 6 }}>
        <LinearGradient colors={[col, alpha(col, 0.75)]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 18 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <PetAvatar pet={pet} size={64} ringColor="#FFFFFF" />
            <View style={{ flex: 1 }}>
              <Text style={{ color: p.onColor, fontFamily: t.fonts.titleStrong, fontSize: 26 }}>{p.name}</Text>
              <Text style={{ color: p.onColor, fontSize: 14, opacity: 0.85 }}>{p.breed} · {p.species}</Text>
            </View>
            <Icon name="shieldCheck" size={30} color={p.onColor} />
          </View>
          <View style={{ flexDirection: 'row', marginTop: 16, gap: 10 }}>
            {[['Nascimento', p.born], ['Peso', p.weight], ['Porte', p.size]].map(([l, v]) => (
              <View key={l} style={{ flex: l === 'Nascimento' ? 1.3 : 1, backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 12, padding: 10 }}>
                <Text style={{ color: p.onColor, fontSize: 11.5, opacity: 0.85 }}>{l}</Text>
                <Text numberOfLines={1} adjustsFontSizeToFit style={{ color: p.onColor, fontSize: 15, fontWeight: '600', marginTop: 2 }}>{v}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>
      </View>
      <Note icon="stethoscope" style={{ marginTop: 12 }}>A carteirinha organiza o histórico, mas não substitui a consulta. Em caso de dúvida, fale com o veterinário.</Note>
      <View style={{ marginTop: 14 }}>
        <Segmented value={tab} onChange={setTab} options={[{ key: 'vacinas', label: 'Vacinas' }, { key: 'peso', label: 'Peso' }, { key: 'remedios', label: 'Remédios' }, { key: 'historico', label: 'Histórico' }]} />
      </View>
      {tab === 'vacinas' ? (
        <Group style={{ marginTop: 14 }}>
          {VACCINES[pet].map((v) => (
            <Row key={v.name} icon="syringe" title={v.name} sub={`Última: ${v.last} · próxima: ${v.next}${v.note ? ` · ${v.note}` : ''}`}
              right={<StatePill state={v.state} text={{ ok: 'Em dia', soon: 'Em breve', late: 'Atrasada' }[v.state]} />}
              onPress={v.state !== 'ok' ? () => nav.push('Booking', { partner: 'quatroPatas', service: 'vacina' }) : undefined} chevron={false} />
          ))}
          <Row icon="plus" tone title="Registrar vacina" onPress={() => nav.push('CareLog', { kind: 'vacina' })} />
        </Group>
      ) : tab === 'peso' ? (
        <WeightCard pet={pet} />
      ) : tab === 'remedios' ? (
        <>
          <Group style={{ marginTop: 14 }}>
            {MEDS[pet].map((m) => <Row key={m.name} icon="pill" title={m.name} sub={`${m.dose} · ${m.every}`} value={m.next} />)}
            <Row icon="plus" tone title="Adicionar remédio" onPress={() => nav.push('CareLog', { kind: 'remedio' })} />
          </Group>
          <Section title="Alergias e cuidados">
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{ALLERGIES[pet].map((a) => <Pill key={a} text={a} icon="alert" />)}</View>
          </Section>
        </>
      ) : (
        <>
          {records.length ? (
            <Section title="Registros recentes">
              <Group>{records.map((r) => <Row key={r.id} icon={{ peso: 'scale', vacina: 'syringe', remedio: 'pill', passeio: 'walk' }[r.kind]} title={r.label} sub={r.note || r.when} />)}</Group>
            </Section>
          ) : null}
          <Section title="Consultas e atendimentos">
            <Group>{VISITS[pet].map((v, i) => <Row key={i} icon="stethoscope" title={v.what} sub={`${v.date} · ${v.where}`} />)}</Group>
          </Section>
          <Section title="Documentos">
            <Group>
              {DOCS.map((d) => <Row key={d.name} icon="doc" title={d.name} sub={d.kind} onPress={() => s.toast('Abrindo documento')} />)}
              <Row icon="upload" tone title="Enviar exame ou receita" onPress={() => s.toast('Documento enviado')} />
            </Group>
          </Section>
        </>
      )}
      <Section title="Quem vê a carteirinha">
        <Group>
          <Row icon="lock" title={s.privacy.carteirinha} sub="Os parceiros veem um resumo só durante o atendimento" onPress={() => nav.push('Settings', { section: 'privacidade' })} />
        </Group>
      </Section>
      <Btn title={s.plus ? 'Exportar em PDF' : 'Exportar em PDF com netpet+'} icon="download" kind="outline" style={{ marginTop: 18 }} onPress={() => (s.plus ? s.toast('PDF pronto para enviar ao veterinário') : nav.push('Plus'))} />
      <T kind="small" center style={{ marginTop: 8 }}>A carteirinha básica é sempre grátis.</T>
    </Screen>
  );
}

function WeightCard({ pet }) {
  const t = useTheme();
  const nav = useNav();
  const { width } = useWindowDimensions();
  const w = WEIGHTS[pet];
  const p = PETS[pet];
  const col = petColor(t, p);
  const W = Math.min(width, 520) - 32 - 32;
  const H = 170;
  const vals = w.points.map((x) => x[1]);
  const min = Math.min(...vals, w.goal[0]) - 0.3;
  const max = Math.max(...vals, w.goal[1]) + 0.3;
  const X = (i) => 24 + (i * (W - 36)) / (w.points.length - 1);
  const Y = (v) => 10 + ((max - v) / (max - min)) * (H - 36);
  const d = w.points.map(([, v], i) => `${i ? 'L' : 'M'}${X(i)} ${Y(v)}`).join(' ');
  const area = `${d} L${X(w.points.length - 1)} ${H - 26} L${X(0)} ${H - 26} Z`;
  const last = vals[vals.length - 1];
  const inGoal = last >= w.goal[0] && last <= w.goal[1];
  return (
    <Card style={{ marginTop: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <View>
          <T kind="sub">Peso atual</T>
          <Text style={{ fontFamily: t.fonts.titleStrong, fontSize: 34, color: t.c.text }}>{String(last).replace('.', ',')} {w.unit}</Text>
        </View>
        <StatePill state={inGoal ? 'ok' : 'soon'} text={inGoal ? 'Dentro da meta' : 'Fora da meta'} />
      </View>
      <Svg width={W} height={H} style={{ marginTop: 10 }}>
        <Rect x="24" y={Y(w.goal[1])} width={W - 36} height={Y(w.goal[0]) - Y(w.goal[1])} fill={alpha(col, 0.12)} rx="6" />
        {[min + 0.3, (min + max) / 2, max - 0.3].map((v, i) => (
          <React.Fragment key={i}>
            <SvgLine x1="24" x2={W - 12} y1={Y(v)} y2={Y(v)} stroke={t.c.line} strokeWidth="1" />
            <SvgText x="0" y={Y(v) + 4} fontSize="10" fill={t.c.text2}>{v.toFixed(1).replace('.', ',')}</SvgText>
          </React.Fragment>
        ))}
        <Path d={area} fill={alpha(col, 0.14)} />
        <Path d={d} stroke={col} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {w.points.map(([m, v], i) => (
          <React.Fragment key={m}>
            <Circle cx={X(i)} cy={Y(v)} r={i === w.points.length - 1 ? 5 : 3} fill={i === w.points.length - 1 ? col : t.c.surface} stroke={col} strokeWidth="2" />
            <SvgText x={X(i)} y={H - 8} fontSize="11" fill={t.c.text2} textAnchor="middle">{m}</SvgText>
          </React.Fragment>
        ))}
      </Svg>
      <T kind="small">Faixa clara: meta de {String(w.goal[0]).replace('.', ',')} a {String(w.goal[1]).replace('.', ',')} {w.unit}, definida com o veterinário.</T>
      <Btn small title="Registrar peso" kind="secondary" icon="scale" style={{ marginTop: 12 }} onPress={() => nav.push('CareLog', { kind: 'peso' })} />
    </Card>
  );
}

// ——— Agenda de cuidados ———

export function CareScheduleScreen({ pet = 'pacoca' }) {
  const t = useTheme();
  const s = useStore();
  const nav = useNav();
  const list = s.routine[pet] || [];
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [every, setEvery] = useState('Todo mês');
  return (
    <Screen big="Agenda de cuidados" sub={`A rotina ${PETS[pet].article} ${PETS[pet].name}, com lembretes`} keyboard>
      <ChipRow style={{ paddingTop: 12 }}>
        {MY_PETS.map((k) => <Chip key={k} title={PETS[k].name} active={pet === k} onPress={() => nav.replace('CareSchedule', { pet: k })} />)}
      </ChipRow>
      <Group style={{ marginTop: 14 }}>
        {list.map((x, i) => (
          <Row key={x.title + i} icon={x.icon} tone={x.on} title={x.title} sub={`${x.every} · próximo: ${x.next}`}
            right={<Toggle value={x.on} onChange={() => s.toggleRoutine(pet, i)} label={`Lembrete de ${x.title}`} />} />
        ))}
      </Group>
      {adding ? (
        <Card style={{ marginTop: 14, gap: 10 }}>
          <Field value={title} onChangeText={setTitle} placeholder="Ex.: Escovar os dentes" autoFocus />
          <ChipRow>{['Todo dia', 'Toda semana', 'A cada 15 dias', 'Todo mês', 'Todo ano'].map((e) => <Chip key={e} title={e} active={every === e} onPress={() => setEvery(e)} />)}</ChipRow>
          <Btn title="Adicionar" disabled={!title.trim()} onPress={() => { s.addRoutine(pet, { icon: 'bell', title: title.trim(), every, next: 'amanhã' }); setTitle(''); setAdding(false); s.toast('Lembrete criado'); }} />
        </Card>
      ) : (
        <Btn title="Novo cuidado recorrente" kind="secondary" icon="plus" style={{ marginTop: 14 }} onPress={() => setAdding(true)} />
      )}
      <Note icon="bell" style={{ marginTop: 14 }}>Os lembretes chegam para todos os tutores da família. Banhos recorrentes já ficam agendados com o parceiro.</Note>
    </Screen>
  );
}

// ——— Crescimento ———

export function GrowthScreen({ pet = 'pacoca' }) {
  const t = useTheme();
  const s = useStore();
  const p = PETS[pet];
  const col = petColor(t, p);
  return (
    <Screen big="De filhote a adulto" sub={`A linha do tempo ${p.article} ${p.name}`}>
      <View style={{ marginTop: 16 }}>
        {GROWTH[pet].map((g, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: 14 }}>
            <View style={{ alignItems: 'center', width: 16 }}>
              <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: col, marginTop: 4 }} />
              {i < GROWTH[pet].length - 1 ? <View style={{ width: 2, flex: 1, backgroundColor: alpha(col, 0.35) }} /> : null}
            </View>
            <View style={{ flex: 1, paddingBottom: 22 }}>
              <T kind="label" color={petColor(t, p)}>{g.date}</T>
              <T kind="h" style={{ marginTop: 2 }}>{g.label}</T>
              <T kind="sub">{g.note}</T>
              <Photo name={g.photo} style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: 18, marginTop: 10 }} />
            </View>
          </View>
        ))}
      </View>
      <Btn title="Adicionar momento" kind="secondary" icon="plus" onPress={() => s.toast('Momento adicionado à linha do tempo')} />
    </Screen>
  );
}

// ——— Sequência de passeios e desafios do mês ———

export function StreakScreen({ pet = 'pacoca' }) {
  const t = useTheme();
  const nav = useNav();
  const p = PETS[pet];
  const col = petColor(t, p);
  return (
    <Screen big="Sequência" sub="Passeios e desafios de novembro" footer={<Btn title="Registrar passeio de hoje" icon="walk" onPress={() => nav.push('CareLog', { kind: 'passeio' })} />}>
      <Card style={{ marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: alpha(col, 0.16), alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="flame" size={44} color={col} filled />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: t.fonts.titleStrong, fontSize: 40, color: t.c.text, lineHeight: 44 }}>{STREAK.days} dias</Text>
          <T kind="sub">seguidos de passeio · recorde: {STREAK.best}</T>
        </View>
      </Card>
      <Section title="Novembro">
        <Card>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {STREAK.month.map((v, i) => {
              const future = i > 11;
              return (
                <View key={i} style={{ width: '12.4%', aspectRatio: 1, borderRadius: 10, backgroundColor: future ? 'transparent' : v ? col : t.c.surface2, borderWidth: future ? 1 : 0, borderColor: t.c.line, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 12, color: !future && v ? p.onColor : t.c.text2, fontWeight: i === 11 ? '700' : '400' }}>{i + 1}</Text>
                </View>
              );
            })}
          </View>
        </Card>
      </Section>
      <Section title="Desafios do mês">
        <View style={{ gap: 10 }}>
          {CHALLENGES.map((c) => (
            <Card key={c.key}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <IconTile icon={c.icon} />
                <View style={{ flex: 1 }}>
                  <T kind="body" style={{ fontWeight: '600' }}>{c.title}</T>
                  <T kind="sub">Prêmio: {c.prize}</T>
                  {c.sponsor ? <T kind="small" style={{ marginTop: 2 }}>{c.sponsor}</T> : null}
                </View>
                {c.done ? <StatePill state="ok" text="Feito" icon="check" /> : <T kind="sub">{c.progress}/{c.total}</T>}
              </View>
              <Progress value={c.progress / c.total} style={{ marginTop: 12 }} color={c.done ? (t.dark ? '#7FD1A4' : '#2F7A55') : undefined} />
            </Card>
          ))}
        </View>
      </Section>
    </Screen>
  );
}

// ——— Retrospectiva do ano ———

export function WrappedScreen({ pet = 'pacoca' }) {
  const t = useTheme();
  const nav = useNav();
  const ins = useInsets();
  const p = PETS[pet];
  const col = petColor(t, p);
  const slides = WRAPPED[pet] || WRAPPED.pacoca;
  const [i, setI] = useState(0);
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    v.setValue(0);
    Animated.timing(v, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: ND }).start();
  }, [i]);
  const last = i === slides.length;
  return (
    <View style={{ flex: 1, backgroundColor: col, paddingTop: ins.top }}>
      <View style={{ flexDirection: 'row', gap: 4, paddingHorizontal: 12, paddingTop: 8 }}>
        {[...slides, null].map((_, j) => <View key={j} style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: j <= i ? p.onColor : alpha(p.onColor, 0.25) }} />)}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12 }}>
        <Text style={{ color: p.onColor, fontWeight: '600', fontSize: 14, marginLeft: 4 }}>{p.name} em 2026</Text>
        <Tap onPress={nav.back} label="Fechar" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><Icon name="close" size={24} color={p.onColor} /></Tap>
      </View>
      <Tap onPress={() => (last ? nav.back() : setI(i + 1))} hitSlop={0} scale={1} outerStyle={{ flex: 1 }} style={{ flex: 1, padding: 28, justifyContent: 'center' }} label="Próximo">
        <Animated.View style={{ opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }}>
          {last ? (
            <View style={{ alignItems: 'center' }}>
              <PetAvatar pet={pet} size={140} ring={4} ringColor={p.onColor} />
              <Text style={{ color: p.onColor, fontFamily: t.fonts.titleStrong, fontSize: 34, marginTop: 20, textAlign: 'center' }}>Que ano, {p.name}!</Text>
              <Text style={{ color: p.onColor, fontSize: 16, marginTop: 8, textAlign: 'center', opacity: 0.85 }}>Compartilhe a retrospectiva com quem acompanhou tudo.</Text>
            </View>
          ) : (
            <>
              <Text style={{ color: p.onColor, fontFamily: t.fonts.titleStrong, fontSize: slides[i].big.length > 8 ? 40 : 84, lineHeight: slides[i].big.length > 8 ? 46 : 90 }}>{slides[i].big}</Text>
              <Text style={{ color: p.onColor, fontSize: 24, fontWeight: '600', marginTop: 6 }}>{slides[i].label}</Text>
              <Text style={{ color: p.onColor, fontSize: 16, marginTop: 12, opacity: 0.85, lineHeight: 22 }}>{slides[i].sub}</Text>
            </>
          )}
        </Animated.View>
      </Tap>
      <View style={{ padding: 20, paddingBottom: ins.bottom + 20 }}>
        {last ? (
          <Tap onPress={() => nav.replace('ShareCard', { pet })} label="Compartilhar" style={{ height: 52, borderRadius: 26, backgroundColor: p.onColor, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: col, fontSize: 16, fontWeight: '700' }}>Compartilhar</Text>
          </Tap>
        ) : <Text style={{ color: p.onColor, opacity: 0.75, textAlign: 'center' }}>Toque para continuar</Text>}
      </View>
    </View>
  );
}

// ——— Cartão para compartilhar ———

export function ShareCardScreen({ pet = 'pacoca' }) {
  const t = useTheme();
  const s = useStore();
  const p = PETS[pet];
  const col = petColor(t, p);
  return (
    <Screen title="Compartilhar" footer={(
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Btn title="Salvar imagem" kind="secondary" icon="download" full={false} style={{ flex: 1 }} onPress={() => s.toast('Imagem salva na galeria')} />
        <Btn title="Enviar" icon="share" full={false} style={{ flex: 1 }} onPress={() => s.openSheet('share', {})} />
      </View>
    )}>
      <View style={{ alignItems: 'center', marginTop: 10 }}>
        <View style={{ width: 300, borderRadius: 28, overflow: 'hidden', backgroundColor: col }}>
          <Photo name={p.photo} style={{ width: 300, height: 300 }} />
          <View style={{ padding: 20 }}>
            <Text style={{ color: p.onColor, fontFamily: t.fonts.titleStrong, fontSize: 32 }}>{p.name}</Text>
            <Text style={{ color: p.onColor, fontSize: 15, opacity: 0.85 }}>{p.breed} · {p.age}</Text>
            <View style={{ flexDirection: 'row', gap: 18, marginTop: 14 }}>
              {[['312', 'passeios'], [String(STREAK.days), 'dias seguidos'], ['9,4 mil', 'patinhas']].map(([n, l]) => (
                <View key={l}>
                  <Text style={{ color: p.onColor, fontSize: 20, fontWeight: '700' }}>{n}</Text>
                  <Text style={{ color: p.onColor, fontSize: 12, opacity: 0.85 }}>{l}</Text>
                </View>
              ))}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16 }}>
              <Icon name="paw" size={16} color={p.onColor} filled />
              <Text style={{ color: p.onColor, fontWeight: '700' }}>netpet</Text>
              <Text style={{ color: p.onColor, opacity: 0.8 }}>· @{p.name.toLowerCase().replace('ç', 'c')}</Text>
            </View>
          </View>
        </View>
      </View>
    </Screen>
  );
}

// ——— Plaquinha da coleira ———

export function TagScreen({ pet = 'pacoca' }) {
  const t = useTheme();
  const s = useStore();
  const nav = useNav();
  const p = PETS[pet];
  const col = petColor(t, p);
  const [lost, setLost] = useState(false);
  return (
    <Screen big="Plaquinha" sub="Quem achar aponta a câmera e fala com você">
      <View style={{ alignItems: 'center', marginTop: 16 }}>
        <View style={{ width: 220, height: 220, borderRadius: 110, backgroundColor: col, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 150, height: 150, borderRadius: 18, backgroundColor: '#FFFFFF', padding: 12 }}>
            <QrArt color="#26211C" />
          </View>
          <Text style={{ color: p.onColor, fontWeight: '700', marginTop: 8, letterSpacing: 1 }}>NETPET · {p.name.toUpperCase()}</Text>
        </View>
      </View>
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20 }}>
        <View style={{ flex: 1 }}>
          <T kind="body" style={{ fontWeight: '600' }}>Modo perdido</T>
          <T kind="sub">Mostra seu telefone na página da plaquinha e avisa quem está perto</T>
        </View>
        <Toggle value={lost} onChange={(v) => { setLost(v); if (v) s.toast('Modo perdido ativado'); }} label="Modo perdido" />
      </Card>
      <Group style={{ marginTop: 14 }}>
        <Row icon="eye" title="Ver a página pública" sub="O que aparece para quem achou" onPress={() => nav.push('TagPublic', { pet, lost })} />
        <Row icon="download" title="Baixar o código para imprimir" onPress={() => s.toast('Código salvo')} />
        <Row icon="gift" title="Plaquinha de metal" sub={s.plus ? 'Inclusa no netpet+ · enviamos em 5 dias' : 'R$ 39,90 com frete grátis'} onPress={() => (s.plus ? s.toast('Pedido feito!') : nav.push('Plus'))} />
      </Group>
      <Note icon="shieldCheck" style={{ marginTop: 14 }}>Seu endereço nunca aparece. Quem escaneia vê o nome, a foto e um botão para falar com você.</Note>
    </Screen>
  );
}

export function TagPublicScreen({ pet = 'pacoca', lost }) {
  const t = useTheme();
  const s = useStore();
  const p = PETS[pet];
  const col = petColor(t, p);
  return (
    <Screen title="netpet.app/plaquinha" footer={(
      <View style={{ gap: 8 }}>
        <Btn title={`Avisar o tutor que achei ${oa(p)} ${p.name}`} icon="pin" onPress={() => s.toast('O tutor recebeu sua mensagem e sua localização aproximada')} />
        {lost ? <Btn title="Ligar: (11) 9 9123-4567" kind="secondary" icon="phone" onPress={() => {}} /> : null}
      </View>
    )}>
      <View style={{ alignItems: 'center', marginTop: 20 }}>
        <PetAvatar pet={pet} size={140} ring={4} />
        <T kind="display" center style={{ marginTop: 14 }}>Oi, eu sou {oa(p) === 'o' ? 'o' : 'a'} {p.name}!</T>
        <T kind="body" center style={{ marginTop: 6, color: t.c.text2, maxWidth: 300 }}>
          {lost ? 'Estou perdido e minha família está me procurando. Pode avisar que você me achou?' : 'Se eu estiver sozinho por aí, avise minha família com o botão abaixo.'}
        </T>
        {lost ? <StatePill state="late" icon="alert" text="Pet perdido" /> : null}
      </View>
      <Group style={{ marginTop: 22 }}>
        <Row icon="paw" title={`${p.breed} · ${p.age}`} sub="Sobre mim" />
        <Row icon="alert" title={ALLERGIES[pet].join(', ')} sub="Cuidados" />
        <Row icon="pin" title="Perdizes, São Paulo" sub="Bairro" />
      </Group>
    </Screen>
  );
}

function QrArt({ color }) {
  // Padrão decorativo de QR para o protótipo (não é um código válido).
  const n = 21;
  const cells = [];
  let seed = 7;
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  for (let y = 0; y < n; y += 1) for (let x = 0; x < n; x += 1) {
    const finder = (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13);
    if (!finder && rnd() > 0.52) cells.push([x, y]);
  }
  const Finder = ({ x, y }) => (
    <>
      <Rect x={x} y={y} width="7" height="7" fill={color} />
      <Rect x={x + 1} y={y + 1} width="5" height="5" fill="#FFFFFF" />
      <Rect x={x + 2} y={y + 2} width="3" height="3" fill={color} />
    </>
  );
  return (
    <Svg width="100%" height="100%" viewBox={`0 0 ${n} ${n}`}>
      {cells.map(([x, y]) => <Rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={color} />)}
      <Finder x={0} y={0} />
      <Finder x={14} y={0} />
      <Finder x={0} y={14} />
    </Svg>
  );
}

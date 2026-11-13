import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { Icon } from '../icons';
import { useTheme, alpha } from '../theme';
import { useStore } from '../store';
import { useNav } from '../nav';
import { ND } from '../ui';
import {
  Screen, T, Btn, Card, Section, Group, Row, Chip, ChipRow, Segmented, Field, Tap, Photo, PetAvatar, PartnerMark, Pill, StatePill,
  Empty, Note, useInsets, NavHeader, IconTile, Stars, Divider, RoundButton, InitialAvatar, Toggle, oa,
} from '../kit';
import {
  ME, PETS, MY_PETS, PARTNERS, PARTNER_ORDER, NEARBY, FEATURED, CATEGORIES, SERVICES, EXTRAS, TEAM, REVIEWS, DAYS_AHEAD, SLOTS,
  COUPONS, SERVICE_FEE_PCT, LIVE_STEPS, SIZES, brl,
} from '../data';

const catLabel = (k) => (CATEGORIES.find((c) => c.key === k) || {}).label;

// ——— Cartões de parceiro ———

export function PartnerCard({ id, wide }) {
  const t = useTheme();
  const nav = useNav();
  const s = useStore();
  const p = PARTNERS[id];
  return (
    <Tap onPress={() => nav.push('Partner', { id })} scale={0.98} hitSlop={0} label={p.name}
      style={{ width: wide ? 280 : undefined, backgroundColor: t.c.surface, borderRadius: t.radius.card, overflow: 'hidden' }}>
      <View>
        <Photo name={p.cover} style={{ width: '100%', height: wide ? 130 : 150 }} />
        <Tap onPress={() => { s.toggleFavorite(id); s.toast(s.favorites[id] ? 'Removido dos favoritos' : 'Salvo nos favoritos'); }} label="Favoritar"
          style={{ position: 'absolute', top: 10, right: 10, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(20,16,12,0.45)', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="heart" size={19} color="#FFF" filled={!!s.favorites[id]} />
        </Tap>
        {p.sponsored ? <View style={{ position: 'absolute', top: 10, left: 10 }}><Pill text="Patrocinado" color="#FFF" bg="rgba(20,16,12,0.6)" /></View> : null}
      </View>
      <View style={{ flexDirection: 'row', padding: 12, gap: 10 }}>
        <PartnerMark partner={p} size={40} />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text numberOfLines={1} style={{ color: t.c.text, fontSize: 15.5, fontWeight: '600', flexShrink: 1 }}>{p.name}</Text>
            {p.verified ? <Icon name="verified" size={15} color={t.toneText} /> : null}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
            <Icon name="star" size={13} color={t.tone} filled />
            <Text numberOfLines={1} style={{ color: t.c.text2, fontSize: 13, marginLeft: 3, flexShrink: 1 }}>{p.rating} ({p.reviews}) · {p.distance} · {p.price}</Text>
          </View>
          <Text numberOfLines={1} style={{ color: p.open ? (t.dark ? '#7FD1A4' : '#2F7A55') : t.c.text2, fontSize: 13, marginTop: 2 }}>
            {p.open ? 'Aberto agora' : 'Fechado'} <Text style={{ color: t.c.text2 }}>· livre {p.nextSlot}</Text>
          </Text>
        </View>
      </View>
    </Tap>
  );
}

// ——— Vitrine (aba Serviços) ———

export function ServicesHome() {
  const t = useTheme();
  const nav = useNav();
  const s = useStore();
  const ins = useInsets();
  const past = s.bookings.filter((b) => b.status === 'done');
  const upcoming = s.bookings.filter((b) => b.status === 'upcoming' || b.status === 'live');
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}>
      <Tap onPress={() => s.openSheet('address')} label="Trocar endereço" style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 8, paddingHorizontal: 4, alignSelf: 'flex-start', minHeight: 40 }}>
        <Icon name="pin" size={18} color={t.toneText} />
        <Text style={{ color: t.c.text, fontSize: 15, fontWeight: '600' }}>Rua Cardoso de Almeida, 1200</Text>
        <Icon name="chevDown" size={16} color={t.c.text2} />
      </Tap>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, marginTop: 4 }}>
        <T kind="display" style={{ flex: 1 }}>Serviços</T>
        <RoundButton icon="calendar" label="Meus agendamentos" onPress={() => nav.push('MyBookings')} dot={upcoming.some((b) => b.status === 'live')} />
      </View>
      <Tap onPress={() => nav.push('Results', { focus: true })} scale={0.99} hitSlop={0} label="Buscar serviços"
        style={{ flexDirection: 'row', alignItems: 'center', gap: 10, height: 52, borderRadius: 16, backgroundColor: t.c.surface, paddingHorizontal: 14, marginTop: 14 }}>
        <Icon name="search" size={20} color={t.c.text2} />
        <Text style={{ color: t.c.text2, fontSize: 15.5 }}>Banho, vacina, hotel para o {PETS[s.petKey].name}...</Text>
      </Tap>

      {upcoming.find((b) => b.status === 'live') ? (
        <Card onPress={() => nav.push('Live', { id: upcoming.find((b) => b.status === 'live').id })} style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: alpha(t.tone, t.dark ? 0.2 : 0.14) }} label="Acompanhar atendimento ao vivo">
          <LivePulse size={46} pet={upcoming.find((b) => b.status === 'live').pet} />
          <View style={{ flex: 1 }}>
            <T kind="small" color={t.toneText} style={{ fontWeight: '600' }}>AO VIVO</T>
            <T kind="h">{PETS[upcoming.find((b) => b.status === 'live').pet].name} está no banho</T>
            <T kind="sub">Pronto por volta das 15h20</T>
          </View>
          <Icon name="chevRight" size={18} color={t.c.text2} />
        </Card>
      ) : null}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 20, rowGap: 16 }}>
        {CATEGORIES.map((c) => (
          <Tap key={c.key} onPress={() => nav.push('Results', { category: c.key })} label={c.label} style={{ width: 104, alignItems: 'center' }} outerStyle={{ width: '31%', alignItems: 'center' }}>
            <View style={{ width: 68, height: 68, borderRadius: 34, backgroundColor: t.c.surface, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={c.icon} size={30} color={t.toneText} />
            </View>
            <Text style={{ color: t.c.text, fontSize: 13, marginTop: 6, textAlign: 'center' }}>{c.label}</Text>
          </Tap>
        ))}
      </View>

      <Section title="Destaques">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
          <Tap onPress={() => nav.push('Coupons')} label="Ver cupons" style={{ width: 280, height: 216, borderRadius: t.radius.card, backgroundColor: t.tone, padding: 18, justifyContent: 'space-between' }}>
            <Icon name="ticket" size={30} color={t.onTone} />
            <View>
              <Text style={{ color: t.onTone, fontFamily: t.fonts.titleStrong, fontSize: 30, lineHeight: 34 }}>15% no primeiro banho</Text>
              <Text style={{ color: t.onTone, fontSize: 14, marginTop: 6, opacity: 0.9 }}>Cupom PRIMEIRO15 · válido até 30/11</Text>
            </View>
          </Tap>
          {FEATURED.map((k) => <PartnerCard key={k} id={k} wide />)}
        </ScrollView>
      </Section>

      {past.length ? (
        <Section title="Agendar de novo" action="Histórico" onAction={() => nav.push('MyBookings', { tab: 'anteriores' })}>
          <Group>
            {past.slice(0, 2).map((b) => (
              <Row key={b.id} left={<PartnerMark partner={b.partner} size={40} />} title={`${b.service} · ${PETS[b.pet].name}`} sub={`${PARTNERS[b.partner].name} · ${b.day}`}
                right={<Btn small full={false} title="Repetir" onPress={() => nav.push('Checkout', { repeat: b.id })} />} />
            ))}
          </Group>
        </Section>
      ) : null}

      <Section title="Perto de você" action="Ver no mapa" onAction={() => nav.push('Results', { view: 'mapa' })}>
        <View style={{ gap: 12 }}>
          {NEARBY.map((k) => <PartnerCard key={k} id={k} />)}
        </View>
      </Section>
      <Tap onPress={() => nav.push('Map', { places: true })} label="Lugares que aceitam pets" style={{ marginTop: 16 }}>
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <IconTile icon="map" />
          <View style={{ flex: 1 }}>
            <T kind="h">Lugares que aceitam pets</T>
            <T kind="sub">Cafés, parques e lojas no seu bairro</T>
          </View>
          <Icon name="chevRight" size={18} color={t.c.text2} />
        </Card>
      </Tap>
    </ScrollView>
  );
}

// ——— Resultados com filtros e mapa ———

const FILTERS = [
  { key: 'perto', label: 'Até 2 km' },
  { key: 'nota', label: 'Nota 4,8+' },
  { key: 'aberto', label: 'Aberto agora' },
  { key: 'leva', label: 'Leva e traz', icon: 'truck' },
  { key: 'barato', label: 'Até $$' },
];

export function ResultsScreen({ category, view: initialView, focus }) {
  const t = useTheme();
  const nav = useNav();
  const [cat, setCat] = useState(category || null);
  const [q, setQ] = useState('');
  const [view, setView] = useState(initialView || 'lista');
  const [on, setOn] = useState({});
  const [sort, setSort] = useState('Relevância');
  const dist = (p) => (p.distance.includes('km') ? parseFloat(p.distance.replace(',', '.')) : 0);
  let list = PARTNER_ORDER.map((k) => PARTNERS[k])
    .filter((p) => !cat || p.category === cat)
    .filter((p) => !q.trim() || (p.name + p.area + catLabel(p.category)).toLowerCase().includes(q.trim().toLowerCase()))
    .filter((p) => !on.perto || dist(p) <= 2)
    .filter((p) => !on.nota || parseFloat(p.rating.replace(',', '.')) >= 4.8)
    .filter((p) => !on.aberto || p.open)
    .filter((p) => !on.leva || p.delivery)
    .filter((p) => !on.barato || p.price.length <= 2);
  if (sort === 'Distância') list = [...list].sort((a, b) => dist(a) - dist(b));
  if (sort === 'Nota') list = [...list].sort((a, b) => parseFloat(b.rating.replace(',', '.')) - parseFloat(a.rating.replace(',', '.')));
  // Um resultado patrocinado no topo, sempre rotulado.
  const sponsored = !cat || cat === 'banho' ? { ...PARTNERS.banhoCia, sponsored: true } : null;

  return (
    <Screen title={cat ? catLabel(cat) : 'Buscar serviços'} keyboard pad={false} scroll={view === 'lista'}
      right={<Tap onPress={() => setView(view === 'lista' ? 'mapa' : 'lista')} label={view === 'lista' ? 'Ver no mapa' : 'Ver em lista'} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={view === 'lista' ? 'map' : 'list'} size={22} color={t.c.text} /></Tap>}>
      <View style={{ paddingHorizontal: 16 }}>
        <Field value={q} onChangeText={setQ} placeholder="Nome, bairro ou serviço" icon="search" autoFocus={focus} />
        <ChipRow style={{ paddingTop: 10 }}>
          <Chip title="Tudo" active={!cat} onPress={() => setCat(null)} />
          {CATEGORIES.map((c) => <Chip key={c.key} title={c.label} icon={c.icon} active={cat === c.key} onPress={() => setCat(c.key)} />)}
        </ChipRow>
        <ChipRow style={{ paddingTop: 8 }}>
          <Chip title={sort} icon="sliders" onPress={() => setSort(sort === 'Relevância' ? 'Distância' : sort === 'Distância' ? 'Nota' : 'Relevância')} />
          {FILTERS.map((f) => <Chip key={f.key} title={f.label} icon={f.icon} active={!!on[f.key]} onPress={() => setOn((s) => ({ ...s, [f.key]: !s[f.key] }))} />)}
        </ChipRow>
      </View>
      {view === 'mapa' ? (
        <MapView ids={list.map((p) => p.key)} />
      ) : (
        <View style={{ paddingHorizontal: 16, paddingTop: 14, gap: 12 }}>
          <T kind="sub" style={{ marginLeft: 4 }}>{list.length} {list.length === 1 ? 'parceiro' : 'parceiros'} perto de Perdizes</T>
          {sponsored && list.length ? <PartnerCardSponsored /> : null}
          {list.map((p) => <PartnerCard key={p.key} id={p.key} />)}
          {!list.length ? <Empty icon="search" title="Nenhum parceiro com esses filtros" text="Tire um filtro ou aumente a distância para ver mais opções." action="Limpar filtros" onAction={() => { setOn({}); setQ(''); }} /> : null}
        </View>
      )}
    </Screen>
  );
}

function PartnerCardSponsored() {
  const t = useTheme();
  const nav = useNav();
  const p = PARTNERS.banhoCia;
  return (
    <Tap onPress={() => nav.push('Partner', { id: 'banhoCia' })} label={`${p.name}, patrocinado`} hitSlop={0} scale={0.98}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: t.radius.card, backgroundColor: t.c.surface }}>
      <Photo name={p.cover} style={{ width: 64, height: 64, borderRadius: 14 }} />
      <View style={{ flex: 1 }}>
        <Pill text="Patrocinado" />
        <Text style={{ color: t.c.text, fontSize: 15.5, fontWeight: '600', marginTop: 4 }}>{p.name}</Text>
        <T kind="sub">★ {p.rating} · {p.distance} · livre {p.nextSlot}</T>
      </View>
    </Tap>
  );
}

// Mapa estilizado do bairro, desenhado no app (sem serviço de mapas no protótipo).
export function MapView({ ids, places }) {
  const t = useTheme();
  const nav = useNav();
  const { width } = useWindowDimensions();
  const [sel, setSel] = useState(ids[0]);
  const W = Math.min(width, 520);
  const H = 460;
  const pos = { bichoBom: [0.28, 0.32], banhoCia: [0.62, 0.48], quatroPatas: [0.2, 0.7], passeioZe: [0.5, 0.2], hotelLatido: [0.78, 0.26], adestraJu: [0.84, 0.72], crecheAuau: [0.42, 0.84] };
  const placeList = [
    { key: 'cafe', name: 'Café Latte & Late', kind: 'Café · aceita pets', at: [0.36, 0.56], icon: 'heart' },
    { key: 'parque', name: 'Parque da Água Branca', kind: 'Parque · área para cães', at: [0.7, 0.86], icon: 'paw' },
    { key: 'loja', name: 'Livraria Folha Seca', kind: 'Loja · pets no colo', at: [0.14, 0.18], icon: 'store' },
  ];
  const road = t.dark ? '#2C2925' : '#FFFFFF';
  const block = t.dark ? '#1E1C1A' : '#EFE9DF';
  const green = t.dark ? '#1F3326' : '#DCEBD9';
  const p = sel && PARTNERS[sel];
  const pl = placeList.find((x) => x.key === sel);
  return (
    <View style={{ marginTop: 12 }}>
      <View style={{ width: W, height: H, backgroundColor: block, overflow: 'hidden' }}>
        <Svg width={W} height={H} style={StyleSheet.absoluteFill}>
          <Rect x={W * 0.58} y={H * 0.74} width={W * 0.3} height={H * 0.2} rx="18" fill={green} />
          <Rect x={W * 0.05} y={H * 0.05} width={W * 0.14} height={H * 0.12} rx="12" fill={green} />
          {[0.15, 0.4, 0.65, 0.9].map((y) => <Rect key={y} x="0" y={H * y - 7} width={W} height="14" fill={road} />)}
          {[0.1, 0.34, 0.56, 0.8].map((x) => <Rect key={x} x={W * x - 6} y="0" width="12" height={H} fill={road} />)}
          <Path d={`M0 ${H * 0.95} L${W} ${H * 0.05}`} stroke={road} strokeWidth="18" />
          <Circle cx={W * 0.46} cy={H * 0.5} r="10" fill={t.dark ? '#6FA8E8' : '#2F6FB8'} stroke="#FFF" strokeWidth="3" />
          <Circle cx={W * 0.46} cy={H * 0.5} r="26" fill={alpha('#2F6FB8', 0.15)} />
        </Svg>
        {(places ? [] : ids).map((k) => {
          const [x, y] = pos[k] || [0.5, 0.5];
          const on = sel === k;
          return (
            <Tap key={k} onPress={() => setSel(k)} label={PARTNERS[k].name}
              outerStyle={{ position: 'absolute', left: W * x - 22, top: H * y - 44 }}
              style={{ alignItems: 'center' }}>
              <View style={{ paddingHorizontal: 8, height: 34, minWidth: 44, borderRadius: 12, backgroundColor: on ? t.tone : t.c.surface, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 4, borderWidth: 2, borderColor: on ? t.c.surface : 'transparent' }}>
                <Icon name="star" size={12} color={on ? t.onTone : t.tone} filled />
                <Text style={{ color: on ? t.onTone : t.c.text, fontWeight: '600', fontSize: 13 }}>{PARTNERS[k].rating}</Text>
              </View>
              <View style={{ width: 0, height: 0, borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 8, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: on ? t.tone : t.c.surface }} />
            </Tap>
          );
        })}
        {placeList.map((x) => (
          <Tap key={x.key} onPress={() => setSel(x.key)} label={x.name} outerStyle={{ position: 'absolute', left: W * x.at[0] - 18, top: H * x.at[1] - 18 }}
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: sel === x.key ? '#4B8A5C' : t.c.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#4B8A5C' }}>
            <Icon name={x.icon} size={18} color={sel === x.key ? '#FFF' : '#4B8A5C'} />
          </Tap>
        ))}
      </View>
      <View style={{ padding: 16 }}>
        {p ? <PartnerCard id={sel} /> : pl ? (
          <Card style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <IconTile icon={pl.icon} color="#4B8A5C" bg={alpha('#4B8A5C', 0.15)} />
            <View style={{ flex: 1 }}><T kind="h">{pl.name}</T><T kind="sub">{pl.kind}</T></View>
          </Card>
        ) : null}
        <T kind="small" center style={{ marginTop: 10 }}>Pins verdes são lugares que aceitam pets, indicados pelos tutores.</T>
      </View>
    </View>
  );
}

export function MapScreen({ places }) {
  return (
    <Screen title={places ? 'Lugares que aceitam pets' : 'Mapa de parceiros'} pad={false}>
      <MapView ids={PARTNER_ORDER} places={places} />
    </Screen>
  );
}

// ——— Página do parceiro ———

export function PartnerScreen({ id = 'bichoBom' }) {
  const t = useTheme();
  const nav = useNav();
  const s = useStore();
  const ins = useInsets();
  const p = PARTNERS[id];
  const [tab, setTab] = useState('servicos');
  const pet = PETS[s.petKey];
  const sizeIdx = Math.max(0, SIZES.indexOf(pet.size || 'Médio'));
  const services = SERVICES[id] || [];
  return (
    <View style={{ flex: 1, backgroundColor: t.c.bg }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View>
          <Photo name={p.cover} style={{ width: '100%', height: 230 }} />
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
            <NavHeader transparent light right={(
              <View style={{ flexDirection: 'row', gap: 8, paddingRight: 4 }}>
                <Tap onPress={() => s.toggleFavorite(id)} label="Favoritar" style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(20,16,12,0.4)', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="heart" size={21} color="#FFF" filled={!!s.favorites[id]} />
                </Tap>
                <Tap onPress={() => s.openSheet('share', { partner: id })} label="Compartilhar" style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(20,16,12,0.4)', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="share" size={20} color="#FFF" />
                </Tap>
              </View>
            )} />
          </View>
        </View>
        <View style={{ paddingHorizontal: 16, marginTop: -34 }}>
          <View style={{ borderWidth: 4, borderColor: t.c.bg, borderRadius: 24, alignSelf: 'flex-start' }}>
            <PartnerMark partner={p} size={64} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 }}>
            <T kind="title" style={{ flexShrink: 1 }}>{p.name}</T>
            {p.verified ? <Icon name="verified" size={20} color={t.toneText} /> : null}
          </View>
          <T kind="sub" style={{ marginTop: 2 }}>{catLabel(p.category)} · {p.area} · {p.distance}</T>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <Pill icon="star" text={`${p.rating} · ${p.reviews} avaliações`} />
            <StatePill state={p.open ? 'ok' : 'late'} text={p.open ? 'Aberto agora' : 'Fechado'} />
            {p.delivery ? <Pill icon="truck" text="Leva e traz" /> : null}
            {p.verified ? <Pill icon="shieldCheck" text="Verificado" /> : null}
          </View>
          <T kind="body" style={{ marginTop: 14, color: t.c.text2 }}>{p.about}</T>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
            <Btn small full={false} kind="secondary" icon="chat" title="Mensagem" onPress={() => nav.push('Dm', { key: id })} />
            <Btn small full={false} kind="secondary" icon="pin" title="Como chegar" onPress={() => nav.push('Map', {})} />
          </View>
        </View>
        <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
          <Segmented value={tab} onChange={setTab} options={[{ key: 'servicos', label: 'Serviços' }, { key: 'avaliacoes', label: 'Avaliações' }, { key: 'fotos', label: 'Fotos' }, { key: 'sobre', label: 'Sobre' }]} />
        </View>
        <View style={{ paddingHorizontal: 16 }}>
          {tab === 'servicos' ? (
            <>
              <Note icon="paw" style={{ marginTop: 14 }}>Preços para {pet.name}: porte {(pet.size || 'médio').toLowerCase()}, pelagem {(pet.coat || 'curta').toLowerCase()}. Pelagem longa soma R$ 20.</Note>
              <Group style={{ marginTop: 12 }}>
                {services.map((sv) => (
                  <Row key={sv.key} title={sv.name} sub={`${sv.desc} · ${sv.mins >= 600 ? 'dia inteiro' : `${sv.mins} min`}`}
                    right={<View style={{ alignItems: 'flex-end', gap: 6 }}>
                      <T kind="body" style={{ fontWeight: '600' }}>{sv.prices[sizeIdx] ? brl(sv.prices[sizeIdx]) : 'Grátis'}</T>
                      <Btn small full={false} title="Agendar" onPress={() => nav.push('Booking', { partner: id, service: sv.key })} />
                    </View>} />
                ))}
              </Group>
              <Section title="Preço por porte">
                <Card pad={0}>
                  <View style={{ flexDirection: 'row', padding: 12, paddingBottom: 6 }}>
                    <T kind="small" style={{ flex: 2 }}>Serviço</T>
                    {SIZES.map((sz) => <T key={sz} kind="small" style={{ flex: 1, textAlign: 'right' }}>{sz}</T>)}
                  </View>
                  {services.map((sv) => (
                    <View key={sv.key} style={{ flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 9, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.c.line }}>
                      <T kind="sub" style={{ flex: 2, color: t.c.text }} numberOfLines={1}>{sv.name}</T>
                      {sv.prices.map((pr, i) => <T key={i} kind="sub" style={{ flex: 1, textAlign: 'right', fontVariant: ['tabular-nums'], color: i === sizeIdx ? t.toneText : t.c.text2, fontWeight: i === sizeIdx ? '600' : '400' }}>{pr ? pr : '—'}</T>)}
                    </View>
                  ))}
                </Card>
              </Section>
              {TEAM[id] ? (
                <Section title="Equipe">
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    {TEAM[id].slice(0, 2).map((m) => (
                      <Card key={m.key} style={{ flex: 1, alignItems: 'center' }}>
                        <InitialAvatar name={m.name} size={52} color={m.color} />
                        <T kind="body" style={{ fontWeight: '600', marginTop: 8 }}>{m.name}</T>
                        <T kind="small" center>{m.role}</T>
                      </Card>
                    ))}
                  </View>
                </Section>
              ) : null}
            </>
          ) : tab === 'avaliacoes' ? (
            <View style={{ marginTop: 14, gap: 12 }}>
              <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                <Text style={{ fontFamily: t.fonts.titleStrong, fontSize: 44, color: t.c.text }}>{p.rating}</Text>
                <View style={{ flex: 1, gap: 4 }}>
                  <Stars value={5} size={16} />
                  <T kind="sub">{p.reviews} avaliações de tutores que agendaram pelo netpet</T>
                </View>
              </Card>
              {REVIEWS.map((r, i) => (
                <Card key={i}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <T kind="body" style={{ fontWeight: '600' }}>{r.who}</T>
                    <T kind="small">{r.when}</T>
                  </View>
                  <View style={{ marginTop: 4 }}><Stars value={r.stars} /></View>
                  <T kind="body" style={{ marginTop: 8 }}>{r.text}</T>
                  {r.reply ? (
                    <View style={{ marginTop: 10, padding: 12, borderRadius: 12, backgroundColor: t.c.surface2 }}>
                      <T kind="small" style={{ fontWeight: '600', color: t.c.text }}>Resposta do {p.name}</T>
                      <T kind="sub" style={{ marginTop: 2 }}>{r.reply}</T>
                    </View>
                  ) : null}
                </Card>
              ))}
            </View>
          ) : tab === 'fotos' ? (
            <View style={{ marginTop: 14 }}>
              <T kind="sub" style={{ marginBottom: 10, marginLeft: 4 }}>Posts em que {p.name} foi marcado</T>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                {['melDepois', 'pacoca2', 'nina', 'pipoca', 'thor', 'amora', 'bidu', 'dupla', 'filhotes'].map((ph, i) => (
                  <Tap key={i} onPress={() => nav.push('Post', { id: 'p1' })} label="Abrir post" outerStyle={{ width: '32.6%' }} hitSlop={0}>
                    <Photo name={ph} style={{ width: '100%', aspectRatio: 1, borderRadius: 10 }} />
                  </Tap>
                ))}
              </View>
            </View>
          ) : (
            <Group style={{ marginTop: 14 }}>
              <Row icon="pin" title={p.address} sub="Endereço" />
              <Row icon="clock" title={p.hours} sub="Horário" />
              <Row icon="truck" title={p.delivery ? `Leva e traz em até ${p.eta}` : 'Sem leva e traz'} sub="Entrega" />
              <Row icon="shieldCheck" title={p.verified ? 'Documentos conferidos pelo netpet' : 'Verificação em andamento'} sub="Selo de verificado" />
              <Row icon="flag" title="Denunciar este parceiro" onPress={() => s.openSheet('report', { who: p.name })} />
            </Group>
          )}
        </View>
      </ScrollView>
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: t.c.surface, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.c.line, paddingHorizontal: 16, paddingTop: 12, paddingBottom: Math.max(ins.bottom, 12), flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <T kind="small">A partir de</T>
          <T kind="h">{brl(Math.min(...services.map((sv) => sv.prices[sizeIdx]).filter(Boolean)) || 0)}</T>
        </View>
        <Btn full={false} title={`Agendar · livre ${p.nextSlot.split(',')[0]}`} onPress={() => nav.push('Booking', { partner: id })} />
      </View>
    </View>
  );
}

// ——— Agendamento ———

export function BookingScreen({ partner = 'bichoBom', service: initialService }) {
  const t = useTheme();
  const nav = useNav();
  const s = useStore();
  const services = SERVICES[partner] || [];
  const [pet, setPet] = useState(s.petKey);
  const [service, setService] = useState(initialService || services[0].key);
  const [extras, setExtras] = useState([]);
  const [pro, setPro] = useState('qualquer');
  const [day, setDay] = useState(DAYS_AHEAD[1].key);
  const [time, setTime] = useState(null);
  const [note, setNote] = useState(pet === 'pacoca' ? 'Tem medo de secador. Alergia a frango.' : '');
  const [delivery, setDelivery] = useState(false);
  const p = PARTNERS[partner];
  const petObj = PETS[pet];
  const sizeIdx = Math.max(0, SIZES.indexOf(petObj.size || 'Médio'));
  const sv = services.find((x) => x.key === service);
  const extrasTotal = extras.reduce((a, k) => a + EXTRAS.find((e) => e.key === k).price, 0);
  const total = sv.prices[sizeIdx] + extrasTotal + (delivery ? 12 : 0);
  const team = TEAM[partner] || [{ key: 'qualquer', name: 'Sem preferência', role: 'Primeiro horário livre', initials: '··', color: '#8A8178' }];
  const go = () => nav.push('Checkout', {
    draft: { pet, partner, service: sv.name, base: sv.prices[sizeIdx], extras: extras.map((k) => EXTRAS.find((e) => e.key === k)), pro: team.find((m) => m.key === pro).name,
      day: `${DAYS_AHEAD.find((d) => d.key === day).label}, ${DAYS_AHEAD.find((d) => d.key === day).sub}`, time, note, delivery },
  });
  return (
    <Screen title={p.name} keyboard footer={(
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <T kind="small">{sv.name}{extras.length ? ` + ${extras.length}` : ''}</T>
          <T kind="h">{brl(total)}</T>
        </View>
        <Btn full={false} title={time ? 'Revisar' : 'Escolha o horário'} disabled={!time} onPress={go} />
      </View>
    )}>
      <T kind="display" style={{ marginTop: 4, marginLeft: 4 }}>Agendar</T>
      <Section title="Para quem?">
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {MY_PETS.map((k) => {
            const on = pet === k;
            return (
              <Tap key={k} onPress={() => setPet(k)} outerStyle={{ flex: 1 }} label={PETS[k].name}
                style={{ alignItems: 'center', paddingVertical: 12, borderRadius: 18, backgroundColor: on ? alpha(t.tone, 0.14) : t.c.surface, borderWidth: 1.5, borderColor: on ? t.tone : 'transparent' }}>
                <PetAvatar pet={k} size={46} />
                <T kind="body" style={{ marginTop: 6, fontWeight: on ? '600' : '400' }}>{PETS[k].name}</T>
                <T kind="small">{PETS[k].size}</T>
              </Tap>
            );
          })}
        </View>
      </Section>
      <Section title="Serviço">
        <Group>
          {services.map((x) => (
            <Row key={x.key} title={x.name} sub={`${x.mins >= 600 ? 'Dia inteiro' : `${x.mins} min`} · ${x.prices[sizeIdx] ? brl(x.prices[sizeIdx]) : 'Grátis'}`} onPress={() => setService(x.key)} chevron={false}
              right={<Radio on={service === x.key} />} />
          ))}
        </Group>
      </Section>
      {p.category === 'banho' ? (
        <Section title="Adicionais">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {EXTRAS.map((e) => <Chip key={e.key} title={`${e.name} · +${e.price}`} active={extras.includes(e.key)} onPress={() => setExtras((x) => (x.includes(e.key) ? x.filter((y) => y !== e.key) : [...x, e.key]))} />)}
          </View>
        </Section>
      ) : null}
      <Section title="Profissional">
        <ChipRow>
          {team.map((m) => <Chip key={m.key} title={m.name} active={pro === m.key} onPress={() => setPro(m.key)} />)}
        </ChipRow>
      </Section>
      <Section title="Dia e horário">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {DAYS_AHEAD.map((d) => {
            const on = d.key === day;
            return (
              <Tap key={d.key} onPress={() => { setDay(d.key); setTime(null); }} label={`${d.label}, ${d.sub}`}
                style={{ width: 84, height: 66, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? t.tone : t.c.surface }}>
                <Text style={{ color: on ? t.onTone : t.c.text, fontSize: 14.5, fontWeight: '600' }}>{d.label}</Text>
                <Text style={{ color: on ? t.onTone : t.c.text2, fontSize: 12.5, marginTop: 2 }}>{d.sub}</Text>
              </Tap>
            );
          })}
        </ScrollView>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          {SLOTS[day].map((h) => <Chip key={h} title={h} active={time === h} onPress={() => setTime(h)} style={{ minWidth: 78, justifyContent: 'center' }} />)}
        </View>
      </Section>
      <Section title="Observações">
        <Field value={note} onChangeText={setNote} placeholder="Alergias, medos, manias. Ex.: tem medo de secador." multiline />
      </Section>
      {p.delivery ? (
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16 }}>
          <IconTile icon="truck" />
          <View style={{ flex: 1 }}>
            <T kind="body" style={{ fontWeight: '600' }}>Leva e traz · R$ 12,00</T>
            <T kind="sub">Buscamos e devolvemos no seu endereço</T>
          </View>
          <Toggle value={delivery} onChange={setDelivery} label="Leva e traz" />
        </Card>
      ) : null}
    </Screen>
  );
}

function Radio({ on }) {
  const t = useTheme();
  return (
    <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: on ? t.tone : t.c.line, alignItems: 'center', justifyContent: 'center' }}>
      {on ? <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: t.tone }} /> : null}
    </View>
  );
}

// ——— Resumo e pagamento ———

export function CheckoutScreen({ draft: d0, repeat }) {
  const t = useTheme();
  const nav = useNav();
  const s = useStore();
  const prev = repeat ? s.bookings.find((b) => b.id === repeat) : null;
  const draft = d0 || {
    pet: prev.pet, partner: prev.partner, service: prev.service, base: prev.total, extras: [], pro: prev.pro, day: 'Amanhã, sex 13', time: prev.time, note: '', delivery: false,
  };
  const [pay, setPay] = useState('pix');
  const [coupon, setCoupon] = useState(null);
  const [repeatEvery, setRepeatEvery] = useState(null);
  const extras = draft.extras.reduce((a, e) => a + e.price, 0);
  const sub = draft.base + extras + (draft.delivery ? 12 : 0);
  const discount = coupon ? (coupon.pct ? Math.round(sub * coupon.pct) / 100 : coupon.off) : 0;
  const fee = pay === 'local' || s.plus ? 0 : Math.round(sub * SERVICE_FEE_PCT) / 100;
  const total = sub - discount + fee;
  const confirm = () => {
    const id = s.addBooking({
      pet: draft.pet, partner: draft.partner, service: draft.service, extras: draft.extras.map((e) => e.name), pro: draft.pro, day: draft.day, time: draft.time,
      total, pay: { pix: 'Pix', cartao: 'Cartão', local: 'No local' }[pay], note: draft.note, delivery: draft.delivery, repeatEvery,
    });
    nav.replace('Confirmed', { id });
  };
  return (
    <Screen title="Resumo" footer={(
      <View style={{ gap: 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <T kind="h">Total</T>
          <T kind="h">{brl(total)}</T>
        </View>
        <Btn title={pay === 'pix' ? 'Pagar com Pix' : pay === 'cartao' ? 'Pagar com cartão' : 'Confirmar agendamento'} onPress={confirm} />
      </View>
    )}>
      <T kind="display" style={{ marginTop: 4, marginLeft: 4 }}>Quase lá</T>
      <Card style={{ marginTop: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <PetAvatar pet={draft.pet} size={46} />
          <View style={{ flex: 1 }}>
            <T kind="h">{draft.service}</T>
            <T kind="sub">{PETS[draft.pet].name} · {PARTNERS[draft.partner].name}</T>
          </View>
        </View>
        <View style={{ marginTop: 14, gap: 8 }}>
          <Line icon="calendar" text={`${draft.day} às ${draft.time}`} />
          <Line icon="user" text={draft.pro} />
          {draft.delivery ? <Line icon="truck" text={`Leva e traz · ${ME.address}`} /> : <Line icon="pin" text={PARTNERS[draft.partner].address} />}
          {draft.note ? <Line icon="info" text={draft.note} /> : null}
        </View>
      </Card>
      <Section title="Repetir">
        <Segmented value={repeatEvery || 'nao'} onChange={(v) => setRepeatEvery(v === 'nao' ? null : v)} options={[{ key: 'nao', label: 'Só desta vez' }, { key: '15', label: 'A cada 15 dias' }, { key: '30', label: 'A cada 30 dias' }]} />
      </Section>
      <Section title="Pagamento">
        <Group>
          {[['pix', 'pix', 'Pix', 'Aprovação na hora'], ['cartao', 'card', 'Cartão de crédito', 'Visa ••• 4821'], ['local', 'cash', 'Pagar no local', 'Sem taxa de serviço']].map(([k, ic, ti, su]) => (
            <Row key={k} icon={ic} title={ti} sub={su} onPress={() => setPay(k)} chevron={false} right={<Radio on={pay === k} />} />
          ))}
        </Group>
      </Section>
      <Section title="Cupom">
        <ChipRow>
          {COUPONS.map((c) => <Chip key={c.code} icon="ticket" title={c.code} active={coupon && coupon.code === c.code} onPress={() => setCoupon(coupon && coupon.code === c.code ? null : c)} />)}
        </ChipRow>
        {coupon ? <T kind="small" style={{ marginTop: 6, marginLeft: 4 }}>{coupon.label}</T> : null}
      </Section>
      <Card style={{ marginTop: 20, gap: 8 }}>
        <Money label={draft.service} value={draft.base} />
        {draft.extras.map((e) => <Money key={e.key} label={e.name} value={e.price} />)}
        {draft.delivery ? <Money label="Leva e traz" value={12} /> : null}
        {discount ? <Money label={`Cupom ${coupon.code}`} value={-discount} tone /> : null}
        <Money label={s.plus ? 'Taxa de serviço (grátis no netpet+)' : pay === 'local' ? 'Taxa de serviço (não cobrada no local)' : `Taxa de serviço (${SERVICE_FEE_PCT}%)`} value={fee} />
        {!s.plus && pay !== 'local' ? (
          <Tap onPress={() => nav.push('Plus')} label="Conhecer o netpet+">
            <T kind="small" color={t.toneText} style={{ fontWeight: '600' }}>Com o netpet+ você não paga taxa de serviço.</T>
          </Tap>
        ) : null}
      </Card>
      <Note icon="info" style={{ marginTop: 14 }}>Cancelamento grátis até 2 horas antes. Depois disso, o parceiro pode cobrar 50% do valor.</Note>
    </Screen>
  );
}

function Line({ icon, text }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
      <Icon name={icon} size={18} color={t.c.text2} />
      <T kind="body" style={{ flex: 1, fontSize: 14.5 }}>{text}</T>
    </View>
  );
}

function Money({ label, value, tone }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
      <T kind="sub" style={{ flex: 1, color: tone ? t.toneText : t.c.text2 }}>{label}</T>
      <T kind="sub" style={{ color: tone ? t.toneText : t.c.text, fontVariant: ['tabular-nums'] }}>{brl(value)}</T>
    </View>
  );
}

export function ConfirmedScreen({ id }) {
  const t = useTheme();
  const nav = useNav();
  const s = useStore();
  const b = s.bookings.find((x) => x.id === id) || s.bookings[0];
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(v, { toValue: 1, duration: 420, easing: Easing.out(Easing.back(1.2)), useNativeDriver: ND }).start(); }, []);
  return (
    <Screen header={false} footer={(
      <View style={{ gap: 8 }}>
        <Btn title="Ver agendamento" onPress={() => nav.replace('BookingDetail', { id: b.id })} />
        <Btn title="Voltar para o início" kind="ghost" onPress={() => nav.resetTo('inicio')} />
      </View>
    )}>
      <View style={{ alignItems: 'center', paddingTop: 80 + useInsets().top }}>
        <Animated.View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: t.tone, alignItems: 'center', justifyContent: 'center', transform: [{ scale: v }] }}>
          <Icon name="check" size={58} color={t.onTone} stroke={2.4} />
        </Animated.View>
        <T kind="display" center style={{ marginTop: 26 }}>Agendado!</T>
        <T kind="body" center style={{ marginTop: 8, color: t.c.text2, maxWidth: 300 }}>
          {b.service} {PETS[b.pet].article} {PETS[b.pet].name} no {PARTNERS[b.partner].name}, {b.day.toLowerCase()} às {b.time}.
        </T>
        {b.repeatEvery ? <Pill icon="swap" text={`Repete a cada ${b.repeatEvery} dias`} style={{ alignSelf: 'center', marginTop: 14 }} /> : null}
      </View>
      <Group style={{ marginTop: 32 }}>
        <Row icon="calendar" title="Adicionar ao calendário" onPress={() => s.toast('Adicionado ao calendário')} />
        <Row icon="bell" title="Lembrar 1 hora antes" right={<Toggle value label="Lembrete" onChange={() => {}} />} />
        <Row icon="chat" title={`Falar com ${PARTNERS[b.partner].name}`} onPress={() => nav.push('Dm', { key: b.partner })} />
      </Group>
    </Screen>
  );
}

// ——— Meus agendamentos e detalhe ———

export function MyBookingsScreen({ tab: initialTab }) {
  const t = useTheme();
  const nav = useNav();
  const s = useStore();
  const [tab, setTab] = useState(initialTab || 'proximos');
  const list = s.bookings.filter((b) => (tab === 'proximos' ? ['upcoming', 'live'].includes(b.status) : ['done', 'canceled'].includes(b.status)));
  return (
    <Screen big="Agendamentos" sub="Próximos, anteriores e favoritos">
      <Segmented value={tab} onChange={setTab} options={[{ key: 'proximos', label: 'Próximos' }, { key: 'anteriores', label: 'Anteriores' }]} style={{ marginTop: 12 }} />
      <View style={{ gap: 12, marginTop: 14 }}>
        {list.map((b) => <BookingCard key={b.id} b={b} />)}
        {!list.length ? <Empty icon="calendar" title="Nenhum agendamento" text="Quando você marcar banho, vacina ou passeio, ele aparece aqui." action="Encontrar serviço" onAction={() => nav.resetTo('servicos')} /> : null}
      </View>
      <Section title="Favoritos">
        <Group>
          {Object.keys(s.favorites).filter((k) => s.favorites[k]).map((k) => (
            <Row key={k} left={<PartnerMark partner={k} size={40} />} title={PARTNERS[k].name} sub={`${catLabel(PARTNERS[k].category)} · ${PARTNERS[k].distance}`} onPress={() => nav.push('Partner', { id: k })} />
          ))}
        </Group>
      </Section>
    </Screen>
  );
}

function BookingCard({ b }) {
  const t = useTheme();
  const nav = useNav();
  const state = { live: ['soon', 'Acontecendo agora'], upcoming: ['info', 'Confirmado'], done: ['ok', 'Concluído'], canceled: ['late', 'Cancelado'] }[b.status];
  return (
    <Card onPress={() => nav.push(b.status === 'live' ? 'Live' : 'BookingDetail', { id: b.id })} label={b.service}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {b.status === 'live' ? <LivePulse size={44} pet={b.pet} /> : <PetAvatar pet={b.pet} size={40} />}
        <View style={{ flex: 1 }}>
          <T kind="h" numberOfLines={1}>{b.service}</T>
          <T kind="sub" numberOfLines={1}>{PETS[b.pet].name} · {PARTNERS[b.partner].name}</T>
        </View>
        <StatePill state={state[0]} text={state[1]} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 6 }}>
        <Icon name="calendar" size={16} color={t.c.text2} />
        <T kind="sub" style={{ flex: 1 }}>{b.day} · {b.time}</T>
        <T kind="sub" style={{ color: t.c.text }}>{b.total ? brl(b.total) : '—'}</T>
      </View>
    </Card>
  );
}

export function BookingDetailScreen({ id }) {
  const t = useTheme();
  const nav = useNav();
  const s = useStore();
  const b = s.bookings.find((x) => x.id === id) || s.bookings[1];
  const [confirmCancel, setConfirmCancel] = useState(false);
  const p = PARTNERS[b.partner];
  return (
    <Screen title="Agendamento" footer={b.status === 'upcoming' ? (
      confirmCancel ? (
        <View style={{ gap: 8 }}>
          <T kind="sub" center>Cancelar agora é grátis. Tem certeza?</T>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Btn title="Manter" kind="secondary" onPress={() => setConfirmCancel(false)} style={{ flex: 1 }} full={false} />
            <Btn title="Cancelar" kind="danger" onPress={() => { s.updateBooking(b.id, { status: 'canceled' }); s.toast('Agendamento cancelado'); nav.back(); }} style={{ flex: 1 }} full={false} />
          </View>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Btn title="Cancelar" kind="secondary" onPress={() => setConfirmCancel(true)} full={false} style={{ flex: 1 }} />
          <Btn title="Remarcar" onPress={() => nav.push('Booking', { partner: b.partner })} full={false} style={{ flex: 1 }} />
        </View>
      )
    ) : b.status === 'done' ? (
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {b.rated ? null : <Btn title="Avaliar" kind="secondary" onPress={() => nav.push('Review', { id: b.id })} full={false} style={{ flex: 1 }} />}
        <Btn title="Agendar de novo" onPress={() => nav.push('Checkout', { repeat: b.id })} full={false} style={{ flex: 1 }} />
      </View>
    ) : null}>
      <View style={{ alignItems: 'center', marginTop: 6 }}>
        <PetAvatar pet={b.pet} size={72} />
        <T kind="title" center style={{ marginTop: 10 }}>{b.service}</T>
        <T kind="sub" center>{PETS[b.pet].name} · {b.day} às {b.time}</T>
      </View>
      <Group style={{ marginTop: 22 }}>
        <Row left={<PartnerMark partner={b.partner} size={36} />} title={p.name} sub={p.address} onPress={() => nav.push('Partner', { id: b.partner })} />
        <Row icon="user" title={b.pro} sub="Profissional" />
        <Row icon={b.pay === 'Pix' ? 'pix' : b.pay === 'Cartão' ? 'card' : 'cash'} title={`${b.total ? brl(b.total) : 'Sem custo'} · ${b.pay}`} sub="Pagamento" />
        {b.extras && b.extras.length ? <Row icon="plus" title={b.extras.join(', ')} sub="Adicionais" /> : null}
        {b.note ? <Row icon="info" title={b.note} sub="Suas observações" /> : null}
        {b.repeatEvery ? <Row icon="swap" title={`A cada ${b.repeatEvery} dias`} sub="Repetição" /> : null}
      </Group>
      <Group style={{ marginTop: 14 }}>
        <Row icon="chat" title={`Falar com ${p.name}`} onPress={() => nav.push('Dm', { key: b.partner })} />
        <Row icon="pin" title="Como chegar" onPress={() => nav.push('Map', {})} />
      </Group>
      {b.status === 'upcoming' ? <Note style={{ marginTop: 14 }}>Cancelamento grátis até 2 horas antes do horário.</Note> : null}
    </Screen>
  );
}

// ——— Atendimento ao vivo ———

export function LivePulse({ size = 48, pet = 'pacoca', pulse = true }) {
  const t = useTheme();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!pulse) return undefined;
    const loop = Animated.loop(Animated.timing(v, { toValue: 1, duration: 1600, easing: Easing.out(Easing.quad), useNativeDriver: ND }));
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  const col = t.dark ? PETS[pet].colorDark : PETS[pet].color;
  return (
    <View style={{ width: size + 8, height: size + 8, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{ position: 'absolute', width: size + 8, height: size + 8, borderRadius: (size + 8) / 2, borderWidth: 2, borderColor: col,
        opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.8, 0] }), transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.35] }) }] }} />
      <PetAvatar pet={pet} size={size - 6} ring={2} gap={1.5} />
    </View>
  );
}

export function LiveScreen({ id = 'b1' }) {
  const t = useTheme();
  const nav = useNav();
  const s = useStore();
  const b = s.bookings.find((x) => x.id === id) || s.bookings[0];
  const [stage, setStage] = useState(b.stage ?? 3);
  const reveal = useRef(new Animated.Value(0)).current;
  const done = stage >= LIVE_STEPS.length - 1;
  useEffect(() => {
    if (done) {
      Animated.timing(reveal, { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: ND }).start();
      s.updateBooking(b.id, { stage, status: 'live' });
    }
  }, [done]);
  // Simulação: avança uma etapa a cada 6 segundos enquanto a tela está aberta.
  useEffect(() => {
    if (done) return undefined;
    const tm = setTimeout(() => setStage((x) => x + 1), 6000);
    return () => clearTimeout(tm);
  }, [stage, done]);
  const p = PARTNERS[b.partner];
  const pet = PETS[b.pet];
  return (
    <Screen title="Ao vivo" footer={done ? (
      <View style={{ gap: 8 }}>
        <Btn title="Postar a foto do depois" icon="camera" onPress={() => { s.updateBooking(b.id, { status: 'done', stage }); nav.replace('NewPost', { photo: 'pacoca2', partner: b.partner, caption: `Banho tomado no ${p.name}!` }); }} />
        <Btn title="Avaliar atendimento" kind="ghost" onPress={() => { s.updateBooking(b.id, { status: 'done', stage }); nav.replace('Review', { id: b.id }); }} />
      </View>
    ) : (
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Btn title="Falar com o parceiro" icon="chat" kind="secondary" onPress={() => nav.push('Dm', { key: b.partner })} full={false} style={{ flex: 1 }} />
      </View>
    )}>
      <View style={{ alignItems: 'center', marginTop: 4 }}>
        <LivePulse size={92} pet={b.pet} />
        <T kind="title" center style={{ marginTop: 12 }}>{done ? `${pet.name} está pronto!` : `${pet.name}: ${LIVE_STEPS[stage].label.toLowerCase()}`}</T>
        <T kind="sub" center style={{ marginTop: 4 }}>{done ? 'Saindo para entrega · chega em 15 min' : 'Previsão de ficar pronto: 15h20'}</T>
      </View>
      {done ? (
        <Animated.View style={{ marginTop: 18, borderRadius: t.radius.card, overflow: 'hidden', opacity: reveal, transform: [{ scale: reveal.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }] }}>
          <Photo name="pacoca2" style={{ width: '100%', aspectRatio: 4 / 5 }} />
          <View style={{ position: 'absolute', left: 12, bottom: 12 }}><Pill text={`Foto do depois · ${p.name}`} color="#FFF" bg="rgba(20,16,12,0.6)" /></View>
        </Animated.View>
      ) : null}
      <Card style={{ marginTop: 18 }}>
        {LIVE_STEPS.map((st, i) => {
          const passed = i < stage;
          const cur = i === stage;
          return (
            <View key={st.key} style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ alignItems: 'center', width: 24 }}>
                <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: passed || cur ? t.tone : t.c.surface2, alignItems: 'center', justifyContent: 'center', borderWidth: cur ? 3 : 0, borderColor: alpha(t.tone, 0.35) }}>
                  {passed ? <Icon name="check" size={13} color={t.onTone} stroke={2.4} /> : null}
                </View>
                {i < LIVE_STEPS.length - 1 ? <View style={{ width: 2, flex: 1, minHeight: 22, backgroundColor: passed ? t.tone : t.c.surface2 }} /> : null}
              </View>
              <View style={{ flex: 1, paddingBottom: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <T kind="body" style={{ fontWeight: cur ? '600' : '400', color: passed || cur ? t.c.text : t.c.text2 }}>{st.label}</T>
                  <T kind="small">{passed || cur ? st.at || 'agora' : ''}</T>
                </View>
                {passed || cur ? <T kind="sub">{st.sub}</T> : null}
              </View>
            </View>
          );
        })}
      </Card>
      <Card style={{ marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <PartnerMark partner={b.partner} size={40} />
        <View style={{ flex: 1 }}>
          <T kind="body" style={{ fontWeight: '600' }}>{p.name}</T>
          <T kind="sub">{b.service} · com {b.pro}</T>
        </View>
      </Card>
      {!done ? <T kind="small" center style={{ marginTop: 12 }}>O status muda sozinho quando o parceiro avança uma etapa.</T> : null}
    </Screen>
  );
}

// ——— Avaliar ———

export function ReviewScreen({ id }) {
  const t = useTheme();
  const nav = useNav();
  const s = useStore();
  const b = s.bookings.find((x) => x.id === id) || s.bookings[0];
  const [stars, setStars] = useState(5);
  const [tags, setTags] = useState(['Cuidadoso', 'No horário']);
  const [text, setText] = useState('');
  const [tip, setTip] = useState(null);
  const send = () => {
    s.updateBooking(b.id, { rated: stars, status: 'done' });
    s.toast('Obrigado pela avaliação!');
    nav.resetTo('inicio');
  };
  return (
    <Screen title="Avaliar" keyboard footer={<Btn title="Enviar avaliação" onPress={send} />}>
      <View style={{ alignItems: 'center', marginTop: 10 }}>
        <PartnerMark partner={b.partner} size={64} />
        <T kind="title" center style={{ marginTop: 12 }}>Como foi no {PARTNERS[b.partner].name}?</T>
        <T kind="sub" center>{b.service} {PETS[b.pet].article} {PETS[b.pet].name}</T>
        <View style={{ marginTop: 18 }}><Stars value={stars} size={36} onChange={setStars} /></View>
      </View>
      <Section title="O que se destacou">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {['Cuidadoso', 'No horário', 'Ótimo resultado', 'Mandou fotos', 'Leva e traz pontual', 'Preço justo'].map((x) => (
            <Chip key={x} title={x} active={tags.includes(x)} onPress={() => setTags((s2) => (s2.includes(x) ? s2.filter((y) => y !== x) : [...s2, x]))} />
          ))}
        </View>
      </Section>
      <Section title="Conte mais (opcional)">
        <Field value={text} onChangeText={setText} placeholder="Sua avaliação ajuda outros tutores a escolher." multiline />
      </Section>
      <Section title={`Gorjeta para ${b.pro}`}>
        <ChipRow>{[null, 5, 10, 15].map((v) => <Chip key={String(v)} title={v ? brl(v) : 'Sem gorjeta'} active={tip === v} onPress={() => setTip(v)} />)}</ChipRow>
      </Section>
    </Screen>
  );
}

// ——— Cupons ———

export function CouponsScreen() {
  const t = useTheme();
  const s = useStore();
  return (
    <Screen big="Cupons" sub="Use no resumo do agendamento">
      <View style={{ gap: 12, marginTop: 12 }}>
        {[...COUPONS, { code: 'NETPETPLUS', label: '5% de volta em todo agendamento', plus: true }].map((c) => (
          <Card key={c.code} style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <IconTile icon={c.plus ? 'crown' : 'ticket'} size={48} />
            <View style={{ flex: 1 }}>
              <T kind="h">{c.code}</T>
              <T kind="sub">{c.label}</T>
              <T kind="small" style={{ marginTop: 2 }}>{c.plus ? 'Exclusivo netpet+' : 'Válido até 30/11/2026'}</T>
            </View>
            <Btn small full={false} kind="secondary" title="Copiar" onPress={() => s.toast(`Cupom ${c.code} copiado`)} />
          </Card>
        ))}
      </View>
    </Screen>
  );
}

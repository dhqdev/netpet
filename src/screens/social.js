import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { Icon } from '../icons';
import { useTheme, alpha } from '../theme';
import { useStore } from '../store';
import { useNav } from '../nav';
import { ND, PostMedia } from '../ui';
import {
  Screen, T, Btn, Card, Section, Group, Row, Chip, ChipRow, Segmented, Field, Tap, Photo, PetAvatar, PartnerMark, Pill,
  Empty, Note, useInsets, NavHeader, IconTile, Who, Divider,
} from '../kit';
import { PETS, PARTNERS, COMMENTS, NOTIFICATIONS, OTHER_PETS, MY_PETS, PARTNER_ORDER, MATILHAS, CATEGORIES, fmt, STORIES } from '../data';
import { PostHeader } from '../home/shared';

// ——— Post, comentários e patinhas ———

export function PostScreen({ id }) {
  const t = useTheme();
  const s = useStore();
  const nav = useNav();
  const post = s.posts.find((p) => p.id === id) || s.posts[0];
  const [tab, setTab] = useState('comentarios');
  const [text, setText] = useState('');
  const [comments, setComments] = useState(COMMENTS);
  const liked = !!s.liked[post.id];
  const pet = PETS[post.pet];
  const send = () => {
    if (!text.trim()) return;
    setComments((c) => [...c, { pet: s.petKey, text: text.trim(), time: 'agora', paws: 0 }]);
    setText('');
  };

  return (
    <Screen title="Post" pad={false} keyboard
      right={<Tap onPress={() => (post.mine ? s.openSheet('mine', { post: post.id }) : s.openSheet('more', { post: post.id, who: PETS[post.pet].name }))} label="Mais opções" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><Icon name="more" size={22} color={t.c.text} /></Tap>}
      footer={(
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <PetAvatar pet={s.petKey} size={30} ring={1.5} gap={1.5} />
          <TextInput value={text} onChangeText={setText} onSubmitEditing={send} placeholder={`Comentar como ${PETS[s.petKey].name}`}
            placeholderTextColor={t.c.text2} accessibilityLabel="Escrever comentário"
            style={{ flex: 1, height: 44, borderRadius: 22, backgroundColor: t.c.surface2, paddingHorizontal: 16, color: t.c.text, fontSize: 15, outlineStyle: 'none' }} />
          <Tap onPress={send} label="Enviar comentário" style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: text.trim() ? t.tone : t.c.surface2, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="send" size={20} color={text.trim() ? t.onTone : t.c.text2} />
          </Tap>
        </View>
      )}>
      <View style={{ paddingLeft: 16, paddingRight: 6, paddingBottom: 10 }}>
        <PostHeader post={post} onMore={() => s.openSheet('more', { post: post.id })} onOpenPet={() => nav.push('PetProfile', { pet: post.pet })} onOpenPartner={() => nav.push('Partner', { id: post.partner })} />
      </View>
      <PostMedia post={post} liked={liked} onLike={() => s.like(post.id)} />
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingTop: 6 }}>
        <Tap onPress={() => s.toggleLike(post.id)} label="Dar patinha" scale={0.9} style={{ flexDirection: 'row', alignItems: 'center', height: 44, paddingHorizontal: 8, gap: 6 }}>
          <Icon name="paw" size={24} color={liked ? t.tone : t.c.text} filled={liked} />
          <Text style={{ color: t.c.text, fontSize: 14 }}>{fmt(post.paws + (liked ? 1 : 0))}</Text>
        </Tap>
        <Tap onPress={() => s.openSheet('share', { post: post.id })} label="Compartilhar" style={{ height: 44, paddingHorizontal: 8, justifyContent: 'center' }}><Icon name="share" size={23} color={t.c.text} /></Tap>
        <View style={{ flex: 1 }} />
        <Tap onPress={() => { s.toggleSave(post.id); s.toast(s.saved[post.id] ? 'Removido dos salvos' : 'Salvo'); }} label="Salvar" style={{ height: 44, paddingHorizontal: 8, justifyContent: 'center' }}>
          <Icon name="bookmark" size={23} color={t.c.text} filled={!!s.saved[post.id]} />
        </Tap>
      </View>
      {post.caption ? (
        <Text style={{ color: t.c.text, fontSize: 15.5, lineHeight: 22, paddingHorizontal: 16, paddingTop: 4 }}>
          <Text style={{ fontWeight: '600' }}>{pet ? pet.name : PARTNERS[post.partner].name}  </Text>{post.caption}
        </Text>
      ) : null}
      {post.partner && post.type !== 'sponsored' ? (
        <View style={{ paddingHorizontal: 16, marginTop: 14 }}>
          <Card pad={12} onPress={() => nav.push('Partner', { id: post.partner })} label={`Ver ${PARTNERS[post.partner].name}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <PartnerMark partner={post.partner} size={40} />
            <View style={{ flex: 1 }}>
              <T kind="body" style={{ fontWeight: '600' }}>{PARTNERS[post.partner].name}</T>
              <T kind="sub">Marcado neste post · {PARTNERS[post.partner].area}</T>
            </View>
            <Btn small full={false} title="Agendar" onPress={() => nav.push('Booking', { partner: post.partner })} />
          </Card>
        </View>
      ) : null}
      <View style={{ paddingHorizontal: 16, marginTop: 18 }}>
        <Segmented value={tab} onChange={setTab} options={[{ key: 'comentarios', label: `Comentários (${comments.length})` }, { key: 'patinhas', label: 'Patinhas' }]} />
      </View>
      {tab === 'comentarios' ? (
        <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
          {comments.map((c, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 10, paddingVertical: 10, marginLeft: c.reply ? 40 : 0 }}>
              <Tap onPress={() => nav.push('PetProfile', { pet: c.pet })} label={`Perfil de ${PETS[c.pet].name}`}><PetAvatar pet={c.pet} size={30} ring={1.5} gap={1.5} /></Tap>
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.c.text, fontSize: 15, lineHeight: 20 }}><Text style={{ fontWeight: '600' }}>{PETS[c.pet].name}  </Text>{c.text}</Text>
                <View style={{ flexDirection: 'row', gap: 14, marginTop: 4 }}>
                  <T kind="small">{c.time}</T>
                  <T kind="small" style={{ fontWeight: '600' }}>Responder</T>
                </View>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Icon name="paw" size={16} color={t.c.text2} />
                {c.paws ? <T kind="small">{c.paws}</T> : null}
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
          {OTHER_PETS.concat(MY_PETS).slice(0, 8).map((k) => (
            <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 }}>
              <Tap onPress={() => nav.push('PetProfile', { pet: k })} label={PETS[k].name}><PetAvatar pet={k} size={40} /></Tap>
              <View style={{ flex: 1 }}>
                <T kind="body" style={{ fontWeight: '600' }}>{PETS[k].name}</T>
                <T kind="sub">{PETS[k].breed}</T>
              </View>
              {PETS[k].mine ? null : (
                <Btn small full={false} kind={s.following[k] ? 'secondary' : 'primary'} title={s.following[k] ? 'Seguindo' : 'Seguir'} onPress={() => s.toggleFollow(k)} />
              )}
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}

// ——— Histórias ———

export function StoryScreen({ pet }) {
  const nav = useNav();
  const ins = useInsets();
  const { width } = useWindowDimensions();
  const order = STORIES;
  const [idx, setIdx] = useState(Math.max(0, order.indexOf(pet)));
  const v = useRef(new Animated.Value(0)).current;
  const k = order[idx];
  const p = PETS[k];
  useEffect(() => {
    v.setValue(0);
    const a = Animated.timing(v, { toValue: 1, duration: 5000, easing: Easing.linear, useNativeDriver: false });
    a.start(({ finished }) => finished && next());
    return () => a.stop();
  }, [idx]);
  const next = () => (idx < order.length - 1 ? setIdx(idx + 1) : nav.back());
  const prev = () => (idx > 0 ? setIdx(idx - 1) : null);
  return (
    <View style={{ flex: 1, backgroundColor: '#0D0C0B', paddingTop: ins.top }}>
      <View style={{ flexDirection: 'row', gap: 4, paddingHorizontal: 10, paddingTop: 8 }}>
        {order.map((o, i) => (
          <View key={o} style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)', overflow: 'hidden' }}>
            <Animated.View style={{ height: 3, backgroundColor: '#FFF', width: i < idx ? '100%' : i > idx ? '0%' : v.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }} />
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 }}>
        <PetAvatar pet={k} size={34} ring={1.5} gap={1.5} ringColor="#FFFFFF" />
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 15 }}>{p.name}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12.5 }}>{p.area} · {idx + 1} h</Text>
        </View>
        <Tap onPress={nav.back} label="Fechar história" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="close" size={24} color="#FFF" />
        </Tap>
      </View>
      <View style={{ flex: 1, marginHorizontal: 6, borderRadius: 18, overflow: 'hidden' }}>
        <Photo name={p.photo} style={{ width: '100%', height: '100%' }} />
        <View style={[StyleSheet.absoluteFill, { flexDirection: 'row' }]}>
          <Tap onPress={prev} hitSlop={0} scale={1} outerStyle={{ flex: 1 }} style={{ flex: 1 }} label="História anterior" />
          <Tap onPress={next} hitSlop={0} scale={1} outerStyle={{ flex: 2 }} style={{ flex: 1 }} label="Próxima história" />
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, paddingBottom: ins.bottom + 12 }}>
        <View style={{ flex: 1, height: 46, borderRadius: 23, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)', justifyContent: 'center', paddingHorizontal: 16 }}>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15 }}>Responder para {p.name}</Text>
        </View>
        <Icon name="paw" size={28} color="#FFF" />
        <Icon name="send" size={26} color="#FFF" />
      </View>
    </View>
  );
}

// ——— Criar post ———

const GALLERY = ['pacoca', 'pacoca2', 'dupla', 'filhotes', 'luna', 'luna2', 'amora', 'amora2', 'nina', 'pipoca', 'amigos', 'bidu'];

export function NewPostScreen({ photo: initialPhoto, partner: initialPartner, caption: initialCaption }) {
  const t = useTheme();
  const s = useStore();
  const nav = useNav();
  const { width } = useWindowDimensions();
  const [step, setStep] = useState(initialPhoto ? 'details' : 'pick');
  const [picked, setPicked] = useState(initialPhoto ? [initialPhoto] : []);
  const [crop, setCrop] = useState('1:1');
  const [caption, setCaption] = useState(initialCaption || '');
  const [pets, setPets] = useState([s.petKey]);
  const [partner, setPartner] = useState(initialPartner || null);
  const [place, setPlace] = useState(initialPartner ? PARTNERS[initialPartner].area : 'Perdizes');
  const [audience, setAudience] = useState('Todos');
  const cell = (Math.min(width, 520) - 4) / 3;

  if (step === 'pick') {
    return (
      <Screen title="Nova publicação" pad={false}
        right={<Tap onPress={() => picked.length && setStep('details')} label="Avançar" style={{ height: 44, justifyContent: 'center', paddingHorizontal: 10 }}>
          <Text style={{ color: picked.length ? t.toneText : t.c.text2, fontSize: 16, fontWeight: '600' }}>Avançar</Text></Tap>}>
        <View style={{ aspectRatio: crop === '1:1' ? 1 : 4 / 5, maxWidth: '100%', backgroundColor: t.c.surface2 }}>
          {picked[0] ? <Photo name={picked[0]} style={{ width: '100%', height: '100%' }} /> : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Icon name="image" size={44} color={t.c.text2} /><T kind="sub" style={{ marginTop: 8 }}>Escolha até 10 fotos ou um vídeo de até 60 s</T></View>
          )}
          {picked.length > 1 ? <View style={{ position: 'absolute', top: 12, right: 12 }}><Pill text={`${picked.length} fotos`} color="#FFF" bg="rgba(20,16,12,0.6)" /></View> : null}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8 }}>
          <Chip title="1:1" active={crop === '1:1'} onPress={() => setCrop('1:1')} />
          <Chip title="4:5" active={crop === '4:5'} onPress={() => setCrop('4:5')} />
          <View style={{ flex: 1 }} />
          <Btn small full={false} kind="secondary" icon="camera" title="Câmera" onPress={() => { setPicked(['pacoca']); s.toast('Foto tirada'); }} />
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 2 }}>
          {GALLERY.map((g, i) => {
            const n = picked.indexOf(g);
            return (
              <Tap key={g + i} onPress={() => setPicked((p) => (p.includes(g) ? p.filter((x) => x !== g) : [...p, g].slice(0, 10)))} hitSlop={0} scale={0.97} label="Foto da galeria">
                <Photo name={g} style={{ width: cell, height: cell, opacity: n >= 0 ? 0.75 : 1 }} />
                {n >= 0 ? (
                  <View style={{ position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: 13, backgroundColor: t.tone, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFF' }}>
                    <Text style={{ color: t.onTone, fontWeight: '700', fontSize: 13 }}>{n + 1}</Text>
                  </View>
                ) : null}
                {i === 3 ? <View style={{ position: 'absolute', bottom: 6, left: 6 }}><Pill text="0:18" color="#FFF" bg="rgba(20,16,12,0.6)" icon="play" /></View> : null}
              </Tap>
            );
          })}
        </View>
      </Screen>
    );
  }

  const publish = () => {
    s.addPost({
      type: picked.length > 1 ? 'carousel' : 'photo', pet: pets[0], partner, place, photos: picked, ratio: crop === '1:1' ? 1 : 4 / 5,
      caption: caption.trim() || ' ', audience,
    });
    s.toast('Post publicado');
    nav.resetTo('inicio');
  };

  return (
    <Screen title="Detalhes" keyboard footer={<Btn title="Publicar" onPress={publish} />}>
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
        <Photo name={picked[0]} style={{ width: 84, height: 84, borderRadius: 14 }} />
        <Field value={caption} onChangeText={setCaption} placeholder="Escreva uma legenda..." multiline style={{ flex: 1 }} />
      </View>
      <Section title="Pets na foto">
        <ChipRow>
          {MY_PETS.map((k) => (
            <Chip key={k} title={PETS[k].name} active={pets.includes(k)} onPress={() => setPets((p) => (p.includes(k) ? (p.length > 1 ? p.filter((x) => x !== k) : p) : [...p, k]))} />
          ))}
        </ChipRow>
      </Section>
      <Section title="Marcar parceiro">
        <ChipRow>
          <Chip title="Nenhum" active={!partner} onPress={() => setPartner(null)} />
          {PARTNER_ORDER.slice(0, 5).map((k) => <Chip key={k} title={PARTNERS[k].name} active={partner === k} onPress={() => { setPartner(k); setPlace(PARTNERS[k].area); }} />)}
        </ChipRow>
      </Section>
      <Section title="Local">
        <Field value={place} onChangeText={setPlace} icon="pin" placeholder="Bairro ou lugar" />
        <T kind="small" style={{ marginTop: 6, marginLeft: 4 }}>Mostramos só o bairro ou o lugar, nunca o seu endereço.</T>
      </Section>
      <Section title="Quem pode ver">
        <Segmented value={audience} onChange={setAudience} options={['Todos', 'Seguidores', 'Família']} />
      </Section>
    </Screen>
  );
}

// ——— Registrar cuidado ———

const CARE_KINDS = [
  { key: 'peso', label: 'Peso', icon: 'scale' },
  { key: 'vacina', label: 'Vacina', icon: 'syringe' },
  { key: 'remedio', label: 'Remédio', icon: 'pill' },
  { key: 'passeio', label: 'Passeio', icon: 'walk' },
];

export function CareLogScreen({ kind: initialKind }) {
  const t = useTheme();
  const s = useStore();
  const nav = useNav();
  const [kind, setKind] = useState(initialKind || 'passeio');
  const [pet, setPet] = useState(s.petKey);
  const [value, setValue] = useState('');
  const [mins, setMins] = useState(30);
  const [note, setNote] = useState('');
  const save = () => {
    const label = { peso: `Peso: ${value || '14,2'} kg`, vacina: `Vacina: ${value || 'V10'}`, remedio: `Remédio: ${value || 'Vermífugo'}`, passeio: `Passeio de ${mins} min` }[kind];
    s.addRecord({ pet, kind, label, note });
    s.toast(kind === 'passeio' ? `Sequência de passeios: 13 dias` : 'Registrado na carteirinha');
    nav.back();
  };
  return (
    <Screen big="Registrar cuidado" sub="Fica na carteirinha e na agenda do pet" footer={<Btn title="Salvar registro" onPress={save} />} keyboard>
      <Section title="Pet">
        <ChipRow>{MY_PETS.map((k) => <Chip key={k} title={PETS[k].name} active={pet === k} onPress={() => setPet(k)} />)}</ChipRow>
      </Section>
      <Section title="O que você quer registrar?">
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {CARE_KINDS.map((c) => {
            const on = kind === c.key;
            return (
              <Tap key={c.key} onPress={() => setKind(c.key)} outerStyle={{ flex: 1 }} label={c.label}
                style={{ height: 88, borderRadius: 18, backgroundColor: on ? alpha(t.tone, 0.16) : t.c.surface, borderWidth: 1.5, borderColor: on ? t.tone : 'transparent', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Icon name={c.icon} size={26} color={on ? t.toneText : t.c.text} />
                <Text style={{ fontSize: 13.5, color: t.c.text, fontWeight: on ? '600' : '400' }}>{c.label}</Text>
              </Tap>
            );
          })}
        </View>
      </Section>
      <Section title="Detalhes">
        {kind === 'passeio' ? (
          <Card style={{ alignItems: 'center' }}>
            <T kind="sub">Duração</T>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 24, marginTop: 8 }}>
              <Tap onPress={() => setMins(Math.max(5, mins - 5))} label="Menos 5 minutos" style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: t.c.surface2, alignItems: 'center', justifyContent: 'center' }}><Icon name="minus" size={22} color={t.c.text} /></Tap>
              <Text style={{ fontFamily: t.fonts.titleStrong, fontSize: 44, color: t.c.text, minWidth: 110, textAlign: 'center' }}>{mins} min</Text>
              <Tap onPress={() => setMins(mins + 5)} label="Mais 5 minutos" style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: t.c.surface2, alignItems: 'center', justifyContent: 'center' }}><Icon name="plus" size={22} color={t.c.text} /></Tap>
            </View>
          </Card>
        ) : (
          <Field value={value} onChangeText={setValue} keyboardType={kind === 'peso' ? 'decimal-pad' : 'default'}
            placeholder={{ peso: 'Ex.: 14,2 kg', vacina: 'Ex.: V10, antirrábica', remedio: 'Ex.: Vermífugo, 1 comprimido' }[kind]} icon={CARE_KINDS.find((c) => c.key === kind).icon} />
        )}
        <Field value={note} onChangeText={setNote} placeholder="Observação (opcional)" multiline style={{ marginTop: 10 }} />
      </Section>
      {kind === 'remedio' ? <Note icon="bell" style={{ marginTop: 16 }}>Quer um lembrete? Depois de salvar, ative a repetição na agenda de cuidados.</Note> : null}
    </Screen>
  );
}

// ——— Notificações ———

export function NotificationsScreen() {
  const t = useTheme();
  const nav = useNav();
  const [filter, setFilter] = useState('Tudo');
  const groups = NOTIFICATIONS.filter((g) => filter === 'Tudo' || g.group === filter);
  return (
    <Screen big="Notificações" sub="Agrupadas por tipo">
      <ChipRow style={{ paddingTop: 10 }}>
        {['Tudo', ...NOTIFICATIONS.map((g) => g.group)].map((f) => <Chip key={f} title={f} active={filter === f} onPress={() => setFilter(f)} />)}
      </ChipRow>
      {groups.map((g) => (
        <Section key={g.group} title={g.group}>
          <Group>
            {g.items.map((n, i) => (
              <Row key={i} onPress={() => nav.push(n.go[0], n.go[1])} title={n.title} sub={`${n.text} · ${n.time}`} chevron={false}
                left={n.pet ? <PetAvatar pet={n.pet} size={34} ring={1.5} gap={1.5} /> : (
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: n.alert ? alpha('#C2453A', 0.14) : alpha(t.tone, 0.15), alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={n.icon} size={20} color={n.alert ? (t.dark ? '#F08A80' : '#A8332A') : t.toneText} />
                  </View>
                )}
                right={n.tone ? <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: t.tone }} /> : null}
              />
            ))}
          </Group>
        </Section>
      ))}
      <Tap onPress={() => nav.push('Settings', { section: 'notificacoes' })} label="Escolher o que receber" style={{ alignItems: 'center', paddingVertical: 20 }}>
        <Text style={{ color: t.toneText, fontWeight: '600', fontSize: 15 }}>Escolher o que receber</Text>
      </Tap>
    </Screen>
  );
}

// ——— Busca global ———

export function SearchScreen() {
  const t = useTheme();
  const nav = useNav();
  const s = useStore();
  const [q, setQ] = useState('');
  const [tab, setTab] = useState('Tudo');
  const term = q.trim().toLowerCase();
  const pets = [...OTHER_PETS, ...MY_PETS].filter((k) => !term || PETS[k].name.toLowerCase().includes(term) || (PETS[k].breed || '').toLowerCase().includes(term));
  const partners = PARTNER_ORDER.filter((k) => !term || PARTNERS[k].name.toLowerCase().includes(term) || PARTNERS[k].area.toLowerCase().includes(term));
  const mats = MATILHAS.filter((m) => !term || m.name.toLowerCase().includes(term));
  const tutors = OTHER_PETS.map((k) => ({ name: PETS[k].tutor, pet: k })).filter((x) => !term || x.name.toLowerCase().includes(term));
  const show = (k) => tab === 'Tudo' || tab === k;
  const none = !pets.length && !partners.length && !mats.length && !tutors.length;
  return (
    <Screen title="Buscar" keyboard>
      <Field value={q} onChangeText={setQ} placeholder="Pets, tutores, matilhas e parceiros" icon="search" autoFocus
        right={q ? <Tap onPress={() => setQ('')} label="Limpar busca"><Icon name="close" size={18} color={t.c.text2} /></Tap> : null} />
      <ChipRow style={{ paddingTop: 12 }}>
        {['Tudo', 'Pets', 'Tutores', 'Matilhas', 'Parceiros'].map((f) => <Chip key={f} title={f} active={tab === f} onPress={() => setTab(f)} />)}
      </ChipRow>
      {none ? <Empty icon="search" title="Nada por aqui" text={`Não achamos nada para "${q}". Tente o nome do pet, a raça ou o bairro.`} /> : null}
      {!term && tab === 'Tudo' ? (
        <Section title="Buscas recentes">
          <ChipRow>{['banho e tosa', 'golden', 'Parque da Água Branca', 'vacina gato'].map((r) => <Chip key={r} title={r} icon="clock" onPress={() => setQ(r)} />)}</ChipRow>
        </Section>
      ) : null}
      {show('Pets') && pets.length ? (
        <Section title="Pets">
          <Group>
            {pets.slice(0, tab === 'Pets' ? 20 : 4).map((k) => (
              <Row key={k} left={<PetAvatar pet={k} size={36} />} title={PETS[k].name} sub={PETS[k].breed} onPress={() => nav.push('PetProfile', { pet: k })} />
            ))}
          </Group>
        </Section>
      ) : null}
      {show('Parceiros') && partners.length ? (
        <Section title="Parceiros">
          <Group>
            {partners.slice(0, tab === 'Parceiros' ? 20 : 3).map((k) => (
              <Row key={k} left={<PartnerMark partner={k} size={40} />} title={PARTNERS[k].name} sub={`${CATEGORIES.find((c) => c.key === PARTNERS[k].category).label} · ${PARTNERS[k].distance} · ★ ${PARTNERS[k].rating}`} onPress={() => nav.push('Partner', { id: k })} />
            ))}
          </Group>
        </Section>
      ) : null}
      {show('Matilhas') && mats.length ? (
        <Section title="Matilhas">
          <Group>
            {mats.map((m) => (
              <Row key={m.key} left={<View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: m.color, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#FFF', fontWeight: '600' }}>{m.initials}</Text></View>}
                title={m.name} sub={`${m.members} membros`} onPress={() => nav.push('Matilha', { key: m.key })} />
            ))}
          </Group>
        </Section>
      ) : null}
      {show('Tutores') && tutors.length ? (
        <Section title="Tutores">
          <Group>
            {tutors.slice(0, tab === 'Tutores' ? 20 : 3).map((x) => (
              <Row key={x.name} left={<Who name={x.name} size={40} />} title={x.name} sub={`Tutor ${PETS[x.pet].article} ${PETS[x.pet].name}`} onPress={() => nav.push('PetProfile', { pet: x.pet })} />
            ))}
          </Group>
        </Section>
      ) : null}
    </Screen>
  );
}

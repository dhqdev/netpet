import React, { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Icon } from '../icons';
import { useTheme, alpha } from '../theme';
import { useStore } from '../store';
import { useNav } from '../nav';
import {
  Screen, T, Btn, Card, Section, Group, Row, Chip, ChipRow, Segmented, Field, Tap, Photo, PetAvatar, PartnerMark, Pill, StatePill,
  Empty, Note, useInsets, NavHeader, IconTile, RoleBadge, Who, Toggle, RoundButton, InitialAvatar,
} from '../kit';
import { PETS, PARTNERS, MATILHAS, DISCOVER_MATILHAS, CHANNEL_MESSAGES, THREAD_REPLIES, DMS, DM_THREAD, LOST_ALERT, MY_PETS } from '../data';

const ALL_MATILHAS = [...MATILHAS, ...DISCOVER_MATILHAS.map((m) => ({ ...m, online: 12, channels: [{ key: 'geral', name: 'geral', unread: 0 }, { key: 'fotos', name: 'fotos', unread: 0 }] }))];
const findMatilha = (k) => ALL_MATILHAS.find((m) => m.key === k) || MATILHAS[0];

function MatilhaMark({ m, size = 48, active, onPress }) {
  const t = useTheme();
  const box = (
    <View style={{ width: size, height: size, borderRadius: active ? size * 0.32 : size / 2, backgroundColor: m.color, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: size * 0.32 }}>{m.initials}</Text>
    </View>
  );
  if (!onPress) return box;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ width: 4, height: active ? 36 : 0, borderTopRightRadius: 3, borderBottomRightRadius: 3, backgroundColor: t.c.text, marginRight: 8 }} />
      <Tap onPress={onPress} label={m.name}>{box}</Tap>
    </View>
  );
}

// ——— Aba Matilhas: trilho de matilhas à esquerda e canais ao lado ———

export function MatilhasHome() {
  const t = useTheme();
  const s = useStore();
  const nav = useNav();
  const ins = useInsets();
  const mine = ALL_MATILHAS.filter((m) => s.joined.includes(m.key));
  const [sel, setSel] = useState(mine[0] ? mine[0].key : null);
  const [view, setView] = useState('matilhas');
  const m = sel ? findMatilha(sel) : null;
  const dmUnread = DMS.reduce((a, d) => a + (d.unread || 0), 0);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 10 }}>
        <View style={{ flex: 1 }}>
          <T kind="display">Matilhas</T>
          <T kind="sub">Comunidades e mensagens</T>
        </View>
        <RoundButton icon="search" label="Descobrir matilhas" onPress={() => nav.push('Discover')} />
      </View>
      <View style={{ paddingHorizontal: 16, paddingBottom: 10 }}>
        <Segmented value={view} onChange={setView} options={[{ key: 'matilhas', label: 'Matilhas' }, { key: 'mensagens', label: dmUnread ? `Mensagens · ${dmUnread}` : 'Mensagens' }]} />
      </View>
      {view === 'mensagens' ? <DmList /> : (
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <ScrollView style={{ width: 76, flexGrow: 0 }} contentContainerStyle={{ paddingTop: 6, paddingBottom: 120, gap: 10 }} showsVerticalScrollIndicator={false}>
            {mine.map((x) => <MatilhaMark key={x.key} m={x} active={sel === x.key} onPress={() => setSel(x.key)} />)}
            <View style={{ flexDirection: 'row', paddingLeft: 12 }}>
              <Tap onPress={() => nav.push('CreateMatilha')} label="Criar matilha" style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: t.c.surface, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="plus" size={22} color={t.toneText} />
              </Tap>
            </View>
            <View style={{ flexDirection: 'row', paddingLeft: 12 }}>
              <Tap onPress={() => nav.push('Discover')} label="Descobrir matilhas" style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: t.c.surface, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="globe" size={22} color={t.toneText} />
              </Tap>
            </View>
          </ScrollView>
          <View style={{ flex: 1, backgroundColor: t.c.surface, borderTopLeftRadius: 24, overflow: 'hidden' }}>
            {m ? (
              <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
                <Tap onPress={() => nav.push('Matilha', { key: m.key })} label={`Sobre ${m.name}`} style={{ padding: 16, paddingBottom: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <T kind="h" style={{ flex: 1 }} numberOfLines={1}>{m.name}</T>
                    <Icon name="chevRight" size={18} color={t.c.text2} />
                  </View>
                  <T kind="small">{m.members} membros · {m.online} online</T>
                </Tap>
                {m.key === 'viralatas' || m.key === 'perdizes' ? (
                  <Tap onPress={() => nav.push('Lost')} label="Ver alerta de pet perdido" style={{ marginHorizontal: 12, marginBottom: 8, padding: 12, borderRadius: 16, backgroundColor: alpha('#C2453A', t.dark ? 0.22 : 0.1), flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                    <Icon name="alert" size={20} color={t.dark ? '#F08A80' : '#A8332A'} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: t.dark ? '#F08A80' : '#A8332A', fontWeight: '600', fontSize: 14 }}>Pet perdido perto de você</Text>
                      <T kind="small">{LOST_ALERT.pet}, {LOST_ALERT.breed.toLowerCase()} · {LOST_ALERT.when}</T>
                    </View>
                  </Tap>
                ) : null}
                <T kind="label" style={{ paddingHorizontal: 16, marginTop: 6, marginBottom: 4 }}>Canais</T>
                {m.channels.map((c) => (
                  <Tap key={c.key} onPress={() => nav.push('Channel', { matilha: m.key, channel: c.key })} hitSlop={0} scale={0.98} label={`Canal ${c.name}`}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, marginHorizontal: 6, height: 46, borderRadius: 12 }}>
                    <Icon name={c.locked ? 'lock' : c.alert ? 'alert' : 'hash'} size={18} color={c.unread ? t.c.text : t.c.text2} />
                    <Text style={{ flex: 1, fontSize: 15.5, color: c.unread ? t.c.text : t.c.text2, fontWeight: c.unread ? '600' : '400' }}>{c.name}</Text>
                    {c.unread ? (
                      <View style={{ minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6, backgroundColor: c.alert ? '#C2453A' : t.tone, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: c.alert ? '#FFF' : t.onTone, fontSize: 12, fontWeight: '700' }}>{c.unread}</Text>
                      </View>
                    ) : null}
                  </Tap>
                ))}
                <T kind="label" style={{ paddingHorizontal: 16, marginTop: 18, marginBottom: 8 }}>Online agora</T>
                {['mel', 'thor', 'bidu', 'nina'].map((k) => (
                  <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 6 }}>
                    <PetAvatar pet={k} size={30} ring={1.5} gap={1.5} status />
                    <View style={{ flex: 1 }}>
                      <T kind="body" style={{ fontSize: 14.5 }}>{PETS[k].name}</T>
                      <T kind="small">{PETS[k].status || 'online'}</T>
                    </View>
                  </View>
                ))}
              </ScrollView>
            ) : <Empty icon="users" title="Entre numa matilha" text="Matilhas reúnem tutores por raça, bairro ou interesse." action="Descobrir" onAction={() => nav.push('Discover')} />}
          </View>
        </View>
      )}
    </View>
  );
}

export function DmList() {
  const t = useTheme();
  const nav = useNav();
  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}>
      <Group>
        {DMS.map((d) => (
          <Row key={d.key} onPress={() => nav.push('Dm', { key: d.key })} chevron={false}
            left={d.partner ? <PartnerMark partner={d.partner} size={44} /> : <PetAvatar pet={d.pet} size={40} />}
            title={d.name} sub={d.last} numberOfLines={1}
            right={(
              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                <T kind="small">{d.time}</T>
                {d.unread ? <View style={{ minWidth: 20, height: 20, borderRadius: 10, backgroundColor: t.tone, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 }}><Text style={{ color: t.onTone, fontSize: 11.5, fontWeight: '700' }}>{d.unread}</Text></View> : null}
              </View>
            )} />
        ))}
      </Group>
    </ScrollView>
  );
}

export function DmsScreen() {
  return (
    <Screen big="Mensagens" sub="Tutores e parceiros" pad={false}>
      <View style={{ height: 12 }} />
      <DmList />
    </Screen>
  );
}

// ——— Conversa de canal ———

function Message({ msg, onReply, onReact }) {
  const t = useTheme();
  const nav = useNav();
  return (
    <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 8 }}>
      <Tap onPress={() => (msg.pet ? nav.push('PetProfile', { pet: msg.pet }) : msg.partner ? nav.push('Partner', { id: msg.partner }) : null)} label={msg.who}>
        <Who pet={msg.pet} partner={msg.partner} name={msg.who} size={38} />
      </Tap>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <Text style={{ color: t.c.text, fontWeight: '600', fontSize: 15 }}>{msg.who}</Text>
          {msg.pet && !msg.me ? <T kind="small">tutor {PETS[msg.pet].article} {PETS[msg.pet].name}</T> : null}
          <T kind="small">{msg.time}</T>
        </View>
        {msg.role ? <View style={{ marginTop: 3 }}><RoleBadge role={msg.role} /></View> : null}
        <T kind="body" style={{ marginTop: 3 }}>{msg.text}</T>
        {msg.photo ? <Photo name={msg.photo} style={{ width: 220, height: 220, borderRadius: 14, marginTop: 8 }} /> : null}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
          {(msg.reactions || []).map(([e, n]) => (
            <Tap key={e} onPress={() => onReact && onReact(msg.id, e)} label={`Reagir com ${e}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, height: 28, paddingHorizontal: 8, borderRadius: 14, backgroundColor: t.c.surface2 }}>
              <Text style={{ fontSize: 13 }}>{e}</Text>
              <Text style={{ fontSize: 12.5, color: t.c.text2 }}>{n}</Text>
            </Tap>
          ))}
          {onReply ? (
            <Tap onPress={() => onReply(msg)} label="Responder em fio" style={{ flexDirection: 'row', alignItems: 'center', gap: 4, height: 28, paddingHorizontal: 8 }}>
              <Icon name="reply" size={15} color={t.toneText} />
              <Text style={{ color: t.toneText, fontSize: 13, fontWeight: '600' }}>{msg.replies ? `${msg.replies} respostas` : 'Responder'}</Text>
            </Tap>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export function Composer({ placeholder, onSend }) {
  const t = useTheme();
  const ins = useInsets();
  const [text, setText] = useState('');
  const send = () => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
  };
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingTop: 10, paddingBottom: Math.max(ins.bottom, 10), backgroundColor: t.c.surface, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.c.line }}>
      <Tap label="Anexar foto" style={{ width: 40, height: 44, alignItems: 'center', justifyContent: 'center' }}><Icon name="image" size={22} color={t.c.text2} /></Tap>
      <TextInput value={text} onChangeText={setText} onSubmitEditing={send} placeholder={placeholder} placeholderTextColor={t.c.text2} accessibilityLabel={placeholder}
        style={{ flex: 1, minHeight: 44, borderRadius: 22, backgroundColor: t.c.surface2, paddingHorizontal: 16, color: t.c.text, fontSize: 15, outlineStyle: 'none' }} />
      <Tap onPress={send} label="Enviar" style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: text.trim() ? t.tone : t.c.surface2, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="send" size={20} color={text.trim() ? t.onTone : t.c.text2} />
      </Tap>
    </View>
  );
}

export function ChannelScreen({ matilha = 'viralatas', channel = 'dicas' }) {
  const t = useTheme();
  const s = useStore();
  const nav = useNav();
  const m = findMatilha(matilha);
  const c = m.channels.find((x) => x.key === channel) || m.channels[0];
  const key = `${matilha}/${channel}`;
  const msgs = s.messages[key] || (channel === 'fotos' ? CHANNEL_MESSAGES.filter((x) => x.photo) : []);
  const pinned = msgs.find((x) => x.pinned);
  const scroller = useRef(null);
  if (c.alert && channel === 'perdidos') {
    return (
      <Screen title={`# ${c.name}`}>
        <Note icon="alert" style={{ marginTop: 8 }}>Neste canal só entram alertas de pet perdido e encontrado. Eles também chegam como notificação para quem está num raio de 2 km.</Note>
        <View style={{ marginTop: 14 }}><LostCard /></View>
        <Btn title="Avisar que perdi meu pet" kind="danger" icon="alert" style={{ marginTop: 16 }} onPress={() => nav.push('LostCreate')} />
      </Screen>
    );
  }
  return (
    <View style={{ flex: 1, backgroundColor: t.c.bg }}>
      <NavHeader title={`# ${c.name}`} right={<Tap onPress={() => nav.push('Matilha', { key: m.key })} label="Membros e regras" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><Icon name="users" size={22} color={t.c.text} /></Tap>} />
      <T kind="small" center style={{ marginTop: -8, marginBottom: 6 }}>{m.name}</T>
      {pinned ? (
        <Tap onPress={() => nav.push('Thread', { matilha, channel, id: pinned.id })} label="Mensagem fixada" style={{ marginHorizontal: 12, marginBottom: 6, padding: 10, borderRadius: 14, backgroundColor: t.c.surface, flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <Icon name="pinned" size={16} color={t.toneText} />
          <Text numberOfLines={1} style={{ flex: 1, color: t.c.text2, fontSize: 13.5 }}><Text style={{ color: t.c.text, fontWeight: '600' }}>Fixada: </Text>{pinned.text}</Text>
        </Tap>
      ) : null}
      <ScrollView ref={scroller} onContentSizeChange={() => scroller.current && scroller.current.scrollToEnd({ animated: false })} contentContainerStyle={{ paddingVertical: 8 }}>
        <View style={{ alignItems: 'center', paddingVertical: 16, paddingHorizontal: 24 }}>
          <IconTile icon="hash" size={56} />
          <T kind="title" center style={{ marginTop: 10 }}>Boas-vindas ao #{c.name}</T>
          <T kind="sub" center>Seja gentil. Dicas de saúde não substituem o veterinário.</T>
        </View>
        {msgs.map((msg) => <Message key={msg.id} msg={msg} onReply={(x) => nav.push('Thread', { matilha, channel, id: x.id })} />)}
        {!msgs.length ? <Empty compact icon="chat" title="Ninguém falou ainda" text="Comece a conversa com uma foto ou uma pergunta." /> : null}
      </ScrollView>
      <Composer placeholder={`Mensagem em #${c.name}`} onSend={(text) => s.sendMessage(key, { who: 'David', pet: s.petKey, text, me: true })} />
    </View>
  );
}

export function ThreadScreen({ matilha = 'viralatas', channel = 'dicas', id = 'm1' }) {
  const t = useTheme();
  const s = useStore();
  const key = `${matilha}/${channel}`;
  const root = (s.messages[key] || CHANNEL_MESSAGES).find((x) => x.id === id) || CHANNEL_MESSAGES[0];
  const [replies, setReplies] = useState(THREAD_REPLIES);
  return (
    <View style={{ flex: 1, backgroundColor: t.c.bg }}>
      <NavHeader title="Fio" />
      <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
        <Message msg={root} />
        <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: t.c.line, marginVertical: 6, marginHorizontal: 16 }} />
        <T kind="small" style={{ paddingHorizontal: 16, paddingVertical: 4 }}>{replies.length} respostas</T>
        {replies.map((r, i) => <Message key={i} msg={r} />)}
      </ScrollView>
      <Composer placeholder="Responder no fio" onSend={(text) => setReplies((x) => [...x, { who: 'David', pet: s.petKey, text, time: 'agora' }])} />
    </View>
  );
}

// ——— Mensagem direta ———

export function DmScreen({ id }) {
  const t = useTheme();
  const s = useStore();
  const nav = useNav();
  const k = id || 'bichoBom';
  const meta = DMS.find((d) => d.key === k) || (PARTNERS[k] ? { key: k, partner: k, name: PARTNERS[k].name, verified: true } : DMS[0]);
  const msgs = s.dms[k] || [{ me: false, text: meta.last || 'Oi!', time: meta.time || '' }];
  const scroller = useRef(null);
  return (
    <View style={{ flex: 1, backgroundColor: t.c.bg }}>
      <NavHeader title={meta.name} right={meta.partner ? (
        <Tap onPress={() => nav.push('Partner', { id: meta.partner })} label="Ver parceiro" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><Icon name="info" size={22} color={t.c.text} /></Tap>
      ) : (
        <Tap onPress={() => s.openSheet('more', { who: meta.name })} label="Mais opções" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><Icon name="more" size={22} color={t.c.text} /></Tap>
      )} />
      <ScrollView ref={scroller} onContentSizeChange={() => scroller.current && scroller.current.scrollToEnd({ animated: false })} contentContainerStyle={{ padding: 16, gap: 8 }}>
        <View style={{ alignItems: 'center', paddingBottom: 12 }}>
          {meta.partner ? <PartnerMark partner={meta.partner} size={60} /> : <PetAvatar pet={meta.pet} size={56} />}
          <T kind="h" style={{ marginTop: 8 }}>{meta.name}</T>
          {meta.partner ? <RoleBadge role="Parceiro verificado" /> : <T kind="small">Tutor {PETS[meta.pet].article} {PETS[meta.pet].name}</T>}
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
      <Composer placeholder="Mensagem" onSend={(text) => s.sendDm(k, text)} />
    </View>
  );
}

// ——— Sobre a matilha, membros, regras e moderação ———

export function MatilhaScreen({ id }) {
  const t = useTheme();
  const s = useStore();
  const nav = useNav();
  const m = findMatilha(id);
  const joined = s.joined.includes(m.key);
  const [confirmLeave, setConfirmLeave] = useState(false);
  return (
    <Screen title="" footer={joined ? (confirmLeave ? (
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Btn title="Ficar" kind="secondary" full={false} style={{ flex: 1 }} onPress={() => setConfirmLeave(false)} />
        <Btn title="Sair da matilha" kind="danger" full={false} style={{ flex: 1 }} onPress={() => { s.leaveMatilha(m.key); s.toast(`Você saiu de ${m.name}`); nav.back(); }} />
      </View>
    ) : <Btn title="Sair da matilha" kind="secondary" onPress={() => setConfirmLeave(true)} />) : (
      <Btn title="Entrar na matilha" onPress={() => { s.joinMatilha(m.key); s.toast(`Você entrou em ${m.name}`); }} />
    )}>
      <View style={{ alignItems: 'center' }}>
        <MatilhaMark m={m} size={84} active />
        <T kind="title" center style={{ marginTop: 12 }}>{m.name}</T>
        <T kind="sub" center>{m.kind} · {m.members} membros{m.online ? ` · ${m.online} online` : ''}</T>
        <T kind="body" center style={{ marginTop: 10, color: t.c.text2, maxWidth: 320 }}>{m.desc}</T>
      </View>
      <Section title="Regras">
        <Group>
          {['Respeito acima de tudo. Sem ataques a tutores ou pets.', 'Venda de animais é proibida. Adoção, sim.', 'Dicas de saúde não substituem o veterinário.', 'Alertas de pet perdido só no #perdidos.'].map((r, i) => (
            <Row key={i} left={<View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: t.c.surface2, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: t.c.text, fontWeight: '600' }}>{i + 1}</Text></View>} title={r} />
          ))}
        </Group>
      </Section>
      <Section title="Equipe">
        <Group>
          <Row left={<PetAvatar pet="bidu" size={34} />} title="Marina" sub="Tutora do Bidu" right={<RoleBadge role="Moderadora" />} />
          <Row left={<PartnerMark partner="quatroPatas" size={40} />} title="Dra. Helena" sub="Clínica Quatro Patas" right={<RoleBadge role="Veterinária verificada" />} />
          <Row left={<PartnerMark partner="bichoBom" size={40} />} title="Pet Shop Bicho Bom" sub="Vila Madalena" right={<RoleBadge role="Parceiro verificado" />} />
        </Group>
      </Section>
      <Section title="Membros">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
          {['mel', 'thor', 'frida', 'nina', 'pipoca', 'pacoca', 'luna', 'amora'].map((k) => (
            <Tap key={k} onPress={() => nav.push('PetProfile', { pet: k })} label={PETS[k].name} style={{ alignItems: 'center', width: 64 }}>
              <PetAvatar pet={k} size={48} />
              <T kind="small" style={{ marginTop: 4, color: t.c.text }}>{PETS[k].name}</T>
            </Tap>
          ))}
        </View>
      </Section>
      <Section title="Notificações e moderação">
        <Group>
          <Row icon="bell" title="Avisar de novas mensagens" right={<Toggle value label="Avisar" onChange={() => {}} />} />
          <Row icon="alert" title="Alertas de pet perdido" sub="Sempre ativos, são grátis" right={<Toggle value label="Alertas" onChange={() => {}} />} />
          <Row icon="flag" title="Denunciar a matilha" onPress={() => s.openSheet('report', { who: m.name })} />
        </Group>
      </Section>
    </Screen>
  );
}

export function DiscoverScreen() {
  const t = useTheme();
  const s = useStore();
  const nav = useNav();
  const [kind, setKind] = useState('Tudo');
  const list = ALL_MATILHAS.filter((m) => kind === 'Tudo' || m.kind === kind);
  return (
    <Screen big="Descobrir matilhas" sub="Por raça, bairro ou interesse" footer={<Btn title="Criar uma matilha" kind="secondary" icon="plus" onPress={() => nav.push('CreateMatilha')} />}>
      <ChipRow style={{ paddingTop: 12 }}>{['Tudo', 'Raça', 'Bairro', 'Interesse'].map((k) => <Chip key={k} title={k} active={kind === k} onPress={() => setKind(k)} />)}</ChipRow>
      <View style={{ gap: 12, marginTop: 14 }}>
        {list.map((m) => {
          const on = s.joined.includes(m.key);
          return (
            <Card key={m.key} onPress={() => nav.push('Matilha', { key: m.key })} label={m.name} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <MatilhaMark m={m} size={52} active />
              <View style={{ flex: 1 }}>
                <T kind="h">{m.name}</T>
                <T kind="sub" numberOfLines={2}>{m.desc}</T>
                <T kind="small" style={{ marginTop: 2 }}>{m.kind} · {m.members} membros</T>
              </View>
              <Btn small full={false} kind={on ? 'secondary' : 'primary'} title={on ? 'Dentro' : 'Entrar'} onPress={() => (on ? nav.push('Matilha', { key: m.key }) : (s.joinMatilha(m.key), s.toast(`Você entrou em ${m.name}`)))} />
            </Card>
          );
        })}
      </View>
    </Screen>
  );
}

export function CreateMatilhaScreen() {
  const t = useTheme();
  const s = useStore();
  const nav = useNav();
  const [name, setName] = useState('');
  const [kind, setKind] = useState('Bairro');
  const [privacy, setPrivacy] = useState('Aberta');
  const [channels, setChannels] = useState(['fotos', 'dicas', 'adoção', 'perdidos', 'encontros']);
  return (
    <Screen big="Nova matilha" keyboard footer={<Btn title="Criar matilha" disabled={!name.trim()} onPress={() => { s.toast(`${name} criada`); nav.back(); }} />}>
      <Field label="Nome" value={name} onChangeText={setName} placeholder="Ex.: Pets da Pompeia" style={{ marginTop: 12 }} />
      <Section title="Tipo"><Segmented value={kind} onChange={setKind} options={['Raça', 'Bairro', 'Interesse']} /></Section>
      <Section title="Quem pode entrar"><Segmented value={privacy} onChange={setPrivacy} options={['Aberta', 'Com aprovação']} /></Section>
      <Section title="Canais">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {['fotos', 'dicas', 'adoção', 'perdidos', 'encontros', 'saúde', 'trocas'].map((c) => (
            <Chip key={c} icon="hash" title={c} active={channels.includes(c)} onPress={() => setChannels((x) => (x.includes(c) ? x.filter((y) => y !== c) : [...x, c]))} />
          ))}
        </View>
      </Section>
      <Note style={{ marginTop: 16 }}>Você vira moderador e pode convidar outros. As regras básicas do netpet valem em todas as matilhas.</Note>
    </Screen>
  );
}

// ——— Alerta de pet perdido ———

function LostCard() {
  const t = useTheme();
  const red = t.dark ? '#F08A80' : '#A8332A';
  const a = LOST_ALERT;
  return (
    <Card pad={0} style={{ overflow: 'hidden', borderWidth: 2, borderColor: alpha('#C2453A', 0.5) }}>
      <Photo name={a.photo} style={{ width: '100%', height: 220 }} />
      <View style={{ padding: 16 }}>
        <StatePill state="late" icon="alert" text={`Perdido ${a.when}`} />
        <T kind="title" style={{ marginTop: 8 }}>{a.pet} · {a.breed}</T>
        <T kind="body" style={{ marginTop: 4 }}>Visto pela última vez: {a.lastSeen}</T>
        <T kind="sub" style={{ marginTop: 4 }}>{a.distance} · {a.detail}</T>
      </View>
    </Card>
  );
}

export function LostScreen() {
  const t = useTheme();
  const s = useStore();
  const nav = useNav();
  const a = LOST_ALERT;
  return (
    <Screen title="Pet perdido" footer={(
      <View style={{ gap: 8 }}>
        <Btn title="Vi este pet" icon="pin" onPress={() => { s.toast('A tutora recebeu a sua localização aproximada'); nav.back(); }} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Btn title="Mensagem" icon="chat" kind="secondary" full={false} style={{ flex: 1 }} onPress={() => nav.push('Dm', { key: 'camila' })} />
          <Btn title="Compartilhar" icon="share" kind="secondary" full={false} style={{ flex: 1 }} onPress={() => s.openSheet('share', {})} />
        </View>
      </View>
    )}>
      <LostCard />
      <Group style={{ marginTop: 14 }}>
        <Row icon="user" title={a.tutor} sub="Tutora" />
        <Row icon="phone" title={a.phone} sub="Contato liberado pela tutora para este alerta" />
      </Group>
      <Note icon="shieldCheck" style={{ marginTop: 14 }}>O alerta de pet perdido é sempre grátis e chega a todos num raio de 2 km. Ele sai do ar quando o pet é encontrado.</Note>
    </Screen>
  );
}

export function LostCreateScreen() {
  const t = useTheme();
  const s = useStore();
  const nav = useNav();
  const [pet, setPet] = useState(s.petKey);
  const [where, setWhere] = useState('');
  const [phone, setPhone] = useState(true);
  return (
    <Screen big="Avisar pet perdido" sub="O aviso chega a quem está perto, na hora" keyboard
      footer={<Btn title="Enviar alerta" kind="danger" icon="alert" onPress={() => { s.toast(`Alerta enviado para 1.240 tutores perto de você`); nav.back(); }} />}>
      <Section title="Qual pet?">
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {MY_PETS.map((k) => (
            <Tap key={k} onPress={() => setPet(k)} outerStyle={{ flex: 1 }} label={PETS[k].name}
              style={{ alignItems: 'center', paddingVertical: 12, borderRadius: 18, backgroundColor: pet === k ? alpha('#C2453A', 0.12) : t.c.surface, borderWidth: 1.5, borderColor: pet === k ? '#C2453A' : 'transparent' }}>
              <PetAvatar pet={k} size={46} />
              <T kind="body" style={{ marginTop: 6 }}>{PETS[k].name}</T>
            </Tap>
          ))}
        </View>
      </Section>
      <Section title="Onde e quando foi visto">
        <Field value={where} onChangeText={setWhere} placeholder="Ex.: Praça Marrey Júnior, há 20 min" icon="pin" />
      </Section>
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16 }}>
        <View style={{ flex: 1 }}>
          <T kind="body" style={{ fontWeight: '600' }}>Mostrar meu telefone</T>
          <T kind="sub">Só neste alerta, e some quando ele for encontrado</T>
        </View>
        <Toggle value={phone} onChange={setPhone} label="Mostrar telefone" />
      </Card>
    </Screen>
  );
}

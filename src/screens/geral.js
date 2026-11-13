import React, { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from '../icons';
import { useTheme, alpha, DIRECTIONS, DIRECTION_ORDER } from '../theme';
import { useStore } from '../store';
import { useNav } from '../nav';
import {
  Screen, T, Btn, Card, Section, Group, Row, Chip, ChipRow, Segmented, Field, Tap, PetAvatar, PartnerMark, Pill, StatePill,
  Empty, Note, useInsets, NavHeader, IconTile, Toggle, Skeleton, InitialAvatar,
} from '../kit';
import { ME, PETS, MY_PETS, PARTNERS } from '../data';

// ——— Assistente netpet ———
// Responde dúvidas do dia a dia. Nunca dá diagnóstico: em qualquer sinal de saúde, indica um veterinário.

const SUGGESTIONS = [
  'O Paçoca está coçando muito a orelha',
  'De quanto em quanto tempo dar banho?',
  'Quando é a próxima vacina?',
  'Ideias de passeio no fim de semana',
];

const HEALTH = /(coç|vomit|vômit|diarr|febre|sangue|manc|tosse|não come|nao come|dor|ferid|alerg|machuc|inchad|orelha|olho)/i;

function answerFor(q) {
  if (HEALTH.test(q)) {
    return {
      text: 'Isso merece o olhar de um veterinário. Não consigo dizer o que é, e alguns sinais parecidos têm causas bem diferentes. Enquanto isso, anote quando começou e se piora em algum momento, e evite dar remédio por conta própria.',
      vet: true,
    };
  }
  if (/banho/i.test(q)) {
    return { text: 'Para um cão de pelagem curta como o Paçoca, um banho a cada 15 dias costuma bastar. Banho demais resseca a pele. Entre um e outro, escovar duas vezes por semana ajuda muito.', go: ['Results', { category: 'banho' }], goLabel: 'Ver banho e tosa perto' };
  }
  if (/vacina/i.test(q)) {
    return { text: 'A próxima do Paçoca é a antirrábica, em 9 de dezembro. A carteirinha avisa você uma semana antes.', go: ['Carteirinha', { pet: 'pacoca' }], goLabel: 'Abrir carteirinha' };
  }
  if (/passeio|parque|fim de semana/i.test(q)) {
    return { text: 'O Parque da Água Branca fica a 1,4 km e tem área sombreada. A matilha Vira-latas de Perdizes marcou um encontro no domingo, 9h.', go: ['Channel', { matilha: 'viralatas', channel: 'encontros' }], goLabel: 'Ver o encontro' };
  }
  return { text: 'Posso ajudar com rotina, banho, passeios, vacinas e onde encontrar serviços perto de você. Para qualquer sinal de saúde, o melhor caminho é um veterinário.' };
}

export function AssistantScreen() {
  const t = useTheme();
  const nav = useNav();
  const s = useStore();
  const ins = useInsets();
  const p = PETS[s.petKey];
  const [msgs, setMsgs] = useState([{ me: false, text: `Oi, David! Sou o assistente do netpet. Pergunte qualquer coisa sobre a rotina ${p.article} ${p.name}.` }]);
  const [text, setText] = useState('');
  const scroller = useRef(null);
  const ask = (q) => {
    if (!q.trim()) return;
    setMsgs((m) => [...m, { me: true, text: q.trim() }, { me: false, ...answerFor(q) }]);
    setText('');
  };
  return (
    <View style={{ flex: 1, backgroundColor: t.c.bg }}>
      <NavHeader title="Assistente netpet" />
      <ScrollView ref={scroller} onContentSizeChange={() => scroller.current && scroller.current.scrollToEnd({ animated: true })} contentContainerStyle={{ padding: 16, gap: 10 }}>
        <Note icon="stethoscope">O assistente não faz diagnóstico nem substitui o veterinário. Em caso de emergência, procure uma clínica 24 horas.</Note>
        {msgs.map((m, i) => (
          <View key={i} style={{ alignSelf: m.me ? 'flex-end' : 'flex-start', maxWidth: '86%', gap: 8 }}>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
              {!m.me ? <IconTile icon="sparkle" size={30} /> : null}
              <View style={{ flexShrink: 1, backgroundColor: m.me ? t.tone : t.c.surface, borderRadius: 20, borderBottomRightRadius: m.me ? 6 : 20, borderBottomLeftRadius: m.me ? 20 : 6, paddingHorizontal: 14, paddingVertical: 10 }}>
                <Text style={{ color: m.me ? t.onTone : t.c.text, fontSize: 15.5, lineHeight: 21 }}>{m.text}</Text>
              </View>
            </View>
            {m.vet ? (
              <Card pad={12} style={{ marginLeft: 38 }} onPress={() => nav.push('Partner', { id: 'quatroPatas' })} label="Clínica Quatro Patas">
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <PartnerMark partner="quatroPatas" size={40} />
                  <View style={{ flex: 1 }}>
                    <T kind="h" style={{ fontSize: 15 }}>Clínica Quatro Patas</T>
                    <T kind="small">24 horas · 2,1 km · próximo horário amanhã, 9h</T>
                  </View>
                  <Icon name="chevRight" size={18} color={t.c.text2} />
                </View>
              </Card>
            ) : null}
            {m.go ? <Btn small full={false} kind="secondary" title={m.goLabel} onPress={() => nav.push(m.go[0], m.go[1])} style={{ marginLeft: 38 }} /> : null}
          </View>
        ))}
        {msgs.length < 3 ? (
          <View style={{ gap: 8, marginTop: 6 }}>
            <T kind="label" style={{ marginLeft: 4 }}>Experimente perguntar</T>
            {SUGGESTIONS.map((q) => (
              <Tap key={q} onPress={() => ask(q)} label={q} style={{ alignSelf: 'flex-start', borderRadius: 18, borderWidth: 1.2, borderColor: alpha(t.tone, 0.5), paddingHorizontal: 14, paddingVertical: 9 }}>
                <Text style={{ color: t.toneText, fontSize: 14.5 }}>{q}</Text>
              </Tap>
            ))}
          </View>
        ) : null}
      </ScrollView>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingTop: 10, paddingBottom: Math.max(ins.bottom, 10), backgroundColor: t.c.surface, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.c.line }}>
        <TextInput value={text} onChangeText={setText} onSubmitEditing={() => ask(text)} placeholder="Pergunte ao assistente" placeholderTextColor={t.c.text2} accessibilityLabel="Pergunte ao assistente"
          style={{ flex: 1, minHeight: 44, borderRadius: 22, backgroundColor: t.c.surface2, paddingHorizontal: 16, color: t.c.text, fontSize: 15, outlineStyle: 'none' }} />
        <Tap onPress={() => ask(text)} label="Enviar" style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: text.trim() ? t.tone : t.c.surface2, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="send" size={20} color={text.trim() ? t.onTone : t.c.text2} />
        </Tap>
      </View>
    </View>
  );
}

// ——— Ajustes ———

const SECTIONS = {
  conta: 'Conta',
  aparencia: 'Aparência',
  notificacoes: 'Notificações',
  privacidade: 'Privacidade',
  pagamentos: 'Pagamentos',
  enderecos: 'Endereços',
  bloqueados: 'Bloqueados',
  ajuda: 'Ajuda',
  sobre: 'Sobre o netpet',
};

export function SettingsScreen({ section }) {
  if (section && SECTIONS[section]) return <SettingsSection section={section} />;
  return <SettingsHome />;
}

function SettingsHome() {
  const t = useTheme();
  const s = useStore();
  const nav = useNav();
  const go = (section) => nav.push('Settings', { section });
  return (
    <Screen big="Ajustes">
      <Card style={{ marginTop: 14 }} onPress={() => go('conta')} label="Minha conta">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <InitialAvatar name={ME.name} size={56} color={t.c.text2} />
          <View style={{ flex: 1 }}>
            <T kind="h">{ME.name}</T>
            <T kind="sub">{ME.handle} · {MY_PETS.length} pets</T>
          </View>
          <Icon name="chevRight" size={18} color={t.c.text2} />
        </View>
      </Card>

      <Card style={{ marginTop: 12, overflow: 'hidden' }} pad={0} onPress={() => nav.push('Plus')} label="netpet+">
        <LinearGradient colors={[alpha(t.tone, t.dark ? 0.35 : 0.22), alpha(t.tone, 0.04)]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <IconTile icon="crown" size={44} />
          <View style={{ flex: 1 }}>
            <T kind="h">{s.plus ? 'Você é netpet+' : 'Conheça o netpet+'}</T>
            <T kind="sub">{s.plus ? 'Sem taxa de serviço, PDF da carteirinha e mais' : 'Sem taxa de serviço e carteirinha completa em PDF'}</T>
          </View>
          <Icon name="chevRight" size={18} color={t.c.text2} />
        </LinearGradient>
      </Card>

      <Section title="Preferências">
        <Group>
          <Row icon="sun" title="Aparência" value={`${DIRECTIONS[s.direction].name} · ${{ sistema: 'Sistema', claro: 'Claro', escuro: 'Escuro' }[s.themeMode]}`} onPress={() => go('aparencia')} />
          <Row icon="bell" title="Notificações" onPress={() => go('notificacoes')} />
          <Row icon="lock" title="Privacidade" onPress={() => go('privacidade')} />
        </Group>
      </Section>

      <Section title="Pagamentos e endereços">
        <Group>
          <Row icon="card" title="Formas de pagamento" value="Pix, 1 cartão" onPress={() => go('pagamentos')} />
          <Row icon="pin" title="Endereços" value="2" onPress={() => go('enderecos')} />
          <Row icon="ticket" title="Cupons" onPress={() => nav.push('Coupons')} />
          <Row icon="calendar" title="Meus agendamentos" onPress={() => nav.push('MyBookings')} />
        </Group>
      </Section>

      <Section title="Para parceiros">
        <Group>
          <Row icon="store" title="Modo parceiro" sub="Abre o app do Pet Shop Bicho Bom: fila do dia, agenda, pedidos e financeiro"
            onPress={() => { s.setMode('parceiro'); nav.resetTo('hoje'); s.toast('Modo parceiro ativado'); }} />
        </Group>
      </Section>

      <Section title="Ajuda e segurança">
        <Group>
          <Row icon="sparkle" title="Assistente netpet" onPress={() => nav.push('Assistant')} />
          <Row icon="ban" title="Bloqueados" value={s.blocked.length ? String(s.blocked.length) : ''} onPress={() => go('bloqueados')} />
          <Row icon="help" title="Central de ajuda" onPress={() => go('ajuda')} />
          <Row icon="info" title="Sobre o netpet" onPress={() => go('sobre')} />
        </Group>
      </Section>

      <Section title="Para testar">
        <Group>
          <Row icon="map" title="Mapa de telas" sub="Todas as telas do app, para abrir direto" onPress={() => nav.push('ScreenMap')} />
          <Row icon="grid" title="Estados do app" sub="Vazio, erro, sem internet e carregando" onPress={() => nav.push('States')} />
          <Row icon="swap" title="Ver a entrada de novo" sub="Boas-vindas, login e criar pet" onPress={() => { s.setOnboarded(false); nav.resetTo('inicio'); }} />
        </Group>
      </Section>

      <Group style={{ marginTop: 26 }}>
        <Row icon="logout" title="Sair" danger chevron={false} onPress={() => { s.setOnboarded(false); nav.resetTo('inicio'); }} />
      </Group>
      <T kind="small" center style={{ marginTop: 18 }}>netpet 1.0 · feito com carinho em São Paulo</T>
    </Screen>
  );
}

function OptionRow({ title, sub, options, value, onChange }) {
  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 12, gap: 10 }}>
      <View>
        <T kind="body">{title}</T>
        {sub ? <T kind="small" style={{ marginTop: 2 }}>{sub}</T> : null}
      </View>
      <Segmented options={options} value={value} onChange={onChange} />
    </View>
  );
}

function ToggleRow({ title, sub, value, onChange, icon }) {
  return <Row icon={icon} title={title} sub={sub} right={<Toggle value={value} onChange={onChange} label={title} />} chevron={false} />;
}

function DirectionCard({ k, active, onPress }) {
  const t = useTheme();
  const d = DIRECTIONS[k];
  const c = t.dark ? d.dark : d.light;
  const tone = k === 'pet' ? (t.dark ? t.pet.colorDark : t.pet.color) : c.accent;
  return (
    <Tap onPress={onPress} label={`Estilo ${d.name}`} scale={0.98} outerStyle={{ flex: 1 }}
      style={{ borderRadius: 18, borderWidth: active ? 2 : StyleSheet.hairlineWidth, borderColor: active ? t.tone : t.c.line, padding: 8, backgroundColor: t.c.surface }}>
      <View style={{ height: 112, borderRadius: 12, backgroundColor: c.bg, padding: 9, gap: 6, overflow: 'hidden' }}>
        <Text style={{ fontFamily: d.fonts.title, fontSize: 17, color: c.text }}>Início</Text>
        <View style={{ height: 34, borderRadius: d.radius.card / 2, backgroundColor: k === 'caramelo' ? alpha(tone, 0.25) : c.surface, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 7, gap: 6 }}>
          <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: tone }} />
          <View style={{ flex: 1, height: 5, borderRadius: 3, backgroundColor: c.line }} />
        </View>
        <View style={{ flexDirection: 'row', gap: 5 }}>
          <View style={{ flex: 1, height: 30, borderRadius: 8, backgroundColor: c.surface2 }} />
          <View style={{ flex: 1, height: 30, borderRadius: 8, backgroundColor: c.surface2 }} />
        </View>
        <View style={{ alignSelf: 'flex-start', paddingHorizontal: 8, height: 14, borderRadius: 7, backgroundColor: tone }} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, marginLeft: 2 }}>
        <Text style={{ flex: 1, color: t.c.text, fontSize: 14, fontWeight: '600' }} numberOfLines={1}>{d.name}</Text>
        {active ? <Icon name="check" size={16} color={t.toneText} /> : null}
      </View>
    </Tap>
  );
}

function SettingsSection({ section }) {
  const t = useTheme();
  const s = useStore();
  const nav = useNav();
  const title = SECTIONS[section];

  if (section === 'aparencia') {
    return (
      <Screen title={title}>
        <T kind="title" style={{ marginTop: 8, marginLeft: 4 }}>Estilo</T>
        <T kind="sub" style={{ marginLeft: 4, marginTop: 2 }}>Muda fontes, cores e o jeito do Início. Tudo continua no mesmo lugar.</T>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
          {DIRECTION_ORDER.map((k) => <DirectionCard key={k} k={k} active={s.direction === k} onPress={() => s.setDirection(k)} />)}
        </View>
        <Note style={{ marginTop: 12 }} icon="paw">{DIRECTIONS[s.direction].note}</Note>
        <T kind="title" style={{ marginTop: 26, marginLeft: 4 }}>Tema</T>
        <Segmented style={{ marginTop: 12 }} options={[{ key: 'sistema', label: 'Sistema' }, { key: 'claro', label: 'Claro' }, { key: 'escuro', label: 'Escuro' }]} value={s.themeMode} onChange={s.setThemeMode} />
        <T kind="small" style={{ marginTop: 8, marginLeft: 4 }}>No modo Sistema, o netpet acompanha o tema do seu celular.</T>
      </Screen>
    );
  }

  if (section === 'notificacoes') {
    const n = s.notifSettings;
    const items = [
      ['agendamentos', 'Agendamentos', 'Confirmações, lembretes e atendimento ao vivo', 'calendar'],
      ['perdidos', 'Pets perdidos perto de você', 'Alertas num raio de 2 km. Recomendamos deixar ligado.', 'alert'],
      ['saude', 'Saúde e cuidados', 'Vacinas, remédios e rotina', 'syringe'],
      ['patinhas', 'Patinhas', 'Quando alguém curte um post', 'paw'],
      ['comentarios', 'Comentários e menções', '', 'comment'],
      ['matilhas', 'Matilhas', 'Só menções e encontros marcados', 'users'],
      ['ofertas', 'Ofertas de parceiros', 'Promoções dos lugares que você favoritou', 'tag'],
    ];
    return (
      <Screen title={title}>
        <Group style={{ marginTop: 8 }}>
          {items.map(([k, ti, sub, icon]) => <ToggleRow key={k} icon={icon} title={ti} sub={sub || undefined} value={n[k]} onChange={(v) => s.setNotif(k, v)} />)}
        </Group>
        <Note style={{ marginTop: 14 }}>Silêncio automático das 22h às 7h, menos para pets perdidos e atendimento ao vivo.</Note>
      </Screen>
    );
  }

  if (section === 'privacidade') {
    const pv = s.privacy;
    return (
      <Screen title={title}>
        <Group style={{ marginTop: 8 }}>
          <OptionRow title="Quem vê o perfil dos seus pets" options={['Todos', 'Seguidores']} value={pv.perfil} onChange={(v) => s.setPrivacy('perfil', v)} />
          <OptionRow title="Quem vê a carteirinha" sub="Vacinas, peso, remédios e histórico" options={['Só a família', 'Parceiros que atendem']} value={pv.carteirinha} onChange={(v) => s.setPrivacy('carteirinha', v)} />
          <OptionRow title="Localização nos posts" options={['Bairro', 'Desligada']} value={pv.localizacao} onChange={(v) => s.setPrivacy('localizacao', v)} />
        </Group>
        <Group style={{ marginTop: 14 }}>
          <Row icon="download" title="Baixar meus dados" sub="Arquivo com posts, pets e agendamentos (LGPD)" onPress={() => s.toast('Pedido recebido. Enviamos em até 48 horas.')} />
          <Row icon="trash" title="Excluir conta" danger onPress={() => nav.push('DeleteAccount')} />
        </Group>
      </Screen>
    );
  }

  if (section === 'conta') {
    return (
      <Screen title={title}>
        <View style={{ alignItems: 'center', marginTop: 8 }}>
          <InitialAvatar name={ME.name} size={84} color={t.c.text2} />
          <Btn small kind="ghost" full={false} title="Trocar foto" onPress={() => s.toast('Foto atualizada')} />
        </View>
        <View style={{ gap: 14, marginTop: 6 }}>
          <Field label="Nome" value={ME.name} onChangeText={() => {}} />
          <Field label="Usuário" value={ME.handle} onChangeText={() => {}} icon="at" />
          <Field label="E-mail" value="david@exemplo.com" onChangeText={() => {}} icon="mail" />
          <Field label="Celular" value="(11) 9 •••• 4821" onChangeText={() => {}} icon="phone" />
        </View>
        <Section title="Seus pets">
          <Group>
            {MY_PETS.map((k) => (
              <Row key={k} left={<PetAvatar pet={k} size={36} />} title={PETS[k].name} sub={PETS[k].breed} onPress={() => nav.push('EditPet', { pet: k })} />
            ))}
            <Row icon="plus" title="Adicionar pet" onPress={() => nav.push('CreatePet')} />
          </Group>
        </Section>
        <Btn style={{ marginTop: 22 }} title="Salvar" onPress={() => { s.toast('Conta atualizada'); nav.back(); }} />
      </Screen>
    );
  }

  if (section === 'pagamentos') {
    return (
      <Screen title={title}>
        <Group style={{ marginTop: 8 }}>
          <Row icon="pix" title="Pix" sub="Aprovação na hora" chevron={false} right={<StatePill state="ok" text="Padrão" />} />
          <Row icon="card" title="Cartão ••• 4821" sub="Vence em 08/29" onPress={() => s.toast('Cartão definido como padrão')} />
          <Row icon="plus" title="Adicionar cartão" onPress={() => s.toast('Cartão adicionado')} />
        </Group>
        <Note style={{ marginTop: 14 }} icon="lock">Os dados do cartão ficam com a processadora de pagamentos. O netpet só guarda os 4 últimos números.</Note>
      </Screen>
    );
  }

  if (section === 'enderecos') {
    return (
      <Screen title={title}>
        <Group style={{ marginTop: 8 }}>
          <Row icon="home" title="Casa" sub={ME.address} chevron={false} right={<StatePill state="ok" text="Atual" />} />
          <Row icon="pin" title="Trabalho" sub="Av. Paulista, 900 · 12º andar" onPress={() => s.toast('Endereço atual: Trabalho')} />
          <Row icon="plus" title="Adicionar endereço" onPress={() => s.toast('Endereço salvo')} />
        </Group>
        <Note style={{ marginTop: 14 }}>O leva e traz busca o seu pet no endereço atual. Outros tutores só veem o seu bairro.</Note>
      </Screen>
    );
  }

  if (section === 'bloqueados') {
    return (
      <Screen title={title}>
        {s.blocked.length ? (
          <Group style={{ marginTop: 8 }}>
            {s.blocked.map((w) => (
              <Row key={w} left={<InitialAvatar name={w} size={36} />} title={w} chevron={false}
                right={<Btn small full={false} kind="secondary" title="Desbloquear" onPress={() => { s.unblock(w); s.toast(`${w} desbloqueado`); }} />} />
            ))}
          </Group>
        ) : (
          <Empty icon="ban" title="Ninguém bloqueado" text="Quem você bloquear não vê seus posts, não manda mensagem e não aparece nas suas matilhas." />
        )}
      </Screen>
    );
  }

  if (section === 'ajuda') {
    const faq = [
      ['Como funciona o atendimento ao vivo?', 'O parceiro avisa cada etapa: chegada, banho, secagem e pronto. Você acompanha pela tela Ao vivo e recebe a foto do depois.'],
      ['Posso cancelar um agendamento?', 'Sim, sem custo até 2 horas antes. Depois disso, o parceiro pode cobrar 50% do valor.'],
      ['O alerta de pet perdido é pago?', 'Nunca. O alerta e a carteirinha básica são grátis para sempre.'],
      ['Como denunciar alguém?', 'Toque nos três pontinhos do post, perfil ou mensagem e escolha Denunciar. A equipe responde em até 24 horas.'],
    ];
    return (
      <Screen title={title}>
        <View style={{ gap: 10, marginTop: 8 }}>
          {faq.map(([q, a]) => <Faq key={q} q={q} a={a} />)}
        </View>
        <Group style={{ marginTop: 18 }}>
          <Row icon="chat" title="Falar com a gente" sub="Resposta em até 2 horas, das 8h às 22h" onPress={() => s.toast('Abrimos um chamado. Já já respondemos.')} />
          <Row icon="flag" title="Denúncias e segurança" onPress={() => s.toast('Abrimos um chamado de segurança.')} />
        </Group>
      </Screen>
    );
  }

  // sobre
  return (
    <Screen title={title}>
      <View style={{ alignItems: 'center', marginTop: 16 }}>
        <View style={{ width: 84, height: 84, borderRadius: 26, backgroundColor: t.tone, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="paw" size={46} color={t.onTone} />
        </View>
        <T kind="display" style={{ marginTop: 12 }}>netpet</T>
        <T kind="sub">Versão 1.0 · a rede social dos pets</T>
      </View>
      <Group style={{ marginTop: 24 }}>
        <Row icon="doc" title="Termos de uso" onPress={() => s.toast('Abrindo os termos')} />
        <Row icon="lock" title="Política de privacidade" onPress={() => s.toast('Abrindo a política')} />
        <Row icon="globe" title="Licenças de código aberto" onPress={() => s.toast('Abrindo as licenças')} />
      </Group>
      <Note style={{ marginTop: 14 }}>Pets, tutores, parceiros e endereços deste app são de exemplo.</Note>
    </Screen>
  );
}

function Faq({ q, a }) {
  const t = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <Card pad={0} onPress={() => setOpen(!open)} label={q}>
      <View style={{ padding: 16, gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text style={{ flex: 1, color: t.c.text, fontSize: 15.5, fontWeight: '600' }}>{q}</Text>
          <Icon name={open ? 'chevUp' : 'chevDown'} size={18} color={t.c.text2} />
        </View>
        {open ? <T kind="sub">{a}</T> : null}
      </View>
    </Card>
  );
}

// ——— Excluir conta ———

export function DeleteAccountScreen() {
  const t = useTheme();
  const s = useStore();
  const nav = useNav();
  const [reason, setReason] = useState(null);
  const [sure, setSure] = useState(false);
  const reasons = ['Não uso mais', 'Recebo notificações demais', 'Preocupação com privacidade', 'Meu pet faleceu', 'Outro motivo'];
  return (
    <Screen title="Excluir conta" footer={(
      <Btn kind="danger" title="Excluir minha conta" disabled={!sure} onPress={() => { s.setOnboarded(false); nav.resetTo('inicio'); }} />
    )}>
      <T kind="title" style={{ marginTop: 8 }}>Antes de ir</T>
      <T kind="sub" style={{ marginTop: 6 }}>Vamos apagar os perfis dos seus pets, posts, mensagens e a carteirinha em até 30 dias. Agendamentos já pagos continuam válidos até acontecerem.</T>
      {reason === 'Meu pet faleceu' ? (
        <Note icon="heart" style={{ marginTop: 14 }}>Sentimos muito. Se preferir, você pode transformar o perfil em memorial: ele fica visível para quem segue, sem notificações e sem lembretes.</Note>
      ) : null}
      <T kind="label" style={{ marginTop: 22, marginBottom: 10, marginLeft: 4 }}>Conta pra gente o motivo</T>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {reasons.map((r) => <Chip key={r} title={r} active={reason === r} onPress={() => setReason(r)} />)}
      </View>
      <Group style={{ marginTop: 22 }}>
        <Row icon="download" title="Baixar meus dados antes" onPress={() => s.toast('Pedido recebido. Enviamos em até 48 horas.')} />
        <Row title="Entendo que não dá para desfazer" chevron={false} right={<Toggle value={sure} onChange={setSure} label="Entendo que não dá para desfazer" />} />
      </Group>
    </Screen>
  );
}

// ——— netpet+ ———

const PLUS_ITEMS = [
  ['cash', 'Sem taxa de serviço', 'Nos agendamentos pagos no app'],
  ['doc', 'Carteirinha completa em PDF', 'Para levar ao veterinário ou ao hotel'],
  ['users', 'Família ilimitada', 'Quantos cuidadores quiser em cada pet'],
  ['sparkle', 'Retrospectiva com vídeo', 'O ano do seu pet em 30 segundos'],
  ['ticket', 'Cupons de parceiros', 'Todo mês, perto de você'],
];

export function PlusScreen() {
  const t = useTheme();
  const s = useStore();
  const nav = useNav();
  const [plan, setPlan] = useState('ano');
  return (
    <Screen title="" footer={s.plus ? (
      <Btn kind="secondary" title="Cancelar assinatura" onPress={() => { s.setPlus(false); s.toast('Assinatura cancelada. Vale até o fim do período.'); }} />
    ) : (
      <View style={{ gap: 8 }}>
        <Btn title={plan === 'ano' ? 'Assinar por R$ 149,00/ano' : 'Assinar por R$ 14,90/mês'} icon="crown"
          onPress={() => { s.setPlus(true); s.toast('Bem-vindo ao netpet+!'); nav.back(); }} />
        <T kind="small" center>7 dias grátis. Cobrança pela loja do seu celular, cancele quando quiser.</T>
      </View>
    )}>
      <View style={{ alignItems: 'center', marginTop: 4 }}>
        <View style={{ width: 76, height: 76, borderRadius: 24, backgroundColor: t.tone, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="crown" size={40} color={t.onTone} />
        </View>
        <T kind="display" style={{ marginTop: 12 }}>netpet+</T>
        <T kind="sub" center style={{ marginTop: 4, maxWidth: 300 }}>{s.plus ? 'Sua assinatura está ativa. Obrigado por apoiar o netpet!' : 'Para quem cuida de pet todo dia e quer menos taxa e mais tempo junto.'}</T>
      </View>
      <Group style={{ marginTop: 22 }}>
        {PLUS_ITEMS.map(([icon, ti, sub]) => <Row key={ti} icon={icon} tone title={ti} sub={sub} chevron={false} right={<Icon name="check" size={18} color={t.toneText} />} />)}
      </Group>
      {!s.plus ? (
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
          {[['ano', 'Anual', 'R$ 149,00', 'R$ 12,42 por mês', 'Economize 17%'], ['mes', 'Mensal', 'R$ 14,90', 'por mês', null]].map(([k, name, price, per, badge]) => (
            <Tap key={k} onPress={() => setPlan(k)} label={`Plano ${name}`} outerStyle={{ flex: 1 }} scale={0.98}
              style={{ borderRadius: 18, padding: 14, backgroundColor: t.c.surface, borderWidth: plan === k ? 2 : StyleSheet.hairlineWidth, borderColor: plan === k ? t.tone : t.c.line, minHeight: 112 }}>
              {badge ? <Pill text={badge} bg={alpha(t.tone, 0.18)} color={t.toneText} style={{ marginBottom: 6 }} /> : <View style={{ height: 26 }} />}
              <T kind="sub">{name}</T>
              <T kind="title">{price}</T>
              <T kind="small">{per}</T>
            </Tap>
          ))}
        </View>
      ) : null}
      <Note style={{ marginTop: 16 }} icon="heart">A carteirinha básica e o alerta de pet perdido são grátis para sempre, com ou sem netpet+.</Note>
    </Screen>
  );
}

// ——— Estados do app: vazio, erro, sem internet e carregando ———

export function StatesScreen() {
  const t = useTheme();
  const nav = useNav();
  const s = useStore();
  const [which, setWhich] = useState('vazio');
  return (
    <Screen title="Estados do app">
      <Segmented options={[{ key: 'vazio', label: 'Vazio' }, { key: 'erro', label: 'Erro' }, { key: 'offline', label: 'Offline' }, { key: 'carregando', label: 'Carregando' }]} value={which} onChange={setWhich} style={{ marginTop: 6 }} />
      <View style={{ marginTop: 10 }}>
        {which === 'vazio' ? (
          <>
            <Empty icon="paw" title="Seu feed está quietinho" text="Siga pets do bairro ou entre numa matilha para ver fotos por aqui." action="Descobrir pets" onAction={() => nav.push('Search')} />
            <Empty compact icon="calendar" title="Nenhum agendamento" text="Quando você marcar um banho ou uma consulta, ele aparece aqui." action="Agendar" onAction={() => nav.push('Results', {})} />
          </>
        ) : null}
        {which === 'erro' ? (
          <Empty icon="alert" title="Algo deu errado" text="Não conseguimos carregar esta tela. Seus dados estão seguros. Tente de novo em instantes." action="Tentar de novo" onAction={() => s.toast('Tudo certo agora')} />
        ) : null}
        {which === 'offline' ? (
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 14, backgroundColor: t.c.text, marginTop: 6 }}>
              <Icon name="globe" size={18} color={t.c.bg} />
              <Text style={{ color: t.c.bg, fontSize: 14, flex: 1 }}>Sem internet. Mostrando o que já estava salvo.</Text>
            </View>
            <Empty icon="globe" title="Você está offline" text="A carteirinha e a plaquinha continuam disponíveis sem internet. Posts e mensagens são enviados quando a conexão voltar." action="Abrir carteirinha" onAction={() => nav.push('Carteirinha', { pet: s.petKey })} />
          </View>
        ) : null}
        {which === 'carregando' ? (
          <View style={{ gap: 18, marginTop: 14 }}>
            {[0, 1].map((i) => (
              <View key={i} style={{ gap: 10 }}>
                <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                  <Skeleton w={38} h={38} r={19} />
                  <View style={{ flex: 1, gap: 6 }}><Skeleton w="45%" h={12} /><Skeleton w="30%" h={10} /></View>
                </View>
                <Skeleton h={260} r={t.radius.card} />
                <Skeleton w="70%" h={12} />
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

// ——— Mapa de telas (para revisar o app) ———

const MAP = [
  ['Entrada', [['Boas-vindas e login', null, 'onboarding'], ['Criar pet', 'CreatePet']]],
  ['Início e social', [['Post e comentários', 'Post', { id: 'p1' }], ['História', 'Story', { pet: 'mel' }], ['Novo post', 'NewPost'], ['Registrar cuidado', 'CareLog'], ['Notificações', 'Notifications'], ['Busca', 'Search'], ['Assistente', 'Assistant']]],
  ['Serviços', [['Resultados', 'Results', { category: 'banho' }], ['Mapa', 'Map'], ['Parceiro', 'Partner', { id: 'bichoBom' }], ['Agendar', 'Booking', { partner: 'bichoBom' }], ['Meus agendamentos', 'MyBookings'], ['Ao vivo', 'Live', { id: 'b1' }], ['Avaliar', 'Review', { id: 'b3' }], ['Cupons', 'Coupons']]],
  ['Matilhas', [['Canal', 'Channel', { matilha: 'viralatas', channel: 'dicas' }], ['Fio de respostas', 'Thread'], ['Sobre a matilha', 'Matilha', { id: 'viralatas' }], ['Descobrir matilhas', 'Discover'], ['Criar matilha', 'CreateMatilha'], ['Mensagens', 'Dms'], ['Conversa', 'Dm', { id: 'bichoBom' }], ['Pet perdido', 'Lost'], ['Avisar pet perdido', 'LostCreate']]],
  ['Pet', [['Perfil de outro pet', 'PetProfile', { pet: 'mel' }], ['Editar pet', 'EditPet'], ['Família', 'Family'], ['Carteirinha', 'Carteirinha'], ['Agenda de cuidados', 'CareSchedule'], ['Crescimento', 'Growth', { pet: 'amora' }], ['Sequência', 'Streak'], ['Retrospectiva', 'Wrapped'], ['Cartão para compartilhar', 'ShareCard'], ['Plaquinha', 'Tag'], ['Página da plaquinha', 'TagPublic', { lost: true }]]],
  ['Geral', [['Ajustes', 'Settings'], ['Aparência', 'Settings', { section: 'aparencia' }], ['netpet+', 'Plus'], ['Excluir conta', 'DeleteAccount'], ['Estados do app', 'States']]],
];

export function ScreenMapScreen() {
  const s = useStore();
  const nav = useNav();
  return (
    <Screen big="Mapa de telas" sub="Toque para abrir qualquer tela">
      {MAP.map(([group, items]) => (
        <Section key={group} title={group}>
          <Group>
            {items.map(([label, name, params]) => (
              <Row key={label} title={label} onPress={() => {
                if (!name) { s.setOnboarded(false); nav.resetTo('inicio'); return; }
                nav.push(name, params || {});
              }} />
            ))}
          </Group>
        </Section>
      ))}
      <Section title="Modo parceiro">
        <Group>
          <Row icon="store" title="Abrir como Pet Shop Bicho Bom" onPress={() => { s.setMode('parceiro'); nav.resetTo('hoje'); }} />
        </Group>
      </Section>
    </Screen>
  );
}

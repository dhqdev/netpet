import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Platform, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions, KeyboardAvoidingView } from 'react-native';
import Svg, { Path, Circle, Ellipse } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import { Icon } from '../icons';
import { useTheme, alpha } from '../theme';
import { useStore } from '../store';
import { useNav } from '../nav';
import { ND, Glass, spring, haptic, SPRING } from '../motion';
import { T, Btn, Field, Chip, Tap, Photo, PetAvatar, useInsets, Note, IconTile, Segmented, Toggle, StatePill } from '../kit';
import { BREEDS, PET_COLORS, INTERESTS, OTHER_PETS, PETS, MATILHAS, CATEGORIES, SIZES } from '../data';

// Cadastro do netpet.
//
// Dois caminhos depois de criar a conta:
// - Tutor: conta, o pet (uma pergunta por tela, com foto de verdade), resumo, permissões e interesses.
// - Estabelecimento: conta, o negócio (tipo, dados, endereço), serviços e horários, fotos e repasse,
//   resumo e envio para análise.
// O topo mostra em que parte do cadastro a pessoa está; cada tela nova entra deslizando em mola.

const WELCOME = [
  { title: 'O perfil é do pet', text: 'Poste fotos e vídeos, siga outros pets e ganhe patinhas. Você é o tutor, ele é a estrela.', art: 'paw' },
  { title: 'Banho, vet e passeio perto de casa', text: 'Encontre parceiros avaliados por outros tutores e agende em poucos toques.', art: 'calendar' },
  { title: 'Acompanhe ao vivo', text: 'Saiba quando ele chegou, entrou no banho e está pronto. A foto do depois vira post.', art: 'clock' },
];

const TUTOR_STEPS = [
  ['method', 0], ['email', 0], ['phone', 0], ['code', 0],
  ['photo', 1], ['name', 1], ['species', 1], ['breed', 1], ['born', 1], ['size', 1], ['color', 1], ['review', 1],
  ['perms', 2], ['interests', 3],
];
const BIZ_STEPS = [
  ['method', 0], ['email', 0], ['phone', 0], ['code', 0],
  ['kind', 1], ['bizData', 1], ['address', 1],
  ['services', 2], ['hours', 2], ['photos', 2],
  ['payout', 3], ['bizReview', 3],
];
const SECTIONS = { tutor: ['Conta', 'Seu pet', 'Permissões', 'Interesses'], biz: ['Conta', 'Negócio', 'Serviços', 'Repasse'] };

const SUGGESTED = {
  banho: [['Banho', 60, [55, 70, 90]], ['Banho e tosa higiênica', 80, [70, 85, 110]], ['Banho e tosa completa', 120, [95, 120, 160]]],
  vet: [['Consulta clínica', 40, [180]], ['Vacina', 20, [120]], ['Retorno', 20, [0]]],
  hotel: [['Diária de hotel', 1440, [90, 110, 140]]],
  creche: [['Diária de creche', 600, [70, 80, 95]]],
  adestrador: [['Aula individual', 60, [150]], ['Pacote de 8 aulas', 60, [1040]]],
  passeador: [['Passeio de 30 min', 30, [35]], ['Passeio de 1 hora', 60, [55]]],
};
const DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const AGES = [['Filhote', 'menos de 1 ano'], ['Jovem', '1 a 3 anos'], ['Adulto', '3 a 8 anos'], ['Idoso', 'mais de 8 anos']];

const onlyDigits = (v) => v.replace(/\D/g, '');
const maskDate = (v) => onlyDigits(v).slice(0, 8).replace(/^(\d{2})(\d)/, '$1/$2').replace(/^(\d{2})\/(\d{2})(\d)/, '$1/$2/$3');
const maskPhone = (v) => {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};
const maskCep = (v) => onlyDigits(v).slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2');
const maskCnpj = (v) => onlyDigits(v).slice(0, 14).replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
  .replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2');
const maskCpf = (v) => onlyDigits(v).slice(0, 11).replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
const validEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
const hhmm = (m) => `${Math.floor(m / 60)}h${m % 60 ? String(m % 60).padStart(2, '0') : ''}`;

function ageFrom(born) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(born);
  if (!m) return null;
  const months = (2026 - +m[3]) * 12 + (11 - +m[2]);
  if (months < 0 || +m[2] > 12 || +m[1] > 31) return null;
  if (months < 12) return `${Math.max(1, months)} ${months === 1 ? 'mês' : 'meses'}`;
  const y = Math.floor(months / 12);
  return `${y} ${y === 1 ? 'ano' : 'anos'}`;
}

export default function Onboarding() {
  const t = useTheme();
  const ins = useInsets();
  const s = useStore();
  const [step, setStep] = useState('splash');
  const [dir, setDir] = useState(1);
  const history = useRef([]);
  const [role, setRole] = useState('tutor');
  const [acc, setAcc] = useState({ via: '', name: '', email: '', pass: '', phone: '', code: '' });
  const [pet, setPet] = useState({ name: '', species: 'Cão', sex: 'Macho', breed: '', born: '', age: '', size: 'Médio', color: PET_COLORS[0], photo: null });
  const [biz, setBiz] = useState({
    kinds: ['banho'], name: '', doc: 'CNPJ', number: '', whatsapp: '', cep: '', street: '', num: '', extra: '', homeVisit: false,
    services: [], days: [0, 1, 2, 3, 4, 5], open: 480, close: 1140, photos: [], logo: null, pixType: 'CNPJ', pix: '',
  });
  const [prefs, setPrefs] = useState({ loc: false, notif: false, interests: ['Cães', 'Vira-latas', 'Passeios'], follow: { mel: true, thor: true, viralatas: true } });

  const go = (next) => {
    history.current.push(step);
    setDir(1);
    setStep(next);
  };
  const goBack = () => {
    const prev = history.current.pop();
    if (!prev) return;
    setDir(-1);
    setStep(prev);
  };
  const jump = (target) => {
    history.current.push(step);
    setDir(-1);
    setStep(target);
  };

  const flow = role === 'biz' ? BIZ_STEPS : TUTOR_STEPS;
  const sectionOf = (k) => (flow.find(([x]) => x === k) || [k, -1])[1];
  const section = sectionOf(step);

  const finishTutor = () => {
    s.setAccount({ name: acc.name || 'David', role: 'tutor', email: acc.email, phone: acc.phone });
    if (pet.name.trim()) s.addPet(pet);
    s.setOnboarded(true);
    haptic.success();
    s.toast(pet.name.trim() ? `Bem-vindo, ${pet.name.trim()}!` : 'Bem-vindo ao netpet!');
  };
  const finishBiz = () => {
    const area = biz.street ? 'Vila Madalena' : undefined;
    s.setAccount({ name: acc.name || 'David', role: 'biz', email: acc.email, phone: acc.phone });
    s.setBusiness({ name: biz.name, area, address: biz.street ? `${biz.street}, ${biz.num}` : undefined, category: biz.kinds[0] });
    s.setMode('parceiro');
    s.setOnboarded(true);
    haptic.success();
    s.toast('Cadastro enviado. Seu painel já está pronto.');
  };
  const signedIn = () => go(role === 'biz' ? 'kind' : 'photo');

  if (step === 'splash') return <Splash onDone={() => go('welcome')} />;
  if (step === 'welcome') return <Welcome onNext={() => go('role')} onLogin={() => { s.setOnboarded(true); s.toast('Que bom te ver de novo!'); }} />;

  const common = { t, acc, setAcc, pet, setPet, biz, setBiz, prefs, setPrefs, go, jump, role, s };
  const screen = STEP_VIEWS[step](common, { signedIn, finishTutor, finishBiz, setRole });

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: t.c.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ flex: 1, paddingTop: ins.top }}>
        <TopBar onBack={goBack} sections={step === 'role' || step === 'bizDone' ? null : SECTIONS[role]} section={section}
          stepIndex={flow.filter(([, sec]) => sec === section).findIndex(([k]) => k === step)}
          stepCount={flow.filter(([, sec]) => sec === section).length} hideBack={step === 'bizDone'} />
        <StepIn key={step} dir={dir}>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 18, paddingBottom: 24 }}>
            {screen.eyebrow ? <T kind="label" color={t.toneText}>{screen.eyebrow}</T> : null}
            {screen.title ? <T kind="display" style={{ marginTop: 6, fontSize: 30, lineHeight: 36 }}>{screen.title}</T> : null}
            {screen.sub ? <T kind="sub" style={{ marginTop: 8, fontSize: 15.5, lineHeight: 22 }}>{screen.sub}</T> : null}
            {screen.body}
          </ScrollView>
        </StepIn>
        {screen.cta ? (
          <View style={{ paddingHorizontal: 24, paddingTop: 10, paddingBottom: ins.bottom + 14, gap: 4 }}>
            <Btn title={screen.cta} onPress={screen.onCta} disabled={screen.disabled} icon={screen.ctaIcon} />
            {screen.skip ? <Btn title={screen.skip} kind="ghost" onPress={screen.onSkip} /> : null}
          </View>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}

// ——— Abertura e boas-vindas ———

function Splash({ onDone }) {
  const t = useTheme();
  const v = useRef(new Animated.Value(0)).current;
  const word = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    spring(v, 1, { damping: 12, stiffness: 140 });
    Animated.timing(word, { toValue: 1, duration: 420, delay: 260, easing: Easing.out(Easing.cubic), useNativeDriver: ND }).start();
    const id = setTimeout(onDone, 1700);
    return () => clearTimeout(id);
  }, []);
  return (
    <Tap onPress={onDone} hitSlop={0} scale={1} outerStyle={{ flex: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.tone }} label="Abrir o netpet">
      <Animated.View style={{ width: 112, height: 112, borderRadius: 36, backgroundColor: t.onTone, alignItems: 'center', justifyContent: 'center',
        transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }, { rotate: v.interpolate({ inputRange: [0, 1], outputRange: ['-18deg', '0deg'] }) }], opacity: v }}>
        <Icon name="paw" size={64} color={t.tone} filled />
      </Animated.View>
      <Animated.View style={{ alignItems: 'center', opacity: word, transform: [{ translateY: word.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }}>
        <Text style={{ fontFamily: t.fonts.titleStrong, fontSize: 44, color: t.onTone, marginTop: 18 }}>netpet</Text>
        <Text style={{ color: t.onTone, fontSize: 15, marginTop: 4, opacity: 0.85 }}>A rede social do seu pet</Text>
      </Animated.View>
    </Tap>
  );
}

function Welcome({ onNext, onLogin }) {
  const t = useTheme();
  const ins = useInsets();
  const { width } = useWindowDimensions();
  const [w, setW] = useState(width);
  const x = useRef(new Animated.Value(0)).current;
  const ref = useRef(null);
  const [page, setPage] = useState(0);
  const toPage = (i) => ref.current && ref.current.scrollTo({ x: i * w, animated: true });
  return (
    <View style={{ flex: 1, backgroundColor: t.c.bg, paddingTop: ins.top }} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', height: 48, alignItems: 'center', paddingHorizontal: 18 }}>
        <Tap onPress={onNext} label="Pular" style={{ height: 44, justifyContent: 'center', paddingHorizontal: 6 }}>
          <Text style={{ color: t.c.text2, fontSize: 15 }}>Pular</Text>
        </Tap>
      </View>
      <Animated.ScrollView ref={ref} horizontal pagingEnabled showsHorizontalScrollIndicator={false} scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x } } }], { useNativeDriver: ND, listener: (e) => setPage(Math.round(e.nativeEvent.contentOffset.x / w)) })}
        style={{ flex: 1 }}>
        {WELCOME.map((c, i) => {
          const range = [(i - 1) * w, i * w, (i + 1) * w];
          return (
            <View key={c.title} style={{ width: w, paddingHorizontal: 24, justifyContent: 'center' }}>
              <Animated.View style={{ transform: [{ scale: x.interpolate({ inputRange: range, outputRange: [0.86, 1, 0.86], extrapolate: 'clamp' }) }], opacity: x.interpolate({ inputRange: range, outputRange: [0.3, 1, 0.3], extrapolate: 'clamp' }) }}>
                <WelcomeArt kind={c.art} />
              </Animated.View>
              <T kind="display" style={{ marginTop: 32, fontSize: 32, lineHeight: 38 }}>{c.title}</T>
              <T kind="body" style={{ marginTop: 10, color: t.c.text2, fontSize: 17, lineHeight: 24 }}>{c.text}</T>
            </View>
          );
        })}
      </Animated.ScrollView>
      <View style={{ paddingHorizontal: 24, paddingBottom: ins.bottom + 16 }}>
        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 22 }}>
          {WELCOME.map((_, i) => (
            <Animated.View key={i} style={{ height: 6, borderRadius: 3, backgroundColor: t.tone,
              width: x.interpolate({ inputRange: [(i - 1) * w, i * w, (i + 1) * w], outputRange: [6, 24, 6], extrapolate: 'clamp' }),
              opacity: x.interpolate({ inputRange: [(i - 1) * w, i * w, (i + 1) * w], outputRange: [0.3, 1, 0.3], extrapolate: 'clamp' }) }} />
          ))}
        </View>
        <Btn title={page < 2 ? 'Continuar' : 'Criar minha conta'} onPress={() => (page < 2 ? toPage(page + 1) : onNext())} />
        <Tap onPress={onLogin} label="Já tenho conta" style={{ alignItems: 'center', paddingVertical: 14, marginTop: 4 }}>
          <Text style={{ color: t.toneText, fontSize: 15, fontWeight: '600' }}>Já tenho conta</Text>
        </Tap>
      </View>
    </View>
  );
}

// ——— Moldura das etapas ———

function TopBar({ onBack, sections, section, stepIndex, stepCount, hideBack }) {
  const t = useTheme();
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', height: 48, gap: 10 }}>
        {hideBack ? <View style={{ width: 44 }} /> : (
          <Tap onPress={onBack} label="Voltar" style={{ width: 44, height: 44 }}>
            <Glass radius={22} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="back" size={22} color={t.c.text} />
            </Glass>
          </Tap>
        )}
        {sections ? (
          <View style={{ flex: 1, flexDirection: 'row', gap: 6 }}>
            {sections.map((name, i) => (
              <Segment key={name} name={name} state={i < section ? 1 : i === section ? (stepIndex + 1) / Math.max(1, stepCount) : 0} active={i === section} />
            ))}
          </View>
        ) : <View style={{ flex: 1 }} />}
        <View style={{ width: 8 }} />
      </View>
    </View>
  );
}

function Segment({ name, state, active }) {
  const t = useTheme();
  const v = useRef(new Animated.Value(state)).current;
  useEffect(() => { Animated.spring(v, { toValue: state, damping: 22, stiffness: 180, useNativeDriver: false }).start(); }, [state]);
  return (
    <View style={{ flex: 1 }}>
      <View style={{ height: 5, borderRadius: 3, backgroundColor: t.c.surface2, overflow: 'hidden' }}>
        <Animated.View style={{ height: 5, borderRadius: 3, backgroundColor: t.tone, width: v.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }} />
      </View>
      <Text numberOfLines={1} style={{ fontSize: 11, marginTop: 5, color: active ? t.toneText : t.c.text2, fontWeight: active ? '700' : '500' }}>{name}</Text>
    </View>
  );
}

// Cada etapa nova entra deslizando do lado certo (para frente ou para trás) e clareando.
function StepIn({ dir, children }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => { spring(v, 1, SPRING); }, []);
  return (
    <Animated.View style={{ flex: 1, opacity: v.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 1, 1] }),
      transform: [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [dir * 48, 0] }) }] }}>
      {children}
    </Animated.View>
  );
}

// Cartão grande de escolha, com ícone, texto e marca de selecionado.
function Choice({ icon, title, sub, on, onPress, children }) {
  const t = useTheme();
  return (
    <Tap onPress={() => { haptic.select(); onPress(); }} label={title} scale={0.98}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 22, backgroundColor: on ? alpha(t.tone, t.dark ? 0.2 : 0.13) : t.c.surface, borderWidth: 2, borderColor: on ? t.tone : 'transparent' }}>
      {icon ? <IconTile icon={icon} size={48} /> : null}
      {children}
      <View style={{ flex: 1 }}>
        <T kind="h">{title}</T>
        {sub ? <T kind="sub" style={{ marginTop: 2 }}>{sub}</T> : null}
      </View>
      <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: on ? t.tone : t.c.line, backgroundColor: on ? t.tone : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
        {on ? <Icon name="check" size={14} color={t.onTone} stroke={2.6} /> : null}
      </View>
    </Tap>
  );
}

function Stepper({ label, value, onMinus, onPlus }) {
  const t = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: t.c.surface, borderRadius: 18, padding: 12, alignItems: 'center' }}>
      <T kind="small">{label}</T>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 }}>
        <Tap onPress={onMinus} label={`Diminuir ${label}`} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.c.surface2, alignItems: 'center', justifyContent: 'center' }}><Icon name="minus" size={18} color={t.c.text} /></Tap>
        <Text style={{ fontFamily: t.fonts.titleStrong, fontSize: 22, color: t.c.text, minWidth: 64, textAlign: 'center' }}>{value}</Text>
        <Tap onPress={onPlus} label={`Aumentar ${label}`} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.c.surface2, alignItems: 'center', justifyContent: 'center' }}><Icon name="plus" size={18} color={t.c.text} /></Tap>
      </View>
    </View>
  );
}

function SummaryRow({ icon, label, value, onEdit }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 }}>
      <Icon name={icon} size={20} color={t.c.text2} />
      <View style={{ flex: 1 }}>
        <T kind="small">{label}</T>
        <T kind="body" numberOfLines={2}>{value || 'Não informado'}</T>
      </View>
      {onEdit ? (
        <Tap onPress={onEdit} label={`Editar ${label}`} style={{ height: 36, paddingHorizontal: 10, justifyContent: 'center' }}>
          <Text style={{ color: t.toneText, fontWeight: '600', fontSize: 14 }}>Editar</Text>
        </Tap>
      ) : null}
    </View>
  );
}

async function pickImage(camera) {
  if (camera && Platform.OS !== 'web') {
    const p = await ImagePicker.requestCameraPermissionsAsync();
    if (!p.granted) return { denied: true };
  }
  const launch = camera && Platform.OS !== 'web' ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync;
  const r = await launch({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7 });
  if (r.canceled || !r.assets || !r.assets[0]) return {};
  return { uri: r.assets[0].uri };
}

// ——— As etapas ———
// Cada uma devolve título, corpo e o botão principal. O botão só acende quando a etapa está completa.

const STEP_VIEWS = {
  role: ({ t, role, go }, { setRole }) => ({
    eyebrow: 'Bem-vindo',
    title: 'Como você vai usar o netpet?',
    sub: 'Escolha o tipo de conta. Dá para ter as duas depois, em Ajustes.',
    body: (
      <View style={{ gap: 12, marginTop: 24 }}>
        <Choice icon="paw" title="Tenho pet" sub="Perfil do pet, fotos, matilhas e agendamentos" on={role === 'tutor'} onPress={() => setRole('tutor')} />
        <Choice icon="store" title="Tenho um negócio pet" sub="Banho e tosa, veterinário, hotel, creche, adestrador ou passeador" on={role === 'biz'} onPress={() => setRole('biz')} />
      </View>
    ),
    cta: 'Continuar',
    onCta: () => go('method'),
  }),

  method: ({ t, acc, setAcc, go, role }, { signedIn }) => ({
    eyebrow: 'Passo 1 · Conta',
    title: role === 'biz' ? 'Crie a conta do seu negócio' : 'Crie sua conta',
    sub: 'Escolha como prefere entrar. Seu endereço nunca aparece no perfil.',
    body: (
      <View style={{ gap: 10, marginTop: 24 }}>
        <ProviderButton title="Continuar com Apple" icon="apple" kind="dark" onDone={() => { setAcc((a) => ({ ...a, via: 'Apple', name: a.name || 'David Henrique', email: 'voce@exemplo.com.br' })); signedIn(); }} />
        <ProviderButton title="Continuar com Google" icon="globe" kind="secondary" onDone={() => { setAcc((a) => ({ ...a, via: 'Google', name: a.name || 'David Henrique', email: 'voce@exemplo.com.br' })); signedIn(); }} />
        <Btn title="Continuar com e-mail" icon="mail" kind="secondary" onPress={() => { setAcc((a) => ({ ...a, via: 'e-mail' })); go('email'); }} />
        <Btn title="Continuar com celular" icon="phone" kind="secondary" onPress={() => { setAcc((a) => ({ ...a, via: 'celular' })); go('phone'); }} />
        <T kind="small" center style={{ marginTop: 14, lineHeight: 18 }}>
          Ao continuar, você aceita os Termos de Uso e a Política de Privacidade do netpet, de acordo com a LGPD.
        </T>
      </View>
    ),
  }),

  email: ({ acc, setAcc }, { signedIn }) => {
    const strong = acc.pass.length >= 8 && /\d/.test(acc.pass) && /[a-zA-Z]/.test(acc.pass);
    const okName = acc.name.trim().length >= 2;
    const okMail = validEmail(acc.email);
    return {
      eyebrow: 'Passo 1 · Conta',
      title: 'Seus dados de acesso',
      sub: 'Use um e-mail que você abre sempre. É por ele que você recupera a senha.',
      body: (
        <View style={{ gap: 14, marginTop: 22 }}>
          <Field label="Seu nome" value={acc.name} onChangeText={(v) => setAcc((a) => ({ ...a, name: v }))} placeholder="Como quer ser chamado" icon="user" autoCapitalize="words" ok={okName} />
          <Field label="E-mail" value={acc.email} onChangeText={(v) => setAcc((a) => ({ ...a, email: v }))} placeholder="voce@exemplo.com" icon="mail" keyboardType="email-address" autoCapitalize="none"
            ok={okMail} error={acc.email.length > 4 && !okMail ? 'Confira o e-mail: falta o @ ou o domínio.' : null} />
          <Field label="Senha" value={acc.pass} onChangeText={(v) => setAcc((a) => ({ ...a, pass: v }))} placeholder="Pelo menos 8 caracteres" icon="lock" secure autoCapitalize="none"
            ok={strong} hint={acc.pass && !strong ? 'Use 8 caracteres ou mais, com letras e números.' : null} />
          <PasswordMeter pass={acc.pass} />
        </View>
      ),
      cta: 'Criar conta',
      disabled: !(okName && okMail && strong),
      onCta: signedIn,
    };
  },

  phone: ({ acc, setAcc, go }) => {
    const ok = onlyDigits(acc.phone).length === 11 && acc.name.trim().length >= 2;
    return {
      eyebrow: 'Passo 1 · Conta',
      title: 'Qual é o seu celular?',
      sub: 'Vamos mandar um código por SMS para confirmar que é você.',
      body: (
        <View style={{ gap: 14, marginTop: 22 }}>
          <Field label="Seu nome" value={acc.name} onChangeText={(v) => setAcc((a) => ({ ...a, name: v }))} placeholder="Como quer ser chamado" icon="user" autoCapitalize="words" ok={acc.name.trim().length >= 2} />
          <Field label="Celular com DDD" value={acc.phone} onChangeText={(v) => setAcc((a) => ({ ...a, phone: maskPhone(v) }))} placeholder="(11) 91234-5678" icon="phone" keyboardType="phone-pad" ok={onlyDigits(acc.phone).length === 11} />
        </View>
      ),
      cta: 'Enviar código',
      disabled: !ok,
      onCta: () => go('code'),
    };
  },

  code: ({ acc, setAcc }, { signedIn }) => ({
    eyebrow: 'Passo 1 · Conta',
    title: 'Digite o código',
    sub: `Enviamos 6 números para ${acc.phone}. Neste app de exemplo, qualquer código funciona.`,
    body: <CodeInput value={acc.code} onChange={(v) => { setAcc((a) => ({ ...a, code: v })); if (v.length === 6) { haptic.success(); setTimeout(signedIn, 350); } }} />,
    cta: 'Confirmar',
    disabled: acc.code.length < 6,
    onCta: signedIn,
  }),

  // ——— Tutor ———

  photo: ({ t, pet, setPet, go, s }) => ({
    eyebrow: 'Passo 2 · Seu pet',
    title: 'Comece pela foto do seu pet',
    sub: 'Ela aparece no perfil, nas histórias e na carteirinha. Dá para trocar depois.',
    body: <PhotoPicker pet={pet} setPet={setPet} s={s} />,
    cta: 'Continuar',
    onCta: () => go('name'),
    skip: pet.photo ? null : 'Adicionar a foto depois',
    onSkip: () => go('name'),
  }),

  name: ({ pet, setPet, go }) => ({
    eyebrow: 'Passo 2 · Seu pet',
    title: 'Qual é o nome do seu pet?',
    sub: 'É assim que o perfil vai aparecer para todo mundo.',
    body: <Field value={pet.name} onChangeText={(v) => setPet((p) => ({ ...p, name: v }))} placeholder="Ex.: Paçoca" autoFocus autoCapitalize="words" maxLength={24}
      onSubmit={() => pet.name.trim() && go('species')} style={{ marginTop: 22 }} hint={`${pet.name.length}/24`} />,
    cta: 'Continuar',
    disabled: !pet.name.trim(),
    onCta: () => go('species'),
  }),

  species: ({ t, pet, setPet, go }) => ({
    eyebrow: 'Passo 2 · Seu pet',
    title: `${pet.name || 'Seu pet'} é cão ou gato?`,
    body: (
      <View style={{ marginTop: 22, gap: 18 }}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {['Cão', 'Gato'].map((sp) => {
            const on = pet.species === sp;
            return (
              <Tap key={sp} onPress={() => { haptic.select(); setPet((p) => ({ ...p, species: sp, breed: '', size: sp === 'Gato' ? 'Pequeno' : p.size })); }} outerStyle={{ flex: 1 }} label={sp}
                style={{ height: 136, borderRadius: 24, backgroundColor: on ? alpha(t.tone, 0.16) : t.c.surface, borderWidth: 2, borderColor: on ? t.tone : 'transparent', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <Icon name="paw" size={40} color={on ? t.toneText : t.c.text2} filled={on} />
                <Text style={{ fontSize: 18, color: t.c.text, fontWeight: on ? '600' : '400' }}>{sp}</Text>
              </Tap>
            );
          })}
        </View>
        <View>
          <T kind="label" style={{ marginBottom: 8, marginLeft: 4 }}>Sexo</T>
          <Segmented options={['Macho', 'Fêmea']} value={pet.sex} onChange={(v) => setPet((p) => ({ ...p, sex: v }))} />
        </View>
      </View>
    ),
    cta: 'Continuar',
    onCta: () => go('breed'),
  }),

  breed: (ctx) => ({
    eyebrow: 'Passo 2 · Seu pet',
    title: `Qual é a raça ${ctx.pet.sex === 'Fêmea' ? 'da' : 'do'} ${ctx.pet.name || 'pet'}?`,
    sub: 'Sem raça definida também é raça, e das melhores.',
    body: <BreedPicker pet={ctx.pet} setPet={ctx.setPet} />,
    cta: 'Continuar',
    disabled: !ctx.pet.breed.trim(),
    onCta: () => ctx.go('born'),
  }),

  born: ({ t, pet, setPet, go }) => {
    const exact = ageFrom(pet.born);
    return {
      eyebrow: 'Passo 2 · Seu pet',
      title: 'Quando nasceu?',
      sub: 'Serve para lembrar das vacinas e comemorar o aniversário.',
      body: (
        <View style={{ marginTop: 20, gap: 14 }}>
          <Field label="Data de nascimento" value={pet.born} onChangeText={(v) => setPet((p) => ({ ...p, born: maskDate(v), age: ageFrom(maskDate(v)) || '' }))}
            placeholder="dd/mm/aaaa" keyboardType="number-pad" icon="cake" ok={!!exact}
            hint={exact ? `${pet.name || 'Seu pet'} tem ${exact}.` : null} error={pet.born.length === 10 && !exact ? 'Essa data não parece certa.' : null} />
          <T kind="label" style={{ marginTop: 6, marginLeft: 4 }}>Não sabe a data? Escolha a idade aproximada</T>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {AGES.map(([a, sub]) => (
              <Chip key={a} title={`${a} · ${sub}`} active={!pet.born && pet.age === sub} onPress={() => setPet((p) => ({ ...p, born: '', age: sub }))} />
            ))}
          </View>
        </View>
      ),
      cta: 'Continuar',
      disabled: !(exact || pet.age),
      onCta: () => go(pet.species === 'Gato' ? 'color' : 'size'),
    };
  },

  size: ({ t, pet, setPet, go }) => ({
    eyebrow: 'Passo 2 · Seu pet',
    title: 'Qual é o porte?',
    sub: 'O porte define o preço de banho e tosa nos parceiros.',
    body: (
      <View style={{ gap: 10, marginTop: 20 }}>
        {[['Pequeno', 'Até 10 kg'], ['Médio', 'De 10 a 25 kg'], ['Grande', 'Mais de 25 kg']].map(([sz, sub]) => (
          <Choice key={sz} title={sz} sub={sub} on={pet.size === sz} onPress={() => setPet((p) => ({ ...p, size: sz }))}>
            <View style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="paw" size={sz === 'Pequeno' ? 22 : sz === 'Médio' ? 30 : 40} color={pet.size === sz ? t.toneText : t.c.text2} filled={pet.size === sz} />
            </View>
          </Choice>
        ))}
      </View>
    ),
    cta: 'Continuar',
    onCta: () => go('color'),
  }),

  color: ({ t, pet, setPet, go }) => {
    const p = { ...pet, color: pet.color, colorDark: pet.color, onColor: '#FFFFFF', name: pet.name || 'Pet' };
    return {
      eyebrow: 'Passo 2 · Seu pet',
      title: `Uma cor para ${pet.sex === 'Fêmea' ? 'a' : 'o'} ${pet.name || 'seu pet'}`,
      sub: 'Ela pinta o anel do avatar, a carteirinha e o cartão de compartilhar.',
      body: (
        <View style={{ marginTop: 22, alignItems: 'center' }}>
          <PetAvatar pet={p} size={132} ring={5} gap={4} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, justifyContent: 'center', marginTop: 26 }}>
            {PET_COLORS.map((c) => (
              <Tap key={c} onPress={() => { haptic.select(); setPet((x) => ({ ...x, color: c })); }} label={`Cor ${c}`} scale={0.88}
                style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: c, borderWidth: 3, borderColor: pet.color === c ? t.c.text : 'transparent' }} />
            ))}
          </View>
        </View>
      ),
      cta: 'Continuar',
      onCta: () => go('review'),
    };
  },

  review: ({ t, pet, go, jump }) => {
    const p = { ...pet, colorDark: pet.color, name: pet.name || 'Pet' };
    return {
      eyebrow: 'Passo 2 · Seu pet',
      title: 'Confira o perfil',
      sub: 'Toque em Editar para mudar qualquer coisa.',
      body: (
        <View style={{ marginTop: 20 }}>
          <View style={{ borderRadius: 26, padding: 18, backgroundColor: alpha(pet.color, t.dark ? 0.28 : 0.16), flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <PetAvatar pet={p} size={72} ring={3} gap={3} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: t.fonts.titleStrong, fontSize: 26, color: t.c.text }}>{pet.name}</Text>
              <T kind="sub">{pet.breed} · {pet.age || 'idade não informada'}</T>
            </View>
          </View>
          <View style={{ backgroundColor: t.c.surface, borderRadius: 22, paddingHorizontal: 16, marginTop: 14 }}>
            <SummaryRow icon="camera" label="Foto" value={pet.photo ? 'Escolhida' : 'Sem foto por enquanto'} onEdit={() => jump('photo')} />
            <SummaryRow icon="paw" label="Espécie e sexo" value={`${pet.species} · ${pet.sex}`} onEdit={() => jump('species')} />
            <SummaryRow icon="tag" label="Raça" value={pet.breed} onEdit={() => jump('breed')} />
            <SummaryRow icon="cake" label="Nascimento" value={pet.born || pet.age} onEdit={() => jump('born')} />
            {pet.species === 'Cão' ? <SummaryRow icon="scale" label="Porte" value={pet.size} onEdit={() => jump('size')} /> : null}
          </View>
        </View>
      ),
      cta: `Criar o perfil ${pet.sex === 'Fêmea' ? 'da' : 'do'} ${pet.name}`,
      onCta: () => go('perms'),
    };
  },

  perms: ({ prefs, setPrefs, go }) => ({
    eyebrow: 'Passo 3 · Permissões',
    title: 'Duas permissões, só se você quiser',
    sub: 'Pedimos agora porque é aqui que elas fazem sentido. Dá para mudar nos Ajustes do celular.',
    body: (
      <View style={{ gap: 12, marginTop: 22 }}>
        <PermCard icon="pin" title="Localização aproximada" text="Para mostrar parceiros e alertas de pet perdido no seu bairro. Seu endereço nunca fica público."
          on={prefs.loc} onAllow={() => setPrefs((p) => ({ ...p, loc: true }))} />
        <PermCard icon="bell" title="Notificações" text="Para avisar quando o banho começar, quando ele estiver pronto e quando chegar a hora da vacina."
          on={prefs.notif} onAllow={() => setPrefs((p) => ({ ...p, notif: true }))} />
      </View>
    ),
    cta: 'Continuar',
    onCta: () => go('interests'),
  }),

  interests: ({ t, prefs, setPrefs, pet }, { finishTutor }) => ({
    eyebrow: 'Passo 4 · Interesses',
    title: `Do que ${pet.name || 'seu pet'} gosta?`,
    sub: 'Escolha alguns assuntos para montar o seu feed.',
    body: (
      <View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 20 }}>
          {INTERESTS.map((i) => (
            <Chip key={i} title={i} active={prefs.interests.includes(i)} onPress={() => setPrefs((p) => ({ ...p, interests: p.interests.includes(i) ? p.interests.filter((x) => x !== i) : [...p.interests, i] }))} />
          ))}
        </View>
        <T kind="h" style={{ marginTop: 28, marginBottom: 6 }}>Pets para seguir</T>
        {OTHER_PETS.slice(0, 4).map((k) => (
          <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 }}>
            <PetAvatar pet={k} size={44} />
            <View style={{ flex: 1 }}>
              <T kind="body" style={{ fontWeight: '600' }}>{PETS[k].name}</T>
              <T kind="sub">{PETS[k].breed} · {PETS[k].area}</T>
            </View>
            <Btn small full={false} kind={prefs.follow[k] ? 'secondary' : 'primary'} title={prefs.follow[k] ? 'Seguindo' : 'Seguir'} onPress={() => setPrefs((p) => ({ ...p, follow: { ...p.follow, [k]: !p.follow[k] } }))} />
          </View>
        ))}
        <T kind="h" style={{ marginTop: 20, marginBottom: 6 }}>Matilhas perto de você</T>
        {MATILHAS.slice(0, 2).map((m) => (
          <View key={m.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 }}>
            <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: m.color, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#FFF', fontWeight: '600' }}>{m.initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <T kind="body" style={{ fontWeight: '600' }}>{m.name}</T>
              <T kind="sub">{m.members} membros · {m.kind}</T>
            </View>
            <Btn small full={false} kind={prefs.follow[m.key] ? 'secondary' : 'primary'} title={prefs.follow[m.key] ? 'Na matilha' : 'Entrar'} onPress={() => setPrefs((p) => ({ ...p, follow: { ...p.follow, [m.key]: !p.follow[m.key] } }))} />
          </View>
        ))}
      </View>
    ),
    cta: 'Entrar no netpet',
    ctaIcon: 'paw',
    onCta: finishTutor,
  }),

  // ——— Estabelecimento ———

  kind: ({ t, biz, setBiz, go }) => ({
    eyebrow: 'Passo 2 · Negócio',
    title: 'O que você oferece?',
    sub: 'Pode marcar mais de um. É assim que os tutores vão encontrar você na busca.',
    body: (
      <View style={{ gap: 10, marginTop: 20 }}>
        {CATEGORIES.map((c) => {
          const on = biz.kinds.includes(c.key);
          return <Choice key={c.key} icon={c.icon} title={c.label} on={on} onPress={() => setBiz((b) => ({ ...b, kinds: on ? b.kinds.filter((k) => k !== c.key) : [...b.kinds, c.key] }))} />;
        })}
      </View>
    ),
    cta: 'Continuar',
    disabled: !biz.kinds.length,
    onCta: () => {
      setBiz((b) => ({ ...b, services: b.kinds.flatMap((k) => SUGGESTED[k].map(([name, mins, prices]) => ({ name, mins, prices: prices.slice(), on: true, kind: k }))) }));
      go('bizData');
    },
  }),

  bizData: ({ biz, setBiz, go }) => {
    const docDigits = onlyDigits(biz.number).length;
    const okDoc = biz.doc === 'CNPJ' ? docDigits === 14 : docDigits === 11;
    const ok = biz.name.trim().length >= 3 && okDoc && onlyDigits(biz.whatsapp).length === 11;
    return {
      eyebrow: 'Passo 2 · Negócio',
      title: 'Dados do negócio',
      sub: 'O nome aparece para os tutores. O documento fica só com a equipe de verificação.',
      body: (
        <View style={{ gap: 14, marginTop: 20 }}>
          <Field label="Nome do negócio" value={biz.name} onChangeText={(v) => setBiz((b) => ({ ...b, name: v }))} placeholder="Ex.: Pet Shop Patas Felizes" icon="store" autoCapitalize="words" ok={biz.name.trim().length >= 3} />
          <View>
            <T kind="small" style={{ marginBottom: 6, marginLeft: 4, fontSize: 13.5 }}>Você atende como</T>
            <Segmented options={[{ key: 'CNPJ', label: 'Empresa (CNPJ)' }, { key: 'CPF', label: 'Autônomo (CPF)' }]} value={biz.doc} onChange={(v) => setBiz((b) => ({ ...b, doc: v, number: '' }))} />
          </View>
          <Field label={biz.doc} value={biz.number} onChangeText={(v) => setBiz((b) => ({ ...b, number: b.doc === 'CNPJ' ? maskCnpj(v) : maskCpf(v) }))}
            placeholder={biz.doc === 'CNPJ' ? '00.000.000/0000-00' : '000.000.000-00'} keyboardType="number-pad" icon="doc" ok={okDoc} />
          <Field label="WhatsApp do negócio" value={biz.whatsapp} onChangeText={(v) => setBiz((b) => ({ ...b, whatsapp: maskPhone(v) }))} placeholder="(11) 91234-5678" keyboardType="phone-pad" icon="phone"
            ok={onlyDigits(biz.whatsapp).length === 11} hint="Para avisos de pedidos novos. Não aparece no perfil." />
        </View>
      ),
      cta: 'Continuar',
      disabled: !ok,
      onCta: () => go('address'),
    };
  },

  address: ({ t, biz, setBiz, go }) => {
    const cepOk = onlyDigits(biz.cep).length === 8;
    const mobile = biz.kinds.every((k) => k === 'passeador' || k === 'adestrador');
    return {
      eyebrow: 'Passo 2 · Negócio',
      title: mobile ? 'Onde você atende?' : 'Onde fica o negócio?',
      sub: 'Usamos para mostrar você a tutores do bairro e calcular a distância.',
      body: (
        <View style={{ gap: 14, marginTop: 20 }}>
          <Field label="CEP" value={biz.cep} onChangeText={(v) => {
            const cep = maskCep(v);
            setBiz((b) => ({ ...b, cep, street: onlyDigits(cep).length === 8 ? 'Rua Harmonia · Vila Madalena, São Paulo' : '' }));
          }} placeholder="00000-000" keyboardType="number-pad" icon="pin" ok={cepOk} />
          {biz.street ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 16, backgroundColor: alpha(t.tone, 0.12) }}>
              <Icon name="location" size={20} color={t.toneText} />
              <T kind="body" style={{ flex: 1 }}>{biz.street}</T>
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Field style={{ flex: 1 }} label="Número" value={biz.num} onChangeText={(v) => setBiz((b) => ({ ...b, num: onlyDigits(v).slice(0, 6) }))} placeholder="410" keyboardType="number-pad" />
            <Field style={{ flex: 1.4 }} label="Complemento" value={biz.extra} onChangeText={(v) => setBiz((b) => ({ ...b, extra: v }))} placeholder="Opcional" />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, backgroundColor: t.c.surface }}>
            <IconTile icon="truck" size={40} />
            <View style={{ flex: 1 }}>
              <T kind="body">Atendo na casa do tutor</T>
              <T kind="small">Leva e traz, passeio ou aula em domicílio</T>
            </View>
            <Toggle value={biz.homeVisit || mobile} onChange={(v) => setBiz((b) => ({ ...b, homeVisit: v }))} label="Atendo na casa do tutor" />
          </View>
        </View>
      ),
      cta: 'Continuar',
      disabled: !(cepOk && biz.num),
      onCta: () => go('services'),
    };
  },

  services: ({ t, biz, setBiz, go }) => {
    const set = (i, patch) => setBiz((b) => ({ ...b, services: b.services.map((x, j) => (j === i ? { ...x, ...patch } : x)) }));
    return {
      eyebrow: 'Passo 3 · Serviços',
      title: 'Serviços e preços',
      sub: 'Sugerimos os mais comuns. Ajuste os preços e desligue o que você não faz.',
      body: (
        <View style={{ gap: 10, marginTop: 20 }}>
          {biz.services.map((sv, i) => (
            <View key={sv.name} style={{ backgroundColor: t.c.surface, borderRadius: 20, padding: 14, opacity: sv.on ? 1 : 0.55 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <T kind="h" style={{ fontSize: 16 }}>{sv.name}</T>
                  <T kind="small">{sv.mins >= 600 ? 'diária' : `${sv.mins} min`}</T>
                </View>
                <Toggle value={sv.on} onChange={(v) => set(i, { on: v })} label={`Oferecer ${sv.name}`} />
              </View>
              {sv.on ? (
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                  {sv.prices.map((p, j) => (
                    <View key={j} style={{ flex: 1, backgroundColor: t.c.surface2, borderRadius: 14, padding: 8, alignItems: 'center' }}>
                      <T kind="small">{sv.prices.length > 1 ? SIZES[j] : 'Preço'}</T>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                        <Tap onPress={() => set(i, { prices: sv.prices.map((x, k) => (k === j ? Math.max(0, x - 5) : x)) })} label={`Diminuir preço ${sv.name}`} style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}><Icon name="minus" size={16} color={t.c.text2} /></Tap>
                        <Text style={{ color: t.c.text, fontWeight: '700', fontSize: 15, minWidth: 54, textAlign: 'center' }}>R$ {p}</Text>
                        <Tap onPress={() => set(i, { prices: sv.prices.map((x, k) => (k === j ? x + 5 : x)) })} label={`Aumentar preço ${sv.name}`} style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}><Icon name="plus" size={16} color={t.c.text2} /></Tap>
                      </View>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          ))}
          <Note icon="info">O netpet cobra 12% só do que for pago pelo app. Pagamento no local não tem taxa.</Note>
        </View>
      ),
      cta: 'Continuar',
      disabled: !biz.services.some((x) => x.on),
      onCta: () => go('hours'),
    };
  },

  hours: ({ t, biz, setBiz, go }) => ({
    eyebrow: 'Passo 3 · Serviços',
    title: 'Dias e horários',
    sub: 'Os tutores só conseguem agendar dentro desse horário. Dá para bloquear dias depois, na agenda.',
    body: (
      <View style={{ marginTop: 20, gap: 18 }}>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {DAYS.map((d, i) => {
            const on = biz.days.includes(i);
            return (
              <Tap key={d} onPress={() => { haptic.select(); setBiz((b) => ({ ...b, days: on ? b.days.filter((x) => x !== i) : [...b.days, i].sort() })); }} outerStyle={{ flex: 1 }} label={d} scale={0.9}
                style={{ height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? t.tone : t.c.surface }}>
                <Text style={{ color: on ? t.onTone : t.c.text2, fontWeight: '600', fontSize: 13.5 }}>{d}</Text>
              </Tap>
            );
          })}
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Stepper label="Abre às" value={hhmm(biz.open)} onMinus={() => setBiz((b) => ({ ...b, open: Math.max(300, b.open - 30) }))} onPlus={() => setBiz((b) => ({ ...b, open: Math.min(b.close - 60, b.open + 30) }))} />
          <Stepper label="Fecha às" value={hhmm(biz.close)} onMinus={() => setBiz((b) => ({ ...b, close: Math.max(b.open + 60, b.close - 30) }))} onPlus={() => setBiz((b) => ({ ...b, close: Math.min(1410, b.close + 30) }))} />
        </View>
        <Note icon="clock">{biz.days.length ? `${biz.days.map((i) => DAYS[i]).join(', ')}, das ${hhmm(biz.open)} às ${hhmm(biz.close)}.` : 'Escolha pelo menos um dia.'}</Note>
      </View>
    ),
    cta: 'Continuar',
    disabled: !biz.days.length,
    onCta: () => go('photos'),
  }),

  photos: ({ t, biz, setBiz, go, s }) => ({
    eyebrow: 'Passo 3 · Serviços',
    title: 'Mostre o seu espaço',
    sub: 'Negócios com fotos recebem até 3 vezes mais pedidos. A logo aparece na busca e no mapa.',
    body: <BizPhotos biz={biz} setBiz={setBiz} s={s} />,
    cta: 'Continuar',
    onCta: () => go('payout'),
    skip: biz.photos.length ? null : 'Adicionar depois',
    onSkip: () => go('payout'),
  }),

  payout: ({ biz, setBiz, go }) => {
    const ok = biz.pix.trim().length >= 5;
    const ph = { CNPJ: biz.number || '00.000.000/0000-00', 'E-mail': 'financeiro@seunegocio.com', Celular: '(11) 91234-5678', Aleatória: 'Cole a chave aleatória' }[biz.pixType];
    return {
      eyebrow: 'Passo 4 · Repasse',
      title: 'Para onde vai o dinheiro?',
      sub: 'Os pagamentos feitos pelo app caem na sua chave Pix toda segunda-feira.',
      body: (
        <View style={{ gap: 14, marginTop: 20 }}>
          <Segmented options={['CNPJ', 'E-mail', 'Celular', 'Aleatória']} value={biz.pixType} onChange={(v) => setBiz((b) => ({ ...b, pixType: v, pix: v === 'CNPJ' ? b.number : '' }))} />
          <Field label="Chave Pix" value={biz.pix} onChangeText={(v) => setBiz((b) => ({ ...b, pix: b.pixType === 'Celular' ? maskPhone(v) : v }))} placeholder={ph} icon="pix" autoCapitalize="none"
            keyboardType={biz.pixType === 'Celular' ? 'phone-pad' : biz.pixType === 'E-mail' ? 'email-address' : 'default'} ok={ok} />
          <Note icon="lock">A chave precisa estar no nome do negócio ou do responsável. Conferimos antes do primeiro repasse.</Note>
        </View>
      ),
      cta: 'Continuar',
      disabled: !ok,
      onCta: () => go('bizReview'),
    };
  },

  bizReview: ({ t, biz, acc, jump, go }) => {
    const on = biz.services.filter((x) => x.on);
    return {
      eyebrow: 'Passo 4 · Repasse',
      title: 'Confira e envie',
      sub: 'A verificação leva até 24 horas. Enquanto isso, você já pode montar a agenda.',
      body: (
        <View style={{ marginTop: 18 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 24, backgroundColor: alpha(t.tone, t.dark ? 0.22 : 0.13) }}>
            {biz.logo ? <Photo name={biz.logo} style={{ width: 60, height: 60, borderRadius: 18 }} /> : (
              <View style={{ width: 60, height: 60, borderRadius: 18, backgroundColor: '#5B7C6E', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 20 }}>{biz.name.trim().slice(0, 2).toUpperCase()}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <T kind="title" numberOfLines={2}>{biz.name}</T>
              <T kind="sub">{biz.kinds.map((k) => CATEGORIES.find((c) => c.key === k).label).join(' · ')}</T>
            </View>
          </View>
          <View style={{ backgroundColor: t.c.surface, borderRadius: 22, paddingHorizontal: 16, marginTop: 14 }}>
            <SummaryRow icon="user" label="Responsável" value={`${acc.name || 'David'} · ${acc.email || acc.phone || acc.via}`} />
            <SummaryRow icon="doc" label={biz.doc} value={biz.number} onEdit={() => jump('bizData')} />
            <SummaryRow icon="pin" label="Endereço" value={`${biz.street.split(' · ')[0]}, ${biz.num}${biz.extra ? ` · ${biz.extra}` : ''}`} onEdit={() => jump('address')} />
            <SummaryRow icon="scissors" label="Serviços" value={`${on.length} serviços, a partir de R$ ${Math.min(...on.map((x) => Math.min(...x.prices.filter((p) => p > 0).concat([9999]))))}`} onEdit={() => jump('services')} />
            <SummaryRow icon="clock" label="Horário" value={`${biz.days.map((i) => DAYS[i]).join(', ')} · ${hhmm(biz.open)} às ${hhmm(biz.close)}`} onEdit={() => jump('hours')} />
            <SummaryRow icon="pix" label="Repasse por Pix" value={`${biz.pixType} · ${biz.pix}`} onEdit={() => jump('payout')} />
          </View>
        </View>
      ),
      cta: 'Enviar para análise',
      ctaIcon: 'send',
      onCta: () => go('bizDone'),
    };
  },

  bizDone: ({ biz }, { finishBiz }) => ({
    body: <BizDone name={biz.name} />,
    cta: 'Abrir meu painel',
    onCta: finishBiz,
  }),
};

// ——— Peças das etapas ———

function ProviderButton({ title, icon, kind, onDone }) {
  const t = useTheme();
  const [busy, setBusy] = useState(false);
  if (busy) {
    return (
      <View style={{ height: 52, borderRadius: 26, backgroundColor: kind === 'dark' ? t.c.text : t.c.surface2, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 }}>
        <ActivityIndicator color={kind === 'dark' ? t.c.bg : t.c.text} />
        <Text style={{ color: kind === 'dark' ? t.c.bg : t.c.text, fontSize: 15 }}>Conectando…</Text>
      </View>
    );
  }
  return <Btn title={title} icon={icon} kind={kind} onPress={() => { setBusy(true); setTimeout(onDone, 900); }} />;
}

function PasswordMeter({ pass }) {
  const t = useTheme();
  const score = [pass.length >= 8, /\d/.test(pass), /[A-Z]/.test(pass) || /[^a-zA-Z0-9]/.test(pass), pass.length >= 12].filter(Boolean).length;
  if (!pass) return null;
  const label = ['Fraca', 'Fraca', 'Boa', 'Forte', 'Muito forte'][score];
  const color = score <= 1 ? '#C2453A' : score === 2 ? '#D9923B' : '#3F9B7C';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 4 }}>
      {[0, 1, 2, 3].map((i) => <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i < score ? color : t.c.surface2 }} />)}
      <Text style={{ color, fontSize: 12.5, fontWeight: '600', marginLeft: 6, width: 78 }}>{label}</Text>
    </View>
  );
}

function CodeInput({ value, onChange }) {
  const t = useTheme();
  const ref = useRef(null);
  const [left, setLeft] = useState(30);
  useEffect(() => {
    const id = setInterval(() => setLeft((x) => Math.max(0, x - 1)), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <View style={{ marginTop: 24 }}>
      <Tap onPress={() => ref.current && ref.current.focus()} scale={1} hitSlop={0} label="Campo do código" style={{ flexDirection: 'row', gap: 8 }}>
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const cur = i === value.length;
          return (
            <View key={i} style={{ flex: 1, height: 58, borderRadius: 16, backgroundColor: t.c.surface, borderWidth: 2, borderColor: cur ? t.tone : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontFamily: t.fonts.titleStrong, fontSize: 24, color: t.c.text }}>{value[i] || ''}</Text>
            </View>
          );
        })}
      </Tap>
      <TextInput ref={ref} value={value} onChangeText={(v) => onChange(onlyDigits(v).slice(0, 6))} keyboardType="number-pad" autoFocus maxLength={6}
        textContentType="oneTimeCode" accessibilityLabel="Código de 6 números" style={{ position: 'absolute', opacity: 0.02, height: 58, left: 0, right: 0, top: 0 }} />
      <T kind="sub" style={{ marginTop: 16 }}>{left ? `Reenviar código em ${left}s` : 'Não chegou? Toque para reenviar.'}</T>
    </View>
  );
}

function PhotoPicker({ pet, setPet, s }) {
  const t = useTheme();
  const v = useRef(new Animated.Value(pet.photo ? 1 : 0)).current;
  const choose = async (camera) => {
    try {
      const r = await pickImage(camera);
      if (r.denied) return s.toast('Sem acesso à câmera. Libere nos Ajustes do celular.');
      if (r.uri) {
        setPet((p) => ({ ...p, photo: r.uri }));
        v.setValue(0);
        spring(v, 1, { damping: 14, stiffness: 180 });
        haptic.light();
      }
    } catch (e) {
      s.toast('Não deu para abrir as fotos agora.');
    }
  };
  const sample = () => {
    setPet((p) => ({ ...p, photo: p.species === 'Gato' ? 'frida' : 'filhotes' }));
    v.setValue(0);
    spring(v, 1, { damping: 14, stiffness: 180 });
  };
  return (
    <View style={{ alignItems: 'center', marginTop: 26, gap: 16 }}>
      <Tap onPress={() => choose(false)} label="Escolher foto da galeria" scale={0.96}
        style={{ width: 184, height: 184, borderRadius: 92, borderWidth: 3, borderColor: pet.photo ? pet.color : t.c.line, borderStyle: pet.photo ? 'solid' : 'dashed', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: t.c.surface }}>
        {pet.photo ? (
          <Animated.View style={{ transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }], opacity: v }}>
            <Photo name={pet.photo} style={{ width: 172, height: 172, borderRadius: 86 }} />
          </Animated.View>
        ) : (
          <View style={{ alignItems: 'center', gap: 8 }}>
            <Icon name="camera" size={40} color={t.c.text2} />
            <T kind="small">Toque para escolher</T>
          </View>
        )}
      </Tap>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Btn small full={false} kind="secondary" icon="camera" title="Câmera" onPress={() => choose(true)} />
        <Btn small full={false} kind="secondary" icon="image" title="Galeria" onPress={() => choose(false)} />
      </View>
      <Tap onPress={sample} label="Usar uma foto de exemplo" style={{ paddingVertical: 8 }}>
        <Text style={{ color: t.toneText, fontSize: 14, fontWeight: '600' }}>Usar uma foto de exemplo</Text>
      </Tap>
      <T kind="small" center>Pedimos acesso à câmera e às fotos só agora, quando você precisa.</T>
    </View>
  );
}

function BreedPicker({ pet, setPet }) {
  const t = useTheme();
  const [q, setQ] = useState('');
  const list = BREEDS[pet.species].filter((b) => b !== 'Outra' && b.toLowerCase().includes(q.toLowerCase()));
  const custom = pet.breed && !BREEDS[pet.species].includes(pet.breed);
  return (
    <View style={{ marginTop: 20, gap: 14 }}>
      <Field value={q} onChangeText={setQ} placeholder="Buscar raça" icon="search" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {list.map((b) => <Chip key={b} title={b} active={pet.breed === b} onPress={() => setPet((p) => ({ ...p, breed: b }))} />)}
      </View>
      {q && !list.length ? (
        <Btn kind="outline" icon="plus" title={`Usar "${q}"`} onPress={() => setPet((p) => ({ ...p, breed: q.trim() }))} />
      ) : null}
      {custom ? <StatePill state="ok" icon="check" text={`Raça: ${pet.breed}`} /> : null}
    </View>
  );
}

function PermCard({ icon, title, text, on, onAllow }) {
  const t = useTheme();
  return (
    <View style={{ backgroundColor: t.c.surface, borderRadius: 22, padding: 16, gap: 12 }}>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <IconTile icon={icon} size={44} />
        <T kind="h" style={{ flex: 1 }}>{title}</T>
      </View>
      <T kind="sub">{text}</T>
      {on ? <StatePill state="ok" icon="check" text="Permitido" /> : <Btn small kind="secondary" title="Permitir" onPress={() => { haptic.light(); onAllow(); }} />}
    </View>
  );
}

function BizPhotos({ biz, setBiz, s }) {
  const t = useTheme();
  const add = async (logo) => {
    try {
      const r = await pickImage(false);
      if (r.uri) setBiz((b) => (logo ? { ...b, logo: r.uri } : { ...b, photos: [...b.photos, r.uri].slice(0, 6) }));
    } catch (e) {
      s.toast('Não deu para abrir as fotos agora.');
    }
  };
  const samples = () => setBiz((b) => ({ ...b, photos: ['amigos', 'pacoca2', 'dupla'] }));
  return (
    <View style={{ marginTop: 20, gap: 18 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <Tap onPress={() => add(true)} label="Escolher logo" style={{ width: 84, height: 84, borderRadius: 24, backgroundColor: t.c.surface, borderWidth: 2, borderStyle: 'dashed', borderColor: t.c.line, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {biz.logo ? <Photo name={biz.logo} style={{ width: 84, height: 84 }} /> : <Icon name="image" size={28} color={t.c.text2} />}
        </Tap>
        <View style={{ flex: 1 }}>
          <T kind="h">Logo</T>
          <T kind="sub">Quadrada, de preferência com fundo liso.</T>
        </View>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {biz.photos.map((p, i) => (
          <View key={`${p}${i}`} style={{ width: '31.5%', aspectRatio: 1, borderRadius: 16, overflow: 'hidden' }}>
            <Photo name={p} style={StyleSheet.absoluteFill} />
          </View>
        ))}
        {biz.photos.length < 6 ? (
          <Tap onPress={() => add(false)} label="Adicionar foto do espaço" outerStyle={{ width: '31.5%' }}
            style={{ aspectRatio: 1, borderRadius: 16, backgroundColor: t.c.surface, borderWidth: 2, borderStyle: 'dashed', borderColor: t.c.line, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="plus" size={26} color={t.c.text2} />
          </Tap>
        ) : null}
      </View>
      {!biz.photos.length ? (
        <Tap onPress={samples} label="Usar fotos de exemplo" style={{ alignSelf: 'center', paddingVertical: 8 }}>
          <Text style={{ color: t.toneText, fontSize: 14, fontWeight: '600' }}>Usar fotos de exemplo</Text>
        </Tap>
      ) : null}
    </View>
  );
}

function BizDone({ name }) {
  const t = useTheme();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => { haptic.success(); spring(v, 1, { damping: 11, stiffness: 150 }); }, []);
  const steps = [['Cadastro enviado', 'agora', true], ['Verificação dos documentos', 'até 24 horas', false], ['Liberado para receber agendamentos', 'avisamos por WhatsApp', false]];
  return (
    <View style={{ alignItems: 'center', paddingTop: 30 }}>
      <Animated.View style={{ width: 116, height: 116, borderRadius: 58, backgroundColor: t.tone, alignItems: 'center', justifyContent: 'center', transform: [{ scale: v }] }}>
        <Icon name="check" size={58} color={t.onTone} stroke={2.6} />
      </Animated.View>
      <T kind="display" center style={{ marginTop: 24 }}>Tudo certo!</T>
      <T kind="sub" center style={{ marginTop: 8, fontSize: 15.5, maxWidth: 300 }}>
        Recebemos o cadastro {name ? `do ${name}` : 'do seu negócio'}. Você já pode configurar a agenda e a equipe.
      </T>
      <View style={{ alignSelf: 'stretch', backgroundColor: t.c.surface, borderRadius: 22, padding: 16, marginTop: 26, gap: 4 }}>
        {steps.map(([title, sub, done], i) => (
          <View key={title} style={{ flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 8 }}>
            <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: done ? t.tone : t.c.surface2, alignItems: 'center', justifyContent: 'center' }}>
              {done ? <Icon name="check" size={15} color={t.onTone} stroke={2.4} /> : <Text style={{ color: t.c.text2, fontSize: 12 }}>{i + 1}</Text>}
            </View>
            <View style={{ flex: 1 }}>
              <T kind="body">{title}</T>
              <T kind="small">{sub}</T>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

// Ilustração de traço simples, de uma cor, só na entrada e nos estados vazios.
function WelcomeArt({ kind }) {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const size = Math.min(width - 48, 300);
  const c = t.toneText;
  const sw = 2.2;
  return (
    <View style={{ width: size, height: size * 0.72, borderRadius: 32, backgroundColor: alpha(t.tone, 0.12), alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size * 0.8} height={size * 0.6} viewBox="0 0 240 180">
        {kind === 'paw' ? (
          <>
            <Circle cx="120" cy="96" r="58" fill="none" stroke={c} strokeWidth={sw} />
            <Path d="M88 70c-6-18-2-32 8-34 8 10 8 22 4 32M152 70c6-18 2-32-8-34-8 10-8 22-4 32" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" />
            <Circle cx="102" cy="92" r="4" fill={c} />
            <Circle cx="138" cy="92" r="4" fill={c} />
            <Path d="M114 108c4 4 8 4 12 0M120 104v6" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" />
            <Path d="M190 40l4 10 10 4-10 4-4 10-4-10-10-4 10-4z" fill="none" stroke={c} strokeWidth={sw} strokeLinejoin="round" />
            <Ellipse cx="40" cy="138" rx="6" ry="8" fill="none" stroke={c} strokeWidth={sw} />
            <Ellipse cx="54" cy="126" rx="6" ry="8" fill="none" stroke={c} strokeWidth={sw} />
          </>
        ) : kind === 'calendar' ? (
          <>
            <Path d="M50 40h140a12 12 0 0 1 12 12v96a12 12 0 0 1-12 12H50a12 12 0 0 1-12-12V52a12 12 0 0 1 12-12z" fill="none" stroke={c} strokeWidth={sw} />
            <Path d="M38 72h164M80 28v24M160 28v24" stroke={c} strokeWidth={sw} strokeLinecap="round" />
            {[0, 1, 2, 3].map((i) => <Circle key={i} cx={72 + i * 32} cy="100" r="5" fill="none" stroke={c} strokeWidth={sw} />)}
            <Circle cx="136" cy="130" r="14" fill={c} />
            <Path d="M129 130l5 5 9-10" stroke={t.c.bg} strokeWidth={2.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </>
        ) : (
          <>
            <Circle cx="120" cy="90" r="62" fill="none" stroke={c} strokeWidth={sw} />
            <Path d="M120 50v40l26 16" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" />
            <Path d="M40 160h160" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeDasharray="2 8" />
            {[50, 95, 140, 185].map((x, i) => <Circle key={x} cx={x} cy="160" r="7" fill={i < 3 ? c : 'none'} stroke={c} strokeWidth={sw} />)}
          </>
        )}
      </Svg>
    </View>
  );
}

// Adicionar outro pet a partir do app (Ajustes, troca de pet): as mesmas etapas do cadastro.
const ADD_STEPS = ['photo', 'name', 'species', 'breed', 'born', 'size', 'color', 'review'];
export function CreatePetScreen() {
  const t = useTheme();
  const s = useStore();
  const nav = useNav();
  const ins = useInsets();
  const [pet, setPet] = useState({ name: '', species: 'Cão', sex: 'Macho', breed: '', born: '', age: '', size: 'Médio', color: PET_COLORS[3], photo: null });
  const [step, setStep] = useState('photo');
  const [dir, setDir] = useState(1);
  const hist = useRef([]);
  const go = (n) => {
    if (n === 'perms') {
      s.addPet(pet);
      haptic.success();
      s.toast(`${pet.name || 'Seu pet'} entrou para a família!`);
      nav.back();
      return;
    }
    hist.current.push(step); setDir(1); setStep(n);
  };
  const jump = (n) => { hist.current.push(step); setDir(-1); setStep(n); };
  const back = () => {
    const p = hist.current.pop();
    if (!p) return nav.back();
    setDir(-1); setStep(p);
  };
  const screen = STEP_VIEWS[step]({ t, pet, setPet, go, jump, s, acc: {}, biz: {}, prefs: {} }, {});
  const idx = ADD_STEPS.indexOf(step);
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: t.c.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ flex: 1, paddingTop: ins.top }}>
        <TopBar onBack={back} sections={['Novo pet']} section={0} stepIndex={idx} stepCount={ADD_STEPS.length} />
        <StepIn key={step} dir={dir}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 18, paddingBottom: 24 }}>
            <T kind="label" color={t.toneText}>Adicionar pet · {idx + 1} de {ADD_STEPS.length}</T>
            <T kind="display" style={{ marginTop: 6, fontSize: 30, lineHeight: 36 }}>{screen.title}</T>
            {screen.sub ? <T kind="sub" style={{ marginTop: 8, fontSize: 15.5, lineHeight: 22 }}>{screen.sub}</T> : null}
            {screen.body}
          </ScrollView>
        </StepIn>
        <View style={{ paddingHorizontal: 24, paddingTop: 10, paddingBottom: ins.bottom + 14, gap: 4 }}>
          <Btn title={step === 'review' ? `Adicionar ${pet.name}` : screen.cta} onPress={screen.onCta} disabled={screen.disabled} />
          {screen.skip ? <Btn title={screen.skip} kind="ghost" onPress={screen.onSkip} /> : null}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

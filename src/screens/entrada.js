import React, { useRef, useState } from 'react';
import { Animated, Easing, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Path, Circle, Ellipse } from 'react-native-svg';
import { Icon } from '../icons';
import { useTheme, alpha } from '../theme';
import { useStore } from '../store';
import { useNav } from '../nav';
import { ND } from '../ui';
import { T, Btn, Field, Chip, Tap, Photo, PetAvatar, useInsets, Note, IconTile } from '../kit';
import { BREEDS, PET_COLORS, INTERESTS, OTHER_PETS, PETS, MATILHAS } from '../data';

// Entrada: abertura, boas-vindas em três cartões, login, criar o primeiro pet
// (uma pergunta por tela), permissões na hora certa e interesses.

const WELCOME = [
  { title: 'O perfil é do pet', text: 'Poste fotos e vídeos, siga outros pets e ganhe patinhas. Você é o tutor, ele é a estrela.', art: 'paw' },
  { title: 'Banho, vet e passeio perto de casa', text: 'Encontre parceiros avaliados por outros tutores e agende em poucos toques.', art: 'calendar' },
  { title: 'Acompanhe ao vivo', text: 'Saiba quando ele chegou, entrou no banho e está pronto. A foto do depois vira post.', art: 'clock' },
];

export default function Onboarding() {
  const t = useTheme();
  const ins = useInsets();
  const s = useStore();
  const [step, setStep] = useState('splash');
  const [card, setCard] = useState(0);
  const [pet, setPet] = useState({ name: '', species: 'Cão', breed: '', born: '', size: 'Médio', color: PET_COLORS[0], photo: null });
  const [q, setQ] = useState(0);
  const [interests, setInterests] = useState(['Cães', 'Vira-latas', 'Passeios']);
  const [follow, setFollow] = useState({ mel: true, thor: true, viralatas: true, perdizes: true });
  const fade = useRef(new Animated.Value(1)).current;

  const go = (next) => {
    Animated.timing(fade, { toValue: 0, duration: 120, useNativeDriver: ND }).start(() => {
      setStep(next);
      Animated.timing(fade, { toValue: 1, duration: 200, easing: Easing.out(Easing.cubic), useNativeDriver: ND }).start();
    });
  };
  const finish = () => {
    s.setOnboarded(true);
    s.toast(pet.name ? `Bem-vindo, ${pet.name}!` : 'Bem-vindo ao netpet!');
  };

  let body = null;
  if (step === 'splash') {
    body = (
      <Tap onPress={() => go('welcome')} hitSlop={0} scale={1} outerStyle={{ flex: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.tone }} label="Abrir o netpet">
        <View style={{ width: 112, height: 112, borderRadius: 36, backgroundColor: t.onTone, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="paw" size={64} color={t.tone} filled />
        </View>
        <Text style={{ fontFamily: t.fonts.titleStrong, fontSize: 44, color: t.onTone, marginTop: 18 }}>netpet</Text>
        <Text style={{ color: t.onTone, fontSize: 15, marginTop: 4, opacity: 0.85 }}>A rede social do seu pet</Text>
        <Text style={{ position: 'absolute', bottom: ins.bottom + 28, color: t.onTone, opacity: 0.75, fontSize: 13.5 }}>Toque para começar</Text>
      </Tap>
    );
  } else if (step === 'welcome') {
    const w = WELCOME[card];
    body = (
      <View style={{ flex: 1, paddingHorizontal: 24, paddingBottom: ins.bottom + 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', height: 48, alignItems: 'center' }}>
          <Tap onPress={() => go('login')} label="Pular" style={{ height: 44, justifyContent: 'center', paddingHorizontal: 6 }}>
            <Text style={{ color: t.c.text2, fontSize: 15 }}>Pular</Text>
          </Tap>
        </View>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <WelcomeArt kind={w.art} />
          <T kind="display" style={{ marginTop: 32, fontSize: 32, lineHeight: 38 }}>{w.title}</T>
          <T kind="body" style={{ marginTop: 10, color: t.c.text2, fontSize: 17, lineHeight: 24 }}>{w.text}</T>
        </View>
        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 22 }}>
          {WELCOME.map((_, i) => <View key={i} style={{ height: 6, width: i === card ? 22 : 6, borderRadius: 3, backgroundColor: i === card ? t.tone : t.c.line }} />)}
        </View>
        <Btn title={card < 2 ? 'Continuar' : 'Criar minha conta'} onPress={() => (card < 2 ? setCard(card + 1) : go('login'))} />
      </View>
    );
  } else if (step === 'login') {
    body = (
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: ins.bottom + 20 }} keyboardShouldPersistTaps="handled">
        <View style={{ height: 48 }} />
        <View style={{ width: 64, height: 64, borderRadius: 22, backgroundColor: t.tone, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="paw" size={36} color={t.onTone} filled />
        </View>
        <T kind="display" style={{ marginTop: 22 }}>Entre no netpet</T>
        <T kind="sub" style={{ marginTop: 6, fontSize: 15 }}>Use a conta que preferir. Seu endereço nunca aparece no perfil.</T>
        <View style={{ gap: 10, marginTop: 28 }}>
          <Btn title="Continuar com Apple" icon="apple" kind="dark" onPress={() => go('pet')} />
          <Btn title="Continuar com Google" icon="globe" kind="secondary" onPress={() => go('pet')} />
          <Btn title="Continuar com e-mail" icon="mail" kind="secondary" onPress={() => go('pet')} />
          <Btn title="Continuar com telefone" icon="phone" kind="secondary" onPress={() => go('pet')} />
        </View>
        <View style={{ flex: 1 }} />
        <Tap onPress={finish} label="Já tenho conta: entrar como David" style={{ alignItems: 'center', paddingVertical: 14, marginTop: 20 }}>
          <Text style={{ color: t.toneText, fontSize: 15, fontWeight: '600' }}>Já tenho conta</Text>
        </Tap>
        <T kind="small" center style={{ marginTop: 6 }}>
          Ao continuar, você aceita os Termos de Uso e a Política de Privacidade do netpet, de acordo com a LGPD.
        </T>
      </ScrollView>
    );
  } else if (step === 'pet') {
    body = <CreatePet pet={pet} setPet={setPet} q={q} setQ={setQ} onBack={() => (q === 0 ? go('login') : setQ(q - 1))} onDone={() => go('perm')} />;
  } else if (step === 'perm') {
    body = (
      <Permission
        icon="pin"
        title="Encontrar parceiros perto de você"
        text="Usamos sua localização aproximada para mostrar banho e tosa, veterinários e alertas de pet perdido no seu bairro. Seu endereço nunca fica público."
        allow="Permitir localização"
        onAllow={() => go('perm2')}
        onSkip={() => go('perm2')}
      />
    );
  } else if (step === 'perm2') {
    body = (
      <Permission
        icon="bell"
        title="Saber quando ele estiver pronto"
        text="Avisamos quando o banho começar, quando ele estiver pronto e quando chegar a hora da vacina. Você escolhe o que receber nos ajustes."
        allow="Ativar notificações"
        onAllow={() => go('interests')}
        onSkip={() => go('interests')}
      />
    );
  } else if (step === 'interests') {
    body = (
      <View style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}>
          <View style={{ height: 48 }} />
          <T kind="display">Do que {pet.name || 'seu pet'} gosta?</T>
          <T kind="sub" style={{ marginTop: 6, fontSize: 15 }}>Escolha alguns assuntos para montar o seu feed.</T>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 22 }}>
            {INTERESTS.map((i) => (
              <Chip key={i} title={i} active={interests.includes(i)} onPress={() => setInterests((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]))} />
            ))}
          </View>
          <T kind="h" style={{ marginTop: 30, marginBottom: 12 }}>Pets para seguir</T>
          {OTHER_PETS.slice(0, 4).map((k) => (
            <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 }}>
              <PetAvatar pet={k} size={44} />
              <View style={{ flex: 1 }}>
                <T kind="body" style={{ fontWeight: '600' }}>{PETS[k].name}</T>
                <T kind="sub">{PETS[k].breed} · {PETS[k].area}</T>
              </View>
              <Btn small full={false} kind={follow[k] ? 'secondary' : 'primary'} title={follow[k] ? 'Seguindo' : 'Seguir'} onPress={() => setFollow((s) => ({ ...s, [k]: !s[k] }))} />
            </View>
          ))}
          <T kind="h" style={{ marginTop: 22, marginBottom: 12 }}>Matilhas perto de você</T>
          {MATILHAS.slice(0, 2).map((m) => (
            <View key={m.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 }}>
              <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: m.color, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#FFF', fontWeight: '600' }}>{m.initials}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <T kind="body" style={{ fontWeight: '600' }}>{m.name}</T>
                <T kind="sub">{m.members} membros · {m.kind}</T>
              </View>
              <Btn small full={false} kind={follow[m.key] ? 'secondary' : 'primary'} title={follow[m.key] ? 'Na matilha' : 'Entrar'} onPress={() => setFollow((s) => ({ ...s, [m.key]: !s[m.key] }))} />
            </View>
          ))}
        </ScrollView>
        <View style={{ paddingHorizontal: 24, paddingBottom: ins.bottom + 16, paddingTop: 8 }}>
          <Btn title="Começar" onPress={finish} />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.c.bg, paddingTop: step === 'splash' ? 0 : ins.top }}>
      <Animated.View style={{ flex: 1, opacity: fade }}>{body}</Animated.View>
    </View>
  );
}

function Permission({ icon, title, text, allow, onAllow, onSkip }) {
  const t = useTheme();
  const ins = useInsets();
  return (
    <View style={{ flex: 1, paddingHorizontal: 24, paddingBottom: ins.bottom + 16 }}>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: alpha(t.tone, 0.14), alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} size={56} color={t.toneText} />
        </View>
        <T kind="display" style={{ marginTop: 28 }}>{title}</T>
        <T kind="body" style={{ marginTop: 10, color: t.c.text2, fontSize: 16.5, lineHeight: 23 }}>{text}</T>
      </View>
      <View style={{ gap: 6 }}>
        <Btn title={allow} onPress={onAllow} />
        <Btn title="Agora não" kind="ghost" onPress={onSkip} />
      </View>
    </View>
  );
}

const PET_QUESTIONS = ['photo', 'name', 'species', 'breed', 'born', 'size', 'color'];

function CreatePet({ pet, setPet, q, setQ, onBack, onDone }) {
  const t = useTheme();
  const ins = useInsets();
  const key = PET_QUESTIONS[q];
  const set = (k, v) => setPet((p) => ({ ...p, [k]: v }));
  const nome = pet.name || 'seu pet';
  const next = () => (q < PET_QUESTIONS.length - 1 ? setQ(q + 1) : onDone());
  const canNext = key === 'name' ? pet.name.trim().length > 0 : key === 'breed' ? !!pet.breed : true;

  let title = '';
  let content = null;
  if (key === 'photo') {
    title = 'Comece pela foto do seu pet';
    content = (
      <View style={{ alignItems: 'center', marginTop: 24, gap: 16 }}>
        <Tap onPress={() => set('photo', pet.photo ? null : 'pacoca')} label="Escolher foto" style={{ width: 180, height: 180, borderRadius: 90, borderWidth: 3, borderColor: pet.color, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: t.c.surface }}>
          {pet.photo ? <Photo name={pet.photo} style={{ width: 168, height: 168, borderRadius: 84 }} /> : <Icon name="camera" size={44} color={t.c.text2} />}
        </Tap>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Btn small full={false} kind="secondary" icon="camera" title="Câmera" onPress={() => set('photo', 'pacoca')} />
          <Btn small full={false} kind="secondary" icon="image" title="Galeria" onPress={() => set('photo', 'pacoca')} />
        </View>
        <T kind="small" center>Pedimos acesso à câmera e às fotos só agora, quando você precisa.</T>
      </View>
    );
  } else if (key === 'name') {
    title = 'Qual é o nome dele?';
    content = <Field value={pet.name} onChangeText={(v) => set('name', v)} placeholder="Ex.: Paçoca" autoFocus onSubmit={() => canNext && next()} style={{ marginTop: 18 }} />;
  } else if (key === 'species') {
    title = `${nome} é cão ou gato?`;
    content = (
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 22 }}>
        {['Cão', 'Gato'].map((sp) => {
          const on = pet.species === sp;
          return (
            <Tap key={sp} onPress={() => { set('species', sp); set('breed', ''); }} outerStyle={{ flex: 1 }} label={sp}
              style={{ height: 140, borderRadius: 24, backgroundColor: on ? alpha(t.tone, 0.16) : t.c.surface, borderWidth: 2, borderColor: on ? t.tone : 'transparent', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <Icon name="paw" size={40} color={on ? t.toneText : t.c.text2} filled={on} />
              <Text style={{ fontSize: 18, color: t.c.text, fontWeight: on ? '600' : '400' }}>{sp}</Text>
            </Tap>
          );
        })}
      </View>
    );
  } else if (key === 'breed') {
    title = `Qual é a raça ${pet.species === 'Gato' ? 'da' : 'do'} ${nome}?`;
    content = (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 20 }}>
        {BREEDS[pet.species].map((b) => <Chip key={b} title={b} active={pet.breed === b} onPress={() => set('breed', b)} />)}
      </View>
    );
  } else if (key === 'born') {
    title = 'Quando ele nasceu?';
    content = (
      <View style={{ marginTop: 18, gap: 12 }}>
        <Field value={pet.born} onChangeText={(v) => set('born', v)} placeholder="dd/mm/aaaa" keyboardType="number-pad" icon="cake" />
        <Note>Se não souber o dia exato, coloque uma data aproximada. Ela serve para lembrar das vacinas e comemorar o aniversário.</Note>
      </View>
    );
  } else if (key === 'size') {
    title = 'Qual é o porte?';
    content = (
      <View style={{ gap: 10, marginTop: 20 }}>
        {[['Pequeno', 'Até 10 kg'], ['Médio', 'De 10 a 25 kg'], ['Grande', 'Mais de 25 kg']].map(([sz, sub]) => {
          const on = pet.size === sz;
          return (
            <Tap key={sz} onPress={() => set('size', sz)} label={sz}
              style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 18, backgroundColor: on ? alpha(t.tone, 0.14) : t.c.surface, borderWidth: 2, borderColor: on ? t.tone : 'transparent' }}>
              <View style={{ flex: 1 }}>
                <T kind="h">{sz}</T>
                <T kind="sub">{sub}</T>
              </View>
              {on ? <Icon name="check" size={22} color={t.toneText} /> : null}
            </Tap>
          );
        })}
        <T kind="small" style={{ marginTop: 4, marginLeft: 4 }}>O porte define o preço de banho e tosa nos parceiros.</T>
      </View>
    );
  } else if (key === 'color') {
    title = `Escolha a cor ${pet.species === 'Gato' ? 'da' : 'do'} ${nome}`;
    content = (
      <View style={{ marginTop: 18, alignItems: 'center' }}>
        <View style={{ width: 150, height: 150, borderRadius: 75, borderWidth: 4, borderColor: pet.color, alignItems: 'center', justifyContent: 'center' }}>
          {pet.photo ? <Photo name={pet.photo} style={{ width: 134, height: 134, borderRadius: 67 }} /> : <Icon name="paw" size={56} color={pet.color} filled />}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, justifyContent: 'center', marginTop: 24 }}>
          {PET_COLORS.map((c) => (
            <Tap key={c} onPress={() => set('color', c)} label={`Cor ${c}`}
              style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: c, borderWidth: 3, borderColor: pet.color === c ? t.c.text : 'transparent' }} />
          ))}
        </View>
        <T kind="sub" center style={{ marginTop: 18 }}>A cor tinge o anel do avatar, a carteirinha e o cartão de compartilhar.</T>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, paddingHorizontal: 24, paddingBottom: ins.bottom + 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', height: 48, gap: 12 }}>
        <Tap onPress={onBack} label="Voltar" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginLeft: -10 }}>
          <Icon name="back" size={23} color={t.c.text} />
        </Tap>
        <View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: t.c.surface2, overflow: 'hidden' }}>
          <View style={{ width: `${((q + 1) / PET_QUESTIONS.length) * 100}%`, height: 6, backgroundColor: t.tone, borderRadius: 3 }} />
        </View>
        <T kind="small">{q + 1} de {PET_QUESTIONS.length}</T>
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingTop: 24 }} style={{ flex: 1 }}>
        <T kind="label" color={t.toneText}>Criar o primeiro pet</T>
        <T kind="display" style={{ marginTop: 6 }}>{title}</T>
        {content}
      </ScrollView>
      <Btn title={q < PET_QUESTIONS.length - 1 ? 'Continuar' : 'Criar perfil'} onPress={next} disabled={!canNext} />
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

// Criar pet a partir do app (Ajustes, troca de pet): as mesmas perguntas, uma por tela.
export function CreatePetScreen() {
  const t = useTheme();
  const s = useStore();
  const nav = useNav();
  const [pet, setPet] = useState({ name: '', species: 'Cão', breed: '', born: '', size: 'Médio', color: PET_COLORS[1], photo: null });
  const [q, setQ] = useState(0);
  const ins = useInsets();
  return (
    <View style={{ flex: 1, backgroundColor: t.c.bg, paddingTop: ins.top }}>
      <CreatePet pet={pet} setPet={setPet} q={q} setQ={setQ}
        onBack={() => (q === 0 ? nav.back() : setQ(q - 1))}
        onDone={() => { s.toast(`${pet.name || 'Seu pet'} entrou para a família!`); nav.back(); }} />
    </View>
  );
}

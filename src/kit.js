import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, Switch, Text, TextInput, View, KeyboardAvoidingView, Platform } from 'react-native';
import { Icon } from './icons';
import { Tap, PetAvatar, PartnerMark, Photo, ND } from './ui';
import { Glass, Appear, AppearContext, useAppearDelay, haptic, floatShadow } from './motion';
import { useTheme, alpha } from './theme';
import { useNav } from './nav';
import { PETS, PARTNERS } from './data';

// Peças de interface do netpet. Tudo vem dos tokens do tema ativo.

export const InsetsContext = createContext({ top: 0, bottom: 0 });
export const useInsets = () => useContext(InsetsContext);

export function T({ style, kind = 'body', color, children, numberOfLines, center, ...rest }) {
  const t = useTheme();
  const base = {
    display: { fontFamily: t.fonts.title, fontSize: 30, lineHeight: 36, color: t.c.text },
    title: { fontFamily: t.fonts.title, fontSize: 22, lineHeight: 28, color: t.c.text },
    h: { fontSize: 17, fontWeight: '600', color: t.c.text, lineHeight: 22 },
    body: { fontSize: 15.5, color: t.c.text, lineHeight: 21 },
    sub: { fontSize: 13.5, color: t.c.text2, lineHeight: 18 },
    small: { fontSize: 12.5, color: t.c.text2, lineHeight: 16 },
    label: { fontSize: 12, fontWeight: '600', color: t.c.text2, letterSpacing: 0.6, textTransform: 'uppercase' },
  }[kind];
  return (
    <Text numberOfLines={numberOfLines} style={[base, color ? { color } : null, center ? { textAlign: 'center' } : null, style]} {...rest}>
      {children}
    </Text>
  );
}

export function RoundButton({ icon, onPress, label, dot, plain, size = 44, color }) {
  const t = useTheme();
  return (
    <Tap onPress={onPress} label={label} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: plain ? 'transparent' : t.c.surface, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={icon} size={22} color={color || t.c.text} />
      {dot ? <View style={{ position: 'absolute', top: 10, right: 11, width: 9, height: 9, borderRadius: 5, backgroundColor: t.tone, borderWidth: 1.5, borderColor: plain ? t.c.bg : t.c.surface }} /> : null}
    </Tap>
  );
}

// Cabeçalho de tela empilhada: voltar, título curto no centro e uma ação à direita.
// Com `scrollY`, fica por cima do conteúdo e vira vidro quando a tela rola;
// com `big`, o título só aparece aqui depois que o título grande sai de vista.
export function NavHeader({ title, right, onBack, transparent, light, scrollY, big }) {
  const t = useTheme();
  const nav = useNav();
  const ins = useInsets();
  const col = light ? '#FFFFFF' : t.c.text;
  const glassOpacity = scrollY ? scrollY.interpolate({ inputRange: [0, 28], outputRange: [0, 1], extrapolate: 'clamp' }) : 0;
  const titleOpacity = scrollY && big ? scrollY.interpolate({ inputRange: [36, 66], outputRange: [0, 1], extrapolate: 'clamp' }) : 1;
  const floating = !!scrollY;
  return (
    <View style={[{ height: 52 + ins.top, paddingTop: ins.top, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, backgroundColor: transparent || floating ? 'transparent' : t.c.bg },
      floating ? { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 5 } : null]}>
      {floating ? (
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: glassOpacity }]}>
          <Glass radius={0} border={false} style={StyleSheet.absoluteFill} />
          <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: StyleSheet.hairlineWidth, backgroundColor: t.c.line }} />
        </Animated.View>
      ) : null}
      {light ? (
        <Tap onPress={onBack || nav.back} label="Voltar" style={{ width: 44, height: 44 }}>
          <Glass radius={22} strength="clear" tint="rgba(20,16,12,0.42)" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="back" size={23} color="#FFFFFF" />
          </Glass>
        </Tap>
      ) : (
        <Tap onPress={onBack || nav.back} label="Voltar" style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="back" size={23} color={col} />
        </Tap>
      )}
      <Animated.Text numberOfLines={1} style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '600', color: col, marginHorizontal: 6, opacity: titleOpacity }}>{title || ''}</Animated.Text>
      <View style={{ minWidth: 44, alignItems: 'flex-end' }}>{right || null}</View>
    </View>
  );
}

// Título grande do topo, com linha de apoio e botões redondos à direita.
export function BigTitle({ title, sub, right, style }) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 6 }, style]}>
      <View style={{ flex: 1 }}>
        <T kind="display">{title}</T>
        {sub ? <T kind="sub" style={{ marginTop: 2 }}>{sub}</T> : null}
      </View>
      {right ? <View style={{ flexDirection: 'row', gap: 8 }}>{right}</View> : null}
    </View>
  );
}

// Tela padrão. `header` = NavHeader; `big` = título grande que encolhe para o cabeçalho ao rolar;
// `footer` fica fixo embaixo, em vidro, com o conteúdo passando por trás.
export function Screen({ title, big, sub, right, children, footer, scroll = true, pad = true, header = true, keyboard, bottomPad = 0, contentStyle }) {
  const t = useTheme();
  const ins = useInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [footH, setFootH] = useState(footer ? 90 : 0);
  const appear = useRef({ n: 0 }).current;
  const headH = 52 + ins.top;
  const body = scroll ? (
    <Animated.ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      scrollEventThrottle={16}
      onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: ND })}
      contentContainerStyle={[{ paddingTop: header ? headH : 0, paddingBottom: (footer ? footH + 20 : ins.bottom + 32) + bottomPad }, pad ? { paddingHorizontal: 16 } : null, contentStyle]}
    >
      <AppearContext.Provider value={appear}>
        {big ? <Appear><BigTitle title={big} sub={sub} style={pad ? { paddingHorizontal: 4 } : null} /></Appear> : null}
        <Appear delay={big ? 50 : 0} from={8}>{children}</Appear>
      </AppearContext.Provider>
    </Animated.ScrollView>
  ) : (
    <View style={[{ flex: 1, paddingTop: header ? headH : 0, paddingBottom: footer ? footH : 0 }, contentStyle]}>{children}</View>
  );
  const Wrap = keyboard ? KeyboardAvoidingView : View;
  return (
    <Wrap style={{ flex: 1, backgroundColor: t.c.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {body}
      {header ? <NavHeader title={big || title} big={!!big} right={right} scrollY={scrollY} /> : null}
      {footer ? <Footer onHeight={setFootH}>{footer}</Footer> : null}
    </Wrap>
  );
}

export function Footer({ children, onHeight }) {
  const t = useTheme();
  const ins = useInsets();
  return (
    <View onLayout={(e) => onHeight && onHeight(e.nativeEvent.layout.height)}
      style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
      <Glass radius={0} border={false} style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: Math.max(ins.bottom, 12) }}>
        <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: StyleSheet.hairlineWidth, backgroundColor: t.c.line }} />
        {children}
      </Glass>
    </View>
  );
}

export function Btn({ title, onPress, kind = 'primary', icon, small, disabled, style, label, full = true, outerStyle }) {
  const t = useTheme();
  const h = small ? 40 : 52;
  const map = {
    primary: { bg: t.tone, fg: t.onTone, border: 'transparent' },
    secondary: { bg: t.c.surface2, fg: t.c.text, border: 'transparent' },
    outline: { bg: 'transparent', fg: t.toneText, border: t.toneText },
    ghost: { bg: 'transparent', fg: t.toneText, border: 'transparent' },
    danger: { bg: alpha('#C2453A', t.dark ? 0.22 : 0.12), fg: t.dark ? '#F08A80' : '#A8332A', border: 'transparent' },
    dark: { bg: t.c.text, fg: t.c.bg, border: 'transparent' },
  }[kind];
  // `flex` vale para o invólucro do toque; dentro dele, o botão mantém a altura.
  const flat = StyleSheet.flatten(style) || {};
  const { flex, ...inner } = flat;
  return (
    <Tap onPress={disabled ? undefined : onPress} haptics={kind === 'primary' ? 'light' : undefined} label={label || title} scale={0.97} outerStyle={[full ? { alignSelf: 'stretch' } : null, flex ? { flex } : null, outerStyle]}
      style={[{
        height: h, borderRadius: h / 2, paddingHorizontal: small ? 16 : 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: map.bg, borderWidth: kind === 'outline' ? 1.5 : 0, borderColor: map.border, opacity: disabled ? 0.45 : 1, gap: 8,
      }, inner]}>
      {icon ? <Icon name={icon} size={small ? 18 : 20} color={map.fg} /> : null}
      <Text style={{ color: map.fg, fontSize: small ? 14 : 16, fontWeight: '600' }}>{title}</Text>
    </Tap>
  );
}

export function Card({ children, style, onPress, label, pad = 16 }) {
  const t = useTheme();
  const s = [{ backgroundColor: t.c.surface, borderRadius: t.radius.card, padding: pad }, style];
  if (onPress) return <Tap onPress={onPress} scale={0.985} hitSlop={0} label={label} style={s}>{children}</Tap>;
  return <View style={s}>{children}</View>;
}

export function Section({ title, action, onAction, children, style }) {
  const t = useTheme();
  const delay = useAppearDelay();
  return (
    <Appear delay={80 + delay} from={14} style={[{ marginTop: 26 }, style]}>
      {title ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, paddingHorizontal: 4 }}>
          <Text style={{ flex: 1, fontFamily: t.fonts.title, fontSize: 19, color: t.c.text }}>{title}</Text>
          {action ? (
            <Tap onPress={onAction} label={action} style={{ minHeight: 36, justifyContent: 'center', paddingLeft: 10 }}>
              <Text style={{ color: t.toneText, fontSize: 14, fontWeight: '600' }}>{action}</Text>
            </Tap>
          ) : null}
        </View>
      ) : null}
      {children}
    </Appear>
  );
}

// Lista agrupada: cartão com linhas separadas por fios finos.
export function Group({ children, style }) {
  const t = useTheme();
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={[{ backgroundColor: t.c.surface, borderRadius: t.radius.card, overflow: 'hidden' }, style]}>
      {items.map((child, i) => (
        <View key={i}>
          {i > 0 ? <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: t.c.line, marginLeft: 16 }} /> : null}
          {child}
        </View>
      ))}
    </View>
  );
}

export function IconTile({ icon, size = 40, color, bg, radius }) {
  const t = useTheme();
  return (
    <View style={{ width: size, height: size, borderRadius: radius ?? t.radius.tile * (size / 44), backgroundColor: bg || alpha(t.tone, t.dark ? 0.2 : 0.15), alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={icon} size={size * 0.52} color={color || t.toneText} />
    </View>
  );
}

export function Row({ icon, left, title, sub, right, value, onPress, danger, chevron = true, label, tone, numberOfLines = 2 }) {
  const t = useTheme();
  const red = t.dark ? '#F08A80' : '#A8332A';
  const inner = (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, minHeight: 56, gap: 12 }}>
      {left || (icon ? <IconTile icon={icon} size={36} color={danger ? red : tone ? undefined : t.c.text} bg={danger ? alpha('#C2453A', 0.12) : tone ? undefined : t.c.surface2} /> : null)}
      <View style={{ flex: 1 }}>
        <Text numberOfLines={numberOfLines} style={{ fontSize: 15.5, color: danger ? red : t.c.text }}>{title}</Text>
        {sub ? <Text numberOfLines={numberOfLines} style={{ fontSize: 13.5, color: t.c.text2, marginTop: 2 }}>{sub}</Text> : null}
      </View>
      {value ? <Text style={{ fontSize: 14.5, color: t.c.text2 }}>{value}</Text> : null}
      {right !== undefined ? right : onPress && chevron ? <Icon name="chevRight" size={18} color={t.c.text2} /> : null}
    </View>
  );
  if (!onPress) return inner;
  return <Tap onPress={onPress} scale={0.99} hitSlop={0} label={label || title}>{inner}</Tap>;
}

export function Toggle({ value, onChange, label }) {
  const t = useTheme();
  return (
    <Switch
      accessibilityLabel={label}
      value={value}
      onValueChange={(v) => { haptic.select(); onChange(v); }}
      trackColor={{ false: t.c.surface2, true: t.tone }}
      thumbColor="#FFFFFF"
      ios_backgroundColor={t.c.surface2}
    />
  );
}

export function Chip({ title, active, onPress, icon, style, count }) {
  const t = useTheme();
  return (
    <Tap onPress={onPress} label={title} scale={0.95}
      style={[{ height: 38, paddingHorizontal: 14, borderRadius: 19, flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: active ? t.tone : t.c.surface, borderWidth: active ? 0 : StyleSheet.hairlineWidth, borderColor: t.c.line }, style]}>
      {icon ? <Icon name={icon} size={16} color={active ? t.onTone : t.c.text} /> : null}
      <Text style={{ color: active ? t.onTone : t.c.text, fontSize: 14, fontWeight: active ? '600' : '400' }}>{title}</Text>
      {count ? <Text style={{ color: active ? t.onTone : t.c.text2, fontSize: 13 }}>{count}</Text> : null}
    </Tap>
  );
}

export function ChipRow({ children, style }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }} contentContainerStyle={[{ paddingHorizontal: 16, gap: 8 }, style]}>
      {children}
    </ScrollView>
  );
}

export function Segmented({ options, value, onChange, style }) {
  const t = useTheme();
  return (
    <View style={[{ flexDirection: 'row', backgroundColor: t.c.surface2, borderRadius: 14, padding: 3 }, style]}>
      {options.map((o) => {
        const key = typeof o === 'string' ? o : o.key;
        const lab = typeof o === 'string' ? o : o.label;
        const on = key === value;
        return (
          <Tap key={key} onPress={() => { haptic.select(); onChange(key); }} outerStyle={{ flex: 1 }} hitSlop={0} label={lab}
            style={{ height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? t.c.surface : 'transparent' }}>
            <Text numberOfLines={1} style={{ fontSize: 14, color: on ? t.c.text : t.c.text2, fontWeight: on ? '600' : '400' }}>{lab}</Text>
          </Tap>
        );
      })}
    </View>
  );
}

export function Field({ label, value, onChangeText, placeholder, multiline, keyboardType, icon, style, autoFocus, secure, onSubmit, right, maxLength, autoCapitalize, error, hint, ok }) {
  const t = useTheme();
  const [focus, setFocus] = useState(false);
  return (
    <View style={style}>
      {label ? <Text style={{ fontSize: 13.5, color: t.c.text2, marginBottom: 6, marginLeft: 4 }}>{label}</Text> : null}
      <View style={{ flexDirection: 'row', alignItems: multiline ? 'flex-start' : 'center', backgroundColor: t.c.surface, borderRadius: 16, borderWidth: 1.5, borderColor: error ? (t.dark ? '#F08A80' : '#C2453A') : focus ? t.tone : 'transparent', paddingHorizontal: 14, minHeight: 52, gap: 10 }}>
        {icon ? <View style={{ paddingTop: multiline ? 14 : 0 }}><Icon name={icon} size={20} color={t.c.text2} /></View> : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={alpha(t.dark ? '#FFFFFF' : '#000000', 0.38)}
          multiline={multiline}
          keyboardType={keyboardType}
          autoFocus={autoFocus}
          secureTextEntry={secure}
          maxLength={maxLength}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          onSubmitEditing={onSubmit}
          accessibilityLabel={label || placeholder}
          style={[{ flex: 1, fontSize: 16, color: t.c.text, paddingVertical: 14, outlineStyle: 'none' }, multiline ? { minHeight: 96, textAlignVertical: 'top' } : null]}
        />
        {ok ? <Icon name="check" size={18} color={STATE_COLORS.ok[t.dark ? 'dark' : 'light'][0]} /> : null}
        {right || null}
      </View>
      {error || hint ? <Text style={{ fontSize: 12.5, color: error ? (t.dark ? '#F08A80' : '#A8332A') : t.c.text2, marginTop: 6, marginLeft: 4 }}>{error || hint}</Text> : null}
    </View>
  );
}

export function Stars({ value = 5, size = 14, onChange }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: onChange ? 6 : 2 }}>
      {[1, 2, 3, 4, 5].map((i) => {
        const star = <Icon name="star" size={size} color={i <= value ? t.tone : t.c.line} filled={i <= value} />;
        return onChange ? (
          <Tap key={i} onPress={() => onChange(i)} label={`${i} estrela${i > 1 ? 's' : ''}`} style={{ padding: 2 }}>{star}</Tap>
        ) : <View key={i}>{star}</View>;
      })}
    </View>
  );
}

export function Progress({ value, color, height = 8, style }) {
  const t = useTheme();
  return (
    <View style={[{ height, borderRadius: height / 2, backgroundColor: t.c.surface2, overflow: 'hidden' }, style]}>
      <View style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, height: '100%', borderRadius: height / 2, backgroundColor: color || t.tone }} />
    </View>
  );
}

export function Pill({ text, color, bg, icon, style }) {
  const t = useTheme();
  return (
    <View style={[{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, backgroundColor: bg || t.c.surface2 }, style]}>
      {icon ? <Icon name={icon} size={13} color={color || t.c.text2} /> : null}
      <Text style={{ color: color || t.c.text2, fontSize: 12, fontWeight: '600' }}>{text}</Text>
    </View>
  );
}

export const STATE_COLORS = {
  ok: { light: ['#2F7A55', '#E2F1E8'], dark: ['#7FD1A4', '#173527'] },
  soon: { light: ['#8A5A0E', '#F7EBD3'], dark: ['#EBB36A', '#3A2A12'] },
  late: { light: ['#A8332A', '#F8E1DE'], dark: ['#F08A80', '#3D1A17'] },
  info: { light: ['#2F5E8F', '#E1EBF6'], dark: ['#8DB8E8', '#172739'] },
};
export function StatePill({ state, text, icon }) {
  const t = useTheme();
  const [fg, bg] = STATE_COLORS[state][t.dark ? 'dark' : 'light'];
  return <Pill text={text} color={fg} bg={bg} icon={icon} />;
}

export function RoleBadge({ role }) {
  if (!role) return null;
  const vet = /Veterin/.test(role);
  const mod = /Moder/.test(role);
  return <StatePill state={vet ? 'ok' : mod ? 'info' : 'soon'} text={role} icon={vet || /verific/.test(role) ? 'verified' : mod ? 'shield' : undefined} />;
}

// Estado vazio com ilustração de traço simples e convite para agir.
export function Empty({ icon = 'paw', title, text, action, onAction, compact }) {
  const t = useTheme();
  return (
    <View style={{ alignItems: 'center', paddingVertical: compact ? 28 : 56, paddingHorizontal: 28 }}>
      <View style={{ width: 96, height: 96, borderRadius: 48, borderWidth: 1.7, borderColor: alpha(t.tone, 0.55), borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={40} color={t.toneText} />
      </View>
      <T kind="title" center style={{ marginTop: 18 }}>{title}</T>
      {text ? <T kind="sub" center style={{ marginTop: 6, maxWidth: 300 }}>{text}</T> : null}
      {action ? <Btn title={action} onPress={onAction} full={false} style={{ marginTop: 18 }} /> : null}
    </View>
  );
}

// Esqueleto de carregamento: blocos que respiram devagar.
export function Skeleton({ h = 16, w = '100%', r = 8, style }) {
  const t = useTheme();
  const v = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: ND }),
      Animated.timing(v, { toValue: 0.5, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: ND }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);
  return <Animated.View style={[{ height: h, width: w, borderRadius: r, backgroundColor: t.c.surface2, opacity: v }, style]} />;
}

export function Who({ pet, partner, name, size = 36 }) {
  if (partner) return <PartnerMark partner={partner} size={size} />;
  if (pet) return <PetAvatar pet={pet} size={size - 6} ring={1.5} gap={1.5} />;
  return <InitialAvatar name={name} size={size} />;
}

export function InitialAvatar({ name = '?', size = 36, color }) {
  const t = useTheme();
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color || t.c.surface2, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: color ? '#FFFFFF' : t.c.text, fontWeight: '600', fontSize: size * 0.4 }}>{name.slice(0, 1)}</Text>
    </View>
  );
}

export function Divider({ style }) {
  const t = useTheme();
  return <View style={[{ height: StyleSheet.hairlineWidth, backgroundColor: t.c.line }, style]} />;
}

export function Note({ icon = 'info', children, style }) {
  const t = useTheme();
  return (
    <View style={[{ flexDirection: 'row', gap: 10, padding: 14, borderRadius: 16, backgroundColor: t.c.surface2 }, style]}>
      <Icon name={icon} size={18} color={t.c.text2} />
      <Text style={{ flex: 1, color: t.c.text2, fontSize: 13.5, lineHeight: 19 }}>{children}</Text>
    </View>
  );
}

export function Toast({ msg }) {
  const t = useTheme();
  const ins = useInsets();
  const v = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState(msg);
  useEffect(() => {
    if (msg) setShown(msg);
    if (msg) Animated.spring(v, { toValue: 1, damping: 18, stiffness: 260, useNativeDriver: ND }).start();
    else Animated.timing(v, { toValue: 0, duration: 160, easing: Easing.out(Easing.cubic), useNativeDriver: ND }).start();
  }, [msg]);
  if (!shown) return null;
  return (
    <Animated.View pointerEvents="none" accessibilityLiveRegion="polite"
      style={[{ position: 'absolute', left: 20, right: 20, top: ins.top + 8, opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [-18, 0] }) }, { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }] }]}>
      <Glass radius={24} style={[{ alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12, maxWidth: 360 }]}>
        <Icon name="check" size={18} color={t.toneText} />
        <Text style={{ color: t.c.text, fontSize: 14.5, fontWeight: '600', flexShrink: 1 }}>{shown}</Text>
      </Glass>
    </Animated.View>
  );
}

export function petName(k) {
  return PETS[k] ? PETS[k].name : k;
}
export function partnerName(k) {
  return PARTNERS[k] ? PARTNERS[k].name : k;
}
// "o Paçoca" / "a Luna"
export function oa(pet) {
  return pet.article === 'do' ? 'o' : 'a';
}

export { Photo, PetAvatar, PartnerMark, Tap };

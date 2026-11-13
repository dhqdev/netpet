import React, { createContext, useContext, useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from './theme';

// Movimento e vidro do netpet.
// Molas suaves (sem quicar), vidro translúcido nas peças que flutuam sobre o conteúdo
// e um toque leve de vibração nas ações que pedem confirmação física.

export const ND = Platform.OS !== 'web';

// Mola padrão: assenta rápido e sem ultrapassar o alvo.
export const SPRING = { damping: 26, stiffness: 260, mass: 1, overshootClamping: false, restDisplacementThreshold: 0.001, restSpeedThreshold: 0.001 };
// Mola de expansão: um pouco mais solta, para a tela "crescer" do cartão.
export const SPRING_OPEN = { damping: 24, stiffness: 210, mass: 1, restDisplacementThreshold: 0.001, restSpeedThreshold: 0.001 };

export function spring(value, toValue, config = SPRING, cb) {
  const a = Animated.spring(value, { toValue, useNativeDriver: ND, ...config });
  a.start(cb);
  return a;
}

export function fade(value, toValue, duration = 220, cb, delay = 0) {
  const a = Animated.timing(value, { toValue, duration, delay, easing: Easing.out(Easing.cubic), useNativeDriver: ND });
  a.start(cb);
  return a;
}

// ——— Vibração leve ———

const canBuzz = Platform.OS === 'ios' || Platform.OS === 'android';
export const haptic = {
  select: () => { if (canBuzz) Haptics.selectionAsync().catch(() => {}); },
  light: () => { if (canBuzz) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); },
  soft: () => { if (canBuzz) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => {}); },
  success: () => { if (canBuzz) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}); },
};

// ——— Vidro ———
// iOS 26: Liquid Glass de verdade (expo-glass-effect).
// iOS anterior e web: desfoque do sistema com um brilho no topo.
// Android: superfície translúcida com o mesmo brilho, que é o que o sistema desenha bem.

let LiquidGlass = null;
let liquid = false;
if (Platform.OS === 'ios') {
  try {
    // eslint-disable-next-line global-require
    const g = require('expo-glass-effect');
    liquid = g.isGlassEffectAPIAvailable() && g.isLiquidGlassAvailable();
    if (liquid) LiquidGlass = g.GlassView;
  } catch (e) {
    liquid = false;
  }
}
export const hasLiquidGlass = liquid;

export function Glass({ style, children, radius = 24, strength = 'regular', interactive, tint, border = true, pointerEvents }) {
  const t = useTheme();
  const shape = { borderRadius: radius, overflow: 'hidden' };
  if (LiquidGlass) {
    return (
      <LiquidGlass
        glassEffectStyle={strength === 'clear' ? 'clear' : 'regular'}
        isInteractive={!!interactive}
        tintColor={tint}
        colorScheme={t.dark ? 'dark' : 'light'}
        style={[shape, style]}
        pointerEvents={pointerEvents}
      >
        {children}
      </LiquidGlass>
    );
  }
  const veil = t.dark ? 'rgba(30,27,24,0.55)' : 'rgba(255,253,250,0.58)';
  const solid = t.dark ? 'rgba(34,31,28,0.94)' : 'rgba(255,253,250,0.94)';
  const edge = t.dark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.85)';
  const shine = t.dark ? ['rgba(255,255,255,0.10)', 'rgba(255,255,255,0)'] : ['rgba(255,255,255,0.65)', 'rgba(255,255,255,0)'];
  const blur = Platform.OS !== 'android';
  // As camadas do vidro ficam atrás do conteúdo (no navegador, peças absolutas pintam por cima do resto).
  const under = { zIndex: -1 };
  return (
    <View style={[shape, { zIndex: 0 }, style]} pointerEvents={pointerEvents}>
      {blur ? (
        <BlurView intensity={strength === 'clear' ? 30 : 60} tint={t.dark ? 'dark' : 'light'} style={[StyleSheet.absoluteFill, under]} />
      ) : null}
      <View style={[StyleSheet.absoluteFill, under, { backgroundColor: tint || (blur ? veil : solid) }]} />
      <LinearGradient colors={shine} start={{ x: 0, y: 0 }} end={{ x: 0, y: 0.6 }} style={[StyleSheet.absoluteFill, under]} pointerEvents="none" />
      {border ? <View pointerEvents="none" style={[StyleSheet.absoluteFill, under, { borderRadius: radius, borderWidth: StyleSheet.hairlineWidth * 2, borderColor: edge }]} /> : null}
      {children}
    </View>
  );
}

// Sombra suave para peças que flutuam (barra inferior, botões sobre foto, folhas).
export const floatShadow = (dark) => ({
  shadowColor: '#000', shadowOpacity: dark ? 0.45 : 0.14, shadowRadius: 22, shadowOffset: { width: 0, height: 10 }, elevation: 12,
});

// ——— Aparecer ———
// O conteúdo de cada tela entra subindo 10 px e clareando, em cascata por seção.

export const AppearContext = createContext(null);

export function Appear({ children, delay = 0, style, from = 10, duration = 360 }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration, delay, easing: Easing.out(Easing.cubic), useNativeDriver: ND }).start();
  }, []);
  return (
    <Animated.View style={[style, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [from, 0] }) }] }]}>
      {children}
    </Animated.View>
  );
}

// Usado pelas seções: cada uma pega o próximo lugar da fila e entra um pouco depois da anterior.
export function useAppearDelay(step = 55, max = 7) {
  const ctx = useContext(AppearContext);
  const idx = useRef(ctx ? ctx.n++ : 0).current;
  return Math.min(idx, max) * step;
}

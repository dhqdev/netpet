import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, BackHandler, Easing, StyleSheet, View, useWindowDimensions } from 'react-native';
import { ND } from './ui';
import { useTheme } from './theme';

// Navegação própria e leve: uma aba ativa e uma pilha de telas por cima dela.
// Telas novas entram da direita em 220 ms e saem em 160 ms, como no iOS.

const NavContext = createContext(null);
export const useNav = () => useContext(NavContext);
const ScreenParams = createContext({});
export const useParams = () => useContext(ScreenParams);

let seq = 0;

export function NavProvider({ initialTab = 'inicio', children }) {
  const [tab, setTabState] = useState(initialTab);
  const [stack, setStack] = useState([]);
  const leaving = useRef(new Set());

  const push = useCallback((name, params = {}) => {
    seq += 1;
    setStack((s) => [...s, { key: `s${seq}`, name, params }]);
  }, []);
  const replace = useCallback((name, params = {}) => {
    seq += 1;
    setStack((s) => [...s.slice(0, -1), { key: `s${seq}`, name, params, instant: true }]);
  }, []);
  const back = useCallback(() => {
    setStack((s) => {
      const live = s.filter((e) => !e.closing);
      if (!live.length) return s;
      const top = live[live.length - 1];
      return s.map((e) => (e.key === top.key ? { ...e, closing: true } : e));
    });
  }, []);
  const remove = useCallback((key) => setStack((s) => s.filter((e) => e.key !== key)), []);
  const popToRoot = useCallback(() => setStack([]), []);
  const setTab = useCallback((t) => {
    setStack([]);
    setTabState(t);
  }, []);
  const resetTo = useCallback((t, name, params) => {
    seq += 1;
    setTabState(t);
    setStack(name ? [{ key: `s${seq}`, name, params: params || {}, instant: true }] : []);
  }, []);

  const depth = stack.filter((e) => !e.closing).length;
  const value = useMemo(() => ({ tab, setTab, stack, push, replace, back, remove, popToRoot, resetTo, depth }),
    [tab, stack, depth, setTab, push, replace, back, remove, popToRoot, resetTo]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (depth > 0) {
        back();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [depth, back]);

  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
}

// Desenha a tela-raiz da aba e as telas empilhadas por cima.
export function StackView({ root, screens }) {
  const { stack } = useNav();
  return (
    <View style={{ flex: 1 }}>
      {root}
      {stack.map((entry, i) => (
        <StackScreen key={entry.key} entry={entry} Comp={screens[entry.name]} top={i === stack.length - 1} />
      ))}
    </View>
  );
}

function StackScreen({ entry, Comp, top }) {
  const t = useTheme();
  const { remove } = useNav();
  const { width } = useWindowDimensions();
  const x = useRef(new Animated.Value(entry.instant ? 0 : 1)).current;
  useEffect(() => {
    if (!entry.instant) Animated.timing(x, { toValue: 0, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: ND }).start();
  }, []);
  useEffect(() => {
    if (entry.closing) {
      Animated.timing(x, { toValue: 1, duration: 160, easing: Easing.in(Easing.quad), useNativeDriver: ND }).start(() => remove(entry.key));
    }
  }, [entry.closing]);
  if (!Comp) return null;
  const { key: paramKey, ...rest } = entry.params;
  return (
    <Animated.View
      pointerEvents={entry.closing ? 'none' : 'auto'}
      style={[StyleSheet.absoluteFill, { backgroundColor: t.c.bg, transform: [{ translateX: x.interpolate({ inputRange: [0, 1], outputRange: [0, Math.min(width, 520)] }) }] }]}
    >
      <ScreenParams.Provider value={entry.params}>
        {/* `key` é reservado pelo React: chega à tela como `id`. */}
        <Comp {...rest} id={rest.id ?? paramKey} />
      </ScreenParams.Provider>
    </Animated.View>
  );
}

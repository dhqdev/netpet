import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, BackHandler, Dimensions, PanResponder, StyleSheet, View } from 'react-native';
import { useTheme } from './theme';
import { ND, SPRING, SPRING_OPEN, spring, haptic } from './motion';

// Navegação própria e leve: uma aba ativa e uma pilha de telas por cima dela.
//
// Duas transições, as duas em mola:
// - expansão: quando a tela nasce de um cartão tocado, ela cresce a partir dele e volta para ele;
// - deslize: nos outros casos, entra pela direita e a tela de baixo recua um pouco, como no iOS.
// Arrastar da borda esquerda volta, acompanhando o dedo.

const NavContext = createContext(null);
export const useNav = () => useContext(NavContext);
const ScreenParams = createContext({});
export const useParams = () => useContext(ScreenParams);

let seq = 0;

// O último toque em um elemento grande (cartão, linha) vira a origem da expansão.
export const pressMemo = { rect: null, time: 0 };
export function notePress(rect) {
  pressMemo.rect = rect;
  pressMemo.time = Date.now();
}
const origin = { x: 0, y: 0, w: Dimensions.get('window').width, h: Dimensions.get('window').height };
function takePress() {
  const { rect, time } = pressMemo;
  pressMemo.rect = null;
  if (!rect || Date.now() - time > 900) return null;
  const big = rect.w >= 140 && rect.h >= 48;
  const whole = rect.w > origin.w * 0.97 && rect.h > origin.h * 0.7;
  if (!big || whole) return null;
  return { x: rect.x - origin.x, y: rect.y - origin.y, w: rect.w, h: rect.h };
}

export function NavProvider({ initialTab = 'inicio', children }) {
  const [tab, setTabState] = useState(initialTab);
  const [stack, setStack] = useState([]);

  const push = useCallback((name, params = {}, opts = {}) => {
    seq += 1;
    const from = opts.transition === 'slide' ? null : opts.from || takePress();
    setStack((s) => [...s, { key: `s${seq}`, name, params, from }]);
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
  const popToRoot = useCallback(() => setStack((s) => s.map((e) => ({ ...e, closing: true }))), []);
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

// Como a camada de baixo reage à tela que entra por cima dela.
function underStyle(next, nextFrom, w) {
  if (!next) return null;
  if (nextFrom) return { transform: [{ scale: next.interpolate({ inputRange: [0, 1], outputRange: [1, 0.94], extrapolate: 'clamp' }) }] };
  return { transform: [{ translateX: next.interpolate({ inputRange: [0, 1], outputRange: [0, -w * 0.28], extrapolate: 'clamp' }) }] };
}
function Dim({ next }) {
  if (!next) return null;
  return (
    <Animated.View pointerEvents="none"
      style={[StyleSheet.absoluteFill, { backgroundColor: '#000', opacity: next.interpolate({ inputRange: [0, 1], outputRange: [0, 0.16], extrapolate: 'clamp' }) }]} />
  );
}

// Desenha a tela-raiz da aba e as telas empilhadas por cima.
export function StackView({ root, screens }) {
  const { stack } = useNav();
  const ref = useRef(null);
  const [size, setSize] = useState({ w: origin.w, h: origin.h });
  const progress = useRef({}).current;
  stack.forEach((e) => {
    if (!progress[e.key]) progress[e.key] = new Animated.Value(e.instant ? 1 : 0);
  });
  Object.keys(progress).forEach((k) => {
    if (!stack.some((e) => e.key === k)) delete progress[k];
  });
  const onLayout = (ev) => {
    const { width, height } = ev.nativeEvent.layout;
    setSize({ w: width, h: height });
    origin.w = width;
    origin.h = height;
    if (ref.current && ref.current.measureInWindow) {
      ref.current.measureInWindow((x, y) => {
        origin.x = x || 0;
        origin.y = y || 0;
      });
    }
  };
  const first = stack[0];
  const firstP = first ? progress[first.key] : null;
  return (
    <View ref={ref} style={{ flex: 1, overflow: 'hidden' }} onLayout={onLayout}>
      <Animated.View style={[{ flex: 1 }, underStyle(firstP, first && first.from, size.w)]}>
        {root}
      </Animated.View>
      <Dim next={firstP} />
      {stack.map((entry, i) => {
        const nx = stack[i + 1];
        return (
          <StackScreen key={entry.key} entry={entry} Comp={screens[entry.name]} top={i === stack.length - 1} size={size}
            p={progress[entry.key]} next={nx ? progress[nx.key] : null} nextFrom={nx ? nx.from : null} />
        );
      })}
    </View>
  );
}

function StackScreen({ entry, Comp, top, size, p, next, nextFrom }) {
  const t = useTheme();
  const { remove, back } = useNav();
  const { w, h } = size;
  const zoom = entry.from;
  const [rounded, setRounded] = useState(!!zoom && !entry.instant);

  useEffect(() => {
    if (!entry.instant) {
      spring(p, 1, zoom ? SPRING_OPEN : SPRING, () => setRounded(false));
    }
  }, []);
  useEffect(() => {
    if (entry.closing) {
      if (zoom) setRounded(true);
      spring(p, 0, { ...SPRING, overshootClamping: true, restDisplacementThreshold: 0.01, restSpeedThreshold: 0.05 }, () => remove(entry.key));
    }
  }, [entry.closing]);

  // Arrastar da borda esquerda para voltar.
  const pan = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (e, g) => g.x0 - origin.x < 28 && g.dx > 8 && Math.abs(g.dy) < g.dx,
    onPanResponderGrant: () => { if (zoom) setRounded(true); },
    onPanResponderMove: (e, g) => p.setValue(Math.max(0, Math.min(1, 1 - g.dx / w))),
    onPanResponderRelease: (e, g) => {
      if (g.dx > w * 0.33 || g.vx > 0.6) {
        haptic.soft();
        back();
      } else {
        spring(p, 1, SPRING, () => setRounded(false));
      }
    },
    onPanResponderTerminate: () => spring(p, 1, SPRING, () => setRounded(false)),
  }), [w, zoom]);

  if (!Comp) return null;

  let transform;
  let opacity = 1;
  if (zoom) {
    const s0 = Math.max(0.2, zoom.w / w);
    const cx = zoom.x + zoom.w / 2 - w / 2;
    const cy = zoom.y + zoom.h / 2 - h / 2;
    transform = [
      { translateX: p.interpolate({ inputRange: [0, 1], outputRange: [cx, 0] }) },
      { translateY: p.interpolate({ inputRange: [0, 1], outputRange: [cy, 0] }) },
      { scale: p.interpolate({ inputRange: [0, 1], outputRange: [s0, 1] }) },
    ];
    opacity = p.interpolate({ inputRange: [0, 0.18, 1], outputRange: [0, 1, 1], extrapolate: 'clamp' });
  } else {
    transform = [{ translateX: p.interpolate({ inputRange: [0, 1], outputRange: [w, 0] }) }];
  }
  const under = underStyle(next, nextFrom, w);
  const { key: paramKey, ...rest } = entry.params;
  return (
    <Animated.View
      {...(top ? pan.panHandlers : {})}
      pointerEvents={entry.closing ? 'none' : 'auto'}
      style={[StyleSheet.absoluteFill, { opacity, transform }, styles.edge, { shadowOpacity: t.dark ? 0.5 : 0.12 }]}
    >
      <Animated.View style={[{ flex: 1, backgroundColor: t.c.bg, overflow: 'hidden', borderRadius: rounded ? 34 : 0 }, under]}>
        <ScreenParams.Provider value={entry.params}>
          {/* `key` é reservado pelo React: chega à tela como `id`. */}
          <Comp {...rest} id={rest.id ?? paramKey} />
        </ScreenParams.Provider>
        <Dim next={next} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  edge: { shadowColor: '#000', shadowRadius: 18, shadowOffset: { width: -4, height: 0 }, elevation: 0 },
});

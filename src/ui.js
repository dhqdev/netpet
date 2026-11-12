import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Icon } from './icons';
import { photos } from './photos';
import { useTheme, alpha } from './theme';
import { PETS, PARTNERS } from './data';

export const ND = Platform.OS !== 'web';
const EASE = Easing.out(Easing.cubic);

// Toque que encolhe 3% e volta, em 140 ms. Nada quica.
export function Tap({ onPress, onLongPress, style, outerStyle, children, scale = 0.97, label, hitSlop = 6, disabled }) {
  const v = useRef(new Animated.Value(1)).current;
  const to = (x) => Animated.timing(v, { toValue: x, duration: 140, easing: EASE, useNativeDriver: ND }).start();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      hitSlop={hitSlop}
      onPressIn={() => to(scale)}
      onPressOut={() => to(1)}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={320}
      style={outerStyle}
    >
      <Animated.View style={[style, { transform: [{ scale: v }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

export function Photo({ name, style }) {
  return <Image source={photos[name]} style={[{ backgroundColor: 'rgba(128,120,110,0.18)' }, style]} resizeMode="cover" />;
}

// Avatar de pet: sempre em círculo, com anel na cor do pet.
export function PetAvatar({ pet, size = 40, ring = 2, gap = 2, ringColor, muted, status }) {
  const t = useTheme();
  const p = typeof pet === 'string' ? PETS[pet] : pet;
  const color = muted ? t.c.line : ringColor || (t.dark ? p.colorDark : p.color);
  const outer = size + (ring + gap) * 2;
  return (
    <View style={{ width: outer, height: outer }}>
      <View style={{ width: outer, height: outer, borderRadius: outer / 2, borderWidth: ring, borderColor: color, alignItems: 'center', justifyContent: 'center' }}>
        <Photo name={p.photo} style={{ width: size, height: size, borderRadius: size / 2 }} />
      </View>
      {status ? (
        <View style={{ position: 'absolute', right: 0, bottom: 0, width: 14, height: 14, borderRadius: 7, backgroundColor: '#4FA36C', borderWidth: 2, borderColor: t.c.bg }} />
      ) : null}
    </View>
  );
}

// Marca de parceiro: sempre em quadrado arredondado, para distinguir de pet de relance.
export function PartnerMark({ partner, size = 36 }) {
  const p = typeof partner === 'string' ? PARTNERS[partner] : partner;
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.3, backgroundColor: p.color, alignItems: 'center', justifyContent: 'center' }}>
      <Text allowFontScaling={false} style={{ color: '#FFFFFF', fontSize: size * 0.36, fontWeight: '600', letterSpacing: 0.3 }}>{p.initials}</Text>
    </View>
  );
}

export function Label({ children, color, bg, style }) {
  return (
    <View style={[{ alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: bg }, style]}>
      <Text style={{ color, fontSize: 11.5, fontWeight: '600', letterSpacing: 0.2 }}>{children}</Text>
    </View>
  );
}

// Área de foto de um post. Toque duplo carimba a patinha. Cobre foto única,
// carrossel, vídeo curto e antes e depois.
export function PostMedia({ post, liked, onLike, radius = 0, children }) {
  const [w, setW] = useState(0);
  const [page, setPage] = useState(0);
  const last = useRef(0);
  const stamp = useRef(new Animated.Value(0)).current;

  const onTap = () => {
    const now = Date.now();
    if (now - last.current < 280) {
      if (!liked) onLike();
      stamp.setValue(0);
      Animated.timing(stamp, { toValue: 1, duration: 620, easing: Easing.linear, useNativeDriver: ND }).start();
    }
    last.current = now;
  };

  const h = w ? w / post.ratio : 0;
  let body = null;
  if (post.type === 'beforeAfter') {
    body = (
      <View style={{ flexDirection: 'row', height: h }}>
        {post.photos.map((ph, i) => (
          <View key={ph} style={{ flex: 1, marginLeft: i ? 2 : 0 }}>
            <Photo name={ph} style={{ width: '100%', height: '100%' }} />
            <View style={[styles.chipBase, styles.chipBottomLeft]}>
              <Text style={styles.mediaChipText}>{i === 0 ? 'Antes' : 'Depois'}</Text>
            </View>
          </View>
        ))}
      </View>
    );
  } else if (post.type === 'carousel') {
    body = (
      <View>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={32}
          onScroll={(e) => w && setPage(Math.round(e.nativeEvent.contentOffset.x / w))}
        >
          {post.photos.map((ph) => (
            <Pressable key={ph} onPress={onTap} accessibilityLabel="Foto do post. Toque duas vezes para dar patinha.">
              <Photo name={ph} style={{ width: w, height: h }} />
            </Pressable>
          ))}
        </ScrollView>
        <View style={[styles.chipBase, styles.chipTopRight]}>
          <Text style={styles.mediaChipText}>{page + 1}/{post.photos.length}</Text>
        </View>
        <View style={styles.dots} pointerEvents="none">
          {post.photos.map((ph, i) => (
            <View key={ph} style={{ width: 6, height: 6, borderRadius: 3, marginHorizontal: 3, backgroundColor: i === page ? '#FFFFFF' : 'rgba(255,255,255,0.5)' }} />
          ))}
        </View>
      </View>
    );
  } else {
    body = (
      <View>
        <Photo name={post.photos[0]} style={{ width: '100%', height: h }} />
        {post.type === 'video' ? (
          <>
            <View style={styles.play} pointerEvents="none">
              <Icon name="play" size={26} color="#FFFFFF" filled />
            </View>
            <View style={[styles.chipBase, styles.chipTopRight]}>
              <Text style={styles.mediaChipText}>{post.duration}</Text>
            </View>
          </>
        ) : null}
      </View>
    );
  }

  return (
    <Pressable
      onPress={post.type === 'carousel' ? undefined : onTap}
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      accessibilityLabel="Foto do post. Toque duas vezes para dar patinha."
      style={{ borderRadius: radius, overflow: 'hidden' }}
    >
      {body}
      {children}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.stamp,
          {
            opacity: stamp.interpolate({ inputRange: [0, 0.18, 0.7, 1], outputRange: [0, 1, 1, 0] }),
            transform: [
              { rotate: '-14deg' },
              { scale: stamp.interpolate({ inputRange: [0, 0.22, 1], outputRange: [1.5, 1, 1], extrapolate: 'clamp' }) },
            ],
          },
        ]}
      >
        <Icon name="paw" size={104} color="#FFFFFF" filled />
      </Animated.View>
    </Pressable>
  );
}

// Folha inferior. Fica dentro da moldura do app, sobe em 220 ms.
export function Sheet({ visible, onClose, title, children, bottomInset = 0 }) {
  const t = useTheme();
  const v = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState(visible);
  useEffect(() => {
    if (visible) setShown(true);
    Animated.timing(v, { toValue: visible ? 1 : 0, duration: visible ? 220 : 160, easing: EASE, useNativeDriver: ND }).start(({ finished }) => {
      if (finished && !visible) setShown(false);
    });
  }, [visible]);
  if (!shown) return null;
  return (
    <View style={StyleSheet.absoluteFill} accessibilityViewIsModal>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: t.c.overlay, opacity: v }]}>
        <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Fechar" />
      </Animated.View>
      <Animated.View
        style={{
          position: 'absolute', left: 0, right: 0, bottom: 0,
          backgroundColor: t.c.surface, borderTopLeftRadius: 26, borderTopRightRadius: 26,
          paddingBottom: bottomInset + 18, paddingTop: 10,
          transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [420, 0] }) }],
        }}
      >
        <View style={{ alignSelf: 'center', width: 38, height: 4, borderRadius: 2, backgroundColor: t.c.line, marginBottom: 14 }} />
        {title ? (
          <Text style={{ fontFamily: t.fonts.title, fontSize: 22, color: t.c.text, paddingHorizontal: 22, marginBottom: 8 }}>{title}</Text>
        ) : null}
        {children}
      </Animated.View>
    </View>
  );
}

export function SheetRow({ icon, title, sub, onPress, right, left }) {
  const t = useTheme();
  return (
    <Tap onPress={onPress} scale={0.98} hitSlop={0} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 22, paddingVertical: 11, minHeight: 60 }} label={title}>
      {left || (
        <View style={{ width: 44, height: 44, borderRadius: t.radius.tile, backgroundColor: alpha(t.tone, t.dark ? 0.2 : 0.16), alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} size={22} color={t.toneText} />
        </View>
      )}
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text style={{ color: t.c.text, fontSize: 16 }}>{title}</Text>
        {sub ? <Text style={{ color: t.c.text2, fontSize: 13.5, marginTop: 2 }}>{sub}</Text> : null}
      </View>
      {right || <Icon name="chevRight" size={18} color={t.c.text2} />}
    </Tap>
  );
}

export function Hairline({ inset = 0 }) {
  const t = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: t.c.line, marginLeft: inset }} />;
}

const styles = StyleSheet.create({
  chipBase: { position: 'absolute', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, backgroundColor: 'rgba(20,16,12,0.62)' },
  chipBottomLeft: { left: 10, bottom: 10 },
  chipTopRight: { right: 10, top: 10 },
  mediaChipText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  dots: { position: 'absolute', bottom: 10, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center' },
  play: {
    position: 'absolute', left: '50%', top: '50%', width: 60, height: 60, marginLeft: -30, marginTop: -30,
    borderRadius: 30, backgroundColor: 'rgba(20,16,12,0.5)', alignItems: 'center', justifyContent: 'center', paddingLeft: 3,
  },
  stamp: { position: 'absolute', left: '50%', top: '50%', width: 104, height: 104, marginLeft: -52, marginTop: -52 },
});

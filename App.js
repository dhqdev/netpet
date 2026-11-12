import React, { useMemo, useState } from 'react';
import { Platform, StyleSheet, Text, View, useColorScheme, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from './src/icons';
import { Tap, PetAvatar, Sheet, SheetRow, Hairline } from './src/ui';
import { DIRECTIONS, DIRECTION_ORDER, ThemeContext, buildTheme, alpha } from './src/theme';
import { PETS, MY_PETS, TABS } from './src/data';
import HomeAveia from './src/home/HomeAveia';
import HomeCaramelo from './src/home/HomeCaramelo';
import HomePet from './src/home/HomePet';

const HOMES = { aveia: HomeAveia, caramelo: HomeCaramelo, pet: HomePet };

function hostTheme() {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return null;
  const v = document.documentElement.getAttribute('data-theme');
  return v === 'dark' || v === 'light' ? v : null;
}

export default function App() {
  const [loaded] = useFonts({
    Nunito_600SemiBold: require('./assets/fonts/Nunito_600SemiBold.ttf'),
    Nunito_700Bold: require('./assets/fonts/Nunito_700Bold.ttf'),
    Fredoka_500Medium: require('./assets/fonts/Fredoka_500Medium.ttf'),
    Fredoka_600SemiBold: require('./assets/fonts/Fredoka_600SemiBold.ttf'),
    Baloo2_600SemiBold: require('./assets/fonts/Baloo2_600SemiBold.ttf'),
    Baloo2_700Bold: require('./assets/fonts/Baloo2_700Bold.ttf'),
  });
  return (
    <SafeAreaProvider>
      <Frame>{loaded ? <Prototype /> : null}</Frame>
    </SafeAreaProvider>
  );
}

// No navegador de computador, mostra o app em moldura de celular (390 x 844).
function Frame({ children }) {
  const { width, height } = useWindowDimensions();
  if (Platform.OS !== 'web' || width < 600) return <View style={{ flex: 1 }}>{children}</View>;
  const h = Math.min(844, height - 32);
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#2A2622' }}>
      <View style={{ width: 390, height: h, borderRadius: 44, overflow: 'hidden', borderWidth: 6, borderColor: '#0E0D0C' }}>{children}</View>
    </View>
  );
}

function Prototype() {
  const safe = useSafeAreaInsets();
  // No navegador, a página que hospeda o protótipo já cuida das áreas seguras.
  const insets = Platform.OS === 'web' ? { top: 0, bottom: 0 } : safe;
  const system = useColorScheme();
  const [mode, setMode] = useState(hostTheme());
  const dark = (mode || system) === 'dark';
  const [dir, setDir] = useState('aveia');
  const [petKey, setPetKey] = useState('pacoca');
  const [tab, setTab] = useState('inicio');
  const [sheet, setSheet] = useState(null);

  const theme = useMemo(() => buildTheme(dir, dark, PETS[petKey]), [dir, dark, petKey]);
  const { c } = theme;
  const Home = HOMES[dir];
  const nextPet = () => setPetKey(MY_PETS[(MY_PETS.indexOf(petKey) + 1) % MY_PETS.length]);
  const floating = dir === 'caramelo';
  const barH = (floating ? 64 + 10 : 58) + Math.max(insets.bottom, floating ? 10 : 6);
  const stub = TABS.find((x) => x.key === tab);

  return (
    <ThemeContext.Provider value={theme}>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <View style={{ flex: 1, backgroundColor: dir === 'caramelo' && tab === 'inicio' ? c.surface2 : c.bg, paddingTop: insets.top }}>
        <ProtoBar dir={dir} setDir={setDir} dark={dark} toggle={() => setMode(dark ? 'light' : 'dark')} />
        <View style={{ flex: 1, backgroundColor: c.bg }}>
          {tab === 'inicio' ? (
            <Home
              key={dir}
              onSwitchPet={nextPet}
              onPetList={() => setSheet('pets')}
              onMore={() => setSheet('more')}
              bottomPad={barH + 28}
            />
          ) : (
            <Stub tab={stub} onBack={() => setTab('inicio')} bottomPad={barH} />
          )}
        </View>
        <TabBar tab={tab} setTab={setTab} onCreate={() => setSheet('create')} insetBottom={insets.bottom} />

        <Sheet visible={sheet === 'create'} onClose={() => setSheet(null)} title="Criar" bottomInset={insets.bottom}>
          <SheetRow icon="camera" title="Postar foto ou vídeo" sub="Da câmera ou da galeria" onPress={() => setSheet(null)} />
          <Hairline inset={80} />
          <SheetRow icon="calendar" title="Agendar serviço" sub="Banho, veterinário, hotel e mais" onPress={() => setSheet(null)} />
          <Hairline inset={80} />
          <SheetRow icon="heart" title="Registrar cuidado" sub="Peso, vacina, remédio ou passeio" onPress={() => setSheet(null)} />
          <Text style={{ color: c.text2, fontSize: 12.5, paddingHorizontal: 22, paddingTop: 12 }}>
            Protótipo da etapa 1: estes atalhos ainda não abrem telas.
          </Text>
        </Sheet>

        <Sheet visible={sheet === 'pets'} onClose={() => setSheet(null)} title="Seus pets" bottomInset={insets.bottom}>
          {MY_PETS.map((k) => (
            <SheetRow
              key={k}
              left={<PetAvatar pet={k} size={40} />}
              title={PETS[k].name}
              sub={`${PETS[k].breed} · ${PETS[k].age}`}
              right={k === petKey ? <Icon name="check" size={22} color={theme.toneText} /> : <View />}
              onPress={() => { setPetKey(k); setSheet(null); }}
            />
          ))}
          <Hairline inset={22} />
          <SheetRow icon="plus" title="Adicionar pet" onPress={() => setSheet(null)} />
          <SheetRow icon="users" title="Convidar outro tutor" sub="Para cuidar junto do mesmo pet" onPress={() => setSheet(null)} />
        </Sheet>

        <Sheet visible={sheet === 'more'} onClose={() => setSheet(null)} bottomInset={insets.bottom}>
          <SheetRow icon="bookmark" title="Salvar post" onPress={() => setSheet(null)} />
          <SheetRow icon="close" title="Ver menos posts assim" onPress={() => setSheet(null)} />
          <Hairline inset={22} />
          <SheetRow icon="shield" title="Denunciar" sub="Conteúdo impróprio ou maus-tratos" onPress={() => setSheet(null)} />
          <SheetRow icon="close" title="Bloquear este perfil" onPress={() => setSheet(null)} />
        </Sheet>
      </View>
    </ThemeContext.Provider>
  );
}

// Faixa do protótipo: não faz parte do desenho. Troca a direção e o tema.
function ProtoBar({ dir, setDir, dark, toggle }) {
  const bg = dark ? '#000000' : '#26211C';
  return (
    <View style={{ backgroundColor: bg, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, height: 44 }}>
      <View style={{ flex: 1, flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: 2 }}>
        {DIRECTION_ORDER.map((k, i) => (
          <Tap key={k} onPress={() => setDir(k)} outerStyle={{ flex: 1 }} hitSlop={4} label={`Direção ${i + 1}: ${DIRECTIONS[k].name}`}
            style={{ height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: dir === k ? '#FAF7F2' : 'transparent' }}>
            <Text allowFontScaling={false} numberOfLines={1} style={{ color: dir === k ? '#26211C' : '#EDE6DC', fontSize: 12.5, fontWeight: dir === k ? '600' : '400' }}>
              {i + 1} · {DIRECTIONS[k].name}
            </Text>
          </Tap>
        ))}
      </View>
      <Tap onPress={toggle} label={dark ? 'Mudar para tema claro' : 'Mudar para tema escuro'} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: -6 }}>
        <Icon name={dark ? 'sun' : 'moon'} size={20} color="#EDE6DC" />
      </Tap>
    </View>
  );
}

function TabBar({ tab, setTab, onCreate, insetBottom }) {
  const t = React.useContext(ThemeContext);
  const { c } = t;
  const floating = t.key === 'caramelo';
  const labels = t.key !== 'pet';
  const activeColor = t.toneText;

  const items = TABS.map((it) => {
    if (it.key === 'criar') {
      const size = 54;
      return (
        <View key={it.key} style={{ flex: 1, alignItems: 'center' }}>
          <Tap onPress={onCreate} label="Criar: postar, agendar ou registrar cuidado" scale={0.94}
            style={{
              width: size, height: size, borderRadius: floating ? 19 : size / 2, marginTop: floating ? -16 : -20,
              backgroundColor: t.tone, alignItems: 'center', justifyContent: 'center',
              borderWidth: 4, borderColor: floating ? c.bg : c.surface,
            }}>
            <Icon name="plus" size={24} color={t.onTone} stroke={2.1} />
          </Tap>
        </View>
      );
    }
    const active = tab === it.key;
    return (
      <Tap key={it.key} onPress={() => setTab(it.key)} outerStyle={{ flex: 1 }} hitSlop={0} label={it.label} scale={0.94}
        style={{ alignItems: 'center', justifyContent: 'center', height: floating ? 64 : 58 }}>
        <Icon name={it.icon} size={24} color={active ? activeColor : c.text2} filled={active && t.icon.activeFill} />
        {labels ? (
          <Text allowFontScaling={false} style={{ fontSize: 11, marginTop: 3, color: active ? activeColor : c.text2, fontWeight: active ? '600' : '400' }}>{it.label}</Text>
        ) : (
          <View style={{ width: 5, height: 5, borderRadius: 3, marginTop: 5, backgroundColor: active ? activeColor : 'transparent' }} />
        )}
      </Tap>
    );
  });

  if (floating) {
    return (
      <View pointerEvents="box-none" style={{ position: 'absolute', left: 14, right: 14, bottom: Math.max(insetBottom, 10) }}>
        <View style={[{ flexDirection: 'row', height: 64, borderRadius: 32, backgroundColor: c.surface, paddingHorizontal: 6 }, styles.float, { shadowOpacity: t.dark ? 0.5 : 0.16 }]}>
          {items}
        </View>
      </View>
    );
  }
  return (
    <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: c.surface, paddingBottom: Math.max(insetBottom, 6), borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.line }}>
      <View style={{ flexDirection: 'row', paddingHorizontal: 6 }}>{items}</View>
    </View>
  );
}

function Stub({ tab, onBack, bottomPad }) {
  const t = React.useContext(ThemeContext);
  const { c } = t;
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36, paddingBottom: bottomPad }}>
      <View style={{ width: 72, height: 72, borderRadius: 24, backgroundColor: alpha(t.tone, t.dark ? 0.2 : 0.16), alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={tab.icon} size={32} color={t.toneText} />
      </View>
      <Text style={{ color: c.text, fontFamily: t.fonts.title, fontSize: 26, marginTop: 18 }}>{tab.label}</Text>
      <Text style={{ color: c.text2, fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 6 }}>
        Esta tela chega na etapa {tab.stage} do protótipo. Por enquanto, a etapa 1 mostra o Início em três direções.
      </Text>
      <Tap onPress={onBack} label="Voltar ao Início" style={{ marginTop: 22, height: 48, paddingHorizontal: 24, borderRadius: 24, backgroundColor: t.tone, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: t.onTone, fontSize: 15, fontWeight: '600' }}>Voltar ao Início</Text>
      </Tap>
    </View>
  );
}

const styles = StyleSheet.create({
  float: { shadowColor: '#000', shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 10 },
});

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, View, useColorScheme, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from './src/icons';
import { Tap, PetAvatar, Sheet, SheetRow, Hairline } from './src/ui';
import { ThemeContext, buildTheme } from './src/theme';
import { PETS, MY_PETS, TABS, PARTNER_TABS, ME } from './src/data';
import { StoreProvider, useStore } from './src/store';
import { NavProvider, StackView, useNav } from './src/nav';
import { InsetsContext, Toast } from './src/kit';
import { Glass, floatShadow, spring, haptic, ND } from './src/motion';

import HomeAveia from './src/home/HomeAveia';
import HomeCaramelo from './src/home/HomeCaramelo';
import HomePet from './src/home/HomePet';
import Onboarding, { CreatePetScreen } from './src/screens/entrada';
import { PostScreen, StoryScreen, NewPostScreen, CareLogScreen, NotificationsScreen, SearchScreen } from './src/screens/social';
import {
  ServicesHome, ResultsScreen, MapScreen, PartnerScreen, BookingScreen, CheckoutScreen, ConfirmedScreen, MyBookingsScreen,
  BookingDetailScreen, LiveScreen, ReviewScreen, CouponsScreen,
} from './src/screens/servicos';
import {
  MatilhasHome, DmsScreen, ChannelScreen, ThreadScreen, DmScreen, MatilhaScreen, DiscoverScreen, CreateMatilhaScreen, LostScreen, LostCreateScreen,
} from './src/screens/matilhas';
import {
  PetProfile, EditPetScreen, FamilyScreen, CarteirinhaScreen, CareScheduleScreen, GrowthScreen, StreakScreen, WrappedScreen, ShareCardScreen,
  TagScreen, TagPublicScreen,
} from './src/screens/pet';
import { AssistantScreen, SettingsScreen, DeleteAccountScreen, PlusScreen, StatesScreen, ScreenMapScreen } from './src/screens/geral';
import {
  PartnerToday, PartnerAgenda, PartnerRequests, PartnerMessages, PartnerBusiness, PartnerAttendScreen, PartnerChatScreen, FinanceScreen,
  CatalogScreen, ClientsScreen, PartnerReviewsScreen, PlansScreen, BoostScreen, PartnerCouponsScreen, VerifyScreen, TeamScreen,
} from './src/screens/parceiro';

const HOMES = { aveia: HomeAveia, caramelo: HomeCaramelo, pet: HomePet };

// Todas as telas que podem ser empilhadas por cima das abas.
const SCREENS = {
  // Social
  Post: PostScreen, Story: StoryScreen, NewPost: NewPostScreen, CareLog: CareLogScreen, Notifications: NotificationsScreen, Search: SearchScreen,
  // Serviços
  Results: ResultsScreen, Map: MapScreen, Partner: PartnerScreen, Booking: BookingScreen, Checkout: CheckoutScreen, Confirmed: ConfirmedScreen,
  MyBookings: MyBookingsScreen, BookingDetail: BookingDetailScreen, Live: LiveScreen, Review: ReviewScreen, Coupons: CouponsScreen,
  // Matilhas
  Dms: DmsScreen, Channel: ChannelScreen, Thread: ThreadScreen, Dm: DmScreen, Matilha: MatilhaScreen, Discover: DiscoverScreen,
  CreateMatilha: CreateMatilhaScreen, Lost: LostScreen, LostCreate: LostCreateScreen,
  // Pet
  PetProfile, EditPet: EditPetScreen, Family: FamilyScreen, Carteirinha: CarteirinhaScreen, CareSchedule: CareScheduleScreen, Growth: GrowthScreen,
  Streak: StreakScreen, Wrapped: WrappedScreen, ShareCard: ShareCardScreen, Tag: TagScreen, TagPublic: TagPublicScreen, CreatePet: CreatePetScreen,
  // Geral
  Assistant: AssistantScreen, Settings: SettingsScreen, DeleteAccount: DeleteAccountScreen, Plus: PlusScreen, States: StatesScreen, ScreenMap: ScreenMapScreen,
  // Parceiro
  PartnerAttend: PartnerAttendScreen, PartnerChat: PartnerChatScreen, Finance: FinanceScreen, Catalog: CatalogScreen, Clients: ClientsScreen,
  PartnerReviews: PartnerReviewsScreen, Plans: PlansScreen, Boost: BoostScreen, PartnerCoupons: PartnerCouponsScreen, Verify: VerifyScreen, Team: TeamScreen,
};

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
      <Frame>
        {loaded ? (
          <StoreProvider>
            <Root />
          </StoreProvider>
        ) : null}
      </Frame>
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

function Root() {
  const s = useStore();
  const safe = useSafeAreaInsets();
  // No navegador, a página que hospeda o app já cuida das áreas seguras.
  const insets = useMemo(() => (Platform.OS === 'web' ? { top: 0, bottom: 0 } : { top: safe.top, bottom: safe.bottom }), [safe.top, safe.bottom]);
  const system = useColorScheme();
  const dark = s.themeMode === 'escuro' || (s.themeMode === 'sistema' && (hostTheme() || system) === 'dark');
  const theme = useMemo(() => buildTheme(s.direction, dark, PETS[s.petKey]), [s.direction, dark, s.petKey]);

  return (
    <ThemeContext.Provider value={theme}>
      <InsetsContext.Provider value={insets}>
        <StatusBar style={dark ? 'light' : 'dark'} />
        <View style={{ flex: 1, backgroundColor: theme.c.bg }}>
          {s.onboarded ? (
            <NavProvider initialTab={s.mode === 'parceiro' ? 'hoje' : 'inicio'}>
              <Shell />
            </NavProvider>
          ) : (
            <Onboarding />
          )}
          <Toast msg={s.toastMsg} />
        </View>
      </InsetsContext.Provider>
    </ThemeContext.Provider>
  );
}

function Shell() {
  const s = useStore();
  const nav = useNav();
  const t = React.useContext(ThemeContext);
  const ins = React.useContext(InsetsContext);
  const partner = s.mode === 'parceiro';
  const barH = 64 + Math.max(ins.bottom, 12);

  if (Platform.OS === 'web' && typeof window !== 'undefined') window.__netpet = { nav, store: s };
  const nextPet = () => s.setPetKey(MY_PETS[(MY_PETS.indexOf(s.petKey) + 1) % MY_PETS.length]);
  let root;
  if (partner) {
    root = {
      hoje: <PartnerToday />, agenda: <PartnerAgenda />, pedidos: <PartnerRequests />, mensagens: <PartnerMessages />, negocio: <PartnerBusiness />,
    }[nav.tab] || <PartnerToday />;
  } else if (nav.tab === 'servicos') root = <ServicesHome />;
  else if (nav.tab === 'matilhas') root = <MatilhasHome />;
  else if (nav.tab === 'pet') root = <PetProfile tabRoot />;
  else {
    const Home = HOMES[s.direction];
    root = <Home key={s.direction} onSwitchPet={nextPet} onPetList={() => s.openSheet('pets')} onMore={() => s.openSheet('more', { sponsored: true })} bottomPad={barH + 28} />;
  }
  const topBg = !partner && t.key === 'caramelo' && nav.tab === 'inicio' ? t.c.surface2 : t.c.bg;
  const fresh = s.requests.filter((r) => !r.answer).length;

  return (
    <View style={{ flex: 1 }}>
      <StackView
        screens={SCREENS}
        root={(
          <View style={{ flex: 1, backgroundColor: topBg, paddingTop: ins.top }}>
            <TabFade key={`${s.mode}-${nav.tab}`}>{root}</TabFade>
            <TabBar tabs={partner ? PARTNER_TABS : TABS} badges={partner ? { pedidos: fresh } : {}} />
          </View>
        )}
      />
      <Sheets />
    </View>
  );
}

// A aba nova entra clareando e crescendo de leve, sem deslizar.
function TabFade({ children }) {
  const t = React.useContext(ThemeContext);
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: ND }).start();
  }, []);
  return (
    <Animated.View style={{ flex: 1, backgroundColor: t.c.bg, opacity: v, transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.985, 1] }) }] }}>
      {children}
    </Animated.View>
  );
}

// Menu inferior suspenso, em vidro. Uma pílula desliza em mola até a aba ativa.
function TabBar({ tabs, badges }) {
  const t = React.useContext(ThemeContext);
  const ins = React.useContext(InsetsContext);
  const nav = useNav();
  const { c } = t;
  const labels = t.key !== 'pet';
  const activeColor = t.toneText;
  const [w, setW] = useState(0);
  const idx = Math.max(0, tabs.findIndex((it) => it.key === nav.tab));
  const x = useRef(new Animated.Value(idx)).current;
  useEffect(() => { spring(x, idx, { damping: 20, stiffness: 230 }); }, [idx]);
  const pad = 6;
  const cell = w ? (w - pad * 2) / tabs.length : 0;

  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 16, right: 16, bottom: Math.max(ins.bottom, 12) }}>
      <View style={[{ borderRadius: 32 }, floatShadow(t.dark)]}>
        <Glass radius={32} interactive style={{ height: 64 }}>
          <View style={{ flex: 1, flexDirection: 'row', paddingHorizontal: pad }} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
            {cell ? (
              <Animated.View pointerEvents="none" style={{
                position: 'absolute', top: 6, bottom: 6, left: pad, width: cell, borderRadius: 26,
                backgroundColor: alphaHex(t.tone, t.dark ? 0.24 : 0.16),
                transform: [{ translateX: Animated.multiply(x, cell) }],
              }} />
            ) : null}
            {tabs.map((it) => {
              const active = nav.tab === it.key;
              const badge = badges[it.key];
              return (
                <Tap key={it.key} onPress={() => { haptic.select(); if (active) nav.popToRoot(); else nav.setTab(it.key); }}
                  outerStyle={{ flex: 1 }} hitSlop={0} label={it.label} scale={0.9}
                  style={{ alignItems: 'center', justifyContent: 'center', height: 64 }}>
                  <View>
                    {it.key === 'pet' ? (
                      <View style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}>
                        <PetAvatar pet={t.pet} size={active ? 22 : 25} ring={active ? 2 : 0} gap={active ? 1 : 0} ringColor={activeColor} />
                      </View>
                    ) : (
                      <Icon name={it.icon} size={24} color={active ? activeColor : c.text2} filled={active && t.icon.activeFill} />
                    )}
                    {badge ? (
                      <View style={{ position: 'absolute', top: -4, right: -9, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: t.tone, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}>
                        <Text style={{ color: t.onTone, fontSize: 10.5, fontWeight: '700' }}>{badge}</Text>
                      </View>
                    ) : null}
                  </View>
                  {labels ? (
                    <Text allowFontScaling={false} numberOfLines={1} style={{ fontSize: 11, marginTop: 3, color: active ? activeColor : c.text2, fontWeight: active ? '600' : '500' }}>{it.label}</Text>
                  ) : null}
                </Tap>
              );
            })}
          </View>
        </Glass>
      </View>
    </View>
  );
}

function alphaHex(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

// Folhas que sobem de baixo: criar, trocar de pet, mais opções, compartilhar, denunciar e endereço.
function Sheets() {
  const s = useStore();
  const nav = useNav();
  const t = React.useContext(ThemeContext);
  const ins = React.useContext(InsetsContext);
  const name = s.sheet ? s.sheet.name : null;
  const p = (s.sheet && s.sheet.params) || {};
  const close = s.closeSheet;
  const go = (screen, params) => { close(); nav.push(screen, params || {}); };
  const common = { onClose: close, bottomInset: ins.bottom };

  return (
    <>
      <Sheet visible={name === 'create'} title="Criar" {...common}>
        <SheetRow icon="camera" title="Postar foto ou vídeo" sub="Da câmera ou da galeria" onPress={() => go('NewPost')} />
        <Hairline inset={80} />
        <SheetRow icon="calendar" title="Agendar serviço" sub="Banho, veterinário, hotel e mais" onPress={() => go('Results')} />
        <Hairline inset={80} />
        <SheetRow icon="heart" title="Registrar cuidado" sub="Peso, vacina, remédio ou passeio" onPress={() => go('CareLog')} />
        <Hairline inset={80} />
        <SheetRow icon="alert" title="Avisar pet perdido" sub="Alerta grátis para quem está perto" onPress={() => go('LostCreate')} />
      </Sheet>

      <Sheet visible={name === 'pets'} title="Seus pets" {...common}>
        {MY_PETS.map((k) => (
          <SheetRow key={k} left={<PetAvatar pet={k} size={40} />} title={PETS[k].name} sub={`${PETS[k].breed} · ${PETS[k].age}`}
            right={k === s.petKey ? <Icon name="check" size={22} color={t.toneText} /> : <View />}
            onPress={() => { s.setPetKey(k); close(); }} />
        ))}
        <Hairline inset={22} />
        <SheetRow icon="plus" title="Adicionar pet" onPress={() => go('CreatePet')} />
        <SheetRow icon="users" title="Convidar outro tutor" sub="Para cuidar junto do mesmo pet" onPress={() => go('Family', { pet: s.petKey })} />
      </Sheet>

      <Sheet visible={name === 'more'} {...common}>
        {p.post ? <SheetRow icon="bookmark" title={s.saved[p.post] ? 'Tirar dos salvos' : 'Salvar post'} onPress={() => { s.toggleSave(p.post); s.toast(s.saved[p.post] ? 'Removido dos salvos' : 'Salvo na sua coleção'); close(); }} /> : null}
        {p.post ? <SheetRow icon="share" title="Compartilhar" onPress={() => s.openSheet('share', { post: p.post })} /> : null}
        <SheetRow icon="eye" title={p.sponsored ? 'Por que estou vendo este anúncio?' : 'Ver menos posts assim'} onPress={() => { s.toast(p.sponsored ? 'Anúncio de parceiro perto de você, marcado como Patrocinado' : 'Combinado, vamos mostrar menos'); close(); }} />
        <Hairline inset={22} />
        <SheetRow icon="flag" title="Denunciar" sub="Maus-tratos, golpe ou conteúdo impróprio" onPress={() => s.openSheet('report', { who: p.who })} />
        {p.who ? <SheetRow icon="ban" title={`Bloquear ${p.who}`} onPress={() => { s.block(p.who); s.toast(`${p.who} bloqueado`); close(); }} /> : null}
      </Sheet>

      <Sheet visible={name === 'mine'} {...common}>
        <SheetRow icon="edit" title="Editar legenda" onPress={() => { s.toast('Legenda atualizada'); close(); }} />
        <SheetRow icon="share" title="Compartilhar" onPress={() => s.openSheet('share', { post: p.post })} />
        <Hairline inset={22} />
        <SheetRow icon="trash" title="Excluir post" onPress={() => {
          s.removePost(p.post);
          s.toast('Post excluído');
          close();
          const top = nav.stack[nav.stack.length - 1];
          if (top && top.name === 'Post') nav.back();
        }} />
      </Sheet>

      <Sheet visible={name === 'share'} title="Compartilhar" {...common}>
        <SheetRow icon="send" title="Enviar por mensagem" sub="Para tutores e matilhas" onPress={() => go('Dms')} />
        <SheetRow icon="paperclip" title="Copiar link" onPress={() => { s.toast('Link copiado'); close(); }} />
        <SheetRow icon="sparkle" title="Criar cartão para os stories" onPress={() => go('ShareCard', { pet: s.petKey })} />
        <SheetRow icon="share" title="Outros apps" onPress={() => { s.toast('Abrindo o compartilhamento do celular'); close(); }} />
      </Sheet>

      <Sheet visible={name === 'report'} title="Denunciar" {...common}>
        {['Maus-tratos a animais', 'Venda ou comércio de animais', 'Golpe ou spam', 'Assédio ou ofensa', 'Conteúdo impróprio'].map((r) => (
          <SheetRow key={r} icon="flag" title={r} onPress={() => { s.toast('Denúncia enviada. Obrigado por cuidar da comunidade.'); close(); }} />
        ))}
        <Text style={{ color: t.c.text2, fontSize: 12.5, paddingHorizontal: 22, paddingTop: 10, lineHeight: 18 }}>
          Se um animal estiver em perigo agora, ligue 190. Denúncias são anônimas para quem foi denunciado.
        </Text>
      </Sheet>

      <Sheet visible={name === 'address'} title="Onde está o pet?" {...common}>
        <SheetRow icon="home" title="Casa" sub={ME.address} right={<Icon name="check" size={22} color={t.toneText} />} onPress={close} />
        <SheetRow icon="pin" title="Trabalho" sub="Av. Paulista, 900 · 12º andar" onPress={() => { s.toast('Endereço: Trabalho'); close(); }} />
        <SheetRow icon="location" title="Usar minha localização" onPress={() => { s.toast('Localização atualizada'); close(); }} />
        <SheetRow icon="plus" title="Adicionar endereço" onPress={() => go('Settings', { section: 'enderecos' })} />
      </Sheet>
    </>
  );
}


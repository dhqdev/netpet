import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { BOOKINGS, POSTS, MATILHAS, CHANNEL_MESSAGES, DM_THREAD, PARTNER_REQUESTS, PARTNER_TODAY, CARE_ROUTINE } from './data';

// Estado do app, guardado em memória enquanto ele está aberto.
// Tudo começa com o conteúdo de exemplo de data.js e muda com o uso.

const StoreContext = createContext(null);
export const useStore = () => useContext(StoreContext);

export function StoreProvider({ children, initialDark }) {
  // No navegador, o endereço com #app pula a entrada (útil para testes e para a prévia).
  const skip = typeof window !== 'undefined' && window.location && /app/.test(window.location.hash || '');
  const [onboarded, setOnboarded] = useState(!!skip);
  const [mode, setMode] = useState('tutor'); // tutor | parceiro
  const [petKey, setPetKey] = useState('pacoca');
  const [direction, setDirection] = useState('aveia');
  const [themeMode, setThemeMode] = useState('sistema'); // sistema | claro | escuro
  const [plus, setPlus] = useState(false);
  const [partnerPro, setPartnerPro] = useState(false);

  const [posts, setPosts] = useState(POSTS);
  const [liked, setLiked] = useState({});
  const [saved, setSaved] = useState({});
  const [following, setFollowing] = useState({ mel: true, thor: true, bidu: true, frida: true, nina: true, pipoca: true });
  const [favorites, setFavorites] = useState({ bichoBom: true });
  const [bookings, setBookings] = useState(BOOKINGS);
  const [joined, setJoined] = useState(MATILHAS.map((m) => m.key));
  const [messages, setMessages] = useState({ 'viralatas/dicas': CHANNEL_MESSAGES });
  const [dms, setDms] = useState({ bichoBom: DM_THREAD });
  const [records, setRecords] = useState([]);
  const [routine, setRoutine] = useState(CARE_ROUTINE);
  const [requests, setRequests] = useState(PARTNER_REQUESTS);
  const [queue, setQueue] = useState(PARTNER_TODAY);
  const [blocked, setBlocked] = useState([]);
  const [notifSettings, setNotifSettings] = useState({ agendamentos: true, patinhas: true, comentarios: true, matilhas: true, perdidos: true, saude: true, ofertas: false });
  const [privacy, setPrivacy] = useState({ perfil: 'Todos', carteirinha: 'Só a família', localizacao: 'Bairro', posts: 'Todos' });

  const [toastMsg, setToastMsg] = useState(null);
  const toastTimer = useRef(null);
  const toast = useCallback((msg) => {
    setToastMsg(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 2400);
  }, []);

  const [sheet, setSheet] = useState(null);
  const openSheet = useCallback((name, params = {}) => setSheet({ name, params }), []);
  const closeSheet = useCallback(() => setSheet(null), []);

  const value = useMemo(() => ({
    onboarded, setOnboarded, mode, setMode, petKey, setPetKey, direction, setDirection, themeMode, setThemeMode,
    plus, setPlus, partnerPro, setPartnerPro,
    posts, liked, saved, following, favorites, bookings, joined, messages, dms, records, routine, requests, queue, blocked,
    notifSettings, privacy, toastMsg, sheet,
    toast, openSheet, closeSheet,
    toggleLike: (id) => setLiked((s) => ({ ...s, [id]: !s[id] })),
    like: (id) => setLiked((s) => ({ ...s, [id]: true })),
    toggleSave: (id) => setSaved((s) => ({ ...s, [id]: !s[id] })),
    toggleFollow: (k) => setFollowing((s) => ({ ...s, [k]: !s[k] })),
    toggleFavorite: (k) => setFavorites((s) => ({ ...s, [k]: !s[k] })),
    addPost: (post) => setPosts((s) => [{ id: `n${Date.now()}`, time: 'agora', paws: 0, comments: 0, mine: true, ...post }, ...s]),
    removePost: (id) => setPosts((s) => s.filter((p) => p.id !== id)),
    addBooking: (b) => {
      const id = `b${Date.now()}`;
      setBookings((s) => [{ id, status: 'upcoming', ...b }, ...s]);
      return id;
    },
    updateBooking: (id, patch) => setBookings((s) => s.map((b) => (b.id === id ? { ...b, ...patch } : b))),
    joinMatilha: (k) => setJoined((s) => (s.includes(k) ? s : [...s, k])),
    leaveMatilha: (k) => setJoined((s) => s.filter((x) => x !== k)),
    sendMessage: (key, msg) => setMessages((s) => ({ ...s, [key]: [...(s[key] || []), { id: `m${Date.now()}`, time: 'agora', ...msg }] })),
    sendDm: (key, text) => setDms((s) => ({ ...s, [key]: [...(s[key] || []), { me: true, text, time: 'agora' }] })),
    addRecord: (r) => setRecords((s) => [{ id: `r${Date.now()}`, when: 'agora', ...r }, ...s]),
    toggleRoutine: (pet, i) => setRoutine((s) => ({ ...s, [pet]: s[pet].map((x, j) => (j === i ? { ...x, on: !x.on } : x)) })),
    addRoutine: (pet, item) => setRoutine((s) => ({ ...s, [pet]: [...(s[pet] || []), { on: true, ...item }] })),
    answerRequest: (id, answer) => setRequests((s) => s.map((r) => (r.id === id ? { ...r, answer } : r))),
    advanceQueue: (id) => setQueue((s) => s.map((q) => (q.id === id ? { ...q, stage: Math.min((q.stage || 0) + 1, 5), state: (q.stage || 0) + 1 >= 5 ? 'done' : 'live' } : q))),
    startQueue: (id) => setQueue((s) => s.map((q) => (q.id === id ? { ...q, state: 'live', stage: 2 } : q))),
    block: (who) => setBlocked((s) => (s.includes(who) ? s : [...s, who])),
    unblock: (who) => setBlocked((s) => s.filter((x) => x !== who)),
    setNotif: (k, v) => setNotifSettings((s) => ({ ...s, [k]: v })),
    setPrivacy: (k, v) => setPrivacy((s) => ({ ...s, [k]: v })),
  }), [onboarded, mode, petKey, direction, themeMode, plus, partnerPro, posts, liked, saved, following, favorites, bookings, joined,
    messages, dms, records, routine, requests, queue, blocked, notifSettings, privacy, toastMsg, sheet, toast, openSheet, closeSheet]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

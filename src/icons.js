import React from 'react';
import Svg, { Path, Circle, Ellipse, Rect } from 'react-native-svg';

// Conjunto único de ícones do netpet: grade de 24, traço de 1,7 com pontas arredondadas.
// `filled` preenche a forma principal (estado ativo); o traço continua na mesma cor.
// Cada ícone é uma lista de formas: string = caminho; objeto = círculo ({c:[x,y,r]}),
// retângulo ({r:[x,y,w,h,rx]}) ou elipse ({e:[x,y,rx,ry]}). A primeira forma recebe o preenchimento.

const I = {
  home: ['M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5h-4V15h-5v5.5h-4A1.5 1.5 0 0 1 4 19z'],
  store: [
    'M4 9.5 5.2 4.5h13.6L20 9.5',
    'M4 9.5a2.67 2.67 0 0 0 5.33 0 2.67 2.67 0 0 0 5.34 0 2.67 2.67 0 0 0 5.33 0',
    'M5.5 12.6v6.9h13v-6.9',
    'M10 19.5v-4h4v4',
  ],
  plus: ['M12 5v14M5 12h14'],
  minus: ['M5 12h14'],
  users: [{ c: [9, 8.5, 3.2] }, 'M3.5 19.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5', 'M15.6 5.7a3.2 3.2 0 0 1 0 5.6', 'M17.2 14.9c2 .6 3.3 2.3 3.3 4.6'],
  user: [{ c: [12, 8.5, 3.6] }, 'M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6'],
  bell: ['M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z', 'M10 20.6a2.2 2.2 0 0 0 4 0'],
  chat: ['M20 12a7.5 7.5 0 0 1-11 6.6L4.5 20l1.2-4A7.5 7.5 0 1 1 20 12z'],
  comment: ['M5 5.5h14A1.5 1.5 0 0 1 20.5 7v8.5A1.5 1.5 0 0 1 19 17h-6.5L8 20.5V17H5a1.5 1.5 0 0 1-1.5-1.5V7A1.5 1.5 0 0 1 5 5.5z'],
  share: ['M20.5 3.5 10.5 13.5', 'M20.5 3.5 14 20.5l-3.5-7-7-3.5z'],
  send: ['M4 12 20 4l-4.5 16-4-6.5z', 'M11.5 13.5 20 4'],
  bookmark: ['M7 4h10a1 1 0 0 1 1 1v15.5l-6-4.2-6 4.2V5a1 1 0 0 1 1-1z'],
  chevDown: ['M6 9.5l6 6 6-6'],
  chevUp: ['M6 14.5l6-6 6 6'],
  chevRight: ['M9.5 6l6 6-6 6'],
  chevLeft: ['M14.5 6l-6 6 6 6'],
  back: ['M19 12H5', 'M11 6l-6 6 6 6'],
  pin: ['M12 21s6.5-5.6 6.5-11a6.5 6.5 0 0 0-13 0c0 5.4 6.5 11 6.5 11z', { c: [12, 10, 2.3] }],
  clock: [{ c: [12, 12, 8.5] }, 'M12 7.5V12l3 2'],
  moon: ['M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z'],
  sun: [{ c: [12, 12, 4] }, 'M12 2.8v2.2M12 19v2.2M2.8 12H5M19 12h2.2M5.5 5.5l1.5 1.5M17 17l1.5 1.5M18.5 5.5 17 7M7 17l-1.5 1.5'],
  star: ['M12 3.6l2.6 5.3 5.9.8-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.8z'],
  verified: [{ c: [12, 12, 8.5] }, 'M8.6 12.2l2.3 2.3 4.6-4.8'],
  camera: ['M4 8.5A1.5 1.5 0 0 1 5.5 7h2L9 4.5h6L16.5 7h2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z', { c: [12, 13, 3.4] }],
  image: [{ r: [3.5, 4.5, 17, 15, 2.5] }, { c: [9, 9.5, 1.6] }, 'M20.5 16l-5-5L5 19.5'],
  calendar: [{ r: [4, 5.5, 16, 14.5, 2.5] }, 'M4 10h16M8.5 3.5v4M15.5 3.5v4'],
  heart: ['M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z'],
  play: ['M8.5 5.5v13l10.5-6.5z'],
  drop: ['M12 3.5s6 6.3 6 10.5a6 6 0 0 1-12 0c0-4.2 6-10.5 6-10.5z'],
  shield: ['M12 3.5l7 2.5v5.5c0 4.3-2.9 7.6-7 9-4.1-1.4-7-4.7-7-9V6z', 'M12 9v5M9.5 11.5h5'],
  shieldCheck: ['M12 3.5l7 2.5v5.5c0 4.3-2.9 7.6-7 9-4.1-1.4-7-4.7-7-9V6z', 'M9 12l2.2 2.2L15.5 10'],
  pill: ['M10.2 4.9a4.2 4.2 0 0 1 5.9 5.9l-5.4 5.4a4.2 4.2 0 0 1-5.9-5.9z', 'M8 9.3l5.7 5.7'],
  check: ['M5 12.5l4.5 4.5L19 7.5'],
  close: ['M6 6l12 12M18 6 6 18'],
  swap: ['M7 7h11l-3-3M17 17H6l3 3'],
  search: [{ c: [10.5, 10.5, 6.5] }, 'M15.5 15.5 20 20'],
  filter: ['M4 6h16M7 12h10M10 18h4'],
  sliders: ['M4 7h9M17 7h3M4 17h3M11 17h9', { c: [15, 7, 2] }, { c: [9, 17, 2] }],
  map: ['M9 4.5 3.5 6.5v13L9 17.5l6 2 5.5-2v-13L15 6.5z', 'M9 4.5v13M15 6.5v13'],
  list: ['M9 6.5h11M9 12h11M9 17.5h11', { c: [4.8, 6.5, 0.9] }, { c: [4.8, 12, 0.9] }, { c: [4.8, 17.5, 0.9] }],
  grid: [{ r: [4, 4, 7, 7, 1.8] }, { r: [13, 4, 7, 7, 1.8] }, { r: [4, 13, 7, 7, 1.8] }, { r: [13, 13, 7, 7, 1.8] }],
  settings: [{ c: [12, 12, 3] }, 'M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6'],
  edit: ['M4.5 19.5l1-4L15.8 5.2a2 2 0 0 1 2.9 0l.1.1a2 2 0 0 1 0 2.9L8.5 18.5z', 'M13.5 7.5l3 3'],
  trash: ['M5 7h14', 'M9.5 7V5h5v2', 'M6.5 7l1 12.5h9l1-12.5', 'M10.5 11v5M13.5 11v5'],
  flag: ['M5.5 21V4.5', 'M5.5 5h11l-2 4 2 4h-11'],
  ban: [{ c: [12, 12, 8.5] }, 'M6 6l12 12'],
  lock: [{ r: [5, 10.5, 14, 10, 2.5] }, 'M8 10.5V8a4 4 0 0 1 8 0v2.5'],
  eye: ['M2.8 12S6.2 5.5 12 5.5 21.2 12 21.2 12 17.8 18.5 12 18.5 2.8 12 2.8 12z', { c: [12, 12, 3] }],
  logout: ['M14 4.5H6.5A1.5 1.5 0 0 0 5 6v12a1.5 1.5 0 0 0 1.5 1.5H14', 'M10 12h10M16.5 8.5 20 12l-3.5 3.5'],
  help: [{ c: [12, 12, 8.5] }, 'M9.6 9.5a2.5 2.5 0 0 1 4.8 1c0 1.7-2.4 2.2-2.4 3.7', 'M12 17.2v.1'],
  info: [{ c: [12, 12, 8.5] }, 'M12 11v5.5', 'M12 7.8v.1'],
  alert: ['M12 4 21 19.5H3z', 'M12 10v4.5', 'M12 17.2v.1'],
  phone: ['M5 4.5h3.5l1.5 4-2 1.5a10 10 0 0 0 6 6l1.5-2 4 1.5V19a1.5 1.5 0 0 1-1.6 1.5C10.8 20 4 13.2 3.5 6.1A1.5 1.5 0 0 1 5 4.5z'],
  mail: [{ r: [3.5, 5.5, 17, 13, 2.5] }, 'M4 7l8 6 8-6'],
  card: [{ r: [3, 5.5, 18, 13, 2.5] }, 'M3 10h18M7 15h4'],
  pix: ['M12 3.5 20.5 12 12 20.5 3.5 12z', 'M8.5 12 12 8.5 15.5 12 12 15.5z'],
  cash: [{ r: [3, 6.5, 18, 11, 2.5] }, { c: [12, 12, 2.6] }, 'M6.5 9.5v.1M17.5 14.4v.1'],
  ticket: ['M4 7.5A1.5 1.5 0 0 1 5.5 6h13A1.5 1.5 0 0 1 20 7.5V10a2 2 0 0 0 0 4v2.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 16.5V14a2 2 0 0 0 0-4z', 'M14 6.5v11'],
  gift: [{ r: [4, 8.5, 16, 4, 1.2] }, 'M5.5 12.5v7h13v-7', 'M12 8.5v11', 'M12 8.5S10.5 4.5 8.4 4.8C6.5 5 7 8.5 12 8.5zM12 8.5s1.5-4 3.6-3.7c1.9.2 1.4 3.7-3.6 3.7z'],
  scissors: [{ c: [6.5, 6.5, 2.5] }, { c: [6.5, 17.5, 2.5] }, 'M8.6 8 20 18M8.6 16 20 6'],
  stethoscope: ['M6 4H5v5a4.5 4.5 0 0 0 9 0V4h-1', 'M9.5 13.5v1a4.5 4.5 0 0 0 9 0v-2', { c: [18.5, 10.5, 2] }],
  bed: ['M3.5 18.5v-11M3.5 14h17v4.5M20.5 14v-2.5A2.5 2.5 0 0 0 18 9h-7.5v5', { c: [7, 11, 1.8] }],
  school: ['M3 9.5 12 5l9 4.5-9 4.5z', 'M6.5 11.3v4.2c0 1.4 2.5 2.8 5.5 2.8s5.5-1.4 5.5-2.8v-4.2', 'M21 9.5v5'],
  whistle: [{ c: [8.5, 14, 5] }, 'M12 10.5l8.5-4.5V10l-6 2.5', { c: [8.5, 14, 1.4] }],
  walk: [{ c: [13, 4.8, 1.8] }, 'M10 21l2-6 3 3v3', 'M8 12.5l2.5-4.5 3.5 1 2.5 3.5', 'M12.5 15l-1-5'],
  leash: [{ c: [6.5, 17.5, 3] }, 'M8.6 15.4 19 5', 'M16 5h3v3'],
  truck: ['M3 6.5h11v10H3z', 'M14 10h4l3 3.5v3h-7', { c: [7, 17.5, 1.8] }, { c: [17, 17.5, 1.8] }],
  scale: [{ r: [4, 4, 16, 16, 4] }, 'M8.5 9.5a5 5 0 0 1 7 0', 'M12 10.5l1.2-1.6'],
  syringe: ['M15 3.5l5.5 5.5', 'M17.8 6.2 9 15l-3-3 8.8-8.8', 'M6 12l-2.5 8.5L12 18', 'M11 9l1.5 1.5M8.5 11.5 10 13'],
  doc: ['M6 3.5h8l4.5 4.5v12.5H6z', 'M14 3.5V8h4.5', 'M9 12.5h6M9 16h6'],
  download: ['M12 4v11', 'M7.5 11 12 15.5 16.5 11', 'M5 20h14'],
  upload: ['M12 15.5V4.5', 'M7.5 9 12 4.5 16.5 9', 'M5 20h14'],
  qr: [{ r: [4, 4, 6, 6, 1.2] }, { r: [14, 4, 6, 6, 1.2] }, { r: [4, 14, 6, 6, 1.2] }, 'M14 14h2.5v2.5H14zM17.5 17.5H20V20h-2.5zM14 19.5v.5M19.5 14h.5'],
  tag: ['M3.5 12.5v-8h8l9 9-8 8z', { c: [8, 8, 1.4] }],
  hash: ['M9 4 7.5 20M16.5 4 15 20M4.5 9h16M3.5 15h16'],
  reply: ['M10 6 4.5 11.5 10 17', 'M4.5 11.5H14a5.5 5.5 0 0 1 5.5 5.5v1'],
  pinned: ['M14.5 3.5l6 6-3 1.5-3.5 3.5-.5 4-7-7 4-.5 3.5-3.5z', 'M8 16 3.5 20.5'],
  smile: [{ c: [12, 12, 8.5] }, 'M8.5 14a4 4 0 0 0 7 0', 'M9 9.8v.1M15 9.8v.1'],
  mic: [{ r: [9, 3.5, 6, 11, 3] }, 'M5.5 11.5a6.5 6.5 0 0 0 13 0', 'M12 18v3'],
  paperclip: ['M19 11.5l-7.6 7.6a4.5 4.5 0 0 1-6.4-6.4l8.1-8.1a3 3 0 0 1 4.2 4.2l-8 8a1.5 1.5 0 0 1-2.1-2.1l7.2-7.2'],
  sparkle: ['M12 3.5c.6 4.4 2.1 5.9 6.5 6.5-4.4.6-5.9 2.1-6.5 6.5-.6-4.4-2.1-5.9-6.5-6.5 4.4-.6 5.9-2.1 6.5-6.5z', 'M18.5 16v4M16.5 18h4'],
  trophy: ['M7.5 4h9v5a4.5 4.5 0 0 1-9 0z', 'M7.5 6H4.5v1.5a3 3 0 0 0 3 3M16.5 6h3v1.5a3 3 0 0 1-3 3', 'M12 13.5V17M8.5 20h7M10 17h4'],
  flame: ['M12 21a6.5 6.5 0 0 0 6.5-6.5c0-4.5-4-6-4.5-10.5-2.5 1.5-4 4-4 6.5-1-.5-1.8-1.6-2-2.8C6.5 9.4 5.5 11.8 5.5 14.5A6.5 6.5 0 0 0 12 21z'],
  cake: ['M4.5 20.5h15v-7a2 2 0 0 0-2-2h-11a2 2 0 0 0-2 2z', 'M4.5 15.5c1.8 1.3 3.3 1.3 5 0 1.7 1.3 3.3 1.3 5 0 1.7 1.3 3.2 1.3 5 0', 'M12 11.5V8', 'M12 6.5c-.9-.6-.9-2 0-3 .9 1 .9 2.4 0 3z'],
  chart: ['M4 4.5v15h16', 'M7.5 15l4-4.5 3 3L19.5 8'],
  wallet: ['M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3', 'M4 7.5v10A2.5 2.5 0 0 0 6.5 20h13v-12H6.5A2.5 2.5 0 0 1 4 5.5', { c: [16, 14, 1.2] }],
  megaphone: ['M4 10v4a1 1 0 0 0 1 1h2.5L15 19.5v-15L7.5 9H5a1 1 0 0 0-1 1z', 'M18 9a4 4 0 0 1 0 6', 'M8 15l1 5h2.5l-1-4.2'],
  crown: ['M4 8l4 4 4-7 4 7 4-4-1.5 11h-13z'],
  rocket: ['M14 4.5c3-1 5.5-1 5.5-1s0 2.5-1 5.5L12 15.5 8.5 12z', 'M8.5 12 5 11.5l3-3.5h4M12 15.5l.5 3.5 3.5-3v-4', 'M7 17c-1.5 0-2.5 1.5-2.5 3.5 2 0 3.5-1 3.5-2.5', { c: [15.3, 8.7, 1.3] }],
  globe: [{ c: [12, 12, 8.5] }, 'M3.5 12h17', 'M12 3.5c2.5 2.5 3.5 5.3 3.5 8.5s-1 6-3.5 8.5c-2.5-2.5-3.5-5.3-3.5-8.5s1-6 3.5-8.5z'],
  timer: [{ c: [12, 13.5, 7] }, 'M12 13.5V10M10 3.5h4'],
  location: [{ c: [12, 12, 3] }, { c: [12, 12, 7.5] }, 'M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2'],
  apple: ['M15.5 7.4c1.5 0 2.7.8 3.3 1.8-2.8 1.6-2.4 5.6.5 6.7-.6 1.6-1.4 3.2-2.6 4.3-.9.8-2 .6-3 .2-1-.4-2-.4-3 0-1 .4-2 .6-2.9-.2C5.6 18 4.5 15 4.5 12.6c0-3.3 2.2-5.2 4.3-5.2 1.1 0 2.1.6 3 .6.8 0 2-.6 3.7-.6z', 'M14.6 3c.1 1.4-.9 3-2.6 3.3-.2-1.5 1-3 2.6-3.3z'],
  at: [{ c: [12, 12, 3.5] }, 'M15.5 12v1.5a2.5 2.5 0 0 0 5 0V12a8.5 8.5 0 1 0-3.4 6.8'],
  more: [],
  paw: [],
  dot: [],
};

const NO_FILL = new Set([
  'plus', 'minus', 'chevDown', 'chevUp', 'chevRight', 'chevLeft', 'back', 'check', 'close', 'swap', 'sun', 'clock', 'verified',
  'calendar', 'pin', 'camera', 'shield', 'shieldCheck', 'pill', 'store', 'share', 'search', 'filter', 'sliders', 'list', 'settings',
  'edit', 'trash', 'ban', 'lock', 'eye', 'logout', 'help', 'info', 'phone', 'mail', 'card', 'cash', 'gift', 'scissors', 'stethoscope',
  'bed', 'school', 'whistle', 'walk', 'leash', 'truck', 'scale', 'syringe', 'doc', 'download', 'upload', 'qr', 'tag', 'hash',
  'reply', 'smile', 'mic', 'paperclip', 'trophy', 'cake', 'chart', 'wallet', 'megaphone', 'rocket', 'globe', 'timer', 'location',
  'at', 'image', 'grid', 'map', 'pix', 'ticket', 'user', 'users', 'send', 'alert', 'pinned', 'flag',
]);

function Shape({ s, fill, common }) {
  if (typeof s === 'string') return <Path d={s} fill={fill} {...common} />;
  if (s.c) return <Circle cx={s.c[0]} cy={s.c[1]} r={s.c[2]} fill={fill} {...common} />;
  if (s.e) return <Ellipse cx={s.e[0]} cy={s.e[1]} rx={s.e[2]} ry={s.e[3]} fill={fill} {...common} />;
  if (s.r) return <Rect x={s.r[0]} y={s.r[1]} width={s.r[2]} height={s.r[3]} rx={s.r[4] || 0} fill={fill} {...common} />;
  return null;
}

export function Icon({ name, size = 24, color = '#000', stroke = 1.7, filled = false }) {
  const common = { stroke: color, strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round' };

  if (name === 'paw') {
    const fill = filled ? color : 'none';
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Ellipse cx="5.6" cy="10.8" rx="1.6" ry="2.1" fill={fill} {...common} />
        <Ellipse cx="9.4" cy="6.4" rx="1.6" ry="2.2" fill={fill} {...common} />
        <Ellipse cx="14.6" cy="6.4" rx="1.6" ry="2.2" fill={fill} {...common} />
        <Ellipse cx="18.4" cy="10.8" rx="1.6" ry="2.1" fill={fill} {...common} />
        <Path
          d="M12 11.6c-2.5 0-4.9 2.5-4.9 5 0 1.7 1.2 2.6 2.5 2.6 1 0 1.6-.5 2.4-.5s1.4.5 2.4.5c1.3 0 2.5-.9 2.5-2.6 0-2.5-2.4-5-4.9-5z"
          fill={fill}
          {...common}
        />
      </Svg>
    );
  }
  if (name === 'more') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        {[6, 12, 18].map((x) => <Circle key={x} cx={x} cy="12" r="1.5" fill={color} />)}
      </Svg>
    );
  }
  if (name === 'dot') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Circle cx="12" cy="12" r="4" fill={color} />
      </Svg>
    );
  }

  const shapes = I[name] || [];
  const fillFirst = filled && !NO_FILL.has(name) ? color : 'none';
  // Ícones de traço aberto ganham preenchimento leve no estado ativo, sem perder a leitura.
  const softFill = filled && NO_FILL.has(name) && ['users', 'user'].includes(name);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {shapes.map((s, i) => (
        <Shape key={i} s={s} common={common} fill={i === 0 ? (softFill ? color : fillFirst) : 'none'} />
      ))}
    </Svg>
  );
}

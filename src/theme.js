import React from 'react';

// Tokens das três direções visuais da etapa 1.
// accent      = caramelo de preenchimento (botões, estados ativos, patinha)
// accentText  = caramelo escurecido para texto, com contraste de 4,5:1 ou mais
// onAccent    = texto sobre o caramelo

export const DIRECTIONS = {
  aveia: {
    key: 'aveia',
    name: 'Aveia',
    note: 'Calma e arejada. Título em Nunito, traço fino, caramelo só no essencial.',
    fonts: { title: 'Nunito_600SemiBold', titleStrong: 'Nunito_700Bold' },
    radius: { card: 20, tile: 14, chip: 999 },
    icon: { stroke: 1.7, activeFill: false },
    light: {
      bg: '#FAF7F2', surface: '#FFFFFF', surface2: '#F3EEE6', line: 'rgba(70,52,30,0.11)',
      text: '#26211C', text2: '#6F665C', accent: '#D9923B', accentText: '#9A5B14', onAccent: '#2B1B08',
      overlay: 'rgba(38,33,28,0.42)',
    },
    dark: {
      bg: '#121110', surface: '#1C1A18', surface2: '#262320', line: 'rgba(255,240,220,0.10)',
      text: '#F3EEE7', text2: '#A79F95', accent: '#E0A152', accentText: '#E6AE66', onAccent: '#2B1B08',
      overlay: 'rgba(0,0,0,0.6)',
    },
  },
  caramelo: {
    key: 'caramelo',
    name: 'Caramelo',
    note: 'Quente e acolhedora. Título em Fredoka, superfícies tingidas, o "Hoje" em destaque.',
    fonts: { title: 'Fredoka_500Medium', titleStrong: 'Fredoka_600SemiBold' },
    radius: { card: 24, tile: 16, chip: 999 },
    icon: { stroke: 1.7, activeFill: true },
    light: {
      bg: '#F5ECDD', surface: '#FFFAF1', surface2: '#EBDDC6', line: 'rgba(90,60,20,0.13)',
      text: '#2E2217', text2: '#6E5D49', accent: '#C97B1E', accentText: '#8A4E0E', onAccent: '#2A1705',
      overlay: 'rgba(46,34,23,0.45)',
    },
    dark: {
      bg: '#17120C', surface: '#221A11', surface2: '#2E2417', line: 'rgba(255,225,180,0.11)',
      text: '#F6EBDB', text2: '#B5A48D', accent: '#E3A04A', accentText: '#EBB36A', onAccent: '#2A1705',
      overlay: 'rgba(0,0,0,0.62)',
    },
  },
  pet: {
    key: 'pet',
    name: 'Cor do pet',
    note: 'A foto manda. Título em Baloo 2, neutros de pedra e o app inteiro no tom do pet ativo.',
    fonts: { title: 'Baloo2_600SemiBold', titleStrong: 'Baloo2_700Bold' },
    radius: { card: 18, tile: 14, chip: 999 },
    icon: { stroke: 1.7, activeFill: true },
    light: {
      bg: '#F7F6F3', surface: '#FFFFFF', surface2: '#EEECE7', line: 'rgba(40,38,34,0.10)',
      text: '#1F1E1C', text2: '#6B6862', accent: '#D9923B', accentText: '#9A5B14', onAccent: '#2B1B08',
      overlay: 'rgba(31,30,28,0.45)',
    },
    dark: {
      bg: '#131211', surface: '#1D1C1A', surface2: '#282724', line: 'rgba(255,250,240,0.10)',
      text: '#F2F1EE', text2: '#A3A09A', accent: '#E0A152', accentText: '#E6AE66', onAccent: '#2B1B08',
      overlay: 'rgba(0,0,0,0.62)',
    },
  },
};

export const DIRECTION_ORDER = ['aveia', 'caramelo', 'pet'];

export function alpha(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

export const ThemeContext = React.createContext(null);
export const useTheme = () => React.useContext(ThemeContext);

// Monta o tema usado pelas telas: cores da direção, fontes e a cor do pet ativo.
export function buildTheme(directionKey, dark, pet) {
  const d = DIRECTIONS[directionKey];
  const c = dark ? d.dark : d.light;
  const petColor = dark ? pet.colorDark : pet.color;
  const petText = dark ? pet.colorDark : pet.colorText;
  return {
    key: d.key,
    dark,
    c,
    fonts: d.fonts,
    radius: d.radius,
    icon: d.icon,
    pet,
    petColor,
    petText,
    // Na direção "Cor do pet", o tom do pet substitui o caramelo nos estados ativos.
    tone: d.key === 'pet' ? petColor : c.accent,
    toneText: d.key === 'pet' ? petText : c.accentText,
    onTone: d.key === 'pet' ? pet.onColor : c.onAccent,
  };
}

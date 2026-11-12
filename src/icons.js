import React from 'react';
import Svg, { Path, Circle, Ellipse, Rect } from 'react-native-svg';

// Conjunto único de ícones do netpet: grade de 24, traço de 1,7 com pontas arredondadas.
// `filled` preenche a forma (estado ativo); o traço continua na mesma cor.

const P = {
  home: ['M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5h-4V15h-5v5.5h-4A1.5 1.5 0 0 1 4 19z'],
  store: [
    'M4 9.5 5.2 4.5h13.6L20 9.5',
    'M4 9.5a2.67 2.67 0 0 0 5.33 0 2.67 2.67 0 0 0 5.34 0 2.67 2.67 0 0 0 5.33 0',
    'M5.5 12.6v6.9h13v-6.9',
    'M10 19.5v-4h4v4',
  ],
  plus: ['M12 5v14M5 12h14'],
  users: ['M3.5 19.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5', 'M15.6 5.7a3.2 3.2 0 0 1 0 5.6', 'M17.2 14.9c2 .6 3.3 2.3 3.3 4.6'],
  bell: ['M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z', 'M10 20.6a2.2 2.2 0 0 0 4 0'],
  chat: ['M20 12a7.5 7.5 0 0 1-11 6.6L4.5 20l1.2-4A7.5 7.5 0 1 1 20 12z'],
  comment: ['M5 5.5h14A1.5 1.5 0 0 1 20.5 7v8.5A1.5 1.5 0 0 1 19 17h-6.5L8 20.5V17H5a1.5 1.5 0 0 1-1.5-1.5V7A1.5 1.5 0 0 1 5 5.5z'],
  share: ['M20.5 3.5 10.5 13.5', 'M20.5 3.5 14 20.5l-3.5-7-7-3.5z'],
  bookmark: ['M7 4h10a1 1 0 0 1 1 1v15.5l-6-4.2-6 4.2V5a1 1 0 0 1 1-1z'],
  chevDown: ['M6 9.5l6 6 6-6'],
  chevUp: ['M6 14.5l6-6 6 6'],
  chevRight: ['M9.5 6l6 6-6 6'],
  pin: ['M12 21s6.5-5.6 6.5-11a6.5 6.5 0 0 0-13 0c0 5.4 6.5 11 6.5 11z'],
  clock: ['M12 7.5V12l3 2'],
  moon: ['M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z'],
  sun: ['M12 2.8v2.2M12 19v2.2M2.8 12H5M19 12h2.2M5.5 5.5l1.5 1.5M17 17l1.5 1.5M18.5 5.5 17 7M7 17l-1.5 1.5'],
  star: ['M12 3.6l2.6 5.3 5.9.8-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.8z'],
  verified: ['M8.6 12.2l2.3 2.3 4.6-4.8'],
  camera: ['M4 8.5A1.5 1.5 0 0 1 5.5 7h2L9 4.5h6L16.5 7h2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z'],
  calendar: ['M4 10h16M8.5 3.5v4M15.5 3.5v4'],
  heart: ['M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z'],
  play: ['M8.5 5.5v13l10.5-6.5z'],
  drop: ['M12 3.5s6 6.3 6 10.5a6 6 0 0 1-12 0c0-4.2 6-10.5 6-10.5z'],
  shield: ['M12 3.5l7 2.5v5.5c0 4.3-2.9 7.6-7 9-4.1-1.4-7-4.7-7-9V6z', 'M12 9v5M9.5 11.5h5'],
  pill: ['M10.2 4.9a4.2 4.2 0 0 1 5.9 5.9l-5.4 5.4a4.2 4.2 0 0 1-5.9-5.9z', 'M8 9.3l5.7 5.7'],
  check: ['M5 12.5l4.5 4.5L19 7.5'],
  close: ['M6 6l12 12M18 6 6 18'],
  swap: ['M7 7h11l-3-3M17 17H6l3 3'],
};

export function Icon({ name, size = 24, color = '#000', stroke = 1.7, filled = false }) {
  const common = { stroke: color, strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const fill = filled ? color : 'none';
  let extra = null;

  if (name === 'paw') {
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
  if (name === 'users') extra = <Circle cx="9" cy="8.5" r="3.2" fill={fill} {...common} />;
  if (name === 'pin') extra = <Circle cx="12" cy="10" r="2.3" fill="none" {...common} />;
  if (name === 'clock') extra = <Circle cx="12" cy="12" r="8.5" fill="none" {...common} />;
  if (name === 'sun') extra = <Circle cx="12" cy="12" r="4" fill="none" {...common} />;
  if (name === 'verified') extra = <Circle cx="12" cy="12" r="8.5" fill="none" {...common} />;
  if (name === 'camera') extra = <Circle cx="12" cy="13" r="3.4" fill="none" {...common} />;
  if (name === 'calendar') extra = <Rect x="4" y="5.5" width="16" height="14.5" rx="2.5" fill="none" {...common} />;

  const openShapes = ['plus', 'chevDown', 'chevUp', 'chevRight', 'check', 'close', 'swap', 'sun', 'clock', 'verified', 'calendar', 'pin', 'camera', 'shield', 'pill', 'store', 'share'];
  const pathFill = filled && !openShapes.includes(name) ? color : 'none';

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {extra}
      {(P[name] || []).map((d, i) => <Path key={i} d={d} fill={i === 0 ? pathFill : 'none'} {...common} />)}
    </Svg>
  );
}

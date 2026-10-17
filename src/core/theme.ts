export const C = {
  bg: '#FFF6E9',
  bg2: '#FFE8F0',
  ink: '#3A2A5C',
  inkSoft: '#7A6B9A',
  white: '#FFFFFF',
  purple: '#7C5CFF',
  pink: '#FF5FA2',
  orange: '#FF9A3C',
  yellow: '#FFD23F',
  green: '#2ECC71',
  mint: '#3DDCB4',
  blue: '#3FA9F5',
  red: '#FF5A5F',
  sky: '#8FD3FF',
  grey: '#D9D2EC',
  shadow: '#2B1B4D',
  easy: '#2ECC71',
  hard: '#FF9A3C',
  expert: '#FF5A5F',
};

export const CANDY = [C.pink, C.purple, C.blue, C.mint, C.orange, C.yellow, C.green, C.red, '#B86BFF', '#00B8D9'];

export const DIFF_COLOR = {easy: C.easy, hard: C.hard, expert: C.expert} as const;
export const DIFF_LABEL = {easy: 'Easy', hard: 'Medium', expert: 'Hard'} as const;
export const DIFF_EMOJI = {easy: '🐣', hard: '🦊', expert: '🦁'} as const;

export const shadow = {
  shadowColor: C.shadow,
  shadowOpacity: 0.18,
  shadowRadius: 8,
  shadowOffset: {width: 0, height: 4},
  elevation: 5,
};

export const font = {
  title: {fontSize: 30, fontWeight: '900' as const, color: C.ink},
  h2: {fontSize: 22, fontWeight: '900' as const, color: C.ink},
  body: {fontSize: 17, fontWeight: '700' as const, color: C.ink},
  small: {fontSize: 14, fontWeight: '700' as const, color: C.inkSoft},
};

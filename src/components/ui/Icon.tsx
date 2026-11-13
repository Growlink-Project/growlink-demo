import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors } from '@/theme/tokens';

// Monochrome stroke icons (24×24). Navigation icons stay neutral; colour communicates state only.
const P: Record<string, string> = {
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z',
  calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  chat: 'M4 5h12v9H8l-4 3zM8 14v2h8l4 3V9h-4',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c1-4 4.5-6 8-6s7 2 8 6',
  users: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20c.8-3.4 3.4-5 6.5-5s5.7 1.6 6.5 5M16 4.5a3.3 3.3 0 0 1 0 6.3M18 14.5c1.9.6 3.1 2.4 3.5 5.5',
  bell: 'M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
  sliders: 'M4 7h9M17 7h3M4 17h3M11 17h9M15 5v4M9 15v4',
  'chevron-right': 'M9 5l7 7-7 7', 'chevron-left': 'M15 5l-7 7 7 7', 'chevron-down': 'M5 9l7 7 7-7', 'chevron-up': 'M5 15l7-7 7 7',
  back: 'M20 12H5M11 6l-6 6 6 6', arrow: 'M4 12h15M13 6l6 6-6 6',
  share: 'M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8.6 13.5l6.8 4M15.4 6.5l-6.8 4',
  heart: 'M12 20s-7.5-4.6-9-9.3C2 7.5 4.2 4.5 7.4 4.5c2 0 3.5 1.1 4.6 2.6 1.1-1.5 2.6-2.6 4.6-2.6 3.2 0 5.4 3 4.4 6.2C19.5 15.4 12 20 12 20z',
  more: 'M5 12h.01M12 12h.01M19 12h.01', 'more-v': 'M12 5h.01M12 12h.01M12 19h.01',
  star: 'M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8L3.5 9.7l5.9-.8z',
  pin: 'M12 21s-7-6.2-7-11.5a7 7 0 1 1 14 0C19 14.8 12 21 12 21zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c2.5 2.6 3.7 5.6 3.7 9s-1.2 6.4-3.7 9c-2.5-2.6-3.7-5.6-3.7-9S9.5 5.6 12 3z',
  monitor: 'M3 5h18v11H3zM8 20h8M12 16v4',
  music: 'M9 18V6l11-2v12M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM20 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
  academic: 'M2 9l10-5 10 5-10 5zM6 11v5c3 2.5 9 2.5 12 0v-5M22 9v6',
  fitness: 'M6.5 6.5v11M17.5 6.5v11M3 9.5v5M21 9.5v5M6.5 12h11',
  creative: 'M12 3a9 9 0 0 0 0 18c1.2 0 1.8-.9 1.8-1.8 0-1.3-1.1-1.6-1.1-2.7 0-1 .8-1.6 1.8-1.6H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3zM7.5 12h.01M9.5 7.5h.01M14.5 7.5h.01',
  sofa: 'M4 11V8a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v3M2 13a2 2 0 0 1 4 0v2h12v-2a2 2 0 0 1 4 0v5H2zM5 18v2M19 18v2',
  wrench: 'M14.5 6.5a4 4 0 0 0 5 5L21 13l-8 8-4.5-4.5 8-8zM3 21l6-6M14.5 6.5l3-3a4 4 0 0 0-3 3z',
  map: 'M9 4L3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14',
  list: 'M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01',
  locate: 'M12 19a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM12 2v3M12 19v3M2 12h3M19 12h3',
  plus: 'M12 5v14M5 12h14', minus: 'M5 12h14', check: 'M5 12.5l4.5 4.5L19 7.5', close: 'M6 6l12 12M18 6L6 18',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  card: 'M3 6h18v12H3zM3 10h18M7 15h4',
  shield: 'M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6zM9 12l2 2 4-4',
  flag: 'M5 21V4M5 4h11l-2 4 2 4H5',
  desk: 'M3 9h18M5 9v11M19 9v11M3 5h18v4H3zM9 13h6',
  wallet: 'M3 7a2 2 0 0 1 2-2h13v4M3 7v11a2 2 0 0 0 2 2h15V9H5a2 2 0 0 1-2-2zM16 14.5h.01',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-2.7-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3.6 15H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.1-2.7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 9.7 4V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1.3z',
  edit: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  eye: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  'eye-off': 'M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4M6.6 6.6C3.9 8.4 2 12 2 12s3.6 7 10 7a9.6 9.6 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2',
  camera: 'M4 8h3l2-3h6l2 3h3v11H4zM12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z',
  clip: 'M20 11.5l-8.2 8.2a5 5 0 0 1-7-7l8.5-8.5a3.3 3.3 0 0 1 4.7 4.7l-8.5 8.5a1.7 1.7 0 0 1-2.4-2.4L15 7.2',
  send: 'M21 3L10 14M21 3l-7 18-4-7-7-4z',
  doc: 'M6 3h8l5 5v13H6zM14 3v5h5M9 13h6M9 17h6',
  trophy: 'M8 4h8v5a4 4 0 0 1-8 0zM8 6H4c0 3 1.5 4.5 4 5M16 6h4c0 3-1.5 4.5-4 5M12 13v4M8 21h8M9 17h6',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7.5h.01',
  lock: 'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4',
  logout: 'M15 4h4v16h-4M10 17l5-5-5-5M15 12H3',
  swap: 'M7 4l-4 4 4 4M3 8h14M17 20l4-4-4-4M21 16H7',
  layers: 'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  video: 'M3 6h12v12H3zM15 10l6-3v10l-6-3z',
  image: 'M4 5h16v14H4zM4 16l5-5 4 4 2-2 5 5M15.5 9.5h.01',
  checkin: 'M12 21s-7-6.2-7-11.5a7 7 0 1 1 14 0C19 14.8 12 21 12 21zM9 10l2 2 4-4',
  refresh: 'M20 11a8 8 0 0 0-14.7-4.3L4 8M4 4v4h4M4 13a8 8 0 0 0 14.7 4.3L20 16M20 20v-4h-4',
  help: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5v.7M12 17h.01',
  block: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM5.6 5.6l12.8 12.8',
  flask: 'M9 3h6M10 3v6L4.5 18.5A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.5-2.5L14 9V3M7 15h10',
  sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 17l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z',
  tag: 'M3 12V4h8l10 10-8 8zM7.5 8h.01',
  bank: 'M3 9l9-5 9 5M5 10v8M9 10v8M15 10v8M19 10v8M3 21h18',
  download: 'M12 4v11M7 10l5 5 5-5M5 20h14',
};

export function Icon({ name, size = 20, color = colors.ink, fill, strokeWidth = 1.8 }: { name: string; size?: number; color?: string; fill?: string; strokeWidth?: number }) {
  if (name === 'dot') return <Svg width={size} height={size} viewBox="0 0 24 24"><Circle cx={12} cy={12} r={5} fill={color} /></Svg>;
  if (name === 'square') return <Svg width={size} height={size} viewBox="0 0 24 24"><Rect x={4} y={4} width={16} height={16} rx={3} stroke={color} strokeWidth={strokeWidth} fill={fill ?? 'none'} /></Svg>;
  const d = P[name] ?? P.info;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d={d} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill={fill ?? 'none'} />
    </Svg>
  );
}

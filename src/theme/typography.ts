import { TextStyle } from 'react-native';
import { colors } from './tokens';

export const fonts = {
  lexend400: 'Lexend_400Regular',
  lexend500: 'Lexend_500Medium',
  lexend600: 'Lexend_600SemiBold',
  lexend700: 'Lexend_700Bold',
  inter400: 'Inter_400Regular',
  inter500: 'Inter_500Medium',
  inter600: 'Inter_600SemiBold',
  inter700: 'Inter_700Bold',
};

export const type: Record<string, TextStyle> = {
  display: { fontFamily: fonts.lexend700, fontSize: 38, lineHeight: 42, letterSpacing: -0.76, color: colors.ink },
  hero: { fontFamily: fonts.lexend600, fontSize: 30, lineHeight: 33, color: colors.ink },
  h1: { fontFamily: fonts.lexend500, fontSize: 25, lineHeight: 31, color: colors.ink },
  screenTitle: { fontFamily: fonts.lexend500, fontSize: 17, lineHeight: 22, color: colors.ink },
  section: { fontFamily: fonts.lexend500, fontSize: 15, lineHeight: 20, color: colors.ink },
  strong: { fontFamily: fonts.inter600, fontSize: 14.5, lineHeight: 19, color: colors.ink },
  body: { fontFamily: fonts.inter400, fontSize: 12.5, lineHeight: 18, color: colors.ink },
  bodyMuted: { fontFamily: fonts.inter400, fontSize: 12.5, lineHeight: 18, color: colors.muted },
  caption: { fontFamily: fonts.inter500, fontSize: 11, lineHeight: 14, color: colors.muted },
  button: { fontFamily: fonts.inter600, fontSize: 15, lineHeight: 20 },
  price: { fontFamily: fonts.inter600, fontSize: 15, lineHeight: 20, color: colors.ink, fontVariant: ['tabular-nums'] },
  money: { fontFamily: fonts.inter700, fontSize: 26, lineHeight: 32, color: colors.ink, fontVariant: ['tabular-nums'] },
};

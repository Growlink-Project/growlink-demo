import { Platform } from 'react-native';

export const colors = {
  forest: '#0F3D2E',
  green: '#2FA36B',
  link: '#1F8F5A',
  ink: '#10251B',
  muted: '#5E6B64',
  star: '#D9A21E',
  canvas: '#F8FAF7',
  surface: '#FFFFFF',
  soft: '#EEF3EF',
  mintTint: '#E6F4EA',
  line: '#E8EEEA',
  // Growly mint treatment (approved marker/mascot)
  mint: '#BFE6CC',
  mintDeep: '#9ED8B2',
  // Semantic state colours — always paired with a text label/icon, never used alone
  danger: '#B3261E',
  dangerTint: '#FBEAE8',
  warn: '#8A5A00',
  warnTint: '#FBF1DC',
  info: '#245A8A',
  infoTint: '#E7F0F8',
  overlay: 'rgba(16,37,27,0.42)',
  // Map fallback palette (quiet neutrals)
  mapBase: '#F1F4F0',
  mapBlock: '#E7ECE6',
  mapRoad: '#FFFFFF',
  mapPark: '#DCEFD9',
  mapWater: '#D7E9F2',
};

export const space = { xs: 4, sm: 8, md: 10, lg: 12, xl: 14, xxl: 18, screen: 18 };

export const radius = { pill: 999, hero: 22, card: 14, tile: 12, sm: 8 };

/** One consistent, extremely subtle elevation style. */
export const elevation = Platform.select({
  web: { boxShadow: '0 2px 10px rgba(16,37,27,0.07)' } as object,
  default: {
    shadowColor: '#10251B',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
})!;

export const hitSlop = { top: 8, bottom: 8, left: 8, right: 8 };

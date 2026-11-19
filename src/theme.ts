export const colors = {
  green: '#2DBE5A',
  greenDark: '#2E8B2E',
  greenStat: '#1DBF54',
  blue: '#2B7BD6',
  black: '#111111',
  text: '#222222',
  muted: '#6F6F6F',
  border: '#1F1F1F',
  bgArc: '#F0F0F0',
  searchBg: '#D9D9D9',
  white: '#FFFFFF',
};

export const fonts = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semibold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
};

import { Role } from './types';
export type { Role };

export const roleInfo: Record<Role, { label: string; color: string; title: string }> = {
  cidadao: { label: 'Cidadão', color: colors.green, title: 'Cidadão Consciente' },
  voluntario: { label: 'Voluntário', color: colors.blue, title: 'Voluntário Ativo' },
};

export const shadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.15,
  shadowRadius: 8,
  elevation: 6,
};

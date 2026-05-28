import { useTheme } from '../context/ThemeContext'

/** 4 couleurs simples : lavande, pêche, sauge, nuit */
const light = {
  bg: 'transparent',
  bgSolid: '#E8E2F4',
  navBg: 'transparent',
  navText: '#FFFFFF',
  navMuted: 'rgba(255,255,255,0.85)',
  sidebarBg: 'rgba(255, 255, 255, 0.38)',
  sidebarBorder: 'rgba(255, 255, 255, 0.55)',
  surface: 'rgba(255, 255, 255, 0.42)',
  surfaceElevated: 'rgba(255, 255, 255, 0.55)',
  surfaceMuted: 'rgba(255, 255, 255, 0.28)',
  border: 'rgba(255, 255, 255, 0.5)',
  borderStrong: 'rgba(155, 142, 196, 0.45)',
  text: '#3D3456',
  textMid: '#5A5070',
  textSoft: '#7A708E',
  accent: '#E8B4A0',
  accentDark: '#9B8EC4',
  accentDeep: '#7A6EAA',
  accentGradient: 'linear-gradient(135deg, #E8B4A0 0%, #9B8EC4 100%)',
  accentGlow: 'rgba(155, 142, 196, 0.35)',
  success: '#7BA38C',
  successBg: 'rgba(123, 163, 140, 0.25)',
  error: '#C45C5C',
  errorBg: 'rgba(196, 92, 92, 0.15)',
  shadow: '0 8px 32px rgba(61, 52, 86, 0.1)',
  shadowLg: '0 20px 50px rgba(61, 52, 86, 0.14)',
  cardHover: '0 16px 40px rgba(155, 142, 196, 0.22)',
  overlay: 'rgba(61, 52, 86, 0.45)',
  inputBg: 'rgba(255, 255, 255, 0.5)',
  chipBg: 'rgba(255, 255, 255, 0.4)',
  sideActive: 'linear-gradient(135deg, #E8B4A0, #9B8EC4)',
  avatarBg: 'linear-gradient(135deg, #E8B4A0, #9B8EC4)',
  online: '#7BA38C'
}

const dark = {
  bg: 'transparent',
  bgSolid: '#1E1C2C',
  navBg: 'transparent',
  navText: '#F5F2FA',
  navMuted: 'rgba(255,255,255,0.75)',
  sidebarBg: 'rgba(40, 36, 58, 0.55)',
  sidebarBorder: 'rgba(255, 255, 255, 0.1)',
  surface: 'rgba(40, 36, 58, 0.6)',
  surfaceElevated: 'rgba(50, 46, 70, 0.72)',
  surfaceMuted: 'rgba(30, 28, 45, 0.5)',
  border: 'rgba(255, 255, 255, 0.12)',
  borderStrong: 'rgba(155, 142, 196, 0.3)',
  text: '#F5F2FA',
  textMid: '#D4CCE8',
  textSoft: '#A89EC4',
  accent: '#E8B4A0',
  accentDark: '#B8A8D8',
  accentDeep: '#9B8EC4',
  accentGradient: 'linear-gradient(135deg, #E8B4A0 0%, #9B8EC4 100%)',
  accentGlow: 'rgba(232, 180, 160, 0.2)',
  success: '#8BC4A8',
  successBg: 'rgba(123, 163, 140, 0.2)',
  error: '#E88888',
  errorBg: 'rgba(196, 92, 92, 0.2)',
  shadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
  shadowLg: '0 24px 60px rgba(0, 0, 0, 0.45)',
  cardHover: '0 16px 48px rgba(0, 0, 0, 0.4)',
  overlay: 'rgba(0, 0, 0, 0.7)',
  inputBg: 'rgba(30, 28, 45, 0.65)',
  chipBg: 'rgba(40, 36, 58, 0.65)',
  sideActive: 'linear-gradient(135deg, #E8B4A0, #9B8EC4)',
  avatarBg: 'linear-gradient(135deg, #E8B4A0, #9B8EC4)',
  online: '#8BC4A8'
}

export function getTheme(darkMode) {
  return darkMode ? dark : light
}

export function useAppTheme() {
  const { darkMode } = useTheme()
  return getTheme(darkMode)
}

export const lightSurfaces = {
  page: 'transparent',
  card: 'rgba(255, 255, 255, 0.42)',
  cardAlt: 'rgba(255, 255, 255, 0.32)',
  input: 'rgba(255, 255, 255, 0.5)',
  soft: 'rgba(255, 255, 255, 0.35)',
  border: 'rgba(255, 255, 255, 0.55)'
}

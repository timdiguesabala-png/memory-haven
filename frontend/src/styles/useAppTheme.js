import { useTheme } from '../context/ThemeContext'

const light = {
  bg: 'linear-gradient(165deg, #FDF8F3 0%, #F5E6D3 45%, #EDE0CF 100%)',
  bgSolid: '#FDF8F3',
  navBg: 'linear-gradient(135deg, #5C3D2E 0%, #3D2410 55%, #2A1808 100%)',
  navText: '#FDF6EE',
  navMuted: '#E8C9A0',
  sidebarBg: 'rgba(255, 255, 255, 0.55)',
  sidebarBorder: 'rgba(155, 98, 64, 0.15)',
  surface: 'rgba(255, 255, 255, 0.92)',
  surfaceElevated: '#FFFFFF',
  surfaceMuted: '#FFF9F3',
  border: 'rgba(200, 149, 108, 0.35)',
  borderStrong: '#E8C9A0',
  text: '#3D2410',
  textMid: '#6B4428',
  textSoft: '#9B7248',
  accent: '#C8956C',
  accentDark: '#9B6240',
  accentDeep: '#6B3F20',
  accentGradient: 'linear-gradient(135deg, #D4A574 0%, #9B6240 50%, #6B3F20 100%)',
  accentGlow: 'rgba(200, 149, 108, 0.45)',
  success: '#5A8F4A',
  successBg: '#E8F2E4',
  error: '#B84A4A',
  errorBg: '#FCEBEB',
  shadow: '0 8px 32px rgba(61, 36, 16, 0.1)',
  shadowLg: '0 20px 50px rgba(61, 36, 16, 0.14)',
  cardHover: '0 16px 40px rgba(107, 63, 32, 0.16)',
  overlay: 'rgba(61, 36, 16, 0.55)',
  inputBg: '#FFFFFF',
  chipBg: 'rgba(255, 249, 243, 0.95)',
  sideActive: 'linear-gradient(135deg, #D4A574, #9B6240)',
  avatarBg: 'linear-gradient(135deg, #E8C9A0, #C8956C)',
  online: '#6BA85A'
}

const dark = {
  bg: 'linear-gradient(165deg, #141210 0%, #1E1A16 50%, #252019 100%)',
  bgSolid: '#141210',
  navBg: 'linear-gradient(135deg, #2A221C 0%, #1E1814 100%)',
  navText: '#F5EDE4',
  navMuted: '#C4A882',
  sidebarBg: 'rgba(30, 26, 22, 0.85)',
  sidebarBorder: 'rgba(200, 149, 108, 0.12)',
  surface: 'rgba(38, 32, 28, 0.95)',
  surfaceElevated: '#2E2824',
  surfaceMuted: '#262220',
  border: 'rgba(200, 149, 108, 0.2)',
  borderStrong: 'rgba(200, 149, 108, 0.35)',
  text: '#F5EDE4',
  textMid: '#D4C4B0',
  textSoft: '#A89078',
  accent: '#D4A574',
  accentDark: '#C8956C',
  accentDeep: '#9B6240',
  accentGradient: 'linear-gradient(135deg, #D4A574 0%, #B08060 100%)',
  accentGlow: 'rgba(212, 165, 116, 0.25)',
  success: '#7AB86A',
  successBg: 'rgba(90, 143, 74, 0.2)',
  error: '#E88888',
  errorBg: 'rgba(184, 74, 74, 0.2)',
  shadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
  shadowLg: '0 24px 60px rgba(0, 0, 0, 0.45)',
  cardHover: '0 16px 48px rgba(0, 0, 0, 0.4)',
  overlay: 'rgba(0, 0, 0, 0.75)',
  inputBg: '#1E1A16',
  chipBg: 'rgba(38, 32, 28, 0.9)',
  sideActive: 'linear-gradient(135deg, #C8956C, #9B6240)',
  avatarBg: 'linear-gradient(135deg, #C8956C, #9B6240)',
  online: '#7AB86A'
}

export function getTheme(darkMode) {
  return darkMode ? dark : light
}

export function useAppTheme() {
  const { darkMode } = useTheme()
  return getTheme(darkMode)
}

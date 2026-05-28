import { useTheme } from '../context/ThemeContext'

const light = {
  bg: 'linear-gradient(165deg, #F6F4FA 0%, #EDE8F5 45%, #E4DDF2 100%)',
  bgSolid: '#F6F4FA',
  navBg: 'linear-gradient(135deg, #6B5B95 0%, #4A3F7A 50%, #2A2640 100%)',
  navText: '#F8F6FC',
  navMuted: '#D4C8F0',
  sidebarBg: 'rgba(255, 255, 255, 0.6)',
  sidebarBorder: 'rgba(107, 91, 149, 0.18)',
  surface: 'rgba(255, 255, 255, 0.94)',
  surfaceElevated: '#FFFFFF',
  surfaceMuted: '#F3F0FA',
  border: 'rgba(123, 107, 184, 0.3)',
  borderStrong: '#C5B8E0',
  text: '#2A2640',
  textMid: '#4A4568',
  textSoft: '#7A7394',
  accent: '#E8A87C',
  accentDark: '#7B6BB8',
  accentDeep: '#5B4D9E',
  accentGradient: 'linear-gradient(135deg, #E8A87C 0%, #7B6BB8 50%, #5B4D9E 100%)',
  accentGlow: 'rgba(123, 107, 184, 0.4)',
  success: '#5B9A8C',
  successBg: '#E4F2EF',
  error: '#C45C5C',
  errorBg: '#FCEBEB',
  shadow: '0 8px 32px rgba(42, 38, 64, 0.1)',
  shadowLg: '0 20px 50px rgba(42, 38, 64, 0.14)',
  cardHover: '0 16px 40px rgba(91, 77, 158, 0.18)',
  overlay: 'rgba(42, 38, 64, 0.55)',
  inputBg: '#FFFFFF',
  chipBg: 'rgba(248, 246, 252, 0.95)',
  sideActive: 'linear-gradient(135deg, #E8A87C, #7B6BB8)',
  avatarBg: 'linear-gradient(135deg, #C5B8E0, #7B6BB8)',
  online: '#5B9A8C'
}

const dark = {
  bg: 'linear-gradient(165deg, #12101A 0%, #1A1828 50%, #221F32 100%)',
  bgSolid: '#12101A',
  navBg: 'linear-gradient(135deg, #3D3268 0%, #2A2640 100%)',
  navText: '#F0EDF8',
  navMuted: '#B8A8D8',
  sidebarBg: 'rgba(26, 24, 40, 0.9)',
  sidebarBorder: 'rgba(123, 107, 184, 0.15)',
  surface: 'rgba(34, 31, 50, 0.96)',
  surfaceElevated: '#2A2640',
  surfaceMuted: '#1E1C2A',
  border: 'rgba(123, 107, 184, 0.22)',
  borderStrong: 'rgba(197, 184, 224, 0.35)',
  text: '#F0EDF8',
  textMid: '#C8BFE0',
  textSoft: '#9488B0',
  accent: '#E8A87C',
  accentDark: '#9B8AD0',
  accentDeep: '#7B6BB8',
  accentGradient: 'linear-gradient(135deg, #E8A87C 0%, #7B6BB8 100%)',
  accentGlow: 'rgba(232, 168, 124, 0.2)',
  success: '#6BB5A5',
  successBg: 'rgba(91, 154, 140, 0.2)',
  error: '#E88888',
  errorBg: 'rgba(196, 92, 92, 0.2)',
  shadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
  shadowLg: '0 24px 60px rgba(0, 0, 0, 0.5)',
  cardHover: '0 16px 48px rgba(0, 0, 0, 0.45)',
  overlay: 'rgba(0, 0, 0, 0.78)',
  inputBg: '#1A1828',
  chipBg: 'rgba(34, 31, 50, 0.9)',
  sideActive: 'linear-gradient(135deg, #E8A87C, #7B6BB8)',
  avatarBg: 'linear-gradient(135deg, #9B8AD0, #7B6BB8)',
  online: '#6BB5A5'
}

export function getTheme(darkMode) {
  return darkMode ? dark : light
}

export function useAppTheme() {
  const { darkMode } = useTheme()
  return getTheme(darkMode)
}

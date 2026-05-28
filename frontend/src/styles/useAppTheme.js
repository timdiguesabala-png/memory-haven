import { useTheme } from '../context/ThemeContext'

const light = {
  bg: 'linear-gradient(165deg, #D4C6E8 0%, #C8B8DC 45%, #BEB0D4 100%)',
  bgSolid: '#D4C6E8',
  navBg: 'linear-gradient(135deg, #7A5A8C 0%, #5A4570 50%, #352A48 100%)',
  navText: '#F5F0FA',
  navMuted: '#E0D4F0',
  sidebarBg: 'rgba(190, 176, 212, 0.82)',
  sidebarBorder: 'rgba(94, 74, 120, 0.28)',
  surface: 'rgba(196, 180, 216, 0.96)',
  surfaceElevated: '#C4B4D8',
  surfaceMuted: '#B8A8CC',
  border: 'rgba(94, 74, 120, 0.38)',
  borderStrong: '#B5A3CC',
  text: '#2E2438',
  textMid: '#453A52',
  textSoft: '#6A5C7A',
  accent: '#D4845A',
  accentDark: '#8B6FA8',
  accentDeep: '#5E4A78',
  accentGradient: 'linear-gradient(135deg, #D4845A 0%, #8B6FA8 50%, #5E4A78 100%)',
  accentGlow: 'rgba(139, 111, 168, 0.45)',
  success: '#4E8A7A',
  successBg: '#C8E4DC',
  error: '#C45C5C',
  errorBg: '#E8C8C8',
  shadow: '0 8px 32px rgba(46, 36, 56, 0.16)',
  shadowLg: '0 20px 50px rgba(46, 36, 56, 0.2)',
  cardHover: '0 16px 40px rgba(94, 74, 120, 0.28)',
  overlay: 'rgba(46, 36, 56, 0.6)',
  inputBg: '#B8A8CC',
  chipBg: 'rgba(196, 184, 216, 0.95)',
  sideActive: 'linear-gradient(135deg, #D4845A, #8B6FA8)',
  avatarBg: 'linear-gradient(135deg, #B5A3CC, #8B6FA8)',
  online: '#4E8A7A'
}

const dark = {
  bg: 'linear-gradient(165deg, #12101A 0%, #1A1828 50%, #221F32 100%)',
  bgSolid: '#12101A',
  navBg: 'linear-gradient(135deg, #4A3D62 0%, #352A48 100%)',
  navText: '#F0EDF8',
  navMuted: '#B8A8D8',
  sidebarBg: 'rgba(26, 24, 40, 0.9)',
  sidebarBorder: 'rgba(139, 111, 168, 0.2)',
  surface: 'rgba(34, 31, 50, 0.96)',
  surfaceElevated: '#2A2640',
  surfaceMuted: '#1E1C2A',
  border: 'rgba(139, 111, 168, 0.25)',
  borderStrong: 'rgba(181, 163, 204, 0.35)',
  text: '#F0EDF8',
  textMid: '#C8BFE0',
  textSoft: '#9488B0',
  accent: '#D4845A',
  accentDark: '#A88BC8',
  accentDeep: '#8B6FA8',
  accentGradient: 'linear-gradient(135deg, #D4845A 0%, #8B6FA8 100%)',
  accentGlow: 'rgba(212, 132, 90, 0.25)',
  success: '#6BB5A5',
  successBg: 'rgba(78, 138, 122, 0.25)',
  error: '#E88888',
  errorBg: 'rgba(196, 92, 92, 0.2)',
  shadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
  shadowLg: '0 24px 60px rgba(0, 0, 0, 0.5)',
  cardHover: '0 16px 48px rgba(0, 0, 0, 0.45)',
  overlay: 'rgba(0, 0, 0, 0.78)',
  inputBg: '#1A1828',
  chipBg: 'rgba(34, 31, 50, 0.9)',
  sideActive: 'linear-gradient(135deg, #D4845A, #8B6FA8)',
  avatarBg: 'linear-gradient(135deg, #A88BC8, #8B6FA8)',
  online: '#6BB5A5'
}

export function getTheme(darkMode) {
  return darkMode ? dark : light
}

export function useAppTheme() {
  const { darkMode } = useTheme()
  return getTheme(darkMode)
}

/** Couleurs mode clair (pages avec styles inline) */
export const lightSurfaces = {
  page: '#D4C6E8',
  card: '#D0C2E4',
  cardAlt: '#C4B4D8',
  input: '#B8A8CC',
  soft: '#C8B8DC',
  border: '#B5A3CC'
}

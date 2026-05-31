/** Affiche le nom de famille sans préfixe « Famille » en double */
export function formatFamilyName(famille) {
  if (!famille) return ''
  const t = String(famille).trim()
  return t.replace(/^famille\s+/i, '').trim() || t
}

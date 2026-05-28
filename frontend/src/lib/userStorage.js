export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('utilisateur') || '{}')
  } catch {
    return {}
  }
}

export function updateStoredUser(partial) {
  const next = { ...getStoredUser(), ...partial }
  localStorage.setItem('utilisateur', JSON.stringify(next))
  window.dispatchEvent(new CustomEvent('mh-user-updated', { detail: next }))
  return next
}

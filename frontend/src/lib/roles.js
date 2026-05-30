export function estAdmin(role) {
  return role === 'ADMIN' || role === 'SUPER_ADMIN'
}

export function estLecteur(role) {
  return role === 'LECTEUR'
}

export function peutEcrire(role) {
  return role !== 'LECTEUR'
}

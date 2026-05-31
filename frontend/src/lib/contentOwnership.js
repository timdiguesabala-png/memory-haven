import { getStoredUser } from './userStorage'
import { estAdmin } from './roles'

/** L’auteur du contenu ou un administrateur peut modifier / supprimer. */
export function peutModifierContenuAuteur(entree) {
  const u = getStoredUser()
  if (!entree || !u?.id) return false
  const auteurId = entree.auteur_id ?? entree.auteur?.id
  return auteurId === u.id || estAdmin(u.role)
}

/** Parse fichiers_multiple (JSON string ou tableau) comme le backend Express. */
export function parseFichiersMultiple(value) {
  if (!value) return null
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : null
    } catch {
      return null
    }
  }
  return null
}

export function formatSouvenirRow(row) {
  if (!row) return row
  const tags = (row.tags || [])
    .map((st) => st.tag || st)
    .filter(Boolean)
    .map((t) => ({ id: t.id, libelle: t.libelle, couleur: t.couleur }))

  const { tags: _tags, auteur, reactions, commentaires, membre_arbre, ...rest } = row
  return {
    ...rest,
    fichiers_multiple: parseFichiersMultiple(rest.fichiers_multiple),
    auteur: auteur || null,
    reactions: reactions || [],
    commentaires: commentaires || [],
    tags,
    membre_arbre: membre_arbre || null
  }
}

export function supabaseErrorMessage(error, fallback = 'Erreur Supabase') {
  if (!error) return fallback
  return error.message || error.details || error.hint || fallback
}

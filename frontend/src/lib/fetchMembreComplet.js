import api from '../services/api'
import { isSupabaseMode } from './supabaseClient'
import { getMembreById } from '../services/membersApi'
import { getCachedMembre } from './membresProfilCache'
import { parseReseauxSociaux } from './profilFields'

function mergeMembre(base, extra) {
  if (!extra) return base
  const role = base?.role ?? extra?.role
  return {
    ...base,
    ...extra,
    role,
    interets: extra.interets ?? base?.interets,
    langues: extra.langues ?? base?.langues,
    reseaux_sociaux: extra.reseaux_sociaux ?? base?.reseaux_sociaux
  }
}

function normalizePayload(data) {
  if (!data || typeof data !== 'object') return null
  const u = data.id != null ? data : data.utilisateur
  if (!u?.id && !u?.prenom) return null
  return {
    ...u,
    reseaux_sociaux:
      typeof u.reseaux_sociaux === 'object' && u.reseaux_sociaux
        ? u.reseaux_sociaux
        : parseReseauxSociaux(u.reseaux_sociaux)
  }
}

async function tryGet(path) {
  try {
    const rep = await api.get(path)
    return normalizePayload(rep.data?.data ?? rep.data)
  } catch {
    return null
  }
}

/** Charge la fiche la plus complète possible (plusieurs sources en parallèle). */
export async function fetchMembreComplet(membreListItem) {
  const id = membreListItem?.id
  const cached = getCachedMembre(id)
  let merged = mergeMembre(mergeMembre(cached, membreListItem), null)

  let detail = null
  let profil = null

  if (isSupabaseMode()) {
    try {
      const rep = await getMembreById(id)
      detail = rep?.data ?? null
    } catch {
      detail = null
    }
  } else {
    ;[detail, profil] = await Promise.all([
      tryGet(`/membres/${id}`),
      tryGet(`/platform/profil/${id}`)
    ])
  }

  if (detail) merged = mergeMembre(merged, detail)
  if (profil) {
    merged = mergeMembre(merged, {
      ...profil,
      arbre_filiation: detail?.arbre_filiation ?? merged.arbre_filiation
    })
  }

  return { membre: merged }
}

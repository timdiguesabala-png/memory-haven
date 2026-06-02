import api from '../services/api'
import { getApiCapabilities } from './apiCapabilities'
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

/** Charge la fiche la plus complète possible (membres/:id puis platform/profil). */
export async function fetchMembreComplet(membreListItem) {
  const id = membreListItem?.id
  let merged = mergeMembre(membreListItem, null)
  let warning = ''

  const caps = await getApiCapabilities()
  if (caps.legacyHealth || !caps.membresFicheDetail) {
    warning =
      'API Railway pas à jour : ouvrez railway.com → votre service API → Redeploy (branche main), attendez Success, puis Ctrl+F5 sur ce site.'
  }

  if (!caps.membresFicheDetail) {
    try {
      const rep = await api.get(`/platform/profil/${id}`)
      const raw = rep.data?.data ?? rep.data
      const data = normalizePayload(raw)
      if (data) {
        return {
          membre: mergeMembre(merged, { ...data, arbre_filiation: merged.arbre_filiation }),
          warning
        }
      }
    } catch {
      /* ignore */
    }
    return { membre: merged, warning }
  }

  try {
    const rep = await api.get(`/membres/${id}`)
    const data = normalizePayload(rep.data?.data ?? rep.data)
    if (data) return { membre: mergeMembre(merged, data), warning: '' }
  } catch (err) {
    const status = err.response?.status
    if (status !== 404) {
      warning = 'Détails limités : API membres indisponible.'
    }
  }

  try {
    const rep = await api.get(`/platform/profil/${id}`)
    const raw = rep.data?.data ?? rep.data
    const data = normalizePayload(raw)
    if (data) {
      return {
        membre: mergeMembre(merged, { ...data, arbre_filiation: merged.arbre_filiation }),
        warning: warning || 'Fiche via profil plateforme (mettez l’API à jour pour tout afficher).'
      }
    }
  } catch {
    /* ignore */
  }

  return { membre: merged, warning }
}

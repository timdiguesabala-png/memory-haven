import api from '../services/api'
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

  if (!warning && merged?.prenom) {
    warning =
      'Fiche partielle : redéployez l’API (Railway/Render) ou utilisez LANCER.bat en local pour tous les champs.'
  }

  return { membre: merged, warning }
}

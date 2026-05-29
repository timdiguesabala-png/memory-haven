import api from './api'

export async function fetchArbreComplet() {
  const rep = await api.get('/arbre')
  return rep.data.data
}

export async function createCoupleRacine({ ancetre1, ancetre2, date_debut }) {
  const rep = await api.post('/arbre/couple-racine', {
    ancetre1,
    ancetre2,
    date_debut: date_debut || null
  })
  return rep.data
}

export async function createUnion(payload) {
  const rep = await api.post('/arbre/unions', payload)
  return rep.data
}

export async function addEnfantToUnion(unionId, enfantId) {
  const rep = await api.post(`/arbre/unions/${unionId}/enfants`, { enfant_id: enfantId })
  return rep.data
}

export async function checkArbreApiReady() {
  try {
    const rep = await api.get('/health')
    return {
      ready: rep.data?.version === '10-arbre-unions-postgresql',
      version: rep.data?.version,
      features: rep.data?.features
    }
  } catch {
    return { ready: false, version: null }
  }
}

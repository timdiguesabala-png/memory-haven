const express = require('express')
const prisma = require('../lib/prisma')
const { verifierToken } = require('../middleware/auth')
const { exigerEcriture } = require('../middleware/roles')
const { isAllowedAvatarUrl } = require('../lib/serializeUtilisateur')

const router = express.Router()

async function membreDansFamille(id, familleId) {
  return prisma.membreArbre.findFirst({
    where: { id, famille_id: familleId, is_visible: true }
  })
}

async function validerParentId(parentId, membreId, familleId) {
  if (parentId === null || parentId === undefined || parentId === '') {
    return null
  }

  const pid = parseInt(parentId, 10)
  if (Number.isNaN(pid)) {
    const err = new Error('Parent invalide')
    err.status = 400
    throw err
  }

  if (membreId && pid === membreId) {
    const err = new Error('Un membre ne peut pas être son propre parent')
    err.status = 400
    throw err
  }

  const parent = await membreDansFamille(pid, familleId)
  if (!parent) {
    const err = new Error('Parent introuvable dans la famille')
    err.status = 400
    throw err
  }

  if (membreId) {
    let courant = parent
    const visite = new Set()
    while (courant?.parent_id) {
      if (courant.parent_id === membreId) {
        const err = new Error('Ce parent créerait une boucle dans l\'arbre')
        err.status = 400
        throw err
      }
      if (visite.has(courant.parent_id)) break
      visite.add(courant.parent_id)
      courant = await membreDansFamille(courant.parent_id, familleId)
    }
  }

  return pid
}

function typeArbreFromParent(parentId) {
  return parentId ? 'ENFANT' : 'ASCENDANT'
}

function parseArbrePositions(raw) {
  if (!raw) return {}
  try {
    const o = typeof raw === 'string' ? JSON.parse(raw) : raw
    return o && typeof o === 'object' && !Array.isArray(o) ? o : {}
  } catch {
    return {}
  }
}

async function getFamillePositions(familleId) {
  try {
    const f = await prisma.famille.findUnique({
      where: { id: familleId },
      select: { arbre_positions: true }
    })
    return parseArbrePositions(f?.arbre_positions)
  } catch (err) {
    if (/arbre_positions|Unknown field/i.test(err.message)) return {}
    throw err
  }
}

async function saveFamillePositions(familleId, positions) {
  const payload = JSON.stringify(positions)
  try {
    await prisma.famille.update({
      where: { id: familleId },
      data: { arbre_positions: payload }
    })
  } catch (err) {
    if (/arbre_positions|Unknown field/i.test(err.message)) {
      const e = new Error('Sauvegarde des positions non disponible (migration serveur requise)')
      e.status = 503
      throw e
    }
    throw err
  }
}

async function clearFamillePositions(familleId) {
  try {
    await prisma.famille.update({
      where: { id: familleId },
      data: { arbre_positions: null }
    })
  } catch (err) {
    if (!/arbre_positions|Unknown field/i.test(err.message)) throw err
  }
}

async function sanitizePositionsInput(positions, familleId) {
  const out = {}
  if (!positions || typeof positions !== 'object' || Array.isArray(positions)) {
    return out
  }

  for (const [key, pos] of Object.entries(positions)) {
    const x = Number(pos?.x)
    const y = Number(pos?.y)
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue

    if (typeof key === 'string' && key.startsWith('union-')) {
      out[key] = { x, y }
      continue
    }

    const id = parseInt(key, 10)
    if (!Number.isNaN(id)) {
      const m = await membreDansFamille(id, familleId)
      if (m) out[String(id)] = { x, y }
    }
  }

  return out
}

async function applyArbreExtraFields(data, body) {
  const { genre, type_arbre, layout_ordre } = body
  if (genre != null && ['HOMME', 'FEMME', 'NON_PRECISE'].includes(String(genre))) {
    data.genre = genre
  }
  if (type_arbre != null && ['ENFANT', 'ASCENDANT', 'CONJOINT'].includes(String(type_arbre))) {
    data.type_arbre = type_arbre
  }
  if (layout_ordre !== undefined && layout_ordre !== null && layout_ordre !== '') {
    const n = parseInt(layout_ordre, 10)
    if (!Number.isNaN(n)) data.layout_ordre = n
  }
  return data
}

async function updateMembreSafe(id, data) {
  try {
    return await prisma.membreArbre.update({ where: { id }, data })
  } catch (err) {
    if (/genre|type_arbre|layout_ordre|Unknown arg/i.test(err.message)) {
      const lean = { ...data }
      delete lean.genre
      delete lean.type_arbre
      delete lean.layout_ordre
      if (!Object.keys(lean).length) throw err
      return prisma.membreArbre.update({ where: { id }, data: lean })
    }
    throw err
  }
}

async function createMembreSafe(data) {
  try {
    return await prisma.membreArbre.create({ data })
  } catch (err) {
    if (/genre|type_arbre|layout_ordre|Unknown arg/i.test(err.message)) {
      const lean = { ...data }
      delete lean.genre
      delete lean.type_arbre
      delete lean.layout_ordre
      return prisma.membreArbre.create({ data: lean })
    }
    throw err
  }
}

// GET /api/arbre - Récupère tout l'arbre de la famille
router.get('/', verifierToken, async (req, res) => {
  try {
    const membres = await prisma.membreArbre.findMany({
      where: {
        famille_id: req.utilisateur.famille_id,
        is_visible: true
      },
      include: {
        utilisateur: {
          select: { id: true, nom: true, prenom: true, avatar_url: true }
        }
      },
      orderBy: { created_at: 'asc' }
    })

    const positions = await getFamillePositions(req.utilisateur.famille_id)

    res.json({ succes: true, data: membres, positions })
  } catch (erreur) {
    console.error('Erreur GET arbre:', erreur)
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

// POST /api/arbre - Ajouter un membre dans l'arbre
router.post('/', verifierToken, exigerEcriture, async (req, res) => {
  try {
    const { nom, date_naissance, date_deces, photo_url, biographie, parent_id, genre, type_arbre, layout_ordre } =
      req.body

    if (!nom?.trim()) {
      return res.status(400).json({
        succes: false,
        message: 'Le nom est obligatoire'
      })
    }

    const parentValide = await validerParentId(parent_id, null, req.utilisateur.famille_id)

    let data = {
      nom: nom.trim(),
      date_naissance: date_naissance ? new Date(date_naissance) : null,
      date_deces: date_deces ? new Date(date_deces) : null,
      photo_url: photo_url || null,
      biographie: biographie || null,
      parent_id: parentValide,
      type_arbre: type_arbre || typeArbreFromParent(parentValide),
      famille_id: req.utilisateur.famille_id
    }
    data = await applyArbreExtraFields(data, { genre, type_arbre, layout_ordre })

    const membre = await createMembreSafe(data)

    res.status(201).json({
      succes: true,
      message: 'Membre ajouté avec succès',
      data: membre
    })
  } catch (erreur) {
    console.error('Erreur POST arbre:', erreur)
    res.status(erreur.status || 500).json({
      succes: false,
      message: erreur.message || 'Erreur serveur'
    })
  }
})

// PUT /api/arbre/positions — positions manuelles (tous appareils)
router.put('/positions', verifierToken, exigerEcriture, async (req, res) => {
  try {
    const { positions } = req.body
    const familleId = req.utilisateur.famille_id
    const sanitized = await sanitizePositionsInput(positions, familleId)
    await saveFamillePositions(familleId, sanitized)

    res.json({
      succes: true,
      message: 'Positions enregistrées',
      positions: sanitized
    })
  } catch (erreur) {
    console.error('Erreur PUT arbre/positions:', erreur)
    res.status(erreur.status || 500).json({
      succes: false,
      message: erreur.message || 'Erreur serveur'
    })
  }
})

// DELETE /api/arbre/positions — réinitialiser les positions manuelles
router.delete('/positions', verifierToken, exigerEcriture, async (req, res) => {
  try {
    await clearFamillePositions(req.utilisateur.famille_id)
    res.json({ succes: true, message: 'Positions réinitialisées', positions: {} })
  } catch (erreur) {
    console.error('Erreur DELETE arbre/positions:', erreur)
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

// PUT /api/arbre/:id/photo — photo du membre dans l'arbre
router.put('/:id/photo', verifierToken, exigerEcriture, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    const { photo_url } = req.body

    const existing = await membreDansFamille(id, req.utilisateur.famille_id)
    if (!existing) {
      return res.status(404).json({ succes: false, message: 'Membre introuvable' })
    }

    if (photo_url != null && !isAllowedAvatarUrl(photo_url)) {
      return res.status(400).json({ succes: false, message: 'URL de photo invalide' })
    }

    const membre = await prisma.membreArbre.update({
      where: { id },
      data: { photo_url: photo_url || null }
    })

    res.json({ succes: true, data: membre })
  } catch (erreur) {
    console.error('Erreur photo arbre:', erreur)
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

// DELETE /api/arbre/:id/photo
router.delete('/:id/photo', verifierToken, exigerEcriture, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    const existing = await membreDansFamille(id, req.utilisateur.famille_id)
    if (!existing) {
      return res.status(404).json({ succes: false, message: 'Membre introuvable' })
    }

    const membre = await prisma.membreArbre.update({
      where: { id },
      data: { photo_url: null }
    })

    res.json({ succes: true, data: membre })
  } catch (erreur) {
    console.error('Erreur suppression photo arbre:', erreur)
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

// PUT /api/arbre/:id - Modifier un membre
router.put('/:id', verifierToken, exigerEcriture, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    const { nom, date_naissance, date_deces, biographie, parent_id, photo_url, genre, type_arbre, layout_ordre } =
      req.body

    const existing = await membreDansFamille(id, req.utilisateur.famille_id)
    if (!existing) {
      return res.status(404).json({ succes: false, message: 'Membre introuvable' })
    }

    const data = {}

    if (nom !== undefined) data.nom = nom.trim() || existing.nom
    if (date_naissance !== undefined) {
      data.date_naissance = date_naissance ? new Date(date_naissance) : null
    }
    if (date_deces !== undefined) {
      data.date_deces = date_deces ? new Date(date_deces) : null
    }
    if (biographie !== undefined) data.biographie = biographie

    if (parent_id !== undefined) {
      data.parent_id = await validerParentId(parent_id, id, req.utilisateur.famille_id)
      if (type_arbre === undefined) {
        data.type_arbre = typeArbreFromParent(data.parent_id)
      }
    }

    await applyArbreExtraFields(data, { genre, type_arbre, layout_ordre })

    if (photo_url !== undefined) {
      if (photo_url != null && !isAllowedAvatarUrl(photo_url)) {
        return res.status(400).json({ succes: false, message: 'URL de photo invalide' })
      }
      data.photo_url = photo_url || null
    }

    const membre = await updateMembreSafe(id, data)

    res.json({ succes: true, data: membre })
  } catch (erreur) {
    console.error('Erreur PUT arbre:', erreur)
    res.status(erreur.status || 500).json({
      succes: false,
      message: erreur.message || 'Erreur serveur'
    })
  }
})

// DELETE /api/arbre/vider — supprime tous les membres visibles de la famille
router.delete('/vider', verifierToken, exigerEcriture, async (req, res) => {
  try {
    const familleId = req.utilisateur.famille_id

    const result = await prisma.$transaction(async (tx) => {
      const count = await tx.membreArbre.count({
        where: { famille_id: familleId, is_visible: true }
      })

      if (count === 0) {
        return { count: 0 }
      }

      await tx.membreArbre.updateMany({
        where: { famille_id: familleId, is_visible: true },
        data: { is_visible: false, parent_id: null }
      })

      try {
        await tx.famille.update({
          where: { id: familleId },
          data: { arbre_positions: null }
        })
      } catch (_) {
        /* colonne arbre_positions optionnelle */
      }

      try {
        await tx.unionFamiliale.updateMany({
          where: { famille_id: familleId, is_visible: true },
          data: { is_visible: false }
        })
      } catch (_) {
        /* tables unions optionnelles */
      }

      return { count }
    })

    res.json({
      succes: true,
      message: "Arbre généalogique vidé",
      supprimes: result.count
    })
  } catch (erreur) {
    console.error('Erreur DELETE arbre/vider:', erreur)
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

// DELETE /api/arbre/:id - Supprimer un membre (logique)
router.delete('/:id', verifierToken, exigerEcriture, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    const existing = await membreDansFamille(id, req.utilisateur.famille_id)
    if (!existing) {
      return res.status(404).json({ succes: false, message: 'Membre introuvable' })
    }

    const enfants = await prisma.membreArbre.findMany({
      where: { parent_id: id, famille_id: req.utilisateur.famille_id, is_visible: true }
    })

    await prisma.$transaction([
      ...enfants.map((enfant) =>
        prisma.membreArbre.update({
          where: { id: enfant.id },
          data: { parent_id: null }
        })
      ),
      prisma.membreArbre.update({
        where: { id },
        data: { is_visible: false }
      })
    ])

    res.json({
      succes: true,
      message: 'Membre supprimé',
      enfantsDetaches: enfants.length
    })
  } catch (erreur) {
    console.error('Erreur DELETE arbre:', erreur)
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

module.exports = router

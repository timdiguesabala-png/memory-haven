const express = require('express')
const prisma = require('../lib/prisma')
const { verifierToken } = require('../middleware/auth')
const { isAllowedAvatarUrl } = require('../lib/serializeUtilisateur')

const router = express.Router()

const GENRES_VALIDES = ['HOMME', 'FEMME', 'AUTRE', 'NON_PRECISE']
const TYPES_ARBRE = ['ENFANT', 'CONJOINT', 'ASCENDANT']

function parseTypeArbre(type) {
  if (!type) return 'ENFANT'
  const t = String(type).toUpperCase()
  return TYPES_ARBRE.includes(t) ? t : 'ENFANT'
}

const membreInclude = {
  utilisateur: {
    select: { id: true, nom: true, prenom: true, avatar_url: true }
  }
}

const unionInclude = {
  conjoints: {
    orderBy: { ordre: 'asc' },
    include: { membre: { include: membreInclude } }
  },
  enfants: {
    orderBy: { ordre: 'asc' },
    include: { enfant: { include: membreInclude } }
  }
}

async function membreDansFamille(id, familleId) {
  return prisma.membreArbre.findFirst({
    where: { id, famille_id: familleId, is_visible: true }
  })
}

async function unionDansFamille(id, familleId) {
  return prisma.unionFamiliale.findFirst({
    where: { id, famille_id: familleId, is_visible: true }
  })
}

function parseGenre(genre) {
  if (!genre) return 'NON_PRECISE'
  const g = String(genre).toUpperCase()
  return GENRES_VALIDES.includes(g) ? g : 'NON_PRECISE'
}

// GET /api/arbre — membres + unions (mariages et enfants)
router.get('/', verifierToken, async (req, res) => {
  try {
    const familleId = req.utilisateur.famille_id

    const [membres, unions] = await Promise.all([
      prisma.membreArbre.findMany({
        where: { famille_id: familleId, is_visible: true },
        include: membreInclude,
        orderBy: [{ layout_ordre: 'asc' }, { created_at: 'asc' }]
      }),
      prisma.unionFamiliale.findMany({
        where: { famille_id: familleId, is_visible: true },
        include: unionInclude,
        orderBy: { ordre: 'asc' }
      })
    ])

    res.json({ succes: true, data: { membres, unions } })
  } catch (erreur) {
    console.error('Erreur GET arbre:', erreur)
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

// POST /api/arbre — ajouter une personne
router.post('/', verifierToken, async (req, res) => {
  try {
    const {
      nom,
      genre,
      type_arbre,
      date_naissance,
      date_deces,
      photo_url,
      biographie,
      parent_id,
      layout_ordre
    } = req.body

    if (!nom) {
      return res.status(400).json({ succes: false, message: 'Le nom est obligatoire' })
    }

    const membre = await prisma.membreArbre.create({
      data: {
        nom,
        genre: parseGenre(genre),
        type_arbre: parseTypeArbre(type_arbre),
        date_naissance: date_naissance ? new Date(date_naissance) : null,
        date_deces: date_deces ? new Date(date_deces) : null,
        photo_url: photo_url || null,
        biographie: biographie || null,
        parent_id: parent_id ? parseInt(parent_id, 10) : null,
        layout_ordre: layout_ordre != null ? parseInt(layout_ordre, 10) : 0,
        famille_id: req.utilisateur.famille_id
      },
      include: membreInclude
    })

    res.status(201).json({ succes: true, message: 'Membre ajouté', data: membre })
  } catch (erreur) {
    console.error('Erreur POST arbre:', erreur)
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

// POST /api/arbre/unions — mariage : 1 personne de l'arbre + époux/épouse (fiche CONJOINT)
router.post('/unions', verifierToken, async (req, res) => {
  try {
    const {
      conjoint_ids = [],
      nouveau_conjoint,
      nouveaux_conjoints = [],
      date_debut,
      date_fin,
      ordre
    } = req.body
    const familleId = req.utilisateur.famille_id

    const ids = [
      ...new Set(
        (Array.isArray(conjoint_ids) ? conjoint_ids : [])
          .map((id) => parseInt(id, 10))
          .filter((id) => !Number.isNaN(id))
      )
    ]

    const aCreer = []
    if (nouveau_conjoint?.nom) aCreer.push(nouveau_conjoint)
    if (Array.isArray(nouveaux_conjoints)) {
      nouveaux_conjoints.filter((nc) => nc?.nom).forEach((nc) => aCreer.push(nc))
    }

    for (const nc of aCreer) {
      const cree = await prisma.membreArbre.create({
        data: {
          nom: nc.nom,
          genre: parseGenre(nc.genre || 'FEMME'),
          type_arbre: 'CONJOINT',
          date_naissance: nc.date_naissance ? new Date(nc.date_naissance) : null,
          date_deces: nc.date_deces ? new Date(nc.date_deces) : null,
          biographie: nc.biographie || null,
          photo_url: nc.photo_url || null,
          famille_id: familleId
        }
      })
      ids.push(cree.id)
    }

    if (ids.length < 2) {
      return res.status(400).json({
        succes: false,
        message:
          'Indiquez la personne de l\'arbre et créez la fiche époux/épouse (nom, genre, dates), ou choisissez un conjoint existant.'
      })
    }

    const membres = await prisma.membreArbre.findMany({
      where: { id: { in: ids }, famille_id: familleId, is_visible: true }
    })

    if (membres.length !== ids.length) {
      return res.status(400).json({ succes: false, message: 'Un ou plusieurs membres introuvables' })
    }

    const nbEnfants = membres.filter((m) => m.type_arbre === 'ENFANT').length
    const nbConjoints = membres.filter(
      (m) => m.type_arbre === 'CONJOINT' || m.type_arbre === 'ASCENDANT'
    ).length

    if (nbEnfants > 1) {
      return res.status(400).json({
        succes: false,
        message:
          'Les enfants ne peuvent pas être sélectionnés comme épouses. Créez une fiche « époux/épouse » avec leurs propres informations.'
      })
    }

    if (nbConjoints < 1) {
      return res.status(400).json({
        succes: false,
        message:
          'Ajoutez au moins une fiche époux/épouse (pas un enfant) pour ce mariage.'
      })
    }

    const union = await prisma.unionFamiliale.create({
      data: {
        famille_id: familleId,
        date_debut: date_debut ? new Date(date_debut) : null,
        date_fin: date_fin ? new Date(date_fin) : null,
        ordre: ordre != null ? parseInt(ordre, 10) : 0,
        conjoints: {
          create: ids.map((membre_id, index) => ({ membre_id, ordre: index }))
        }
      },
      include: unionInclude
    })

    res.status(201).json({ succes: true, message: 'Mariage enregistré', data: union })
  } catch (erreur) {
    console.error('Erreur POST union:', erreur)
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

// PUT /api/arbre/unions/reorder — réordonner les unions (avant /:id)
router.put('/unions/reorder', verifierToken, async (req, res) => {
  try {
    const { items } = req.body
    const familleId = req.utilisateur.famille_id

    if (!Array.isArray(items)) {
      return res.status(400).json({ succes: false, message: 'items requis' })
    }

    await prisma.$transaction(
      items.map(({ id, ordre }) =>
        prisma.unionFamiliale.updateMany({
          where: { id: parseInt(id, 10), famille_id: familleId },
          data: { ordre: parseInt(ordre, 10) }
        })
      )
    )

    res.json({ succes: true, message: 'Ordre mis à jour' })
  } catch (erreur) {
    console.error('Erreur reorder unions:', erreur)
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

// PUT /api/arbre/unions/:id — modifier dates / ordre
router.put('/unions/:id', verifierToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    const { date_debut, date_fin, ordre } = req.body
    const existing = await unionDansFamille(id, req.utilisateur.famille_id)
    if (!existing) {
      return res.status(404).json({ succes: false, message: 'Union introuvable' })
    }

    const union = await prisma.unionFamiliale.update({
      where: { id },
      data: {
        date_debut: date_debut !== undefined ? (date_debut ? new Date(date_debut) : null) : undefined,
        date_fin: date_fin !== undefined ? (date_fin ? new Date(date_fin) : null) : undefined,
        ordre: ordre !== undefined ? parseInt(ordre, 10) : undefined
      },
      include: unionInclude
    })

    res.json({ succes: true, data: union })
  } catch (erreur) {
    console.error('Erreur PUT union:', erreur)
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

// POST /api/arbre/unions/:id/enfants — lier un enfant à un couple
router.post('/unions/:id/enfants', verifierToken, async (req, res) => {
  try {
    const unionId = parseInt(req.params.id, 10)
    const { enfant_id, ordre } = req.body
    const familleId = req.utilisateur.famille_id

    const union = await unionDansFamille(unionId, familleId)
    if (!union) {
      return res.status(404).json({ succes: false, message: 'Union introuvable' })
    }

    const enfantId = parseInt(enfant_id, 10)
    const enfant = await membreDansFamille(enfantId, familleId)
    if (!enfant) {
      return res.status(400).json({ succes: false, message: 'Enfant introuvable' })
    }

    const maxOrdre = await prisma.enfantUnion.aggregate({
      where: { union_id: unionId },
      _max: { ordre: true }
    })
    const nextOrdre = ordre != null ? parseInt(ordre, 10) : (maxOrdre._max.ordre ?? -1) + 1

    await prisma.enfantUnion.upsert({
      where: {
        union_id_enfant_id: { union_id: unionId, enfant_id: enfantId }
      },
      create: { union_id: unionId, enfant_id: enfantId, ordre: nextOrdre },
      update: { ordre: nextOrdre }
    })

    // Compatibilité : premier parent = premier conjoint
    const premierConjoint = await prisma.unionConjoint.findFirst({
      where: { union_id: unionId },
      orderBy: { ordre: 'asc' }
    })
    if (premierConjoint && !enfant.parent_id) {
      await prisma.membreArbre.update({
        where: { id: enfantId },
        data: { parent_id: premierConjoint.membre_id }
      })
    }

    const updated = await prisma.unionFamiliale.findUnique({
      where: { id: unionId },
      include: unionInclude
    })

    res.json({ succes: true, data: updated })
  } catch (erreur) {
    console.error('Erreur POST enfant union:', erreur)
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

// PUT /api/arbre/unions/:id/enfants/reorder — réordonner les enfants
router.put('/unions/:id/enfants/reorder', verifierToken, async (req, res) => {
  try {
    const unionId = parseInt(req.params.id, 10)
    const { items } = req.body

    const union = await unionDansFamille(unionId, req.utilisateur.famille_id)
    if (!union) {
      return res.status(404).json({ succes: false, message: 'Union introuvable' })
    }

    if (!Array.isArray(items)) {
      return res.status(400).json({ succes: false, message: 'items requis' })
    }

    await prisma.$transaction(
      items.map(({ enfant_id, ordre }) =>
        prisma.enfantUnion.update({
          where: {
            union_id_enfant_id: {
              union_id: unionId,
              enfant_id: parseInt(enfant_id, 10)
            }
          },
          data: { ordre: parseInt(ordre, 10) }
        })
      )
    )

    const updated = await prisma.unionFamiliale.findUnique({
      where: { id: unionId },
      include: unionInclude
    })

    res.json({ succes: true, data: updated })
  } catch (erreur) {
    console.error('Erreur reorder enfants:', erreur)
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

// DELETE /api/arbre/unions/:id/enfants/:enfantId
router.delete('/unions/:id/enfants/:enfantId', verifierToken, async (req, res) => {
  try {
    const unionId = parseInt(req.params.id, 10)
    const enfantId = parseInt(req.params.enfantId, 10)

    const union = await unionDansFamille(unionId, req.utilisateur.famille_id)
    if (!union) {
      return res.status(404).json({ succes: false, message: 'Union introuvable' })
    }

    await prisma.enfantUnion.delete({
      where: { union_id_enfant_id: { union_id: unionId, enfant_id: enfantId } }
    })

    res.json({ succes: true, message: 'Enfant retiré de l\'union' })
  } catch (erreur) {
    console.error('Erreur DELETE enfant union:', erreur)
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

// DELETE /api/arbre/unions/:id
router.delete('/unions/:id', verifierToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    const existing = await unionDansFamille(id, req.utilisateur.famille_id)
    if (!existing) {
      return res.status(404).json({ succes: false, message: 'Union introuvable' })
    }

    await prisma.unionFamiliale.update({
      where: { id },
      data: { is_visible: false }
    })

    res.json({ succes: true, message: 'Union supprimée' })
  } catch (erreur) {
    console.error('Erreur DELETE union:', erreur)
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

// PUT /api/arbre/:id/photo
router.put('/:id/photo', verifierToken, async (req, res) => {
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
      data: { photo_url: photo_url || null },
      include: membreInclude
    })

    res.json({ succes: true, data: membre })
  } catch (erreur) {
    console.error('Erreur photo arbre:', erreur)
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

router.delete('/:id/photo', verifierToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    const existing = await membreDansFamille(id, req.utilisateur.famille_id)
    if (!existing) {
      return res.status(404).json({ succes: false, message: 'Membre introuvable' })
    }

    const membre = await prisma.membreArbre.update({
      where: { id },
      data: { photo_url: null },
      include: membreInclude
    })

    res.json({ succes: true, data: membre })
  } catch (erreur) {
    console.error('Erreur suppression photo arbre:', erreur)
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

// PUT /api/arbre/:id
router.put('/:id', verifierToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    const {
      nom,
      genre,
      type_arbre,
      date_naissance,
      date_deces,
      biographie,
      parent_id,
      photo_url,
      layout_ordre
    } = req.body

    const existing = await membreDansFamille(id, req.utilisateur.famille_id)
    if (!existing) {
      return res.status(404).json({ succes: false, message: 'Membre introuvable' })
    }

    const data = {}
    if (nom) data.nom = nom
    if (genre !== undefined) data.genre = parseGenre(genre)
    if (type_arbre !== undefined) data.type_arbre = parseTypeArbre(type_arbre)
    if (date_naissance !== undefined) data.date_naissance = date_naissance ? new Date(date_naissance) : null
    if (date_deces !== undefined) data.date_deces = date_deces ? new Date(date_deces) : null
    if (biographie !== undefined) data.biographie = biographie
    if (layout_ordre !== undefined) data.layout_ordre = parseInt(layout_ordre, 10)
    if (parent_id !== undefined && parent_id !== '') {
      data.parent_id = parseInt(parent_id, 10)
    } else if (parent_id === '' || parent_id === null) {
      data.parent_id = null
    }

    if (photo_url !== undefined) {
      if (photo_url != null && !isAllowedAvatarUrl(photo_url)) {
        return res.status(400).json({ succes: false, message: 'URL de photo invalide' })
      }
      data.photo_url = photo_url || null
    }

    const membre = await prisma.membreArbre.update({
      where: { id },
      data,
      include: membreInclude
    })

    res.json({ succes: true, data: membre })
  } catch (erreur) {
    console.error('Erreur PUT arbre:', erreur)
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

router.delete('/:id', verifierToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    const existing = await membreDansFamille(id, req.utilisateur.famille_id)
    if (!existing) {
      return res.status(404).json({ succes: false, message: 'Membre introuvable' })
    }

    await prisma.membreArbre.update({
      where: { id },
      data: { is_visible: false }
    })

    res.json({ succes: true, message: 'Membre supprimé' })
  } catch (erreur) {
    console.error('Erreur DELETE arbre:', erreur)
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

module.exports = router

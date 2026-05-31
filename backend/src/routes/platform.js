const express = require('express')
const prisma = require('../lib/prisma')
const { verifierToken } = require('../middleware/auth')
const { exigerEcriture } = require('../middleware/roles')
const { logActivity } = require('../lib/activityLog')
const { souvenirFamilyWhere } = require('../lib/souvenirFamilyWhere')
const { formatSouvenir } = require('../lib/souvenirFormat')
const { runSmartNotificationsForFamille } = require('../lib/smartNotifications')
const { generateSecret, verifyToken: verifyTotp, qrDataUrl } = require('../lib/totp')
const bcrypt = require('bcrypt')
const { estAdmin } = require('../lib/authHelpers')

const router = express.Router()

function peutModifierAuteur(req, auteurId) {
  return auteurId === req.utilisateur.id || estAdmin(req.utilisateur.role)
}

function daysUntilBirthday(dateNaissance) {
  if (!dateNaissance) return null
  const now = new Date()
  const birth = new Date(dateNaissance)
  let next = new Date(now.getFullYear(), birth.getMonth(), birth.getDate())
  if (next < now) next = new Date(now.getFullYear() + 1, birth.getMonth(), birth.getDate())
  return Math.ceil((next - now) / (1000 * 60 * 60 * 24))
}

async function ouvrirCapsulesEchues(familleId) {
  const now = new Date()
  await prisma.capsuleTemporelle.updateMany({
    where: {
      famille_id: familleId,
      ouverte: false,
      date_ouverture: { lte: now },
      is_visible: true
    },
    data: { ouverte: true }
  })
}

// GET /api/platform/accueil
router.get('/accueil', verifierToken, async (req, res) => {
  try {
    const fid = req.utilisateur.famille_id
    runSmartNotificationsForFamille(fid).catch(() => {})
    const whereSouvenir = souvenirFamilyWhere(fid)

    const [souvenirsRecents, albumsRecents, membresArbre, evenements, stats] = await Promise.all([
      prisma.souvenir.findMany({
        where: whereSouvenir,
        include: {
          auteur: { select: { id: true, nom: true, prenom: true, avatar_url: true } },
          reactions: true,
          tags: { include: { tag: true } }
        },
        orderBy: [{ epingle: 'desc' }, { date_souvenir: 'desc' }],
        take: 6
      }),
      prisma.album.findMany({
        where: { famille_id: fid, is_visible: true },
        include: {
          createur: { select: { prenom: true, nom: true } },
          souvenirs: { include: { souvenir: { select: { id: true, titre: true, fichier_url: true } } } }
        },
        orderBy: { updated_at: 'desc' },
        take: 4
      }),
      prisma.membreArbre.findMany({
        where: { famille_id: fid, is_visible: true, date_naissance: { not: null } },
        select: { id: true, nom: true, date_naissance: true, photo_url: true }
      }),
      prisma.evenementFamilial.findMany({
        where: { famille_id: fid, is_visible: true, date_debut: { gte: new Date() } },
        orderBy: { date_debut: 'asc' },
        take: 5
      }),
      Promise.all([
        prisma.souvenir.count({ where: whereSouvenir }),
        prisma.album.count({ where: { famille_id: fid, is_visible: true } }),
        prisma.utilisateur.count({ where: { famille_id: fid, is_active: true } }),
        prisma.commentaire.count({
          where: { souvenir: { famille_id: fid, is_visible: true } }
        })
      ])
    ])

    const anniversaires = membresArbre
      .map((m) => ({
        ...m,
        jours_restants: daysUntilBirthday(m.date_naissance)
      }))
      .filter((m) => m.jours_restants != null && m.jours_restants <= 30)
      .sort((a, b) => a.jours_restants - b.jours_restants)
      .slice(0, 8)

    res.json({
      succes: true,
      data: {
        souvenirsRecents: souvenirsRecents.map(formatSouvenir),
        albumsRecents,
        anniversaires,
        evenements,
        stats: {
          souvenirs: stats[0],
          albums: stats[1],
          membres: stats[2],
          commentaires: stats[3]
        }
      }
    })
  } catch (err) {
    console.error('GET /platform/accueil:', err)
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

// GET /api/platform/albums-auto
router.get('/albums-auto', verifierToken, async (req, res) => {
  try {
    const fid = req.utilisateur.famille_id
    const souvenirs = await prisma.souvenir.findMany({
      where: souvenirFamilyWhere(fid),
      include: {
        auteur: { select: { prenom: true, nom: true } },
        membre_arbre: { select: { id: true, nom: true } },
        tags: { include: { tag: true } }
      },
      orderBy: { date_souvenir: 'desc' }
    })

    const parAnnee = {}
    souvenirs.forEach((s) => {
      const y = new Date(s.date_souvenir).getFullYear()
      if (!parAnnee[y]) parAnnee[y] = []
      parAnnee[y].push(s.id)
    })

    const parPersonne = {}
    souvenirs.forEach((s) => {
      if (!s.membre_arbre_id) return
      const k = s.membre_arbre_id
      if (!parPersonne[k]) parPersonne[k] = { nom: s.membre_arbre?.nom, ids: [] }
      parPersonne[k].ids.push(s.id)
    })

    const favoris = await prisma.favori.findMany({
      where: { utilisateur_id: req.utilisateur.id, souvenir: { famille_id: fid } },
      select: { souvenir_id: true }
    })

    res.json({
      succes: true,
      data: {
        parAnnee: Object.entries(parAnnee)
          .map(([annee, ids]) => ({ annee: Number(annee), count: ids.length, souvenir_ids: ids }))
          .sort((a, b) => b.annee - a.annee),
        parPersonne: Object.entries(parPersonne).map(([id, v]) => ({
          membre_arbre_id: Number(id),
          nom: v.nom,
          count: v.ids.length,
          souvenir_ids: v.ids
        })),
        favoris: favoris.map((f) => f.souvenir_id)
      }
    })
  } catch (err) {
    console.error('GET /platform/albums-auto:', err)
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

// --- Héritage ---
router.get('/heritage', verifierToken, async (req, res) => {
  try {
    const type = req.query.type
    const where = { famille_id: req.utilisateur.famille_id, is_visible: true }
    if (type) where.type = String(type).toUpperCase()
    const items = await prisma.heritageItem.findMany({
      where,
      include: { auteur: { select: { id: true, prenom: true, nom: true, avatar_url: true } } },
      orderBy: { created_at: 'desc' }
    })
    res.json({ succes: true, data: items })
  } catch (err) {
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

router.post('/heritage', verifierToken, exigerEcriture, async (req, res) => {
  try {
    const { type, titre, contenu, media_url, audio_url, video_url, membre_arbre_id } = req.body
    if (!type || !titre) {
      return res.status(400).json({ succes: false, message: 'Type et titre requis' })
    }
    const item = await prisma.heritageItem.create({
      data: {
        famille_id: req.utilisateur.famille_id,
        auteur_id: req.utilisateur.id,
        type: String(type).toUpperCase(),
        titre: String(titre).trim(),
        contenu: contenu || null,
        media_url: media_url || null,
        audio_url: audio_url || null,
        video_url: video_url || null,
        membre_arbre_id: membre_arbre_id ? parseInt(membre_arbre_id) : null
      }
    })
    await logActivity(prisma, {
      utilisateur_id: req.utilisateur.id,
      famille_id: req.utilisateur.famille_id,
      action: 'HERITAGE_CREATE',
      details: { id: item.id, type: item.type }
    })
    res.status(201).json({ succes: true, data: item })
  } catch (err) {
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

router.put('/heritage/:id', verifierToken, exigerEcriture, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    const existant = await prisma.heritageItem.findFirst({
      where: { id, famille_id: req.utilisateur.famille_id, is_visible: true }
    })
    if (!existant) {
      return res.status(404).json({ succes: false, message: 'Élément introuvable' })
    }
    if (!peutModifierAuteur(req, existant.auteur_id)) {
      return res.status(403).json({
        succes: false,
        message: 'Seul l’auteur ou un administrateur peut modifier cet élément'
      })
    }
    const { titre, contenu, media_url, audio_url, video_url } = req.body
    const item = await prisma.heritageItem.update({
      where: { id },
      data: {
        ...(titre != null && { titre: String(titre).trim() }),
        ...(contenu !== undefined && { contenu: contenu || null }),
        ...(media_url !== undefined && { media_url: media_url || null }),
        ...(audio_url !== undefined && { audio_url: audio_url || null }),
        ...(video_url !== undefined && { video_url: video_url || null })
      },
      include: { auteur: { select: { id: true, prenom: true, nom: true, avatar_url: true } } }
    })
    res.json({ succes: true, data: item })
  } catch (err) {
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

router.delete('/heritage/:id', verifierToken, exigerEcriture, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    const existant = await prisma.heritageItem.findFirst({
      where: { id, famille_id: req.utilisateur.famille_id, is_visible: true }
    })
    if (!existant) {
      return res.status(404).json({ succes: false, message: 'Élément introuvable' })
    }
    if (!peutModifierAuteur(req, existant.auteur_id)) {
      return res.status(403).json({
        succes: false,
        message: 'Seul l’auteur ou un administrateur peut supprimer cet élément'
      })
    }
    await prisma.heritageItem.update({
      where: { id },
      data: { is_visible: false }
    })
    res.json({ succes: true })
  } catch (err) {
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

// --- Hommage ---
router.get('/hommage', verifierToken, async (req, res) => {
  try {
    const decedes = await prisma.membreArbre.findMany({
      where: { famille_id: req.utilisateur.famille_id, date_deces: { not: null }, is_visible: true },
      include: {
        hommages: {
          where: { is_visible: true },
          include: { auteur: { select: { id: true, prenom: true, nom: true } } },
          orderBy: { created_at: 'desc' }
        },
        souvenirs: {
          where: { is_visible: true },
          take: 12,
          select: { id: true, titre: true, fichier_url: true, date_souvenir: true }
        }
      },
      orderBy: { date_deces: 'desc' }
    })
    res.json({ succes: true, data: decedes })
  } catch (err) {
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

router.post('/hommage/:membreId/messages', verifierToken, exigerEcriture, async (req, res) => {
  try {
    const membre_arbre_id = parseInt(req.params.membreId, 10)
    const { contenu, type, media_url } = req.body
    if (!contenu?.trim()) {
      return res.status(400).json({ succes: false, message: 'Message requis' })
    }
    const membre = await prisma.membreArbre.findFirst({
      where: { id: membre_arbre_id, famille_id: req.utilisateur.famille_id, is_visible: true }
    })
    if (!membre) {
      return res.status(404).json({ succes: false, message: 'Membre introuvable' })
    }
    const msg = await prisma.hommageMessage.create({
      data: {
        membre_arbre_id,
        auteur_id: req.utilisateur.id,
        contenu: contenu.trim(),
        type: type || 'TEXTE',
        media_url: media_url || null
      },
      include: { auteur: { select: { id: true, prenom: true, nom: true } } }
    })
    res.status(201).json({ succes: true, data: msg })
  } catch (err) {
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

router.put('/hommage/messages/:id', verifierToken, exigerEcriture, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    const { contenu } = req.body
    if (!contenu?.trim()) {
      return res.status(400).json({ succes: false, message: 'Message requis' })
    }
    const msg = await prisma.hommageMessage.findFirst({
      where: {
        id,
        is_visible: true,
        membre: { famille_id: req.utilisateur.famille_id }
      }
    })
    if (!msg) {
      return res.status(404).json({ succes: false, message: 'Témoignage introuvable' })
    }
    if (!peutModifierAuteur(req, msg.auteur_id)) {
      return res.status(403).json({
        succes: false,
        message: 'Seul l’auteur ou un administrateur peut modifier ce témoignage'
      })
    }
    const updated = await prisma.hommageMessage.update({
      where: { id },
      data: { contenu: contenu.trim() },
      include: { auteur: { select: { id: true, prenom: true, nom: true } } }
    })
    res.json({ succes: true, data: updated })
  } catch (err) {
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

router.delete('/hommage/messages/:id', verifierToken, exigerEcriture, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    const msg = await prisma.hommageMessage.findFirst({
      where: {
        id,
        is_visible: true,
        membre: { famille_id: req.utilisateur.famille_id }
      }
    })
    if (!msg) {
      return res.status(404).json({ succes: false, message: 'Témoignage introuvable' })
    }
    if (!peutModifierAuteur(req, msg.auteur_id)) {
      return res.status(403).json({
        succes: false,
        message: 'Seul l’auteur ou un administrateur peut supprimer ce témoignage'
      })
    }
    await prisma.hommageMessage.update({
      where: { id },
      data: { is_visible: false }
    })
    res.json({ succes: true, message: 'Témoignage supprimé' })
  } catch (err) {
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

// --- Capsules ---
router.get('/capsules', verifierToken, async (req, res) => {
  try {
    const fid = req.utilisateur.famille_id
    await ouvrirCapsulesEchues(fid)
    const capsules = await prisma.capsuleTemporelle.findMany({
      where: { famille_id: fid, is_visible: true },
      include: { auteur: { select: { id: true, prenom: true, nom: true } } },
      orderBy: { date_ouverture: 'asc' }
    })
    res.json({ succes: true, data: capsules })
  } catch (err) {
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

router.post('/capsules', verifierToken, exigerEcriture, async (req, res) => {
  try {
    const { titre, message, media_json, date_ouverture } = req.body
    if (!titre || !date_ouverture) {
      return res.status(400).json({ succes: false, message: 'Titre et date d\'ouverture requis' })
    }
    const cap = await prisma.capsuleTemporelle.create({
      data: {
        famille_id: req.utilisateur.famille_id,
        auteur_id: req.utilisateur.id,
        titre: String(titre).trim(),
        message: message || null,
        media_json: media_json ? JSON.stringify(media_json) : null,
        date_ouverture: new Date(date_ouverture)
      }
    })
    await logActivity(prisma, {
      utilisateur_id: req.utilisateur.id,
      famille_id: req.utilisateur.famille_id,
      action: 'CAPSULE_CREATE',
      details: { id: cap.id }
    })
    res.status(201).json({ succes: true, data: cap })
  } catch (err) {
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

router.put('/capsules/:id', verifierToken, exigerEcriture, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    const existant = await prisma.capsuleTemporelle.findFirst({
      where: { id, famille_id: req.utilisateur.famille_id, is_visible: true }
    })
    if (!existant) {
      return res.status(404).json({ succes: false, message: 'Capsule introuvable' })
    }
    if (!peutModifierAuteur(req, existant.auteur_id)) {
      return res.status(403).json({
        succes: false,
        message: 'Seul l’auteur ou un administrateur peut modifier cette capsule'
      })
    }
    if (existant.ouverte) {
      return res.status(400).json({
        succes: false,
        message: 'Une capsule ouverte ne peut plus être modifiée'
      })
    }
    const { titre, message, date_ouverture } = req.body
    const cap = await prisma.capsuleTemporelle.update({
      where: { id },
      data: {
        ...(titre != null && { titre: String(titre).trim() }),
        ...(message !== undefined && { message: message || null }),
        ...(date_ouverture && { date_ouverture: new Date(date_ouverture) })
      },
      include: { auteur: { select: { id: true, prenom: true, nom: true } } }
    })
    res.json({ succes: true, data: cap })
  } catch (err) {
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

router.delete('/capsules/:id', verifierToken, exigerEcriture, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    const existant = await prisma.capsuleTemporelle.findFirst({
      where: { id, famille_id: req.utilisateur.famille_id, is_visible: true }
    })
    if (!existant) {
      return res.status(404).json({ succes: false, message: 'Capsule introuvable' })
    }
    if (!peutModifierAuteur(req, existant.auteur_id)) {
      return res.status(403).json({
        succes: false,
        message: 'Seul l’auteur ou un administrateur peut supprimer cette capsule'
      })
    }
    await prisma.capsuleTemporelle.update({
      where: { id },
      data: { is_visible: false }
    })
    res.json({ succes: true })
  } catch (err) {
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

// --- Événements ---
router.get('/evenements', verifierToken, async (req, res) => {
  try {
    const events = await prisma.evenementFamilial.findMany({
      where: { famille_id: req.utilisateur.famille_id, is_visible: true },
      include: { auteur: { select: { id: true, prenom: true, nom: true } } },
      orderBy: { date_debut: 'asc' }
    })
    res.json({ succes: true, data: events })
  } catch (err) {
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

router.post('/evenements', verifierToken, exigerEcriture, async (req, res) => {
  try {
    const { titre, description, type, date_debut, date_fin, lieu, latitude, longitude } = req.body
    if (!titre || !date_debut) {
      return res.status(400).json({ succes: false, message: 'Titre et date requis' })
    }
    const ev = await prisma.evenementFamilial.create({
      data: {
        famille_id: req.utilisateur.famille_id,
        auteur_id: req.utilisateur.id,
        titre: String(titre).trim(),
        description: description || null,
        type: type || 'AUTRE',
        date_debut: new Date(date_debut),
        date_fin: date_fin ? new Date(date_fin) : null,
        lieu: lieu || null,
        latitude: latitude != null ? Number(latitude) : null,
        longitude: longitude != null ? Number(longitude) : null
      }
    })
    res.status(201).json({ succes: true, data: ev })
  } catch (err) {
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

router.put('/evenements/:id', verifierToken, exigerEcriture, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    const existant = await prisma.evenementFamilial.findFirst({
      where: { id, famille_id: req.utilisateur.famille_id, is_visible: true }
    })
    if (!existant) {
      return res.status(404).json({ succes: false, message: 'Événement introuvable' })
    }
    if (!peutModifierAuteur(req, existant.auteur_id)) {
      return res.status(403).json({
        succes: false,
        message: 'Seul l’auteur ou un administrateur peut modifier cet événement'
      })
    }
    const { titre, description, type, date_debut, date_fin, lieu } = req.body
    const ev = await prisma.evenementFamilial.update({
      where: { id },
      data: {
        ...(titre != null && { titre: String(titre).trim() }),
        ...(description !== undefined && { description: description || null }),
        ...(type != null && { type: String(type) }),
        ...(date_debut && { date_debut: new Date(date_debut) }),
        ...(date_fin !== undefined && { date_fin: date_fin ? new Date(date_fin) : null }),
        ...(lieu !== undefined && { lieu: lieu || null })
      },
      include: { auteur: { select: { id: true, prenom: true, nom: true } } }
    })
    res.json({ succes: true, data: ev })
  } catch (err) {
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

router.delete('/evenements/:id', verifierToken, exigerEcriture, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    const existant = await prisma.evenementFamilial.findFirst({
      where: { id, famille_id: req.utilisateur.famille_id, is_visible: true }
    })
    if (!existant) {
      return res.status(404).json({ succes: false, message: 'Événement introuvable' })
    }
    if (!peutModifierAuteur(req, existant.auteur_id)) {
      return res.status(403).json({
        succes: false,
        message: 'Seul l’auteur ou un administrateur peut supprimer cet événement'
      })
    }
    await prisma.evenementFamilial.update({
      where: { id },
      data: { is_visible: false }
    })
    res.json({ succes: true })
  } catch (err) {
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

// --- Timeline ---
router.get('/timeline', verifierToken, async (req, res) => {
  try {
    const fid = req.utilisateur.famille_id
    const [membres, evenements, souvenirs, unions] = await Promise.all([
      prisma.membreArbre.findMany({
        where: { famille_id: fid, is_visible: true },
        select: { id: true, nom: true, date_naissance: true, date_deces: true, photo_url: true }
      }),
      prisma.evenementFamilial.findMany({
        where: { famille_id: fid, is_visible: true },
        select: {
          id: true,
          titre: true,
          type: true,
          date_debut: true,
          lieu: true,
          auteur_id: true,
          auteur: { select: { id: true, prenom: true, nom: true } }
        }
      }),
      prisma.souvenir.findMany({
        where: { ...souvenirFamilyWhere(fid), epingle: true },
        select: { id: true, titre: true, date_souvenir: true, type: true },
        take: 50,
        orderBy: { date_souvenir: 'desc' }
      }),
      prisma.unionFamiliale.findMany({
        where: { famille_id: fid, is_visible: true, date_debut: { not: null } },
        select: { id: true, date_debut: true }
      })
    ])

    const events = []
    membres.forEach((m) => {
      if (m.date_naissance) {
        events.push({
          kind: 'NAISSANCE',
          date: m.date_naissance,
          titre: `Naissance de ${m.nom}`,
          ref_id: m.id
        })
      }
      if (m.date_deces) {
        events.push({
          kind: 'DECES',
          date: m.date_deces,
          titre: `${m.nom}`,
          ref_id: m.id
        })
      }
    })
    evenements.forEach((e) => {
      events.push({
        kind: e.type || 'EVENEMENT',
        source: 'evenement',
        date: e.date_debut,
        titre: e.titre,
        lieu: e.lieu,
        ref_id: e.id,
        auteur_id: e.auteur_id,
        auteur: e.auteur
      })
    })
    souvenirs.forEach((s) => {
      events.push({
        kind: 'SOUVENIR',
        date: s.date_souvenir,
        titre: s.titre,
        ref_id: s.id
      })
    })
    unions.forEach((u) => {
      events.push({
        kind: 'MARIAGE',
        date: u.date_debut,
        titre: 'Union familiale',
        ref_id: u.id
      })
    })

    events.sort((a, b) => new Date(b.date) - new Date(a.date))

    res.json({ succes: true, data: events })
  } catch (err) {
    console.error('GET /platform/timeline:', err)
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

// --- Carte ---
router.get('/carte', verifierToken, async (req, res) => {
  try {
    const fid = req.utilisateur.famille_id
    const [users, membres, souvenirs] = await Promise.all([
      prisma.utilisateur.findMany({
        where: { famille_id: fid, is_active: true },
        select: {
          id: true,
          prenom: true,
          nom: true,
          ville_actuelle: true,
          lieu_naissance: true,
          latitude: true,
          longitude: true,
          lat_naissance: true,
          lng_naissance: true,
          avatar_url: true
        }
      }),
      prisma.membreArbre.findMany({
        where: { famille_id: fid, is_visible: true },
        select: {
          id: true,
          nom: true,
          ville_actuelle: true,
          lieu_naissance: true,
          latitude: true,
          longitude: true,
          lat_naissance: true,
          lng_naissance: true,
          photo_url: true
        }
      }),
      prisma.souvenir.findMany({
        where: {
          ...souvenirFamilyWhere(fid),
          OR: [{ latitude: { not: null } }, { longitude: { not: null } }, { lieu: { not: null } }]
        },
        select: { id: true, titre: true, lieu: true, latitude: true, longitude: true, date_souvenir: true },
        take: 100
      })
    ])

    const points = []
    users.forEach((u) => {
      if (u.latitude != null && u.longitude != null) {
        points.push({
          kind: 'membre',
          label: `${u.prenom} ${u.nom}`,
          lat: u.latitude,
          lng: u.longitude,
          ville: u.ville_actuelle
        })
      }
      if (u.lat_naissance != null && u.lng_naissance != null) {
        points.push({
          kind: 'naissance',
          label: `Naissance — ${u.prenom}`,
          lat: u.lat_naissance,
          lng: u.lng_naissance,
          ville: u.lieu_naissance
        })
      }
    })
    membres.forEach((m) => {
      if (m.latitude != null && m.longitude != null) {
        points.push({ kind: 'arbre', label: m.nom, lat: m.latitude, lng: m.longitude, ville: m.ville_actuelle })
      }
    })
    souvenirs.forEach((s) => {
      if (s.latitude != null && s.longitude != null) {
        points.push({ kind: 'souvenir', label: s.titre, lat: s.latitude, lng: s.longitude, lieu: s.lieu })
      } else if (s.lieu) {
        points.push({ kind: 'souvenir', label: s.titre, lieu: s.lieu, lat: null, lng: null })
      }
    })

    res.json({ succes: true, data: { points, users, membres, souvenirs } })
  } catch (err) {
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

// --- Livre familial (données) ---
router.get('/livre', verifierToken, async (req, res) => {
  try {
    const fid = req.utilisateur.famille_id
    const famille = await prisma.famille.findUnique({ where: { id: fid } })
    const [souvenirs, membres, heritage] = await Promise.all([
      prisma.souvenir.findMany({
        where: souvenirFamilyWhere(fid),
        include: { auteur: { select: { prenom: true, nom: true } } },
        orderBy: { date_souvenir: 'asc' },
        take: 80
      }),
      prisma.membreArbre.findMany({
        where: { famille_id: fid, is_visible: true },
        select: { id: true, nom: true, date_naissance: true, biographie: true, photo_url: true }
      }),
      prisma.heritageItem.findMany({
        where: { famille_id: fid, is_visible: true },
        take: 30,
        orderBy: { created_at: 'desc' }
      })
    ])
    res.json({
      succes: true,
      data: {
        famille: { nom: famille?.nom, description: famille?.description },
        souvenirs: souvenirs.map(formatSouvenir),
        membres,
        heritage,
        generatedAt: new Date().toISOString()
      }
    })
  } catch (err) {
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

router.get('/livres', verifierToken, async (req, res) => {
  try {
    const livres = await prisma.livreFamilial.findMany({
      where: { famille_id: req.utilisateur.famille_id, is_visible: true },
      include: { auteur: { select: { id: true, prenom: true, nom: true } } },
      orderBy: { created_at: 'desc' }
    })
    res.json({
      succes: true,
      data: livres.map((l) => ({
        id: l.id,
        titre: l.titre,
        created_at: l.created_at,
        auteur: l.auteur,
        snapshot: JSON.parse(l.snapshot_json)
      }))
    })
  } catch (err) {
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

router.post('/livres', verifierToken, exigerEcriture, async (req, res) => {
  try {
    const { titre, snapshot } = req.body
    if (!snapshot || typeof snapshot !== 'object') {
      return res.status(400).json({ succes: false, message: 'Contenu du livre requis' })
    }
    const livre = await prisma.livreFamilial.create({
      data: {
        famille_id: req.utilisateur.famille_id,
        auteur_id: req.utilisateur.id,
        titre: String(titre || `Livre du ${new Date().toLocaleDateString('fr-FR')}`).trim(),
        snapshot_json: JSON.stringify(snapshot)
      },
      include: { auteur: { select: { id: true, prenom: true, nom: true } } }
    })
    res.status(201).json({
      succes: true,
      data: {
        id: livre.id,
        titre: livre.titre,
        created_at: livre.created_at,
        auteur: livre.auteur,
        snapshot
      }
    })
  } catch (err) {
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

router.delete('/livres/:id', verifierToken, exigerEcriture, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    const existant = await prisma.livreFamilial.findFirst({
      where: { id, famille_id: req.utilisateur.famille_id, is_visible: true }
    })
    if (!existant) {
      return res.status(404).json({ succes: false, message: 'Livre introuvable' })
    }
    if (!peutModifierAuteur(req, existant.auteur_id)) {
      return res.status(403).json({
        succes: false,
        message: 'Seul l’auteur ou un administrateur peut supprimer ce livre'
      })
    }
    await prisma.livreFamilial.update({
      where: { id },
      data: { is_visible: false }
    })
    res.json({ succes: true, message: 'Livre supprimé' })
  } catch (err) {
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

// --- Profil étendu / chronologie ---
router.get('/profil/:userId', verifierToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId)
    const user = await prisma.utilisateur.findFirst({
      where: { id: userId, famille_id: req.utilisateur.famille_id, is_active: true },
      select: {
        id: true,
        nom: true,
        prenom: true,
        biographie: true,
        interets: true,
        parcours_scolaire: true,
        parcours_professionnel: true,
        metier_actuel: true,
        activite_actuelle: true,
        description_metier: true,
        avatar_url: true,
        couverture_url: true,
        ville_actuelle: true,
        lieu_naissance: true,
        created_at: true
      }
    })
    if (!user) return res.status(404).json({ succes: false, message: 'Membre introuvable' })

    const souvenirs = await prisma.souvenir.findMany({
      where: { auteur_id: userId, ...souvenirFamilyWhere(req.utilisateur.famille_id) },
      orderBy: { date_souvenir: 'desc' },
      take: 24,
      include: { tags: { include: { tag: true } } }
    })

    res.json({
      succes: true,
      data: {
        ...user,
        interets: user.interets ? JSON.parse(user.interets) : [],
        souvenirs: souvenirs.map(formatSouvenir),
        galerie: souvenirs.filter((s) => s.type === 'PHOTO').slice(0, 12)
      }
    })
  } catch (err) {
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

// --- IA (suggestions basiques) ---
router.post('/ai/suggest-tags', verifierToken, async (req, res) => {
  try {
    const { titre = '', description = '' } = req.body
    const text = `${titre} ${description}`.toLowerCase()
    const pool = [
      'famille',
      'vacances',
      'mariage',
      'anniversaire',
      'tradition',
      'recette',
      'voyage',
      'enfance',
      'hommage',
      'fête',
      'noël',
      'école',
      'diplôme',
      'photo',
      'souvenir'
    ]
    const tags = pool.filter((w) => text.includes(w.slice(0, 4)) || text.includes(w))
    const extra = text
      .split(/\W+/)
      .filter((w) => w.length > 4)
      .slice(0, 5)
    res.json({ succes: true, data: { tags: [...new Set([...tags, ...extra])].slice(0, 8) } })
  } catch (err) {
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

router.post('/ai/summarize', verifierToken, async (req, res) => {
  try {
    const { text = '' } = req.body
    const words = String(text).trim().split(/\s+/)
    const summary =
      words.length <= 30 ? text : `${words.slice(0, 25).join(' ')}… (${words.length} mots)`
    res.json({ succes: true, data: { summary } })
  } catch (err) {
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

// --- Recherche avancée ---
router.get('/search', verifierToken, async (req, res) => {
  try {
    const fid = req.utilisateur.famille_id
    const {
      q,
      type,
      tag,
      lieu,
      auteur_id,
      membre_arbre_id,
      dateDebut,
      dateFin,
      epingle
    } = req.query

    const where = { ...souvenirFamilyWhere(fid, req.utilisateur.role) }

    if (type && type !== 'TOUS') where.type = String(type)
    if (lieu) where.lieu = { contains: String(lieu) }
    if (auteur_id) where.auteur_id = parseInt(auteur_id, 10)
    if (membre_arbre_id) where.membre_arbre_id = parseInt(membre_arbre_id, 10)
    if (epingle === 'true') where.epingle = true
    if (dateDebut || dateFin) {
      where.date_souvenir = {}
      if (dateDebut) where.date_souvenir.gte = new Date(dateDebut)
      if (dateFin) {
        const fin = new Date(dateFin)
        fin.setHours(23, 59, 59, 999)
        where.date_souvenir.lte = fin
      }
    }
    if (tag) {
      where.tags = { some: { tag: { libelle: { contains: String(tag) } } } }
    }
    if (q?.trim()) {
      const search = String(q).trim()
      where.OR = [
        { titre: { contains: search } },
        { description: { contains: search } },
        { lieu: { contains: search } },
        { categorie: { contains: search } },
        { auteur: { prenom: { contains: search } } },
        { auteur: { nom: { contains: search } } }
      ]
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 40))
    const skip = (page - 1) * limit

    const [souvenirs, total] = await Promise.all([
      prisma.souvenir.findMany({
        where,
        include: {
          auteur: { select: { id: true, nom: true, prenom: true, avatar_url: true } },
          reactions: true,
          tags: { include: { tag: true } },
          membre_arbre: { select: { id: true, nom: true } }
        },
        orderBy: [{ epingle: 'desc' }, { date_souvenir: 'desc' }],
        skip,
        take: limit
      }),
      prisma.souvenir.count({ where })
    ])

    res.json({
      succes: true,
      data: souvenirs.map(formatSouvenir),
      pagination: { page, limit, total, hasMore: skip + souvenirs.length < total }
    })
  } catch (err) {
    console.error('GET /platform/search:', err)
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

// --- IA recherche conversationnelle ---
router.post('/ai/ask', verifierToken, async (req, res) => {
  try {
    const { question = '' } = req.body
    const q = String(question).toLowerCase().trim()
    if (!q) {
      return res.status(400).json({ succes: false, message: 'Question requise' })
    }

    const souvenirs = await prisma.souvenir.findMany({
      where: souvenirFamilyWhere(req.utilisateur.famille_id, req.utilisateur.role),
      include: {
        auteur: { select: { prenom: true, nom: true } },
        tags: { include: { tag: true } }
      },
      orderBy: { date_souvenir: 'desc' },
      take: 200
    })

    const tokens = q.split(/\W+/).filter((w) => w.length > 2)
    const scored = souvenirs
      .map((s) => {
        const hay = `${s.titre} ${s.description || ''} ${s.lieu || ''} ${s.auteur?.prenom || ''} ${s.tags?.map((t) => t.tag?.libelle).join(' ') || ''}`.toLowerCase()
        let score = 0
        tokens.forEach((t) => {
          if (hay.includes(t)) score += 1
        })
        return { s, score }
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)

    const answer =
      scored.length === 0
        ? 'Je n’ai trouvé aucun souvenir correspondant. Essayez d’autres mots (lieu, prénom, année…).'
        : `J’ai trouvé ${scored.length} souvenir(s) lié(s) à votre question : ${scored.map((x) => `« ${x.s.titre} »`).join(', ')}.`

    res.json({
      succes: true,
      data: {
        answer,
        results: scored.map((x) => formatSouvenir(x.s))
      }
    })
  } catch (err) {
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

// --- Sécurité ---
router.get('/journal', verifierToken, async (req, res) => {
  try {
    const logs = await prisma.journalActivite.findMany({
      where: { famille_id: req.utilisateur.famille_id },
      include: { utilisateur: { select: { prenom: true, nom: true } } },
      orderBy: { created_at: 'desc' },
      take: 100
    })
    res.json({ succes: true, data: logs })
  } catch (err) {
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

router.get('/securite/2fa', verifierToken, async (req, res) => {
  try {
    const u = await prisma.utilisateur.findUnique({
      where: { id: req.utilisateur.id },
      select: { totp_enabled: true }
    })
    res.json({
      succes: true,
      data: { enabled: u?.totp_enabled || false, setupAvailable: true }
    })
  } catch (err) {
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

router.post('/securite/2fa/setup', verifierToken, async (req, res) => {
  try {
    const u = await prisma.utilisateur.findUnique({
      where: { id: req.utilisateur.id },
      select: { email: true, totp_enabled: true }
    })
    if (u?.totp_enabled) {
      return res.status(400).json({ succes: false, message: '2FA déjà activée' })
    }
    const secret = generateSecret(u.email)
    await prisma.utilisateur.update({
      where: { id: req.utilisateur.id },
      data: { totp_secret: secret.base32, totp_enabled: false }
    })
    const qr = await qrDataUrl(secret.otpauth_url)
    res.json({
      succes: true,
      data: { qrDataUrl: qr, secret: secret.base32, otpauthUrl: secret.otpauth_url }
    })
  } catch (err) {
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

router.post('/securite/2fa/confirm', verifierToken, async (req, res) => {
  try {
    const { code } = req.body
    const u = await prisma.utilisateur.findUnique({
      where: { id: req.utilisateur.id },
      select: { totp_secret: true, totp_enabled: true }
    })
    if (!u?.totp_secret || u.totp_enabled) {
      return res.status(400).json({ succes: false, message: 'Configuration 2FA invalide' })
    }
    if (!verifyTotp(u.totp_secret, code)) {
      return res.status(400).json({ succes: false, message: 'Code incorrect — réessayez' })
    }
    await prisma.utilisateur.update({
      where: { id: req.utilisateur.id },
      data: { totp_enabled: true }
    })
    await logActivity(prisma, {
      utilisateur_id: req.utilisateur.id,
      famille_id: req.utilisateur.famille_id,
      action: '2FA_ENABLE'
    })
    res.json({ succes: true, message: 'Authentification à deux facteurs activée' })
  } catch (err) {
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

router.post('/securite/2fa/disable', verifierToken, async (req, res) => {
  try {
    const { code, password } = req.body
    const u = await prisma.utilisateur.findUnique({ where: { id: req.utilisateur.id } })
    if (!u?.totp_enabled) {
      return res.status(400).json({ succes: false, message: '2FA non activée' })
    }
    const pwdOk = await bcrypt.compare(password || '', u.password)
    if (!pwdOk) {
      return res.status(401).json({ succes: false, message: 'Mot de passe incorrect' })
    }
    if (!verifyTotp(u.totp_secret, code)) {
      return res.status(400).json({ succes: false, message: 'Code 2FA incorrect' })
    }
    await prisma.utilisateur.update({
      where: { id: req.utilisateur.id },
      data: { totp_enabled: false, totp_secret: null }
    })
    res.json({ succes: true, message: '2FA désactivée' })
  } catch (err) {
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

router.get('/notifications/prefs', verifierToken, async (req, res) => {
  try {
    const prefs = await prisma.notificationPreference.findMany({
      where: { utilisateur_id: req.utilisateur.id }
    })
    res.json({ succes: true, data: prefs })
  } catch (err) {
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

router.put('/notifications/prefs', verifierToken, async (req, res) => {
  try {
    const { prefs } = req.body
    if (!Array.isArray(prefs)) {
      return res.status(400).json({ succes: false, message: 'Format invalide' })
    }
    for (const p of prefs) {
      await prisma.notificationPreference.upsert({
        where: {
          utilisateur_id_type: { utilisateur_id: req.utilisateur.id, type: p.type }
        },
        create: { utilisateur_id: req.utilisateur.id, type: p.type, enabled: !!p.enabled },
        update: { enabled: !!p.enabled }
      })
    }
    res.json({ succes: true })
  } catch (err) {
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

module.exports = router

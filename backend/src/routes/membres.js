const express = require('express')
const bcrypt = require('bcrypt')
const prisma = require('../lib/prisma')
const { verifierToken } = require('../middleware/auth')
const { creerNotification } = require('./notifications')
const { estAdmin } = require('../lib/authHelpers')
const { serializeUtilisateur, isAllowedAvatarUrl } = require('../lib/serializeUtilisateur')
const { buildRegisterInviteUrl } = require('../lib/frontendUrl')
const { upload, collectUploadedFiles } = require('../middleware/multerMedia')
const { uploadOneFile } = require('../services/mediaStorage')

const router = express.Router()

function optionalText(value, maxLen) {
  if (value === undefined) return undefined
  const s = String(value || '').trim()
  return s.length ? s.slice(0, maxLen) : null
}

const profilSelect = {
  id: true,
  nom: true,
  prenom: true,
  email: true,
  role: true,
  famille_id: true,
  avatar_url: true,
  biographie: true,
  interets: true,
  parcours_scolaire: true,
  parcours_professionnel: true,
  metier_actuel: true,
  activite_actuelle: true,
  description_metier: true,
  langues: true,
  telephone: true,
  date_naissance: true,
  lieu_vie: true,
  formations_competences: true,
  nom_complet: true,
  reseaux_sociaux: true,
  lieu_residence_ancien: true,
  place_famille: true,
  relations_famille: true,
  filiation: true,
  diplome_bac: true,
  ville_actuelle: true,
  lieu_naissance: true,
  latitude: true,
  longitude: true,
  lat_naissance: true,
  lng_naissance: true,
  couverture_url: true,
  theme_pref: true,
  confort_mode: true,
  totp_enabled: true,
  derniere_connexion: true
}

// GET /api/membres/code-invitation — code à partager (tous les membres)
router.get('/code-invitation', verifierToken, async (req, res) => {
  try {
    const famille = await prisma.famille.findUnique({
      where: { id: req.utilisateur.famille_id },
      select: { nom: true, code_invitation: true }
    })
    if (!famille) {
      return res.status(404).json({ succes: false, message: 'Famille introuvable' })
    }
    res.json({
      succes: true,
      data: {
        nom: famille.nom,
        code: famille.code_invitation,
        lien: buildRegisterInviteUrl({ code: famille.code_invitation })
      }
    })
  } catch (erreur) {
    console.error('Erreur code invitation:', erreur)
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

// GET /api/membres - Liste tous les membres de la famille
router.get('/', verifierToken, async (req, res) => {
  try {
    const membres = await prisma.utilisateur.findMany({
      where: {
        famille_id: req.utilisateur.famille_id,
        is_active: true
      },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        role: true,
        is_active: true,
        derniere_connexion: true,
        avatar_url: true,
        biographie: true,
        metier_actuel: true,
        activite_actuelle: true,
        parcours_scolaire: true,
        parcours_professionnel: true,
        description_metier: true,
        langues: true,
        telephone: true,
        date_naissance: true,
        lieu_vie: true,
        formations_competences: true,
        ville_actuelle: true,
        lieu_naissance: true,
        nom_complet: true,
        reseaux_sociaux: true,
        lieu_residence_ancien: true,
        place_famille: true,
        relations_famille: true,
        filiation: true,
        diplome_bac: true,
        interets: true
      },
      orderBy: { created_at: 'asc' }
    })

    const data = membres.map((m) => {
      const base = serializeUtilisateur(m)
      return { ...m, ...base, interets: base.interets, langues: base.langues }
    })

    res.json({ succes: true, data })
  } catch (erreur) {
    console.error('Erreur GET membres:', erreur)
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

// PUT /api/membres/me — profil (nom, prénom, bio, email)
router.put('/me', verifierToken, async (req, res) => {
  try {
    const {
      nom,
      prenom,
      biographie,
      email,
      avatar_url,
      interets,
      ville_actuelle,
      lieu_naissance,
      latitude,
      longitude,
      lat_naissance,
      lng_naissance,
      couverture_url,
      theme_pref,
      confort_mode,
      parcours_scolaire,
      parcours_professionnel,
      metier_actuel,
      activite_actuelle,
      description_metier,
      langues,
      telephone,
      date_naissance,
      lieu_vie,
      formations_competences,
      nom_complet,
      reseaux_sociaux,
      lieu_residence_ancien,
      place_famille,
      relations_famille,
      filiation,
      diplome_bac
    } = req.body
    const data = {}

    if (nom != null && String(nom).trim()) data.nom = String(nom).trim()
    if (prenom != null && String(prenom).trim()) data.prenom = String(prenom).trim()
    if (avatar_url !== undefined) {
      if (avatar_url != null && !isAllowedAvatarUrl(avatar_url)) {
        return res.status(400).json({
          succes: false,
          message: 'URL de photo invalide'
        })
      }
      data.avatar_url = avatar_url || null
    }
    if (biographie !== undefined) {
      const bio = String(biographie || '').trim()
      data.biographie = bio.length ? bio.slice(0, 2000) : null
    }
    if (interets !== undefined) {
      const list = Array.isArray(interets) ? interets : String(interets || '').split(',').map((s) => s.trim()).filter(Boolean)
      data.interets = list.length ? JSON.stringify(list.slice(0, 20)) : null
    }
    if (ville_actuelle !== undefined) data.ville_actuelle = ville_actuelle ? String(ville_actuelle).slice(0, 120) : null
    if (lieu_naissance !== undefined) data.lieu_naissance = lieu_naissance ? String(lieu_naissance).slice(0, 120) : null
    if (latitude !== undefined) data.latitude = latitude != null && latitude !== '' ? Number(latitude) : null
    if (longitude !== undefined) data.longitude = longitude != null && longitude !== '' ? Number(longitude) : null
    if (lat_naissance !== undefined) data.lat_naissance = lat_naissance != null && lat_naissance !== '' ? Number(lat_naissance) : null
    if (lng_naissance !== undefined) data.lng_naissance = lng_naissance != null && lng_naissance !== '' ? Number(lng_naissance) : null
    if (couverture_url !== undefined) data.couverture_url = couverture_url || null
    if (theme_pref !== undefined) data.theme_pref = theme_pref || 'heritage'
    if (confort_mode !== undefined) data.confort_mode = !!confort_mode
    if (parcours_scolaire !== undefined) data.parcours_scolaire = optionalText(parcours_scolaire, 4000)
    if (parcours_professionnel !== undefined) {
      data.parcours_professionnel = optionalText(parcours_professionnel, 4000)
    }
    if (metier_actuel !== undefined) data.metier_actuel = optionalText(metier_actuel, 200)
    if (activite_actuelle !== undefined) data.activite_actuelle = optionalText(activite_actuelle, 2000)
    if (description_metier !== undefined) data.description_metier = optionalText(description_metier, 3000)
    if (langues !== undefined) {
      const list = Array.isArray(langues)
        ? langues
        : String(langues || '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
      data.langues = list.length ? JSON.stringify(list.slice(0, 15)) : null
    }
    if (telephone !== undefined) data.telephone = optionalText(telephone, 30)
    if (date_naissance !== undefined) {
      data.date_naissance =
        date_naissance != null && String(date_naissance).trim()
          ? new Date(String(date_naissance).trim())
          : null
    }
    if (lieu_vie !== undefined) data.lieu_vie = optionalText(lieu_vie, 500)
    if (formations_competences !== undefined) {
      data.formations_competences = optionalText(formations_competences, 3000)
    }
    if (nom_complet !== undefined) data.nom_complet = optionalText(nom_complet, 200)
    if (lieu_residence_ancien !== undefined) {
      data.lieu_residence_ancien = optionalText(lieu_residence_ancien, 500)
    }
    if (place_famille !== undefined) data.place_famille = optionalText(place_famille, 500)
    if (relations_famille !== undefined) {
      data.relations_famille = optionalText(relations_famille, 2000)
    }
    if (filiation !== undefined) data.filiation = optionalText(filiation, 2000)
    if (diplome_bac !== undefined) data.diplome_bac = optionalText(diplome_bac, 2000)
    if (reseaux_sociaux !== undefined) {
      let obj = reseaux_sociaux
      if (typeof obj === 'string') {
        try {
          obj = JSON.parse(obj)
        } catch {
          obj = {}
        }
      }
      if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
        const clean = {}
        for (const [k, v] of Object.entries(obj)) {
          const s = String(v || '').trim()
          if (s) clean[k] = s.slice(0, 500)
        }
        data.reseaux_sociaux = Object.keys(clean).length ? JSON.stringify(clean) : null
      } else {
        data.reseaux_sociaux = null
      }
    }

    if (email != null) {
      const emailNorm = String(email).trim().toLowerCase()
      if (!emailNorm.includes('@')) {
        return res.status(400).json({ succes: false, message: 'Email invalide' })
      }
      const pris = await prisma.utilisateur.findFirst({
        where: { email: emailNorm, id: { not: req.utilisateur.id } }
      })
      if (pris) {
        return res.status(400).json({ succes: false, message: 'Cet email est déjà utilisé' })
      }
      data.email = emailNorm
    }

    if (!Object.keys(data).length) {
      return res.status(400).json({ succes: false, message: 'Aucune modification' })
    }

    let updated
    try {
      updated = await prisma.utilisateur.update({
        where: { id: req.utilisateur.id },
        data,
        select: profilSelect
      })
    } catch (err) {
      if (data.biographie !== undefined && /biographie|Unknown arg/i.test(err.message)) {
        delete data.biographie
        if (!Object.keys(data).length) {
          return res.status(400).json({
            succes: false,
            message: 'Biographie non disponible — redéployez l’API Railway'
          })
        }
        updated = await prisma.utilisateur.update({
          where: { id: req.utilisateur.id },
          data,
          select: profilSelect
        })
      } else {
        throw err
      }
    }

    const famille = await prisma.famille.findUnique({
      where: { id: updated.famille_id },
      select: { nom: true }
    })

    res.json({
      succes: true,
      data: serializeUtilisateur(updated, famille?.nom)
    })
  } catch (erreur) {
    console.error('Erreur PUT /me:', erreur)
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

// PUT /api/membres/me/password
router.put('/me/password', verifierToken, async (req, res) => {
  try {
    const { current_password, new_password } = req.body
    if (!current_password || !new_password) {
      return res.status(400).json({
        succes: false,
        message: 'Mot de passe actuel et nouveau requis'
      })
    }
    if (String(new_password).length < 6) {
      return res.status(400).json({
        succes: false,
        message: 'Le nouveau mot de passe doit faire au moins 6 caractères'
      })
    }

    const user = await prisma.utilisateur.findUnique({
      where: { id: req.utilisateur.id }
    })
    const ok = await bcrypt.compare(current_password, user.password)
    if (!ok) {
      return res.status(403).json({ succes: false, message: 'Mot de passe actuel incorrect' })
    }

    const hash = await bcrypt.hash(new_password, 10)
    await prisma.utilisateur.update({
      where: { id: req.utilisateur.id },
      data: { password: hash }
    })

    res.json({ succes: true, message: 'Mot de passe mis à jour' })
  } catch (erreur) {
    console.error('Erreur mot de passe:', erreur)
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

// POST /api/membres/me/avatar — envoi fichier (multipart, champ « file »)
router.post('/me/avatar', verifierToken, (req, res) => {
  upload.single('file')(req, res, async (multerErr) => {
    if (multerErr) {
      return res.status(400).json({
        succes: false,
        message: multerErr.message || 'Fichier invalide (max 50 Mo)'
      })
    }

    const files = collectUploadedFiles(req)
    if (files.length === 0) {
      return res.status(400).json({
        succes: false,
        message: 'Aucune image reçue (champ: file)'
      })
    }

    const file = files[0]
    const isImage =
      file.mimetype?.startsWith('image/') ||
      /\.(jpe?g|png|gif|webp|heic|bmp)$/i.test(file.originalname || '')

    if (!isImage) {
      return res.status(400).json({
        succes: false,
        message: 'Choisissez une image (JPG, PNG, WebP…)'
      })
    }

    try {
      const avatar_url = await uploadOneFile(file, { folder: 'memory_haven/avatars' })
      if (!isAllowedAvatarUrl(avatar_url)) {
        return res.status(400).json({
          succes: false,
          message: 'URL de photo invalide après upload'
        })
      }

      const updated = await prisma.utilisateur.update({
        where: { id: req.utilisateur.id },
        data: { avatar_url },
        select: profilSelect
      })
      const famille = await prisma.famille.findUnique({
        where: { id: updated.famille_id },
        select: { nom: true }
      })
      res.json({ succes: true, data: serializeUtilisateur(updated, famille?.nom) })
    } catch (erreur) {
      console.error('Erreur POST /me/avatar:', erreur)
      res.status(erreur.status || 500).json({
        succes: false,
        message: erreur.message || 'Erreur lors de l’envoi de la photo'
      })
    }
  })
})

// PUT /api/membres/me/avatar — photo de profil (URL Cloudinary déjà uploadée)
router.put('/me/avatar', verifierToken, async (req, res) => {
  try {
    const { avatar_url } = req.body
    if (avatar_url != null && !isAllowedAvatarUrl(avatar_url)) {
      return res.status(400).json({
        succes: false,
        message: 'URL de photo invalide'
      })
    }

    const updated = await prisma.utilisateur.update({
      where: { id: req.utilisateur.id },
      data: { avatar_url: avatar_url || null },
      select: profilSelect
    })

    const famille = await prisma.famille.findUnique({
      where: { id: updated.famille_id },
      select: { nom: true }
    })
    res.json({ succes: true, data: serializeUtilisateur(updated, famille?.nom) })
  } catch (erreur) {
    console.error('Erreur avatar:', erreur)
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

// DELETE /api/membres/me/avatar — supprimer la photo
router.delete('/me/avatar', verifierToken, async (req, res) => {
  try {
    const updated = await prisma.utilisateur.update({
      where: { id: req.utilisateur.id },
      data: { avatar_url: null },
      select: profilSelect
    })
    const famille = await prisma.famille.findUnique({
      where: { id: updated.famille_id },
      select: { nom: true }
    })
    res.json({ succes: true, data: serializeUtilisateur(updated, famille?.nom) })
  } catch (erreur) {
    console.error('Erreur suppression avatar:', erreur)
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

// GET /api/membres/:id — fiche complète d'un membre de la famille
router.get('/:id', verifierToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (!Number.isFinite(id)) {
      return res.status(400).json({ succes: false, message: 'Identifiant invalide' })
    }

    const membre = await prisma.utilisateur.findFirst({
      where: {
        id,
        famille_id: req.utilisateur.famille_id,
        is_active: true
      },
      select: profilSelect
    })

    if (!membre) {
      return res.status(404).json({ succes: false, message: 'Membre introuvable' })
    }

    const famille = await prisma.famille.findUnique({
      where: { id: membre.famille_id },
      select: { nom: true }
    })

    const arbre = await prisma.membreArbre.findFirst({
      where: { utilisateur_id: id, famille_id: req.utilisateur.famille_id },
      include: {
        parent: { select: { nom: true } }
      }
    })

    let arbre_filiation = null
    if (arbre) {
      const parts = []
      if (arbre.parent?.nom) parts.push(`Enfant de ${arbre.parent.nom} (arbre)`)
      if (arbre.type_arbre === 'CONJOINT') parts.push('Conjoint(e) dans l’arbre')
      if (arbre.type_arbre === 'ASCENDANT') parts.push('Aïeul(le) / racine dans l’arbre')
      arbre_filiation = parts.length ? parts.join(' · ') : `Présent dans l’arbre : ${arbre.nom}`
    }

    const data = serializeUtilisateur(membre, famille?.nom)
    res.json({
      succes: true,
      data: { ...data, arbre_filiation }
    })
  } catch (erreur) {
    console.error('Erreur GET membre:', erreur)
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

// PUT /api/membres/:id/role - Changer le rôle d'un membre
router.put('/:id/role', verifierToken, async (req, res) => {
  try {
    if (!estAdmin(req.utilisateur.role)) {
      return res.status(403).json({ succes: false, message: 'Action réservée aux administrateurs' })
    }

    const id = parseInt(req.params.id)
    const { role } = req.body

    const cible = await prisma.utilisateur.findFirst({
      where: { id, famille_id: req.utilisateur.famille_id }
    })
    if (!cible) {
      return res.status(404).json({ succes: false, message: 'Membre introuvable' })
    }

    if (!['ADMIN', 'MEMBRE', 'LECTEUR'].includes(role)) {
      return res.status(400).json({
        succes: false,
        message: 'Rôle invalide'
      })
    }

    const membre = await prisma.utilisateur.update({
      where: { id },
      data: { role }
    })

    // NOTIFICATION : Informer le membre de son changement de rôle
    try {
      await creerNotification(
        id,
        'INVITATION',
        `Votre rôle a été changé en ${role}`,
        null
      )
    } catch (notifErr) {
      console.error('Erreur envoi notification role:', notifErr)
    }

    res.json({ succes: true, data: membre })
  } catch (erreur) {
    console.error('Erreur changement rôle:', erreur)
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

// PUT /api/membres/:id/desactiver - Désactiver un membre
router.put('/:id/desactiver', verifierToken, async (req, res) => {
  try {
    if (!estAdmin(req.utilisateur.role)) {
      return res.status(403).json({ succes: false, message: 'Action réservée aux administrateurs' })
    }

    const id = parseInt(req.params.id)
    const cible = await prisma.utilisateur.findFirst({
      where: { id, famille_id: req.utilisateur.famille_id }
    })
    if (!cible) {
      return res.status(404).json({ succes: false, message: 'Membre introuvable' })
    }

    await prisma.utilisateur.update({
      where: { id },
      data: { is_active: false }
    })

    res.json({ succes: true, message: 'Membre désactivé' })
  } catch (erreur) {
    console.error('Erreur désactivation:', erreur)
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

// POST /api/membres/inviter - Générer un lien d'invitation
router.post('/inviter', verifierToken, async (req, res) => {
  try {
    if (!estAdmin(req.utilisateur.role)) {
      return res.status(403).json({ succes: false, message: 'Action réservée aux administrateurs' })
    }

    const { email, role } = req.body

    if (!email) {
      return res.status(400).json({
        succes: false,
        message: 'Email obligatoire'
      })
    }

    const famille = await prisma.famille.findUnique({
      where: { id: req.utilisateur.famille_id }
    })

    const lienInvitation = buildRegisterInviteUrl({
      code: famille.code_invitation,
      email,
      role: role || 'MEMBRE'
    })

    res.json({
      succes: true,
      message: 'Lien d\'invitation généré',
      lien: lienInvitation
    })
  } catch (erreur) {
    console.error('Erreur invitation:', erreur)
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

module.exports = router
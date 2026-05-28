const express = require('express')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const prisma = require('../lib/prisma')
const { buildTokenPayload } = require('../lib/jwtPayload')
const { serializeUtilisateur } = require('../lib/serializeUtilisateur')
const { verifierToken } = require('../middleware/auth')
const { souvenirFamilyWhere } = require('../lib/souvenirFamilyWhere')

const router = express.Router()

// POST /api/auth/inscription - Créer une nouvelle famille + SUPER_ADMIN
router.post('/inscription', async (req, res) => {
  try {
    const { nom, prenom, email, password, nom_famille } = req.body

    if (!nom || !prenom || !email || !password || !nom_famille) {
      return res.status(400).json({
        succes: false,
        message: 'Tous les champs sont obligatoires'
      })
    }

    const emailExiste = await prisma.utilisateur.findUnique({ where: { email } })
    if (emailExiste) {
      return res.status(400).json({
        succes: false,
        message: 'Cet email est déjà utilisé'
      })
    }

    const motDePasseChiffre = await bcrypt.hash(password, 10)
    const code_invitation = Math.random().toString(36).substring(2, 10).toUpperCase()

    const famille = await prisma.famille.create({
      data: {
        nom: nom_famille,
        code_invitation,
        utilisateurs: {
          create: {
            nom,
            prenom,
            email,
            login: prenom.toLowerCase(),
            password: motDePasseChiffre,
            role: 'SUPER_ADMIN',
          }
        }
      },
      include: { utilisateurs: true }
    })

    const nouvelUtilisateur = famille.utilisateurs[0]

    const token = jwt.sign(
      buildTokenPayload({ ...nouvelUtilisateur, famille_id: famille.id }),
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.status(201).json({
      succes: true,
      message: 'Compte créé avec succès !',
      token,
      utilisateur: serializeUtilisateur(
        { ...nouvelUtilisateur, famille_id: famille.id },
        famille.nom
      )
    })

  } catch (erreur) {
    console.error('Erreur inscription:', erreur)
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

// POST /api/auth/connexion
router.post('/connexion', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        succes: false,
        message: 'Email et mot de passe obligatoires'
      })
    }

    const utilisateur = await prisma.utilisateur.findUnique({
      where: { email },
      include: { famille: true }
    })

    if (!utilisateur) {
      return res.status(401).json({
        succes: false,
        message: 'Email ou mot de passe incorrect'
      })
    }

    const motDePasseValide = await bcrypt.compare(password, utilisateur.password)
    if (!motDePasseValide) {
      return res.status(401).json({
        succes: false,
        message: 'Email ou mot de passe incorrect'
      })
    }

    if (!utilisateur.is_active) {
      return res.status(403).json({
        succes: false,
        message: 'Compte désactivé — contacte un administrateur'
      })
    }

    await prisma.utilisateur.update({
      where: { id: utilisateur.id },
      data: { derniere_connexion: new Date() }
    })

    const token = jwt.sign(
      buildTokenPayload(utilisateur),
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      succes: true,
      message: 'Connexion réussie !',
      token,
      utilisateur: serializeUtilisateur(utilisateur, utilisateur.famille.nom)
    })

  } catch (erreur) {
    console.error('Erreur connexion:', erreur)
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

// POST /api/auth/rejoindre - Rejoindre une famille existante avec code invitation
router.post('/rejoindre', async (req, res) => {
  try {
    const { nom, prenom, email, password, code } = req.body

    if (!nom || !prenom || !email || !password || !code) {
      return res.status(400).json({
        succes: false,
        message: 'Tous les champs sont obligatoires'
      })
    }

    const codeNorm = String(code).trim().toUpperCase()
    const famille = await prisma.famille.findUnique({
      where: { code_invitation: codeNorm }
    })

    if (!famille) {
      return res.status(400).json({
        succes: false,
        message: 'Code d\'invitation invalide'
      })
    }

    const emailExiste = await prisma.utilisateur.findUnique({ where: { email } })
    if (emailExiste) {
      return res.status(400).json({
        succes: false,
        message: 'Cet email est déjà utilisé'
      })
    }

    const motDePasseChiffre = await bcrypt.hash(password, 10)

    const utilisateur = await prisma.utilisateur.create({
      data: {
        nom,
        prenom,
        email,
        login: prenom.toLowerCase(),
        password: motDePasseChiffre,
        role: 'MEMBRE',
        famille_id: famille.id
      }
    })

    const token = jwt.sign(
      buildTokenPayload({ ...utilisateur, famille_id: famille.id }),
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.status(201).json({
      succes: true,
      message: 'Tu as rejoint la famille ' + famille.nom,
      token,
      utilisateur: serializeUtilisateur(
        { ...utilisateur, famille_id: famille.id },
        famille.nom
      )
    })

  } catch (erreur) {
    console.error('Erreur rejoindre:', erreur)
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

// GET /api/auth/me — profil à jour (avatar, etc.)
router.get('/me', verifierToken, async (req, res) => {
  try {
    const utilisateur = await prisma.utilisateur.findUnique({
      where: { id: req.utilisateur.id },
      include: { famille: true }
    })
    if (!utilisateur || !utilisateur.is_active) {
      return res.status(404).json({ succes: false, message: 'Utilisateur introuvable' })
    }

    const [souvenirCount, membreCount] = await Promise.all([
      prisma.souvenir.count({
        where: souvenirFamilyWhere(utilisateur.famille_id)
      }),
      prisma.utilisateur.count({
        where: { famille_id: utilisateur.famille_id, is_active: true, is_visible: true }
      })
    ])

    res.json({
      succes: true,
      utilisateur: serializeUtilisateur(utilisateur, utilisateur.famille?.nom),
      famille_stats: {
        souvenirs: souvenirCount,
        membres: membreCount
      }
    })
  } catch (erreur) {
    console.error('Erreur GET /me:', erreur)
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

module.exports = router
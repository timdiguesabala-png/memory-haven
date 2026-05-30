const prisma = require('./prisma')
const { formatSouvenir } = require('./souvenirFormat')
const { embedMediaInDescription } = require('./mediaEmbed')
const { uploadFiles } = require('../services/mediaStorage')
const { collectUploadedFiles } = require('../middleware/multerMedia')
const { notifierFamilleSaufAuteur } = require('../routes/notifications')
const { displayName } = require('./jwtPayload')
const { normaliserVisibilite } = require('./visibiliteSouvenir')

function parseUrlsBody(value) {
  if (!value) return []
  if (Array.isArray(value)) return value.filter(Boolean)
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [value]
    } catch {
      return [value]
    }
  }
  return []
}

function parseTags(tags) {
  if (!tags) return []
  if (Array.isArray(tags)) return tags
  if (typeof tags === 'string') {
    try {
      const parsed = JSON.parse(tags)
      if (Array.isArray(parsed)) return parsed
    } catch {
      /* virgules */
    }
    return tags.split(',').map((t) => t.trim()).filter(Boolean)
  }
  return []
}

async function createSouvenirFromRequest(req) {
  const { titre, description, type, date_souvenir, lieu, tags, fichiers_url, visibilite } = req.body

  if (!titre || !date_souvenir) {
    const err = new Error('Titre et date sont obligatoires')
    err.status = 400
    throw err
  }

  const dateParsed = new Date(date_souvenir)
  if (Number.isNaN(dateParsed.getTime())) {
    const err = new Error('Date invalide')
    err.status = 400
    throw err
  }

  const uploadedFiles = collectUploadedFiles(req)
  let urls = []

  if (uploadedFiles.length > 0) {
    try {
      urls = await uploadFiles(uploadedFiles)
    } catch (uploadErr) {
      const err = new Error(uploadErr.message || 'Échec upload média')
      err.status = 503
      throw err
    }
  }

  urls.push(...parseUrlsBody(fichiers_url))

  const media_url = urls[0] || null
  const fichiers_multiple = urls.length > 1 ? JSON.stringify(urls.slice(1)) : null

  let finalDescription = description || null
  if (uploadedFiles.length > 0 && urls.length >= uploadedFiles.length) {
    const items = uploadedFiles.map((f, i) => ({
      url: urls[i],
      name: f.originalname || null
    }))
    finalDescription = embedMediaInDescription(description, items)
  } else if (urls.length > 0 && parseUrlsBody(fichiers_url).length > 0) {
    finalDescription = embedMediaInDescription(description, urls.map((url) => ({ url })))
  }

  const souvenir = await prisma.souvenir.create({
    data: {
      titre,
      description: finalDescription,
      type: type || 'TEXTE',
      date_souvenir: dateParsed,
      lieu: lieu || null,
      fichier_url: media_url,
      fichiers_multiple,
      auteur_id: req.utilisateur.id,
      famille_id: req.utilisateur.famille_id,
      visibilite: normaliserVisibilite(visibilite, req.utilisateur.role)
    }
  })

  const tagArray = parseTags(tags)
  for (const libelleTag of tagArray) {
    const tag = await prisma.tag.upsert({
      where: {
        libelle_famille_id: {
          libelle: libelleTag,
          famille_id: req.utilisateur.famille_id
        }
      },
      update: {},
      create: {
        libelle: libelleTag,
        famille_id: req.utilisateur.famille_id
      }
    })
    await prisma.souvenirTag.create({
      data: { souvenir_id: souvenir.id, tag_id: tag.id }
    })
  }

  const auteurLabel = displayName(req.utilisateur)
  await notifierFamilleSaufAuteur(
    req.utilisateur.famille_id,
    req.utilisateur.id,
    'SOUVENIR',
    `${auteurLabel} a partagé « ${titre} »`,
    souvenir.id
  )

  return formatSouvenir(souvenir)
}

module.exports = { createSouvenirFromRequest }

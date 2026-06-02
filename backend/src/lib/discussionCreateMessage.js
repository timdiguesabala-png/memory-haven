const prisma = require('./prisma')
const { embedImage, embedAudio, enrichMessageFields } = require('./discussionMediaEmbed')

function isUnknownFieldError(err) {
  const msg = `${err?.message || ''} ${err?.meta?.target || ''}`
  return /Unknown arg|image_url|audio_url|audio_duration|reactions_json/i.test(msg)
}

async function createDiscussionMessage({
  contenu,
  image_url,
  audio_url,
  audio_duration,
  famille_id,
  utilisateur_id
}) {
  const text = (contenu || '').trim()
  const img = image_url || null
  const aud = audio_url || null
  const dur = Number.isFinite(audio_duration) ? audio_duration : null

  const fullData = {
    contenu: text,
    image_url: img,
    audio_url: aud,
    audio_duration: dur,
    famille_id,
    utilisateur_id
  }

  try {
    const message = await prisma.messageDiscussion.create({
      data: fullData,
      include: {
        utilisateur: {
          select: { id: true, nom: true, prenom: true, avatar_url: true }
        }
      }
    })
    return enrichMessageFields(message)
  } catch (err) {
    if (!isUnknownFieldError(err)) throw err

    let legacyContenu = text
    if (img) legacyContenu = embedImage(legacyContenu, img)
    if (aud) legacyContenu = embedAudio(legacyContenu, aud, dur)

    const message = await prisma.messageDiscussion.create({
      data: {
        contenu: legacyContenu,
        famille_id,
        utilisateur_id
      },
      include: {
        utilisateur: {
          select: { id: true, nom: true, prenom: true, avatar_url: true }
        }
      }
    })
    return enrichMessageFields(message)
  }
}

module.exports = { createDiscussionMessage, isUnknownFieldError }

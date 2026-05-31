const { creerNotification } = require('../routes/notifications')

const prisma = require('./prisma')

/** Extrait les ids utilisateur mentionnés via @prenom ou @prenom_nom */
function findMentionedUserIds(contenu, membres) {
  if (!contenu || !membres?.length) return []
  const regex = /@([\w\u00C0-\u024F-]+)/gi
  const ids = new Set()
  let match
  while ((match = regex.exec(contenu)) !== null) {
    const token = match[1].toLowerCase().replace(/-/g, '')
    for (const m of membres) {
      const prenom = (m.prenom || '').toLowerCase()
      const combo = `${m.prenom || ''}${m.nom || ''}`.toLowerCase().replace(/\s/g, '')
      if (prenom === token || combo === token) {
        ids.add(m.id)
      }
    }
  }
  return [...ids]
}

async function notifierMentions({ contenu, famille_id, auteur_id, auteurLabel, souvenir_id, souvenirTitre }) {
  const membres = await prisma.utilisateur.findMany({
    where: { famille_id, is_active: true },
    select: { id: true, prenom: true, nom: true }
  })
  const mentioned = findMentionedUserIds(contenu, membres).filter((id) => id !== auteur_id)
  await Promise.all(
    mentioned.map((id) =>
      creerNotification(
        id,
        'MENTION',
        `${auteurLabel} vous a mentionné sur « ${souvenirTitre} »`,
        souvenir_id
      )
    )
  )
  return mentioned.length
}

module.exports = { findMentionedUserIds, notifierMentions }

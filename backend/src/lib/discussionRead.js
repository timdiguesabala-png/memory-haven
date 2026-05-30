const prisma = require('./prisma')

async function getActiveMemberIds(familleId, excludeUserId = null) {
  const membres = await prisma.utilisateur.findMany({
    where: {
      famille_id: familleId,
      is_active: true,
      ...(excludeUserId ? { id: { not: excludeUserId } } : {})
    },
    select: { id: true }
  })
  return membres.map((m) => m.id)
}

async function getReadStates(familleId) {
  return prisma.discussionReadState.findMany({
    where: { famille_id: familleId }
  })
}

async function markDiscussionRead(utilisateurId, familleId, lastMessageId) {
  const last = Math.max(0, parseInt(lastMessageId, 10) || 0)
  return prisma.discussionReadState.upsert({
    where: {
      utilisateur_id_famille_id: {
        utilisateur_id: utilisateurId,
        famille_id: familleId
      }
    },
    create: {
      utilisateur_id: utilisateurId,
      famille_id: familleId,
      last_message_id: last
    },
    update: {
      last_message_id: last
    }
  })
}

function readStatusForMessage(messageId, readStates, otherMemberIds) {
  if (!otherMemberIds.length) return 'lu'
  const stateByUser = new Map(readStates.map((s) => [s.utilisateur_id, s.last_message_id]))
  const allRead = otherMemberIds.every((uid) => (stateByUser.get(uid) || 0) >= messageId)
  return allRead ? 'lu' : 'envoye'
}

async function buildReadContext(familleId, viewerId) {
  const [readStates, otherMemberIds] = await Promise.all([
    getReadStates(familleId),
    getActiveMemberIds(familleId, viewerId)
  ])
  const cursors = readStates.map((s) => ({
    utilisateur_id: s.utilisateur_id,
    last_message_id: s.last_message_id
  }))
  return { readStates, otherMemberIds, cursors }
}

function statutForMessage(message, viewerId, readStates, otherMemberIds) {
  if (message.utilisateur_id !== viewerId) return null
  return readStatusForMessage(message.id, readStates, otherMemberIds)
}

module.exports = {
  getActiveMemberIds,
  getReadStates,
  markDiscussionRead,
  readStatusForMessage,
  buildReadContext,
  statutForMessage
}

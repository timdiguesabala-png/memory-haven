const { getIo } = require('../socket')

function mapMessage(m) {
  return {
    ...m,
    auteur_id: m.utilisateur_id,
    auteur: m.utilisateur,
    created_at: m.createdAt
  }
}

function emitNewMessage(familleId, message) {
  const io = getIo()
  if (!io) return
  io.to(`famille_${familleId}`).emit('new_message', mapMessage(message))
}

function emitMessageDeleted(familleId, messageId) {
  const io = getIo()
  if (!io) return
  io.to(`famille_${familleId}`).emit('message_deleted', { id: messageId })
}

module.exports = { mapMessage, emitNewMessage, emitMessageDeleted }

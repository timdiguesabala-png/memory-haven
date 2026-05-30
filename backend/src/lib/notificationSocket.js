const { getIo } = require('../socket')

function mapNotification(n) {
  return {
    id: n.id,
    type: n.type,
    message: n.message,
    lu: n.lu,
    destinataire_id: n.destinataire_id,
    souvenir_id: n.souvenir_id ?? null,
    created_at: n.created_at
  }
}

function emitNewNotification(destinataireId, notification) {
  const io = getIo()
  if (!io || !notification) return
  io.to(`user_${destinataireId}`).emit('new_notification', mapNotification(notification))
}

module.exports = { mapNotification, emitNewNotification }

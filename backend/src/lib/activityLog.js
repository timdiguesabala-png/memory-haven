async function logActivity(prisma, { utilisateur_id, famille_id, action, details }) {
  try {
    await prisma.journalActivite.create({
      data: {
        utilisateur_id,
        famille_id,
        action,
        details: details ? JSON.stringify(details) : null
      }
    })
  } catch (err) {
    console.warn('Journal activité:', err.message)
  }
}

module.exports = { logActivity }

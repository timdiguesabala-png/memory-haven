const ROLES_ADMIN = ['ADMIN', 'SUPER_ADMIN']

function estAdmin(role) {
  return ROLES_ADMIN.includes(role)
}

module.exports = { estAdmin, ROLES_ADMIN }

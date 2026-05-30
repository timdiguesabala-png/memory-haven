const { test } = require('node:test')
const assert = require('node:assert')
const { souvenirFamilyWhere, visibilitesPourRole } = require('../src/lib/souvenirFamilyWhere')
const { normaliserVisibilite } = require('../src/lib/visibiliteSouvenir')

test('visibilitesPourRole — admin voit tout', () => {
  assert.deepEqual(visibilitesPourRole('ADMIN'), ['FAMILLE', 'MEMBRES_PROCHES', 'ADMINS'])
})

test('visibilitesPourRole — membre limité', () => {
  assert.deepEqual(visibilitesPourRole('MEMBRE'), ['FAMILLE', 'MEMBRES_PROCHES'])
})

test('souvenirFamilyWhere inclut famille et visibilité', () => {
  const where = souvenirFamilyWhere(42, 'MEMBRE')
  assert.equal(where.is_visible, true)
  assert.deepEqual(where.visibilite.in, ['FAMILLE', 'MEMBRES_PROCHES'])
  assert.equal(where.OR.length, 2)
})

test('normaliserVisibilite — membre ne peut pas ADMINS', () => {
  assert.equal(normaliserVisibilite('ADMINS', 'MEMBRE'), 'FAMILLE')
})

test('normaliserVisibilite — admin peut ADMINS', () => {
  assert.equal(normaliserVisibilite('ADMINS', 'ADMIN'), 'ADMINS')
})

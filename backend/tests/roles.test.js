const { test } = require('node:test')
const assert = require('node:assert')
const { exigerEcriture } = require('../src/middleware/roles')

function mockRes() {
  const res = { statusCode: null, body: null }
  res.status = (code) => {
    res.statusCode = code
    return res
  }
  res.json = (data) => {
    res.body = data
    return res
  }
  return res
}

test('exigerEcriture bloque LECTEUR', () => {
  const req = { utilisateur: { role: 'LECTEUR' } }
  const res = mockRes()
  let nextCalled = false
  exigerEcriture(req, res, () => {
    nextCalled = true
  })
  assert.equal(nextCalled, false)
  assert.equal(res.statusCode, 403)
})

test('exigerEcriture autorise MEMBRE', () => {
  const req = { utilisateur: { role: 'MEMBRE' } }
  const res = mockRes()
  let nextCalled = false
  exigerEcriture(req, res, () => {
    nextCalled = true
  })
  assert.equal(nextCalled, true)
})

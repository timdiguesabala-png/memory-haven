/**
 * @see backend/src/middleware/rateLimit.js
 */
const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const { rateLimit } = require('../src/middleware/rateLimit')

function mockRes() {
  const res = { statusCode: 200, body: null }
  res.status = (code) => {
    res.statusCode = code
    return res
  }
  res.json = (body) => {
    res.body = body
    return res
  }
  return res
}

describe('rateLimit', () => {
  it('autorise jusqu’à max requêtes', () => {
    const limiter = rateLimit({ windowMs: 60_000, max: 2 })
    const req = { headers: {}, socket: { remoteAddress: '1.2.3.4' }, path: '/test' }
    let nextCount = 0
    const next = () => { nextCount += 1 }

    limiter(req, mockRes(), next)
    limiter(req, mockRes(), next)
    assert.equal(nextCount, 2)
  })

  it('bloque au-delà de max', () => {
    const limiter = rateLimit({ windowMs: 60_000, max: 1, message: 'stop' })
    const req = { headers: {}, socket: { remoteAddress: '9.9.9.9' }, path: '/auth' }
    limiter(req, mockRes(), () => {})
    const res = mockRes()
    limiter(req, res, () => {})
    assert.equal(res.statusCode, 429)
    assert.equal(res.body.message, 'stop')
  })
})

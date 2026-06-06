/**
 * Limite simple par IP (mémoire) — auth et API générale.
 */
const buckets = new Map()

function clientIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    'unknown'
  )
}

function rateLimit({ windowMs = 60_000, max = 120, message = 'Trop de requêtes' } = {}) {
  return (req, res, next) => {
    const key = `${clientIp(req)}:${req.baseUrl || req.path}`
    const now = Date.now()
    let entry = buckets.get(key)
    if (!entry || now - entry.start > windowMs) {
      entry = { start: now, count: 0 }
      buckets.set(key, entry)
    }
    entry.count += 1
    if (entry.count > max) {
      return res.status(429).json({ succes: false, message })
    }
    next()
  }
}

const apiLimiter = rateLimit({ windowMs: 60_000, max: 200 })
const authLimiter = rateLimit({
  windowMs: 15 * 60_000,
  max: 40,
  message: 'Trop de tentatives — réessayez dans quelques minutes'
})

module.exports = { rateLimit, apiLimiter, authLimiter }

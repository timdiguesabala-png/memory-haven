const speakeasy = require('speakeasy')
const QRCode = require('qrcode')

function generateSecret(email) {
  return speakeasy.generateSecret({
    name: `Memory Haven (${email})`,
    length: 20
  })
}

function verifyToken(secretBase32, token) {
  if (!secretBase32 || token == null || token === '') return false
  return speakeasy.totp.verify({
    secret: secretBase32,
    encoding: 'base32',
    token: String(token).replace(/\s/g, ''),
    window: 1
  })
}

async function qrDataUrl(otpauthUrl) {
  return QRCode.toDataURL(otpauthUrl)
}

module.exports = { generateSecret, verifyToken, qrDataUrl }

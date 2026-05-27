const https = require('https')
setInterval(() => {
  https.get(process.env.RENDER_URL)
  console.log('🔄 Keep-alive ping')
}, 14 * 60 * 1000) // toutes les 14 minutes
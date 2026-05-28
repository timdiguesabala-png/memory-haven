import { useEffect, useState } from 'react'

const DISMISS_KEY = 'mh-install-banner-dismissed'

function isIos() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
}

export default function MobileInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [visible, setVisible] = useState(false)
  const [iosHint, setIosHint] = useState(false)

  useEffect(() => {
    if (isStandalone() || localStorage.getItem(DISMISS_KEY) === '1') return

    if (isIos()) {
      setIosHint(true)
      setVisible(true)
      return
    }

    const onBeforeInstall = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall)
  }, [])

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1')
    setVisible(false)
  }

  const installAndroid = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
    dismiss()
  }

  if (!visible) return null

  return (
    <div className="mh-install-banner" role="region" aria-label="Installer l’application">
      <div className="mh-install-banner-inner">
        <span className="mh-install-banner-icon" aria-hidden>📱</span>
        <div className="mh-install-banner-text">
          <strong>Memory Haven sur votre téléphone</strong>
          {iosHint ? (
            <span>
              Safari : bouton <strong>Partager</strong> → <strong>Sur l’écran d’accueil</strong>
            </span>
          ) : (
            <span>Ajoutez l’icône sur l’écran d’accueil comme une application.</span>
          )}
        </div>
        <div className="mh-install-banner-actions">
          {!iosHint && deferredPrompt && (
            <button type="button" className="mh-install-btn" onClick={installAndroid}>
              Installer
            </button>
          )}
          <button type="button" className="mh-install-dismiss" onClick={dismiss} aria-label="Fermer">
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}

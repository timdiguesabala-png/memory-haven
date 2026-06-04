import { useEffect, useState } from 'react'
import { appBuildLabel, forceAppRefresh } from '../lib/appVersion'
import { getApiCapabilities, resetApiCapabilitiesCache } from '../lib/apiCapabilities'

export default function UpdateStatusBar() {
  const [info, setInfo] = useState(null)

  useEffect(() => {
    resetApiCapabilitiesCache()
    getApiCapabilities({ force: true })
      .then((caps) => setInfo(caps))
      .catch(() => setInfo({ legacyHealth: true, version: null, membresFicheDetail: false }))
  }, [])

  if (!info) return null

  const apiOk = info.membresFicheDetail && !info.legacyHealth
  if (apiOk) return null

  return (
    <div className={`mh-update-status${apiOk ? ' mh-update-status--ok' : ' mh-update-status--warn'}`} role="status">
      <p className="mh-update-status-line">
        <strong>Site</strong> : {appBuildLabel()}
        {' · '}
        <strong>API</strong> :{' '}
        {apiOk ? (
          <span>{info.version}</span>
        ) : (
          <span>API pas à jour (Render + Supabase)</span>
        )}
      </p>
      {!apiOk && (
        <p className="mh-update-status-hint">
          Suivez <strong>SUPABASE-SETUP.md</strong> puis vérifiez{' '}
          <code>/api/health</code> : <code>27-supabase-v220</code>
        </p>
      )}
      <button type="button" className="mh-btn mh-btn-secondary mh-update-status-btn" onClick={forceAppRefresh}>
        Vider le cache et recharger le site
      </button>
    </div>
  )
}

/** Graphiques SVG — palette Heritage, sans lib externe */

const TYPE_META = {
  PHOTO: { label: 'Photos', color: '#6b8fb8', icon: '📷' },
  VIDEO: { label: 'Vidéos', color: '#c17f59', icon: '🎬' },
  AUDIO: { label: 'Audio', color: '#b8953a', icon: '🎵' },
  TEXTE: { label: 'Textes', color: '#5d8a72', icon: '📝' },
  DOCUMENT: { label: 'Documents', color: '#3d5a80', icon: '📄' }
}

const MEMBER_COLORS = ['#3d5a80', '#c17f59', '#5d8a72', '#b8953a', '#6b8fb8', '#9a5f42']

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle)
  const end = polarToCartesian(cx, cy, r, startAngle)
  const large = endAngle - startAngle <= 180 ? 0 : 1
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 0 ${end.x} ${end.y} L ${cx} ${cy} Z`
}

export function StatsDonutChart({ data, size = 200 }) {
  const entries = Object.entries(data).filter(([, v]) => v > 0)
  const total = entries.reduce((s, [, v]) => s + v, 0)
  if (total === 0) {
    return <p className="mh-stats-empty">Aucune donnée pour ce graphique.</p>
  }

  const cx = size / 2
  const cy = size / 2
  const r = size * 0.38
  let angle = 0
  const slices = entries.map(([key, value]) => {
    const sweep = (value / total) * 360
    const start = angle
    angle += sweep
    const meta = TYPE_META[key] || { label: key, color: '#8aa4c4' }
    return {
      key,
      value,
      pct: Math.round((value / total) * 100),
      meta,
      path: sweep >= 359.9 ? null : describeArc(cx, cy, r, start, start + sweep),
      full: sweep >= 359.9
    }
  })

  return (
    <div className="mh-stats-donut-wrap">
      <svg viewBox={`0 0 ${size} ${size}`} className="mh-stats-donut" role="img" aria-label="Répartition par type">
        {slices.map((s) =>
          s.full ? (
            <circle key={s.key} cx={cx} cy={cy} r={r} fill={s.meta.color} />
          ) : (
            <path key={s.key} d={s.path} fill={s.meta.color} stroke="#fff" strokeWidth="1.5" />
          )
        )}
        <circle cx={cx} cy={cy} r={r * 0.55} fill="var(--mh-stats-hole, #fbf7f2)" />
        <text x={cx} y={cy - 6} textAnchor="middle" className="mh-stats-donut-total">
          {total}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" className="mh-stats-donut-sub">
          souvenirs
        </text>
      </svg>
      <ul className="mh-stats-legend">
        {slices.map((s) => (
          <li key={s.key}>
            <span className="mh-stats-legend-dot" style={{ background: s.meta.color }} />
            <span className="mh-stats-legend-label">
              {s.meta.icon} {s.meta.label}
            </span>
            <span className="mh-stats-legend-val">
              {s.value} <em>({s.pct}%)</em>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function StatsBarChart({ items, maxValue, color = '#3d5a80', horizontal = false }) {
  if (!items.length) return <p className="mh-stats-empty">Aucune donnée.</p>
  const max = maxValue || Math.max(...items.map((i) => i.value), 1)

  if (horizontal) {
    return (
      <div className="mh-stats-bars mh-stats-bars--h">
        {items.map((item, i) => (
          <div key={item.label} className="mh-stats-bar-row">
            <span className="mh-stats-bar-label" title={item.label}>
              {item.label}
            </span>
            <div className="mh-stats-bar-track">
              <div
                className="mh-stats-bar-fill"
                style={{
                  width: `${(item.value / max) * 100}%`,
                  background: item.color || MEMBER_COLORS[i % MEMBER_COLORS.length]
                }}
              />
            </div>
            <span className="mh-stats-bar-num">{item.value}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="mh-stats-bars mh-stats-bars--v">
      {items.map((item, i) => (
        <div key={item.label} className="mh-stats-bar-col">
          <div className="mh-stats-bar-v-track">
            <div
              className="mh-stats-bar-v-fill"
              style={{
                height: `${(item.value / max) * 100}%`,
                background: item.color || `hsl(${210 + i * 18}, 42%, ${48 + i * 4}%)`
              }}
            />
          </div>
          <span className="mh-stats-bar-v-num">{item.value}</span>
          <span className="mh-stats-bar-v-label">{item.label}</span>
        </div>
      ))}
    </div>
  )
}

export function StatsTagChart({ tags }) {
  if (!tags.length) return null
  const max = tags[0][1]
  const colors = ['#3d5a80', '#5d8a72', '#c17f59', '#6b8fb8', '#b8953a', '#9a5f42', '#5d8a72', '#3d5a80', '#c17f59', '#6b8fb8']

  return (
    <div className="mh-stats-tags-chart">
      {tags.map(([tag, count], i) => (
        <div key={tag} className="mh-stats-tag-row">
          <span className="mh-stats-tag-name">#{tag}</span>
          <div className="mh-stats-tag-track">
            <div
              className="mh-stats-tag-fill"
              style={{ width: `${(count / max) * 100}%`, background: colors[i % colors.length] }}
            />
          </div>
          <span className="mh-stats-tag-count">{count}</span>
        </div>
      ))}
    </div>
  )
}

export { TYPE_META, MEMBER_COLORS }

export const SIDEBAR_GROUPS = [
  {
    label: 'Accueil',
    items: [
      { key: 'accueil', path: '/accueil', label: 'Tableau de bord', icon: '🏠' },
      { key: 'dashboard', path: '/dashboard', label: 'Fil de souvenirs', icon: '📄' }
    ]
  },
  {
    label: 'Mémoire',
    items: [
      { key: 'heritage', path: '/heritage', label: 'Héritage', icon: '📜' },
      { key: 'hommage', path: '/hommage', label: 'Hommage', icon: '🕯️' },
      { key: 'timeline', path: '/timeline', label: 'Chronologie', icon: '📅' },
      { key: 'capsules', path: '/capsules', label: 'Capsules', icon: '⏳' },
      { key: 'livre', path: '/livre', label: 'Livre familial', icon: '📖' }
    ]
  },
  {
    label: 'Explorer',
    items: [
      { key: 'albums', path: '/albums', label: 'Albums', icon: '📸' },
      { key: 'arbre', path: '/arbre', label: 'Arbre', icon: '🌳' },
      { key: 'carte', path: '/carte', label: 'Carte familiale', icon: '🌍' },
      { key: 'recherche', path: '/recherche', label: 'Recherche', icon: '🔍' }
    ]
  },
  {
    label: 'Famille',
    items: [
      { key: 'membres', path: '/membres', label: 'Membres', icon: '👪' },
      { key: 'discussion', path: '/discussion', label: 'Discussion', icon: '💬' },
      { key: 'statistiques', path: '/statistiques', label: 'Stats', icon: '📊' },
      { key: 'ajouter', path: '/ajouter', label: 'Ajouter', icon: '➕' }
    ]
  }
]

export const SIDEBAR_NAV = SIDEBAR_GROUPS.flatMap((g) => g.items)

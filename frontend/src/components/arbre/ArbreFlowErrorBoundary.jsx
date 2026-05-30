import { Component } from 'react'

export default class ArbreFlowErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="mh-arbre-flow-empty">
          <p>L&apos;arbre n&apos;a pas pu s&apos;afficher.</p>
          <p style={{ fontSize: '0.85rem', opacity: 0.85 }}>{this.state.error.message}</p>
          <button
            type="button"
            className="mh-btn mh-btn-primary"
            onClick={() => this.setState({ error: null })}
          >
            Réessayer
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

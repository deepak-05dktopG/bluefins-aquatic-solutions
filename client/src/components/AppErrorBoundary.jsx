/**
 * What it is: A safety wrapper around the app UI.
 * Non-tech note: If a page crashes while loading, this shows the error instead of a blank screen.
 */

import React from 'react'

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // Keep the error visible for debugging.
    console.error('Route render error:', error)
    console.error(info)
  }

  componentDidUpdate(prevProps) {
    // Clear the error when navigating to a different route.
    if (prevProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null })
    }
  }

  render() {
    if (!this.state.error) return this.props.children

    const message = this.state.error?.message || String(this.state.error)
    const stack = this.state.error?.stack

    return (
      <div style={{ minHeight: '100vh', padding: 24, fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif' }}>
        <h2 style={{ margin: 0 }}>Page crashed</h2>
        <p style={{ marginTop: 8, opacity: 0.85 }}>
          A runtime error happened while rendering this route. Copy the message below and send it here.
        </p>
        <div style={{ marginTop: 16, background: '#111', color: '#fff', borderRadius: 12, padding: 16, whiteSpace: 'pre-wrap' }}>
          {message}
          {stack ? `\n\n${stack}` : ''}
        </div>
      </div>
    )
  }
}

export default AppErrorBoundary

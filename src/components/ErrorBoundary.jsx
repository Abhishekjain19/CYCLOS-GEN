import React from 'react';
import { TbAlertTriangle, TbRefresh } from 'react-icons/tb';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0a1929 0%, #1a2332 100%)',
          color: '#fff',
          padding: '20px',
          textAlign: 'center'
        }}>
          <TbAlertTriangle size={64} color="#EF4444" style={{ marginBottom: '20px' }} />
          <h1 style={{ fontSize: '24px', marginBottom: '12px' }}>Oops! Something went wrong</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', maxWidth: '500px', marginBottom: '24px' }}>
            We encountered an unexpected error. Please try reloading the page.
          </p>

          {import.meta.env.DEV && this.state.error && (
            <details style={{
              marginBottom: '24px',
              padding: '16px',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '8px',
              textAlign: 'left',
              maxWidth: '600px',
              width: '100%'
            }}>
              <summary style={{ cursor: 'pointer', marginBottom: '12px', fontWeight: '600' }}>
                Error Details
              </summary>
              <pre style={{ fontSize: '12px', overflow: 'auto', color: '#EF4444' }}>
                {this.state.error.toString()}
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}

          <button
            onClick={this.handleReload}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              background: '#00E5FF',
              color: '#0a1929',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <TbRefresh size={20} />
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

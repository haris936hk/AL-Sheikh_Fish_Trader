import PropTypes from 'prop-types';
import { Component } from 'react';

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI.
 *
 * NOTE: This component intentionally uses plain HTML/CSS in its fallback,
 * not Mantine components, because it wraps MantineProvider and therefore
 * the Mantine context is unavailable when the fallback renders.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #fff1f2 0%, #fff7ed 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '12px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
              padding: '2.5rem',
              maxWidth: '520px',
              width: '100%',
            }}
          >
            <h2 style={{ color: '#dc2626', marginTop: 0, fontSize: '1.4rem' }}>
              ⚠️ Something went wrong
            </h2>
            <p style={{ color: '#6b7280', marginBottom: '1.25rem' }}>
              An unexpected error occurred. Please try again or restart the application.
            </p>

            {this.state.error && (
              <div
                style={{
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  marginBottom: '0.75rem',
                }}
              >
                <p style={{ fontWeight: 600, fontSize: '0.85rem', margin: '0 0 0.4rem' }}>Error:</p>
                <pre
                  style={{
                    fontSize: '0.78rem',
                    overflow: 'auto',
                    maxHeight: '8rem',
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    color: '#b91c1c',
                  }}
                >
                  {this.state.error.toString()}
                </pre>
              </div>
            )}

            {this.state.errorInfo && (
              <div
                style={{
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  marginBottom: '1.25rem',
                }}
              >
                <p style={{ fontWeight: 600, fontSize: '0.85rem', margin: '0 0 0.4rem' }}>
                  Component Stack:
                </p>
                <pre
                  style={{
                    fontSize: '0.72rem',
                    overflow: 'auto',
                    maxHeight: '8rem',
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    color: '#374151',
                  }}
                >
                  {this.state.errorInfo.componentStack}
                </pre>
              </div>
            )}

            <button
              onClick={this.handleReset}
              style={{
                width: '100%',
                padding: '0.65rem',
                background: '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node,
};

export default ErrorBoundary;

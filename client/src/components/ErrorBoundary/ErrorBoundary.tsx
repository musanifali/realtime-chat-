// client/src/components/ErrorBoundary/ErrorBoundary.tsx

import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div 
          className="flex items-center justify-center min-h-screen p-4"
          style={{ backgroundColor: 'var(--color-bg-primary)' }}
        >
          <div 
            className="max-w-md w-full p-8 text-center"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              border: '4px solid var(--color-border)',
              boxShadow: '8px 8px 0 var(--color-border)',
              borderRadius: '16px',
              transform: 'rotate(-1deg)',
            }}
          >
            <div className="text-6xl mb-4">💥</div>
            <h1 
              className="text-3xl font-black uppercase mb-4"
              style={{
                color: 'var(--color-primary)',
                textShadow: '3px 3px 0 var(--color-border)',
              }}
            >
              Oops! Something Broke!
            </h1>
            <p className="text-gray-600 mb-6">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={this.handleReset}
              className="px-6 py-3 font-black uppercase text-sm transition-all duration-200"
              style={{
                background: 'var(--color-primary)',
                color: 'white',
                border: '3px solid var(--color-border)',
                boxShadow: '4px 4px 0 var(--color-border)',
                borderRadius: '12px',
                transform: 'rotate(1deg)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'rotate(1deg) scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'rotate(1deg) scale(1)';
              }}
            >
              💫 Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

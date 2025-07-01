import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-fallback p-4 bg-red-900 bg-opacity-30 rounded-md text-white">
          <h2 className="text-lg font-bold">Niečo sa pokazilo</h2>
          <p className="text-sm">Nastala neočakávaná chyba. Obnovte stránku.</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Obnoviť stránku
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

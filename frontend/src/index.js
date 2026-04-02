import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null, info: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { this.setState({ info }); console.error('APP CRASH:', error, info); }
  render() {
    if (this.state.hasError) {
      return React.createElement('div', { style: { padding: 40, fontFamily: 'monospace', background: '#1a1a2e', color: '#fff', minHeight: '100vh' } },
        React.createElement('h1', { style: { color: '#e94560' } }, '⚠️ Application Error'),
        React.createElement('pre', { style: { color: '#ffbd39', whiteSpace: 'pre-wrap', fontSize: 14, marginTop: 20 } }, String(this.state.error)),
        React.createElement('pre', { style: { color: '#aaa', whiteSpace: 'pre-wrap', fontSize: 12, marginTop: 10 } }, this.state.info?.componentStack?.substring(0, 2000))
      );
    }
    return this.props.children;
  }
}

let App;
try {
  App = require('./App').default;
} catch (e) {
  console.error('IMPORT ERROR:', e);
  App = () => React.createElement('div', { style: { padding: 40, color: '#fff', background: '#1a1a2e', fontFamily: 'monospace' } },
    React.createElement('h1', { style: { color: '#e94560' } }, '⚠️ Import Error'),
    React.createElement('pre', { style: { color: '#ffbd39' } }, String(e))
  );
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 5 * 60 * 1000, retry: 1 } },
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  React.createElement(QueryClientProvider, { client: queryClient },
    React.createElement(ErrorBoundary, null, React.createElement(App))
  )
);

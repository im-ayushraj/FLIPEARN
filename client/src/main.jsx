import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider, useAuth } from '@clerk/clerk-react';
import { Provider } from 'react-redux';
import { store } from './app/store.js';
import { useEffect } from 'react';
import { setAuthToken, setAuthTokenProvider } from './lib/api.js';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
if (!PUBLISHABLE_KEY) throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env');

/**
 * Injects the Clerk session token into every outgoing API request.
 * Runs on mount and whenever the auth session changes.
 */
function TokenInjector() {
  const { getToken, isSignedIn } = useAuth();

  useEffect(() => {
    setAuthTokenProvider(async () => {
      if (!isSignedIn) return null;
      try {
        return await getToken();
      } catch {
        return null;
      }
    });

    if (!isSignedIn) {
      setAuthToken(null);
    }

    return () => {
      setAuthTokenProvider(null);
    };
  }, [isSignedIn, getToken]);

  return null;
}

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      appearance={{ variables: { colorPrimary: '#4f46e5' } }}
    >
      <TokenInjector />
      <Provider store={store}>
        <App />
      </Provider>
    </ClerkProvider>
  </BrowserRouter>
);

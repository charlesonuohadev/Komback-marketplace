import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AppProvider } from './context/AppContext.tsx';
import './index.css';

/**
 * The Super Admin console lives at /admin-cp and is code-split, so none of its
 * code — or its API surface — is downloaded by storefront visitors.
 */
const AdminApp = lazy(() => import('./admin/AdminApp.tsx'));

const isAdminConsole =
  typeof window !== 'undefined' && window.location.pathname.startsWith('/admin-cp');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isAdminConsole ? (
      <Suspense
        fallback={
          <div className="min-h-screen bg-slate-950 flex items-center justify-center">
            <p className="text-xs font-bold text-slate-400">Loading control centre…</p>
          </div>
        }
      >
        <AdminApp />
      </Suspense>
    ) : (
      <AppProvider>
        <App />
      </AppProvider>
    )}
  </StrictMode>
);

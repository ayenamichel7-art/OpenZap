import { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { authApi } from '../api';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: ReactNode;
}

/**
 * Protects routes by verifying the token with the API.
 * Redirects to /login if not authenticated.
 */
const AuthGuard = ({ children }: AuthGuardProps) => {
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    if (!token) {
      setStatus('unauthenticated');
      return;
    }

    authApi.me()
      .then(() => setStatus('authenticated'))
      .catch(() => {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        setStatus('unauthenticated');
      });
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={40} className="animate-spin text-primary" />
          <p className="text-sm font-bold text-base-content/40 uppercase tracking-widest">Chargement...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default AuthGuard;

import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PawPrint, Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Use ref to prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processCallback = async () => {
      const hash = window.location.hash;
      const sessionIdMatch = hash.match(/session_id=([^&]+)/);
      
      if (!sessionIdMatch) {
        navigate('/auth?mode=login');
        return;
      }

      const sessionId = sessionIdMatch[1];

      try {
        await loginWithGoogle(sessionId);
        // Clear the hash from URL
        window.history.replaceState(null, '', window.location.pathname);
        navigate('/dashboard');
      } catch (error) {
        console.error('Google auth error:', error);
        navigate('/auth?mode=login&error=google_failed');
      }
    };

    processCallback();
  }, [loginWithGoogle, navigate]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-[#5A3E85] rounded-2xl flex items-center justify-center mx-auto mb-4">
          <PawPrint className="w-8 h-8 text-white" />
        </div>
        <Loader2 className="w-8 h-8 text-[#5A3E85] animate-spin mx-auto mb-4" />
        <p className="text-[#564F62]">Autenticando...</p>
      </div>
    </div>
  );
}

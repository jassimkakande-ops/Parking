import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const AuthCallback = () => {
  const { completeOAuthLogin } = useContext(AuthContext);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const finishLogin = async () => {
      try {
        const user = await completeOAuthLogin(searchParams.get('role') || 'driver');
        navigate(`/${user.role}`, { replace: true });
      } catch (err) {
        setError(typeof err === 'string' ? err : 'Google sign in failed');
      }
    };

    finishLogin();
  }, [completeOAuthLogin, navigate, searchParams]);

  return (
    <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center', padding: '24px' }}>
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '420px', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '12px' }}>Signing you in</h2>
        <p style={{ color: 'var(--text-muted)' }}>{error || 'Finishing your Google sign in...'}</p>
      </div>
    </div>
  );
};

export default AuthCallback;

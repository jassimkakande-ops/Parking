import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const validatePassword = (password) => ({
  minLength: password.length >= 6,
  hasUpperCase: /[A-Z]/.test(password),
  hasLowerCase: /[a-z]/.test(password),
  hasNumbers: /[0-9]/.test(password),
  hasSpecialChar: /[^A-Za-z0-9]/.test(password)
});

const ResetPassword = () => {
  const { updatePassword } = useContext(AuthContext);
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Initialize supabase client on mount to ensure it parses the hash token from URL
    import('../utils/supabaseClient').then(({ getSupabaseClient }) => {
      getSupabaseClient().catch(() => {});
    });
  }, []);

  const validation = validatePassword(password);
  const isValid = Object.values(validation).every(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!isValid) return setError('Please choose a stronger password.');
    if (password !== confirmPassword) return setError('Passwords do not match.');

    try {
      setLoading(true);
      await updatePassword(password);
      setMessage('Password reset successfully. You can now sign in with your new password.');
      setTimeout(() => navigate('/login', { replace: true }), 1600);
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center', padding: '24px' }}>
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '440px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '8px', fontSize: '1.75rem' }}>Reset Password</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '24px' }}>Enter your new password below.</p>

        {error && <div style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>{error}</div>}
        {message && <div style={{ background: 'rgba(52, 168, 83, 0.12)', color: 'var(--success)', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>{message}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: '500' }}>New Password</label>
            <input type="password" className="input-field" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: '500' }}>Confirm Password</label>
            <input type="password" className="input-field" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          </div>

          {password && (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.7 }}>
              <div style={{ color: validation.minLength ? 'var(--success)' : 'inherit' }}>At least 6 characters</div>
              <div style={{ color: validation.hasUpperCase ? 'var(--success)' : 'inherit' }}>One uppercase letter</div>
              <div style={{ color: validation.hasLowerCase ? 'var(--success)' : 'inherit' }}>One lowercase letter</div>
              <div style={{ color: validation.hasNumbers ? 'var(--success)' : 'inherit' }}>One number</div>
              <div style={{ color: validation.hasSpecialChar ? 'var(--success)' : 'inherit' }}>One special character</div>
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={loading || !password || !confirmPassword}>
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.9rem' }}>
          <Link to="/login" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: '500' }}>Back to Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;

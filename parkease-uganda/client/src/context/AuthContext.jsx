import React, { createContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { getSupabaseClient } from '../utils/supabaseClient';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    // Check if user is logged in on mount
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { session, user: userData } = res.data.data;
      const token = session?.access_token;
      
      if (token) localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      return userData;
    } catch (error) {
      throw error.response?.data?.message || error.response?.data?.error || 'Login failed';
    }
  };

  const register = async (userData) => {
    try {
      const res = await api.post('/auth/register', userData);
      const { session, user: newUser } = res.data.data;
      const token = session?.access_token;
      
      if (token) localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(newUser));
      setUser(newUser);
      
      return newUser;
    } catch (error) {
      throw error.response?.data?.message || error.response?.data?.error || 'Registration failed';
    }
  };

  const signInWithGoogle = async (role = 'driver') => {
    try {
      const supabase = await getSupabaseClient();
      const redirectTo = `${window.location.origin}/auth/callback?role=${role}`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });

      if (error) throw error;
    } catch (error) {
      throw error.message || 'Google sign in failed';
    }
  };

  const completeOAuthLogin = async (role = 'driver') => {
    try {
      const supabase = await getSupabaseClient();
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session?.access_token) {
        throw error || new Error('OAuth session was not found.');
      }

      const res = await api.post('/auth/oauth-profile', {
        access_token: data.session.access_token,
        role
      });

      const userData = res.data.data.user;
      localStorage.setItem('token', data.session.access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    } catch (error) {
      throw error.response?.data?.message || error.message || 'Google sign in failed';
    }
  };

  const resetPassword = async (email) => {
    try {
      const supabase = await getSupabaseClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) throw error;
    } catch (error) {
      throw error.message || 'Failed to send reset email';
    }
  };

  const updatePassword = async (password) => {
    try {
      const supabase = await getSupabaseClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      await supabase.auth.signOut();
    } catch (error) {
      throw error.message || 'Failed to reset password';
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  if (loading) {
    return <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, signInWithGoogle, completeOAuthLogin, resetPassword, updatePassword, theme, toggleTheme }}>
      {children}
    </AuthContext.Provider>
  );
};

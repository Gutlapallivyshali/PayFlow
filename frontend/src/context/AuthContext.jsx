import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const stored = authService.getStoredUser();
      if (stored && authService.isAuthenticated()) {
        setUser(stored);
        try {
          const profile = await authService.getCurrentUser();
          setUser((prev) => ({ ...prev, ...profile }));
        } catch (err) {
          console.warn('Could not refresh user profile on mount:', err);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (credentials) => {
    const result = await authService.login(credentials);
    setUser({
      username: result.username,
      email: result.email,
      role: result.role,
    });
    return result;
  };

  const register = async (userData) => {
    const result = await authService.register(userData);
    setUser({
      username: result.username,
      email: result.email,
      role: result.role,
    });
    return result;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

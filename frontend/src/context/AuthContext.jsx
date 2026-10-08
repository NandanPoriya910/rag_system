import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, tokenStore } from '../services/api.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!tokenStore.get());

  useEffect(() => {
    if (!tokenStore.get()) return;
    api.me().then((r) => setUser(r.user)).catch(() => tokenStore.clear()).finally(() => setLoading(false));
  }, []);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  useEffect(() => {
    window.addEventListener('auth:expired', logout);
    return () => window.removeEventListener('auth:expired', logout);
  }, [logout]);

  const value = useMemo(
    () => ({
      user,
      loading,
      logout,
      async login(identifier, password, remember) {
        const r = await api.login(identifier, password);
        tokenStore.set(r.token, remember);
        setUser(r.user);
      },
      async signup(payload) {
        const r = await api.signup(payload);
        tokenStore.set(r.token, true);
        setUser(r.user);
      },
    }),
    [user, loading, logout]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

import React, { createContext, useContext, useEffect, useState } from 'react';
import { clearToken, mobileApi, saveToken } from '../api/client';
import type { MobileUser } from '../types/domain';

interface AuthContextValue {
  user: MobileUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (payload: { fullName: string; email: string; password: string; country: string }) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MobileUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    mobileApi
      .me()
      .then((res) => setUser(res.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const signIn = async (email: string, password: string) => {
    const res = await mobileApi.login(email, password);
    await saveToken(res.access_token);
    setUser(res.user);
  };

  const signUp = async (payload: { fullName: string; email: string; password: string; country: string }) => {
    const res = await mobileApi.register(payload);
    await saveToken(res.access_token);
    setUser(res.user);
  };

  const signOut = async () => {
    await clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

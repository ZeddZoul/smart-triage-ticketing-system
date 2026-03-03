'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { loginAgent as apiLogin } from './api';
import type { Agent } from './types';

interface AuthState {
  agent: Agent | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

function decodeTokenPayload(token: string): { exp?: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  const payload = decodeTokenPayload(token);
  if (!payload?.exp) return true;
  return Date.now() >= payload.exp * 1000;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // On mount: restore from localStorage
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('token');
      const storedAgent = localStorage.getItem('agent');

      if (storedToken && storedAgent) {
        if (isTokenExpired(storedToken)) {
          localStorage.removeItem('token');
          localStorage.removeItem('agent');
        } else {
          setToken(storedToken);
          setAgent(JSON.parse(storedAgent));
        }
      }
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('agent');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await apiLogin({ email, password });
      localStorage.setItem('token', response.token);
      localStorage.setItem('agent', JSON.stringify(response.agent));
      setToken(response.token);
      setAgent(response.agent);
      router.push('/dashboard');
    },
    [router],
  );

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('agent');
    setToken(null);
    setAgent(null);
    router.push('/login');
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        agent,
        token,
        isLoading,
        isAuthenticated: !!token && !!agent,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

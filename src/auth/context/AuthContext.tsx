'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { createSession, removeSession } from '@/auth/lib/actionGateway';
import { getUserStats } from '@/user/lib/actionGateway';
import type { BaseUserStats } from '@/user/types';
import { onAuthStateChanged } from '@/auth/lib/firebase';
import { auth } from '@/firebase/client';

export interface AuthContextType {
  loading: boolean;
  isLoggedIn: boolean | null;
  getUserData: () => Promise<BaseUserStats | null>;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: AuthProviderProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        const idToken = await currentUser.getIdToken();
        await createSession(idToken);
      } else {
        await removeSession();
      }

      setIsLoggedIn(!!currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const getUserData = async (): Promise<BaseUserStats | null> => {
    if (auth.currentUser) {
      const serverData = await getUserStats(auth.currentUser.uid);
      return serverData;
    }
    return null;
  };

  return (
    <AuthContext.Provider value={{ loading, isLoggedIn, getUserData }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { createSession, removeSession } from '@/app/actions/auth';
import { getUserStats } from '@/app/actions/user';
import { UserStats } from '@/auth/types';
import { onAuthStateChanged } from '@/auth/lib/firebase';
import { auth } from '@/firebase/client';

export interface AuthContextType {
  loading: boolean;
  isLoggedIn: boolean | null;
  getUserData: () => Promise<UserStats | null>;
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

  const getUserData = async (): Promise<UserStats | null> => {
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

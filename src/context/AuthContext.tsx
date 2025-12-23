'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { createSession, removeSession } from '@/app/actions/auth';
import { fetchUserData, getTodayMatch } from '@/app/actions/game';
import { AuthContextType } from '@/types/auth';
import { onAuthStateChanged } from '@/lib/firebase/auth';

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true
});

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (user) => {
      if (user) {
        console.log(user);

        const idToken = await user.getIdToken();
        await createSession(idToken);
        setUser(user);
      } else {
        await removeSession();
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getUserData = async () => {
    return await fetchUserData();
  };

  const getDailyMatch = async () => {
    return await getTodayMatch();
  };

  return (
    <AuthContext.Provider value={{ user, loading, getUserData, getDailyMatch }}>
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

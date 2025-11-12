import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import type { User, UserCredential } from 'firebase/auth';
import { auth } from '../firebaseConfig';
// Tipos para el contexto
interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<UserCredential>;
  logout: () => Promise<void>;
  isAdmin: () => boolean;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;

  const login = async (email: string, password: string): Promise<UserCredential> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Verificar si es admin
      if (user.email !== ADMIN_EMAIL) {
        await signOut(auth);
        throw new Error('Acceso denegado: Solo administradores pueden acceder');
      }

      return userCredential;
    } catch (error) {
      throw error;
    }
  };

  const logout = (): Promise<void> => {
    return signOut(auth);
  };

  const isAdmin = (): boolean => {
    return currentUser !== null && currentUser.email === ADMIN_EMAIL;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    currentUser,
    login,
    logout,
    isAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
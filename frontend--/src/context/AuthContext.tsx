import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export type UserRole = 'admin' | 'student' | 'faculty';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  photoURL?: string;
  phone?: string;
  address?: string;
}

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Set persistence to local storage
  useEffect(() => {
    setPersistence(auth, browserLocalPersistence).catch((err) => {
      console.error('Error setting persistence:', err);
    });
  }, []);

  // Helper function to determine user role from email
  const getUserRoleFromEmail = (email: string): UserRole => {
    if (email.includes('admin')) return 'admin';
    if (email.includes('faculty')) return 'faculty';
    return 'student';
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      try {
        if (currentUser) {
          setFirebaseUser(currentUser);
          // Create basic user from Firebase Auth (don't wait for Firestore)
          const basicUser: User = {
            id: currentUser.uid,
            name: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
            email: currentUser.email || '',
            role: getUserRoleFromEmail(currentUser.email || ''),
            photoURL: currentUser.photoURL || undefined,
          };
          setUser(basicUser);
          
          // Fetch full user data from Firestore in background (non-blocking)
          getDoc(doc(db, 'users', currentUser.uid))
            .then((userDoc) => {
              if (userDoc.exists()) {
                const userData = userDoc.data() as User;
                setUser(userData); // Update with full Firestore data
              }
            })
            .catch((err) => {
              console.warn('Could not fetch Firestore user data (this is OK during initial login):', err);
              // User is already set from Firebase Auth, so continue
            });
        } else {
          setFirebaseUser(null);
          setUser(null);
        }
      } catch (err) {
        console.error('Error in auth state change:', err);
        setError('Authentication error');
      } finally {
        setIsLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setError(null);
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // Fetch user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        setUser(userData);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Login failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const signup = async (
    email: string,
    password: string,
    name: string,
    role: UserRole
  ): Promise<void> => {
    try {
      setError(null);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user document in Firestore
      const newUser: User = {
        id: result.user.uid,
        name,
        email,
        role,
      };
      
      await setDoc(doc(db, 'users', result.user.uid), newUser);
      setUser(newUser);
    } catch (err: any) {
      const errorMessage = err.message || 'Signup failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setError(null);
      await firebaseSignOut(auth);
      setUser(null);
      setFirebaseUser(null);
    } catch (err: any) {
      const errorMessage = err.message || 'Logout failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

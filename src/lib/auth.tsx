import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  User as FirebaseUser, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import type { User } from '@/src/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signUp: (email: string, pass: string, name: string) => Promise<void>;
  signIn: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  signUp: async () => {},
  signIn: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const signUp = async (email: string, pass: string, name: string) => {
    try {
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      await sendEmailVerification(res.user);
      
      const newUser: User = {
        uid: res.user.uid,
        email: res.user.email || '',
        displayName: name,
        role: email === 'sagarrana@gmail.com' ? 'admin' : 'user',
        createdAt: new Date().toISOString(),
      };
      
      await setDoc(doc(db, 'users', res.user.uid), newUser);
      setUser(newUser);
    } catch (err: any) {
      console.error("Sign up error:", err);
      throw err;
    }
  };

  const signIn = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err: any) {
      console.error("Sign in error:", err);
      throw err;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  // Helper function to retry Firestore operations with exponential backoff
  const retryFirestoreOperation = async <T,>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000
  ): Promise<T> => {
    let lastError: any;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (err: any) {
        lastError = err;
        const isOfflineError = err.message?.includes('offline') || err.code === 'FIRESTORE/UNAVAILABLE';
        if (isOfflineError && attempt < maxRetries - 1) {
          const delay = delayMs * Math.pow(2, attempt);
          console.warn(`Firestore offline, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw err;
      }
    }
    throw lastError;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          await retryFirestoreOperation(async () => {
            const userRef = doc(db, 'users', firebaseUser.uid);
            const userDoc = await getDoc(userRef);
            
            if (userDoc.exists()) {
              setUser(userDoc.data() as User);
            } else {
              // User exists in Auth but not in Firestore, create profile (e.g. from Google login)
              const newUser: User = {
                uid: firebaseUser.uid,
                email: firebaseUser.email || '',
                displayName: firebaseUser.displayName || '',
                role: firebaseUser.email === 'sagarrana@gmail.com' ? 'admin' : 'user',
                photoURL: firebaseUser.photoURL || undefined,
                createdAt: new Date().toISOString(),
              };
              
              await setDoc(userRef, newUser);
              setUser(newUser);
            }
          }, 3, 1000);
        } catch (err) {
          console.error('Error fetching/creating user profile:', err);
          setError('Failed to load user profile. Please check your connection and refresh.');
        } finally {
          setLoading(false);
        }
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, signUp, signIn, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

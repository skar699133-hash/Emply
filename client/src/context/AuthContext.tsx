import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../api/client';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  updateProfile,
  onAuthStateChanged,
  isFirebaseConfigured,
  FirebaseUser 
} from '../lib/firebase';
import { firestoreService } from '../services/firestoreService';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  demoUsers: User[];
  isFirebaseActive: boolean;
  login: (email: string, password?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  signUpWithEmail: (email: string, password: string, fullName: string) => Promise<void>;
  switchUser: (targetUserEmail: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [demoUsers, setDemoUsers] = useState<User[]>([]);
  const isFirebaseActive = isFirebaseConfigured();

  // Fetch demo users for persona switcher
  useEffect(() => {
    api.getDemoUsers()
      .then((users) => setDemoUsers(users))
      .catch((err) => console.error('Failed to load demo users:', err));
  }, []);

  // Listen to Firebase auth state changes if configured
  useEffect(() => {
    if (!auth) {
      refreshUser();
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        // Build User object from Firebase
        const mappedUser: User = {
          id: fbUser.uid,
          email: fbUser.email || '',
          fullName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Workplace User',
          role: 'EMPLOYEE' as any,
          departmentId: 'dept-eng',
          departmentName: 'Engineering',
          jobTitle: 'Software Engineer',
          avatarUrl: fbUser.photoURL || undefined,
        };
        setUser(mappedUser);
        await firestoreService.saveUser({
          id: fbUser.uid,
          email: fbUser.email || '',
          fullName: mappedUser.fullName,
          role: mappedUser.role,
          departmentId: mappedUser.departmentId,
        });
        setLoading(false);
      } else {
        refreshUser();
      }
    });

    return () => unsubscribe();
  }, []);

  const refreshUser = async () => {
    try {
      const token = localStorage.getItem('nexora_token');
      if (!token) {
        setUser(null);
        return;
      }
      const userData = await api.getMe();
      setUser(userData);
    } catch (err) {
      console.warn('Session expired or invalid:', err);
      localStorage.removeItem('nexora_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password?: string) => {
    setLoading(true);
    try {
      if (auth && isFirebaseActive) {
        try {
          const userCred = await signInWithEmailAndPassword(auth, email, password || 'password123');
          setFirebaseUser(userCred.user);
          const mappedUser: User = {
            id: userCred.user.uid,
            email: userCred.user.email || email,
            fullName: userCred.user.displayName || email.split('@')[0],
            role: 'EMPLOYEE' as any,
            departmentId: 'dept-ops',
            departmentName: 'Operations',
          };
          setUser(mappedUser);
          await firestoreService.saveUser(mappedUser);
          return;
        } catch (firebaseErr: any) {
          console.warn('Firebase login failed, falling back to local credentials:', firebaseErr.message);
        }
      }

      // Local / standard login
      const res = await api.login(email, password || 'password123');
      localStorage.setItem('nexora_token', res.token);
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    if (!auth) {
      throw new Error('Firebase credentials are not configured in your .env file yet.');
    }
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      setFirebaseUser(fbUser);
      const mappedUser: User = {
        id: fbUser.uid,
        email: fbUser.email || '',
        fullName: fbUser.displayName || 'Google User',
        role: 'EMPLOYEE' as any,
        departmentId: 'dept-eng',
        departmentName: 'Engineering',
        avatarUrl: fbUser.photoURL || undefined,
      };
      setUser(mappedUser);
      await firestoreService.saveUser(mappedUser);
      await firestoreService.logAudit('USER_LOGIN_GOOGLE', { id: fbUser.uid, email: fbUser.email });
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, password: string, fullName: string) => {
    if (!auth) {
      throw new Error('Firebase credentials are not configured in your .env file yet.');
    }
    setLoading(true);
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCred.user, { displayName: fullName });
      setFirebaseUser(userCred.user);
      const mappedUser: User = {
        id: userCred.user.uid,
        email: userCred.user.email || email,
        fullName: fullName || email.split('@')[0],
        role: 'EMPLOYEE' as any,
        departmentId: 'dept-ops',
        departmentName: 'Operations',
      };
      setUser(mappedUser);
      await firestoreService.saveUser(mappedUser);
      await firestoreService.logAudit('USER_REGISTER_EMAIL', { id: userCred.user.uid, email });
    } finally {
      setLoading(false);
    }
  };

  const switchUser = async (targetEmail: string) => {
    setLoading(true);
    try {
      const res = await api.login(targetEmail, 'password123');
      localStorage.setItem('nexora_token', res.token);
      setUser(res.user);
    } catch (err) {
      console.error('Failed to switch demo persona:', err);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (auth) {
      try {
        await signOut(auth);
      } catch (e) {
        console.warn('Firebase signout note:', e);
      }
    }
    localStorage.removeItem('nexora_token');
    setUser(null);
    setFirebaseUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        demoUsers,
        isFirebaseActive,
        login,
        loginWithGoogle,
        signUpWithEmail,
        switchUser,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

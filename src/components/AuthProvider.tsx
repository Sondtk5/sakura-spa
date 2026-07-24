import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { AppUser, AuthState } from '../types/auth';
import { DEFAULT_ADMIN } from '../types/auth';

const USERS_KEY = 'sakura_spa_users_v2';
const SESSION_KEY = 'sakura_spa_session_v2';

interface AuthContextType {
  authState: AuthState;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  users: AppUser[];
  addUser: (u: AppUser) => void;
  updateUser: (id: string, u: Partial<AppUser>) => void;
  deleteUser: (id: string) => void;
  hasAccess: (path: string) => boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>(null!);

function loadUsers(): AppUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppUser[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return [DEFAULT_ADMIN];
}

function saveUsers(u: AppUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(u));
}

function loadSession(): AuthState {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AuthState;
      if (parsed && parsed.user) return parsed;
    }
  } catch {}
  return { user: null, isLoggedIn: false };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<AppUser[]>(() => loadUsers());
  const [authState, setAuthState] = useState<AuthState>(() => loadSession());

  useEffect(() => { saveUsers(users); }, [users]);
  useEffect(() => { localStorage.setItem(SESSION_KEY, JSON.stringify(authState)); }, [authState]);

  const login = useCallback((username: string, password: string): boolean => {
    const found = users.find(u => u.username === username && u.password === password && u.active);
    if (found) {
      setAuthState({ user: found, isLoggedIn: true });
      return true;
    }
    return false;
  }, [users]);

  const logout = useCallback(() => {
    setAuthState({ user: null, isLoggedIn: false });
  }, []);

  const addUser = useCallback((u: AppUser) => {
    setUsers(prev => [...prev, u]);
  }, []);

  const updateUser = useCallback((id: string, data: Partial<AppUser>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...data } : u));
  }, []);

  const deleteUser = useCallback((id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
  }, []);

  const hasAccess = useCallback((path: string): boolean => {
    if (!authState.user) return false;
    const role = authState.user.role;
    if (role === 'ADMIN') return true;
    const allowed = {
      SALES: ['/', '/customers', '/services', '/products', '/invoices', '/labels'],
      WAREHOUSE: ['/', '/products', '/inventory', '/labels'],
    };
    const paths = allowed[role] || [];
    return paths.some(p => path.startsWith(p));
  }, [authState.user]);

  const isAdmin = authState.user?.role === 'ADMIN';

  return (
    <AuthContext.Provider value={{ authState, login, logout, users, addUser, updateUser, deleteUser, hasAccess, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
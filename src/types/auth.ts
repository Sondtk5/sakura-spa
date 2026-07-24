/** Auth types for Sakura Spa */

export type UserRole = 'ADMIN' | 'SALES' | 'WAREHOUSE';

export interface AppUser {
  id: string;
  username: string;
  password: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  active: boolean;
  createdAt?: string;
}

export interface AuthState {
  user: AppUser | null;
  isLoggedIn: boolean;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Quản trị',
  SALES: 'Bán hàng',
  WAREHOUSE: 'Kho',
};

export const DEFAULT_ADMIN: AppUser = {
  id: 'admin-1',
  username: 'admin',
  password: 'admin123',
  fullName: 'Quản trị viên',
  email: 'admin@sakuraspa.vn',
  phone: '0988888888',
  role: 'ADMIN',
  active: true,
  createdAt: '2024-01-01',
};
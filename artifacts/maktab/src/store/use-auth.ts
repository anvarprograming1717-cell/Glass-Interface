import { create } from 'zustand';
import { UserRole } from '@workspace/api-client-react';

interface AuthState {
  role: UserRole | null;
  userId: number | null;
  login: (role: UserRole, userId: number) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  const savedRole = localStorage.getItem('maktab-role') as UserRole | null;
  const savedUserId = localStorage.getItem('maktab-userId');

  return {
    role: savedRole,
    userId: savedUserId ? parseInt(savedUserId, 10) : null,
    login: (role, userId) => {
      localStorage.setItem('maktab-role', role);
      localStorage.setItem('maktab-userId', userId.toString());
      set({ role, userId });
    },
    logout: () => {
      localStorage.removeItem('maktab-role');
      localStorage.removeItem('maktab-userId');
      set({ role: null, userId: null });
    }
  };
});

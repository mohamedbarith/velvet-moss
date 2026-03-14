import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import API from '../lib/api';

const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isLoading: false,

            setAuth: (user, token) => {
                localStorage.setItem('vm_token', token);
                set({ user, token });
            },

            login: async (email, password) => {
                set({ isLoading: true });
                try {
                    const { data } = await API.post('/auth/login', { email, password });
                    localStorage.setItem('vm_token', data.token);
                    set({ user: data.user, token: data.token, isLoading: false });
                    return { success: true };
                } catch (err) {
                    set({ isLoading: false });
                    return { success: false, message: err.response?.data?.message || 'Login failed' };
                }
            },

            register: async (name, email, password) => {
                set({ isLoading: true });
                try {
                    const { data } = await API.post('/auth/register', { name, email, password });
                    localStorage.setItem('vm_token', data.token);
                    set({ user: data.user, token: data.token, isLoading: false });
                    return { success: true };
                } catch (err) {
                    set({ isLoading: false });
                    return { success: false, message: err.response?.data?.message || 'Registration failed' };
                }
            },

            logout: () => {
                localStorage.removeItem('vm_token');
                set({ user: null, token: null });
            },

            updateUser: (user) => set({ user }),

            isAdmin: () => get().user?.role === 'admin',
            isLoggedIn: () => !!get().token,
        }),
        {
            name: 'vm_auth',
            partialize: (state) => ({ user: state.user, token: state.token }),
        }
    )
);

export default useAuthStore;

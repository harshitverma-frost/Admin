'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

interface AdminUser {
    email: string;
    name: string;
    role: 'admin';
}

interface AdminAuthContextType {
    user: AdminUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);
const ADMIN_KEY = 'ksp_admin_user';

export function AdminAuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AdminUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(ADMIN_KEY);
            if (stored) setUser(JSON.parse(stored));
        }
        setIsLoading(false);
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        /* Simple admin auth — in production, this would hit the backend */
        if (email && password.length >= 3) {
            const adminUser: AdminUser = {
                email,
                name: email.split('@')[0],
                role: 'admin',
            };
            setUser(adminUser);
            localStorage.setItem(ADMIN_KEY, JSON.stringify(adminUser));
            return { success: true };
        }
        return { success: false, error: 'Invalid credentials' };
    }, []);

    const logout = useCallback(() => {
        setUser(null);
        localStorage.removeItem(ADMIN_KEY);
    }, []);

    return (
        <AdminAuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
            {children}
        </AdminAuthContext.Provider>
    );
}

export function useAdminAuth() {
    const context = useContext(AdminAuthContext);
    if (!context) throw new Error('useAdminAuth must be used within AdminAuthProvider');
    return context;
}

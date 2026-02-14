'use client';

import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/context/AdminAuthContext';
import AdminSidebar from '@/components/AdminSidebar';
import { ReactNode } from 'react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const router = useRouter();
    const { isAuthenticated, isLoading } = useAdminAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-page-bg flex items-center justify-center">
                <div className="h-8 w-40 rounded animate-shimmer" />
            </div>
        );
    }

    if (!isAuthenticated) {
        router.push('/');
        return null;
    }

    return (
        <div className="flex min-h-screen bg-page-bg">
            <AdminSidebar />
            <main className="flex-1 md:ml-64 p-6 pt-16 md:pt-6">
                {children}
            </main>
        </div>
    );
}

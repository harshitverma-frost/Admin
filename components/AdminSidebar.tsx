'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAdminAuth } from '@/context/AdminAuthContext';
import {
    LayoutDashboard, Package, ShoppingCart, Tag, LogOut, Wine, ChevronLeft, Menu,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/products', label: 'Products', icon: Package },
    { href: '/dashboard/orders', label: 'Orders', icon: ShoppingCart },
    { href: '/dashboard/categories', label: 'Categories', icon: Tag },
];

export default function AdminSidebar() {
    const pathname = usePathname();
    const { user, logout } = useAdminAuth();
    const [collapsed, setCollapsed] = useState(false);

    return (
        <>
            {/* Mobile toggle */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="fixed top-4 left-4 z-50 rounded-lg bg-sidebar-bg p-2 text-white md:hidden"
            >
                <Menu className="h-5 w-5" />
            </button>

            <aside
                className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-sidebar-bg text-white transition-all duration-300 ${collapsed ? '-translate-x-full md:translate-x-0 md:w-16' : 'w-64'
                    }`}
            >
                {/* Logo */}
                <div className="flex items-center justify-between px-4 py-5 border-b border-white/10">
                    {!collapsed && (
                        <Link href="/dashboard" className="flex items-center gap-2">
                            <Wine className="h-6 w-6 text-primary-light" />
                            <span className="font-serif text-lg font-bold">KSP Admin</span>
                        </Link>
                    )}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="hidden md:block p-1 rounded hover:bg-sidebar-hover transition-colors"
                    >
                        <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-4 space-y-1">
                    {navItems.map(item => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive
                                        ? 'bg-sidebar-active text-white'
                                        : 'text-white/60 hover:bg-sidebar-hover hover:text-white'
                                    } ${collapsed ? 'justify-center' : ''}`}
                                title={collapsed ? item.label : undefined}
                            >
                                <item.icon className="h-5 w-5 flex-shrink-0" />
                                {!collapsed && <span>{item.label}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="border-t border-white/10 px-3 py-4">
                    {!collapsed && user && (
                        <div className="mb-3 px-3">
                            <p className="text-sm font-medium text-white/80 truncate">{user.name}</p>
                            <p className="text-xs text-white/40 truncate">{user.email}</p>
                        </div>
                    )}
                    <button
                        onClick={logout}
                        className={`flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium text-white/60 hover:bg-sidebar-hover hover:text-white transition-colors ${collapsed ? 'justify-center' : ''
                            }`}
                        title="Sign Out"
                    >
                        <LogOut className="h-5 w-5 flex-shrink-0" />
                        {!collapsed && <span>Sign Out</span>}
                    </button>
                </div>
            </aside>
        </>
    );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, Bell, Moon, Sun, ChevronDown, LogOut, User } from 'lucide-react';
import { useAdminAuth } from '@/context/AdminAuthContext';

interface TopNavbarProps {
    sidebarCollapsed?: boolean;
}

export default function TopNavbar({ sidebarCollapsed }: TopNavbarProps) {
    const { user, logout } = useAdminAuth();
    const [darkMode, setDarkMode] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    return (
        <div className={`sticky top-0 z-30 bg-card-bg/80 backdrop-blur-md border-b border-border transition-all duration-300 ${sidebarCollapsed ? 'md:ml-0' : 'md:ml-0'}`}>
            <div className="flex items-center justify-between px-4 sm:px-6 py-3">
                {/* Search */}
                <div className="relative hidden sm:block w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                    <input
                        type="text"
                        placeholder="Search products, orders..."
                        className="w-full rounded-xl border border-border bg-page-bg py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                    />
                </div>

                {/* Right section */}
                <div className="flex items-center gap-2 ml-auto">
                    {/* Dark mode toggle */}
                    <button
                        onClick={() => setDarkMode(!darkMode)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-text-secondary hover:bg-page-bg hover:text-text-primary transition-colors"
                        title={darkMode ? 'Light mode' : 'Dark mode'}
                    >
                        {darkMode ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
                    </button>

                    {/* Notifications */}
                    <button className="relative flex h-9 w-9 items-center justify-center rounded-xl text-text-secondary hover:bg-page-bg hover:text-text-primary transition-colors">
                        <Bell className="h-[18px] w-[18px]" />
                        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-danger ring-2 ring-card-bg" />
                    </button>

                    {/* Divider */}
                    <div className="hidden sm:block h-8 w-px bg-border mx-1" />

                    {/* Profile dropdown */}
                    <div ref={dropdownRef} className="relative">
                        <button
                            onClick={() => setProfileOpen(!profileOpen)}
                            className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-page-bg transition-colors"
                        >
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white text-xs font-bold">
                                {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                            </div>
                            <div className="hidden sm:block text-left">
                                <p className="text-sm font-medium text-text-primary leading-none">
                                    {user?.name || 'Admin'}
                                </p>
                                <p className="text-[10px] text-text-muted mt-0.5">Administrator</p>
                            </div>
                            <ChevronDown className={`hidden sm:block h-3.5 w-3.5 text-text-muted transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {profileOpen && (
                            <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-border bg-card-bg shadow-xl py-1 animate-slideDown z-50">
                                <div className="px-3 py-2 border-b border-border">
                                    <p className="text-sm font-medium text-text-primary truncate">{user?.name}</p>
                                    <p className="text-xs text-text-muted truncate">{user?.email}</p>
                                </div>
                                <button className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-page-bg hover:text-text-primary transition-colors">
                                    <User className="h-4 w-4" /> Profile
                                </button>
                                <button
                                    onClick={logout}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-red-50 transition-colors"
                                >
                                    <LogOut className="h-4 w-4" /> Sign Out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

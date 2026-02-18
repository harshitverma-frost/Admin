'use client';

import { LucideIcon } from 'lucide-react';

interface DashboardHeaderProps {
    title?: string;
    subtitle?: string;
    buttonLabel?: string;
    onButtonClick?: () => void;
    icon?: LucideIcon;
}

export default function DashboardHeader({
    title = 'AI User Reports for Better Control',
    subtitle = 'Get detailed user reports with one click and optimize your business decisions',
    buttonLabel = 'Generate Auto Reports',
    onButtonClick,
    icon: Icon,
}: DashboardHeaderProps) {
    return (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#722F37] via-[#5A252C] to-[#3D1A1E] p-6 sm:p-8 text-white">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-1/2 w-48 h-48 rounded-full bg-white/5 translate-y-1/2" />
            <div className="absolute top-6 right-10 w-20 h-20 rounded-full bg-white/[0.03]" />

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="max-w-lg">
                    <div className="flex items-center gap-2 mb-2">
                        {Icon && <Icon className="h-5 w-5 text-amber-300/80" />}
                        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300/70">
                            Dashboard
                        </span>
                    </div>
                    <h2 className="font-serif text-xl sm:text-2xl font-bold leading-tight">
                        {title}
                    </h2>
                    <p className="mt-2 text-sm text-white/60 leading-relaxed">
                        {subtitle}
                    </p>
                </div>
                {buttonLabel && (
                    <button
                        onClick={onButtonClick}
                        className="flex-shrink-0 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/25 transition-all duration-200 active:scale-[0.97]"
                    >
                        {buttonLabel}
                    </button>
                )}
            </div>
        </div>
    );
}

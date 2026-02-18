'use client';

import { useState } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

interface SalesDataPoint {
    label: string;
    value: number;
}

interface SalesChartProps {
    data: SalesDataPoint[];
    title?: string;
    period?: string;
    onPeriodChange?: (period: string) => void;
    loading?: boolean;
}

const PERIODS = ['Daily', 'Weekly', 'Monthly'];

export default function SalesChart({
    data,
    title = 'Sales Overview',
    period = 'Monthly',
    onPeriodChange,
    loading = false,
}: SalesChartProps) {
    const [activePeriod, setActivePeriod] = useState(period);

    const handlePeriodChange = (p: string) => {
        setActivePeriod(p);
        onPeriodChange?.(p);
    };

    return (
        <div className="rounded-2xl border border-border bg-card-bg p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <div>
                    <h3 className="font-serif text-base font-semibold text-text-primary">{title}</h3>
                    <p className="text-xs text-text-muted mt-0.5">Revenue performance over time</p>
                </div>
                <div className="flex items-center gap-1 rounded-lg bg-page-bg p-1">
                    {PERIODS.map(p => (
                        <button
                            key={p}
                            onClick={() => handlePeriodChange(p)}
                            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200 ${activePeriod === p
                                ? 'bg-primary text-white shadow-sm'
                                : 'text-text-secondary hover:text-text-primary'
                                }`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="h-[280px] rounded-xl animate-shimmer" />
            ) : data.length === 0 ? (
                <div className="h-[280px] flex items-center justify-center text-sm text-text-muted">
                    No sales data available
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#722F37" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#722F37" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E8E2DA" vertical={false} />
                        <XAxis
                            dataKey="label"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: '#9C9694' }}
                            dy={8}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: '#9C9694' }}
                            tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                        />
                        <Tooltip
                            contentStyle={{
                                background: '#2D2926',
                                border: 'none',
                                borderRadius: '10px',
                                color: '#FAF7F2',
                                fontSize: '13px',
                                padding: '8px 14px',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                            }}
                            formatter={(val: number | undefined) => [`$${(val ?? 0).toLocaleString()}`, 'Revenue']}
                            labelStyle={{ color: '#C9A96E', fontWeight: 600, marginBottom: 4 }}
                        />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#722F37"
                            strokeWidth={2.5}
                            fill="url(#salesGradient)"
                            dot={false}
                            activeDot={{
                                r: 5,
                                stroke: '#722F37',
                                strokeWidth: 2,
                                fill: '#fff',
                            }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}

'use client';

import { useState, useEffect, useMemo } from 'react';
import { getProducts, getOrders, Product, Order } from '@/lib/api';
import { getCategories } from '@/lib/api/category';
import { Category } from '@/types/category';
import Link from 'next/link';
import {
    Package, ShoppingCart, Tag, TrendingUp, Plus, ArrowUpRight, Sparkles,
} from 'lucide-react';

import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StatCard from '@/components/dashboard/StatCard';
import SalesChart from '@/components/dashboard/SalesChart';
import RevenueBreakdown from '@/components/dashboard/RevenueBreakdown';

export default function DashboardPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([getProducts(), getOrders(), getCategories()]).then(([prods, ords, cats]) => {
            setProducts(prods);
            setOrders(ords);
            setCategories(cats);
            setLoading(false);
        });
    }, []);

    // Compute stats dynamically from API data
    const totalRevenue = useMemo(() =>
        orders.reduce((s, o) => s + o.total, 0), [orders]
    );

    const stats = useMemo(() => [
        {
            title: 'Total Sales',
            value: loading ? '—' : `$${totalRevenue.toLocaleString('en-US')}`,
            change: 12.5,
            icon: TrendingUp,
            color: 'bg-emerald-500',
            href: '/dashboard/orders',
        },
        {
            title: 'Total Orders',
            value: loading ? '—' : orders.length,
            change: 8.2,
            icon: ShoppingCart,
            color: 'bg-blue-500',
            href: '/dashboard/orders',
        },
        {
            title: 'Total Products',
            value: loading ? '—' : products.length,
            change: 3.1,
            icon: Package,
            color: 'bg-violet-500',
            href: '/dashboard/products',
        },
        {
            title: 'Categories',
            value: loading ? '—' : categories.length,
            icon: Tag,
            color: 'bg-amber-500',
            href: '/dashboard/categories',
        },
    ], [loading, totalRevenue, orders.length, products.length, categories.length]);

    // Build chart data from orders
    const salesChartData = useMemo(() => {
        if (orders.length === 0) return [];
        const monthMap: Record<string, number> = {};
        orders.forEach(o => {
            const date = new Date(o.created_at);
            const key = date.toLocaleString('en-US', { month: 'short', year: '2-digit' });
            monthMap[key] = (monthMap[key] || 0) + o.total;
        });
        return Object.entries(monthMap).map(([label, value]) => ({ label, value }));
    }, [orders]);

    // Revenue breakdown from orders
    const revenueBreakdown = useMemo(() => {
        // Derive from orders — split proportionally for demo
        const cod = Math.round(totalRevenue * 0.4);
        const online = Math.round(totalRevenue * 0.45);
        const inStore = totalRevenue - cod - online;
        return [
            { label: 'Online Payments', value: online, color: 'bg-primary' },
            { label: 'Cash on Delivery', value: cod, color: 'bg-amber-500' },
            { label: 'In-store Purchases', value: inStore, color: 'bg-emerald-500' },
        ];
    }, [totalRevenue]);

    // Order status badge
    const getStatusClasses = (status: string) => {
        switch (status) {
            case 'confirmed': return 'bg-green-50 text-green-700';
            case 'shipped': return 'bg-blue-50 text-blue-700';
            case 'delivered': return 'bg-purple-50 text-purple-700';
            case 'pending': return 'bg-yellow-50 text-yellow-700';
            default: return 'bg-red-50 text-red-700';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header Banner */}
            <div className="animate-fadeInUp" style={{ animationDelay: '0ms' }}>
                <DashboardHeader icon={Sparkles} />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, i) => (
                    <div
                        key={stat.title}
                        className="animate-fadeInUp"
                        style={{ animationDelay: `${(i + 1) * 80}ms` }}
                    >
                        <StatCard
                            title={stat.title}
                            value={stat.value}
                            change={stat.change}
                            icon={stat.icon}
                            color={stat.color}
                            href={stat.href}
                            loading={loading}
                        />
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
                <div className="animate-fadeInUp" style={{ animationDelay: '400ms' }}>
                    <SalesChart data={salesChartData} loading={loading} />
                </div>
                <div className="animate-fadeInUp" style={{ animationDelay: '480ms' }}>
                    <RevenueBreakdown
                        total={totalRevenue}
                        items={revenueBreakdown}
                        loading={loading}
                    />
                </div>
            </div>

            {/* Recent Orders & Products */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Recent Orders */}
                <div className="rounded-2xl border border-border bg-card-bg animate-fadeInUp" style={{ animationDelay: '560ms' }}>
                    <div className="flex items-center justify-between border-b border-border px-5 py-4">
                        <h2 className="font-serif text-base font-semibold text-text-primary">Recent Orders</h2>
                        <Link href="/dashboard/orders" className="text-xs font-medium text-primary hover:text-primary-dark transition-colors">
                            View All →
                        </Link>
                    </div>
                    <div className="divide-y divide-border">
                        {loading ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="flex items-center justify-between px-5 py-3.5">
                                    <div className="space-y-2">
                                        <div className="h-4 w-28 rounded animate-shimmer" />
                                        <div className="h-3 w-20 rounded animate-shimmer" />
                                    </div>
                                    <div className="h-4 w-16 rounded animate-shimmer" />
                                </div>
                            ))
                        ) : orders.length === 0 ? (
                            <div className="px-5 py-12 text-center text-sm text-text-muted">No orders yet</div>
                        ) : (
                            orders.slice(0, 5).map(order => (
                                <div key={order.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-page-bg/50 transition-colors">
                                    <div>
                                        <p className="text-sm font-medium text-text-primary">{order.customer_name}</p>
                                        <p className="text-xs text-text-muted mt-0.5">{order.id}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-text-primary">${order.total.toLocaleString('en-US')}</p>
                                        <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold mt-0.5 ${getStatusClasses(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Recent Products */}
                <div className="rounded-2xl border border-border bg-card-bg animate-fadeInUp" style={{ animationDelay: '640ms' }}>
                    <div className="flex items-center justify-between border-b border-border px-5 py-4">
                        <h2 className="font-serif text-base font-semibold text-text-primary">Recent Products</h2>
                        <div className="flex items-center gap-3">
                            <Link href="/dashboard/products" className="text-xs font-medium text-primary hover:text-primary-dark transition-colors">
                                View All →
                            </Link>
                            <Link
                                href="/dashboard/products/add"
                                className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-dark transition-colors"
                            >
                                <Plus className="h-3 w-3" /> Add
                            </Link>
                        </div>
                    </div>
                    <div className="divide-y divide-border">
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                                    <div className="h-10 w-10 rounded-xl animate-shimmer flex-shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 w-32 rounded animate-shimmer" />
                                        <div className="h-3 w-20 rounded animate-shimmer" />
                                    </div>
                                </div>
                            ))
                        ) : products.length === 0 ? (
                            <div className="px-5 py-12 text-center">
                                <p className="text-sm text-text-muted mb-3">No products yet</p>
                                <Link
                                    href="/dashboard/products/add"
                                    className="inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
                                >
                                    <Plus className="h-4 w-4" /> Add First Product
                                </Link>
                            </div>
                        ) : (
                            products.slice(0, 5).map(product => (
                                <Link
                                    key={product.product_id}
                                    href={`/dashboard/products/${product.product_id}`}
                                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-page-bg/50 transition-colors group"
                                >
                                    <div className="h-10 w-10 flex-shrink-0 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10 flex items-center justify-center">
                                        {product.images && product.images.length > 0 ? (
                                            <img
                                                src={product.images[0]}
                                                alt={product.product_name}
                                                className="h-10 w-10 rounded-xl object-cover"
                                            />
                                        ) : (
                                            <span className="text-lg">🍷</span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-text-primary truncate group-hover:text-primary transition-colors">
                                            {product.product_name}
                                        </p>
                                        <p className="text-xs text-text-muted">{product.sku}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold text-text-primary">
                                            ${(product.price ?? 0).toLocaleString('en-US')}
                                        </p>
                                        <ArrowUpRight className="h-3.5 w-3.5 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

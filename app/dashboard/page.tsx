'use client';

import { useState, useEffect } from 'react';
import { getProducts, getOrders, getCategories, Product, Order, Category } from '@/lib/api';
import Link from 'next/link';
import { Package, ShoppingCart, Tag, TrendingUp, Plus, ArrowUpRight } from 'lucide-react';

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

    const stats = [
        { label: 'Total Products', value: loading ? '—' : products.length, icon: Package, color: 'bg-blue-50 text-blue-600', href: '/dashboard/products' },
        { label: 'Total Orders', value: orders.length, icon: ShoppingCart, color: 'bg-green-50 text-green-600', href: '/dashboard/orders' },
        { label: 'Categories', value: categories.length, icon: Tag, color: 'bg-purple-50 text-purple-600', href: '/dashboard/categories' },
        { label: 'Revenue', value: `$${orders.reduce((s, o) => s + o.total, 0).toLocaleString('en-US')}`, icon: TrendingUp, color: 'bg-amber-50 text-amber-600', href: '/dashboard/orders' },
    ];

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="font-serif text-2xl font-bold text-text-primary">Dashboard</h1>
                    <p className="text-sm text-text-secondary">Welcome back! Here&apos;s what&apos;s happening today.</p>
                </div>
                <Link
                    href="/dashboard/products/add"
                    className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
                >
                    <Plus className="h-4 w-4" /> Add Product
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                {stats.map(stat => (
                    <Link
                        key={stat.label}
                        href={stat.href}
                        className="group rounded-xl border border-border bg-card-bg p-5 transition-all hover:shadow-md"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.color}`}>
                                <stat.icon className="h-5 w-5" />
                            </div>
                            <ArrowUpRight className="h-4 w-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="font-serif text-2xl font-bold text-text-primary">{stat.value}</p>
                        <p className="mt-0.5 text-xs text-text-secondary">{stat.label}</p>
                    </Link>
                ))}
            </div>

            {/* Recent Orders */}
            <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-xl border border-border bg-card-bg">
                    <div className="flex items-center justify-between border-b border-border px-5 py-4">
                        <h2 className="font-serif text-base font-semibold text-text-primary">Recent Orders</h2>
                        <Link href="/dashboard/orders" className="text-xs font-medium text-primary hover:text-primary-dark">
                            View All →
                        </Link>
                    </div>
                    <div className="divide-y divide-border">
                        {orders.slice(0, 4).map(order => (
                            <div key={order.id} className="flex items-center justify-between px-5 py-3">
                                <div>
                                    <p className="text-sm font-medium text-text-primary">{order.customer_name}</p>
                                    <p className="text-xs text-text-secondary">{order.id}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-semibold text-text-primary">${order.total.toLocaleString('en-US')}</p>
                                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${order.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                        order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                                            order.status === 'delivered' ? 'bg-purple-100 text-purple-700' :
                                                order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-red-100 text-red-700'
                                        }`}>
                                        {order.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Products */}
                <div className="rounded-xl border border-border bg-card-bg">
                    <div className="flex items-center justify-between border-b border-border px-5 py-4">
                        <h2 className="font-serif text-base font-semibold text-text-primary">Recent Products</h2>
                        <Link href="/dashboard/products" className="text-xs font-medium text-primary hover:text-primary-dark">
                            View All →
                        </Link>
                    </div>
                    <div className="divide-y divide-border">
                        {(loading ? [] : products.slice(0, 5)).map(product => (
                            <div key={product.product_id} className="flex items-center gap-3 px-5 py-3">
                                <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-page-bg flex items-center justify-center text-lg">
                                    🍷
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-text-primary truncate">{product.product_name}</p>
                                    <p className="text-xs text-text-secondary">{product.sku}</p>
                                </div>
                                <p className="text-sm font-semibold text-text-primary">
                                    ${(product.price ?? 0).toLocaleString('en-US')}
                                </p>
                            </div>
                        ))}
                        {loading && (
                            <div className="px-5 py-8 text-center text-sm text-text-muted">Loading...</div>
                        )}
                        {!loading && products.length === 0 && (
                            <div className="px-5 py-8 text-center text-sm text-text-muted">No products yet</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

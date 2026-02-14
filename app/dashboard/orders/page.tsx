'use client';

import { useState, useEffect } from 'react';
import { getOrders, updateOrderStatus as apiUpdateStatus, Order } from '@/lib/api';
import { ShoppingCart, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

const statusOptions = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] as const;

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('all');

    useEffect(() => {
        getOrders().then(setOrders);
    }, []);

    const filtered = filterStatus === 'all' ? orders : orders.filter(o => o.status === filterStatus);

    const updateStatus = (orderId: string, newStatus: Order['status']) => {
        setOrders(prev =>
            prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o)
        );
        apiUpdateStatus(orderId, newStatus);
        toast.success(`Order ${orderId} updated to ${newStatus}`);
    };

    const statusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return 'bg-green-100 text-green-700';
            case 'shipped': return 'bg-blue-100 text-blue-700';
            case 'delivered': return 'bg-purple-100 text-purple-700';
            case 'pending': return 'bg-yellow-100 text-yellow-700';
            case 'cancelled': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="font-serif text-2xl font-bold text-text-primary">Orders</h1>
                    <p className="text-sm text-text-secondary">{orders.length} total orders</p>
                </div>
                <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="rounded-lg border border-border bg-card-bg px-3 py-2 text-sm focus:border-primary focus:outline-none"
                >
                    <option value="all">All Statuses</option>
                    {statusOptions.map(s => (
                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                </select>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-border bg-card-bg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-border bg-page-bg">
                                <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Order ID</th>
                                <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Customer</th>
                                <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Items</th>
                                <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Total</th>
                                <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Status</th>
                                <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Date</th>
                                <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center">
                                        <ShoppingCart className="mx-auto h-10 w-10 text-text-muted/40 mb-2" />
                                        <p className="text-sm text-text-muted">No orders found</p>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map(order => (
                                    <tr key={order.id} className="hover:bg-page-bg/50 transition-colors">
                                        <td className="px-4 py-3 font-mono text-sm font-medium text-text-primary">{order.id}</td>
                                        <td className="px-4 py-3">
                                            <p className="text-sm font-medium text-text-primary">{order.customer_name}</p>
                                            <p className="text-xs text-text-secondary">{order.customer_email}</p>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-text-secondary">
                                            {(order.items?.length ?? 0)} item{(order.items?.length ?? 0) > 1 ? 's' : ''}
                                        </td>
                                        <td className="px-4 py-3 text-sm font-semibold text-text-primary">
                                            ${order.total.toLocaleString('en-US')}
                                        </td>
                                        <td className="px-4 py-3">
                                            <select
                                                value={order.status}
                                                onChange={e => updateStatus(order.id, e.target.value as Order['status'])}
                                                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold border-0 cursor-pointer ${statusColor(order.status)}`}
                                            >
                                                {statusOptions.map(s => (
                                                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-text-secondary">
                                            {new Date(order.created_at).toLocaleDateString('en-US')}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() => setSelectedOrder(order)}
                                                className="rounded-lg p-2 text-text-muted hover:text-info hover:bg-blue-50 transition-colors"
                                                title="View details"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Order Detail Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setSelectedOrder(null)}>
                    <div className="w-full max-w-lg mx-4 rounded-2xl border border-border bg-card-bg p-6 shadow-xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-serif text-lg font-bold text-text-primary">Order {selectedOrder.id}</h2>
                            <button onClick={() => setSelectedOrder(null)} className="text-text-muted hover:text-text-primary">✕</button>
                        </div>

                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between"><span className="text-text-secondary">Customer</span><span className="text-text-primary font-medium">{selectedOrder.customer_name}</span></div>
                            <div className="flex justify-between"><span className="text-text-secondary">Email</span><span className="text-text-primary">{selectedOrder.customer_email}</span></div>
                            <div className="flex justify-between"><span className="text-text-secondary">Date</span><span className="text-text-primary">{new Date(selectedOrder.created_at).toLocaleString('en-US')}</span></div>
                            <div className="flex justify-between"><span className="text-text-secondary">Status</span><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusColor(selectedOrder.status)}`}>{selectedOrder.status}</span></div>
                        </div>

                        <div className="mt-4 border-t border-border pt-4">
                            <h3 className="text-sm font-semibold text-text-primary mb-2">Items</h3>
                            <div className="space-y-2">
                                {(selectedOrder.items ?? []).map((item, i) => (
                                    <div key={i} className="flex justify-between text-sm">
                                        <span className="text-text-secondary">{item.product_name} × {item.quantity}</span>
                                        <span className="text-text-primary font-medium">${(item.price * item.quantity).toLocaleString('en-US')}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-4 border-t border-border pt-4 flex justify-between">
                            <span className="font-serif text-base font-bold text-primary">Total</span>
                            <span className="font-serif text-base font-bold text-primary">${selectedOrder.total.toLocaleString('en-US')}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

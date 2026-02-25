'use client';

import { useState, useEffect, useCallback } from 'react';
import { getOrders, getOrderById, updateOrderStatus as apiUpdateStatus, updatePaymentStatus as apiUpdatePayment, Order } from '@/lib/api';
import { ShoppingCart, Eye, X, Package, User, CreditCard, MapPin, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { PaymentToggle } from '@/components/PaymentToggle';

const statusOptions = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] as const;

// Extended order detail — what getOrderById actually returns (standalone, NOT extending Order)
interface OrderDetail {
    id: string;
    order_id?: string;
    customer_name: string;
    customer_email: string;
    total: number;
    status: Order['status'];
    payment_status?: string;
    created_at: string;
    total_tax?: number;
    grand_total?: number;
    order_notes?: string;
    shipping_address?: {
        address_line1?: string;
        address_line2?: string;
        city?: string;
        state?: string;
        pincode?: string;
        country?: string;
    };
    items: {
        order_item_id?: string;
        quantity: number;
        unit_price: number;
        tax_amount?: number;
        line_total?: number;
        price?: number;          // fallback from list view
        product_name?: string;   // from list view dummy OR from detail view
        product?: { product_id: string; product_name: string; brand?: string; product_sku?: string };
        variant?: { variant_id: string; variant_name?: string; size_label?: string; volume_ml?: number };
        thumbnail_url?: string;
    }[];
}

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [updatingPayments, setUpdatingPayments] = useState<Set<string>>(new Set());

    useEffect(() => {
        getOrders().then(setOrders);
    }, []);

    useEffect(() => {
        if (selectedOrder) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [selectedOrder]);

    const filtered = filterStatus === 'all' ? orders : orders.filter(o => o.status === filterStatus);

    const openOrderDetail = useCallback(async (order: Order) => {
        // Set a shell state immediately so the modal opens (shows a loader)
        setSelectedOrder(order as OrderDetail);
        setLoadingDetail(true);
        try {
            const detail = await getOrderById(order.id);
            if (detail) {
                // Merge: prefer list-row customer info (it has the JOIN) over detail row
                setSelectedOrder({
                    ...(detail as unknown as OrderDetail),
                    customer_name: order.customer_name || (detail as any).customer_name || 'N/A',
                    customer_email: order.customer_email || (detail as any).customer_email || '',
                });
            }
        } catch {
            toast.error('Failed to load order details');
        } finally {
            setLoadingDetail(false);
        }
    }, []);

    const updateStatus = (orderId: string, newStatus: Order['status']) => {
        setOrders(prev =>
            prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o)
        );
        if (selectedOrder?.id === orderId) {
            setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : prev);
        }
        apiUpdateStatus(orderId, newStatus);
        toast.success(`Order status updated to ${newStatus}`);
    };

    const updatePayment = async (orderId: string, newStatus: string) => {
        setUpdatingPayments(prev => new Set(prev).add(orderId));

        const targetOrder = orders.find(o => o.id === orderId);
        const prevStatus = targetOrder?.payment_status || 'Unpaid';

        setOrders(prev =>
            prev.map(o => o.id === orderId ? { ...o, payment_status: newStatus } : o)
        );
        if (selectedOrder?.id === orderId) {
            setSelectedOrder(prev => prev ? { ...prev, payment_status: newStatus } : prev);
        }

        try {
            const success = await apiUpdatePayment(orderId, newStatus.toUpperCase());
            if (success) {
                toast.success(`Payment status updated to ${newStatus}`);
            } else {
                throw new Error('API reported failure');
            }
        } catch {
            setOrders(prev =>
                prev.map(o => o.id === orderId ? { ...o, payment_status: prevStatus } : o)
            );
            if (selectedOrder?.id === orderId) {
                setSelectedOrder(prev => prev ? { ...prev, payment_status: prevStatus } : prev);
            }
            toast.error('Failed to update payment status');
        } finally {
            setUpdatingPayments(prev => {
                const next = new Set(prev);
                next.delete(orderId);
                return next;
            });
        }
    };

    const statusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'confirmed': return 'bg-success/15 text-success border-success/20';
            case 'shipped': return 'bg-info/15 text-info border-info/20';
            case 'delivered': return 'bg-gold/15 text-gold border-gold/20';
            case 'pending': return 'bg-warning/15 text-warning border-warning/20';
            case 'cancelled': return 'bg-danger/15 text-danger border-danger/20';
            default: return 'bg-text-muted/15 text-text-muted border-border';
        }
    };

    const paymentColor = (status?: string) => {
        switch (status?.toLowerCase()) {
            case 'paid': return 'bg-success/15 text-success';
            case 'unpaid': return 'bg-warning/15 text-warning';
            case 'refunded': return 'bg-info/15 text-info';
            case 'failed': return 'bg-danger/15 text-danger';
            default: return 'bg-text-muted/15 text-text-muted';
        }
    };

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="font-serif text-2xl font-bold text-gold-soft">Orders</h1>
                    <p className="text-sm text-text-secondary">{orders.length} total orders</p>
                </div>
                <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="rounded-lg border border-border bg-card-bg px-3 py-2 text-sm text-text-primary focus:border-gold/40 focus:outline-none transition-colors duration-300"
                >
                    <option value="all">All Statuses</option>
                    {statusOptions.map(s => (
                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                </select>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-border bg-gradient-to-br from-card-bg to-card-bg-elevated overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-border bg-page-bg">
                                <th className="px-4 py-3 text-xs font-semibold text-gold-muted uppercase tracking-wider">Order ID</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gold-muted uppercase tracking-wider">Customer</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gold-muted uppercase tracking-wider">Items</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gold-muted uppercase tracking-wider">Total</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gold-muted uppercase tracking-wider">Payment</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gold-muted uppercase tracking-wider">Status</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gold-muted uppercase tracking-wider">Date</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gold-muted uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-12 text-center">
                                        <ShoppingCart className="mx-auto h-10 w-10 text-text-muted/40 mb-2" />
                                        <p className="text-sm text-text-muted">No orders found</p>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map(order => (
                                    <tr key={order.id} className="hover:bg-gold/[0.03] transition-all duration-300">
                                        <td className="px-4 py-3 font-mono text-xs text-text-muted max-w-[120px] truncate" title={order.id}>
                                            {order.id.substring(0, 8)}…
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-sm font-medium text-text-primary">{order.customer_name}</p>
                                            <p className="text-xs text-text-muted">{order.customer_email}</p>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-text-secondary">
                                            {(order.items?.length ?? 0)} item{(order.items?.length ?? 0) !== 1 ? 's' : ''}
                                        </td>
                                        <td className="px-4 py-3 text-sm font-semibold text-gold">
                                            ${order.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-4 py-3">
                                            <PaymentToggle
                                                status={order.payment_status ?? 'UNPAID'}
                                                onToggle={(newStatus) => updatePayment(order.id, newStatus)}
                                                disabled={updatingPayments.has(order.id)}
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <select
                                                value={order.status}
                                                onChange={e => updateStatus(order.id, e.target.value as Order['status'])}
                                                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold border cursor-pointer ${statusColor(order.status)}`}
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
                                                onClick={() => openOrderDetail(order)}
                                                className="rounded-lg p-2 text-text-muted hover:text-gold hover:bg-gold/[0.08] transition-all duration-300"
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

            {/* ─── Order Detail Modal ─────────────────────────────── */}
            {selectedOrder && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
                    onClick={() => setSelectedOrder(null)}
                >
                    <div
                        className="relative w-full max-w-2xl rounded-2xl border border-border bg-card-bg-elevated shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-page-bg flex-shrink-0">
                            <div>
                                <h2 className="font-serif text-lg font-bold text-gold-soft">Order Details</h2>
                                <p className="font-mono text-xs text-text-muted mt-0.5">{selectedOrder.id}</p>
                            </div>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="rounded-lg p-2 text-text-muted hover:text-gold hover:bg-gold/[0.08] transition-all"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Loading overlay */}
                        {loadingDetail && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 rounded-2xl">
                                <RefreshCw className="h-6 w-6 text-gold animate-spin" />
                            </div>
                        )}

                        {/* Scrollable content */}
                        <div className="overflow-y-auto flex-1 p-6 space-y-5">

                            {/* Customer + Status row */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="rounded-xl border border-border bg-card-bg p-4 space-y-2">
                                    <div className="flex items-center gap-2 text-gold-muted text-xs font-semibold uppercase tracking-wider mb-3">
                                        <User className="h-3.5 w-3.5" /> Customer
                                    </div>
                                    <p className="text-sm font-semibold text-text-primary">{selectedOrder.customer_name}</p>
                                    <p className="text-xs text-text-muted break-all">{selectedOrder.customer_email}</p>
                                    <p className="text-xs text-text-muted">{new Date(selectedOrder.created_at).toLocaleString('en-US')}</p>
                                </div>

                                <div className="rounded-xl border border-border bg-card-bg p-4 space-y-3">
                                    <div className="flex items-center gap-2 text-gold-muted text-xs font-semibold uppercase tracking-wider mb-3">
                                        <CreditCard className="h-3.5 w-3.5" /> Payment & Status
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-text-secondary">Status</span>
                                        <select
                                            value={selectedOrder.status}
                                            onChange={e => updateStatus(selectedOrder.id, e.target.value as Order['status'])}
                                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold border cursor-pointer ${statusColor(selectedOrder.status)}`}
                                        >
                                            {statusOptions.map(s => (
                                                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-text-secondary">Payment</span>
                                        <PaymentToggle
                                            status={selectedOrder.payment_status ?? 'UNPAID'}
                                            onToggle={(newStatus) => updatePayment(selectedOrder.id, newStatus)}
                                            disabled={updatingPayments.has(selectedOrder.id)}
                                        />
                                    </div>
                                    {selectedOrder.order_notes && (
                                        <div>
                                            <span className="text-xs text-text-muted">Notes: </span>
                                            <span className="text-xs text-text-primary">{selectedOrder.order_notes}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Shipping Address */}
                            {selectedOrder.shipping_address && (
                                <div className="rounded-xl border border-border bg-card-bg p-4">
                                    <div className="flex items-center gap-2 text-gold-muted text-xs font-semibold uppercase tracking-wider mb-3">
                                        <MapPin className="h-3.5 w-3.5" /> Shipping Address
                                    </div>
                                    <p className="text-sm text-text-primary">
                                        {[
                                            selectedOrder.shipping_address.address_line1,
                                            selectedOrder.shipping_address.address_line2,
                                            selectedOrder.shipping_address.city,
                                            selectedOrder.shipping_address.state,
                                            selectedOrder.shipping_address.pincode,
                                            selectedOrder.shipping_address.country,
                                        ].filter(Boolean).join(', ')}
                                    </p>
                                </div>
                            )}

                            {/* Items */}
                            <div className="rounded-xl border border-border bg-card-bg p-4">
                                <div className="flex items-center gap-2 text-gold-muted text-xs font-semibold uppercase tracking-wider mb-3">
                                    <Package className="h-3.5 w-3.5" /> Items ({selectedOrder.items?.length ?? 0})
                                </div>
                                <div className="space-y-3">
                                    {loadingDetail ? (
                                        <p className="text-sm text-text-muted text-center py-4">Loading items…</p>
                                    ) : (selectedOrder.items ?? []).length === 0 ? (
                                        <p className="text-sm text-text-muted">No items found</p>
                                    ) : (
                                        (selectedOrder.items ?? []).map((item, i) => {
                                            const name = item.product?.product_name ?? item.product_name ?? 'Unknown Product';
                                            const variant = item.variant?.variant_name ?? item.variant?.size_label ?? '';
                                            const brand = item.product?.brand;
                                            const unitPrice = item.unit_price ?? item.price ?? 0;
                                            const lineTotal = item.line_total ?? (unitPrice * item.quantity);
                                            const volume = item.variant?.volume_ml ? `${item.variant.volume_ml}ml` : null;

                                            return (
                                                <div key={item.order_item_id ?? i} className="flex items-start gap-3 py-2 border-b border-border-subtle last:border-0">
                                                    <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0 overflow-hidden border border-border">
                                                        {item.thumbnail_url ? (
                                                            <img src={item.thumbnail_url} alt={name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Package className="h-4 w-4 text-gold/60" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-text-primary truncate">{name}</p>
                                                        {brand && <p className="text-xs text-text-muted">{brand}</p>}
                                                        <div className="flex gap-2 mt-0.5 flex-wrap">
                                                            {variant && <span className="text-xs text-text-muted bg-border/30 px-1.5 py-0.5 rounded">{variant}</span>}
                                                            {volume && <span className="text-xs text-text-muted bg-border/30 px-1.5 py-0.5 rounded">{volume}</span>}
                                                            <span className="text-xs text-text-muted">Qty: {item.quantity}</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right flex-shrink-0">
                                                        <p className="text-sm font-semibold text-gold">${lineTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                                                        <p className="text-xs text-text-muted">${unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })} each</p>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            {/* Totals */}
                            <div className="rounded-xl border border-border bg-card-bg p-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-text-secondary">Subtotal</span>
                                    <span className="text-text-primary">${selectedOrder.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                </div>
                                {(selectedOrder as OrderDetail).total_tax != null && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-text-secondary">Tax</span>
                                        <span className="text-text-primary">${(((selectedOrder as OrderDetail).total_tax) ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                )}
                                <div className="flex justify-between pt-2 border-t border-border">
                                    <span className="font-serif text-base font-bold text-gold">Grand Total</span>
                                    <span className="font-serif text-base font-bold text-gold">
                                        ${((selectedOrder as OrderDetail).grand_total ?? selectedOrder.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

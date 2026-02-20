'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { getProducts, deleteProduct, updateStock, Product } from '@/lib/api';
import { Plus, Pencil, Trash2, Search, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import StockControl from '@/components/StockControl';

const LOW_STOCK_THRESHOLD = 10;

export default function ProductsListPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [filtered, setFiltered] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [savingStock, setSavingStock] = useState<Record<string, boolean>>({});

    const loadProducts = async () => {
        setLoading(true);
        const data = await getProducts();
        setProducts(data);
        setFiltered(data);
        setLoading(false);
    };

    useEffect(() => { loadProducts(); }, []);

    useEffect(() => {
        if (!search) { setFiltered(products); return; }
        const q = search.toLowerCase();
        setFiltered(products.filter(p =>
            p.product_name.toLowerCase().includes(q) ||
            p.sku.toLowerCase().includes(q) ||
            p.brand?.toLowerCase().includes(q)
        ));
    }, [search, products]);

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
        const success = await deleteProduct(id);
        if (success) {
            toast.success('Product deleted');
            loadProducts();
        } else {
            toast.error('Failed to delete product');
        }
    };

    const handleStockChange = useCallback((productId: string, newQty: number) => {
        // Optimistic UI update
        setProducts(prev => prev.map(p =>
            p.product_id === productId ? { ...p, quantity: newQty } : p
        ));
    }, []);

    const handleStockSave = useCallback(async (productId: string, newQty: number): Promise<boolean> => {
        setSavingStock(prev => ({ ...prev, [productId]: true }));
        const success = await updateStock(productId, newQty);
        setSavingStock(prev => ({ ...prev, [productId]: false }));
        if (success) {
            toast.success('Stock updated');
        } else {
            toast.error('Failed to update stock');
            // Revert on failure
            loadProducts();
        }
        return success;
    }, []);

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="font-serif text-2xl font-bold text-gold-soft">Products</h1>
                    <p className="text-sm text-text-secondary">{products.length} total products</p>
                </div>
                <Link
                    href="/dashboard/products/add"
                    className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-[#E8D8B9] hover:bg-primary-light border border-gold/10 transition-all duration-300"
                >
                    <Plus className="h-4 w-4" /> Add Product
                </Link>
            </div>

            {/* Search */}
            <div className="mb-4 relative max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search products..."
                    className="w-full rounded-lg border border-border bg-card-bg pl-10 pr-4 py-2.5 text-sm focus:border-gold/40 focus:outline-none transition-colors duration-300"
                />
            </div>

            {/* Table */}
            <div className="rounded-xl border border-border bg-gradient-to-br from-card-bg to-card-bg-elevated overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-border bg-page-bg">
                                <th className="px-4 py-3 text-xs font-semibold text-gold-muted uppercase tracking-wider">Product</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gold-muted uppercase tracking-wider">SKU</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gold-muted uppercase tracking-wider">Category</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gold-muted uppercase tracking-wider">Price</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gold-muted uppercase tracking-wider">ABV %</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gold-muted uppercase tracking-wider">Stock</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gold-muted uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        <td colSpan={7} className="px-4 py-4">
                                            <div className="h-5 animate-shimmer rounded" />
                                        </td>
                                    </tr>
                                ))
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center">
                                        <Package className="mx-auto h-10 w-10 text-text-muted/40 mb-2" />
                                        <p className="text-sm text-text-muted">No products found</p>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map(product => (
                                    <tr key={product.product_id} className="hover:bg-gold/[0.03] transition-all duration-300">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-primary/15 border border-primary/10 flex items-center justify-center text-lg">
                                                    🍷
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-text-primary">{product.product_name}</p>
                                                    {product.brand && <p className="text-xs text-text-muted">{product.brand}</p>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="font-mono text-xs text-text-secondary">{product.sku}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {product.category && (
                                                <span className="inline-block rounded-full bg-gold/10 px-2 py-0.5 text-[10px] font-medium text-gold-muted">
                                                    {product.category}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm font-medium text-gold">
                                            ${(product.price ?? 0).toLocaleString('en-US')}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-text-secondary font-medium tabular-nums">
                                            {product.alcohol_percentage != null ? `${product.alcohol_percentage}%` : '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div>
                                                <StockControl
                                                    value={product.quantity ?? 0}
                                                    onChange={(val) => handleStockChange(product.product_id, val)}
                                                    onSave={(val) => handleStockSave(product.product_id, val)}
                                                    loading={savingStock[product.product_id] || false}
                                                    size="sm"
                                                />
                                                {(product.quantity ?? 0) <= LOW_STOCK_THRESHOLD && (product.quantity ?? 0) >= 0 && (
                                                    <div className="low-stock-badge">
                                                        <span className="low-stock-dot" />
                                                        Low stock
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                <Link
                                                    href={`/dashboard/products/edit/${product.product_id}`}
                                                    className="rounded-lg p-2 text-text-muted hover:text-gold hover:bg-gold/[0.08] transition-all duration-300"
                                                    title="Edit"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(product.product_id, product.product_name)}
                                                    className="rounded-lg p-2 text-text-muted hover:text-danger hover:bg-danger/[0.08] transition-all duration-300"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

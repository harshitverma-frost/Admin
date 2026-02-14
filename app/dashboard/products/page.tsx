'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getProducts, deleteProduct, Product } from '@/lib/api';
import { Plus, Pencil, Trash2, Search, Package } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProductsListPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [filtered, setFiltered] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

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

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="font-serif text-2xl font-bold text-text-primary">Products</h1>
                    <p className="text-sm text-text-secondary">{products.length} total products</p>
                </div>
                <Link
                    href="/dashboard/products/add"
                    className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
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
                    className="w-full rounded-lg border border-border bg-card-bg pl-10 pr-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                />
            </div>

            {/* Table */}
            <div className="rounded-xl border border-border bg-card-bg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-border bg-page-bg">
                                <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Product</th>
                                <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">SKU</th>
                                <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Category</th>
                                <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Price</th>
                                <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Stock</th>
                                <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        <td colSpan={6} className="px-4 py-4">
                                            <div className="h-5 animate-shimmer rounded" />
                                        </td>
                                    </tr>
                                ))
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center">
                                        <Package className="mx-auto h-10 w-10 text-text-muted/40 mb-2" />
                                        <p className="text-sm text-text-muted">No products found</p>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map(product => (
                                    <tr key={product.product_id} className="hover:bg-page-bg/50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-page-bg flex items-center justify-center text-lg">
                                                    🍷
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-text-primary">{product.product_name}</p>
                                                    {product.brand && <p className="text-xs text-text-secondary">{product.brand}</p>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="font-mono text-xs text-text-secondary">{product.sku}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {product.category && (
                                                <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                                                    {product.category}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm font-medium text-text-primary">
                                            ${(product.price ?? 0).toLocaleString('en-US')}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-text-secondary">
                                            {product.quantity ?? '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                <Link
                                                    href={`/dashboard/products/edit/${product.product_id}`}
                                                    className="rounded-lg p-2 text-text-muted hover:text-info hover:bg-blue-50 transition-colors"
                                                    title="Edit"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(product.product_id, product.product_name)}
                                                    className="rounded-lg p-2 text-text-muted hover:text-danger hover:bg-red-50 transition-colors"
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

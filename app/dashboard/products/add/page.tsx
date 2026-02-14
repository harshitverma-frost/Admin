'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createProduct } from '@/lib/api';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function AddProductPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        sku: '',
        product_name: '',
        brand: '',
        category: '',
        sub_category: '',
        description: '',
        unit_of_measure: '',
        intended_use: '',
        price: '',
        quantity: '',
    });

    const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.sku || !form.product_name) {
            toast.error('SKU and Product Name are required');
            return;
        }

        setLoading(true);
        const result = await createProduct({
            sku: form.sku,
            product_name: form.product_name,
            brand: form.brand || undefined,
            category: form.category || undefined,
            sub_category: form.sub_category || undefined,
            description: form.description || undefined,
            unit_of_measure: form.unit_of_measure || undefined,
            intended_use: form.intended_use || undefined,
            price: form.price ? parseFloat(form.price) : undefined,
            quantity: form.quantity ? parseInt(form.quantity) : undefined,
        });
        setLoading(false);

        if (result.success) {
            toast.success('Product created successfully!');
            router.push('/dashboard/products');
        } else {
            toast.error(result.error || 'Failed to create product');
        }
    };

    const categories = ['Red Wine', 'White Wine', 'Rosé', 'Sparkling', 'Dessert Wine', 'Fortified'];

    return (
        <div>
            <div className="flex items-center gap-3 mb-6">
                <Link href="/dashboard/products" className="rounded-lg border border-border p-2 hover:bg-card-bg transition-colors">
                    <ArrowLeft className="h-4 w-4 text-text-secondary" />
                </Link>
                <div>
                    <h1 className="font-serif text-2xl font-bold text-text-primary">Add New Product</h1>
                    <p className="text-sm text-text-secondary">Fill in the details to create a new wine product</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="max-w-3xl">
                <div className="rounded-xl border border-border bg-card-bg p-6 space-y-6">
                    {/* Basic Info */}
                    <div>
                        <h3 className="font-serif text-sm font-semibold text-text-primary mb-4">Basic Information</h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-text-primary mb-1">SKU *</label>
                                <input
                                    type="text"
                                    value={form.sku}
                                    onChange={e => update('sku', e.target.value)}
                                    className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                                    placeholder="WINE-001"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-primary mb-1">Product Name *</label>
                                <input
                                    type="text"
                                    value={form.product_name}
                                    onChange={e => update('product_name', e.target.value)}
                                    className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                                    placeholder="VinoViet Classic Red"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-primary mb-1">Brand</label>
                                <input
                                    type="text"
                                    value={form.brand}
                                    onChange={e => update('brand', e.target.value)}
                                    className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                                    placeholder="KSP Wines"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-primary mb-1">Category</label>
                                <select
                                    value={form.category}
                                    onChange={e => update('category', e.target.value)}
                                    className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-primary focus:outline-none bg-white"
                                >
                                    <option value="">Select category</option>
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-primary mb-1">Sub Category</label>
                                <input
                                    type="text"
                                    value={form.sub_category}
                                    onChange={e => update('sub_category', e.target.value)}
                                    className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                                    placeholder="Cabernet Sauvignon"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-primary mb-1">Unit of Measure</label>
                                <input
                                    type="text"
                                    value={form.unit_of_measure}
                                    onChange={e => update('unit_of_measure', e.target.value)}
                                    className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                                    placeholder="750ml"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-1">Description</label>
                        <textarea
                            value={form.description}
                            onChange={e => update('description', e.target.value)}
                            rows={4}
                            className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-primary focus:outline-none resize-none"
                            placeholder="Describe the wine's flavor profile, origin, and characteristics..."
                        />
                    </div>

                    {/* Intended Use */}
                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-1">Intended Use</label>
                        <input
                            type="text"
                            value={form.intended_use}
                            onChange={e => update('intended_use', e.target.value)}
                            className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                            placeholder="Pairs well with grilled meats and aged cheeses"
                        />
                    </div>

                    {/* Pricing */}
                    <div>
                        <h3 className="font-serif text-sm font-semibold text-text-primary mb-4">Pricing & Stock</h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-text-primary mb-1">Price ($)</label>
                                <input
                                    type="number"
                                    value={form.price}
                                    onChange={e => update('price', e.target.value)}
                                    className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                                    placeholder="450000"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-primary mb-1">Stock Quantity</label>
                                <input
                                    type="number"
                                    value={form.quantity}
                                    onChange={e => update('quantity', e.target.value)}
                                    className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                                    placeholder="100"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex items-center gap-3">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
                    >
                        <Save className="h-4 w-4" />
                        {loading ? 'Creating...' : 'Create Product'}
                    </button>
                    <Link
                        href="/dashboard/products"
                        className="rounded-lg border border-border px-6 py-3 text-sm font-medium text-text-secondary hover:bg-card-bg transition-colors"
                    >
                        Cancel
                    </Link>
                </div>
            </form>
        </div>
    );
}

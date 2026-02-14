'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { getProduct, updateProduct } from '@/lib/api';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Props {
    params: Promise<{ id: string }>;
}

export default function EditProductPage({ params }: Props) {
    const { id } = use(params);
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        sku: '',
        product_name: '',
        brand: '',
        category: '',
        sub_category: '',
        description: '',
        unit_of_measure: '',
        intended_use: '',
    });

    useEffect(() => {
        getProduct(id).then(product => {
            if (product) {
                setForm({
                    sku: product.sku || '',
                    product_name: product.product_name || '',
                    brand: product.brand || '',
                    category: product.category || '',
                    sub_category: product.sub_category || '',
                    description: product.description || '',
                    unit_of_measure: product.unit_of_measure || '',
                    intended_use: product.intended_use || '',
                });
            }
            setLoading(false);
        });
    }, [id]);

    const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const result = await updateProduct(id, form);
        setSaving(false);

        if (result.success) {
            toast.success('Product updated!');
            router.push('/dashboard/products');
        } else {
            toast.error(result.error || 'Failed to update');
        }
    };

    const categories = ['Red Wine', 'White Wine', 'Rosé', 'Sparkling', 'Dessert Wine', 'Fortified'];

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="h-8 w-48 animate-shimmer rounded" />
                <div className="h-64 animate-shimmer rounded-xl" />
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center gap-3 mb-6">
                <Link href="/dashboard/products" className="rounded-lg border border-border p-2 hover:bg-card-bg transition-colors">
                    <ArrowLeft className="h-4 w-4 text-text-secondary" />
                </Link>
                <div>
                    <h1 className="font-serif text-2xl font-bold text-text-primary">Edit Product</h1>
                    <p className="text-sm text-text-secondary">Update details for {form.product_name}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="max-w-3xl">
                <div className="rounded-xl border border-border bg-card-bg p-6 space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium text-text-primary mb-1">SKU</label>
                            <input type="text" value={form.sku} onChange={e => update('sku', e.target.value)}
                                className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-primary focus:outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-primary mb-1">Product Name</label>
                            <input type="text" value={form.product_name} onChange={e => update('product_name', e.target.value)}
                                className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-primary focus:outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-primary mb-1">Brand</label>
                            <input type="text" value={form.brand} onChange={e => update('brand', e.target.value)}
                                className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-primary focus:outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-primary mb-1">Category</label>
                            <select value={form.category} onChange={e => update('category', e.target.value)}
                                className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-primary focus:outline-none bg-white">
                                <option value="">Select</option>
                                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-primary mb-1">Sub Category</label>
                            <input type="text" value={form.sub_category} onChange={e => update('sub_category', e.target.value)}
                                className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-primary focus:outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-primary mb-1">Unit of Measure</label>
                            <input type="text" value={form.unit_of_measure} onChange={e => update('unit_of_measure', e.target.value)}
                                className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-primary focus:outline-none" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-1">Description</label>
                        <textarea value={form.description} onChange={e => update('description', e.target.value)} rows={4}
                            className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-primary focus:outline-none resize-none" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-1">Intended Use</label>
                        <input type="text" value={form.intended_use} onChange={e => update('intended_use', e.target.value)}
                            className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-primary focus:outline-none" />
                    </div>
                </div>

                <div className="mt-6 flex items-center gap-3">
                    <button type="submit" disabled={saving}
                        className="flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-dark transition-colors disabled:opacity-50">
                        <Save className="h-4 w-4" />
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <Link href="/dashboard/products"
                        className="rounded-lg border border-border px-6 py-3 text-sm font-medium text-text-secondary hover:bg-card-bg transition-colors">
                        Cancel
                    </Link>
                </div>
            </form>
        </div>
    );
}

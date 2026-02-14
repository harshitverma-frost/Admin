'use client';

import { useState, useEffect } from 'react';
import { getCategories, createCategory, updateCategory, deleteCategory, Category } from '@/lib/api';
import { Plus, Pencil, Trash2, Tag } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState({ name: '', description: '' });

    const loadCategories = async () => {
        const cats = await getCategories();
        setCategories(cats);
        setLoading(false);
    };

    useEffect(() => { loadCategories(); }, []);

    const handleSave = async () => {
        if (!form.name) { toast.error('Name is required'); return; }

        if (editId) {
            const result = await updateCategory(editId, { name: form.name, description: form.description });
            if (result.success) {
                toast.success('Category updated');
                loadCategories();
            } else {
                toast.error(result.error || 'Failed to update');
            }
        } else {
            const slug = form.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            const result = await createCategory({ name: form.name, slug, description: form.description });
            if (result.success) {
                toast.success('Category added');
                loadCategories();
            } else {
                toast.error(result.error || 'Failed to create');
            }
        }

        setForm({ name: '', description: '' });
        setShowForm(false);
        setEditId(null);
    };

    const handleEdit = (cat: Category) => {
        setForm({ name: cat.name, description: cat.description });
        setEditId(cat.id);
        setShowForm(true);
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Delete "${name}"?`)) return;
        const success = await deleteCategory(id);
        if (success) {
            toast.success('Category deleted');
            loadCategories();
        } else {
            toast.error('Failed to delete');
        }
    };

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="font-serif text-2xl font-bold text-text-primary">Categories</h1>
                    <p className="text-sm text-text-secondary">{categories.length} categories</p>
                </div>
                <button
                    onClick={() => { setShowForm(true); setEditId(null); setForm({ name: '', description: '' }); }}
                    className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
                >
                    <Plus className="h-4 w-4" /> Add Category
                </button>
            </div>

            {/* Form */}
            {showForm && (
                <div className="mb-6 rounded-xl border border-border bg-card-bg p-5">
                    <h3 className="font-serif text-sm font-semibold text-text-primary mb-4">
                        {editId ? 'Edit Category' : 'New Category'}
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium text-text-primary mb-1">Name</label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                                placeholder="Category name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-primary mb-1">Description</label>
                            <input
                                type="text"
                                value={form.description}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                                className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                                placeholder="Brief description"
                            />
                        </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                        <button onClick={handleSave}
                            className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-dark transition-colors">
                            {editId ? 'Update' : 'Add'}
                        </button>
                        <button onClick={() => { setShowForm(false); setEditId(null); }}
                            className="rounded-lg border border-border px-5 py-2 text-sm font-medium text-text-secondary hover:bg-page-bg transition-colors">
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Categories Grid */}
            {loading ? (
                <p className="text-sm text-text-secondary">Loading categories...</p>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {categories.map(cat => (
                        <div key={cat.id} className="rounded-xl border border-border bg-card-bg p-5 transition-all hover:shadow-md">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                    <Tag className="h-5 w-5 text-primary" />
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => handleEdit(cat)}
                                        className="rounded-lg p-1.5 text-text-muted hover:text-info hover:bg-blue-50 transition-colors">
                                        <Pencil className="h-3.5 w-3.5" />
                                    </button>
                                    <button onClick={() => handleDelete(cat.id, cat.name)}
                                        className="rounded-lg p-1.5 text-text-muted hover:text-danger hover:bg-red-50 transition-colors">
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>
                            <h3 className="font-serif text-base font-semibold text-text-primary">{cat.name}</h3>
                            <p className="mt-0.5 text-xs text-text-secondary">{cat.description}</p>
                            <p className="mt-3 text-xs font-medium text-primary">{cat.product_count ?? 0} products</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}


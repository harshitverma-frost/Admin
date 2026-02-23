'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import {
    getProduct,
    updateProduct,
    updateStock,
    uploadProductImage,
    getProductImages,
    deleteProductImage,
    setPrimaryImage
} from '@/lib/api';
import { getCategories } from '@/lib/api/category';
import { Category } from '@/types/category';
import { ArrowLeft, Save, Upload, X, Star, Trash2, Loader2, Package, Ruler, Image as ImageIcon, Info } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import StockControl from '@/components/StockControl';

interface ExistingImage {
    asset_id: string;
    base64_data: string;
    mime_type: string;
    file_name: string;
    is_primary: boolean;
    sort_order: number;
}

interface NewImagePreview {
    file: File;
    base64: string;
    preview: string;
}

interface Props {
    params: Promise<{ id: string }>;
}

const TABS = [
    { id: 'general', label: 'General Info', icon: Info },
    { id: 'dimensions', label: 'Dimensions', icon: Ruler },
    { id: 'inventory', label: 'Inventory & Pricing', icon: Package },
    { id: 'images', label: 'Images', icon: ImageIcon },
];

export default function EditProductPage({ params }: Props) {
    const { id } = use(params);
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('general');

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
    const [newImages, setNewImages] = useState<NewImagePreview[]>([]);
    const [uploadingImages, setUploadingImages] = useState(false);
    const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [categories, setCategories] = useState<Category[]>([]);

    const [uomValue, setUomValue] = useState('');
    const [uomUnit, setUomUnit] = useState('ml');

    const [stockValue, setStockValue] = useState(0);
    const [savingStock, setSavingStock] = useState(false);
    const [adjustMode, setAdjustMode] = useState(false);
    const [adjustAmount, setAdjustAmount] = useState('');

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
        country_of_origin: '',
        length_cm: '',
        width_cm: '',
        height_cm: '',
        weight_kg: '',
    });

    useEffect(() => {
        Promise.all([
            getProduct(id),
            getProductImages(id),
            getCategories(),
        ]).then(([product, images, cats]) => {
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
                    price: product.price != null ? String(product.price) : '',
                    country_of_origin: product.country_of_origin || product.specifications?.country_of_origin || '',
                    length_cm: product.specifications?.length_cm != null ? String(product.specifications.length_cm) : '',
                    width_cm: product.specifications?.width_cm != null ? String(product.specifications.width_cm) : '',
                    height_cm: product.specifications?.height_cm != null ? String(product.specifications.height_cm) : '',
                    weight_kg: product.specifications?.weight_kg != null ? String(product.specifications.weight_kg) : '',
                });
                setStockValue(product.quantity ?? 0);

                if (product.unit_of_measure) {
                    const match = product.unit_of_measure.match(/^([\d.]+)\s*(.*)$/);
                    if (match) {
                        setUomValue(match[1]);
                        setUomUnit(match[2].trim() || 'ml');
                    } else {
                        setUomValue('');
                        setUomUnit('Other');
                    }
                }
            }
            if (Array.isArray(images)) {
                setExistingImages(images as ExistingImage[]);
            }
            setCategories(cats);
            setLoading(false);
        });
    }, [id]);

    const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

    const handleUomChange = (val: string, type: 'value' | 'unit') => {
        let v = uomValue;
        let u = uomUnit;
        if (type === 'value') v = val;
        if (type === 'unit') u = val;
        setUomValue(v);
        setUomUnit(u);
        if (v) update('unit_of_measure', `${v} ${u}`.trim());
        else update('unit_of_measure', '');
    };

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const handleFileSelect = async (files: FileList | null) => {
        if (!files) return;
        const previews: NewImagePreview[] = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (!file.type.startsWith('image/')) {
                toast.error(`${file.name} is not an image file`);
                continue;
            }
            if (file.size > 5 * 1024 * 1024) {
                toast.error(`${file.name} is too large (max 5MB)`);
                continue;
            }
            const base64 = await fileToBase64(file);
            previews.push({ file, base64, preview: URL.createObjectURL(file) });
        }
        setNewImages(prev => [...prev, ...previews]);
    };

    const removeNewImage = (index: number) => {
        setNewImages(prev => {
            const updated = [...prev];
            URL.revokeObjectURL(updated[index].preview);
            updated.splice(index, 1);
            return updated;
        });
    };

    const handleDeleteExisting = async (assetId: string) => {
        setDeletingImageId(assetId);
        const ok = await deleteProductImage(id, assetId);
        setDeletingImageId(null);
        if (ok) {
            setExistingImages(prev => prev.filter(img => img.asset_id !== assetId));
            toast.success('Image deleted');
        } else {
            toast.error('Failed to delete image');
        }
    };

    const handleSetPrimary = async (assetId: string) => {
        const ok = await setPrimaryImage(id, assetId);
        if (ok) {
            setExistingImages(prev =>
                prev.map(img => ({ ...img, is_primary: img.asset_id === assetId }))
            );
            toast.success('Primary image updated');
        } else {
            toast.error('Failed to set primary image');
        }
    };

    const handleUploadNewImages = async () => {
        if (newImages.length === 0) return;
        setUploadingImages(true);
        let successCount = 0;
        for (const img of newImages) {
            const result = await uploadProductImage(id, img.base64, {
                file_name: img.file.name,
                is_primary: existingImages.length === 0 && successCount === 0,
            });
            if (result.success) successCount++;
            else toast.error(`Failed to upload ${img.file.name}`);
        }
        setUploadingImages(false);
        if (successCount > 0) {
            toast.success(`${successCount} image(s) uploaded!`);
            setNewImages([]);
            const updated = await getProductImages(id);
            if (Array.isArray(updated)) setExistingImages(updated as ExistingImage[]);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        handleFileSelect(e.dataTransfer.files);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        if (newImages.length > 0) {
            await handleUploadNewImages();
        }

        const result = await updateProduct(id, {
            sku: form.sku,
            product_name: form.product_name,
            brand: form.brand || undefined,
            category: form.category || undefined,
            sub_category: form.sub_category || undefined,
            description: form.description || undefined,
            unit_of_measure: form.unit_of_measure || undefined,
            intended_use: form.intended_use || undefined,
            price: form.price ? parseFloat(form.price) : undefined,
            specifications: {
                country_of_origin: form.country_of_origin || undefined,
                length_cm: form.length_cm ? parseFloat(form.length_cm) : undefined,
                width_cm: form.width_cm ? parseFloat(form.width_cm) : undefined,
                height_cm: form.height_cm ? parseFloat(form.height_cm) : undefined,
                weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : undefined,
            }
        });

        setSaving(false);

        if (result.success) {
            toast.success('Product updated!');
            router.push('/dashboard/products');
        } else {
            toast.error(result.error || 'Failed to update');
        }
    };

    const countries = [
        'France', 'Italy', 'Spain', 'USA', 'Australia',
        'Argentina', 'Chile', 'Germany', 'Portugal', 'India', 'South Africa'
    ];

    const unitOptions = ['ml', 'L', 'oz', 'g', 'kg', 'Pack', 'Bottle', 'Can', 'Other'];

    const parentCategories = categories.filter(c => !c.parent_id);
    const selectedParent = categories.find(c => !c.parent_id && c.name === form.category);
    const subCategories = selectedParent
        ? categories.filter(c => c.parent_id === selectedParent.category_id)
        : [];

    const handleCategoryChange = (value: string) => {
        update('category', value);
        update('sub_category', '');
    };

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
                <Link href="/dashboard/products" className="rounded-lg border border-border p-2 hover:bg-gold/[0.06] hover:border-gold/20 transition-all duration-300">
                    <ArrowLeft className="h-4 w-4 text-text-muted" />
                </Link>
                <div>
                    <h1 className="font-serif text-2xl font-bold text-gold-soft">Edit Product</h1>
                    <p className="text-sm text-text-secondary">Update details for {form.product_name}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="max-w-5xl flex flex-col lg:flex-row gap-6">
                {/* Left Sidebar - Tabs */}
                <div className="w-full lg:w-64 flex-shrink-0">
                    <div className="rounded-xl border border-border bg-card-bg p-2 sticky top-6">
                        <nav className="flex flex-col gap-1">
                            {TABS.map(tab => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-3 w-full px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${isActive
                                            ? 'bg-gold/[0.08] text-gold-soft border border-gold/20'
                                            : 'text-text-secondary hover:bg-white/5 hover:text-text-primary border border-transparent'
                                            }`}
                                    >
                                        <Icon className={`h-4 w-4 ${isActive ? 'text-gold' : 'text-text-muted'}`} />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </nav>

                        {/* Actions in Sidebar */}
                        <div className="mt-8 px-2 space-y-3">
                            <button
                                type="submit"
                                disabled={saving || uploadingImages}
                                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-[#E8D8B9] hover:bg-primary-light border border-gold/10 transition-all duration-300 disabled:opacity-50"
                            >
                                <Save className="h-4 w-4" />
                                {uploadingImages ? 'Uploading...' : saving ? 'Saving...' : 'Save Changes'}
                            </button>
                            <Link
                                href="/dashboard/products"
                                className="flex w-full items-center justify-center rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text-secondary hover:text-gold hover:border-gold/30 transition-all duration-300"
                            >
                                Cancel
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Right Content Area */}
                <div className="flex-1 rounded-xl border border-border bg-gradient-to-br from-card-bg to-card-bg-elevated p-6 min-h-[500px]">

                    {/* TAB: GENERAL INFO */}
                    {activeTab === 'general' && (
                        <div className="space-y-6 animate-fade-in-up">
                            <h3 className="font-serif text-lg font-semibold text-gold-soft border-b border-border pb-3">Basic Information</h3>
                            <div className="grid gap-6 sm:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-text-primary mb-1">SKU *</label>
                                    <input type="text" value={form.sku} onChange={e => update('sku', e.target.value)}
                                        className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-gold/40 focus:outline-none" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-primary mb-1">Product Name *</label>
                                    <input type="text" value={form.product_name} onChange={e => update('product_name', e.target.value)}
                                        className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-primary focus:outline-none" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-primary mb-1">Brand</label>
                                    <input type="text" value={form.brand} onChange={e => update('brand', e.target.value)}
                                        className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-primary focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-primary mb-1">Category</label>
                                    <select value={form.category} onChange={e => handleCategoryChange(e.target.value)}
                                        className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-primary focus:outline-none bg-white">
                                        <option value="">Select category</option>
                                        {parentCategories.map(cat => (
                                            <option key={cat.category_id} value={cat.name}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-primary mb-1">Sub Category</label>
                                    <select value={form.sub_category} onChange={e => update('sub_category', e.target.value)}
                                        className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-primary focus:outline-none bg-white"
                                        disabled={!form.category || subCategories.length === 0}>
                                        <option value="">
                                            {!form.category ? 'Select a category first' : subCategories.length === 0 ? 'No subcategories' : 'Select sub category'}
                                        </option>
                                        {subCategories.map(cat => (
                                            <option key={cat.category_id} value={cat.name}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-primary mb-1">Country of Origin</label>
                                    <select value={form.country_of_origin} onChange={e => update('country_of_origin', e.target.value)}
                                        className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-gold/40 focus:outline-none bg-white text-gray-900">
                                        <option value="">Select country</option>
                                        {countries.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-primary mb-1">Capacity / Unit</label>
                                    <div className="flex rounded-lg border border-border bg-white overflow-hidden focus-within:border-gold/40 focus-within:ring-1 focus-within:ring-gold/40 transition-all">
                                        <input
                                            type="text"
                                            value={uomValue}
                                            onChange={(e) => handleUomChange(e.target.value, 'value')}
                                            placeholder="e.g. 750"
                                            className="w-1/2 px-4 py-2.5 text-sm focus:outline-none bg-transparent"
                                        />
                                        <div className="w-px bg-border"></div>
                                        <select
                                            value={uomUnit}
                                            onChange={(e) => handleUomChange(e.target.value, 'unit')}
                                            className="w-1/2 px-3 py-2.5 text-sm focus:outline-none bg-transparent text-gray-900"
                                        >
                                            {unitOptions.map(u => (
                                                <option key={u} value={u}>{u}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-primary mb-1">Intended Use</label>
                                    <input type="text" value={form.intended_use} onChange={e => update('intended_use', e.target.value)}
                                        className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-primary focus:outline-none" />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-text-primary mb-1">Description</label>
                                    <textarea value={form.description} onChange={e => update('description', e.target.value)} rows={4}
                                        className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-primary focus:outline-none resize-none" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: DIMENSIONS */}
                    {activeTab === 'dimensions' && (
                        <div className="space-y-6 animate-fade-in-up">
                            <h3 className="font-serif text-lg font-semibold text-gold-soft border-b border-border pb-3">Physical Dimensions</h3>
                            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-primary mb-1">Length (cm)</label>
                                    <input type="number" step="0.1" value={form.length_cm} onChange={e => update('length_cm', e.target.value)}
                                        className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-primary focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-primary mb-1">Width (cm)</label>
                                    <input type="number" step="0.1" value={form.width_cm} onChange={e => update('width_cm', e.target.value)}
                                        className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-primary focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-primary mb-1">Height (cm)</label>
                                    <input type="number" step="0.1" value={form.height_cm} onChange={e => update('height_cm', e.target.value)}
                                        className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-primary focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-primary mb-1">Weight (kg)</label>
                                    <input type="number" step="0.01" value={form.weight_kg} onChange={e => update('weight_kg', e.target.value)}
                                        className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-primary focus:outline-none" />
                                </div>
                            </div>
                            <p className="text-xs text-text-muted mt-2">These dimensions refer to the individual product or its immediate packaging.</p>
                        </div>
                    )}

                    {/* TAB: INVENTORY */}
                    {activeTab === 'inventory' && (
                        <div className="space-y-6 animate-fade-in-up">
                            <h3 className="font-serif text-lg font-semibold text-gold-soft border-b border-border pb-3">Pricing & Stock</h3>
                            <div className="grid gap-6 sm:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-text-primary mb-1">Price ($)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">$</span>
                                        <input
                                            type="number" step="0.01" value={form.price}
                                            onChange={e => update('price', e.target.value)}
                                            className="w-full rounded-lg border border-border pl-8 pr-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <StockControl
                                        value={stockValue}
                                        onChange={setStockValue}
                                        onSave={async (val) => {
                                            setSavingStock(true);
                                            const ok = await updateStock(id, val);
                                            setSavingStock(false);
                                            if (ok) toast.success('Stock updated');
                                            else toast.error('Failed to update stock');
                                            return ok;
                                        }}
                                        loading={savingStock}
                                        min={0}
                                        size="md"
                                        showLabel
                                        label="Current Stock"
                                    />

                                    <div className="mt-4">
                                        <button
                                            type="button"
                                            onClick={() => setAdjustMode(!adjustMode)}
                                            className="text-xs font-medium text-gold-muted hover:text-gold transition-all duration-300 flex items-center gap-1"
                                        >
                                            {adjustMode ? '✕ Close quick adjust' : '⚡ Quick adjust stock (+/-)'}
                                        </button>

                                        {adjustMode && (
                                            <div className="mt-3 flex flex-wrap items-center gap-2 p-3 rounded-lg bg-card-bg-elevated border border-border animate-fade-in-up">
                                                <input
                                                    type="number"
                                                    value={adjustAmount}
                                                    onChange={e => setAdjustAmount(e.target.value)}
                                                    placeholder="e.g. 10 or -5"
                                                    className="w-24 rounded-lg border border-border px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
                                                />
                                                <button
                                                    type="button"
                                                    disabled={!adjustAmount || savingStock}
                                                    onClick={async () => {
                                                        const delta = parseInt(adjustAmount);
                                                        if (isNaN(delta)) { toast.error('Enter a valid number'); return; }
                                                        const newVal = Math.max(0, stockValue + delta);
                                                        setStockValue(newVal);
                                                        setSavingStock(true);
                                                        const ok = await updateStock(id, newVal);
                                                        setSavingStock(false);
                                                        if (ok) {
                                                            toast.success(`Stock adjusted by ${delta > 0 ? '+' : ''}${delta}`);
                                                            setAdjustAmount('');
                                                        } else {
                                                            toast.error('Failed to adjust stock');
                                                            setStockValue(stockValue);
                                                        }
                                                    }}
                                                    className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-[#E8D8B9] hover:bg-primary-light border border-gold/10 transition-all duration-300 disabled:opacity-50"
                                                >
                                                    Apply
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: IMAGES */}
                    {activeTab === 'images' && (
                        <div className="space-y-6 animate-fade-in-up">
                            <h3 className="font-serif text-lg font-semibold text-gold-soft border-b border-border pb-3">Product Images</h3>

                            {/* Existing Images */}
                            {existingImages.length > 0 && (
                                <div className="mb-6">
                                    <p className="text-xs font-medium text-text-primary mb-3">Current Images ({existingImages.length})</p>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {existingImages.map(img => (
                                            <div key={img.asset_id} className="relative group rounded-lg overflow-hidden border border-border bg-card-bg-elevated animate-fade-in-up">
                                                <img
                                                    src={img.base64_data}
                                                    alt={img.file_name || 'Product image'}
                                                    className="w-full h-32 object-cover"
                                                />
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.preventDefault(); handleSetPrimary(img.asset_id); }}
                                                        className={`p-1.5 rounded-full transition-all duration-300 ${img.is_primary ? 'bg-gold text-page-bg' : 'bg-white/10 text-white hover:bg-gold hover:text-page-bg'}`}
                                                        title={img.is_primary ? 'Primary image' : 'Set as primary'}
                                                    >
                                                        <Star className="h-4 w-4" fill={img.is_primary ? 'currentColor' : 'none'} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.preventDefault(); handleDeleteExisting(img.asset_id); }}
                                                        disabled={deletingImageId === img.asset_id}
                                                        className="p-1.5 rounded-full bg-white/10 text-danger hover:bg-danger hover:text-white transition-all duration-300 disabled:opacity-50"
                                                        title="Delete image"
                                                    >
                                                        {deletingImageId === img.asset_id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="h-4 w-4" />
                                                        )}
                                                    </button>
                                                </div>
                                                <div className="px-2 py-1.5 bg-card-bg/80 backdrop-blur-sm absolute bottom-0 w-full left-0 border-t border-border/50">
                                                    <p className="text-xs text-text-primary truncate font-medium">{img.file_name || 'Image'}</p>
                                                    {img.is_primary && (
                                                        <span className="text-[10px] font-bold text-gold drop-shadow-sm">★ PRIMARY</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Upload Area */}
                            <div
                                onDrop={handleDrop}
                                onDragOver={e => e.preventDefault()}
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-gold/40 hover:bg-gold/[0.04] transition-all duration-300 bg-page-bg/50"
                            >
                                <Upload className="h-8 w-8 text-text-secondary mx-auto mb-3" />
                                <p className="text-sm font-medium text-text-primary">Click to upload or drag & drop</p>
                                <p className="text-xs text-text-secondary mt-1">PNG, JPG, WebP up to 10MB each</p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                    multiple
                                    onChange={e => handleFileSelect(e.target.files)}
                                    className="hidden"
                                />
                            </div>

                            {/* New Previews */}
                            {newImages.length > 0 && (
                                <div className="mt-6">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 bg-gold/[0.04] border border-gold/10 p-3 rounded-lg">
                                        <p className="text-sm font-medium text-gold-soft">Ready to upload ({newImages.length})</p>
                                        <button
                                            type="button"
                                            onClick={(e) => { e.preventDefault(); handleUploadNewImages(); }}
                                            disabled={uploadingImages}
                                            className="flex items-center justify-center gap-1.5 bg-gold text-page-bg px-4 py-2 rounded-lg text-xs font-bold hover:bg-gold-light disabled:opacity-50 transition-colors duration-300"
                                        >
                                            {uploadingImages ? (
                                                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading...</>
                                            ) : (
                                                <><Upload className="h-3.5 w-3.5" /> Upload Now</>
                                            )}
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {newImages.map((img, index) => (
                                            <div key={index} className="relative group rounded-lg overflow-hidden border border-dashed border-gold/30 bg-page-bg animate-fade-in-up">
                                                <img
                                                    src={img.preview}
                                                    alt={img.file.name}
                                                    className="w-full h-28 object-cover opacity-80"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.preventDefault(); removeNewImage(index); }}
                                                    className="absolute top-2 right-2 bg-danger text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg hover:scale-110"
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                </button>
                                                <div className="px-2 py-1.5 absolute bottom-0 w-full left-0 bg-card-bg/90 backdrop-blur-md">
                                                    <p className="text-[10px] text-text-primary truncate font-medium">{img.file.name}</p>
                                                    <span className="text-[9px] font-bold text-success">PENDING...</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </form>
        </div>
    );
}

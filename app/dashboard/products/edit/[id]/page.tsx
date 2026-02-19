'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { getProduct, updateProduct, updateStock, uploadProductImage, getProductImages, deleteProductImage, setPrimaryImage } from '@/lib/api';
import { ArrowLeft, Save, Upload, X, Star, Trash2, ImageIcon, Loader2 } from 'lucide-react';
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

export default function EditProductPage({ params }: Props) {
    const { id } = use(params);
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
    const [newImages, setNewImages] = useState<NewImagePreview[]>([]);
    const [uploadingImages, setUploadingImages] = useState(false);
    const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
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
    });

    useEffect(() => {
        Promise.all([
            getProduct(id),
            getProductImages(id),
        ]).then(([product, images]) => {
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
                    country_of_origin: product.country_of_origin || '',
                });
                setStockValue(product.quantity ?? 0);
            }
            if (Array.isArray(images)) {
                setExistingImages(images as ExistingImage[]);
            }
            setLoading(false);
        });
    }, [id]);

    const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

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
            // Refresh existing images
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

        // Upload any new images first
        if (newImages.length > 0) {
            await handleUploadNewImages();
        }

        const result = await updateProduct(id, {
            ...form,
            price: form.price ? parseFloat(form.price) : undefined,
        } as any);
        setSaving(false);

        if (result.success) {
            toast.success('Product updated!');
            router.push('/dashboard/products');
        } else {
            toast.error(result.error || 'Failed to update');
        }
    };

    const categories = ['Red Wine', 'White Wine', 'Rosé', 'Sparkling', 'Dessert Wine', 'Fortified'];
    const countries = [
        'France', 'Italy', 'Spain', 'USA', 'Australia',
        'Argentina', 'Chile', 'Germany', 'Portugal', 'India', 'South Africa'
    ];

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

            <form onSubmit={handleSubmit} className="max-w-3xl">
                <div className="rounded-xl border border-border bg-gradient-to-br from-card-bg to-card-bg-elevated p-6 space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium text-text-primary mb-1">SKU</label>
                            <input type="text" value={form.sku} onChange={e => update('sku', e.target.value)}
                                className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-gold/40 focus:outline-none" />
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
                                className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-gold/40 focus:outline-none">
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
                        <div>
                            <label className="block text-sm font-medium text-text-primary mb-1">Country of Origin</label>
                            <select value={form.country_of_origin} onChange={e => update('country_of_origin', e.target.value)}
                                className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-gold/40 focus:outline-none">
                                <option value="">Select country</option>
                                {countries.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
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

                    {/* Pricing & Stock */}
                    <div>
                        <h3 className="font-serif text-sm font-semibold text-gold-soft mb-4">Pricing & Stock</h3>
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
                            </div>
                        </div>

                        {/* Adjust By Mode */}
                        <div className="mt-3">
                            <button
                                type="button"
                                onClick={() => setAdjustMode(!adjustMode)}
                                className="text-xs font-medium text-gold-muted hover:text-gold transition-all duration-300"
                            >
                                {adjustMode ? '✕ Close quick adjust' : '⚡ Quick adjust stock'}
                            </button>
                            {adjustMode && (
                                <div className="mt-2 flex items-center gap-2 p-3 rounded-lg bg-page-bg border border-border animate-slideDown">
                                    <span className="text-xs text-text-secondary whitespace-nowrap">Adjust by:</span>
                                    <input
                                        type="number"
                                        value={adjustAmount}
                                        onChange={e => setAdjustAmount(e.target.value)}
                                        placeholder="e.g. +10 or -5"
                                        className="w-24 rounded-lg border border-border px-3 py-1.5 text-sm text-center focus:border-primary focus:outline-none"
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
                                                setStockValue(stockValue); // revert
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

                    {/* Product Images Section */}
                    <div>
                        <h3 className="font-serif text-sm font-semibold text-gold-soft mb-4">Product Images</h3>

                        {/* Existing Images */}
                        {existingImages.length > 0 && (
                            <div className="mb-4">
                                <p className="text-xs text-text-secondary mb-2">Current Images ({existingImages.length})</p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {existingImages.map(img => (
                                        <div key={img.asset_id} className="relative group rounded-lg overflow-hidden border border-border bg-card-bg-elevated">
                                            <img
                                                src={img.base64_data}
                                                alt={img.file_name || 'Product image'}
                                                className="w-full h-28 object-cover"
                                            />
                                            {/* Overlay buttons */}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleSetPrimary(img.asset_id)}
                                                    className={`p-1.5 rounded-full transition-all duration-300 ${img.is_primary ? 'bg-gold text-page-bg' : 'bg-card-bg-elevated/90 text-text-muted hover:bg-gold hover:text-page-bg'}`}
                                                    title={img.is_primary ? 'Primary image' : 'Set as primary'}
                                                >
                                                    <Star className="h-3.5 w-3.5" fill={img.is_primary ? 'currentColor' : 'none'} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteExisting(img.asset_id)}
                                                    disabled={deletingImageId === img.asset_id}
                                                    className="p-1.5 rounded-full bg-card-bg-elevated/90 text-danger hover:bg-danger hover:text-gold-soft transition-all duration-300 disabled:opacity-50"
                                                    title="Delete image"
                                                >
                                                    {deletingImageId === img.asset_id ? (
                                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    )}
                                                </button>
                                            </div>
                                            <div className="px-2 py-1.5">
                                                <p className="text-xs text-text-secondary truncate">{img.file_name || 'Image'}</p>
                                                {img.is_primary && (
                                                    <span className="text-[10px] font-semibold text-gold">★ Primary</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Upload New Images */}
                        <div
                            onDrop={handleDrop}
                            onDragOver={e => e.preventDefault()}
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-gold/40 hover:bg-gold/[0.04] transition-all duration-300"
                        >
                            <Upload className="h-7 w-7 text-text-secondary mx-auto mb-2" />
                            <p className="text-sm font-medium text-text-primary">Click to upload or drag & drop</p>
                            <p className="text-xs text-text-secondary mt-1">PNG, JPG, WebP up to 5MB each</p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif"
                                multiple
                                onChange={e => handleFileSelect(e.target.files)}
                                className="hidden"
                            />
                        </div>

                        {/* New Image Previews */}
                        {newImages.length > 0 && (
                            <div className="mt-4">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs text-text-secondary">New Images to Upload ({newImages.length})</p>
                                    <button
                                        type="button"
                                        onClick={handleUploadNewImages}
                                        disabled={uploadingImages}
                                        className="flex items-center gap-1.5 text-xs font-semibold text-gold-muted hover:text-gold disabled:opacity-50 transition-colors duration-300"
                                    >
                                        {uploadingImages ? (
                                            <><Loader2 className="h-3 w-3 animate-spin" /> Uploading...</>
                                        ) : (
                                            <><Upload className="h-3 w-3" /> Upload Now</>
                                        )}
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {newImages.map((img, index) => (
                                        <div key={index} className="relative group rounded-lg overflow-hidden border border-dashed border-gold/30 bg-gold/[0.04]">
                                            <img
                                                src={img.preview}
                                                alt={img.file.name}
                                                className="w-full h-28 object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeNewImage(index)}
                                                className="absolute top-1.5 right-1.5 bg-danger text-gold-soft rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-md"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                            <div className="px-2 py-1.5">
                                                <p className="text-xs text-text-secondary truncate">{img.file.name}</p>
                                                <span className="text-[10px] font-medium text-gold/70">New</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-6 flex items-center gap-3">
                    <button type="submit" disabled={saving || uploadingImages}
                        className="flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-[#E8D8B9] hover:bg-primary-light border border-gold/10 transition-all duration-300 disabled:opacity-50">
                        <Save className="h-4 w-4" />
                        {uploadingImages ? 'Uploading Images...' : saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <Link href="/dashboard/products"
                        className="rounded-lg border border-border px-6 py-3 text-sm font-medium text-text-secondary hover:text-gold hover:border-gold/30 transition-all duration-300">
                        Cancel
                    </Link>
                </div>
            </form>
        </div>
    );
}

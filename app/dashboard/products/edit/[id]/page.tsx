'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { getProduct, updateProduct, uploadProductImage, getProductImages, deleteProductImage, setPrimaryImage } from '@/lib/api';
import { getCategories } from '@/lib/api/category';
import { Category } from '@/types/category';
import { ArrowLeft, Save, Upload, X, Star, Trash2, ImageIcon, Loader2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

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
    const [categories, setCategories] = useState<Category[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
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
                });
            }
            if (Array.isArray(images)) {
                setExistingImages(images as ExistingImage[]);
            }
            setCategories(cats);
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

        const result = await updateProduct(id, form);
        setSaving(false);

        if (result.success) {
            toast.success('Product updated!');
            router.push('/dashboard/products');
        } else {
            toast.error(result.error || 'Failed to update');
        }
    };

    const parentCategories = categories.filter(c => !c.parent_id);
    // Find the selected parent's category_id by matching the name stored in form.category
    const selectedParent = categories.find(c => !c.parent_id && c.name === form.category);
    // Only show subcategories that belong to the selected parent
    const subCategories = selectedParent
        ? categories.filter(c => c.parent_id === selectedParent.category_id)
        : [];

    // When parent category changes, clear the sub_category
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
                            <select value={form.category} onChange={e => handleCategoryChange(e.target.value)}
                                className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-primary focus:outline-none bg-white">
                                <option value="">Select</option>
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
                                    {!form.category
                                        ? 'Select a category first'
                                        : subCategories.length === 0
                                            ? 'No subcategories available'
                                            : 'Select sub category'}
                                </option>
                                {subCategories.map(cat => (
                                    <option key={cat.category_id} value={cat.name}>{cat.name}</option>
                                ))}
                            </select>
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

                    {/* Product Images Section */}
                    <div>
                        <h3 className="font-serif text-sm font-semibold text-text-primary mb-4">Product Images</h3>

                        {/* Existing Images */}
                        {existingImages.length > 0 && (
                            <div className="mb-4">
                                <p className="text-xs text-text-secondary mb-2">Current Images ({existingImages.length})</p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {existingImages.map(img => (
                                        <div key={img.asset_id} className="relative group rounded-lg overflow-hidden border border-border bg-white">
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
                                                    className={`p-1.5 rounded-full transition-colors ${img.is_primary ? 'bg-yellow-400 text-yellow-900' : 'bg-white/90 text-gray-700 hover:bg-yellow-400 hover:text-yellow-900'}`}
                                                    title={img.is_primary ? 'Primary image' : 'Set as primary'}
                                                >
                                                    <Star className="h-3.5 w-3.5" fill={img.is_primary ? 'currentColor' : 'none'} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteExisting(img.asset_id)}
                                                    disabled={deletingImageId === img.asset_id}
                                                    className="p-1.5 rounded-full bg-white/90 text-red-600 hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50"
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
                                                    <span className="text-[10px] font-semibold text-primary">★ Primary</span>
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
                            className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
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
                                        className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-dark disabled:opacity-50"
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
                                        <div key={index} className="relative group rounded-lg overflow-hidden border border-dashed border-primary/40 bg-primary/5">
                                            <img
                                                src={img.preview}
                                                alt={img.file.name}
                                                className="w-full h-28 object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeNewImage(index)}
                                                className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                            <div className="px-2 py-1.5">
                                                <p className="text-xs text-text-secondary truncate">{img.file.name}</p>
                                                <span className="text-[10px] font-medium text-primary/70">New</span>
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
                        className="flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-dark transition-colors disabled:opacity-50">
                        <Save className="h-4 w-4" />
                        {uploadingImages ? 'Uploading Images...' : saving ? 'Saving...' : 'Save Changes'}
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

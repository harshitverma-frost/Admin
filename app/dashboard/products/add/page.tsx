'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createProduct, updateStock, uploadProductImage } from '@/lib/api';
import { ArrowLeft, Save, Upload, X, ImageIcon } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import StockControl from '@/components/StockControl';

interface ImagePreview {
    file: File;
    base64: string;
    preview: string;
}

export default function AddProductPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [images, setImages] = useState<ImagePreview[]>([]);
    const [uploadingImages, setUploadingImages] = useState(false);
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
        price: '',
        quantity: '',
        country_of_origin: '',
        alcohol_percentage: '',
    });

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
        const newImages: ImagePreview[] = [];
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
            newImages.push({
                file,
                base64,
                preview: URL.createObjectURL(file),
            });
        }
        setImages(prev => [...prev, ...newImages]);
    };

    const removeImage = (index: number) => {
        setImages(prev => {
            const updated = [...prev];
            URL.revokeObjectURL(updated[index].preview);
            updated.splice(index, 1);
            return updated;
        });
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        handleFileSelect(e.dataTransfer.files);
    };

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
            country_of_origin: form.country_of_origin || undefined,
            alcohol_percentage: form.alcohol_percentage ? parseFloat(form.alcohol_percentage) : undefined,
        });

        if (!result.success) {
            setLoading(false);
            toast.error(result.error || 'Failed to create product');
            return;
        }

        // Set initial stock quantity if provided
        const initialQty = form.quantity ? parseInt(form.quantity) : 0;
        if (initialQty > 0 && result.product?.product_id) {
            const stockOk = await updateStock(result.product.product_id, initialQty);
            if (!stockOk) {
                toast.error('Product created but failed to set initial stock');
            }
        }

        // Upload images if any were selected
        if (images.length > 0 && result.product?.product_id) {
            setUploadingImages(true);
            let successCount = 0;
            for (let i = 0; i < images.length; i++) {
                const imgResult = await uploadProductImage(
                    result.product.product_id,
                    images[i].base64,
                    { is_primary: i === 0, file_name: images[i].file.name }
                );
                if (imgResult.success) {
                    successCount++;
                } else {
                    toast.error(`Failed to upload ${images[i].file.name}`);
                }
            }
            setUploadingImages(false);
            if (successCount > 0) {
                toast.success(`Product created with ${successCount} image(s)!`);
            }
        } else {
            toast.success('Product created successfully!');
        }

        setLoading(false);
        router.push('/dashboard/products');
    };

    const categories = ['Red Wine', 'White Wine', 'Rosé', 'Sparkling', 'Dessert Wine', 'Fortified'];
    const countries = [
        'France', 'Italy', 'Spain', 'USA', 'Australia',
        'Argentina', 'Chile', 'Germany', 'Portugal', 'India', 'South Africa'
    ];

    return (
        <div>
            <div className="flex items-center gap-3 mb-6">
                <Link href="/dashboard/products" className="rounded-lg border border-border p-2 hover:bg-gold/[0.06] hover:border-gold/20 transition-all duration-300">
                    <ArrowLeft className="h-4 w-4 text-text-muted" />
                </Link>
                <div>
                    <h1 className="font-serif text-2xl font-bold text-gold-soft">Add New Product</h1>
                    <p className="text-sm text-text-secondary">Fill in the details to create a new wine product</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="max-w-3xl">
                <div className="rounded-xl border border-border bg-gradient-to-br from-card-bg to-card-bg-elevated p-6 space-y-6">
                    {/* Basic Info */}
                    <div>
                        <h3 className="font-serif text-sm font-semibold text-gold-soft mb-4">Basic Information</h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-text-primary mb-1">SKU *</label>
                                <input
                                    type="text"
                                    value={form.sku}
                                    onChange={e => update('sku', e.target.value)}
                                    className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-gold/40 focus:outline-none"
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
                                    className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-gold/40 focus:outline-none"
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
                            <div>
                                <label className="block text-sm font-medium text-text-primary mb-1">Country of Origin *</label>
                                <select
                                    value={form.country_of_origin}
                                    onChange={e => update('country_of_origin', e.target.value)}
                                    className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-gold/40 focus:outline-none"
                                    required
                                >
                                    <option value="">Select country</option>
                                    {countries.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-primary mb-1">Alcohol % (ABV)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={form.alcohol_percentage}
                                        onChange={e => update('alcohol_percentage', e.target.value)}
                                        className="w-full rounded-lg border border-border px-4 py-2.5 pr-10 text-sm focus:border-gold/40 focus:outline-none"
                                        placeholder="13.5"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-text-muted font-medium">%</span>
                                </div>
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
                                    value={parseInt(form.quantity) || 0}
                                    onChange={(val) => update('quantity', String(val))}
                                    min={0}
                                    size="md"
                                    showLabel
                                    label="Stock Quantity"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Product Images */}
                    <div>
                        <h3 className="font-serif text-sm font-semibold text-gold-soft mb-4">Product Images</h3>
                        <div
                            onDrop={handleDrop}
                            onDragOver={e => e.preventDefault()}
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-gold/40 hover:bg-gold/[0.04] transition-all duration-300"
                        >
                            <Upload className="h-8 w-8 text-text-secondary mx-auto mb-3" />
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

                        {/* Image Previews */}
                        {images.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                                {images.map((img, index) => (
                                    <div key={index} className="relative group rounded-lg overflow-hidden border border-border bg-card-bg-elevated">
                                        <img
                                            src={img.preview}
                                            alt={img.file.name}
                                            className="w-full h-28 object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="absolute top-1.5 right-1.5 bg-danger text-gold-soft rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-md"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                        <div className="px-2 py-1.5">
                                            <p className="text-xs text-text-secondary truncate">{img.file.name}</p>
                                            {index === 0 && (
                                                <span className="text-[10px] font-semibold text-gold">Primary</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex items-center gap-3">
                    <button
                        type="submit"
                        disabled={loading || uploadingImages}
                        className="flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-[#E8D8B9] hover:bg-primary-light border border-gold/10 transition-all duration-300 disabled:opacity-50"
                    >
                        <Save className="h-4 w-4" />
                        {uploadingImages ? 'Uploading Images...' : loading ? 'Creating...' : 'Create Product'}
                    </button>
                    <Link
                        href="/dashboard/products"
                        className="rounded-lg border border-border px-6 py-3 text-sm font-medium text-text-secondary hover:text-gold hover:border-gold/30 transition-all duration-300"
                    >
                        Cancel
                    </Link>
                </div>
            </form>
        </div>
    );
}

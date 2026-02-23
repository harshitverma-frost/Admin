'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createProduct, updateStock, uploadProductImage } from '@/lib/api';
import { getCategories } from '@/lib/api/category';
import { Category } from '@/types/category';
import { ArrowLeft, Save, Upload, X, Package, Ruler, Image as ImageIcon, Info } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import StockControl from '@/components/StockControl';

interface ImagePreview {
    file: File;
    base64: string;
    preview: string;
}

const TABS = [
    { id: 'general', label: 'General Info', icon: Info },
    { id: 'dimensions', label: 'Dimensions', icon: Ruler },
    { id: 'inventory', label: 'Inventory & Pricing', icon: Package },
    { id: 'images', label: 'Images', icon: ImageIcon },
];

export default function AddProductPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(false);
    const [images, setImages] = useState<ImagePreview[]>([]);
    const [uploadingImages, setUploadingImages] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [uomValue, setUomValue] = useState('');
    const [uomUnit, setUomUnit] = useState('ml');

    const [form, setForm] = useState({
        // General
        sku: '',
        product_name: '',
        brand: '',
        category: '',
        sub_category: '',
        description: '',
        unit_of_measure: '',
        intended_use: '',
        country_of_origin: '',
        // Inventory & Pricing
        price: '',
        quantity: '',
        // Dimensions
        length_cm: '',
        width_cm: '',
        height_cm: '',
        weight_kg: '',
    });

    // Fetch categories from API
    useEffect(() => {
        getCategories().then(setCategories);
    }, []);

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
            setActiveTab('general');
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
            specifications: {
                country_of_origin: form.country_of_origin || undefined,
                length_cm: form.length_cm ? parseFloat(form.length_cm) : undefined,
                width_cm: form.width_cm ? parseFloat(form.width_cm) : undefined,
                height_cm: form.height_cm ? parseFloat(form.height_cm) : undefined,
                weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : undefined,
            }
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

    // Separate parent and sub categories for the dropdowns
    const parentCategories = categories.filter(c => !c.parent_id);
    const selectedParent = categories.find(c => !c.parent_id && c.name === form.category);
    const subCategories = selectedParent
        ? categories.filter(c => c.parent_id === selectedParent.category_id)
        : [];

    const handleCategoryChange = (value: string) => {
        update('category', value);
        update('sub_category', ''); // Reset subcategory when parent changes
    };

    const countries = [
        'France', 'Italy', 'Spain', 'USA', 'Australia',
        'Argentina', 'Chile', 'Germany', 'Portugal', 'India', 'South Africa'
    ];

    const unitOptions = ['ml', 'L', 'oz', 'g', 'kg', 'Pack', 'Bottle', 'Can', 'Other'];

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
                                disabled={loading || uploadingImages}
                                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-[#E8D8B9] hover:bg-primary-light border border-gold/10 transition-all duration-300 disabled:opacity-50"
                            >
                                <Save className="h-4 w-4" />
                                {uploadingImages ? 'Uploading...' : loading ? 'Saving...' : 'Create Product'}
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
                                        onChange={e => handleCategoryChange(e.target.value)}
                                        className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-primary focus:outline-none bg-white"
                                    >
                                        <option value="">Select category</option>
                                        {parentCategories.map(cat => (
                                            <option key={cat.category_id} value={cat.name}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-primary mb-1">Sub Category</label>
                                    <select
                                        value={form.sub_category}
                                        onChange={e => update('sub_category', e.target.value)}
                                        className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-primary focus:outline-none bg-white"
                                        disabled={!form.category || subCategories.length === 0}
                                    >
                                        <option value="">
                                            {!form.category ? 'Select a category first' : subCategories.length === 0 ? 'No subcategories' : 'Select sub category'}
                                        </option>
                                        {subCategories.map(cat => (
                                            <option key={cat.category_id} value={cat.name}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-primary mb-1">Country of Origin *</label>
                                    <select
                                        value={form.country_of_origin}
                                        onChange={e => update('country_of_origin', e.target.value)}
                                        className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-gold/40 focus:outline-none bg-white text-gray-900"
                                        required
                                    >
                                        <option value="">Select country</option>
                                        {countries.map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
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
                                    <input
                                        type="text"
                                        value={form.intended_use}
                                        onChange={e => update('intended_use', e.target.value)}
                                        className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                                        placeholder="Pairs well with grilled meats..."
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-text-primary mb-1">Description</label>
                                    <textarea
                                        value={form.description}
                                        onChange={e => update('description', e.target.value)}
                                        rows={4}
                                        className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-primary focus:outline-none resize-none"
                                        placeholder="Describe the wine's flavor profile, origin, and characteristics..."
                                    />
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
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={form.length_cm}
                                        onChange={e => update('length_cm', e.target.value)}
                                        className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                                        placeholder="0.0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-primary mb-1">Width (cm)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={form.width_cm}
                                        onChange={e => update('width_cm', e.target.value)}
                                        className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                                        placeholder="0.0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-primary mb-1">Height (cm)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={form.height_cm}
                                        onChange={e => update('height_cm', e.target.value)}
                                        className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                                        placeholder="0.0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-primary mb-1">Weight (kg)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={form.weight_kg}
                                        onChange={e => update('weight_kg', e.target.value)}
                                        className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                                        placeholder="0.00"
                                    />
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
                                            type="number"
                                            step="0.01"
                                            value={form.price}
                                            onChange={e => update('price', e.target.value)}
                                            className="w-full rounded-lg border border-border pl-8 pr-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <StockControl
                                        value={parseInt(form.quantity) || 0}
                                        onChange={(val) => update('quantity', String(val))}
                                        min={0}
                                        size="md"
                                        showLabel
                                        label="Initial Stock Quantity"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: IMAGES */}
                    {activeTab === 'images' && (
                        <div className="space-y-6 animate-fade-in-up">
                            <h3 className="font-serif text-lg font-semibold text-gold-soft border-b border-border pb-3">Product Images</h3>
                            <div
                                onDrop={handleDrop}
                                onDragOver={e => e.preventDefault()}
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-gold/40 hover:bg-gold/[0.04] transition-all duration-300"
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

                            {images.length > 0 && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                                    {images.map((img, index) => (
                                        <div key={index} className="relative group rounded-lg overflow-hidden border border-border bg-card-bg-elevated animate-fade-in-up">
                                            <img
                                                src={img.preview}
                                                alt={img.file.name}
                                                className="w-full h-32 object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); removeImage(index); }}
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
                    )}

                </div>
            </form>
        </div>
    );
}

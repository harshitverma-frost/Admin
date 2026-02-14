// Product Types - mirrors backend schema using snake_case
export interface Product {
    id: string;
    product_id?: string;
    sku?: string;
    product_name?: string;
    brand?: string;
    category?: string;
    sub_category?: string;
    description?: string;
    unit_of_measure?: string;
    intended_use?: string;
    price: number;
    quantity?: number;

    specifications?: ProductSpecifications;
    packaging?: ProductPackaging;
    variants?: ProductVariant[];
    additional_info?: ProductAdditionalInfo;
    digital_assets?: ProductDigitalAssets;

    created_at?: string;
    updated_at?: string;
}

export interface ProductSpecifications {
    material?: string;
    dimensions?: string;
    weight?: string;
    color?: string;
    capacity?: string;
    grade?: string;
    shelf_life?: string;
    country_of_origin?: string;
}

export interface ProductPackaging {
    packaging_type?: string;
    pack_size?: string;
    net_quantity?: string;
    gross_weight?: string;
    packaging_material?: string;
    carton_size?: string;
    units_per_carton?: number;
    barcode?: string;
}

export interface ProductVariant {
    variant_id: string;
    variant_name: string;
    variant_type?: string;
    variant_value?: string;
    variant_sku?: string;
    variant_status?: 'active' | 'inactive';
    price: number;
}

export interface ProductAdditionalInfo {
    manufacturer_name?: string;
    manufacturer_address?: string;
    regulatory_details?: string;
    storage_instructions?: string;
    handling_instructions?: string;
    warranty?: string;
    safety_warnings?: string;
    notes?: string;
}

export interface ProductDigitalAssets {
    primary_image?: string;
    secondary_images?: string[];
    packaging_image?: string;
    label_image?: string;
    datasheet?: string;
    certificates?: string[];
    video_url?: string;
}

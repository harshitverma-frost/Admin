/**
 * Admin API Client
 * Backend: https://ecommerce-backend-h23p.onrender.com
 * Response format: { success: boolean, message: string, data: T }
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ecommerce-backend-h23p.onrender.com';

export interface ApiResponse<T = unknown> {
    success: boolean;
    message?: string;
    data?: T;
}

export interface Product {
    product_id: string;
    sku: string;
    product_name: string;
    brand?: string;
    category?: string;
    sub_category?: string;
    description?: string;
    unit_of_measure?: string;
    intended_use?: string;
    price?: number;
    quantity?: number;
    stock_quantity?: number;
    country_of_origin?: string;
    alcohol_percentage?: number;
    images?: string[];
    created_at?: string;
    updated_at?: string;
}

/* ─── Products ─── */

export async function getProducts(): Promise<Product[]> {
    try {
        const res = await fetch(`${API_URL}/api/products`);
        const json: ApiResponse<Product[]> = await res.json();
        const products = json.success && json.data ? json.data : [];

        // Map stock_quantity (from DB) to quantity (used by frontend)
        return products.map(p => ({
            ...p,
            quantity: p.stock_quantity ?? p.quantity ?? 0,
        }));
    } catch (error) {
        console.error('[Admin API] Failed to fetch products:', error);
        return [];
    }
}

export async function getProduct(id: string): Promise<Product | null> {
    try {
        // Use details endpoint to get product + variants (for stock quantity)
        const res = await fetch(`${API_URL}/api/products/${id}/details`);
        const json: ApiResponse<any> = await res.json();
        if (json.success && json.data) {
            const product = json.data;
            // Prefer stock_quantity from product, fallback to variant
            const stockQty = product.stock_quantity
                ?? product.variants?.[0]?.stock_quantity
                ?? 0;
            return { ...product, quantity: stockQty };
        }
        return null;
    } catch (error) {
        console.error('[Admin API] Failed to fetch product:', error);
        return null;
    }
}

export async function createProduct(product: Partial<Product>): Promise<{ success: boolean; product?: Product; error?: string }> {
    try {
        const res = await fetch(`${API_URL}/api/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(product),
        });
        const json: ApiResponse<Product> = await res.json();
        if (json.success && json.data) {
            return { success: true, product: json.data };
        }
        return { success: false, error: json.message || 'Failed to create product' };
    } catch (error) {
        console.error('[Admin API] Failed to create product:', error);
        return { success: false, error: 'Network error - is backend running?' };
    }
}

export async function updateProduct(id: string, product: Partial<Product>): Promise<{ success: boolean; error?: string }> {
    try {
        const res = await fetch(`${API_URL}/api/products/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(product),
        });
        const json: ApiResponse = await res.json();
        return { success: json.success, error: json.message };
    } catch (error) {
        console.error('[Admin API] Failed to update product:', error);
        return { success: false, error: 'Network error' };
    }
}

export async function deleteProduct(id: string): Promise<boolean> {
    try {
        const res = await fetch(`${API_URL}/api/products/${id}`, { method: 'DELETE' });
        const json: ApiResponse = await res.json();
        return json.success;
    } catch (error) {
        console.error('[Admin API] Failed to delete product:', error);
        return false;
    }
}

export async function checkApiHealth(): Promise<boolean> {
    try {
        const res = await fetch(`${API_URL}/api/products?limit=1`);
        return res.ok;
    } catch {
        return false;
    }
}

/* ─── Orders ─── */

export interface Order {
    id: string;
    customer_name: string;
    customer_email: string;
    items: { product_name: string; quantity: number; price: number }[];
    total: number;
    status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
    created_at: string;
}

const MOCK_ORDERS: Order[] = [
    {
        id: 'ORD-001',
        customer_name: 'Emily Carter',
        customer_email: 'emily.carter@email.com',
        items: [{ product_name: 'KSP Classic Red', quantity: 2, price: 45 }],
        total: 90,
        status: 'confirmed',
        created_at: '2026-02-10T10:30:00Z',
    },
    {
        id: 'ORD-002',
        customer_name: 'James Whitfield',
        customer_email: 'james.w@email.com',
        items: [
            { product_name: 'Highland White', quantity: 1, price: 38 },
            { product_name: 'Sparkling Rosé', quantity: 3, price: 52 },
        ],
        total: 194,
        status: 'shipped',
        created_at: '2026-02-09T14:15:00Z',
    },
    {
        id: 'ORD-003',
        customer_name: 'Sofia Martínez',
        customer_email: 'sofia.m@email.com',
        items: [{ product_name: 'Reserve Cabernet', quantity: 6, price: 75 }],
        total: 450,
        status: 'pending',
        created_at: '2026-02-11T08:00:00Z',
    },
    {
        id: 'ORD-004',
        customer_name: 'David Laurent',
        customer_email: 'david.l@email.com',
        items: [{ product_name: 'Dalat Merlot', quantity: 1, price: 65 }],
        total: 65,
        status: 'delivered',
        created_at: '2026-02-07T11:45:00Z',
    },
];

/** Tries the real API; falls back to mock data.  Normalises backend field names to the UI Order shape. */
export async function getOrders(): Promise<Order[]> {
    try {
        const res = await fetch(`${API_URL}/api/orders`);
        if (!res.ok) {
            console.error(`[Admin API] getOrders failed with status: ${res.status}`);
            return MOCK_ORDERS;
        }

        const json: ApiResponse<any[]> = await res.json();
        if (json.success && Array.isArray(json.data)) {
            // Mapping Logic
            return json.data.map((row: any) => ({
                id: row.id ?? row.order_id ?? '',
                customer_name: row.customer_name ?? 'Unknown',
                customer_email: row.customer_email ?? '',
                items: row.items ?? [],
                total: row.total ?? parseFloat(row.total_amount ?? 0),
                status: (row.status ?? (row.order_status ?? 'pending')).toLowerCase() as Order['status'],
                created_at: row.created_at ?? new Date().toISOString(),
            }));
        }

        console.warn('[Admin API] getOrders returned invalid data structure:', json);
        return MOCK_ORDERS;
    } catch (error) {
        console.error('[Admin API] Failed to fetch orders:', error);
        return MOCK_ORDERS;
    }
}

/** For backward compat – the mock data function */
export function getMockOrders(): Order[] {
    return MOCK_ORDERS;
}

export async function getOrderById(id: string): Promise<Order | null> {
    try {
        const res = await fetch(`${API_URL}/api/orders/${id}`);
        const json: ApiResponse<Order> = await res.json();
        return json.success && json.data ? json.data : null;
    } catch {
        return MOCK_ORDERS.find(o => o.id === id) || null;
    }
}

export async function updateOrderStatus(id: string, status: string): Promise<boolean> {
    try {
        const res = await fetch(`${API_URL}/api/orders/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_status: status.toUpperCase() }),
        });
        const json: ApiResponse = await res.json();
        return json.success;
    } catch {
        return false;
    }
}

export async function updatePaymentStatus(id: string, paymentStatus: string): Promise<boolean> {
    try {
        const res = await fetch(`${API_URL}/api/orders/${id}/payment`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ payment_status: paymentStatus }),
        });
        const json: ApiResponse = await res.json();
        return json.success;
    } catch {
        return false;
    }
}

/* ─── Products (Advanced) ─── */

export async function getEnums(): Promise<Record<string, string[]>> {
    try {
        const res = await fetch(`${API_URL}/api/products/enums`);
        const json: ApiResponse<Record<string, string[]>> = await res.json();
        return json.success && json.data ? json.data : {};
    } catch {
        return {};
    }
}

export async function duplicateProduct(id: string, newSku: string, newName: string): Promise<{ success: boolean; product?: Product; error?: string }> {
    try {
        const res = await fetch(`${API_URL}/api/products/${id}/duplicate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newSku, newName }),
        });
        const json: ApiResponse<Product> = await res.json();
        if (json.success && json.data) {
            return { success: true, product: json.data };
        }
        return { success: false, error: json.message || 'Failed to duplicate product' };
    } catch {
        return { success: false, error: 'Network error' };
    }
}

export async function updateStock(productId: string, quantity: number): Promise<boolean> {
    try {
        const res = await fetch(`${API_URL}/api/products/${productId}/stock`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantity }),
        });
        const json: ApiResponse = await res.json();
        if (!json.success) {
            console.error('[Admin API] Stock update failed:', json.message);
        }
        return json.success;
    } catch (error) {
        console.error('[Admin API] Failed to update stock:', error);
        return false;
    }
}

export async function getLowStockProducts(): Promise<Product[]> {
    try {
        const res = await fetch(`${API_URL}/api/products/low-stock-alerts`);
        const json: ApiResponse<Product[]> = await res.json();
        return json.success && json.data ? json.data : [];
    } catch {
        return [];
    }
}

/* ─── Inventory ─── */

export async function adjustInventory(data: { product_id: string; quantity_change: number; reason: string }): Promise<boolean> {
    try {
        const res = await fetch(`${API_URL}/api/inventory/adjust`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        const json: ApiResponse = await res.json();
        return json.success;
    } catch {
        return false;
    }
}

export async function getStockHistory(productId: string) {
    try {
        const res = await fetch(`${API_URL}/api/inventory/history/${productId}`);
        const json: ApiResponse = await res.json();
        return json.success && json.data ? json.data : [];
    } catch {
        return [];
    }
}

/* ─── Categories ─── */

export interface Category {
    category_id?: string;
    id: string;
    name: string;
    slug?: string;
    description: string;
    product_count?: number;
    parent_id?: string;
    image_url?: string;
}

export async function getCategories(): Promise<Category[]> {
    try {
        const res = await fetch(`${API_URL}/api/categories`);
        const json: ApiResponse<any[]> = await res.json();
        if (json.success && json.data && json.data.length > 0) {
            return json.data.map((cat: Record<string, unknown>) => ({
                id: (cat.category_id ?? cat.id ?? '') as string,
                category_id: (cat.category_id ?? '') as string,
                name: (cat.name ?? '') as string,
                slug: (cat.slug ?? '') as string,
                description: (cat.description ?? '') as string,
                product_count: (cat.product_count ?? 0) as number,
                parent_id: (cat.parent_id ?? undefined) as string | undefined,
                image_url: (cat.image_url ?? undefined) as string | undefined,
            }));
        }
        return getMockCategories();
    } catch {
        return getMockCategories();
    }
}

export function getMockCategories(): Category[] {
    return [
        { id: 'cat-1', name: 'Red Wine', description: 'Full-bodied red wines', product_count: 12 },
        { id: 'cat-2', name: 'White Wine', description: 'Crisp and refreshing whites', product_count: 8 },
        { id: 'cat-3', name: 'Rosé', description: 'Elegant rosé selections', product_count: 5 },
        { id: 'cat-4', name: 'Sparkling', description: 'Celebratory bubbles', product_count: 4 },
        { id: 'cat-5', name: 'Dessert Wine', description: 'Sweet and complex', product_count: 3 },
        { id: 'cat-6', name: 'Fortified', description: 'Port and sherry styles', product_count: 2 },
    ];
}

export async function createCategory(data: { name: string; slug: string; description?: string; parent_id?: string; image_url?: string }): Promise<{ success: boolean; error?: string }> {
    try {
        const res = await fetch(`${API_URL}/api/categories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        const json: ApiResponse = await res.json();
        return { success: json.success, error: json.message };
    } catch {
        return { success: false, error: 'Network error' };
    }
}

export async function updateCategory(id: string, data: Partial<Category>): Promise<{ success: boolean; error?: string }> {
    try {
        const res = await fetch(`${API_URL}/api/categories/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        const json: ApiResponse = await res.json();
        return { success: json.success, error: json.message };
    } catch {
        return { success: false, error: 'Network error' };
    }
}

export async function deleteCategory(id: string): Promise<boolean> {
    try {
        const res = await fetch(`${API_URL}/api/categories/${id}`, { method: 'DELETE' });
        const json: ApiResponse = await res.json();
        return json.success;
    } catch {
        return false;
    }
}

/* ─── Product Images ─── */

export async function uploadProductImage(productId: string, base64Image: string, options?: { file_name?: string; is_primary?: boolean; sort_order?: number }): Promise<{ success: boolean; error?: string }> {
    try {
        const res = await fetch(`${API_URL}/api/products/${productId}/images`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64Image, ...options }),
        });
        const json: ApiResponse = await res.json();
        return { success: json.success, error: json.message };
    } catch {
        return { success: false, error: 'Network error' };
    }
}

export async function getProductImages(productId: string) {
    try {
        const res = await fetch(`${API_URL}/api/products/${productId}/images`);
        const json: ApiResponse = await res.json();
        return json.success && json.data ? json.data : [];
    } catch {
        return [];
    }
}

export async function deleteProductImage(productId: string, assetId: string): Promise<boolean> {
    try {
        const res = await fetch(`${API_URL}/api/products/${productId}/images/${assetId}`, { method: 'DELETE' });
        const json: ApiResponse = await res.json();
        return json.success;
    } catch {
        return false;
    }
}

export async function setPrimaryImage(productId: string, assetId: string): Promise<boolean> {
    try {
        const res = await fetch(`${API_URL}/api/products/${productId}/images/${assetId}/primary`, { method: 'PATCH' });
        const json: ApiResponse = await res.json();
        return json.success;
    } catch {
        return false;
    }
}

// ─── Auth / Account Management ────────────────────────────────────

export interface LoginResult {
    success: boolean;
    error?: string;
    deactivated?: boolean;
    customer?: { customer_id: string; full_name: string; email: string };
    access_token?: string;
    refresh_token?: string;
}

/**
 * Login via the real backend.
 * Returns { deactivated: true } when the account is inactive,
 * so the UI can display the reactivation modal.
 */
export async function loginUser(email: string, password: string): Promise<LoginResult> {
    try {
        const res = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, password }),
        });
        const json = await res.json();

        // Detect deactivated account — backend may return 403 or specific message
        if (!json.success) {
            const msg = (json.message || '').toLowerCase();
            const isDeactivated =
                msg.includes('deactivat') ||
                msg.includes('inactive') ||
                msg.includes('account_deactivated') ||
                res.status === 451;
            return {
                success: false,
                error: json.message || 'Login failed',
                deactivated: isDeactivated,
            };
        }

        return {
            success: true,
            customer: json.data?.customer,
            access_token: json.data?.access_token,
            refresh_token: json.data?.refresh_token,
        };
    } catch (error) {
        console.error('[Admin API] Login failed:', error);
        return { success: false, error: 'Network error. Please try again.' };
    }
}

/**
 * Deactivate the current user's account.
 * Requires the user's password for verification.
 */
export async function deactivateAccount(password: string, token?: string): Promise<{ success: boolean; error?: string }> {
    try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`${API_URL}/api/auth/deactivate`, {
            method: 'POST',
            headers,
            credentials: 'include',
            body: JSON.stringify({ password }),
        });
        const json = await res.json();
        return { success: json.success, error: json.message };
    } catch (error) {
        console.error('[Admin API] Deactivation failed:', error);
        return { success: false, error: 'Network error. Please try again.' };
    }
}

/**
 * Reactivate a deactivated account, then re-login.
 * Calls POST /api/auth/reactivate, then POST /api/auth/login.
 */
export async function reactivateAccount(email: string, password: string): Promise<LoginResult> {
    try {
        // Step 1: Call reactivation endpoint
        const reactivateRes = await fetch(`${API_URL}/api/auth/reactivate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, password }),
        });
        const reactivateJson = await reactivateRes.json();

        if (!reactivateJson.success) {
            return {
                success: false,
                error: reactivateJson.message || 'Failed to reactivate account',
            };
        }

        // Step 2: Login normally after reactivation
        return await loginUser(email, password);
    } catch (error) {
        console.error('[Admin API] Reactivation failed:', error);
        return { success: false, error: 'Network error. Please try again.' };
    }
}


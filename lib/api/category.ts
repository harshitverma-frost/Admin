/**
 * Category API Client
 * Dedicated module for all category CRUD operations.
 * No mock fallback — everything comes from the backend.
 */

import { Category, CreateCategoryPayload, UpdateCategoryPayload } from '@/types/category';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface ApiResponse<T = unknown> {
    success: boolean;
    message?: string;
    data?: T;
}

/* ─── GET all categories ─── */

export async function getCategories(): Promise<Category[]> {
    try {
        const res = await fetch(`${API_URL}/api/categories`);
        const json: ApiResponse<Category[]> = await res.json();
        if (json.success && Array.isArray(json.data)) {
            return json.data.map((cat) => ({
                category_id: cat.category_id ?? '',
                name: cat.name ?? '',
                slug: cat.slug ?? '',
                description: cat.description ?? '',
                parent_id: cat.parent_id ?? null,
                image_url: cat.image_url ?? null,
                sort_order: cat.sort_order ?? 0,
                is_active: cat.is_active ?? true,
            }));
        }
        return [];
    } catch (error) {
        console.error('[Category API] Failed to fetch categories:', error);
        return [];
    }
}

/* ─── CREATE a category ─── */

export async function createCategory(
    payload: CreateCategoryPayload
): Promise<{ success: boolean; category?: Category; error?: string }> {
    try {
        const res = await fetch(`${API_URL}/api/categories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const json: ApiResponse<Category> = await res.json();
        if (json.success && json.data) {
            return { success: true, category: json.data };
        }
        return { success: false, error: json.message || 'Failed to create category' };
    } catch (error) {
        console.error('[Category API] Failed to create category:', error);
        return { success: false, error: 'Network error — is the backend running?' };
    }
}

/* ─── UPDATE a category ─── */

export async function updateCategory(
    id: string,
    payload: UpdateCategoryPayload
): Promise<{ success: boolean; category?: Category; error?: string }> {
    try {
        const res = await fetch(`${API_URL}/api/categories/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const json: ApiResponse<Category> = await res.json();
        if (json.success) {
            return { success: true, category: json.data };
        }
        return { success: false, error: json.message || 'Failed to update category' };
    } catch (error) {
        console.error('[Category API] Failed to update category:', error);
        return { success: false, error: 'Network error' };
    }
}

/* ─── DELETE a category ─── */

export async function deleteCategory(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        const res = await fetch(`${API_URL}/api/categories/${id}`, {
            method: 'DELETE',
        });
        const json: ApiResponse = await res.json();
        if (json.success) {
            return { success: true };
        }
        return { success: false, error: json.message || 'Failed to delete category' };
    } catch (error) {
        console.error('[Category API] Failed to delete category:', error);
        return { success: false, error: 'Network error' };
    }
}

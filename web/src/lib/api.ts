import type {
    Item,
    Recipe,
    CalculateRequest,
    CalculateResponse
} from '@/types';
import { MOCK_ITEMS, MOCK_RECIPES, MOCK_CALCULATION } from './mockData';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
// Enable mock data if explicitly set or if in development and API is unreachable (we'll manual toggle for now)
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

class APIError extends Error {
    constructor(
        message: string,
        public status: number,
        public data?: unknown
    ) {
        super(message);
        this.name = 'APIError';
    }
}

async function request<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new APIError(
                data.error || 'An error occurred',
                response.status,
                data
            );
        }

        return data as T;
    } catch (error) {
        if (USE_MOCK) {
            console.warn(`API call failed, falling back to mock data for: ${endpoint}`);
            // Fallback logic handled in individual methods
            throw error; // Rethrow to let caller handle if they want, but methods below catch it
        }
        throw error;
    }
}

export const api = {
    /**
      * Check API health status
      */
    health: async (): Promise<{ status: string; timestamp: string }> => {
        if (USE_MOCK) return { status: 'ok', timestamp: new Date().toISOString() };
        return request('/api/health');
    },

    /**
      * Fetch all game items
      */
    getItems: async (): Promise<Record<string, Item>> => {
        if (USE_MOCK) {
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 500));
            return MOCK_ITEMS;
        }
        const items = await request<Record<string, any>>('/api/items');
        // Ensure id exists (backend uses className)
        Object.values(items).forEach((item: any) => {
            if (!item.id && item.className) {
                item.id = item.className;
            }
        });
        return items;
    },

    /**
      * Fetch all recipes with default active status
      */
    getRecipes: async (): Promise<Record<string, Recipe>> => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 500));
            return MOCK_RECIPES;
        }
        const recipes = await request<Record<string, any>>('/api/recipes');
        // Ensure id exists (backend uses className)
        Object.values(recipes).forEach((recipe: any) => {
            if (!recipe.id && recipe.className) {
                recipe.id = recipe.className;
            }
        });
        return recipes;
    },

    /**
      * Calculate optimal production chain
      */
    calculate: async (params: CalculateRequest): Promise<CalculateResponse> => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log('Mock calculation request:', params);
            return MOCK_CALCULATION;
        }
        return request('/api/calculate', {
            method: 'POST',
            body: JSON.stringify(params),
        });
    },
};

export { APIError };
export default api;

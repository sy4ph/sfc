import { create } from 'zustand';
import type { Item } from '@/types';
import api from '@/lib/api';

interface ItemStore {
    // State
    items: Record<string, Item>;
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchItems: () => Promise<void>;
    getItem: (itemId: string) => Item | undefined;
    getItemName: (itemId: string) => string;
    getItemsByName: () => Item[];
}

export const useItemStore = create<ItemStore>()((set, get) => ({
    items: {},
    isLoading: false,
    error: null,

    fetchItems: async () => {
        set({ isLoading: true, error: null });
        try {
            const items = await api.getItems();
            set({ items, isLoading: false });
        } catch (err) {
            set({
                error: err instanceof Error ? err.message : 'Failed to fetch items',
                isLoading: false
            });
        }
    },

    getItem: (itemId: string) => {
        return get().items[itemId];
    },

    getItemName: (itemId: string) => {
        const item = get().items[itemId];
        if (item) return item.name;

        // Fallback: clean up the ID
        return itemId
            .replace(/^Desc_/, '')
            .replace(/_C$/, '')
            .replace(/([A-Z])/g, ' $1')
            .trim();
    },

    getItemsByName: () => {
        return Object.values(get().items).sort((a, b) =>
            a.name.localeCompare(b.name)
        );
    },
}));

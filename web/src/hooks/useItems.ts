'use client';

import { useEffect } from 'react';
import { useItemStore } from '@/stores/itemStore';

export function useItems() {
    const { items, isLoading, error, fetchItems, getItem, getItemName, getItemsByName } = useItemStore();

    useEffect(() => {
        if (Object.keys(items).length === 0 && !isLoading) {
            fetchItems();
        }
    }, [items, isLoading, fetchItems]);

    return {
        items,
        itemsList: getItemsByName(),
        isLoading,
        error,
        getItem,
        getItemName,
    };
}

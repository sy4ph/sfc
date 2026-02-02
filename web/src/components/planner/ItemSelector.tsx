'use client';

import { useMemo, useState } from 'react';
import { useItems } from '@/hooks';
import { Select } from '@/components/ui';
import Image from 'next/image';
import { getItemIconPath } from '@/lib/utils';

interface ItemSelectorProps {
    value: string | null;
    onChange: (itemId: string) => void;
}

export function ItemSelector({ value, onChange }: ItemSelectorProps) {
    const { itemsList, isLoading, getItemName } = useItems();
    const [search, setSearch] = useState('');

    const options = useMemo(() => {
        return itemsList
            .filter((item) => {
                // Filter out non-producible items
                const id = item.id.toLowerCase();
                if (id.includes('bp_') || id.includes('schematic')) return false;
                return true;
            })
            .map((item) => ({
                value: item.id,
                label: item.name,
                icon: (
                    <Image
                        src={getItemIconPath(item.id)}
                        alt={item.name}
                        width={24}
                        height={24}
                        className="rounded"
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                        }}
                    />
                ),
            }));
    }, [itemsList]);

    if (isLoading) {
        return (
            <div className="animate-pulse bg-surface-high rounded-lg h-12" />
        );
    }

    return (
        <Select
            label="Target Item"
            options={options}
            value={value}
            onChange={onChange}
            placeholder="Select an item to produce..."
            searchable
        />
    );
}


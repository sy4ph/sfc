'use client';

import { useMemo, useState } from 'react';
import { useItems } from '@/hooks';
import { Select } from '@/components/ui';
import Image from 'next/image';
import { getItemIconPath } from '@/lib/utils';

interface ItemSelectorProps {
    value: string | null;
    onChange: (itemId: string) => void;
    compact?: boolean;
}

export function ItemSelector({ value, onChange, compact = false }: ItemSelectorProps) {
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
                        width={compact ? 20 : 24}
                        height={compact ? 20 : 24}
                        className="rounded"
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                        }}
                    />
                ),
            }));
    }, [itemsList, compact]);

    if (isLoading) {
        return (
            <div className={`animate-pulse bg-surface-high rounded-lg ${compact ? 'h-8' : 'h-12'}`} />
        );
    }

    return (
        <Select
            label={compact ? undefined : "Target Item"}
            options={options}
            value={value}
            onChange={onChange}
            placeholder={compact ? "Select item..." : "Select an item to produce..."}
            searchable
            compact={compact}
        />
    );
}


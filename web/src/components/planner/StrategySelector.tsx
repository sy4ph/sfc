'use client';

import { Select } from '@/components/ui';
import { STRATEGIES, type OptimizationStrategy } from '@/types';

interface StrategySelectorProps {
    value: OptimizationStrategy;
    onChange: (strategy: OptimizationStrategy) => void;
}

export function StrategySelector({ value, onChange }: StrategySelectorProps) {
    const options = STRATEGIES.map((s) => ({
        value: s.id,
        label: s.name,
        description: s.description,
    }));

    return (
        <Select
            label="Optimization Strategy"
            options={options}
            value={value}
            onChange={(v) => onChange(v as OptimizationStrategy)}
            placeholder="Select strategy..."
        />
    );
}

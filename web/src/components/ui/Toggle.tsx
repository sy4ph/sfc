'use client';

interface ToggleProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
    disabled?: boolean;
    size?: 'sm' | 'md';
}

export function Toggle({
    checked,
    onChange,
    label,
    disabled = false,
    size = 'md',
}: ToggleProps) {
    const sizes = {
        sm: {
            track: 'w-8 h-4',
            thumb: 'w-3 h-3',
            translate: 'translate-x-4',
        },
        md: {
            track: 'w-11 h-6',
            thumb: 'w-5 h-5',
            translate: 'translate-x-5',
        },
    };

    const s = sizes[size];

    return (
        <label className={`inline-flex items-center gap-2 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                disabled={disabled}
                onClick={() => !disabled && onChange(!checked)}
                className={`
          relative inline-flex flex-shrink-0 ${s.track}
          border-2 border-transparent rounded-full
          transition-colors duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface
          ${checked ? 'bg-primary' : 'bg-surface-higher'}
          ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
        `}
            >
                <span
                    className={`
            pointer-events-none inline-block ${s.thumb}
            rounded-full bg-white shadow
            transform transition-transform duration-200 ease-in-out
            ${checked ? s.translate : 'translate-x-0'}
          `}
                />
            </button>
            {label && (
                <span className={`text-${size === 'sm' ? 'sm' : 'base'} text-text`}>
                    {label}
                </span>
            )}
        </label>
    );
}

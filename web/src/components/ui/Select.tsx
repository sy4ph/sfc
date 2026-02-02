'use client';

import { useState, useRef, useEffect } from 'react';

interface SelectOption {
    value: string;
    label: string;
    icon?: React.ReactNode;
    description?: string;
}

interface SelectProps {
    options: SelectOption[];
    value: string | null;
    onChange: (value: string) => void;
    label?: string;
    placeholder?: string;
    searchable?: boolean;
    disabled?: boolean;
    error?: string;
    className?: string;
}

export function Select({
    options,
    value,
    onChange,
    label,
    placeholder = 'Select...',
    searchable = false,
    disabled = false,
    error,
    className = '',
}: SelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const selectedOption = options.find((opt) => opt.value === value);

    const filteredOptions = searchable
        ? options.filter((opt) =>
            opt.label.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : options;

    // Close on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus search input when opening
    useEffect(() => {
        if (isOpen && searchable && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen, searchable]);

    return (
        <div className={`relative w-full ${className}`} ref={containerRef}>
            {label && (
                <label className="block text-sm font-medium text-text mb-1.5">
                    {label}
                </label>
            )}

            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`
          w-full px-4 py-2.5 
          bg-surface-high border border-border rounded-lg
          text-left flex items-center justify-between
          focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
          transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-red-500' : ''}
          ${isOpen ? 'ring-2 ring-primary border-transparent' : ''}
        `}
            >
                <span className={selectedOption ? 'text-text' : 'text-text-dim'}>
                    {selectedOption?.label || placeholder}
                </span>
                <svg
                    className={`w-5 h-5 text-text-dim transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-surface border border-border rounded-lg shadow-xl overflow-hidden">
                    {searchable && (
                        <div className="p-2 border-b border-border">
                            <input
                                ref={inputRef}
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search..."
                                className="w-full px-3 py-2 bg-surface-high border border-border rounded-md text-text placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                            />
                        </div>
                    )}

                    <div className="max-h-60 overflow-auto">
                        {filteredOptions.length === 0 ? (
                            <div className="px-4 py-3 text-text-dim text-sm">No options found</div>
                        ) : (
                            filteredOptions.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => {
                                        onChange(option.value);
                                        setIsOpen(false);
                                        setSearchTerm('');
                                    }}
                                    className={`
                    w-full px-4 py-2.5 text-left flex items-center gap-3
                    hover:bg-surface-high transition-colors duration-150
                    ${option.value === value ? 'bg-primary/10 text-primary' : 'text-text'}
                  `}
                                >
                                    {option.icon && <span className="flex-shrink-0">{option.icon}</span>}
                                    <div className="flex-1 min-w-0">
                                        <div className="truncate">{option.label}</div>
                                        {option.description && (
                                            <div className="text-xs text-text-dim truncate">{option.description}</div>
                                        )}
                                    </div>
                                    {option.value === value && (
                                        <svg className="w-5 h-5 text-primary flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}

            {error && (
                <p className="mt-1.5 text-sm text-red-400">{error}</p>
            )}
        </div>
    );
}

/**
 * Converts internal descriptor ID to standard filename
 * Example: Desc_IronIngot_C -> desc-ironingot-c_64.png
 */
export function getItemIconPath(itemId: string, size: 64 | 256 = 64): string {
    if (!itemId) return '/images/placeholder.png';
    const name = itemId.toLowerCase().replace(/_/g, '-');
    return `/images/items/${name}_${size}.png`;
}

/**
 * Formats a number to a readable string (e.g., 1200.0 -> 1,200)
 */
export function formatNumber(num: number): string {
    if (num === undefined || num === null || isNaN(num)) return '0';
    return new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 1,
    }).format(num);
}

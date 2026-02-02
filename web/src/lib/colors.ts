/**
 * Generates a color hue (0-360) from a string seed
 */
export function getHueFromString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    // We want to avoid too bright/neon results sometimes, but abs % 360 is standard
    return Math.abs(hash % 360);
}

/**
 * Updates the global theme hue based on an item ID
 * This affects all colors in the app as they are derived from --md-hue
 */
export function setAccentColor(itemId: string | null) {
    const root = document.documentElement;

    if (!itemId) {
        // Reset to default (matches blue-ish primary)
        root.style.removeProperty('--md-hue');
        return;
    }

    const hue = getHueFromString(itemId);
    root.style.setProperty('--md-hue', hue.toString());
}

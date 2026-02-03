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
 * Converts internal machine ID to readable name
 */
export function getMachineName(machineId: string): string {
    if (!machineId) return 'Unknown Machine';
    const names: Record<string, string> = {
        Desc_SmelterMk1_C: 'Smelter',
        Desc_ConstructorMk1_C: 'Constructor',
        Desc_AssemblerMk1_C: 'Assembler',
        Desc_ManufacturerMk1_C: 'Manufacturer',
        Desc_FoundryMk1_C: 'Foundry',
        Desc_OilRefinery_C: 'Refinery',
        Desc_Packager_C: 'Packager',
        Desc_Blender_C: 'Blender',
        Desc_HadronCollider_C: 'Particle Accelerator',
        Desc_QuantumEncoder_C: 'Quantum Encoder',
        Desc_Converter_C: 'Converter',
        Desc_MinerMk1_C: 'Miner Mk.1',
        Desc_MinerMk2_C: 'Miner Mk.2',
        Desc_MinerMk3_C: 'Miner Mk.3',
        Desc_OilPump_C: 'Oil Extractor',
        Desc_WaterPump_C: 'Water Extractor',
        Desc_FrackingSmasher_C: 'Resource Well Pressurizer',
        Desc_FrackingExtractor_C: 'Resource Well Extractor',
    };
    return names[machineId] || machineId.replace(/^Desc_/, '').replace(/_C$/, '').replace(/Mk1/, '');
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

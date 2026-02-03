// Static power constants for Satisfactory machines
// Formula: Power = BasePower * (ClockSpeed / 100) ^ Exponent

export const MACHINE_POWER: Record<string, { basePower: number; exponent: number }> = {
    // Miners
    'Desc_MinerMk1_C': { basePower: 5, exponent: 1.6 },
    'Desc_MinerMk2_C': { basePower: 12, exponent: 1.6 },
    'Desc_MinerMk3_C': { basePower: 30, exponent: 1.6 },

    // Smelters
    'Desc_SmelterMk1_C': { basePower: 4, exponent: 1.6 },
    'Desc_FoundryMk1_C': { basePower: 16, exponent: 1.6 },

    // Constructors/Assemblers
    'Desc_ConstructorMk1_C': { basePower: 4, exponent: 1.6 },
    'Desc_AssemblerMk1_C': { basePower: 15, exponent: 1.6 },
    'Desc_ManufacturerMk1_C': { basePower: 55, exponent: 1.6 },

    // Refineries
    'Desc_OilRefinery_C': { basePower: 30, exponent: 1.6 },
    'Desc_Blender_C': { basePower: 75, exponent: 1.6 },
    'Desc_Packager_C': { basePower: 10, exponent: 1.6 },

    // Advanced
    'Desc_HadronCollider_C': { basePower: 750, exponent: 1.6 },
    'Desc_QuantumEncoder_C': { basePower: 1000, exponent: 1.6 },
    'Desc_Converter_C': { basePower: 500, exponent: 1.6 },

    // Extractors
    'Desc_OilPump_C': { basePower: 40, exponent: 1.6 },
    'Desc_WaterPump_C': { basePower: 20, exponent: 1.6 },
    'Desc_FrackingSmasher_C': { basePower: 150, exponent: 1.6 },
};

export function calculateMachinePower(machineId: string, clockSpeed: number, machineCount: number): number {
    const data = MACHINE_POWER[machineId];
    if (!data) return 0;

    // Satisfactory Power Formula: P = P_base * (C / 100) ^ exp
    const power = data.basePower * Math.pow(clockSpeed / 100, data.exponent);
    return power * machineCount;
}

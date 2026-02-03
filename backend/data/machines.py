"""
Machine data accessor module for Satisfactory Factory Calculator.
Provides power usage and metadata for machines.
"""

# Power usage in MW
MACHINE_POWER_USAGE = {
    # Basic Production
    "Desc_AssemblerMk1_C": 15,
    "Desc_Blender_C": 75,
    "Desc_ConstructorMk1_C": 4,
    "Desc_Converter_C": 100,
    "Desc_FoundryMk1_C": 16,
    "Desc_HadronCollider_C": 500, # Particle Accelerator
    "Desc_ManufacturerMk1_C": 55,
    "Desc_OilRefinery_C": 30,     # Refinery
    "Desc_Packager_C": 10,
    "Desc_QuantumEncoder_C": 200,
    "Desc_SmelterMk1_C": 4,
    
    # Mining
    "Desc_MinerMk1_C": 5,
    "Desc_MinerMk2_C": 12,
    "Desc_MinerMk3_C": 30,
    
    # Fluids
    "Desc_OilPump_C": 40,
    "Desc_WaterPump_C": 20,
    "Desc_FrackingSmasher_C": 100, # Resource Well Pressurizer
    "Desc_FrackingExtractor_C": 0,
}

def get_machine_power_usage(machine_id: str) -> float:
    """
    Get the power usage of a machine in MW.
    Returns 0.0 if not found.
    """
    # Try direct match
    if machine_id in MACHINE_POWER_USAGE:
        return MACHINE_POWER_USAGE[machine_id]
        
    # Try without prefix/suffix if needed (though backend usually uses full ID)
    # This is a fallback
    return 0.0

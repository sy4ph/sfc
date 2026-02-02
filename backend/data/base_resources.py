"""
Base resources module for Satisfactory Factory Calculator.
Defines base/raw resources that are extracted rather than crafted.
"""

# Base resource extraction rates (items per minute at 100% efficiency)
BASE_RESOURCE_RATES = {
    'Desc_OreIron_C': 60,
    'Desc_OreCopper_C': 60,
    'Desc_Stone_C': 60,
    'Desc_Coal_C': 60,
    'Desc_OreBauxite_C': 60,
    'Desc_OreGold_C': 60,
    'Desc_RawQuartz_C': 60,
    'Desc_Sulfur_C': 60,
    'Desc_OreUranium_C': 60,
    'Desc_SAM_C': 60,
    'Desc_LiquidOil_C': 120,
    'Desc_Water_C': 120,
    'Desc_NitrogenGas_C': 120,
    'Desc_CrystalShard_C': 60,
}

# Mapping of base resources to their extraction machines
BASE_RESOURCE_MACHINES = {
    'Desc_OreIron_C': 'Miner',
    'Desc_OreCopper_C': 'Miner',
    'Desc_Stone_C': 'Miner',
    'Desc_Coal_C': 'Miner',
    'Desc_OreBauxite_C': 'Miner',
    'Desc_OreGold_C': 'Miner',
    'Desc_RawQuartz_C': 'Miner',
    'Desc_Sulfur_C': 'Miner',
    'Desc_OreUranium_C': 'Miner',
    'Desc_SAM_C': 'Miner',
    'Desc_LiquidOil_C': 'Oil Extractor',
    'Desc_Water_C': 'Water Extractor',
    'Desc_NitrogenGas_C': 'Resource Well Extractor',
    'Desc_CrystalShard_C': 'Miner',
}

# Set of all base resource IDs for quick lookup
BASE_RESOURCES = set(BASE_RESOURCE_RATES.keys())


def is_base_resource(item_id: str) -> bool:
    """Check if an item is a base/raw resource."""
    return item_id in BASE_RESOURCE_RATES


def get_extraction_rate(item_id: str) -> int:
    """
    Get the extraction rate for a base resource.
    Returns the items per minute at 100% efficiency.
    Returns 60 as default if item is not a base resource.
    """
    return BASE_RESOURCE_RATES.get(item_id, 60)


def get_extraction_machine(item_id: str) -> str:
    """
    Get the machine type used to extract a base resource.
    Returns 'Miner' as default if item is not found.
    """
    return BASE_RESOURCE_MACHINES.get(item_id, 'Miner')


def get_all_base_resources() -> set:
    """Get the set of all base resource IDs."""
    return BASE_RESOURCES.copy()

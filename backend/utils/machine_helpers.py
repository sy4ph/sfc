"""
Machine helper functions for Satisfactory Factory Calculator.
Handles machine display names and calculation logic.
"""

import math
from .math_helpers import round_to_precision

MACHINE_DISPLAY_NAMES = {
    'Desc_MinerMk1_C': 'Miner Mk.1',
    'Desc_MinerMk2_C': 'Miner Mk.2', 
    'Desc_MinerMk3_C': 'Miner Mk.3',
    'Desc_OilPump_C': 'Oil Extractor',
    'Desc_FrackingSmasher_C': 'Resource Well Pressurizer',
    'Desc_WaterPump_C': 'Water Extractor',
    'Desc_ConstructorMk1_C': 'Constructor',
    'Desc_AssemblerMk1_C': 'Assembler',
    'Desc_ManufacturerMk1_C': 'Manufacturer',
    'Desc_SmelterMk1_C': 'Smelter',
    'Desc_FoundryMk1_C': 'Foundry',
    'Desc_OilRefinery_C': 'Refinery',
    'Desc_Packager_C': 'Packager',
    'Desc_Blender_C': 'Blender',
    'Desc_ParticleAccelerator_C': 'Particle Accelerator',
    'Desc_QuantumEncoder_C': 'Quantum Encoder',
    'Desc_Converter_C': 'Converter'
}

def get_machine_display_name(machine_class_name):
    """
    Get the human-readable display name for a machine class name.
    Returns the class name if no display name is found.
    """
    return MACHINE_DISPLAY_NAMES.get(machine_class_name, machine_class_name)

def calculate_machine_info(theoretical_machines, machine_type="machines"):
    """
    Calculate machine count statistics including efficiency and display text.
    
    Args:
        theoretical_machines: Float number of machines needed (e.g. 2.5)
        machine_type: String label for the machine type (default "machines")
        
    Returns:
        Dict containing:
        - theoretical_machines: rounded float
        - actual_machines: ceil(theoretical)
        - full_machines: floor(theoretical)
        - partial_percent: percentage of the last machine used
        - efficiency_percent: overall efficiency (theoretical / actual * 100)
        - display_text: Human readable string (e.g. "2 machines + 1 machine (50%)")
    """
    if theoretical_machines <= 0:
        return {
            'theoretical_machines': 0,
            'actual_machines': 0,
            'full_machines': 0,
            'partial_percent': 0,
            'efficiency_percent': 0,
            'display_text': f'0 {machine_type}'
        }
    
    full_machines = int(theoretical_machines)
    partial_machine_percent = (theoretical_machines - full_machines) * 100
    
    # Logic for display text
    if theoretical_machines <= 1.0:
        if partial_machine_percent > 0:
            display_text = f"1 {machine_type} ({partial_machine_percent:.1f}%)"
        else:
            display_text = f"1 {machine_type}"
    else:
        if partial_machine_percent > 0.1: # Threshold to avoid showing 0.0% due to float precision
            display_text = f"{full_machines} {machine_type} + 1 {machine_type} ({partial_machine_percent:.1f}%)"
        else:
            display_text = f"{full_machines} {machine_type}"
    
    actual_machines = math.ceil(theoretical_machines)
    # Overall efficiency is theoretical / actual capacity
    overall_efficiency = round((theoretical_machines / actual_machines) * 100, 1) if actual_machines > 0 else 0
    
    return {
        'theoretical_machines': round_to_precision(theoretical_machines),
        'actual_machines': actual_machines,
        'full_machines': full_machines,
        'partial_percent': round(partial_machine_percent, 1),
        'efficiency_percent': overall_efficiency,
        'display_text': display_text
    }

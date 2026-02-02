import time
import json
from backend.services.calculation_service import calculate_production
from backend.data import get_item_name

def run_stress_test(item_id, amount=1.0):
    print(f"--- Stress Test: {get_item_name(item_id)} ({item_id}) ---")
    
    start_time = time.time()
    try:
        res = calculate_production(item_id, amount)
        end_time = time.time()
        
        duration = end_time - start_time
        print(f"Status: Success")
        print(f"Time Taken: {duration:.4f} seconds")
        print(f"Nodes in Graph: {len(res.get('graph', {}))}")
        print(f"Total Machines: {res.get('summary', {}).get('total_actual_machines')}")
        print("-" * 40)
        return duration
    except Exception as e:
        print(f"Status: FAILED")
        print(f"Error: {e}")
        print("-" * 40)
        return None

if __name__ == "__main__":
    test_items = [
        "Desc_IronIngot_C",             # Simple
        "Desc_ModularFrameHeavy_C",      # Medium
        "Desc_ComputerSuper_C",          # High
        "Desc_SpaceElevatorPart_8_C",    # Extreme (Thermal Propulsion Rocket)
        "Desc_SpaceElevatorPart_11_C"    # extreme (Ballistic Warp Drive)
    ]
    
    results = {}
    for item in test_items:
        duration = run_stress_test(item)
        if duration:
            results[item] = duration
            
    print("\nSummary of results:")
    for item, duration in results.items():
        print(f"{item:30} : {duration:.4f}s")

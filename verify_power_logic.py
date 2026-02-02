
import sys
import os

# Add root to path
sys.path.append(os.getcwd())

from backend.services.summary_service import calculate_summary_stats

def verify_power():
    # Mock graph with:
    # 1. Standard recipe (Iron Plate -> Constructor)
    # 2. Variable power recipe (Dark Matter -> Hadron Collider)
    
    graph = {
        'recipe_nodes': {
            'node1': {
                'recipe_id': 'Recipe_IronPlate_C',
                'machine_type': 'Desc_ConstructorMk1_C',
                'actual_machines': 10,
                'is_base_resource': False,
            },
            'node2': {
                'recipe_id': 'Recipe_DarkMatter_C', # Power=[500, 1500] -> Avg 1000
                'machine_type': 'Desc_HadronCollider_C',
                'actual_machines': 2,
                'is_base_resource': False,
            }
        }
    }
    
    print("Calculating summary...")
    summary = calculate_summary_stats(graph)
    
    total_power = summary['total_power']
    print(f"Total Power: {total_power} MW")
    
    # Expected:
    # Node 1: 10 * 4 MW = 40 MW
    # Node 2: 2 * ((500 + 1500)/2) = 2 * 1000 = 2000 MW
    # Total: 2040 MW
    
    expected = 2040.0
    if abs(total_power - expected) < 0.1:
        print("PASS: Power calculation is correct.")
    else:
        print(f"FAIL: Expected {expected}, got {total_power}")

if __name__ == "__main__":
    verify_power()

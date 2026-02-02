
import sys
import os
import json

# Add backend to path
sys.path.append(os.getcwd())
# Also add backend directory itself
sys.path.append(os.path.join(os.getcwd(), 'backend'))


from backend.data.loader import get_recipes, get_items

def inspect_data():
    recipes = get_recipes()
    items = get_items()
    
    print(f"Total recipes: {len(recipes)}")
    
    # Check machine IDs
    machines = set()
    for r in recipes.values():
        for m in r.get('producedIn', []):
            machines.add(m)
            
    print("\n--- Machines Found in Recipes ---")
    for m in sorted(list(machines)):
        print(m)
        
    # Check for Reanimated SAM and Converter recipes
    print("\n--- Converter/SAM Recipes ---")
    conversion_candidates = []
    for r_id, r in recipes.items():
        machines = r.get('producedIn', [])
        ingredients = [i['item'] for i in r.get('ingredients', [])]
        
        # Check for SAM-like items
        has_sam = any('SAM' in i or 'Reanimated' in i for i in ingredients)
        is_converter = any('Converter' in m for m in machines)
        
        if is_converter or has_sam:
            print(f"ID: {r_id}, Name: {r.get('name')}, Machines: {machines}, Ingredients: {ingredients}")

if __name__ == "__main__":
    inspect_data()

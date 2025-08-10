from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import json, math
from functools import lru_cache
from collections import defaultdict, deque
try:
    from pulp import LpProblem, LpVariable, LpMinimize, lpSum, LpStatusOptimal, value, PULP_CBC_CMD, LpStatus
    PULP_AVAILABLE = True
except Exception:
    PULP_AVAILABLE = False
# Solver configuration defaults
DEFAULT_SOLVER_TIME_LIMIT = 10  # seconds total budget
DEFAULT_REL_GAP = 0.0  # 0 for exact; can relax for speed

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, '..', 'frontend')

app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path='')
# In production you may wish to restrict origins; keep * for now.
CORS(app, resources={r"/api/*": {"origins": "*"}})

@app.route('/')
def index():
    """Serve the SPA index."""
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/images/<path:fname>')
def images(fname):
    return send_from_directory(os.path.join(app.static_folder, 'images'), fname)

@app.route('/api/health')
def health():
    return jsonify(status='ok')

recipe_complexity_cache = {}

def round_to_precision(value, precision=4):
    if value is None:
        return None
    return round(float(value), precision)

def get_machine_display_name(machine_class_name):
    machine_names = {
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
    return machine_names.get(machine_class_name, machine_class_name)

def calculate_machine_info(theoretical_machines, machine_type="machines"):
    if theoretical_machines <= 0:
        return {
            'machines_needed': 0,
            'efficiency_percent': 0,
            'display_text': f'0 {machine_type}'
        }
    
    full_machines = int(theoretical_machines)
    partial_machine_percent = (theoretical_machines - full_machines) * 100
    
    if theoretical_machines <= 1.0:
        if partial_machine_percent > 0:
            display_text = f"1 {machine_type} ({partial_machine_percent:.1f}%)"
        else:
            display_text = f"1 {machine_type}"
    else:
        if partial_machine_percent > 0.1:
            display_text = f"{full_machines} {machine_type} + 1 {machine_type} ({partial_machine_percent:.1f}%)"
        else:
            display_text = f"{full_machines} {machine_type}"
    
    actual_machines = math.ceil(theoretical_machines)
    overall_efficiency = round((theoretical_machines / actual_machines) * 100, 1) if actual_machines > 0 else 0
    
    return {
        'theoretical_machines': round_to_precision(theoretical_machines),
        'actual_machines': actual_machines,
        'full_machines': full_machines,
        'partial_percent': round(partial_machine_percent, 1),
        'efficiency_percent': overall_efficiency,
        'display_text': display_text
    }

def clean_nan_values(obj):
    if isinstance(obj, dict):
        return {k: clean_nan_values(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_nan_values(item) for item in obj]
    elif isinstance(obj, float) and (math.isnan(obj) or math.isinf(obj)):
        return None
    else:
        return obj

DATA_PATH = os.path.join(BASE_DIR, 'data1.0.json')
with open(DATA_PATH, 'r', encoding='utf-8') as f:
    data = json.load(f)
all_items = data.get('items', {})
all_recipes = data.get('recipes', {})
recipes = {name: recipe for name, recipe in all_recipes.items() if not recipe.get('forBuilding', False) and recipe.get('inMachine', True)}

produced_items = set()
for recipe in recipes.values():
    for product in recipe.get('products', []):
        produced_items.add(product['item'])


items = {item_id: item_data for item_id, item_data in all_items.items() if item_id in produced_items}


active_recipes = {}

class RecipeComplexityCalculator:
    
    def __init__(self):
        self.calculation_in_progress = set()  # Prevent infinite recursion
    
    def get_complexity_metrics(self, recipe_id, current_active_recipes=None, optimization_strategy='balanced_production'):
        if current_active_recipes is None:
            current_active_recipes = active_recipes
        
        if recipe_id in self.calculation_in_progress:
            return {
                'resource_amount': 10.0,
                'resource_types': 3,
                'machine_count': 2.0,
                'is_circular': True,
                'resource_types_list': []
            }
        
        self.calculation_in_progress.add(recipe_id)
        metrics = self._calculate_complexity(recipe_id, current_active_recipes, optimization_strategy)
        self.calculation_in_progress.remove(recipe_id)
        
        return metrics
    
    def _calculate_complexity(self, recipe_id, current_active_recipes, optimization_strategy):
        recipe = recipes.get(recipe_id)
        if not recipe:
            return {'resource_amount': 0, 'resource_types': 0, 'machine_count': 0, 'is_circular': False, 'resource_types_list': []}
        
        recipe_time = recipe.get('time', 1.0)
        if recipe_time <= 0:
            recipe_time = 1.0
        
        primary_product_amount = 0
        if recipe.get('products'):
            primary_product_amount = recipe['products'][0]['amount']
        
        if primary_product_amount <= 0:
            primary_product_amount = 1.0
        
        items_per_minute = (primary_product_amount * 60) / recipe_time
        per_unit_multiplier = 1.0 / primary_product_amount
        
        total_resource_amount = 0.0
        resource_types = set()
        total_machine_count = 1.0  
        
        for ingredient in recipe.get('ingredients', []):
            ingredient_item = ingredient['item']
            ingredient_amount = ingredient['amount'] * per_unit_multiplier
            
            if self._is_base_resource(ingredient_item):
                total_resource_amount += ingredient_amount
                resource_types.add(ingredient_item)
            else:
                best_ingredient_recipe_id = self._find_best_recipe_for_item(ingredient_item, current_active_recipes, optimization_strategy)
                
                if best_ingredient_recipe_id:
                    ingredient_metrics = self.get_complexity_metrics(best_ingredient_recipe_id, current_active_recipes, optimization_strategy)
                    
                    total_resource_amount += ingredient_metrics['resource_amount'] * ingredient_amount
                    resource_types.update(ingredient_metrics.get('resource_types_list', []))
                    total_machine_count += ingredient_metrics['machine_count'] * ingredient_amount
                else:
                    total_resource_amount += ingredient_amount
                    resource_types.add(ingredient_item)
        
        return {
            'resource_amount': round(total_resource_amount, 4),
            'resource_types': len(resource_types),
            'machine_count': round(total_machine_count, 4),
            'is_circular': False,
            'resource_types_list': list(resource_types)
        }
    
    def _is_base_resource(self, item_id):
        for recipe in recipes.values():
            for product in recipe.get('products', []):
                if product['item'] == item_id:
                    return False
        return True
    
    def _find_best_recipe_for_item(self, item_id, current_active_recipes, optimization_strategy):
        available_recipes = []
        
        for recipe_id, recipe in recipes.items():
            if not current_active_recipes.get(recipe_id, not recipe.get('alternate', False)):
                continue
            
            for product in recipe.get('products', []):
                if product['item'] == item_id:
                    available_recipes.append(recipe_id)
                    break
        
        if not available_recipes:
            return None
        
        if len(available_recipes) == 1:
            return available_recipes[0]
        
        if optimization_strategy == 'resource_efficiency':
            return self._select_recipe_by_direct_resource_cost(available_recipes)
        
        elif optimization_strategy == 'compact_build':
            return self._select_recipe_by_production_efficiency(available_recipes)
        
        elif optimization_strategy == 'resource_consolidation':
            return self._select_recipe_by_ingredient_diversity(available_recipes)
        
        else:  
            non_alternate = [rid for rid in available_recipes if not recipes[rid].get('alternate', False)]
            if non_alternate:
                return non_alternate[0]
            else:
                return available_recipes[0]
    
    def _select_recipe_by_direct_resource_cost(self, recipe_candidates):
        best_recipe = None
        best_score = float('inf')
        
        for recipe_id in recipe_candidates:
            recipe = recipes[recipe_id]
            score = 0
            
            for ingredient in recipe.get('ingredients', []):
                ingredient_amount = ingredient['amount']
                if self._is_base_resource(ingredient['item']):
                    score += ingredient_amount * 1.0
                else:
                    score += ingredient_amount * 3.0
            
            if score < best_score:
                best_score = score
                best_recipe = recipe_id
        
        return best_recipe
    
    def _select_recipe_by_production_efficiency(self, recipe_candidates):
        best_recipe = None
        best_efficiency = 0
        
        for recipe_id in recipe_candidates:
            recipe = recipes[recipe_id]
            recipe_time = recipe.get('time', 1.0)
            if recipe_time <= 0:
                recipe_time = 1.0
            
            primary_product_amount = 0
            if recipe.get('products'):
                primary_product_amount = recipe['products'][0]['amount']
            
            if primary_product_amount <= 0:
                primary_product_amount = 1.0
            
            efficiency = (primary_product_amount * 60) / recipe_time
            
            if efficiency > best_efficiency:
                best_efficiency = efficiency
                best_recipe = recipe_id
        
        return best_recipe
    
    def _select_recipe_by_ingredient_diversity(self, recipe_candidates):
        best_recipe = None
        best_score = float('inf')
        
        for recipe_id in recipe_candidates:
            recipe = recipes[recipe_id]
            
            base_resource_types = set()
            manufactured_items = 0
            
            for ingredient in recipe.get('ingredients', []):
                if self._is_base_resource(ingredient['item']):
                    base_resource_types.add(ingredient['item'])
                else:
                    manufactured_items += 1
            
            score = len(base_resource_types) * 2 + manufactured_items
            
            if score < best_score:
                best_score = score
                best_recipe = recipe_id
        
        return best_recipe
    
    def _get_resource_types_for_recipe(self, recipe_id):
        if recipe_id in self.complexity_cache:
            return set(self.complexity_cache[recipe_id].get('resource_types_list', []))
        
        metrics = self.get_complexity_metrics(recipe_id)
        return set(metrics.get('resource_types_list', []))
    
complexity_calculator = RecipeComplexityCalculator()

special_resource_recipes = {
    'Recipe_Bauxite_Caterium_C',      # Bauxite (Caterium)
    'Recipe_Bauxite_Copper_C',        # Bauxite (Copper)
    'Recipe_Caterium_Copper_C',    # Caterium Ore (Copper)
    'Recipe_Caterium_Quartz_C',    # Caterium Ore (Quartz)
    'Recipe_Coal_Iron_C',             # Coal (Iron)
    'Recipe_Coal_Limestone_C',        # Coal (Limestone)
    'Recipe_Copper_Quartz_C',      # Copper Ore (Quartz)
    'Recipe_Copper_Sulfur_C',      # Copper Ore (Sulfur)
    'Recipe_Iron_Limestone_C',     # Iron Ore (Limestone)
    'Recipe_Limestone_Sulfur_C',      # Limestone (Sulfur)
    'Recipe_Nitrogen_Bauxite_C',      # Nitrogen Gas (Bauxite)
    'Recipe_Nitrogen_Caterium_C',     # Nitrogen Gas (Caterium)
    'Recipe_Quartz_Bauxite_C',     # Raw Quartz (Bauxite)
    'Recipe_Quartz_Coal_C',        # Raw Quartz (Coal)
    'Recipe_Sulfur_Coal_C',           # Sulfur (Coal)
    'Recipe_Sulfur_Iron_C',           # Sulfur (Iron)
    'Recipe_Uranium_Bauxite_C'     # Uranium Ore (Bauxite)
}

for recipe_id, recipe in recipes.items():
    if recipe_id in special_resource_recipes:
        active_recipes[recipe_id] = False
    else:
        active_recipes[recipe_id] = not recipe.get('alternate', False)

# Base resource extraction rates and machine mapping
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

def is_base_resource(item_class_name):
    return item_class_name in BASE_RESOURCE_RATES

def discover_all_dependencies(target_item, visited=None, max_depth=15):
    if visited is None:
        visited = set()
    if target_item in visited or max_depth <= 0:
        return visited
    visited.add(target_item)
    if is_base_resource(target_item):
        return visited
    for rec in find_recipes_for_item(target_item):
        for ing in rec['recipe'].get('ingredients', []):
            discover_all_dependencies(ing['item'], visited, max_depth - 1)
    return visited

# Global debug flag for calculation verbosity
DEBUG_CALC = os.environ.get('APP_DEBUG', '0') == '1'

def _dbg(msg):
    if DEBUG_CALC:
        print(msg)

@app.route('/api/items', methods=['GET'])
def get_items():
    return jsonify(items)

@app.route('/api/recipes', methods=['GET'])
def get_recipes():
    return jsonify(recipes)

@app.route('/api/active-recipes', methods=['GET'])
def get_active_recipes():
    return jsonify(active_recipes)

@app.route('/api/active-recipes', methods=['POST'])
def update_active_recipes():
    try:
        data = request.json
        recipe_id = data.get('recipe_id')
        is_active = data.get('active')
        
        if recipe_id is None or is_active is None:
            return jsonify({"error": "Missing recipe_id or active parameter"}), 400
        
        if recipe_id not in recipes:
            return jsonify({"error": "Invalid recipe_id"}), 400
        
        active_recipes[recipe_id] = bool(is_active)
        return jsonify({"message": "Recipe status updated", "recipe_id": recipe_id, "active": active_recipes[recipe_id]})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/active-recipes/bulk', methods=['POST'])
def bulk_update_active_recipes():
    try:
        data = request.json
        updates = data.get('updates', {})
        
        for recipe_id, is_active in updates.items():
            if recipe_id in recipes:
                active_recipes[recipe_id] = bool(is_active)
        
        return jsonify({"message": f"Updated {len(updates)} recipes", "active_recipes": active_recipes})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/recipes-with-status', methods=['GET'])
def get_recipes_with_status():
    recipes_with_status = {}
    for recipe_id, recipe in recipes.items():
        is_unpackage = 'unpackage' in recipe_id.lower() or 'unpack' in recipe.get('name', '').lower()
        
        recipes_with_status[recipe_id] = {
            **recipe,
            'active': active_recipes.get(recipe_id, False),
            'special_resource': recipe_id in special_resource_recipes,
            'is_disabled': is_unpackage,
            'disabled_reason': 'Unpackage recipes are disabled to prevent circular dependencies' if is_unpackage else None
        }
    return jsonify(recipes_with_status)

@app.route('/api/recipe-complexity', methods=['GET'])
def get_recipe_complexity():
    complexity_data = []
    
    for recipe_id in recipes.keys():
        complexity = complexity_calculator.get_complexity_metrics(recipe_id, active_recipes, 'balanced_production')
        recipe = recipes[recipe_id]
        
        resource_names = []
        for resource_id in complexity.get('resource_types_list', []):
            resource_name = all_items.get(resource_id, {}).get('name', resource_id)
            resource_names.append(resource_name)
        
        complexity_data.append({
            'recipe_id': recipe_id,
            'recipe_name': recipe.get('name', recipe_id),
            'alternate': recipe.get('alternate', False),
            'active': active_recipes.get(recipe_id, False),
            'resource_amount': complexity['resource_amount'],
            'resource_types': complexity['resource_types'],
            'machine_count': complexity['machine_count'],
            'is_circular': complexity.get('is_circular', False),
            'resource_names': resource_names,
            'ingredient_count': len(recipe.get('ingredients', [])),
            'time': recipe.get('time', 0),
            'producedIn': recipe.get('producedIn', [])
        })
    
    return jsonify(complexity_data)

# @app.route('/api/dump-complexity', methods=['GET'])
# def dump_complexity_to_file():
#     import json
    
#     complexity_data = []
    
#     for recipe_id in recipes.keys():
#         complexity = complexity_calculator.get_complexity_metrics(recipe_id, active_recipes, 'balanced_production')
#         recipe = recipes[recipe_id]
        
#         resource_names = []
#         for resource_id in complexity.get('resource_types_list', []):
#             resource_name = all_items.get(resource_id, {}).get('name', resource_id)
#             resource_names.append(resource_name)
        
#         complexity_data.append({
#             'recipe_id': recipe_id,
#             'recipe_name': recipe.get('name', recipe_id),
#             'alternate': recipe.get('alternate', False),
#             'active': active_recipes.get(recipe_id, False),
#             'resource_amount': complexity['resource_amount'],
#             'resource_types': complexity['resource_types'],
#             'machine_count': complexity['machine_count'],
#             'is_circular': complexity.get('is_circular', False),
#             'resource_names': resource_names,
#             'ingredient_count': len(recipe.get('ingredients', [])),
#             'time': recipe.get('time', 0),
#             'producedIn': recipe.get('producedIn', [])
#         })
    
#     # Sort by resource_amount descending to see the highest complexity first
#     complexity_data.sort(key=lambda x: x['resource_amount'], reverse=True)
    
#     # Write to file
#     output_file = 'recipe_complexity_analysis.json'
#     with open(output_file, 'w', encoding='utf-8') as f:
#         json.dump(complexity_data, f, indent=2, ensure_ascii=False)
    
#     return jsonify({
#         'message': f'Complexity data dumped to {output_file}',
#         'total_recipes': len(complexity_data),
#         'file_path': output_file
#     })

@app.route('/api/recipe-complexity/<recipe_id>', methods=['GET'])
def get_single_recipe_complexity(recipe_id):
    if recipe_id not in recipes:
        return jsonify({"error": "Recipe not found"}), 404
    
    complexity = complexity_calculator.get_complexity_metrics(recipe_id, active_recipes, 'balanced_production')
    recipe = recipes[recipe_id]
    
    resource_names = []
    for resource_id in complexity.get('resource_types_list', []):
        resource_name = all_items.get(resource_id, {}).get('name', resource_id)
        resource_names.append(resource_name)
    
    ingredient_details = []
    for ingredient in recipe.get('ingredients', []):
        ingredient_name = all_items.get(ingredient['item'], {}).get('name', ingredient['item'])
        ingredient_details.append({
            'item_id': ingredient['item'],
            'item_name': ingredient_name,
            'amount': ingredient['amount']
        })
    
    return jsonify({
        'recipe_id': recipe_id,
        'recipe_name': recipe.get('name', recipe_id),
        'alternate': recipe.get('alternate', False),
        'active': active_recipes.get(recipe_id, False),
        'complexity': {
            'resource_amount': complexity['resource_amount'],
            'resource_types': complexity['resource_types'],
            'machine_count': complexity['machine_count'],
            'is_circular': complexity.get('is_circular', False),
            'resource_names': resource_names
        },
        'recipe_details': {
            'time': recipe.get('time', 0),
            'ingredients': ingredient_details,
            'products': recipe.get('products', []),
            'producedIn': recipe.get('producedIn', [])
        }
    })

@app.route('/api/recipes/<recipe_id>/toggle', methods=['POST'])
def toggle_recipe(recipe_id):
    global active_recipes
    
    if recipe_id not in recipes:
        return jsonify({'error': 'Recipe not found'}), 404
    
    data = request.get_json()
    if 'active' not in data:
        return jsonify({'error': 'Missing active status'}), 400
    
    active_recipes[recipe_id] = data['active']
    
    return jsonify({
        'success': True,
        'recipe_id': recipe_id,
        'active': active_recipes[recipe_id]
    })

def find_recipes_for_item(item_class_name):
    available_recipes = []
    
    for recipe_id, recipe in recipes.items():
        if not active_recipes.get(recipe_id, False):
            continue  
        
        if 'unpackage' in recipe_id.lower() or 'unpack' in recipe.get('name', '').lower():
            continue
        
        for product in recipe.get('products', []):
            if product['item'] == item_class_name:
                recipe_time = recipe.get('time', 1.0)
                output_amount = product['amount']
                recipe_time = recipe.get('time', 1.0) 
                if recipe_time <= 0:
                    recipe_time = 1.0
                items_per_minute = (output_amount * 60) / recipe_time
                
                all_products = []
                for prod in recipe.get('products', []):
                    prod_rate = (prod['amount'] * 60) / recipe_time
                    all_products.append({
                        'item': prod['item'],
                        'amount': prod['amount'],
                        'rate_per_minute': prod_rate,
                        'is_target': prod['item'] == item_class_name
                    })
                
                available_recipes.append({
                    'recipe_id': recipe_id,
                    'recipe': recipe,
                    'target_product': product,
                    'items_per_minute': items_per_minute,
                    'recipe_time': recipe_time,
                    'all_products': all_products
                })
                break
    
    return available_recipes

def topological_sort_items(items_set):
    """Robust Kahn topological sort using union of all ingredient dependencies across all active recipes."""
    deps = {i: set() for i in items_set}
    reverse = {i: set() for i in items_set}
    for item in items_set:
        if is_base_resource(item):
            continue
        for r in find_recipes_for_item(item):
            for ing in r['recipe'].get('ingredients', []):
                ing_item = ing['item']
                if ing_item in items_set and ing_item != item:
                    deps[item].add(ing_item)
                    reverse[ing_item].add(item)
    ready = [i for i in items_set if not deps[i] or is_base_resource(i)]
    ordered = []
    while ready:
        current = ready.pop()
        ordered.append(current)
        for dependant in list(reverse[current]):
            deps[dependant].discard(current)
            if not deps[dependant]:
                ready.append(dependant)
    # Append any leftover (cycles) deterministically
    for item in items_set:
        if item not in ordered:
            ordered.append(item)
    return ordered

def calculate_actual_recipe_metrics(recipe_data, item_metrics, target_item_id):
    """Per-unit metrics for the product target_item_id produced by recipe_data."""
    recipe = recipe_data['recipe']
    products = recipe.get('products', []) or []
    # Identify primary product matching target_item_id else fall back to max amount
    primary = None
    for p in products:
        if p.get('item') == target_item_id:
            primary = p
            break
    if primary is None and products:
        primary = max(products, key=lambda x: x.get('amount', 0))
    if not primary:
        return {
            'base_resources_per_unit': float('inf'),
            'unique_types': 0,
            'machines_per_unit': float('inf'),
            'recipes_per_unit': float('inf'),
            'unique_recipes_count': 0,
            'base_types_set': set(),
            'dependency_recipes_set': set(),
            'primary_output_amount': 0
        }
    primary_amount = primary.get('amount', 0) or 1
    recipe_time = recipe.get('time', 1) or 1
    # Items per minute for primary
    ipm = (primary_amount * 60.0) / recipe_time
    machines_per_unit = 1.0 / ipm  # machines needed per 1 item per minute of primary output
    recipes_per_unit = machines_per_unit  # each machine runs this recipe
    total_base = 0.0
    base_types = set()
    dep_recipes = {recipe_data['recipe_id']}
    for ing in recipe.get('ingredients', []):
        iid = ing['item']
        amt = ing['amount']
        amt_per_primary_unit = amt / primary_amount
        if is_base_resource(iid):
            total_base += amt_per_primary_unit
            base_types.add(iid)
        else:
            if iid in item_metrics:
                m = item_metrics[iid]
                total_base += m['base_resources_per_unit'] * amt_per_primary_unit
                base_types.update(m['base_types_set'])
                dep_recipes.update(m['dependency_recipes_set'])
                machines_per_unit += m['machines_per_unit'] * amt_per_primary_unit
                recipes_per_unit += m.get('recipes_per_unit', 0) * amt_per_primary_unit
            else:
                # Penalize unknown path
                total_base += amt_per_primary_unit * 50
    return {
        'base_resources_per_unit': total_base,
        'unique_types': len(base_types),
        'machines_per_unit': machines_per_unit,
        'recipes_per_unit': recipes_per_unit,
        'unique_recipes_count': len(dep_recipes),
        'base_types_set': base_types,
        'dependency_recipes_set': dep_recipes,
        'primary_output_amount': primary_amount
    }

def score_recipe_by_strategy(metrics, recipe, optimization_strategy):
    base = metrics['base_resources_per_unit']
    uniq = metrics['unique_types']
    mach = metrics['machines_per_unit']
    recs = metrics['unique_recipes_count']
    if optimization_strategy == 'resource_efficiency':
        score = base * 1000 + uniq * 15 + mach * 100
    elif optimization_strategy == 'compact_build':
        score = mach * 5000 + recs * 200 + base * 50
    elif optimization_strategy == 'resource_consolidation':
        score = uniq * 20000 + base * 500 + recs * 10
    else:  # balanced
        score = base * 1200 + uniq * 2500 + mach * 2000 + recs * 800
    if recipe.get('alternate'):
        score *= 1.08 if optimization_strategy == 'balanced_production' else 1.12
    return score

def build_initial_selection(target_item, strategy):
    """Greedy initial selection per item using per-unit heuristic."""
    selection = {}
    closure = discover_all_dependencies(target_item)
    for item in closure:
        if is_base_resource(item):
            continue
        cands = find_recipes_for_item(item)
        if not cands:
            continue
        best = None
        best_score = float('inf')
        for r in cands:
            # Quick local heuristic: sum base inputs depth 1
            base_cost = 0
            uniq = set()
            for ing in r['recipe'].get('ingredients', []):
                if is_base_resource(ing['item']):
                    base_cost += ing['amount']
                    uniq.add(ing['item'])
            score = base_cost * 100 + len(uniq) * 10
            if r['recipe'].get('alternate'):  # mild penalty
                score *= 1.1
            if score < best_score:
                best_score = score
                best = r
        if best:
            selection[item] = best
    return selection

def simulate_chain(selection, target_item, target_amount):
    """Given a mapping item->chosen recipe_data, simulate production to satisfy target_amount.
    Returns production_graph-like structure and metrics."""
    recipe_nodes = {}
    item_balance = defaultdict(float)
    item_balance[target_item] -= target_amount
    queue = deque([target_item])
    node_counter = 0
    iteration = 0
    max_iter = 5000
    while queue and iteration < max_iter:
        iteration += 1
        item = queue.popleft()
        bal = item_balance[item]
        if bal >= -1e-6:
            continue
        shortage = -bal
        if is_base_resource(item):
            base_rate = BASE_RESOURCE_RATES[item]
            theoretical = shortage / base_rate
            existing = None
            for nid, nd in recipe_nodes.items():
                if nd.get('is_base_resource') and item in nd['outputs']:
                    existing = nd
                    break
            machine_type_class = BASE_RESOURCE_MACHINES.get(item, 'Miner')
            machine_info = calculate_machine_info(theoretical, get_machine_display_name(machine_type_class))
            if existing:
                existing['machines_needed'] = round_to_precision(existing['machines_needed'] + theoretical)
                existing['actual_machines'] = machine_info['actual_machines']
                existing['machine_efficiency'] = machine_info['efficiency_percent']
                existing['outputs'][item] = existing['outputs'].get(item, 0) + shortage
            else:
                nid = f"extract_{item}_{node_counter}"; node_counter += 1
                recipe_nodes[nid] = {
                    'node_id': nid,
                    'recipe_id': f'extract_{item}',
                    'recipe_name': f'Extract {items.get(item, {}).get("name", item)}',
                    'machine_type': machine_type_class,
                    'machines_needed': round_to_precision(theoretical),
                    'actual_machines': machine_info['actual_machines'],
                    'machine_efficiency': machine_info['efficiency_percent'],
                    'machine_display': machine_info['display_text'],
                    'is_base_resource': True,
                    'inputs': {},
                    'outputs': {item: shortage}
                }
            item_balance[item] += shortage
            continue
        if item not in selection:
            # No recipe -> cannot satisfy, leave shortage
            continue
        rdata = selection[item]
        recipe = rdata['recipe']
        # Determine primary product rate (items_per_minute already refers to target product in construction)
        primary_rate = None
        for prod in rdata['all_products']:
            if prod['item'] == item:
                primary_rate = prod['rate_per_minute']
                break
        if not primary_rate or primary_rate <= 0:
            continue
        theoretical = shortage / primary_rate
        # Existing node reuse if same recipe
        existing = None
        for nid, nd in recipe_nodes.items():
            if not nd.get('is_base_resource') and nd.get('recipe_id') == rdata['recipe_id']:
                existing = nd
                break
        recipe_time = rdata['recipe_time']
        cycles_per_min = 60.0 / recipe_time
        if existing:
            old_inputs = dict(existing['inputs'])
            old_outputs = dict(existing['outputs'])
            existing['machines_needed'] = round_to_precision(existing['machines_needed'] + theoretical)
            machine_type = recipe.get('producedIn', ['Unknown'])[0]
            machine_info = calculate_machine_info(existing['machines_needed'], get_machine_display_name(machine_type))
            existing['actual_machines'] = machine_info['actual_machines']
            existing['machine_efficiency'] = machine_info['efficiency_percent']
            existing['machine_display'] = machine_info['display_text']
            # Recompute inputs/outputs
            total_theoretical = existing['machines_needed']
            new_inputs = {}
            for ing in recipe.get('ingredients', []):
                rate = ing['amount'] * cycles_per_min * total_theoretical
                new_inputs[ing['item']] = round_to_precision(rate)
            new_outputs = {}
            for prod in rdata['all_products']:
                rate = prod['rate_per_minute'] * total_theoretical
                new_outputs[prod['item']] = round_to_precision(rate)
            existing['inputs'] = new_inputs
            existing['outputs'] = new_outputs
            # Balance adjustments
            for iid, prev in old_inputs.items():
                delta = prev - new_inputs.get(iid, 0)
                item_balance[iid] += delta
            for oid, prev in old_outputs.items():
                delta = new_outputs.get(oid, 0) - prev
                item_balance[oid] += delta
        else:
            machine_type = recipe.get('producedIn', ['Unknown'])[0]
            machine_info = calculate_machine_info(theoretical, get_machine_display_name(machine_type))
            inputs = {}
            for ing in recipe.get('ingredients', []):
                rate = ing['amount'] * cycles_per_min * theoretical
                inputs[ing['item']] = round_to_precision(rate)
            outputs = {}
            for prod in rdata['all_products']:
                outputs[prod['item']] = round_to_precision(prod['rate_per_minute'] * theoretical)
            nid = f"recipe_{rdata['recipe_id']}_{node_counter}"; node_counter += 1
            recipe_nodes[nid] = {
                'node_id': nid,
                'recipe_id': rdata['recipe_id'],
                'recipe_name': recipe.get('name', rdata['recipe_id']),
                'machine_type': machine_type,
                'machines_needed': round_to_precision(theoretical),
                'actual_machines': machine_info['actual_machines'],
                'machine_efficiency': machine_info['efficiency_percent'],
                'machine_display': machine_info['display_text'],
                'recipe_time': recipe_time,
                'cycles_per_minute': cycles_per_min,
                'is_base_resource': False,
                'is_alternate': recipe.get('alternate', False),
                'inputs': inputs,
                'outputs': outputs,
                'all_products': rdata['all_products'],
                'recipe_data': recipe,
                'optimal_recipe': True
            }
            # Update balances
            for iid, rate in inputs.items():
                item_balance[iid] -= rate
                if item_balance[iid] < 0 and iid not in queue:
                    queue.append(iid)
            for oid, rate in outputs.items():
                item_balance[oid] += rate
        # If still negative add back to queue (floating-point safety)
        if item_balance[item] < -1e-6 and item not in queue:
            queue.append(item)
        # Queue new ingredient shortages
        for ing in recipe.get('ingredients', []):
            if item_balance[ing['item']] < -1e-6 and ing['item'] not in queue:
                queue.append(ing['item'])
    # Surplus nodes
    surplus_nodes = {}
    surplus_items = {}
    for iid, bal in item_balance.items():
        if bal > 1e-6:
            nid = f"surplus_{iid}_{node_counter}"; node_counter += 1
            surplus_nodes[nid] = {
                'node_id': nid,
                'recipe_id': f'surplus_{iid}',
                'recipe_name': f'Surplus: {items.get(iid, {}).get("name", iid)}',
                'machine_type': 'Surplus Output',
                'machines_needed': 0,
                'is_surplus_node': True,
                'inputs': {iid: bal},
                'outputs': {},
                'surplus_amount': bal,
                'surplus_item_id': iid
            }
            surplus_items[iid] = {'amount': bal, 'item_name': items.get(iid, {}).get('name', iid)}
    # End product node
    end_id = f"end_{target_item}_{node_counter}"; node_counter += 1
    recipe_nodes[end_id] = {
        'node_id': end_id,
        'recipe_id': f'end_product_{target_item}',
        'recipe_name': f'Target: {items.get(target_item, {}).get("name", target_item)}',
        'machine_type': 'End Product',
        'machines_needed': 0,
        'is_end_product_node': True,
        'inputs': {target_item: target_amount},
        'outputs': {},
        'target_item_id': target_item,
        'target_amount': target_amount
    }
    recipe_nodes.update(surplus_nodes)
    # Metrics aggregation
    total_machines = 0.0
    total_actual = 0
    base_resource_amount = 0.0
    base_types = set()
    unique_recipes = set()
    for nd in recipe_nodes.values():
        if nd.get('is_surplus_node') or nd.get('is_end_product_node'):
            continue
        total_machines += nd.get('machines_needed', 0)
        total_actual += nd.get('actual_machines', 0)
        if nd.get('is_base_resource'):
            for k, v in nd.get('outputs', {}).items():
                base_resource_amount += v
                base_types.add(k)
        if nd.get('recipe_id'):
            unique_recipes.add(nd['recipe_id'])
    metrics = {
        'total_machines': total_machines,
        'actual_machines': total_actual,
        'base_resource_amount': base_resource_amount,
        'base_resource_types': len(base_types),
        'base_types_set': base_types,
        'unique_recipes': len(unique_recipes),
        'unique_items': len(item_balance)
    }
    return {
        'recipe_nodes': recipe_nodes,
        'item_balance': dict(item_balance),
        'surplus_items': surplus_items,
        'surplus_nodes': surplus_nodes,
        'end_product_node': recipe_nodes[end_id],
        'target_item': target_item,
        'target_amount': target_amount,
        'selection': selection,
        'metrics': metrics
    }

def score_chain(chain, strategy):
    m = chain['metrics']
    base = m['base_resource_amount']
    types = m['base_resource_types']
    machines = m['total_machines']
    uniq_rec = m['unique_recipes']
    uniq_items = m['unique_items']
    if strategy == 'resource_efficiency':
        return base * 1000 + types * 200 + machines * 50
    if strategy == 'compact_build':
        return machines * 2000 + uniq_rec * 500 + base * 200
    if strategy == 'resource_consolidation':
        return types * 50000 + base * 500 + machines * 50
    # balanced
    return base * 1500 + types * 4000 + machines * 1200 + uniq_rec * 600

def generate_neighbors(selection, strategy, target_item, limit_per_item=3):
    """Yield cloned selections with one item's recipe changed."""
    for item, current in list(selection.items()):
        cands = find_recipes_for_item(item)
        if len(cands) < 2:
            continue
        # Simple ranking by local base input count
        scored = []
        for r in cands:
            if r['recipe_id'] == current['recipe_id']:
                continue
            base_cost = 0; uniq=set()
            for ing in r['recipe'].get('ingredients', []):
                if is_base_resource(ing['item']):
                    base_cost += ing['amount']; uniq.add(ing['item'])
            scored.append((base_cost + len(uniq)*0.1, r))
        scored.sort(key=lambda x: x[0])
        for _, r in scored[:limit_per_item]:
            new_sel = dict(selection)
            new_sel[item] = r
            yield new_sel

def optimize_production(target_item, target_amount, strategy, beam_size=5, iterations=4):
    initial = build_initial_selection(target_item, strategy)
    initial_chain = simulate_chain(initial, target_item, target_amount)
    best_score = score_chain(initial_chain, strategy)
    beam = [(best_score, initial_chain, initial)]
    global_best = (best_score, initial_chain, initial)
    for _ in range(iterations):
        candidates = []
        for score_val, chain, sel in beam:
            for neigh in generate_neighbors(sel, strategy, target_item):
                n_chain = simulate_chain(neigh, target_item, target_amount)
                n_score = score_chain(n_chain, strategy)
                candidates.append((n_score, n_chain, neigh))
        if not candidates:
            break
        candidates.sort(key=lambda x: x[0])
        beam = candidates[:beam_size]
        if beam[0][0] < global_best[0]:
            global_best = beam[0]
    return global_best[1]

# ===== Strategy / LP Definitions (added) =====
REMOVED_STRATEGY = 'simplified_logistics'
OPTIMIZATION_STRATEGIES = [
    'resource_efficiency',
    'resource_consolidation',
    'compact_build',
    'balanced_production',
    'custom'
]

DEFAULT_STRATEGY_WEIGHTS = {
    # Minimize total base resource usage foremost; slight penalty for extra types; tiny penalty for extra recipes; ignore machines.
    'resource_efficiency':    {'base': 1.0, 'base_types': 0.25, 'machines': 0.0, 'recipes': 0.05},
    # Strongly minimize distinct base types, then total base; modest recipe penalty; ignore machines.
    'resource_consolidation': {'base': 0.3, 'base_types': 3.0, 'machines': 0.0, 'recipes': 0.4},
    # Compact: prioritize minimizing distinct recipes, then base amount, then base types; no machine metric.
    'compact_build':          {'base': 0.2, 'base_types': 0.1, 'machines': 0.0, 'recipes': 3.0},
    # Balanced: focus on recipe count and base amount jointly; small weight on base types; ignore machines.
    'balanced_production':    {'base': 1.0, 'base_types': 0.2, 'machines': 0.0, 'recipes': 1.0},
    # Custom starts neutral (user will change) with zero machine importance by default.
    'custom':                 {'base': 1.0, 'base_types': 1.0, 'machines': 0.0, 'recipes': 1.0},
}

BIG_M_MACHINE = 10000
BIG_M_BASE = 100000

def _get_strategy_weights(strategy: str, custom_weights: dict | None):
    base_w = dict(DEFAULT_STRATEGY_WEIGHTS.get(strategy, DEFAULT_STRATEGY_WEIGHTS['balanced_production']))
    if strategy == 'custom' and custom_weights:
        for k in ['base', 'base_types', 'machines', 'recipes']:
            if k in custom_weights and isinstance(custom_weights[k], (int, float)):
                base_w[k] = float(custom_weights[k])
    return base_w

@lru_cache(maxsize=1)
def _all_item_ids():
    ids = set()
    for r in recipes.values():
        for prod in r.get('products', []):
            ids.add(prod['item'])
        for ing in r.get('ingredients', []):
            ids.add(ing['item'])
    return ids

# Helper: compute dependency closure of items and relevant recipes for a target
def _dependency_closure_recipes(target_item: str, active_map=None):
    """Compute dependency closure limited to recipes active in active_map (stateless input)."""
    if active_map is None:
        active_map = active_recipes
    needed_items = set()
    needed_recipes = set()
    stack = [target_item]
    depth_guard = 0
    while stack and depth_guard < 10000:
        depth_guard += 1
        itm = stack.pop()
        if itm in needed_items:
            continue
        needed_items.add(itm)
        if is_base_resource(itm):
            continue
        for r_id, r in recipes.items():
            if not active_map.get(r_id, False):
                continue
            produces = any(p['item'] == itm for p in r.get('products', []))
            if not produces:
                continue
            needed_recipes.add(r_id)
            for ing in r.get('ingredients', []):
                stack.append(ing['item'])
    return needed_items, needed_recipes

def lp_optimize(target_item: str, amount_per_min: float, strategy: str, custom_weights: dict | None = None, time_limit: float = None, rel_gap: float = 0.0, active_map=None):
    """MILP optimization using provided active recipe map (stateless)."""
    if active_map is None:
        active_map = active_recipes
    # Quality-focused version: multi-pass lex for non-custom, weighted single pass for custom.
    if not PULP_AVAILABLE:
        raise RuntimeError('PuLP not installed in environment')
    if target_item not in items:
        raise ValueError('Unknown target item')
    if time_limit is None:
        time_limit = DEFAULT_SOLVER_TIME_LIMIT

    weights = _get_strategy_weights(strategy, custom_weights)

    # --- Dependency closure prune with safeguard ---
    needed_items, needed_recipes = _dependency_closure_recipes(target_item, active_map)
    active_recipe_ids = [rid for rid in needed_recipes if active_map.get(rid, False)]
    # Fallback conditions for pruning: too few recipes (suspicious) OR missing producer for a non-base item
    if len(active_recipe_ids) < 3:
        active_recipe_ids = [rid for rid, r in recipes.items() if active_map.get(rid, False)]
    else:
        # Ensure every non-base item in needed_items has at least one active producer (unless it's the target with only base inputs)
        missing = []
        for itm in needed_items:
            if is_base_resource(itm):
                continue
            if itm == target_item:
                continue
            if itm in ['Desc_SpitterParts_C', 'Desc_HogParts_C', 'Desc_PlutoniumWaste_C', 'Desc_Wood_C', 'Desc_Leaves_C', 'Desc_StingerParts_C', 'Desc_Mycelia_C', 'Desc_HatcherParts_C']:
                continue
            prod_found = False
            for rid in active_recipe_ids:
                rec = recipes[rid]
                for p in rec.get('products', []):
                    if p['item'] == itm:
                        prod_found = True
                        break
                if prod_found:
                    break
            if not prod_found:
                missing.append(itm)
        if missing:
            if DEBUG_CALC:
                print(f"[MILP] Prune fallback: missing producers for {len(missing)} items -> using full recipe set. Items in question: {missing}")
            active_recipe_ids = [rid for rid, r in recipes.items() if active_map.get(rid, False)]
            needed_items = set(i for r in active_recipe_ids for prod in recipes[r].get('products', []) for i in [prod['item']]) | needed_items

    if not active_recipe_ids:
        raise ValueError('No active recipes to use in optimization (none provided)')

    base_items = [iid for iid in _all_item_ids() if is_base_resource(iid) and (iid in needed_items or strategy=='custom')]

    # --- Model builder ---
    def build_model():
        model = LpProblem('production_plan', LpMinimize)
        m_vars = {rid: LpVariable(f'm_{rid}', lowBound=0) for rid in active_recipe_ids}
        y_recipe = {rid: LpVariable(f'y_{rid}', lowBound=0, upBound=1, cat='Binary') for rid in active_recipe_ids}
        # Loose but safe upper bound (quality priority) using global BIG_M_MACHINE
        for rid in active_recipe_ids:
            model += m_vars[rid] <= BIG_M_MACHINE * y_recipe[rid]
        base_use = {iid: LpVariable(f'base_{iid}', lowBound=0) for iid in base_items}
        base_used_bin = {iid: LpVariable(f'ub_{iid}', lowBound=0, upBound=1, cat='Binary') for iid in base_items}
        for iid in base_items:
            model += base_use[iid] <= BIG_M_BASE * base_used_bin[iid]
        prod_coeff = defaultdict(lambda: defaultdict(float))
        cons_coeff = defaultdict(lambda: defaultdict(float))
        for rid in active_recipe_ids:
            rec = recipes[rid]
            t = rec.get('time', 1.0) or 1.0
            cyc = 60.0 / t
            for p in rec.get('products', []):
                if strategy == 'custom' or p['item'] in needed_items or p['item'] == target_item:
                    prod_coeff[p['item']][rid] += p['amount'] * cyc
            for ing in rec.get('ingredients', []):
                if strategy == 'custom' or ing['item'] in needed_items or ing['item'] == target_item:
                    cons_coeff[ing['item']][rid] += ing['amount'] * cyc
        relevant = set(prod_coeff.keys()) | set(cons_coeff.keys()) | {target_item}
        for iid in relevant:
            if is_base_resource(iid):
                if iid in cons_coeff:
                    model += base_use[iid] >= lpSum(cons_coeff[iid][rid] * m_vars[rid] for rid in cons_coeff[iid])
            else:
                prod_expr = lpSum(prod_coeff[iid][rid] * m_vars[rid] for rid in prod_coeff.get(iid, {})) if iid in prod_coeff else 0
                cons_expr = lpSum(cons_coeff[iid][rid] * m_vars[rid] for rid in cons_coeff.get(iid, {})) if iid in cons_coeff else 0
                demand = amount_per_min if iid == target_item else 0
                # Tight equality for target (allow tiny float tolerance both sides)
                if iid == target_item:
                    model += prod_expr - cons_expr >= demand
                    model += prod_expr - cons_expr <= demand * 1.0000001
                else:
                    model += prod_expr - cons_expr >= demand
        comps = {
            'total_base': lpSum(base_use[i] for i in base_items) if base_items else 0,
            'uniq_base_types': lpSum(base_used_bin[i] for i in base_items) if base_items else 0,
            'machines': lpSum(m_vars[r] for r in active_recipe_ids),  # retained (not prioritized unless custom)
            'uniq_recipes': lpSum(y_recipe[r] for r in active_recipe_ids)
        }
        return model, m_vars, y_recipe, base_use, base_used_bin, comps

    PRIORITIES = {
        'resource_efficiency': ['total_base', 'uniq_base_types', 'uniq_recipes'],
        'resource_consolidation': ['uniq_base_types', 'uniq_recipes', 'total_base'],
        'compact_build': ['uniq_recipes', 'uniq_base_types', 'total_base'],
        # Balanced: prioritize total_base first, then recipe count, then base type diversity.
        'balanced_production': ['uniq_recipes', 'uniq_base_types', 'total_base'],
    }

    proven_optimal = True

    def solve_weighted():
        model, m_vars, y_recipe, base_use, base_used_bin, comps = build_model()
        model += (weights['base'] * comps['total_base'] +
                  weights['base_types'] * comps['uniq_base_types'] +
                  weights['machines'] * comps['machines'] +
                  weights['recipes'] * comps['uniq_recipes'])
        solver = PULP_CBC_CMD(timeLimit=max(1, int(time_limit)), msg=False, gapRel=rel_gap if rel_gap > 0 else None)
        status = model.solve(solver)
        from pulp import LpStatus
        if DEBUG_CALC:
            print(f"[MILP] custom weighted status={LpStatus[status]}")
        if LpStatus[status] in ('Infeasible','Undefined'):
            return None
        if LpStatus[status] not in ('Optimal','Integer Feasible'):
            proven = False
        else:
            proven = LpStatus[status] == 'Optimal'
        return model, m_vars, y_recipe, base_use, base_used_bin, comps, proven

    def solve_lex(order):
        fixed = {}
        last_pack = None
        remaining_time = time_limit
        passes = len(order)
        for idx, comp in enumerate(order):
            alloc = max(1, int(remaining_time / (passes - idx)))
            model, m_vars, y_recipe, base_use, base_used_bin, comps = build_model()
            # Add fix constraints
            for cname, val in fixed.items():
                model += comps[cname] <= val * 1.0000001
                model += comps[cname] >= val * 0.9999999
            model += comps[comp]
            solver = PULP_CBC_CMD(timeLimit=alloc, msg=False, gapRel=rel_gap if rel_gap > 0 else None)
            status = model.solve(solver)
            from pulp import LpStatus
            st = LpStatus[status]
            if DEBUG_CALC:
                print(f"[MILP] lex pass {idx+1}/{passes} component={comp} status={st} alloc={alloc}s")
            if st in ('Infeasible','Undefined'):
                return None
            if st not in ('Optimal','Integer Feasible'):
                # Accept incumbent but mark not proven optimal overall
                val = value(comps[comp]) if comps[comp] is not None else 0
                fixed[comp] = val
                remaining_time -= alloc
                return (model, m_vars, y_recipe, base_use, base_used_bin, comps, dict(fixed), False)
            val = value(comps[comp])
            fixed[comp] = val
            last_pack = (model, m_vars, y_recipe, base_use, base_used_bin, comps, dict(fixed), st == 'Optimal')
            remaining_time -= alloc
            if remaining_time <= 0 and idx < passes - 1:
                return (*last_pack[:-1], False)  # not proven optimal for remaining components
        return last_pack

    # For balanced_production we add a light blended pre-pass to steer away from degenerate tiny-recipe high-base solutions
    if strategy == 'balanced_production':
        blended = solve_weighted()
        if blended is not None:
            _, _, _, _, _, comps_b, _ = blended
            # proceed to lex after having warm-start potential internal state (CBC doesn't fully reuse but keeps code path uniform)
        if DEBUG_CALC:
            print('[MILP] Balanced pre-pass blended objective executed')
    solved = solve_lex(PRIORITIES[strategy])
    if solved is None:
        return None
    model, m_vars, y_recipe, base_use, base_used_bin, comps, fixed_vals, proven_optimal = solved
    comp_values = fixed_vals

    # --- Build graph ---
    recipe_nodes = {}
    base_nodes = {}
    node_counter = 0
    for rid in active_recipe_ids:
        mv = value(m_vars[rid])
        if mv and mv > 1e-6:
            rec = recipes[rid]
            t = rec.get('time', 1.0) or 1.0
            cycles = 60.0 / t
            inputs = {ing['item']: round_to_precision(ing['amount'] * cycles * mv) for ing in rec.get('ingredients', []) if (strategy=='custom' or ing['item'] in needed_items or ing['item']==target_item)}
            outputs = {p['item']: round_to_precision(p['amount'] * cycles * mv) for p in rec.get('products', []) if (strategy=='custom' or p['item'] in needed_items or p['item']==target_item)}
            machine_type = rec.get('producedIn', ['Unknown'])[0]
            machine_info = calculate_machine_info(mv, get_machine_display_name(machine_type))
            nid = f"recipe_{rid}_{node_counter}"; node_counter += 1
            recipe_nodes[nid] = {
                'node_id': nid,
                'recipe_id': rid,
                'recipe_name': rec.get('name', rid),
                'machine_type': machine_type,
                'machines_needed': round_to_precision(mv),
                'actual_machines': machine_info['actual_machines'],
                'machine_efficiency': machine_info['efficiency_percent'],
                'machine_display': machine_info['display_text'],
                'recipe_time': t,
                'cycles_per_minute': cycles,
                'is_base_resource': False,
                'is_alternate': rec.get('alternate', False),
                'inputs': inputs,
                'outputs': outputs,
                'recipe_data': rec,
                'optimal_recipe': True
            }
    for iid in base_items:
        var_name = f'base_{iid}'
        for v in model.variables():
            if v.name == var_name:
                val = value(v)
                if val and val > 1e-6:
                    rate = round_to_precision(val)
                    theoretical = val / BASE_RESOURCE_RATES.get(iid, 60)
                    machine_type_class = BASE_RESOURCE_MACHINES.get(iid, 'Miner')
                    machine_info = calculate_machine_info(theoretical, get_machine_display_name(machine_type_class))
                    nid = f"extract_{iid}_{node_counter}"; node_counter += 1
                    base_nodes[nid] = {
                        'node_id': nid,
                        'recipe_id': f'extract_{iid}',
                        'recipe_name': f'Extract {items.get(iid, {}).get("name", iid)}',
                        'machine_type': machine_type_class,
                        'machines_needed': round_to_precision(theoretical),
                        'actual_machines': machine_info['actual_machines'],
                        'machine_efficiency': machine_info['efficiency_percent'],
                        'machine_display': machine_info['display_text'],
                        'is_base_resource': True,
                        'inputs': {},
                        'outputs': {iid: rate}
                    }
                break
    recipe_nodes.update(base_nodes)

    return {
        'recipe_nodes': recipe_nodes,
        'target_item': target_item,
        'target_amount': amount_per_min,
        'weights_used': weights,
        'strategy': strategy,
        'objective_components': {k: round_to_precision(v) for k, v in comp_values.items()},
        'solver_time_limit': time_limit,
        'solver_gap': rel_gap,
        'pruned_recipes': len(active_recipe_ids),
        'proven_optimal': proven_optimal
    }
def calculate_summary_stats_v2(graph: dict):
    nodes = graph.get('recipe_nodes', {})
    total_theoretical = 0.0
    total_actual = 0
    base_amount = 0.0
    base_types = set()
    unique_recipes = set()
    machine_breakdown = defaultdict(int)
    base_resources = {}
    recipe_node_count = 0
    base_node_count = 0
    for nd in nodes.values():
        if nd.get('is_base_resource'):
            base_node_count += 1
            # base resource outputs
            for k, v in nd.get('outputs', {}).items():
                base_amount += v
                base_types.add(k)
                base_resources[k] = round_to_precision(base_resources.get(k, 0) + v)
        else:
            recipe_node_count += 1
            total_theoretical += nd.get('machines_needed', 0) or 0
            total_actual += nd.get('actual_machines', 0) or 0
            unique_recipes.add(nd.get('recipe_id'))
            mt = nd.get('machine_type') or 'Unknown'
            machine_breakdown[mt] += nd.get('actual_machines', 0) or 0
    # Avoid div by zero
    avg_eff = f"{round((total_theoretical/total_actual)*100,1)}%" if total_actual else 'N/A'
    summary = {
        'total_machines_theoretical': round_to_precision(total_theoretical),
        'total_machines_actual': total_actual,
        # Compatibility fields expected by frontend
        'total_machines': round_to_precision(total_theoretical),
        'total_actual_machines': total_actual,
        'machine_breakdown': {k: v for k, v in sorted(machine_breakdown.items())},
        'base_resources': base_resources,
        'total_recipe_nodes': recipe_node_count,
        'total_base_resource_nodes': base_node_count,
        'unique_base_resource_types': len(base_types),
        'total_base_resource_amount': round_to_precision(base_amount),
        'base_resource_amount': round_to_precision(base_amount),
        'base_resource_types': len(base_types),
        'unique_recipes': len(unique_recipes),
        'objective_weights': graph.get('weights_used', {}),
        'algorithm_efficiency': {
            'machines_needed': round_to_precision(total_theoretical),
            'actual_machines_built': total_actual,
            'machine_efficiency': avg_eff,
            'base_resource_types': len(base_types),
            'total_base_resources_per_minute': round_to_precision(base_amount)
        }
    }
    return summary
# ===== End added LP section =====

@app.route('/api/calculate', methods=['POST'])
def calculate_production_lp():
    data = request.json or {}
    target = data.get('item')
    amt = float(data.get('amount', 0))
    strat = data.get('optimization_strategy', 'balanced_production')
    if strat == REMOVED_STRATEGY:
        strat = 'balanced_production'
    weights = data.get('weights') or {}
    solver_opts = data.get('solver') or {}
    time_limit = float(solver_opts.get('time_limit', DEFAULT_SOLVER_TIME_LIMIT))
    rel_gap = float(solver_opts.get('rel_gap', DEFAULT_REL_GAP))
    provided_active = data.get('active_recipes')
    if provided_active and isinstance(provided_active, dict):
        active_map = {rid: bool(v) for rid, v in provided_active.items() if rid in recipes}
    else:
        active_map = None

    if not target or amt <= 0:
        return jsonify({'error': 'Missing parameters'}), 400
    if target not in items:
        return jsonify({'error': 'Invalid item'}), 400

    try:
        graph = lp_optimize(target, amt, strat, weights, time_limit=time_limit, rel_gap=rel_gap, active_map=active_map)
        if graph is None:
            return jsonify({'error': 'No feasible solution'}), 500
        summary = calculate_summary_stats_v2(graph)
        response = {
            'production_graph': graph,
            'target_item': target,
            'target_item_name': items.get(target, {}).get('name', target),
            'amount_requested': amt,
            'optimization_strategy': strat,
            'weights_used': weights,
            'summary': summary,
            'lp': True
        }
        return jsonify(clean_nan_values(response))
    except Exception as e:
        # Generic error response; avoids leaking internal stack traces
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
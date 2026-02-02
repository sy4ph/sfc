"""
Feasibility and conservation-of-mass tests for the production graph.
Ensures that no items are 'created from nowhere' and all demand is satisfied.
"""

import pytest
from backend.services.calculation_service import calculate_production
from backend.data.recipes import get_recipes
from backend.data.base_resources import is_base_resource

class TestFeasibility:
    """Verify the physical feasibility of the returned production plans."""

    def _verify_conservation(self, result):
        """
        Walks the graph and verifies that for every item:
        Total Production + Base Extraction >= Total Consumption + Target Demand + Surplus
        """
        graph = result['production_graph']
        nodes = graph['recipe_nodes']
        
        # item_id -> float
        total_produced = {}
        total_consumed = {}
        
        for node_id, node in nodes.items():
            # Add outputs
            for item_id, amount in node.get('outputs', {}).items():
                total_produced[item_id] = total_produced.get(item_id, 0) + amount
            
            # Add inputs
            for item_id, amount in node.get('inputs', {}).items():
                total_consumed[item_id] = total_consumed.get(item_id, 0) + amount
                
        # The target item demand is essentially a consumption
        target_item = result['target_item']
        amount_requested = result['amount_requested']
        total_consumed[target_item] = total_consumed.get(target_item, 0) + amount_requested
        
        # Verify conservation for every item involved
        all_items = set(total_produced.keys()) | set(total_consumed.keys())
        
        for item_id in all_items:
            produced = total_produced.get(item_id, 0)
            consumed = total_consumed.get(item_id, 0)
            
            # Base resources don't need 'production' because they are extracted 
            # (but extraction is a node in our graph, so it's already counted in produced)
            
            # Use a small epsilon for floating point comparison
            assert produced >= consumed - 1e-6, (
                f"Conservation violation for {item_id}: "
                f"Produced {produced}, but Consumed/Demand is {consumed}"
            )

    @pytest.mark.parametrize("strategy", [
        'resource_efficiency', 
        'resource_consolidation', 
        'compact_build', 
        'balanced_production'
    ])
    def test_feasibility_all_alternates(self, strategy):
        """
        Stress test: Enable EVERY SINGLE recipe in the game and solve for a complex item.
        Verify that the resulting graph is physically feasible.
        """
        all_recipes = get_recipes()
        # Enable everything!
        active_recipes = {rid: True for rid in all_recipes}
        
        # Heavy Modular Frame is a great test because it has many alternates 
        # (Steel Frame, Encased Frame, etc.)
        target = "Desc_ModularFrameHeavy_C"
        
        result = calculate_production(
            target_item=target,
            amount=10.0,
            strategy=strategy,
            active_recipes=active_recipes
        )
        
        assert result is not None
        self._verify_conservation(result)
        
        # Check that we actually used some alternate recipes if strategy is efficiency
        if strategy == 'resource_efficiency':
            nodes = result['production_graph']['recipe_nodes']
            has_alt = any(n.get('is_alternate') for n in nodes.values())
            # For HMF, standard is almost never optimal if all alts are on
            assert has_alt, "Efficiency strategy failed to pick any alternate recipes for HMF"

    def test_feasibility_nuclear_pasta_max_alts(self):
        """Verify conservation of mass for the most complex item with all alts on."""
        all_recipes = get_recipes()
        active_recipes = {rid: True for rid in all_recipes}
        
        result = calculate_production(
            target_item="Desc_SpaceElevatorPart_7_C",
            amount=0.1,
            strategy='resource_efficiency',
            active_recipes=active_recipes
        )
        
        assert result is not None
        self._verify_conservation(result)

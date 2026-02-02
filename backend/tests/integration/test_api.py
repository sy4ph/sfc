"""
Integration tests for the Backend API endpoints.
"""

import pytest
import json

class TestAPI:
    """Test all API endpoints for connectivity and data structure."""

    def test_health_endpoint(self, client):
        """Test GET /api/health."""
        response = client.get('/api/health')
        assert response.status_code == 200
        data = response.get_json()
        assert data['status'] == 'healthy'
        assert 'timestamp' in data

    def test_items_endpoint(self, client):
        """Test GET /api/items."""
        response = client.get('/api/items')
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, dict)
        # Should contain some items from our data1.0.json if loaded
        if len(data) > 0:
            first_id = list(data.keys())[0]
            assert 'name' in data[first_id]

    def test_recipes_endpoint(self, client):
        """Test GET /api/recipes."""
        response = client.get('/api/recipes')
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, dict)
        if len(data) > 0:
            first_id = list(data.keys())[0]
            assert 'name' in data[first_id]
            assert 'active' in data[first_id]

    def test_calculate_endpoint_success(self, client):
        """Test successful POST /api/calculate."""
        payload = {
            "item": "Desc_IronPlate_C",
            "amount": 20.0,
            "optimization_strategy": "compact_build"
        }
        response = client.post('/api/calculate', 
                               data=json.dumps(payload),
                               content_type='application/json')
        assert response.status_code == 200
        data = response.get_json()
        assert data['target_item'] == "Desc_IronPlate_C"
        assert 'production_graph' in data
        assert 'summary' in data

    def test_calculate_endpoint_invalid_item(self, client):
        """Test POST /api/calculate with ghost item."""
        payload = {
            "item": "Ghost_Item_X",
            "amount": 10.0
        }
        response = client.post('/api/calculate', 
                               data=json.dumps(payload),
                               content_type='application/json')
        assert response.status_code == 400
        data = response.get_json()
        assert 'error' in data

    def test_calculate_endpoint_invalid_amount(self, client):
        """Test POST /api/calculate with non-numeric amount."""
        payload = {
            "item": "Desc_IronPlate_C",
            "amount": "lots"
        }
        response = client.post('/api/calculate', 
                               data=json.dumps(payload),
                               content_type='application/json')
        assert response.status_code == 400
        
        payload_neg = {
            "item": "Desc_IronPlate_C",
            "amount": -5.0
        }
        response = client.post('/api/calculate', 
                               data=json.dumps(payload_neg),
                               content_type='application/json')
        assert response.status_code == 400

    def test_calculate_garbage_data(self, client):
        """Test rejection of garbage/malformed JSON."""
        response = client.post('/api/calculate', 
                               data="strictly not json",
                               content_type='application/json')
        # Flask usually handles malformed JSON with 400
        assert response.status_code in (400, 500) 

    def test_calculate_missing_fields(self, client):
        """Test missing required fields."""
        response = client.post('/api/calculate', 
                               data=json.dumps({"amount": 10}),
                               content_type='application/json')
        assert response.status_code == 400
        
        response = client.post('/api/calculate', 
                               data=json.dumps({"item": "Desc_IronPlate_C"}),
                               content_type='application/json')
        assert response.status_code == 400

    def test_calculate_with_all_alts(self, client):
        """Test calculation with all alternate recipes enabled via API."""
        # Get all recipes first to build the map
        r_list = client.get('/api/recipes').get_json()
        active_map = {rid: True for rid in r_list.keys()}
        
        payload = {
            "item": "Desc_ModularFrameHeavy_C",
            "amount": 1.0,
            "active_recipes": active_map,
            "optimization_strategy": "resource_efficiency"
        }
        response = client.post('/api/calculate', 
                               data=json.dumps(payload),
                               content_type='application/json')
        assert response.status_code == 200
        data = response.get_json()
        assert 'production_graph' in data
        # Check no None values in results (placeholder for NaN check)
        def check_no_garbage(obj):
            if isinstance(obj, dict):
                for v in obj.values(): check_no_garbage(v)
            elif isinstance(obj, list):
                for v in obj: check_no_garbage(v)
            elif isinstance(obj, float):
                import math
                assert not math.isnan(obj) and not math.isinf(obj)

        check_no_garbage(data)

    @pytest.mark.parametrize("strategy", ['resource_efficiency', 'compact_build'])
    def test_calculate_strategies_consistency(self, client, strategy):
        """Test different strategies through the API."""
        payload = {
            "item": "Desc_ComputerSuper_C",
            "amount": 1.0,
            "optimization_strategy": strategy
        }
        response = client.post('/api/calculate', 
                               data=json.dumps(payload),
                               content_type='application/json')
        assert response.status_code == 200
        data = response.get_json()
        assert data['summary']['total_recipe_nodes'] > 0

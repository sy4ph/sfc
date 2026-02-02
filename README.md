# Satisfactory Factory Calculator

A powerful, MILP-based production planner for Satisfactory. Calculate optimal production chains, manage recipes, and visualize your factory floor.

**Live Demo**: [satisfactory-planner.onrender.com](https://satisfactory-planner.onrender.com/)

## 🚀 Backend Architecture

The backend has been completely refactored from a monolithic script into a clean, 3-tier modular architecture designed for performance, testability, and statelessness.

### Project Structure

```text
backend/
├── app.py              # Application factory and entry point
├── config.py           # Centralized configuration and optimization weights
├── data/               # Data Access Layer (Game data loading and filtering)
├── routes/             # API Layer (Flask Blueprints for endpoints)
├── services/           # Service Layer (Business logic orchestration)
├── solvers/            # Logic Layer (MILP optimization and graph building)
├── utils/              # Helper functions (Math, Machine info)
└── tests/              # Comprehensive test suite
```

### Key Components

- **MILP Solver**: Uses `PuLP` to solve complex production graphs. It handles multiple optimization strategies (Maximize Production, Minimize Resources, etc.) using both weighted and lexicographical approaches.
- **Dependency Graph**: Dynamically computes the set of required items and recipes for any target product to minimize solver complexity.
- **Stateless API**: Every calculation request is self-contained. The client provides the target item, amount, active recipes, and optimization preferences.
- **Data Layer**: Efficiently manages 1.0 game data with LRU caching and robust filtering for building/producible items.

## 🛠️ Tech Stack

- **Frontend**: React (Vite), TypeScript, Tailwind CSS, Lucide Icons.
- **Backend**: Python, Flask, PuLP (MILP Solver), CBC Solver.
- **Testing**: Pytest for unit and integration testing.

## 🏃 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+

### Backend Setup
1. Navigate to `backend/`
2. Install dependencies: `pip install -r requirements.txt` (or install `flask`, `flask-cors`, `pulp`, `pytest`)
3. Run the dev server: `python -m backend.app`

### Frontend Setup
1. Navigate to `web/`
2. Install dependencies: `npm install`
3. Run dev server: `npm run dev`

## ✅ Verification & Quality

The backend includes a comprehensive test suite of **132 tests** covering:
- **Unit Tests**: Full coverage of data loaders, utilities, and service orchestration.
- **Integration Tests**: MILP solver logic, API endpoints, and graph building.
- **Edge Case Verification**: Stress tests on massive production chains (Nuclear Pasta, Aluminum loops) and high-volume inputs.
- **Strategy Verification**: Deep-dive logic checks to ensure strategies (Efficiency vs Compactness) produce distinct, rational results.

To run tests:
```bash
python -m pytest backend/tests/
```

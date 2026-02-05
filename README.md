# Satisfactory Factory Calculator & Planner

A powerful, MILP-based production calculator **and** interactive node-based factory planner for Satisfactory. Calculate optimal production chains, then refine and customize them in a visual editor.

**Live Demo**: [https://sfc-4s4i.onrender.com/](https://sfc-4s4i.onrender.com/)

---

## ✨ Features

### 📊 Calculator Tab
- **Multi-Tab Support**: Working on multiple factory designs simultaneously
- **Comparison View**: Side-by-side metrics comparison (Power, Machines, Resources)
- **MILP Optimization**: Mathematically optimal production chains using the PuLP solver
- **Multiple Strategies**: Minimize Resources, Maximize Efficiency, Balanced, Compact
- **Recipe Management**: Toggle standard and alternate recipes
- **Production Graph**: Interactive visualization with ELK layered layout

### 🏭 Factory Planner Tab
- **URL Sharing**: Share your factory designs instantly via compressed URLs
- **Node-Based Editor**: Drag-and-drop production nodes with React Flow
- **Real-Time Flow Simulation**: Extraction-driven throughput calculation
- **Bottleneck Detection**: Visual indicators for starved inputs
- **Custom Sources**: Virtual input nodes for planning partial factories
- **Edge Flow Control**: Click edges to lock specific flow rates
- **Import/Export**: Save and load designs as `.sfc` JSON files
- **Calculator Integration**: One-click export from Calculator to Planner

### 📖 Recipe Book
- Browse all 320+ Satisfactory recipes
- Filter by machine type, item, or alternate status
- Toggle recipes on/off for calculations

---

## 🏗️ Architecture

```
sfc/
├── backend/              # Python Flask API
│   ├── data/             # Data access layer (game data)
│   ├── routes/           # API endpoints
│   ├── services/         # Business logic orchestration
│   ├── solvers/          # MILP optimization engine
│   └── tests/            # 132-test comprehensive suite
│
└── web/                  # Next.js Frontend
    └── src/
        ├── app/          # Next.js app router
        ├── components/
        │   ├── planner/  # Factory Planner (nodes, edges, toolbox)
        │   ├── graph/    # Production graph visualization
        │   └── recipes/  # Recipe book component
        ├── stores/       # Zustand state (planner, recipes, items)
        ├── lib/          # Utilities (converter, power data)
        └── hooks/        # Custom React hooks
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16, TypeScript, Tailwind CSS, React Flow |
| **State** | Zustand with localStorage persistence |
| **Backend** | Python, Flask, PuLP (CBC Solver) |
| **Testing** | Pytest (132 tests, 100% core coverage) |

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python -m backend.app
```

### Frontend Setup
```bash
cd web
npm install
npm run dev
```

### Run Tests
```bash
python -m pytest backend/tests/
```

---

## 📁 .sfc File Format

The Factory Planner uses a JSON-based save format:

```json
{
  "version": "1.0",
  "exportedAt": "2026-02-03T15:00:00Z",
  "name": "My Factory",
  "nodes": [...],
  "edges": [...]
}
```

**Extension**: `.sfc` (Satisfactory Factory Configuration)

---

## 🎮 Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Ctrl+Enter` | Calculate production |
| `Tab` | Cycle between tabs |
| `Escape` | Close modals |

---

## 📝 License

MIT

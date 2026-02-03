# Factory Planner: Technical Specification & Guide

The Factory Planner is an interactive, node-based modeling tool designed to design and optimize Satisfactory production lines in real-time. Unlike the static MILP solver, the Planner allows for manual control over every machine, connection, and clock speed.

## 1. Core Architecture

The system is built on three main pillars:
- **Canvas Interface**: Powered by `@xyflow/react` (React Flow), providing a high-performance grid for node manipulation.
- **State Engine**: A centralized Zustand store (`plannerStore.ts`) using the `persist` middleware for local storage synchronization.
- **Flow Propagation Engine**: A reactive calculation layer that recalculates the state of the entire factory whenever a connection or node setting changes.

---

## 2. The Flow Propagation Engine

Production rates in the planner are **Extraction-Driven**. Instead of calculating what you *need*, it calculates what you can *produce* based on your inputs.

### 2.1 Propagation Algorithm
The engine uses a topological sort of the graph to propagate values from sources to sinks:
1. **Identify Sources**: Resource nodes (Miners, Extractors) provide the "Seed" rates.
2. **Horizontal Breadth-First Traversal**: The engine follows source handles to target handles.
3. **Consumption Logic**: At each node, the incoming rate of an item is compared to the recipe's requirement:
   - `Throughput % = Min(Available_Input / Required_Input)` across all inputs.
   - `Output_Rate = Base_Recipe_Output * Machine_Count * Clock_Speed * Throughput %`.
4. **Byproduct Management**: All products defined in the recipe are calculated proportionally to the machine's actual throughput.

### 2.2 Bottleneck Analysis
If a node receives less input than its recipe requires (at 100% clock speed), the engine:
- Highlights the starved input handle in **Red**.
- Displays a tooltip showing the deficit (e.g., "Missing 15.4 Iron Ore/min").
- Adjusts the output of that node (and all subsequent nodes) to match the bottlenecked capacity.

---

## 3. Dynamic Node System (`ProductionNode`)

Nodes are not static; they adapt their physical structure based on the logic assigned to them.

### 3.1 Port Mapping
- **Input Handles (Targets)**: Dynamically generated on the left side of the node based on the `recipe.ingredients`. Each port represents a specific item type.
- **Output Handles (Sources)**: Dynamically generated on the right side based on `recipe.products`.
- **Resource Specialization**: Nodes marked as `isResource` omit input handles entirely.

### 3.2 Machine Controls
- **Machine Count**: A multiplier for the entire node's capacity.
- **Clock Speed**: A linear multiplier (percentage) for production rates.
- **Recipe Selection**: A filtered dropdown that only displays recipes compatible with the machine type. Future versions will prioritize recipes based on currently connected input items.

---

## 4. Connectivity & Advanced Splitting

### 4.1 Custom Edges
Connections are not just lines; they are **Data Pipes**.
- **Real-Time IPM**: Every edge displays the current flow of items per minute.
- **Color Coding**: Edges change color or thickness based on the saturation level (percentage of capacity used).

### 4.2 Splitters and Mergers
- **Implicit Splitting**: One output port can be connected to multiple input ports. The flow is distributed based on the "Demand" of the targets.
- **Manual Overrides**: Users can click an edge to set a fixed flow rate or a ratio (e.g., "Send exactly 30 Coal/min here"), overriding the automatic distribution.

---

## 5. UI/UX Design Language

- **Glassmorphism**: Nodes use semi-transparent backdrops (`bg-surface/90`) with heavy blur to maintain a premium feel.
- **Vibrant Port Indicators**: Green dots indicate a satisfied connection; yellow indicates idle/unconfigured; red indicates a bottleneck.
- **Micro-Animations**: Animated edges (`animated: true`) indicate active flow. The speed of the animation can optionally reflect the IPM of the path.

---

## 6. Data Portability (`.sfc` Format)

The planner supports exporting and importing designs via a custom JSON-based format.
- **Structure**: Contains a flat list of nodes (with data/position) and edges.
- **Extension**: `.sfc` (Satisfactory Factory Configuration).
- **Persistence**: While in active use, the state is mirrored to `localStorage` under the key `sfc-planner-storage`.

# Planner Enhancements Technical Specification

## Overview
This document outlines the technical design for adding Undo/Redo, Copy/Paste, Grouping, Notes, and Sharing capabilities to the SFC Factory Planner.

## 1. Undo/Redo (`zundo`)

### Architecture
We will use `zundo` middleware with Zustand to track state changes. It provides a temporal middleware that wraps the store and tracks history automatically.

### Configuration
```typescript
import { temporal } from 'zundo';

export const usePlannerStore = create<PlannerState>()(
  temporal(
    persist(
      (set, get) => ({ ... }),
      {
        name: 'sfc-planner-storage',
      }
    ),
    {
       limit: 50, // Limit history stack
       partialize: (state) => ({ 
           nodes: state.nodes, 
           edges: state.edges 
       }), // Only track nodes/edges changes. Ignore UI state like sidebar visibility.
       handleSet: (handleSet) => handleSet,
    }
  )
);
```

### UI Integration
- **Components**: Add `Undo` (Ctrl+Z) and `Redo` (Ctrl+Y / Ctrl+Shift+Z) buttons to `PlannerToolbox`.
- **Shortcuts**: Update `useKeyboardShortcuts` to trigger `usePlannerStore.temporal.getState().undo()` and `.redo()`.

## 2. Copy/Paste

### Clipboard Logic
- **Internal Clipboard**: Store serialized nodes/edges in a simple `localStorage` key (`sfc-clipboard`) to allow copying between tabs, or just keep it in memory if security/complexity is a concern. Let's use `localStorage` for better UX.
- **System Clipboard**: Optionally sync with `navigator.clipboard.writeText` using JSON string so users can paste heavily modified layouts to text editors or discord.

### Actions
- **Copy (`Ctrl+C`)**:
  - Filter `selected: true` nodes.
  - Clone node data.
  - Find internal edges (edges where both source and target are in the selection).
  - Serialize to JSON and write to `sfc-clipboard` in local storage.
- **Paste (`Ctrl+V`)**:
  - Read from `sfc-clipboard`.
  - Parse JSON.
  - **ID Regeneration**: Crucial. Map old IDs to new UUIDs (v4) to avoid collisions.
  - **Positioning**: Calculate center of copied group, offset it to either:
    - Center of current Viewport (requires `useReactFlow().screenToFlowPosition`)
    - OR Mouse cursor position.
  - Add new nodes and edges to store.

## 3. Group Nodes & Note Nodes

### Group Node (`GroupNode.tsx`)
- **Type**: `'group'` (Standard React Flow feature, but we might need a custom component for styling).
- **Data**: `{ label: string, width: number, height: number, color: string }`.
- **Implementation**:
  - Use `extent: 'parent'` on child nodes? Or just visual grouping?
  - **Decision**: True Grouping. Set `parentId` on child nodes. Dragging group drags children.
  - **UI**: A container with a header, resizable via `<NodeResizer />`.
  - **Z-Index**: Groups should be behind content (`zIndex: -1`).

### Note Node (`NoteNode.tsx`)
- **Type**: `'note'`.
- **Data**: `{ text: string, color: string, fontSize?: number }`.
- **UI**:
  - `<textarea>` for editing.
  - `<NodeResizer />` for sizing.
  - Auto-growing text area or scrollable.
  - simple Markdown support can be added later, for now plain text.

## 4. Sharing (Planner)

### Serialization strategy
- **Format**: JSON.
- **Compression**: `lz-string` library. It compresses text storage significantly.
- **Schema**:
  ```json
  {
    "v": 1,
    "n": [...nodes], // Minified: id, type, position, data (only essential fields)
    "e": [...edges]
  }
  ```

### User Flow
1. User clicks "Share".
2. App serializes `nodes` and `edges`, stripping non-essential data (like `computed` flow rates which can be recalculated).
3. App compresses string -> Base64.
4. App updates URL to `?plan=<blob>` or provides a copyable link.
5. **Restoration**: On `page.tsx`, `useEffect` checks URL. If `?plan` exists:
   - Decode -> Decompress -> Parse.
   - Call `importNodes()`.
   - Clear URL param (optional, to keep URL clean) or keep it (better for reload).

### Limits
- URL length limits (approx 2KB for safe sharing, 30KB+ works in modern browsers but maybe not in some chat apps).
- Large factories might need a "Copy to Clipboard" string instead of a URL.

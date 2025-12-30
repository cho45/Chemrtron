# GEMINI.md

This file provides context and instructions for AI agents working on the **Chemrtron** codebase.

## Project Overview

**Chemrtron** is a high-performance document viewer application built with **Electron**. It features fuzzy-match incremental search across various documentation sets (e.g., Node.js, MDN, Python). It is designed to be a modern, faster successor to "Chemr".

### Tech Stack
*   **Runtime:** Electron (Main + Renderer processes)
*   **Frontend:** Vue 3 + Pinia (State Management)
*   **Build Tool:** Vite (via `electron-vite`)
*   **Language:** TypeScript (Application Logic), JavaScript (Indexers)
*   **Storage:** Local filesystem JSON/binary caches.

## Architecture

The application uses a **Single Window + WebContentsView** architecture:

1.  **Main Process (`src/main`)**:
    *   Manages the application lifecycle, native menus, and global shortcuts.
    *   **Indexer Runner**: Executes indexer scripts to crawl and cache documentation data.
    *   **Cache Manager**: Stores index data in `~/.chemr/cache/`.
    *   **IPC**: Handles communication between Renderer and Native layers.

2.  **Renderer Process (`src/renderer`)**:
    *   **UI Layer**: A Vue 3 application that overlays the search interface, settings, and indexer selection.
    *   **Search Logic**: Performs fuzzy matching on cached index data.

3.  **WebContentsView (Native Layer)**:
    *   Displays the actual documentation content (external websites).
    *   Rendered independently *under* (or alongside) the UI layer to ensure native scrolling performance and isolation.

## Key Directories

*   `src/main/` - Main process entry point and logic (IPC, caching, window management).
*   `src/renderer/` - Vue 3 frontend application (UI components, stores).
*   `src/preload/` - Context isolation scripts bridging Main and Renderer.
*   `src/shared/` - Shared types (`types.ts`) and algorithms (`search-algorithm.ts`) used by both processes.
*   `src/indexers/` - Built-in documentation indexer definitions (JavaScript).
*   `test/` - Unit tests and live indexer health checks.

## Development Workflow

### Commands

| Command | Description |
| :--- | :--- |
| `npm run dev` | Start the application in development mode with hot-reload. |
| `npm run build` | specific build for production (outputs to `dist/`). |
| `npm run typecheck` | Run TypeScript validation for both Node and Web contexts. |
| `npm run test` | Run unit tests (e.g., search algorithm). |
| `npx tsx test/indexers/live-runner.ts` | Run live health checks against remote documentation sites. |

### Indexer System

Indexers are lightweight JavaScript modules located in `src/indexers/`. They define how to scrape a specific documentation site.

**Example Structure (`src/indexers/sample.js`):**
```javascript
export default {
    id: 'doc-id',          // Unique identifier
    name: 'Doc Name',      // Display name
    color: '#ff0000',      // UI highlight color
    async index(ctx) {
        // 1. Fetch content
        // 2. Parse HTML/JSON
        // 3. ctx.pushIndex(title, url)
    }
}
```

### IPC Communication

Communication is strictly typed via `src/shared/types.ts`.
*   **Renderer -> Main**: requesting index data, updating settings.
*   **Main -> Renderer**: keyboard shortcuts triggers, deep link navigation.

## Configuration & Storage

*   **Settings**: Stored in `~/.chemr/settings.json` (enabled indexers, shortcuts).
*   **Cache**: Stored in `~/.chemr/cache/*.dat` (serialized index data).
*   **Custom Indexers**: User-defined indexers can be placed in `~/.chemr/indexers/`.

## Common Tasks

*   **Adding a new Docset**: Create a new `.js` file in `src/indexers/` implementing the `index` function.
*   **Modifying UI**: Edit Vue components in `src/renderer/src/components/`.
*   **Updating Search Logic**: Modify `src/shared/search-algorithm.ts`. Ensure to run tests.

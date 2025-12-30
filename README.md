Chemrtron
=========

A document viewer with fuzzy match incremental search, built on Electron.

Chemrtron is the modern implementation of Chemr, designed for high-speed documentation access with a unified interface.

Features
========

*   **On-demand Indexing**: Create and update search indexes for various documentation sets.
*   **Incremental Search**: Fast, fuzzy-match search across all your enabled documents.
*   **Unified UI**: A consistent experience whether you're browsing MDN, Node.js docs, or custom sets.
*   **System Integration**: Supports system light/dark modes and global shortcuts.
*   **WebContentsView**: Uses Electron's modern view system for seamless document rendering alongside the search UI.

Development
===========

### Requirements

*   [Node.js](https://nodejs.org/) (Latest LTS recommended)
*   npm or yarn

### Setup

```bash
# Clone the repository
git clone https://github.com/cho45/Chemrtron.git
cd Chemrtron

# Install dependencies
npm install
```

### Run in Development

```bash
npm run dev
```

### Testing Indexers

You can run a live health check for built-in indexers. This script connects to the actual documentation sites to verify that the indexing logic still works against the current remote content.

```bash
# Test all indexers
npx tsx test/indexers/live-runner.ts

# Test a specific indexer (less load on remote sites)
npx tsx test/indexers/live-runner.ts lua
```

The runner verifies:
- Connection and retrieval of documentation pages.
- Minimum number of extracted entries.
- Presence of essential symbols (e.g., `print` for Lua).
- Validity of generated URLs (no double slashes, starts with `https://`).

Architecture
============

Chemrtron uses a modern Electron architecture:

*   **Main Process**: Handles window management, system settings, global shortcuts, and index creation.
*   **Renderer Process (Vue 3 + Pinia)**: Provides the search interface, indexer management, and application UI.
*   **WebContentsView**: A native-layer view used to render documentation independently from the search UI, ensuring high performance and correct scrolling behavior.
*   **Communication**: All components communicate via secure IPC channels defined in TypeScript for type safety.

Key Components:
- `src/main`: Main process logic (settings, cache, indexers).
- `src/renderer`: Vue-based search and settings UI.
- `src/shared`: Shared types and the fuzzy search algorithm.
- `src/indexers`: Built-in indexer definitions.

Build
=====

To build the application for your current platform:

```bash
npm run build
```

This uses `electron-builder` to generate production-ready packages in the `out` directory.

Creating New Indexers
=====================

Indexers are simple JavaScript files that define how to crawl and index a documentation site. Custom indexers can be placed in `~/.chemr/indexers/`.

Example indexer structure:

```javascript
export default {
  id: 'my-docs',
  name: 'My Documentation',
  color: '#42b883',
  testSpec: {
    expectedSymbols: ['MyMainFunction'],
    minEntries: 10
  },
  async index(ctx) {
    // Use ctx.fetchDocument, ctx.pushIndex, etc.
  }
}
```

License
=======

MIT
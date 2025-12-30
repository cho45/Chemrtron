import matplotlib.pyplot as plt
import matplotlib.patches as patches

def create_refined_architecture_diagram():
    # Setup figure
    fig, ax = plt.subplots(figsize=(14, 10))
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    # Colors
    c_main_bg = '#e3f2fd'
    c_renderer_bg = '#f3e5f5'
    c_ipc_channel = '#eeeeee'
    c_store = '#fff9c4'
    c_native = '#c8e6c9'  # Green-ish for native view
    c_placeholder = '#e1bee7' # Purple-ish, but similar tone
    c_sync_line = '#ff5722'

    # ---------------------------------------------------------
    # Layout Areas (Process Boundaries)
    # ---------------------------------------------------------
    
    # Renderer Process (Right)
    rect_renderer = patches.Rectangle((55, 5), 40, 90, linewidth=2, edgecolor='#7b1fa2', facecolor=c_renderer_bg, alpha=0.5)
    ax.add_patch(rect_renderer)
    ax.text(75, 96, "Renderer Process\n(Vue 3 + Pinia)", fontsize=16, fontweight='bold', color='#4a148c', ha='center', va='top')

    # Main Process (Left)
    rect_main = patches.Rectangle((5, 5), 40, 90, linewidth=2, edgecolor='#1565c0', facecolor=c_main_bg, alpha=0.5)
    ax.add_patch(rect_main)
    ax.text(25, 96, "Main Process\n(Electron Node.js)", fontsize=16, fontweight='bold', color='#0d47a1', ha='center', va='top')

    # IPC Bridge (Center)
    rect_ipc = patches.Rectangle((45, 10), 10, 80, linewidth=0, facecolor=c_ipc_channel, alpha=0.5)
    ax.add_patch(rect_ipc)
    ax.text(50, 50, "IPC Bridge", rotation=90, fontsize=14, fontweight='bold', color='#9e9e9e', ha='center', va='center')

    # ---------------------------------------------------------
    # UI & Logic Components (Top Half)
    # ---------------------------------------------------------
    
    # Renderer: Search UI & Logic
    rect_ui = patches.Rectangle((60, 60), 30, 25, linewidth=1, edgecolor='#ba68c8', facecolor='white')
    ax.add_patch(rect_ui)
    ax.text(75, 80, "UI Components\n(Search Bar, Sidebar)", ha='center', va='center', fontsize=12, fontweight='bold')
    
    rect_store = patches.Rectangle((62, 62), 26, 8, linewidth=1, edgecolor='#fbc02d', facecolor=c_store)
    ax.add_patch(rect_store)
    ax.text(75, 66, "Indexer Store", ha='center', va='center', fontsize=11)

    # Main: Logic & Managers
    rect_manager = patches.Rectangle((10, 60), 30, 25, linewidth=1, edgecolor='#1976d2', facecolor='white')
    ax.add_patch(rect_manager)
    ax.text(25, 72.5, "Managers\n(Settings, Cache, Indexer)", ha='center', va='center', fontsize=12, fontweight='bold')

    # ---------------------------------------------------------
    # View Components (Bottom Half - The "Sync" Area)
    # ---------------------------------------------------------

    # Renderer: Placeholder
    # Representing the empty div
    rect_ph = patches.Rectangle((60, 15), 30, 30, linewidth=2, edgecolor=c_sync_line, facecolor='white', linestyle='--')
    ax.add_patch(rect_ph)
    ax.text(75, 30, "<div ref=\"viewPlaceholder\">\n(Empty DOM Element)", ha='center', va='center', fontsize=11, color='#666')
    ax.text(75, 42, "ResizeObserver", ha='center', va='center', fontsize=11, color=c_sync_line, fontweight='bold')

    # Main: WebContentsView
    rect_native = patches.Rectangle((10, 15), 30, 30, linewidth=2, edgecolor='#2e7d32', facecolor=c_native)
    ax.add_patch(rect_native)
    ax.text(25, 30, "WebContentsView\n(Native Browser Engine)", ha='center', va='center', fontsize=12, fontweight='bold', color='#1b5e20')

    # Visual Connection: The "Projection"
    # Lines connecting the placeholder to the native view to imply they are linked
    con_top = patches.ConnectionPatch(xyA=(60, 45), xyB=(40, 45), coordsA="data", coordsB="data", 
                                      axesA=ax, axesB=ax, color=c_sync_line, linestyle=":", linewidth=1.5, arrowstyle="->")
    ax.add_artist(con_top)
    
    con_bottom = patches.ConnectionPatch(xyA=(60, 15), xyB=(40, 15), coordsA="data", coordsB="data", 
                                         axesA=ax, axesB=ax, color=c_sync_line, linestyle=":", linewidth=1.5, arrowstyle="->")
    ax.add_artist(con_bottom)

    # Annotation for the sync
    bbox_props = dict(boxstyle="round,pad=0.3", fc="white", ec=c_sync_line, alpha=1.0)
    ax.text(50, 30, "Geometry Sync\n(bounds match)", ha="center", va="center", bbox=bbox_props, fontsize=10, color=c_sync_line)

    # ---------------------------------------------------------
    # IPC Arrows (Functional Flows)
    # ---------------------------------------------------------
    
    def draw_ipc_arrow(y, label, direction='r2m', color='#444'):
        if direction == 'r2m':
            ax.annotate("", xy=(41, y), xytext=(59, y), arrowprops=dict(arrowstyle="->", color=color, lw=1.5))
            ax.text(50, y+0.8, label, ha='center', va='bottom', fontsize=10, color=color, backgroundcolor='#ffffffcc')
        else:
            ax.annotate("", xy=(59, y), xytext=(41, y), arrowprops=dict(arrowstyle="->", color=color, lw=1.5))
            ax.text(50, y+0.8, label, ha='center', va='bottom', fontsize=10, color=color, backgroundcolor='#ffffffcc')

    # High-level Logic IPCs (Top)
    draw_ipc_arrow(80, "get-index / get-all-indexers", 'r2m')
    draw_ipc_arrow(75, "progress (indexing)", 'm2r', color='#d32f2f')
    draw_ipc_arrow(70, "update-settings", 'r2m')

    # View-related IPCs (Middle - leading to the view area)
    # Placed closer to the view components
    draw_ipc_arrow(40, "update-view-bounds", 'r2m', color=c_sync_line)
    draw_ipc_arrow(35, "load-document", 'r2m')
    draw_ipc_arrow(25, "url-changed", 'm2r')
    draw_ipc_arrow(20, "find-in-page", 'r2m')
    
    # Global Actions
    draw_ipc_arrow(55, "keyboard-action", 'm2r', color='#1976d2')

    # Save
    plt.tight_layout()
    output_path = 'docs/img/architecture.png'
    plt.savefig(output_path, dpi=150)
    print(f"Diagram generated: {output_path}")

if __name__ == "__main__":
    create_refined_architecture_diagram()

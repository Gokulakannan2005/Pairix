import matplotlib.pyplot as plt
import matplotlib.patches as patches

def create_pairix_architecture():
    fig, ax = plt.subplots(figsize=(14, 7.5), dpi=300)
    ax.set_xlim(0, 14)
    ax.set_ylim(0, 7.5)
    ax.axis('off')

    # Background
    fig.patch.set_facecolor('#FFFFFF')
    ax.set_facecolor('#FFFFFF')

    # Title
    ax.text(7, 7.1, "Pairix - System Architecture", ha='center', va='center', 
            fontsize=18, fontweight='bold', color='#0F172A', fontfamily='sans-serif')

    # Color palette
    box_blue = '#EFF6FF'
    border_blue = '#3B82F6'
    box_indigo = '#EEF2FF'
    border_indigo = '#6366F1'
    box_emerald = '#ECFDF5'
    border_emerald = '#10B981'
    box_amber = '#FFFBEB'
    border_amber = '#F59E0B'
    text_dark = '#1E293B'

    # Box Helper
    def draw_box(x, y, w, h, bg, border, title, items, subtitle=""):
        rect = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.12",
                                      facecolor=bg, edgecolor=border, linewidth=2)
        ax.add_patch(rect)
        if subtitle:
            ax.text(x + w/2, y + h - 0.3, subtitle.upper(), ha='center', va='center',
                    fontsize=8, fontweight='bold', color=border)
            ax.text(x + w/2, y + h - 0.65, title, ha='center', va='center',
                    fontsize=11, fontweight='bold', color=text_dark)
            start_y = y + h - 1.05
        else:
            ax.text(x + w/2, y + h - 0.45, title, ha='center', va='center',
                    fontsize=12, fontweight='bold', color=text_dark)
            start_y = y + h - 0.95
        
        for idx, item in enumerate(items):
            ax.text(x + w/2, start_y - (idx * 0.35), item, ha='center', va='center',
                    fontsize=9.5, color='#334155')

    # Top Row
    # Box 1: Data Model / Roster
    draw_box(0.6, 3.9, 3.6, 2.6, box_blue, border_blue, 
             "Candidate & Roster Layer", 
             ["32 Developer Roster (Classes S, A, B)", 
              "6-Axis Skill Scores (0 - 100)", 
              "Base Valuations & Primary Roles",
              "Franchise Budgets (1000 Credits)"],
             subtitle="Data Ingestion")

    # Box 2: Feature & ML Layer
    draw_box(4.8, 3.9, 4.4, 2.6, box_indigo, border_indigo, 
             "ML & Capability Vectorizer", 
             ["6-Axis Radar Vectorizer (L2 Norm)", 
              "PyTorch MLP Team-Fit Neural Network", 
              "Cosine Similarity & Complement Engine",
              "Dynamic Skill Gap Recommender"],
             subtitle="Analytics Core")

    # Box 3: Live Auction Engine
    draw_box(9.8, 3.9, 3.6, 2.6, box_amber, border_amber, 
             "Live Auction Manager", 
             ["Teacher Countdown Timer (30s)", 
              "Active Candidate Auction Block", 
              "Bid Validation Desk (+10, +25, +50)", 
              "Real-Time Roster Allocation"],
             subtitle="Orchestration")

    # Bottom Row
    # Box 4: Skill Radar Analytics
    draw_box(0.6, 0.6, 3.6, 2.5, box_indigo, border_indigo, 
             "6-Axis Hexagonal Analytics", 
             ["Visual Hexagonal Radars", 
              "Missing Capability Identification", 
              "Multi-Team Radar Overlays", 
              "Balanced Roster Verification"],
             subtitle="Visualization")

    # Box 5: Player Trading & Parity Desk
    draw_box(4.8, 0.6, 4.4, 2.5, box_emerald, border_emerald, 
             "Trading & Parity Engine", 
             ["Class Parity Check (S/A/B Matching)", 
              "Credit Sweetener Compensation", 
              "Multi-Criteria Trade Evaluator", 
              "One-Click Roster Swap Execution"],
             subtitle="Post-Auction Governance")

    # Box 6: Persistence & Reporting
    draw_box(9.8, 0.6, 3.6, 2.5, box_blue, border_blue, 
             "Audit & Institutional Reports", 
             ["SQLite Transaction Logging", 
              "Predictive Track Competency", 
              "Draft ROI Efficiency Ranks", 
              "Final Allocation Summary & Export"],
             subtitle="Reporting")

    # Connecting Arrows
    def draw_arrow(x1, y1, x2, y2, color='#64748B'):
        ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                    arrowprops=dict(arrowstyle="->", color=color, lw=2, shrinkA=4, shrinkB=4))

    # Top row connections
    draw_arrow(4.2, 5.2, 4.8, 5.2, border_blue)
    draw_arrow(9.2, 5.2, 9.8, 5.2, border_indigo)

    # Top to bottom connections
    draw_arrow(2.4, 3.9, 2.4, 3.1, border_blue)
    draw_arrow(7.0, 3.9, 7.0, 3.1, border_indigo)
    draw_arrow(11.6, 3.9, 11.6, 3.1, border_amber)

    # Cross connections
    draw_arrow(9.8, 4.3, 7.0, 3.1, '#94A3B8')
    draw_arrow(4.2, 1.85, 4.8, 1.85, border_indigo)
    draw_arrow(9.2, 1.85, 9.8, 1.85, border_emerald)

    plt.tight_layout()
    plt.savefig('d:/Pairix/pairix_architecture.png', dpi=300, bbox_inches='tight')
    plt.close()
    print("Generated pairix_architecture.png successfully")

def create_pairix_workflow():
    fig, ax = plt.subplots(figsize=(13, 8.5), dpi=300)
    ax.set_xlim(0, 13)
    ax.set_ylim(0, 8.5)
    ax.axis('off')

    # Background
    fig.patch.set_facecolor('#FFFFFF')
    ax.set_facecolor('#FFFFFF')

    # Title
    ax.text(6.5, 8.1, "Pairix - End-to-End Operational Workflow", ha='center', va='center', 
            fontsize=18, fontweight='bold', color='#0F172A', fontfamily='sans-serif')

    steps = [
        ("1. Initialize Roster & Franchises", 
         "Load 32 character profiles with base bids; assign 1000 credits to 4 franchise teams (Nova, Orion, Vertex, Pulse).",
         "#3B82F6", "#EFF6FF"),
        ("2. Capability Vectorization & Normalization", 
         "Encode student profiles into 6-axis feature vectors (Technical, AI/ML, Systems, Design, Comms, Leadership).",
         "#6366F1", "#EEF2FF"),
        ("3. Live Auction Bidding Round with Teacher Timer", 
         "Candidate placed on auction block; teacher controls 30s countdown; teams submit quick bids (+10/+25/+50) or custom bids.",
         "#F59E0B", "#FFFBEB"),
        ("4. Real-Time Allocation & Budget Deduction", 
         "Round completes; highest valid bid locked; credits deducted from franchise balance; candidate awarded to team roster.",
         "#10B981", "#ECFDF5"),
        ("5. Dynamic PyTorch MLP Team-Fit & Radar Recalibration", 
         "Team hexagonal radars update instantly; MLP computes new fit scores; missing skill gaps highlight optimal future targets.",
         "#6366F1", "#EEF2FF"),
        ("6. Post-Auction Player Trading & Class Parity Desk", 
         "Teams exchange candidates across franchises; engine validates Class S/A/B tier parity and computes credit sweeteners.",
         "#10B981", "#ECFDF5"),
        ("7. Institutional Auditing, Simulation & Report Export", 
         "SQLite persistence logs all bids and trades; track simulation evaluates AI/systems readiness; final rosters exported.",
         "#3B82F6", "#EFF6FF")
    ]

    box_w = 9.8
    box_h = 0.78
    start_y = 7.1
    spacing = 0.95

    for idx, (title, desc, border_col, bg_col) in enumerate(steps):
        curr_y = start_y - (idx * spacing)
        rect = patches.FancyBboxPatch((1.6, curr_y), box_w, box_h, boxstyle="round,pad=0.08",
                                      facecolor=bg_col, edgecolor=border_col, linewidth=2)
        ax.add_patch(rect)
        
        ax.text(1.8, curr_y + box_h/2 + 0.14, title, ha='left', va='center',
                fontsize=11.5, fontweight='bold', color='#0F172A')
        ax.text(1.8, curr_y + box_h/2 - 0.16, desc, ha='left', va='center',
                fontsize=9.2, color='#334155')
        
        # Connect with arrow if not last
        if idx < len(steps) - 1:
            next_y = curr_y - spacing + box_h
            ax.annotate('', xy=(6.5, next_y), xytext=(6.5, curr_y),
                        arrowprops=dict(arrowstyle="->", color='#64748B', lw=2, shrinkA=1, shrinkB=2))

    # Add a side callout for validation gates
    callout = patches.FancyBboxPatch((11.6, 3.4), 1.2, 2.5, boxstyle="round,pad=0.1",
                                     facecolor="#FEF2F2", edgecolor="#EF4444", linewidth=1.5)
    ax.add_patch(callout)
    ax.text(12.2, 5.5, "Strict Validation\nGates", ha='center', va='center',
            fontsize=9.5, fontweight='bold', color="#991B1B")
    ax.text(12.2, 4.4, "• Budget Limits\n• Class Parity\n• Anti-Monopoly\n• Timer Lock", ha='center', va='center',
            fontsize=8.5, color="#7F1D1D")

    # Connect callout to steps 3 & 6
    ax.annotate('', xy=(11.4, 4.6), xytext=(11.6, 4.6),
                arrowprops=dict(arrowstyle="<-", color='#EF4444', lw=1.5, linestyle="--"))

    plt.tight_layout()
    plt.savefig('d:/Pairix/pairix_workflow.png', dpi=300, bbox_inches='tight')
    plt.close()
    print("Generated pairix_workflow.png successfully")

if __name__ == '__main__':
    create_pairix_architecture()
    create_pairix_workflow()

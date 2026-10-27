from typing import Dict, Any, List, Tuple
import numpy as np
from backend.ml.balance import simulate_acquisition, detect_skill_gaps

def calculate_team_fit(team: Dict[str, Any], candidate: Dict[str, Any]) -> Dict[str, Any]:
    """
    Computes an explainable Team Fit Score (0-100) and suggested bid range.
    Uses an explainable additive model with positive contributions for gap filling,
    role diversity, and experience, and penalties for skill redundancy.
    """
    team_radar = team.get('radar_vector', {})
    cand_radar = candidate.get('radar_dimensions', {})
    cand_feats = candidate.get('features', {})
    members = team.get('members', [])
    
    strengths, weaknesses, missing_skills = detect_skill_gaps(team_radar)
    
    # 1. Base Fit
    base_score = 40.0
    breakdown: Dict[str, float] = {}
    pros: List[str] = []
    cons: List[str] = []
    
    # 2. Skill Gap Coverage & Complementarity
    gap_points = 0.0
    for missing_dim in missing_skills:
        cand_val = cand_radar.get(missing_dim, 0.0)
        if cand_val >= 0.60:
            pts = round(16.0 * (cand_val / 1.0), 1)
            gap_points += pts
            breakdown[f"Fills critical {missing_dim} gap"] = f"+{pts}"
            pros.append(f"Provides high-level competency in missing area: {missing_dim}")
        elif cand_val >= 0.40:
            pts = round(10.0 * (cand_val / 1.0), 1)
            gap_points += pts
            breakdown[f"Supports {missing_dim} deficit"] = f"+{pts}"
            pros.append(f"Helps patch team weakness in {missing_dim}")

    for weak_dim in weaknesses:
        cand_val = cand_radar.get(weak_dim, 0.0)
        if cand_val >= 0.65:
            pts = round(12.0 * (cand_val / 1.0), 1)
            gap_points += pts
            breakdown[f"Strengthens weak {weak_dim}"] = f"+{pts}"
            pros.append(f"Brings vital strength to weak domain: {weak_dim}")

    # 3. Role Diversity
    existing_roles = [m.get('preferred_role', '').lower() for m in members]
    cand_role = candidate.get('preferred_role', '').lower()
    
    if cand_role and cand_role not in existing_roles:
        breakdown["Adds distinct role diversity"] = "+8.0"
        pros.append(f"Introduces new role archetype ({candidate.get('preferred_role')}) to team")
    else:
        breakdown["Overlaps with existing member role"] = "-4.0"
        cons.append(f"Team already has similar role orientation ({candidate.get('preferred_role')})")

    # 4. Hands-on & Hackathon Experience
    hackathons = int(candidate.get('hackathons', 0) or 0)
    if hackathons >= 2:
        hack_pts = min(12.0, hackathons * 3.5)
        breakdown["Proven hackathon experience"] = f"+{hack_pts:.1f}"
        pros.append(f"Strong hackathon track record ({hackathons} hackathons completed)")
    elif hackathons == 1:
        breakdown["Hackathon participation"] = "+5.0"
        pros.append("Brings prior competitive hackathon experience")

    # 5. Soft Skills (Communication & Leadership)
    comm = float(candidate.get('communication', 7.0) or 7.0)
    if comm >= 8.5:
        breakdown["Exceptional presentation/communication"] = "+7.0"
        pros.append(f"Top-tier communicator ({comm}/10), ideal for pitch & demos")
    elif comm < 5.5:
        breakdown["Limited communication/presentation score"] = "-5.0"
        cons.append(f"Lower communication assessment ({comm}/10)")

    # 6. Redundancy Check
    # If candidate only has strength in areas where team is already >= 0.85
    saturated_dims = [dim for dim, val in team_radar.items() if val >= 0.80]
    for sat_dim in saturated_dims:
        cand_val = cand_radar.get(sat_dim, 0.0)
        if cand_val >= 0.70 and len(missing_skills) > 0 and gap_points < 10:
            breakdown[f"Skill redundancy in {sat_dim}"] = "-6.0"
            cons.append(f"Team is already saturated in {sat_dim}; candidate adds diminishing return")

    # Calculate simulated team balance delta
    sim = simulate_acquisition(team, candidate)
    delta_balance = sim['delta_balance']
    if delta_balance > 0:
        pts = round(min(18.0, delta_balance * 0.9), 1)
        breakdown[f"Improves team balance (+{delta_balance} pts)"] = f"+{pts}"
    elif delta_balance < 0:
        pts = round(abs(delta_balance) * 0.5, 1)
        breakdown[f"Reduces team balance ({delta_balance} pts)"] = f"-{pts}"

    # Sum up total score
    total_score = base_score
    for val_str in breakdown.values():
        total_score += float(val_str)
        
    final_score = round(min(97.0, max(25.0, total_score)), 1)
    
    # Badge determination
    badge = "Solid Addition"
    if final_score >= 88:
        badge = "Great Fit"
    elif any("Fills critical" in k for k in breakdown.keys()):
        badge = "Fills Skill Gap"
    elif hackathons >= 3 or len(candidate.get('achievements', [])) >= 3:
        badge = "High Demand"
    elif cand_radar.get('Technical', 0) >= 0.75 and cand_radar.get('Development', 0) >= 0.75:
        badge = "Full-Stack Specialist"
    elif max(cand_radar.values()) - min(cand_radar.values()) < 0.25:
        badge = "Versatile"

    # Suggested Bid Range calculation:
    # Based on base_price, fit_score, team remaining credits, and remaining slots
    base_price = candidate.get('base_price', 100)
    credits_remaining = team.get('credits_remaining', 1000)
    slots_left = max(1, team.get('max_members', 5) - len(members))
    budget_per_slot = credits_remaining / slots_left
    
    # Fit factor: 50% fit -> 0.8x base, 95% fit -> 1.45x base
    fit_multiplier = 0.65 + (final_score / 100.0) * 0.85
    raw_suggested = base_price * fit_multiplier
    
    # Cap to reasonable fraction of remaining budget per slot
    max_budget_limit = budget_per_slot * 1.5
    raw_suggested = min(raw_suggested, max_budget_limit)
    
    sugg_min = int(round(max(base_price, raw_suggested * 0.88) / 5.0) * 5)
    sugg_max = int(round(max(sugg_min + 10, raw_suggested * 1.15) / 5.0) * 5)
    sugg_max = min(credits_remaining, sugg_max)
    sugg_min = min(sugg_min, sugg_max)

    return {
        'student_id': candidate.get('id'),
        'student_name': candidate.get('name'),
        'team_id': team.get('id'),
        'team_name': team.get('name'),
        'fit_score': final_score,
        'delta_balance_score': delta_balance,
        'breakdown': breakdown,
        'pros': pros,
        'cons': cons,
        'suggested_bid_min': sugg_min,
        'suggested_bid_max': sugg_max,
        'badge': badge
    }

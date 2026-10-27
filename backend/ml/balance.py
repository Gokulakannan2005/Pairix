from typing import List, Dict, Any, Tuple
import numpy as np
from backend.ml.feature_engineering import get_radar_keys

BENCHMARK_TARGET = 0.65
MIN_ACCEPTABLE_THRESHOLD = 0.35

def calculate_team_radar(members: List[Dict[str, Any]]) -> Dict[str, float]:
    """
    Computes aggregated team radar dimensions using hybrid max-pooling + team synergy average.
    dim_score = 0.70 * max(member_dim) + 0.30 * mean(member_dim)
    """
    radar_keys = get_radar_keys()
    if not members:
        return {k: 0.0 for k in radar_keys}
        
    team_radar = {}
    for key in radar_keys:
        vals = []
        for m in members:
            m_radar = m.get('radar_dimensions', {})
            vals.append(float(m_radar.get(key, 0.0)))
        if not vals:
            team_radar[key] = 0.0
        else:
            max_v = max(vals)
            avg_v = np.mean(vals)
            dim_val = min(1.0, 0.70 * max_v + 0.30 * avg_v)
            team_radar[key] = round(float(dim_val), 3)
            
    return team_radar

def detect_skill_gaps(team_radar: Dict[str, float]) -> Tuple[List[str], List[str], List[str]]:
    """
    Categorizes dimensions into strengths, weaknesses, and missing skills.
    """
    strengths = []
    weaknesses = []
    missing_skills = []
    
    for dim, val in team_radar.items():
        if val >= BENCHMARK_TARGET:
            strengths.append(dim)
        elif val >= MIN_ACCEPTABLE_THRESHOLD:
            weaknesses.append(dim)
        else:
            missing_skills.append(dim)
            
    return strengths, weaknesses, missing_skills

def calculate_team_balance_score(team_radar: Dict[str, float], member_count: int = 1) -> float:
    """
    Computes a mathematically sound Team Balance Score (0 - 100):
    - Higher score requires broad coverage across all 6 dimensions.
    - Penalizes high variance (imbalanced/lopsided teams).
    - Rewards crossing threshold in all essential project facets.
    """
    vals = list(team_radar.values())
    if not vals or all(v == 0 for v in vals):
        return 0.0
        
    mean_val = float(np.mean(vals))
    std_val = float(np.std(vals))
    coverage_count = sum(1 for v in vals if v >= MIN_ACCEPTABLE_THRESHOLD)
    solid_count = sum(1 for v in vals if v >= BENCHMARK_TARGET)
    
    # 0.0 - 1.0 components
    coverage_ratio = coverage_count / len(vals)
    solid_ratio = solid_count / len(vals)
    
    # Base capability from mean and solid ratio
    capability_component = 0.50 * mean_val + 0.30 * solid_ratio + 0.20 * coverage_ratio
    
    # Penalty for skewness/standard deviation (max std for [0, 1] is 0.5)
    skewness_penalty = std_val * 0.45
    
    raw_score = (capability_component - skewness_penalty) * 100
    
    # Floor adjustment based on having at least some members
    score = min(98.0, max(15.0, raw_score))
    return round(float(score), 1)

def simulate_acquisition(team: Dict[str, Any], candidate: Dict[str, Any]) -> Dict[str, Any]:
    """
    Simulates how acquiring candidate changes team radar, gaps, and balance score.
    """
    current_members = list(team.get('members', []))
    current_radar = team.get('radar_vector', calculate_team_radar(current_members))
    current_balance = team.get('balance_score', calculate_team_balance_score(current_radar, len(current_members)))
    
    new_members = current_members + [candidate]
    new_radar = calculate_team_radar(new_members)
    new_balance = calculate_team_balance_score(new_radar, len(new_members))
    
    new_strengths, new_weaknesses, new_missing = detect_skill_gaps(new_radar)
    
    delta = round(new_balance - current_balance, 1)
    
    return {
        'old_balance': current_balance,
        'new_balance': new_balance,
        'delta_balance': delta,
        'old_radar': current_radar,
        'new_radar': new_radar,
        'new_strengths': new_strengths,
        'new_weaknesses': new_weaknesses,
        'new_missing': new_missing
    }

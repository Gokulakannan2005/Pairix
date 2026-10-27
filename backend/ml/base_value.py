from typing import Dict, Any, Tuple
import numpy as np

def calculate_student_base_price(student: Dict[str, Any]) -> Tuple[int, Dict[str, int]]:
    """
    Calculates initial virtual credit base price (typical range: 70 - 180 credits)
    with a clear, explainable breakdown.
    Formula factors:
    - Base allotment: 50 credits
    - Skill proficiency & depth: +10 to +40 credits
    - Project depth & portfolio: +10 to +35 credits
    - Achievements & awards: +5 to +25 credits
    - Hackathon & hands-on hustle: +5 to +25 credits
    - Communication & leadership: +5 to +20 credits
    """
    features = student.get('features', {})
    skills = student.get('technical_skills', [])
    projects = student.get('projects', [])
    achievements = student.get('achievements', [])
    hackathons = int(student.get('hackathons', 0) or 0)
    comm = float(student.get('communication', 7.0) or 7.0)
    lead = float(student.get('leadership', 6.0) or 6.0)
    
    # 1. Skill depth: based on top 3 technical features
    tech_keys = ['python', 'java_cpp', 'web_dev', 'ai_ml', 'deep_learning', 'data_sql_db', 'cloud_devops', 'ui_ux_design', 'cybersecurity']
    tech_scores = [features.get(k, 0.0) for k in tech_keys]
    top_3_avg = np.mean(sorted(tech_scores, reverse=True)[:3]) if tech_scores else 0.5
    skill_depth_pts = int(round(top_3_avg * 35))
    
    # 2. Projects
    proj_pts = min(30, int(len(projects) * 10))
    
    # 3. Achievements & Certifications
    ach_pts = min(25, int(len(achievements) * 8 + len(student.get('certifications', [])) * 4))
    
    # 4. Hackathon experience
    hack_pts = min(25, hackathons * 8)
    
    # 5. Communication & leadership
    comm_pts = int(round(((comm / 10.0) * 12) + ((lead / 10.0) * 8)))
    
    base_allotment = 40
    total_price = base_allotment + skill_depth_pts + proj_pts + ach_pts + hack_pts + comm_pts
    
    # Round to nearest multiple of 5 for clean auction bids
    rounded_price = int(round(total_price / 5.0) * 5)
    rounded_price = max(60, min(190, rounded_price))
    
    breakdown = {
        'Base Allotment': base_allotment,
        'Skill Depth & Breadth': skill_depth_pts,
        'Project Portfolio': proj_pts,
        'Achievements & Honors': ach_pts,
        'Hackathon Experience': hack_pts,
        'Communication & Leadership': comm_pts
    }
    
    return rounded_price, breakdown

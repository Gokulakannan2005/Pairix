import re
from typing import Dict, List, Any, Tuple
import numpy as np

# Skill dictionary mappings
SKILL_MAP = {
    'python': ['python', 'py', 'django', 'fastapi', 'flask'],
    'java_cpp': ['java', 'c++', 'c', 'c#', 'cpp', 'object oriented', 'dsa'],
    'web_dev': ['react', 'html', 'css', 'javascript', 'typescript', 'frontend', 'node', 'express', 'vue', 'angular', 'web', 'tailwind'],
    'mobile': ['flutter', 'react native', 'android', 'kotlin', 'swift', 'ios'],
    'data_sql_db': ['sql', 'mysql', 'postgresql', 'mongodb', 'database', 'sqlite', 'redis', 'nosql'],
    'cloud_devops': ['docker', 'kubernetes', 'aws', 'azure', 'gcp', 'cloud', 'ci/cd', 'devops', 'linux', 'git'],
    'cybersecurity': ['cybersecurity', 'ethical hacking', 'network security', 'cryptography', 'penetration testing', 'kali'],
    'ai_ml': ['machine learning', 'scikit-learn', 'sklearn', 'regression', 'classification', 'nlp', 'computer vision', 'data science', 'pandas', 'numpy'],
    'deep_learning': ['deep learning', 'pytorch', 'tensorflow', 'keras', 'cnn', 'rnn', 'transformer', 'llm', 'neural network'],
    'data_science': ['data analysis', 'data visualization', 'tableau', 'power bi', 'statistics', 'matplotlib', 'seaborn', 'eda'],
    'ui_ux_design': ['ui/ux', 'ui', 'ux', 'figma', 'design', 'adobe xd', 'wireframing', 'user research', 'prototyping']
}

LEVEL_WEIGHTS = {
    'beginner': 0.40,
    'intermediate': 0.75,
    'advanced': 1.00,
    'expert': 1.00
}

def normalize_text(text: str) -> str:
    return re.sub(r'[^a-zA-Z0-9\s\+\#\/]', ' ', str(text).lower())

def extract_features_from_student(student_data: Dict[str, Any]) -> Tuple[Dict[str, float], Dict[str, float], str]:
    """
    Extracts a 16-dimensional normalized numerical feature vector,
    6 radar summary dimensions, and an archetype label.
    """
    skills_list = student_data.get('technical_skills', [])
    if isinstance(skills_list, str):
        skills_list = [s.strip() for s in skills_list.split(',') if s.strip()]
    
    skill_levels = student_data.get('skill_levels', {})
    if not isinstance(skill_levels, dict):
        skill_levels = {}
        
    projects = student_data.get('projects', [])
    if isinstance(projects, str):
        projects = [p.strip() for p in projects.split(';') if p.strip()]
        
    achievements = student_data.get('achievements', [])
    if isinstance(achievements, str):
        achievements = [a.strip() for a in achievements.split(';') if a.strip()]
        
    certifications = student_data.get('certifications', [])
    if isinstance(certifications, str):
        certifications = [c.strip() for c in certifications.split(';') if c.strip()]
        
    hackathons = int(student_data.get('hackathons', 0) or 0)
    comm_score = float(student_data.get('communication', 7.0) or 7.0)
    lead_score = float(student_data.get('leadership', 6.0) or 6.0)
    
    # Combined textual context for keyword extraction
    all_text = " ".join([
        " ".join(skills_list),
        " ".join(projects),
        " ".join(achievements),
        " ".join(certifications),
        str(student_data.get('preferred_role', '')),
        str(student_data.get('department', ''))
    ])
    cleaned_context = normalize_text(all_text)
    
    features: Dict[str, float] = {}
    
    # Evaluate skill category proficiency
    for cat, keywords in SKILL_MAP.items():
        score = 0.0
        # Check explicit skills list & levels
        for skill in skills_list:
            s_lower = skill.lower()
            for kw in keywords:
                if kw in s_lower:
                    lvl = skill_levels.get(skill, 'intermediate').lower()
                    score = max(score, LEVEL_WEIGHTS.get(lvl, 0.75))
        
        # Check keywords in text context
        kw_matches = sum(1 for kw in keywords if f" {kw} " in f" {cleaned_context} " or kw in cleaned_context)
        if kw_matches > 0:
            text_boost = min(0.35, kw_matches * 0.15)
            score = min(1.0, max(score, 0.40) + text_boost)
            
        features[cat] = round(float(score), 3)

    # Soft skills & experiences (normalized 0 to 1)
    features['communication'] = round(min(1.0, max(0.1, comm_score / 10.0)), 3)
    features['presentation'] = round(min(1.0, max(0.1, (comm_score * 0.9 + lead_score * 0.1) / 10.0)), 3)
    features['leadership'] = round(min(1.0, max(0.1, lead_score / 10.0)), 3)
    
    # Project depth: based on project count and detail
    proj_score = min(1.0, len(projects) * 0.35)
    features['project_depth'] = round(float(proj_score), 3)
    
    # Hackathon experience: capped at 4 hackathons = 1.0
    hack_score = min(1.0, hackathons * 0.25)
    features['hackathon_exp'] = round(float(hack_score), 3)

    # 6 High-Level Radar Dimensions (0.0 to 1.0)
    radar = {
        'Technical': round(float(np.mean([features['python'], features['java_cpp'], features['data_sql_db']])), 3),
        'AI & ML': round(float(np.mean([features['ai_ml'], features['deep_learning'], features['data_science']])), 3),
        'Development': round(float(np.mean([features['web_dev'], features['mobile'], features['cloud_devops']])), 3),
        'Design & UX': round(float(features['ui_ux_design']), 3),
        'Communication': round(float(np.mean([features['communication'], features['presentation']])), 3),
        'Leadership & Exp': round(float(np.mean([features['leadership'], features['project_depth'], features['hackathon_exp']])), 3)
    }

    # Archetype derivation
    top_dim = max(radar.items(), key=lambda x: x[1])
    archetype = "Generalist"
    if radar['AI & ML'] >= 0.70:
        archetype = "ML & Data Specialist"
    elif radar['Design & UX'] >= 0.70:
        archetype = "UI/UX Designer"
    elif features['web_dev'] >= 0.75:
        archetype = "Full-Stack Developer"
    elif features['cybersecurity'] >= 0.65:
        archetype = "Security Specialist"
    elif features['leadership'] >= 0.80 and features['communication'] >= 0.80:
        archetype = "Product & Team Leader"
    elif features['hackathon_exp'] >= 0.75:
        archetype = "Hackathon Builder"
    elif top_dim[0] == 'Technical':
        archetype = "Core Software Engineer"
        
    return features, radar, archetype

def get_feature_names() -> List[str]:
    return [
        'python', 'java_cpp', 'web_dev', 'mobile', 'data_sql_db',
        'cloud_devops', 'cybersecurity', 'ai_ml', 'deep_learning',
        'data_science', 'ui_ux_design', 'communication', 'presentation',
        'leadership', 'project_depth', 'hackathon_exp'
    ]

def get_radar_keys() -> List[str]:
    return ['Technical', 'AI & ML', 'Development', 'Design & UX', 'Communication', 'Leadership & Exp']

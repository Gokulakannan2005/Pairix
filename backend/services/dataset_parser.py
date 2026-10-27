import io
import os
import re
from typing import List, Dict, Any, Tuple
import pandas as pd
from backend.models.schemas import Student
from backend.ml.feature_engineering import extract_features_from_student
from backend.ml.base_value import calculate_student_base_price

COLUMN_SYNONYMS = {
    'name': ['name', 'student_name', 'full_name'],
    'register_no': ['register_no', 'reg_no', 'roll_no', 'reg_num', 'regno', 'registration_number', 'id'],
    'department': ['department', 'dept', 'branch', 'stream'],
    'preferred_role': ['preferred_role', 'role', 'domain_role', 'specialization'],
    'technical_skills': ['technical_skills', 'skills', 'tech_skills', 'key_skills'],
    'skill_levels': ['skill_levels', 'proficiency', 'level'],
    'interests': ['interests', 'domain_interests', 'areas_of_interest'],
    'projects': ['projects', 'project_list', 'past_projects'],
    'achievements': ['achievements', 'awards', 'honors'],
    'certifications': ['certifications', 'certs', 'courses'],
    'hackathons': ['hackathons', 'hackathon_count', 'hackathon_exp'],
    'communication': ['communication', 'comm_score', 'communication_score'],
    'leadership': ['leadership', 'leadership_score', 'lead_score'],
    'cgpa': ['cgpa', 'gpa', 'grade']
}

def map_column_name(col: str) -> str:
    cleaned = re.sub(r'[^a-zA-Z0-9_]', '', col.strip().lower().replace(' ', '_'))
    for target, synonyms in COLUMN_SYNONYMS.items():
        if cleaned in synonyms:
            return target
    return cleaned

def parse_dataset_bytes(file_bytes: bytes, filename: str) -> Tuple[List[Student], Dict[str, Any]]:
    """
    Parses CSV or Excel bytes into processed Student models with engineered features.
    """
    if filename.endswith('.csv'):
        df = pd.read_csv(io.BytesIO(file_bytes))
    elif filename.endswith(('.xlsx', '.xls')):
        df = pd.read_excel(io.BytesIO(file_bytes), engine='openpyxl')
    else:
        raise ValueError("Unsupported file format. Please upload a .csv or .xlsx file.")

    if df.empty:
        raise ValueError("Uploaded dataset is empty.")

    # Standardize column names
    col_mapping = {c: map_column_name(c) for c in df.columns}
    df = df.rename(columns=col_mapping)

    students: List[Student] = []
    unique_skills = set()
    roles_set = set()
    hackathon_count = 0
    seen_ids = set()

    for idx, row in df.iterrows():
        name = str(row.get('name', f"Student {idx+1}")).strip()
        reg_no = str(row.get('register_no', f"REG{100+idx}")).strip()
        
        # Deduplication check
        if reg_no in seen_ids:
            reg_no = f"{reg_no}_{idx+1}"
        seen_ids.add(reg_no)

        dept = str(row.get('department', 'Computer Science')).strip()
        role = str(row.get('preferred_role', 'Software Developer')).strip()
        roles_set.add(role)

        # Parse skills
        skills_raw = str(row.get('technical_skills', ''))
        skills = [s.strip() for s in skills_raw.split(',') if s.strip() and s.strip().lower() != 'nan']
        for s in skills:
            unique_skills.add(s.lower())

        # Parse skill levels
        levels_raw = str(row.get('skill_levels', ''))
        skill_levels = {}
        if ':' in levels_raw:
            for item in levels_raw.split(','):
                if ':' in item:
                    k, v = item.split(':', 1)
                    skill_levels[k.strip()] = v.strip()
        elif levels_raw and levels_raw.lower() != 'nan':
            # default intermediate
            for s in skills:
                skill_levels[s] = 'Intermediate'

        # Parse lists (projects, achievements, certifications, interests)
        def parse_semicolon_list(raw_val: Any) -> List[str]:
            s_val = str(raw_val)
            if not s_val or s_val.lower() == 'nan':
                return []
            delimiter = ';' if ';' in s_val else ','
            return [x.strip() for x in s_val.split(delimiter) if x.strip()]

        projects = parse_semicolon_list(row.get('projects', ''))
        achievements = parse_semicolon_list(row.get('achievements', ''))
        certifications = parse_semicolon_list(row.get('certifications', ''))
        interests = parse_semicolon_list(row.get('interests', ''))

        # Numerical fields
        try:
            hacks = int(float(row.get('hackathons', 0) or 0))
        except (ValueError, TypeError):
            hacks = 0
        if hacks > 0:
            hackathon_count += 1

        try:
            comm = float(row.get('communication', 7.0) or 7.0)
        except (ValueError, TypeError):
            comm = 7.0

        try:
            lead = float(row.get('leadership', 6.0) or 6.0)
        except (ValueError, TypeError):
            lead = 6.0

        cgpa = None
        try:
            cgpa_val = float(row.get('cgpa', 0) or 0)
            if cgpa_val > 0:
                cgpa = round(cgpa_val, 2)
        except (ValueError, TypeError):
            pass

        student_dict = {
            'id': f"std_{reg_no.lower().replace(' ', '_')}",
            'register_no': reg_no,
            'name': name,
            'department': dept,
            'preferred_role': role,
            'technical_skills': skills,
            'skill_levels': skill_levels,
            'interests': interests,
            'projects': projects,
            'achievements': achievements,
            'certifications': certifications,
            'hackathons': hacks,
            'communication': comm,
            'leadership': lead,
            'cgpa': cgpa
        }

        # Run feature engineering
        features, radar, archetype = extract_features_from_student(student_dict)
        student_dict['features'] = features
        student_dict['radar_dimensions'] = radar
        student_dict['archetype'] = archetype

        # Base price calculation
        base_price, breakdown = calculate_student_base_price(student_dict)
        student_dict['base_price'] = base_price
        student_dict['base_price_breakdown'] = breakdown

        students.append(Student(**student_dict))

    summary = {
        'total_students': len(students),
        'unique_skills_count': len(unique_skills),
        'roles_count': len(roles_set),
        'hackathon_participants': hackathon_count,
        'average_cgpa': round(float(pd.Series([s.cgpa for s in students if s.cgpa]).mean()), 2) if any(s.cgpa for s in students) else 8.5
    }

    return students, summary

from typing import List, Dict, Any, Tuple
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from backend.ml.feature_engineering import get_feature_names

def student_to_vector(student: Dict[str, Any]) -> np.ndarray:
    feats = student.get('features', {})
    feature_names = get_feature_names()
    return np.array([feats.get(k, 0.0) for k in feature_names], dtype=float)

def calculate_cosine_similarity(vec1: np.ndarray, vec2: np.ndarray) -> float:
    norm1 = np.linalg.norm(vec1)
    norm2 = np.linalg.norm(vec2)
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return float(np.dot(vec1, vec2) / (norm1 * norm2))

def find_similar_students(
    target_student: Dict[str, Any],
    all_students: List[Dict[str, Any]],
    top_k: int = 4
) -> List[Dict[str, Any]]:
    target_vec = student_to_vector(target_student)
    results = []
    
    for s in all_students:
        if s.get('id') == target_student.get('id'):
            continue
        s_vec = student_to_vector(s)
        sim = calculate_cosine_similarity(target_vec, s_vec)
        results.append({
            'student_id': s.get('id'),
            'name': s.get('name'),
            'register_no': s.get('register_no'),
            'department': s.get('department'),
            'preferred_role': s.get('preferred_role'),
            'archetype': s.get('archetype', 'Generalist'),
            'similarity_score': round(float(sim), 3),
            'similarity_percentage': round(float(sim * 100), 1)
        })
        
    results.sort(key=lambda x: x['similarity_score'], reverse=True)
    return results[:top_k]

def compute_similarity_matrix(students: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Computes pairwise cosine similarity matrix across students.
    Returns matrix data, labels, and metadata for ML Lab visualization.
    """
    if not students:
        return {'labels': [], 'matrix': []}
        
    names = [s.get('name', 'Student') for s in students]
    ids = [s.get('id', '') for s in students]
    vectors = np.array([student_to_vector(s) for s in students])
    
    # Calculate pairwise cosine similarity matrix
    sim_mat = cosine_similarity(vectors)
    sim_mat = np.round(sim_mat, 2).tolist()
    
    return {
        'names': names,
        'ids': ids,
        'matrix': sim_mat
    }

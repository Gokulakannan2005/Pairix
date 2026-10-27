import json
import time
from typing import Dict, Any, List
import pandas as pd

def generate_session_dossier(auction_mgr) -> Dict[str, Any]:
    """
    Compiles an exhaustive institutional talent draft dossier,
    ready for database storage, JSON export, and offline cohort analysis.
    """
    teams_data = []
    total_spent = 0
    all_members = []

    for t in auction_mgr.teams:
        spent = t.credits_initial - t.credits_remaining
        total_spent += spent
        
        # Calculate individual member valuations and contribution
        members_detailed = []
        for m in t.members:
            is_lead = (t.leader and t.leader.id == m.id)
            members_detailed.append({
                "id": m.id,
                "name": m.name,
                "register_no": m.register_no,
                "department": m.department,
                "preferred_role": m.preferred_role,
                "archetype": m.archetype,
                "is_leader": is_lead,
                "base_price": m.base_price,
                "technical_skills": m.technical_skills,
                "hackathons": m.hackathons,
                "communication": m.communication,
                "leadership": m.leadership,
                "radar_dimensions": m.radar_dimensions,
                "features": m.features
            })
            all_members.append(m)

        teams_data.append({
            "id": t.id,
            "name": t.name,
            "color_accent": t.color_accent,
            "credits_initial": t.credits_initial,
            "credits_remaining": t.credits_remaining,
            "credits_spent": spent,
            "balance_score": t.balance_score,
            "radar_vector": t.radar_vector,
            "strengths": t.strengths,
            "weaknesses": t.weaknesses,
            "missing_skills": t.missing_skills,
            "members": members_detailed
        })

    # Cohort summary
    dossier = {
        "export_metadata": {
            "platform": "Pairix Smart Draft",
            "version": "2.0.0",
            "exported_at": time.strftime("%Y-%m-%d %H:%M:%S"),
            "total_teams": len(teams_data),
            "total_students_placed": len(all_members),
            "total_credits_spent": total_spent,
            "average_balance_score": round(sum(t["balance_score"] for t in teams_data) / max(1, len(teams_data)), 1)
        },
        "teams": teams_data,
        "passed_students": [s.model_dump() for s in auction_mgr.passed_students],
        "draft_activities": [a.model_dump() for a in auction_mgr.activities]
    }
    return dossier

def run_cohort_intelligence(dossier: Dict[str, Any]) -> Dict[str, Any]:
    """
    Performs deep cohort intelligence & predictive modeling on draft results.
    - Institutional Skill Shortage Heatmap
    - Head-to-Head Hackathon Track Simulations
    - Recommended Project Domain & Tech Stack
    - Draft Economy Efficiency (ROI)
    """
    teams = dossier.get("teams", [])
    if not teams:
        return {"error": "No teams found in dossier."}

    # 1. Institutional Skill Deficiency Heatmap
    # Aggregate capability across all 6 radar axes
    radar_keys = ["Technical", "AI & ML", "Development", "Design & UX", "Communication", "Leadership & Exp"]
    institutional_radar = {}
    teams_meeting_benchmark = {}

    for k in radar_keys:
        vals = [t["radar_vector"].get(k, 0.0) for t in teams]
        avg_v = round(sum(vals) / max(1, len(vals)), 2)
        institutional_radar[k] = avg_v
        # count how many teams hit >= 0.65 benchmark
        teams_meeting_benchmark[k] = sum(1 for v in vals if v >= 0.65)

    # 2. Track Simulation Models (AI, Full-Stack, Mobile/IoT, Enterprise Cloud)
    tracks = [
        {"name": "AI & Deep Learning", "weights": {"AI & ML": 0.45, "Technical": 0.25, "Development": 0.15, "Communication": 0.15}},
        {"name": "Full-Stack SaaS", "weights": {"Development": 0.40, "Design & UX": 0.25, "Technical": 0.20, "Communication": 0.15}},
        {"name": "Mobile & IoT FinTech", "weights": {"Development": 0.35, "Technical": 0.30, "Design & UX": 0.20, "Leadership & Exp": 0.15}},
        {"name": "Enterprise Cloud & Security", "weights": {"Technical": 0.40, "Development": 0.30, "AI & ML": 0.15, "Leadership & Exp": 0.15}}
    ]

    track_ratings = {}
    for track in tracks:
        tname = track["name"]
        w = track["weights"]
        team_scores = []
        for t in teams:
            score = 0.0
            r = t["radar_vector"]
            for dim, weight in w.items():
                score += r.get(dim, 0.0) * weight
            team_scores.append({
                "team_id": t["id"],
                "team_name": t["name"],
                "color": t.get("color_accent", "#3b82f6"),
                "competency": round(score * 100, 1)
            })
        team_scores.sort(key=lambda x: x["competency"], reverse=True)
        track_ratings[tname] = team_scores

    # 3. Project Suitability & Architecture Architect
    project_recommendations = {}
    for t in teams:
        r = t["radar_vector"]
        recs = []
        if r.get("AI & ML", 0) >= 0.60 and r.get("Technical", 0) >= 0.55:
            recs.append({
                "domain": "Autonomous Agentic AI / Multimodal LLM Pipeline",
                "recommended_stack": "PyTorch, FastAPI, Qdrant/Milvus, LangGraph, React",
                "match": "High (AI & Technical Dominance)"
            })
        if r.get("Development", 0) >= 0.60 and r.get("Design & UX", 0) >= 0.50:
            recs.append({
                "domain": "Collaborative Real-time SaaS / Canvas Platform",
                "recommended_stack": "Next.js, TypeScript, TailwindCSS, WebSocket, Supabase",
                "match": "High (Product Design & Web Dev Synergy)"
            })
        if r.get("Technical", 0) >= 0.60 and r.get("Development", 0) >= 0.50:
            recs.append({
                "domain": "High-Throughput Distributed Microservices / Cloud DevOps",
                "recommended_stack": "Go / Java Spring, Docker, Kubernetes, Kafka, Prometheus",
                "match": "Solid (Backend & Infrastructure Core)"
            })
        if not recs:
            recs.append({
                "domain": "Cross-Functional Web & Mobile Client Application",
                "recommended_stack": "React Native, Node.js Express, PostgreSQL, Figma",
                "match": "Moderate (Generalist Foundation)"
            })
        project_recommendations[t["name"]] = recs

    # 4. Draft Economy & ROI Metrics
    roi_metrics = []
    for t in teams:
        spent = max(1, t["credits_spent"])
        bal = t["balance_score"]
        # Points of balance gained per 100 credits spent
        roi = round((bal / spent) * 100, 2)
        roi_metrics.append({
            "team_id": t["id"],
            "team_name": t["name"],
            "color": t.get("color_accent", "#2563eb"),
            "credits_spent": spent,
            "balance_score": bal,
            "roi_ratio": roi,
            "efficiency_grade": "A+" if roi >= 15 else "A" if roi >= 10 else "B+"
        })
    roi_metrics.sort(key=lambda x: x["roi_ratio"], reverse=True)

    return {
        "institutional_radar": institutional_radar,
        "teams_meeting_benchmark": teams_meeting_benchmark,
        "track_ratings": track_ratings,
        "project_recommendations": project_recommendations,
        "roi_metrics": roi_metrics,
        "benchmark_threshold": 0.65
    }

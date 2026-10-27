import os
import io
from typing import List, Optional
from fastapi import FastAPI, UploadFile, File, Query, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel
import pandas as pd

from backend.models.schemas import Student, Team, AuctionState, TeamFitBreakdown
from backend.services.auction_manager import auction_manager
from backend.services.dataset_parser import parse_dataset_bytes
from backend.services.database import db_service
from backend.services.trade_manager import TradeManager
from backend.services.analysis_service import generate_session_dossier, run_cohort_intelligence
from backend.ml.similarity import find_similar_students, compute_similarity_matrix
from backend.ml.team_fit import calculate_team_fit
from backend.ml.model import compatibility_nn
from backend.ml.feature_engineering import get_feature_names, get_radar_keys
from backend.data.sample_dataset import SAMPLE_STUDENTS

app = FastAPI(title="Pairix API", description="AI-Powered Talent Draft & Team Formation Engine", version="2.0.0")

trade_manager = TradeManager(auction_manager)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pre-train the PyTorch MLP model on startup
@app.on_event("startup")
def startup_event():
    try:
        compatibility_nn.train_model()
    except Exception as e:
        print(f"MLP training initialization notice: {e}")

@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": "Pairix", "ml_ready": True}

# ==================== DATASET & SAMPLE DOWNLOAD ====================

@app.get("/api/sample/download")
def download_sample_dataset(format: str = Query("csv", pattern="^(csv|xlsx)$")):
    df = pd.DataFrame(SAMPLE_STUDENTS)
    if format == "csv":
        stream = io.StringIO()
        df.to_csv(stream, index=False)
        return StreamingResponse(
            io.BytesIO(stream.getvalue().encode('utf-8')),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=pairix_sample_students.csv"}
        )
    else:
        stream = io.BytesIO()
        df.to_excel(stream, index=False, engine='openpyxl')
        stream.seek(0)
        return StreamingResponse(
            stream,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=pairix_sample_students.xlsx"}
        )

@app.post("/api/dataset/upload")
async def upload_dataset(file: UploadFile = File(...)):
    contents = await file.read()
    try:
        students, summary = parse_dataset_bytes(contents, file.filename)
        auction_manager.all_students = students
        auction_manager.available_students = list(students)
        return {
            "success": True,
            "filename": file.filename,
            "summary": summary,
            "students": [s.model_dump() for s in students[:10]]  # preview first 10
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse dataset: {str(e)}")

# ==================== STUDENT EXPLORER ====================

@app.get("/api/students")
def get_students(
    search: Optional[str] = None,
    role: Optional[str] = None,
    skill: Optional[str] = None,
    archetype: Optional[str] = None
):
    students = auction_manager.all_students
    filtered = []
    for s in students:
        if search:
            q = search.lower()
            if q not in s.name.lower() and q not in s.register_no.lower() and q not in s.preferred_role.lower():
                continue
        if role and role.lower() != 'all':
            if role.lower() not in s.preferred_role.lower():
                continue
        if skill and skill.lower() != 'all':
            if not any(skill.lower() in sk.lower() for sk in s.technical_skills):
                continue
        if archetype and archetype.lower() != 'all':
            if s.archetype and archetype.lower() not in s.archetype.lower():
                continue
        filtered.append(s)
    return filtered

@app.get("/api/students/{student_id}")
def get_student_detail(student_id: str):
    student = next((s for s in auction_manager.all_students if s.id == student_id), None)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")
    
    similar = find_similar_students(
        student.model_dump(),
        [s.model_dump() for s in auction_manager.all_students],
        top_k=4
    )
    return {
        "student": student,
        "similar_students": similar
    }

# ==================== AUCTION SETUP ====================

@app.get("/api/setup/suggest-leaders")
def suggest_leaders(count: int = 4):
    leaders = auction_manager.suggest_leaders(count)
    return leaders

class ConfigureTeamsRequest(BaseModel):
    num_teams: int
    team_size: int
    starting_credits: int
    leader_ids: List[str]

@app.post("/api/setup/configure")
def configure_teams(payload: ConfigureTeamsRequest):
    if len(payload.leader_ids) < payload.num_teams:
        raise HTTPException(status_code=400, detail="Please select a leader for each team.")
    auction_manager.configure_teams(
        payload.num_teams,
        payload.team_size,
        payload.starting_credits,
        payload.leader_ids
    )
    return {"success": True, "teams_configured": len(auction_manager.teams)}

# ==================== LIVE AUCTION ====================

@app.get("/api/auction/state")
def get_auction_state():
    return auction_manager.get_state()

@app.get("/api/auction/fits")
def get_current_student_fits():
    return auction_manager.get_team_fits_for_current_student()

class PlaceBidRequest(BaseModel):
    team_id: str
    amount: int

@app.post("/api/auction/bid")
def place_bid(payload: PlaceBidRequest):
    res = auction_manager.place_bid(payload.team_id, payload.amount)
    if not res['success']:
        raise HTTPException(status_code=400, detail=res['message'])
    return res

@app.post("/api/auction/simulate-competing-bid")
def simulate_competing_bid():
    res = auction_manager.simulate_competing_bid()
    return res

@app.post("/api/auction/sold")
def mark_sold():
    res = auction_manager.mark_sold()
    return res

@app.post("/api/auction/pass")
def pass_student():
    res = auction_manager.pass_student()
    return res

@app.post("/api/auction/nominate/{student_id}")
def nominate_student(student_id: str):
    res = auction_manager.select_student_to_auction(student_id)
    if not res['success']:
        raise HTTPException(status_code=400, detail=res['message'])
    return res

@app.post("/api/auction/reset")
def reset_auction_demo():
    auction_manager.reset_to_demo_state()
    return {"success": True, "message": "Demo state restored successfully."}

# ==================== TEAMS & RECOMMENDATIONS ====================

@app.get("/api/teams")
def get_teams():
    team_data = []
    for t in auction_manager.teams:
        recs = auction_manager.get_team_recommendations(t.id, top_k=3)
        t_dict = t.model_dump()
        t_dict['recommendations'] = recs
        team_data.append(t_dict)
    return team_data

@app.get("/api/teams/{team_id}/recommendations")
def get_team_recommendations(team_id: str):
    recs = auction_manager.get_team_recommendations(team_id, top_k=5)
    return recs

# ==================== ML LAB & INTELLIGENCE ====================

@app.get("/api/ml/insights")
def get_ml_insights():
    # 1. Feature matrix (first 15 students for clean inspection)
    sample_students = auction_manager.all_students[:15]
    feature_names = get_feature_names()
    
    matrix_rows = []
    for s in sample_students:
        row = {
            'student_id': s.id,
            'name': s.name,
            'role': s.preferred_role,
            'archetype': s.archetype
        }
        for fn in feature_names:
            row[fn] = s.features.get(fn, 0.0) if s.features else 0.0
        matrix_rows.append(row)

    # 2. Cosine Similarity Matrix
    sim_data = compute_similarity_matrix([s.model_dump() for s in sample_students])

    # 3. Model Architecture & Loss graph
    model_summary = compatibility_nn.get_model_summary()

    # 4. Feature Names & Radar Keys
    return {
        'feature_names': feature_names,
        'radar_keys': get_radar_keys(),
        'feature_matrix': matrix_rows,
        'similarity_matrix': sim_data,
        'model_summary': model_summary,
        'benchmark_target': 0.65
    }

class CalculateFitRequest(BaseModel):
    team_id: str
    student_id: str

@app.post("/api/ml/calculate-fit")
def calculate_custom_fit(payload: CalculateFitRequest):
    team = next((t for t in auction_manager.teams if t.id == payload.team_id), None)
    student = next((s for s in auction_manager.all_students if s.id == payload.student_id), None)
    
    if not team or not student:
        raise HTTPException(status_code=404, detail="Team or Student not found.")
        
    fit_res = calculate_team_fit(team.model_dump(), student.model_dump())
    
    # Run PyTorch neural compatibility
    t_vec = list(team.radar_vector.values()) + [0.5]*10
    s_vec = list(student.radar_dimensions.values()) + [0.5]*10
    neural_score = compatibility_nn.predict(t_vec, s_vec)
    
    return {
        'team_name': team.name,
        'student_name': student.name,
        'team_fit_score': fit_res['fit_score'],
        'neural_compatibility': neural_score,
        'delta_balance_score': fit_res['delta_balance_score'],
        'breakdown': fit_res['breakdown'],
        'pros': fit_res['pros'],
        'cons': fit_res['cons'],
        'badge': fit_res['badge'],
        'suggested_bid_min': fit_res['suggested_bid_min'],
        'suggested_bid_max': fit_res['suggested_bid_max']
    }

# ==================== FINAL RESULTS ====================

@app.get("/api/results")
def get_final_results():
    teams = auction_manager.teams
    
    total_spent = sum(t.credits_initial - t.credits_remaining for t in teams)
    avg_balance = round(float(sum(t.balance_score for t in teams) / len(teams)), 1) if teams else 0.0
    
    # Analytics comparisons
    team_comparison = []
    for t in teams:
        team_comparison.append({
            'team_id': t.id,
            'name': t.name,
            'color': t.color_accent,
            'leader': t.leader.name,
            'members_count': len(t.members),
            'credits_spent': t.credits_initial - t.credits_remaining,
            'credits_remaining': t.credits_remaining,
            'balance_score': t.balance_score,
            'radar': t.radar_vector,
            'strengths': t.strengths,
            'weaknesses': t.weaknesses,
            'missing': t.missing_skills
        })
        
    return {
        'total_teams': len(teams),
        'total_students_placed': sum(len(t.members) for t in teams),
        'total_credits_spent': total_spent,
        'average_balance_score': avg_balance,
        'teams': team_comparison,
        'passed_count': len(auction_manager.passed_students)
    }

# ==================== TRADING ROUND ====================

class TradeProposalRequest(BaseModel):
    team_a_id: str
    team_b_id: str
    player_a_id: str
    player_b_id: str
    credit_sweetener: int = 0

@app.post("/api/trade/evaluate")
def evaluate_trade(payload: TradeProposalRequest):
    res = trade_manager.evaluate_trade(
        payload.team_a_id,
        payload.team_b_id,
        payload.player_a_id,
        payload.player_b_id,
        payload.credit_sweetener
    )
    return res

@app.post("/api/trade/execute")
def execute_trade(payload: TradeProposalRequest):
    res = trade_manager.execute_trade(
        payload.team_a_id,
        payload.team_b_id,
        payload.player_a_id,
        payload.player_b_id,
        payload.credit_sweetener
    )
    if not res['success']:
        raise HTTPException(status_code=400, detail=res['message'])
    return res

@app.get("/api/trade/history")
def get_trade_history():
    return db_service.get_trades()

# ==================== DATABASE & PERSISTENCE ====================

class SaveSessionRequest(BaseModel):
    session_id: str
    session_name: str
    config: Optional[dict] = None

@app.post("/api/database/save")
def save_session_to_database(payload: SaveSessionRequest):
    state = auction_manager.get_state().model_dump()
    cfg = payload.config or {"team_size": 5, "starting_credits": 1000}
    res = db_service.save_session_snapshot(payload.session_id, payload.session_name, state, cfg)
    return res

@app.get("/api/database/sessions")
def list_saved_sessions():
    return db_service.list_sessions()

@app.post("/api/database/load/{session_id}")
def load_session_from_database(session_id: str):
    snapshot = db_service.get_session_snapshot(session_id)
    if not snapshot:
        raise HTTPException(status_code=404, detail="Saved session not found.")
    
    # Restore teams and state into auction_manager
    try:
        auction_manager.teams = [Team(**t) for t in snapshot.get("teams", [])]
        auction_manager.available_students = [Student(**s) for s in snapshot.get("available_students", [])]
        if snapshot.get("current_student"):
            auction_manager.current_student = Student(**snapshot["current_student"])
        else:
            auction_manager.current_student = None
        auction_manager.current_bid = snapshot.get("current_bid", 0)
        auction_manager.highest_bidder_id = snapshot.get("highest_bidder_team_id")
        auction_manager.highest_bidder_name = snapshot.get("highest_bidder_team_name")
        return {"success": True, "message": f"Session '{session_id}' loaded successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to restore session state: {str(e)}")

# ==================== DOSSIER EXPORT & COHORT ANALYSIS ====================

@app.get("/api/database/export/dossier")
def export_dossier():
    dossier = generate_session_dossier(auction_manager)
    stream = io.StringIO()
    json.dump(dossier, stream, indent=2)
    return StreamingResponse(
        io.BytesIO(stream.getvalue().encode('utf-8')),
        media_type="application/json",
        headers={"Content-Disposition": "attachment; filename=pairix_talent_dossier.json"}
    )

@app.get("/api/database/export/csv")
def export_rosters_csv():
    rows = []
    for t in auction_manager.teams:
        for m in t.members:
            rows.append({
                "Team Name": t.name,
                "Role in Team": "Leader" if t.leader and t.leader.id == m.id else "Member",
                "Student ID": m.register_no,
                "Name": m.name,
                "Department": m.department,
                "Preferred Role": m.preferred_role,
                "Base Price": m.base_price,
                "Hackathons": m.hackathons,
                "Communication": m.communication,
                "Leadership": m.leadership,
                "Technical Skills": ", ".join(m.technical_skills)
            })
    df = pd.DataFrame(rows)
    stream = io.StringIO()
    df.to_csv(stream, index=False)
    return StreamingResponse(
        io.BytesIO(stream.getvalue().encode('utf-8')),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=pairix_team_rosters.csv"}
    )

@app.get("/api/analysis/cohort-intelligence")
def get_current_cohort_intelligence():
    dossier = generate_session_dossier(auction_manager)
    return {
        "dossier": dossier,
        "intelligence": run_cohort_intelligence(dossier)
    }

class ImportDossierRequest(BaseModel):
    dossier: dict

@app.post("/api/analysis/import-dossier")
def analyze_imported_dossier(payload: ImportDossierRequest):
    intel = run_cohort_intelligence(payload.dossier)
    return {
        "dossier": payload.dossier,
        "intelligence": intel
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)


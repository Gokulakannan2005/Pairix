import sys
from backend.services.auction_manager import auction_manager
from backend.services.trade_manager import TradeManager
from backend.services.database import db_service
from backend.services.analysis_service import generate_session_dossier, run_cohort_intelligence

print("=== STARTING PAIRIX v2.0 NEW FEATURES VERIFICATION ===")

# 1. Reset auction state
print("\n[Test 1] Resetting demo state...")
auction_manager.reset_to_demo_state()
assert len(auction_manager.teams) == 4
team_nova = auction_manager.teams[0]
team_orion = auction_manager.teams[1]
print(f"Team Nova leader: {team_nova.leader.name}")
print(f"Team Orion leader: {team_orion.leader.name}")

# 2. Acquire a student for Team Nova
candidate1 = auction_manager.current_student
print(f"\n[Test 2] Bidding & acquiring {candidate1.name} for Team Nova...")
bid1 = auction_manager.place_bid(team_nova.id, candidate1.base_price + 20)
assert bid1['success']
sold1 = auction_manager.mark_sold()
assert sold1['success']
assert len(team_nova.members) == 2
print(f"Team Nova now has 2 members: {[m.name for m in team_nova.members]}")

# 3. Acquire next student for Team Orion
candidate2 = auction_manager.current_student
print(f"\n[Test 3] Bidding & acquiring {candidate2.name} for Team Orion...")
bid2 = auction_manager.place_bid(team_orion.id, candidate2.base_price + 10)
assert bid2['success']
sold2 = auction_manager.mark_sold()
assert sold2['success']
assert len(team_orion.members) == 2
print(f"Team Orion now has 2 members: {[m.name for m in team_orion.members]}")

# 4. Trading Round: Evaluate trade between candidate1 and candidate2
print(f"\n[Test 4] Evaluating player trade: {candidate1.name} (Nova) <-> {candidate2.name} (Orion)...")
trade_mgr = TradeManager(auction_manager)
eval_res = trade_mgr.evaluate_trade(
    team_a_id=team_nova.id,
    team_b_id=team_orion.id,
    player_a_id=candidate1.id,
    player_b_id=candidate2.id,
    credit_sweetener=0
)
print(f"Trade Evaluation Status: {eval_res['status']}")
print(f"Fairness Score: {eval_res['fairness_score']}% (Disparity: {eval_res['disparity']}c)")
print(f"Recommended Sweetener: {eval_res['recommended_sweetener']}c")
assert 'valid' in eval_res

# 5. Execute Trade
print("\n[Test 5] Executing trade...")
exec_res = trade_mgr.execute_trade(
    team_a_id=team_nova.id,
    team_b_id=team_orion.id,
    player_a_id=candidate1.id,
    player_b_id=candidate2.id,
    credit_sweetener=eval_res['recommended_sweetener']
)
assert exec_res['success']
print(f"Trade confirmed! Nova members: {[m.name for m in team_nova.members]}")
print(f"Trade confirmed! Orion members: {[m.name for m in team_orion.members]}")
assert any(m.id == candidate2.id for m in team_nova.members)
assert any(m.id == candidate1.id for m in team_orion.members)
print("Verified: Players successfully swapped between franchises!")

# 6. Database Persistence: Save snapshot & retrieve history
print("\n[Test 6] Testing SQLite database persistence...")
save_res = db_service.save_session_snapshot(
    session_id="test_session_1",
    session_name="Acceptance Test Tournament",
    auction_state=auction_manager.get_state().model_dump(),
    config={"team_size": 5, "starting_credits": 1000}
)
assert save_res['success']
sessions = db_service.list_sessions()
assert any(s['id'] == 'test_session_1' for s in sessions)
print(f"Verified: Session saved to SQLite and retrieved {len(sessions)} recorded session(s).")

# Verify trade log in DB
trades = db_service.get_trades()
assert len(trades) >= 1
print(f"Verified: Trade successfully logged in SQLite: {trades[0]['player_a_name']} <-> {trades[0]['player_b_name']}")

# 7. Dossier Generation & Cohort Intelligence
print("\n[Test 7] Testing Dossier Generation & Predictive Track Simulation...")
dossier = generate_session_dossier(auction_manager)
assert len(dossier['teams']) == 4
intel = run_cohort_intelligence(dossier)
assert 'institutional_radar' in intel
assert 'track_ratings' in intel
assert 'project_recommendations' in intel
assert 'roi_metrics' in intel
print(f"Institutional Average Capabilities: {intel['institutional_radar']}")
print(f"Simulated AI Track Competency Leader: {intel['track_ratings']['AI & Deep Learning'][0]['team_name']} ({intel['track_ratings']['AI & Deep Learning'][0]['competency']}%)")
print(f"Draft ROI Efficiency Leader: {intel['roi_metrics'][0]['team_name']} ({intel['roi_metrics'][0]['roi_ratio']} pts/100c)")

print("\n=== ALL PAIRIX v2.0 FEATURES VERIFIED WITH 100% SUCCESS! ===")

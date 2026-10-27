import urllib.request
import json
import time

BASE_URL = "http://127.0.0.1:8000/api"

def get(endpoint):
    req = urllib.request.urlopen(f"{BASE_URL}{endpoint}")
    return json.loads(req.read().decode('utf-8'))

def post(endpoint, data=None):
    payload = json.dumps(data).encode('utf-8') if data else None
    headers = {'Content-Type': 'application/json'} if data else {}
    req = urllib.request.Request(f"{BASE_URL}{endpoint}", data=payload, headers=headers, method="POST")
    res = urllib.request.urlopen(req)
    return json.loads(res.read().decode('utf-8'))

print("=== STARTING PAIRIX ACCEPTANCE TEST ===")

# 1. Reset Demo to initial state
print("\n[Step 1] Resetting demo state...")
res = post("/auction/reset")
assert res['success'] == True

# 2. Get initial auction state
print("\n[Step 2] Checking initial auction state...")
state = get("/auction/state")
assert state['is_active'] == True
assert len(state['teams']) == 4
candidate = state['current_student']
assert candidate is not None
print(f"Active student on block: {candidate['name']} ({candidate['preferred_role']}) - Base Price: {candidate['base_price']} credits")
nova_team = next(t for t in state['teams'] if t['name'] == 'Team Nova')
orion_team = next(t for t in state['teams'] if t['name'] == 'Team Orion')
print(f"Team Nova initial credits: {nova_team['credits_remaining']}, Initial Balance: {nova_team['balance_score']}")
print(f"Team Orion initial credits: {orion_team['credits_remaining']}, Initial Balance: {orion_team['balance_score']}")

# 3. View Team Fit
print("\n[Step 3] Fetching ML Team Fit for active student...")
fits = get("/auction/fits")
assert len(fits) == 4
nova_fit = next(f for f in fits if f['team_name'] == 'Team Nova')
orion_fit = next(f for f in fits if f['team_name'] == 'Team Orion')
print(f"Team Nova Fit: {nova_fit['fit_score']}%, delta balance: {nova_fit['delta_balance_score']}")
print(f"Team Orion Fit: {orion_fit['fit_score']}%, delta balance: {orion_fit['delta_balance_score']}")

# 4. Team Nova places 100-credit bid (or base price if higher)
bid_amt_1 = max(100, candidate['base_price'])
print(f"\n[Step 4] Team Nova placing {bid_amt_1} credit bid...")
bid_res1 = post("/auction/bid", {"team_id": nova_team['id'], "amount": bid_amt_1})
assert bid_res1['success'] == True
state = get("/auction/state")
assert state['current_bid'] == bid_amt_1
assert state['highest_bidder_team_name'] == 'Team Nova'
print(f"Verified: Highest bidder is now {state['highest_bidder_team_name']} with {state['current_bid']} credits.")

# 5. Team Orion places 120-credit counter-bid
bid_amt_2 = bid_amt_1 + 20
print(f"\n[Step 5] Team Orion placing {bid_amt_2} credit counter-bid...")
bid_res2 = post("/auction/bid", {"team_id": orion_team['id'], "amount": bid_amt_2})
assert bid_res2['success'] == True
state = get("/auction/state")
assert state['current_bid'] == bid_amt_2
assert state['highest_bidder_team_name'] == 'Team Orion'
print(f"Verified: Highest bidder is now {state['highest_bidder_team_name']} with {state['current_bid']} credits.")

# 6. End auction / Award student to highest bidder (Team Orion)
print(f"\n[Step 6] Ending bidding & awarding {candidate['name']} to Team Orion...")
sold_res = post("/auction/sold")
assert sold_res['success'] == True
assert sold_res['team_name'] == 'Team Orion'
print(f"Award response: {sold_res['message']}, new Orion balance: {sold_res['new_balance']} ({sold_res['delta_balance']})")

# 7. Verify Team Orion credits, members, and available pool
print("\n[Step 7] Verifying post-acquisition state...")
state = get("/auction/state")
updated_orion = next(t for t in state['teams'] if t['name'] == 'Team Orion')
expected_credits = 1000 - bid_amt_2
assert updated_orion['credits_remaining'] == expected_credits, f"Expected {expected_credits}, got {updated_orion['credits_remaining']}"
print(f"Verified: Team Orion credits deducted: {updated_orion['credits_remaining']} credits (was 1000, paid {bid_amt_2})")
assert len(updated_orion['members']) == 2
assert any(m['id'] == candidate['id'] for m in updated_orion['members'])
print(f"Verified: {candidate['name']} successfully joined Team Orion roster.")
assert not any(s['id'] == candidate['id'] for s in state['available_students'])
print(f"Verified: {candidate['name']} removed from available pool.")

# 8. Check updated Orion recommendations
print("\n[Step 8] Verifying that Team Orion recommendations dynamically updated...")
teams = get("/api/teams".replace("/api", ""))
updated_orion_full = next(t for t in teams if t['name'] == 'Team Orion')
assert 'recommendations' in updated_orion_full
recs = updated_orion_full['recommendations']
print(f"Orion new top recommendations ({len(recs)} candidates):")
for r in recs:
    print(f" - {r['student']['name']} ({r['student']['preferred_role']}): {r['fit_score']}% fit - {r['reasons']}")

# 9. Next student nomination
print("\n[Step 9] Verifying next student is on the block...")
next_student = state['current_student']
assert next_student is not None
assert next_student['id'] != candidate['id']
print(f"Next student on auction block: {next_student['name']} ({next_student['preferred_role']})")

# 10. Check Results Page API
print("\n[Step 10] Verifying Final Results analytics endpoint...")
results = get("/results")
assert results['total_teams'] == 4
assert results['total_credits_spent'] == bid_amt_2
print(f"Results API verified: {results['total_students_placed']} placed, {results['total_credits_spent']} credits spent.")

# 11. Test Reset Demo
print("\n[Step 11] Testing Reset Demo restores initial state...")
reset_res = post("/auction/reset")
assert reset_res['success'] == True
state_after_reset = get("/auction/state")
reset_orion = next(t for t in state_after_reset['teams'] if t['name'] == 'Team Orion')
assert reset_orion['credits_remaining'] == 1000
assert len(reset_orion['members']) == 1
print("Verified: Demo reset restored Team Orion credits to 1000 and roster to 1 member!")

print("\n=== ALL ACCEPTANCE TEST CONDITIONS PASSED WITH 100% SUCCESS! ===")

import time
import uuid
from typing import Dict, Any, List, Optional
from backend.models.schemas import Student, Team, BidActivity
from backend.ml.balance import calculate_team_radar, detect_skill_gaps, calculate_team_balance_score
from backend.services.database import db_service

def calculate_player_valuation(student: Student, acquired_price: Optional[int] = None) -> float:
    """
    Computes the Institutional Player Valuation Index (credits).
    Synthesizes:
    - Base Price (35%)
    - Market / Acquisition Price (35%)
    - 16-Dimensional Skill Composite + Experience Depth (30%)
    """
    base_p = float(student.base_price)
    acq_p = float(acquired_price if acquired_price is not None else base_p)
    
    # Skill composite from radar dimensions and experience
    radar_sum = sum(student.radar_dimensions.values()) if student.radar_dimensions else 3.0
    radar_mean = radar_sum / (len(student.radar_dimensions) if student.radar_dimensions else 6)
    
    # Experience booster (hackathons, communication, leadership)
    exp_boost = (
        (student.hackathons or 0) * 0.08 +
        (student.communication or 5) * 0.03 +
        (student.leadership or 5) * 0.03
    )
    
    skill_val = (radar_mean + exp_boost) * 120.0
    valuation = (0.35 * base_p) + (0.35 * acq_p) + (0.30 * skill_val)
    return round(valuation, 1)

class TradeManager:
    def __init__(self, auction_mgr):
        self.auction_mgr = auction_mgr

    def evaluate_trade(
        self,
        team_a_id: str,
        team_b_id: str,
        player_a_id: str,
        player_b_id: str,
        credit_sweetener: int = 0  # Credits given by Team B to Team A (or negative if Team A to Team B)
    ) -> Dict[str, Any]:
        """
        Strictly evaluates a proposed player exchange between two teams.
        Guarantees institutional fairness, prevents rookie-for-star collusion,
        and simulates projected balance impact.
        """
        team_a = next((t for t in self.auction_mgr.teams if t.id == team_a_id), None)
        team_b = next((t for t in self.auction_mgr.teams if t.id == team_b_id), None)

        if not team_a or not team_b:
            return {"valid": False, "reason": "Both teams must be valid."}

        if team_a.id == team_b.id:
            return {"valid": False, "reason": "Cannot trade within the same team."}

        # Check if players exist in rosters
        player_a = next((m for m in team_a.members if m.id == player_a_id), None)
        player_b = next((m for m in team_b.members if m.id == player_b_id), None)

        if not player_a or not player_b:
            return {"valid": False, "reason": "One or both selected players are not in the respective team rosters."}

        # Check leader immunity
        if team_a.leader and team_a.leader.id == player_a.id:
            return {"valid": False, "reason": f"Team Leader {player_a.name} cannot be traded (Franchise Anchor)."}

        if team_b.leader and team_b.leader.id == player_b.id:
            return {"valid": False, "reason": f"Team Leader {player_b.name} cannot be traded (Franchise Anchor)."}

        # Check credit sweetener affordability
        if credit_sweetener > 0:
            if team_b.credits_remaining < credit_sweetener:
                return {
                    "valid": False,
                    "reason": f"{team_b.name} does not have enough credits ({team_b.credits_remaining}c available) to offer {credit_sweetener}c sweetener."
                }
        elif credit_sweetener < 0:
            sweeter_from_a = abs(credit_sweetener)
            if team_a.credits_remaining < sweeter_from_a:
                return {
                    "valid": False,
                    "reason": f"{team_a.name} does not have enough credits ({team_a.credits_remaining}c available) to offer {sweeter_from_a}c sweetener."
                }

        # Find historical acquisition prices from activities if available
        acq_a = None
        acq_b = None
        for act in self.auction_mgr.activities:
            if act.activity_type == 'sold':
                if act.student_id == player_a.id:
                    acq_a = act.bid_amount
                elif act.student_id == player_b.id:
                    acq_b = act.bid_amount

        val_a = calculate_player_valuation(player_a, acq_a)
        val_b = calculate_player_valuation(player_b, acq_b)

        # Net effective exchange value
        # Team A gives player_a (val_a), receives player_b (val_b) + credit_sweetener
        net_a_received = val_b + credit_sweetener
        disparity = round(abs(val_a - net_a_received), 1)

        # Strict institutional constraint threshold
        # Max allowed disparity without compensation is 30 credits
        raw_gap = round(val_a - val_b, 1)
        recommended_sweetener = 0
        if raw_gap > 20:
            recommended_sweetener = int(round(raw_gap))
        elif raw_gap < -20:
            recommended_sweetener = int(round(raw_gap))

        # Fairness score calculation (0 - 100)
        fairness_score = max(5.0, min(100.0, round(100.0 - (disparity * 1.6), 1)))

        # Collusion / Unbalanced Veto Rule:
        # If disparity exceeds 40 credits despite sweetener, the trade is blocked
        is_fair = disparity <= 40.0
        trade_status = "Approved: Balanced Exchange"
        if not is_fair:
            trade_status = "VETOED: Excessive Value Disparity"
            reason = f"Trade rejected. {player_a.name} (Valuation: {val_a}c) vs {player_b.name} (Valuation: {val_b}c) creates a net disparity of {disparity}c. Recommended credit offset: {recommended_sweetener}c."
        elif credit_sweetener != 0:
            trade_status = "Approved with Credit Offset"
            reason = f"Trade justified. Credit sweetener of {abs(credit_sweetener)}c balances valuation disparity ({disparity}c residual)."
        else:
            reason = f"Fair player exchange. Valuations are well-matched within institutional variance ({disparity}c delta)."

        # What-If Simulation on Team Balance Scores
        # Team A: Swap player_a -> player_b
        sim_members_a = [m for m in team_a.members if m.id != player_a.id] + [player_b]
        sim_radar_a = calculate_team_radar([m.model_dump() for m in sim_members_a])
        sim_gaps_a = detect_skill_gaps(sim_radar_a)
        sim_balance_a = calculate_team_balance_score(sim_radar_a, len(sim_members_a))

        # Team B: Swap player_b -> player_a
        sim_members_b = [m for m in team_b.members if m.id != player_b.id] + [player_a]
        sim_radar_b = calculate_team_radar([m.model_dump() for m in sim_members_b])
        sim_gaps_b = detect_skill_gaps(sim_radar_b)
        sim_balance_b = calculate_team_balance_score(sim_radar_b, len(sim_members_b))

        return {
            "valid": is_fair,
            "status": trade_status,
            "reason": reason,
            "fairness_score": fairness_score,
            "disparity": disparity,
            "recommended_sweetener": recommended_sweetener,
            "player_a": {
                "id": player_a.id,
                "name": player_a.name,
                "role": player_a.preferred_role,
                "base_price": player_a.base_price,
                "valuation": val_a,
                "radar": player_a.radar_dimensions
            },
            "player_b": {
                "id": player_b.id,
                "name": player_b.name,
                "role": player_b.preferred_role,
                "base_price": player_b.base_price,
                "valuation": val_b,
                "radar": player_b.radar_dimensions
            },
            "team_a_impact": {
                "team_name": team_a.name,
                "current_balance": team_a.balance_score,
                "projected_balance": sim_balance_a,
                "delta_balance": round(sim_balance_a - team_a.balance_score, 1),
                "credits_before": team_a.credits_remaining,
                "credits_after": team_a.credits_remaining + credit_sweetener,
                "current_missing": team_a.missing_skills,
                "projected_missing": sim_gaps_a[2]
            },
            "team_b_impact": {
                "team_name": team_b.name,
                "current_balance": team_b.balance_score,
                "projected_balance": sim_balance_b,
                "delta_balance": round(sim_balance_b - team_b.balance_score, 1),
                "credits_before": team_b.credits_remaining,
                "credits_after": team_b.credits_remaining - credit_sweetener,
                "current_missing": team_b.missing_skills,
                "projected_missing": sim_gaps_b[2]
            }
        }

    def execute_trade(
        self,
        team_a_id: str,
        team_b_id: str,
        player_a_id: str,
        player_b_id: str,
        credit_sweetener: int = 0
    ) -> Dict[str, Any]:
        """
        Executes an approved player trade, updates rosters, balances, and credits,
        and records the audit log in SQLite.
        """
        eval_res = self.evaluate_trade(team_a_id, team_b_id, player_a_id, player_b_id, credit_sweetener)
        if not eval_res["valid"]:
            return {"success": False, "message": eval_res["reason"]}

        team_a = next(t for t in self.auction_mgr.teams if t.id == team_a_id)
        team_b = next(t for t in self.auction_mgr.teams if t.id == team_b_id)
        player_a = next(m for m in team_a.members if m.id == player_a_id)
        player_b = next(m for m in team_b.members if m.id == player_b_id)

        # 1. Swap players in rosters
        team_a.members = [m for m in team_a.members if m.id != player_a_id] + [player_b]
        team_b.members = [m for m in team_b.members if m.id != player_b_id] + [player_a]

        # 2. Adjust credits
        team_a.credits_remaining += credit_sweetener
        team_b.credits_remaining -= credit_sweetener

        # 3. Recalculate Team A radar & balance
        radar_a = calculate_team_radar([m.model_dump() for m in team_a.members])
        gaps_a = detect_skill_gaps(radar_a)
        bal_a = calculate_team_balance_score(radar_a, len(team_a.members))
        team_a.radar_vector = radar_a
        team_a.strengths = gaps_a[0]
        team_a.weaknesses = gaps_a[1]
        team_a.missing_skills = gaps_a[2]
        team_a.balance_score = bal_a

        # 4. Recalculate Team B radar & balance
        radar_b = calculate_team_radar([m.model_dump() for m in team_b.members])
        gaps_b = detect_skill_gaps(radar_b)
        bal_b = calculate_team_balance_score(radar_b, len(team_b.members))
        team_b.radar_vector = radar_b
        team_b.strengths = gaps_b[0]
        team_b.weaknesses = gaps_b[1]
        team_b.missing_skills = gaps_b[2]
        team_b.balance_score = bal_b

        # 5. Log Activity in live feed
        time_str = time.strftime("%H:%M:%S")
        trade_commentary = (
            f"TRADE EXECUTED: {team_a.name} exchanged {player_a.name} with {team_b.name} for {player_b.name}"
            + (f" (+{credit_sweetener}c adjustment)" if credit_sweetener != 0 else "")
            + f" [Fairness: {eval_res['fairness_score']}%]"
        )
        self.auction_mgr.activities.append(BidActivity(
            id=str(uuid.uuid4())[:8],
            timestamp=time_str,
            student_id=player_a.id,
            student_name=player_a.name,
            team_id=team_a.id,
            team_name=team_a.name,
            bid_amount=abs(credit_sweetener),
            activity_type="sold",
            commentary=trade_commentary
        ))

        # 6. Save to SQLite database
        db_service.log_trade({
            "session_id": "current_session",
            "team_a_id": team_a.id,
            "team_a_name": team_a.name,
            "team_b_id": team_b.id,
            "team_b_name": team_b.name,
            "player_a_id": player_a.id,
            "player_a_name": player_a.name,
            "player_b_id": player_b.id,
            "player_b_name": player_b.name,
            "credit_adj": credit_sweetener,
            "fairness_score": eval_res["fairness_score"],
            "justification": eval_res["reason"],
            "timestamp": time_str
        })

        return {
            "success": True,
            "message": trade_commentary,
            "evaluation": eval_res
        }

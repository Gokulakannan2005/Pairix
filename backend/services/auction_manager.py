import uuid
import time
from typing import List, Dict, Any, Optional
import numpy as np

from backend.models.schemas import Student, Team, BidActivity, AuctionState, TeamFitBreakdown
from backend.ml.balance import calculate_team_radar, detect_skill_gaps, calculate_team_balance_score
from backend.ml.team_fit import calculate_team_fit
from backend.ml.model import compatibility_nn
from backend.data.sample_dataset import SAMPLE_STUDENTS
from backend.services.dataset_parser import parse_dataset_bytes
import pandas as pd

TEAM_COLORS = [
    "#2563eb",  # Team Nova (Royal Blue)
    "#059669",  # Team Orion (Emerald Green)
    "#d97706",  # Team Vertex (Amber Gold)
    "#7c3aed",  # Team Pulse (Purple Violet)
    "#dc2626",  # Team Apex (Ruby Red)
    "#0891b2"   # Team Zenith (Teal)
]

class AuctionManager:
    def __init__(self):
        self.all_students: List[Student] = []
        self.teams: List[Team] = []
        self.available_students: List[Student] = []
        self.sold_students: List[Student] = []
        self.passed_students: List[Student] = []
        
        self.current_student: Optional[Student] = None
        self.current_bid: int = 0
        self.highest_bidder_id: Optional[str] = None
        self.highest_bidder_name: Optional[str] = None
        
        self.is_active: bool = False
        self.is_paused: bool = False
        self.timer_seconds: int = 25
        self.initial_timer_seconds: int = 25
        
        self.activities: List[BidActivity] = []
        self.load_sample_dataset()

    def load_sample_dataset(self):
        """Loads and processes the built-in 32 Indian student dataset."""
        df = pd.DataFrame(SAMPLE_STUDENTS)
        csv_bytes = df.to_csv(index=False).encode('utf-8')
        students, _ = parse_dataset_bytes(csv_bytes, "sample.csv")
        self.all_students = students
        self.reset_to_demo_state()

    def reset_to_demo_state(self):
        """Initializes a pristine 4-team demo setup ready for live demonstration."""
        if not self.all_students:
            return

        # Pick 4 diverse, strong franchise leaders
        # 1. Geralt Rivia (ML Lead) -> Team Nova
        # 2. Corvo Attano (Cloud/Backend Lead) -> Team Orion
        # 3. Ezio Auditore (Product/Management Lead) -> Team Vertex
        # 4. Kassandra Vex (Full-Stack Dev Lead) -> Team Pulse
        leader_indices = [0, 2, 9, 5]
        team_names = ["Team Nova", "Team Orion", "Team Vertex", "Team Pulse"]
        
        assigned_leader_ids = set()
        self.teams = []
        
        for i, idx in enumerate(leader_indices):
            if idx < len(self.all_students):
                leader = self.all_students[idx]
                assigned_leader_ids.add(leader.id)
                
                # Leader is also the first member
                members = [leader]
                radar = calculate_team_radar([m.model_dump() for m in members])
                strengths, weaknesses, missing = detect_skill_gaps(radar)
                bal_score = calculate_team_balance_score(radar, len(members))
                
                team = Team(
                    id=f"team_{i+1}",
                    name=team_names[i],
                    leader=leader,
                    members=members,
                    credits_remaining=1000,
                    credits_initial=1000,
                    max_members=5,
                    color_accent=TEAM_COLORS[i % len(TEAM_COLORS)],
                    radar_vector=radar,
                    balance_score=bal_score,
                    strengths=strengths,
                    weaknesses=weaknesses,
                    missing_skills=missing
                )
                self.teams.append(team)

        # Remaining students enter the auction pool
        self.available_students = [s for s in self.all_students if s.id not in assigned_leader_ids]
        self.sold_students = []
        self.passed_students = []
        self.activities = []
        
        self.is_active = True
        self.is_paused = False
        self.timer_seconds = self.initial_timer_seconds
        
        # Set first candidate
        if self.available_students:
            self._nominate_student(self.available_students[0])

    def configure_teams(self, num_teams: int, team_size: int, starting_credits: int, leader_ids: List[str]):
        """Custom configuration from Setup wizard."""
        self.teams = []
        assigned_leader_ids = set(leader_ids)
        team_names = ["Team Nova", "Team Orion", "Team Vertex", "Team Pulse", "Team Apex", "Team Zenith"]
        
        for i, lid in enumerate(leader_ids[:num_teams]):
            leader = next((s for s in self.all_students if s.id == lid), None)
            if not leader:
                continue
            
            members = [leader]
            radar = calculate_team_radar([m.model_dump() for m in members])
            strengths, weaknesses, missing = detect_skill_gaps(radar)
            bal_score = calculate_team_balance_score(radar, len(members))
            
            team = Team(
                id=f"team_{i+1}",
                name=team_names[i] if i < len(team_names) else f"Team {i+1}",
                leader=leader,
                members=members,
                credits_remaining=starting_credits,
                credits_initial=starting_credits,
                max_members=team_size,
                color_accent=TEAM_COLORS[i % len(TEAM_COLORS)],
                radar_vector=radar,
                balance_score=bal_score,
                strengths=strengths,
                weaknesses=weaknesses,
                missing_skills=missing
            )
            self.teams.append(team)
            
        self.available_students = [s for s in self.all_students if s.id not in assigned_leader_ids]
        self.sold_students = []
        self.passed_students = []
        self.activities = []
        self.is_active = True
        self.is_paused = False
        
        if self.available_students:
            self._nominate_student(self.available_students[0])

    def suggest_leaders(self, count: int = 4) -> List[Student]:
        """Suggests top leader candidates based on leadership, communication, and experience."""
        sorted_candidates = sorted(
            self.all_students,
            key=lambda s: (s.leadership * 1.5 + s.communication * 1.0 + (s.hackathons or 0) * 0.5),
            reverse=True
        )
        return sorted_candidates[:count]

    def _nominate_student(self, student: Student):
        self.current_student = student
        self.current_bid = student.base_price
        self.highest_bidder_id = None
        self.highest_bidder_name = None
        self.timer_seconds = self.initial_timer_seconds
        
        self.activities.append(BidActivity(
            id=str(uuid.uuid4())[:8],
            timestamp=time.strftime("%H:%M:%S"),
            student_id=student.id,
            student_name=student.name,
            team_id="",
            team_name="",
            bid_amount=student.base_price,
            activity_type="nominate",
            commentary=f"{student.name} entered auction pool at base price of {student.base_price} credits."
        ))

    def place_bid(self, team_id: str, amount: int) -> Dict[str, Any]:
        """Places a valid bid for a team."""
        if not self.is_active or not self.current_student:
            return {'success': False, 'message': 'No student is currently on the auction block.'}
            
        team = next((t for t in self.teams if t.id == team_id), None)
        if not team:
            return {'success': False, 'message': 'Invalid team.'}
            
        if len(team.members) >= team.max_members:
            return {'success': False, 'message': f"{team.name} has already reached maximum capacity of {team.max_members} members."}
            
        if amount > team.credits_remaining:
            return {'success': False, 'message': f"Insufficient credits! {team.name} has only {team.credits_remaining} credits."}
            
        # If no bids yet, minimum bid can equal the student's base price
        if self.highest_bidder_id is None:
            if amount < self.current_student.base_price:
                return {'success': False, 'message': f"Bid must be at least base price ({self.current_student.base_price} credits)."}
        else:
            if amount <= self.current_bid:
                return {'success': False, 'message': f"Bid must be strictly higher than current bid of {self.current_bid} credits."}
                
        # Accept bid
        self.current_bid = amount
        self.highest_bidder_id = team.id
        self.highest_bidder_name = team.name
        self.timer_seconds = min(self.initial_timer_seconds, 20)  # Reset timer on fresh bid
        
        self.activities.append(BidActivity(
            id=str(uuid.uuid4())[:8],
            timestamp=time.strftime("%H:%M:%S"),
            student_id=self.current_student.id,
            student_name=self.current_student.name,
            team_id=team.id,
            team_name=team.name,
            bid_amount=amount,
            activity_type="bid",
            commentary=f"{team.name} raised bid to {amount} credits."
        ))
        
        return {'success': True, 'message': f"Bid placed by {team.name} for {amount} credits."}

    def simulate_competing_bid(self) -> Dict[str, Any]:
        """
        Simulates an intelligent competing bid from one of the other teams.
        Considers team fit, remaining budget, and current bid.
        """
        if not self.is_active or not self.current_student:
            return {'success': False, 'message': 'No active student.'}
            
        eligible_teams = []
        for t in self.teams:
            if t.id == self.highest_bidder_id:
                continue
            if len(t.members) >= t.max_members:
                continue
            # Calculate team fit
            fit_info = calculate_team_fit(t.model_dump(), self.current_student.model_dump())
            next_min_bid = self.current_bid + 5 if self.highest_bidder_id else self.current_student.base_price
            
            # If team has budget and fit >= 55%
            if t.credits_remaining >= next_min_bid and next_min_bid <= fit_info['suggested_bid_max']:
                eligible_teams.append((t, fit_info, next_min_bid))
                
        if not eligible_teams:
            return {'success': False, 'message': 'No other team currently wishes to counter-bid.'}
            
        # Select team with highest fit score
        eligible_teams.sort(key=lambda x: x[1]['fit_score'], reverse=True)
        chosen_team, fit_info, bid_amount = eligible_teams[0]
        
        # Decide increment (+5, +10, or +15)
        if fit_info['fit_score'] >= 85 and chosen_team.credits_remaining >= bid_amount + 10:
            bid_amount += 10
            
        return self.place_bid(chosen_team.id, bid_amount)

    def mark_sold(self) -> Dict[str, Any]:
        """
        Awards the current student to the highest bidder, deducts credits,
        recalculates the team's radar and balance score, and nominates the next student.
        """
        if not self.current_student:
            return {'success': False, 'message': 'No student on the block.'}
            
        if not self.highest_bidder_id:
            # No bids placed -> Pass student
            return self.pass_student()
            
        team = next((t for t in self.teams if t.id == self.highest_bidder_id), None)
        sold_student = self.current_student
        winning_bid = self.current_bid
        
        # Deduct credits and append member
        team.credits_remaining -= winning_bid
        team.members.append(sold_student)
        
        # Recalculate team ML radar vector, skill gaps, and balance score
        member_dicts = [m.model_dump() for m in team.members]
        new_radar = calculate_team_radar(member_dicts)
        strengths, weaknesses, missing = detect_skill_gaps(new_radar)
        new_balance = calculate_team_balance_score(new_radar, len(team.members))
        
        delta_bal = round(new_balance - team.balance_score, 1)
        team.radar_vector = new_radar
        team.strengths = strengths
        team.weaknesses = weaknesses
        team.missing_skills = missing
        team.balance_score = new_balance
        
        # Update pools
        self.sold_students.append(sold_student)
        self.available_students = [s for s in self.available_students if s.id != sold_student.id]
        
        self.activities.append(BidActivity(
            id=str(uuid.uuid4())[:8],
            timestamp=time.strftime("%H:%M:%S"),
            student_id=sold_student.id,
            student_name=sold_student.name,
            team_id=team.id,
            team_name=team.name,
            bid_amount=winning_bid,
            activity_type="sold",
            commentary=f"SOLD! {sold_student.name} acquired by {team.name} for {winning_bid} credits (Balance: {team.balance_score} [{'+' if delta_bal >= 0 else ''}{delta_bal}])."
        ))
        
        # Nominate next available student
        if self.available_students:
            self._nominate_student(self.available_students[0])
        else:
            self.current_student = None
            self.is_active = False
            self.activities.append(BidActivity(
                id=str(uuid.uuid4())[:8],
                timestamp=time.strftime("%H:%M:%S"),
                student_id="",
                student_name="",
                team_id="",
                team_name="",
                bid_amount=0,
                activity_type="complete",
                commentary="AUCTION COMPLETE! All available candidates have been processed."
            ))
            
        return {
            'success': True,
            'message': f"{sold_student.name} joined {team.name} for {winning_bid} credits.",
            'team_name': team.name,
            'new_balance': new_balance,
            'delta_balance': delta_bal
        }

    def pass_student(self) -> Dict[str, Any]:
        """Passes the current student to end of queue or passes queue."""
        if not self.current_student:
            return {'success': False, 'message': 'No student on the block.'}
            
        passed = self.current_student
        self.passed_students.append(passed)
        self.available_students = [s for s in self.available_students if s.id != passed.id]
        
        self.activities.append(BidActivity(
            id=str(uuid.uuid4())[:8],
            timestamp=time.strftime("%H:%M:%S"),
            student_id=passed.id,
            student_name=passed.name,
            team_id="",
            team_name="",
            bid_amount=0,
            activity_type="pass",
            commentary=f"{passed.name} went unsold and passed."
        ))
        
        if self.available_students:
            self._nominate_student(self.available_students[0])
        else:
            self.current_student = None
            self.is_active = False
            
        return {'success': True, 'message': f"{passed.name} was passed."}

    def select_student_to_auction(self, student_id: str) -> Dict[str, Any]:
        """Allows choosing a specific student from the pool for immediate bidding."""
        candidate = next((s for s in self.available_students if s.id == student_id), None)
        if not candidate:
            return {'success': False, 'message': 'Student not in available auction pool.'}
        self._nominate_student(candidate)
        return {'success': True, 'message': f"{candidate.name} is now on the auction block."}

    def get_team_recommendations(self, team_id: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """
        Dynamically calculates and returns top recommended available students for a team,
        ranked by explainable Team Fit Score.
        """
        team = next((t for t in self.teams if t.id == team_id), None)
        if not team or not self.available_students:
            return []
            
        recs = []
        for s in self.available_students:
            fit_res = calculate_team_fit(team.model_dump(), s.model_dump())
            recs.append({
                'student': s,
                'fit_score': fit_res['fit_score'],
                'delta_balance_score': fit_res['delta_balance_score'],
                'badge': fit_res['badge'],
                'reasons': fit_res['pros'][:2],
                'breakdown': fit_res['breakdown'],
                'suggested_bid_min': fit_res['suggested_bid_min'],
                'suggested_bid_max': fit_res['suggested_bid_max']
            })
            
        recs.sort(key=lambda x: x['fit_score'], reverse=True)
        return recs[:top_k]

    def get_team_fits_for_current_student(self) -> List[TeamFitBreakdown]:
        """Computes Team Fit breakdown for all teams for the active student."""
        if not self.current_student:
            return []
            
        results = []
        for t in self.teams:
            fit_res = calculate_team_fit(t.model_dump(), self.current_student.model_dump())
            
            # Predict DL compatibility with PyTorch MLP
            t_vector = list(t.radar_vector.values()) + [0.5]*10
            s_vector = list(self.current_student.radar_dimensions.values()) + [0.5]*10
            neural_score = compatibility_nn.predict(t_vector, s_vector)
            
            results.append(TeamFitBreakdown(
                student_id=self.current_student.id,
                student_name=self.current_student.name,
                team_id=t.id,
                team_name=t.name,
                fit_score=fit_res['fit_score'],
                neural_compatibility=neural_score,
                delta_balance_score=fit_res['delta_balance_score'],
                breakdown=fit_res['breakdown'],
                pros=fit_res['pros'],
                cons=fit_res['cons'],
                suggested_bid_min=fit_res['suggested_bid_min'],
                suggested_bid_max=fit_res['suggested_bid_max'],
                badge=fit_res['badge']
            ))
            
        return results

    def get_state(self) -> AuctionState:
        return AuctionState(
            is_active=self.is_active,
            is_paused=self.is_paused,
            timer_seconds=self.timer_seconds,
            initial_timer_seconds=self.initial_timer_seconds,
            current_student=self.current_student,
            current_bid=self.current_bid,
            highest_bidder_team_id=self.highest_bidder_id,
            highest_bidder_team_name=self.highest_bidder_name,
            recent_activities=self.activities[-15:],
            teams=self.teams,
            available_students=self.available_students,
            sold_students_count=len(self.sold_students),
            total_students_count=len(self.all_students),
            status_message=f"{self.current_student.name} is on the block!" if self.current_student else "Auction concluded."
        )

auction_manager = AuctionManager()

from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field

class Student(BaseModel):
    id: str
    register_no: str
    name: str
    department: str
    preferred_role: str
    technical_skills: List[str] = []
    skill_levels: Dict[str, str] = {}  # e.g., {"Python": "Advanced", "React": "Intermediate"}
    interests: List[str] = []
    projects: List[str] = []
    achievements: List[str] = []
    certifications: List[str] = []
    hackathons: int = 0
    communication: float = 7.0  # 1-10
    leadership: float = 6.0     # 1-10
    cgpa: Optional[float] = None
    
    # ML Extracted features
    features: Optional[Dict[str, float]] = None
    radar_dimensions: Optional[Dict[str, float]] = None
    base_price: int = 100
    base_price_breakdown: Optional[Dict[str, int]] = None
    archetype: Optional[str] = None
    
class Team(BaseModel):
    id: str
    name: str
    leader: Student
    members: List[Student] = []
    credits_remaining: int = 1000
    credits_initial: int = 1000
    max_members: int = 5
    color_accent: str = "#2563eb" # Default blue
    
    # ML Computed
    radar_vector: Dict[str, float] = {}
    balance_score: float = 0.0
    strengths: List[str] = []
    weaknesses: List[str] = []
    missing_skills: List[str] = []

class BidActivity(BaseModel):
    id: str
    timestamp: str
    student_id: str
    student_name: str
    team_id: str
    team_name: str
    bid_amount: int
    activity_type: str  # "bid", "pass", "sold", "nominate"
    commentary: Optional[str] = None

class AuctionState(BaseModel):
    is_active: bool = False
    is_paused: bool = False
    timer_seconds: int = 25
    initial_timer_seconds: int = 25
    current_student: Optional[Student] = None
    current_bid: int = 0
    highest_bidder_team_id: Optional[str] = None
    highest_bidder_team_name: Optional[str] = None
    recent_activities: List[BidActivity] = []
    teams: List[Team] = []
    available_students: List[Student] = []
    sold_students_count: int = 0
    total_students_count: int = 0
    status_message: str = "Auction ready to start"

class TeamFitBreakdown(BaseModel):
    student_id: str
    student_name: str
    team_id: str
    team_name: str
    fit_score: float  # 0-100
    neural_compatibility: Optional[float] = None # DL score
    delta_balance_score: float  # e.g. +14
    breakdown: Dict[str, float] # "+18 fills UI/UX gap", "-4 redundant React"
    pros: List[str]
    cons: List[str]
    suggested_bid_min: int
    suggested_bid_max: int
    badge: Optional[str] = None # "Great Fit", "Fills Skill Gap", "Specialist", "Versatile"

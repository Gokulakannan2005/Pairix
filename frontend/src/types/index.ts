export interface Student {
  id: string;
  register_no: string;
  name: string;
  department: string;
  preferred_role: string;
  technical_skills: string[];
  skill_levels: Record<string, string>;
  interests: string[];
  projects: string[];
  achievements: string[];
  certifications: string[];
  hackathons: number;
  communication: number;
  leadership: number;
  cgpa?: number;
  features?: Record<string, number>;
  radar_dimensions?: Record<string, number>;
  base_price: number;
  base_price_breakdown?: Record<string, number>;
  archetype?: string;
}

export interface Team {
  id: string;
  name: string;
  leader: Student;
  members: Student[];
  credits_remaining: number;
  credits_initial: number;
  max_members: number;
  color_accent: string;
  radar_vector: Record<string, number>;
  balance_score: number;
  strengths: string[];
  weaknesses: string[];
  missing_skills: string[];
  recommendations?: Array<{
    student: Student;
    fit_score: number;
    delta_balance_score: number;
    badge: string;
    reasons: string[];
    breakdown: Record<string, string>;
    suggested_bid_min: number;
    suggested_bid_max: number;
  }>;
}

export interface BidActivity {
  id: string;
  timestamp: string;
  student_id: string;
  student_name: string;
  team_id: string;
  team_name: string;
  bid_amount: number;
  activity_type: 'bid' | 'pass' | 'sold' | 'nominate' | 'complete';
  commentary?: string;
}

export interface AuctionState {
  is_active: boolean;
  is_paused: boolean;
  timer_seconds: number;
  initial_timer_seconds: number;
  current_student: Student | null;
  current_bid: number;
  highest_bidder_team_id: string | null;
  highest_bidder_team_name: string | null;
  recent_activities: BidActivity[];
  teams: Team[];
  available_students: Student[];
  sold_students_count: number;
  total_students_count: number;
  status_message: string;
}

export interface TeamFitBreakdown {
  student_id: string;
  student_name: string;
  team_id: string;
  team_name: string;
  fit_score: number;
  neural_compatibility?: number;
  delta_balance_score: number;
  breakdown: Record<string, string>;
  pros: string[];
  cons: string[];
  suggested_bid_min: number;
  suggested_bid_max: number;
  badge?: string;
}

export interface MLInsights {
  feature_names: string[];
  radar_keys: string[];
  feature_matrix: Array<Record<string, any>>;
  similarity_matrix: {
    names: string[];
    ids: string[];
    matrix: number[][];
  };
  model_summary: {
    framework: string;
    model_type: string;
    input_dimensions: number;
    input_details: string;
    hidden_layers: Array<{
      layer: number;
      type: string;
      units: number;
      activation: string;
      regularization?: string;
    }>;
    optimizer: string;
    learning_rate: number;
    loss_function: string;
    epochs: number;
    final_train_loss: number;
    loss_history: Array<{ epoch: number; loss: number }>;
  };
  benchmark_target: number;
}

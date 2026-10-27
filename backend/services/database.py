import sqlite3
import json
import os
import time
from typing import List, Dict, Any, Optional

DB_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
DB_PATH = os.path.join(DB_DIR, "pairix.db")

class DatabaseService:
    def __init__(self, db_path: str = DB_PATH):
        self.db_path = db_path
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        self.init_db()

    def get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def init_db(self):
        """Initializes tables for draft sessions, rosters, trades, and snapshots."""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            # 1. Draft Sessions
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS draft_sessions (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    num_teams INTEGER NOT NULL,
                    team_size INTEGER NOT NULL,
                    starting_credits INTEGER NOT NULL,
                    status TEXT NOT NULL,
                    config_json TEXT
                )
            """)

            # 2. Team Rosters & Acquisition History
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS rosters (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT NOT NULL,
                    team_id TEXT NOT NULL,
                    student_id TEXT NOT NULL,
                    acquisition_type TEXT NOT NULL,
                    final_price INTEGER NOT NULL,
                    timestamp TEXT NOT NULL,
                    FOREIGN KEY (session_id) REFERENCES draft_sessions(id)
                )
            """)

            # 3. Trade Audit Log
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS trades (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT NOT NULL,
                    team_a_id TEXT NOT NULL,
                    team_a_name TEXT NOT NULL,
                    team_b_id TEXT NOT NULL,
                    team_b_name TEXT NOT NULL,
                    player_a_id TEXT NOT NULL,
                    player_a_name TEXT NOT NULL,
                    player_b_id TEXT NOT NULL,
                    player_b_name TEXT NOT NULL,
                    credit_adj INTEGER NOT NULL,
                    fairness_score REAL NOT NULL,
                    justification TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    FOREIGN KEY (session_id) REFERENCES draft_sessions(id)
                )
            """)

            # 4. Full Snapshot for quick state restoration & analytical export
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS snapshots (
                    session_id TEXT PRIMARY KEY,
                    snapshot_json TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    FOREIGN KEY (session_id) REFERENCES draft_sessions(id)
                )
            """)
            conn.commit()

    def save_session_snapshot(
        self,
        session_id: str,
        session_name: str,
        auction_state: Dict[str, Any],
        config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Saves or updates a draft session and its state snapshot."""
        now = time.strftime("%Y-%m-%d %H:%M:%S")
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO draft_sessions (id, name, created_at, updated_at, num_teams, team_size, starting_credits, status, config_json)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    name = excluded.name,
                    updated_at = excluded.updated_at,
                    num_teams = excluded.num_teams,
                    team_size = excluded.team_size,
                    starting_credits = excluded.starting_credits,
                    status = excluded.status,
                    config_json = excluded.config_json
            """, (
                session_id,
                session_name,
                now,
                now,
                len(auction_state.get('teams', [])),
                config.get('team_size', 5),
                config.get('starting_credits', 1000),
                "active" if auction_state.get('is_active') else "completed",
                json.dumps(config)
            ))

            cursor.execute("""
                INSERT INTO snapshots (session_id, snapshot_json, updated_at)
                VALUES (?, ?, ?)
                ON CONFLICT(session_id) DO UPDATE SET
                    snapshot_json = excluded.snapshot_json,
                    updated_at = excluded.updated_at
            """, (
                session_id,
                json.dumps(auction_state),
                now
            ))
            conn.commit()

        return {"success": True, "session_id": session_id, "saved_at": now}

    def list_sessions(self) -> List[Dict[str, Any]]:
        """Lists all draft sessions."""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, name, created_at, updated_at, num_teams, team_size, starting_credits, status
                FROM draft_sessions
                ORDER BY updated_at DESC
            """)
            rows = cursor.fetchall()
            return [dict(r) for r in rows]

    def get_session_snapshot(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves full snapshot JSON for a session."""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT snapshot_json FROM snapshots WHERE session_id = ?", (session_id,))
            row = cursor.fetchone()
            if row:
                return json.loads(row["snapshot_json"])
            return None

    def log_trade(self, trade_data: Dict[str, Any]) -> int:
        """Logs an approved player exchange in the database."""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO trades (
                    session_id, team_a_id, team_a_name, team_b_id, team_b_name,
                    player_a_id, player_a_name, player_b_id, player_b_name,
                    credit_adj, fairness_score, justification, timestamp
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                trade_data.get("session_id", "current"),
                trade_data["team_a_id"],
                trade_data["team_a_name"],
                trade_data["team_b_id"],
                trade_data["team_b_name"],
                trade_data["player_a_id"],
                trade_data["player_a_name"],
                trade_data["player_b_id"],
                trade_data["player_b_name"],
                trade_data.get("credit_adj", 0),
                trade_data.get("fairness_score", 100.0),
                trade_data.get("justification", ""),
                trade_data.get("timestamp", time.strftime("%H:%M:%S"))
            ))
            conn.commit()
            return cursor.lastrowid

    def get_trades(self, session_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Retrieves recorded trades."""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            if session_id:
                cursor.execute("""
                    SELECT * FROM trades WHERE session_id = ? ORDER BY id DESC
                """, (session_id,))
            else:
                cursor.execute("""
                    SELECT * FROM trades ORDER BY id DESC LIMIT 50
                """)
            rows = cursor.fetchall()
            return [dict(r) for r in rows]

db_service = DatabaseService()

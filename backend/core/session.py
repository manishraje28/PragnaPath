"""
PragnaPath - Session Manager
Manages learner sessions and state persistence.
"""

import uuid
import asyncio
from datetime import datetime
from typing import Dict, Optional, Callable, Awaitable
from .models import SessionState, LearnerProfile


# Type for the async persistence callback
ProfilePersistCallback = Callable[[str, LearnerProfile], Awaitable[bool]]


class SessionManager:
    """
    In-memory session manager with real-time persistence support.
    For production, replace with Redis or database.
    """
    
    def __init__(self):
        self._sessions: Dict[str, SessionState] = {}
        self._session_user_map: Dict[str, str] = {}  # session_id -> user_id mapping
        self._persist_callback: Optional[ProfilePersistCallback] = None
    
    def set_persist_callback(self, callback: ProfilePersistCallback) -> None:
        """
        Set a callback to be invoked whenever a profile is updated.
        This enables real-time persistence to MongoDB.
        """
        self._persist_callback = callback
    
    def _trigger_persist(self, session_id: str, profile: LearnerProfile) -> None:
        """Trigger async persistence in the background without blocking."""
        if self._persist_callback:
            user_id = self.get_user_id(session_id)
            if user_id:
                # Schedule the coroutine to run without awaiting
                asyncio.create_task(self._persist_callback(user_id, profile))
    
    def create_session(self, topic: Optional[str] = None, user_id: Optional[str] = None) -> SessionState:
        """Create a new learning session."""
        session_id = str(uuid.uuid4())[:8]  # Short ID for demo
        
        session = SessionState(
            session_id=session_id,
            current_topic=topic,
            current_phase="welcome",
            learner_profile=LearnerProfile()
        )
        
        self._sessions[session_id] = session
        
        # Track user_id mapping if provided
        if user_id:
            self._session_user_map[session_id] = user_id
        
        return session
    
    def get_user_id(self, session_id: str) -> Optional[str]:
        """Get the user_id associated with a session."""
        return self._session_user_map.get(session_id)
    
    def set_user_id(self, session_id: str, user_id: str) -> None:
        """Associate a user_id with a session."""
        self._session_user_map[session_id] = user_id
    
    def get_session(self, session_id: str) -> Optional[SessionState]:
        """Retrieve a session by ID."""
        return self._sessions.get(session_id)
    
    def update_session(self, session: SessionState) -> SessionState:
        """Update a session."""
        session.updated_at = datetime.now()
        session.total_interactions += 1
        self._sessions[session.session_id] = session
        return session
    
    def update_profile(self, session_id: str, profile: LearnerProfile) -> Optional[SessionState]:
        """Update the learner profile for a session and persist to MongoDB."""
        session = self.get_session(session_id)
        if session:
            old_style = session.learner_profile.learning_style
            session.learner_profile = profile
            
            # Track if adaptation occurred
            if old_style != profile.learning_style:
                session.record_adaptation()
            
            # Trigger real-time persistence (non-blocking)
            self._trigger_persist(session_id, profile)
            
            return self.update_session(session)
        return None
    
    def set_phase(self, session_id: str, phase: str) -> Optional[SessionState]:
        """Update the current phase."""
        session = self.get_session(session_id)
        if session:
            session.current_phase = phase
            return self.update_session(session)
        return None
    
    def set_topic(self, session_id: str, topic: str) -> Optional[SessionState]:
        """Set the current learning topic."""
        session = self.get_session(session_id)
        if session:
            session.current_topic = topic
            if topic not in session.learner_profile.topics_explored:
                session.learner_profile.topics_explored.append(topic)
            return self.update_session(session)
        return None
    
    def delete_session(self, session_id: str) -> bool:
        """Delete a session."""
        if session_id in self._sessions:
            del self._sessions[session_id]
            return True
        return False
    
    def get_all_sessions(self) -> Dict[str, SessionState]:
        """Get all active sessions (for debugging)."""
        return self._sessions.copy()
    
    def get_session_summary(self, session_id: str) -> Optional[Dict]:
        """Get a summary of the session for display."""
        session = self.get_session(session_id)
        if not session:
            return None
        
        return {
            "session_id": session.session_id,
            "current_topic": session.current_topic,
            "current_phase": session.current_phase,
            "profile": {
                "learning_style": session.learner_profile.learning_style.value,
                "pace": session.learner_profile.pace.value,
                "confidence": session.learner_profile.confidence.value,
                "depth_preference": session.learner_profile.depth_preference.value,
                "accuracy": f"{session.learner_profile.accuracy_rate():.0%}"
            },
            "stats": {
                "total_interactions": session.total_interactions,
                "adaptation_count": session.adaptation_count,
                "explanations_given": len(session.explanations_given)
            }
        }


# Global session manager instance
session_manager = SessionManager()

"""
🎛️ SUTRADHAR AGENT - The Orchestrator
=====================================
Meaning: "Narrator" or "One who holds the strings" (from Sanskrit theatre)

Purpose:
- Acts as the central coordinator for all agents
- Routes requests to appropriate agents
- Maintains session flow and context
- Makes decisions about which agent to invoke

Pattern: Sequential Router with Decision Logic
"""

import json
from typing import Any, Dict, Optional, List
from .base import BaseAgent
from ..core.models import SessionState, LearnerProfile, OrchestratorDecision


class SutradharAgent(BaseAgent):
    """
    The Orchestrator Agent - Central controller of PragnaPath.
    Like a Sutradhar in Indian classical theatre, this agent narrates 
    and controls the flow of the learning experience.
    """
    
    def __init__(self):
        super().__init__(
            name="Sutradhar",
            description="The Orchestrator - coordinates all agents and manages learning flow"
        )
        
        # Available agents for routing
        self.available_agents = [
            "pragnabodh",   # Cognitive diagnosis
            "gurukulguide", # Tutoring
            "vidyaforge",   # Content generation
            "sarvshiksha"   # Accessibility
        ]
    
    def _build_system_instruction(self) -> str:
        return """You are Sutradhar, the master orchestrator of PragnaPath - an adaptive learning system.

Your name comes from Indian classical theatre where the Sutradhar is the narrator who guides the audience through the performance.

YOUR ROLE:
- Coordinate between specialized agents (PragnaBodh, GurukulGuide, VidyaForge, SarvShiksha)
- Decide which agent should handle each request
- Maintain context continuity between agents
- Ensure smooth learning experience flow

AVAILABLE AGENTS:
1. PragnaBodh - Runs cognitive diagnostics, builds learner profiles
2. GurukulGuide - Provides adaptive explanations and tutoring
3. VidyaForge - Generates practice content (MCQs, flashcards)
4. SarvShiksha - Makes content accessible (dyslexia-friendly, screen-reader)

DECISION CRITERIA:
- New user or topic → Start with PragnaBodh diagnostic
- User needs explanation → Route to GurukulGuide
- User needs practice → Route to VidyaForge
- Accessibility needed → Route to SarvShiksha
- User struggling → Update profile via PragnaBodh, then re-explain via GurukulGuide

Always explain your routing decisions briefly for transparency."""
    
    async def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main orchestration logic.
        Analyzes context and decides next action.
        """
        session: SessionState = context.get("session")
        user_input: str = context.get("user_input", "")
        action: str = context.get("action", "auto")
        
        if action == "auto":
            # Intelligent routing based on context
            decision = await self._make_routing_decision(session, user_input)
        else:
            # Explicit action requested
            decision = self._create_explicit_decision(action, session, user_input)
        
        return {
            "decision": decision,
            "session": session,
            "sutradhar_message": self._generate_transition_message(decision)
        }
    
    async def _make_routing_decision(
        self,
        session: SessionState,
        user_input: str
    ) -> OrchestratorDecision:
        """Use Gemini to make intelligent routing decision."""
        
        prompt = f"""Analyze this learning session and decide the next action.

SESSION STATE:
- Phase: {session.current_phase}
- Topic: {session.current_topic or 'Not selected'}
- Interactions: {session.total_interactions}
- Adaptations made: {session.adaptation_count}

LEARNER PROFILE:
{session.learner_profile.to_context_string()}

USER INPUT: "{user_input}"

Based on this context, which agent should handle this request?
Respond with JSON:
{{
    "next_agent": "pragnabodh|gurukulguide|vidyaforge|sarvshiksha",
    "action": "specific action for the agent",
    "reasoning": "why this decision"
}}"""

        try:
            response = await self.generate_json(prompt)
            data = json.loads(response)
            return OrchestratorDecision(
                next_agent=data["next_agent"],
                action=data["action"],
                reasoning=data["reasoning"],
                context_passed={
                    "topic": session.current_topic,
                    "profile": session.learner_profile.model_dump(),
                    "user_input": user_input
                }
            )
        except Exception as e:
            # Fallback decision
            return self._fallback_decision(session, user_input)
    
    def _fallback_decision(
        self,
        session: SessionState,
        user_input: str
    ) -> OrchestratorDecision:
        """Rule-based fallback when AI routing fails."""
        
        # Decision tree based on session phase
        if session.current_phase == "welcome":
            return OrchestratorDecision(
                next_agent="pragnabodh",
                action="start_diagnostic",
                reasoning="New session - starting with cognitive diagnostic",
                context_passed={"topic": session.current_topic}
            )
        
        if session.current_phase == "diagnostic":
            return OrchestratorDecision(
                next_agent="pragnabodh",
                action="continue_diagnostic",
                reasoning="Continuing diagnostic to build learner profile",
                context_passed={"user_input": user_input}
            )
        
        if session.current_phase == "learning":
            # Check if user is struggling
            if session.learner_profile.accuracy_rate() < 0.5:
                return OrchestratorDecision(
                    next_agent="pragnabodh",
                    action="update_profile",
                    reasoning="Low accuracy detected - updating learner profile for adaptation",
                    context_passed={"trigger": "low_accuracy"}
                )
            return OrchestratorDecision(
                next_agent="gurukulguide",
                action="explain",
                reasoning="Providing explanation based on learner profile",
                context_passed={"topic": session.current_topic}
            )
        
        if session.current_phase == "practice":
            return OrchestratorDecision(
                next_agent="vidyaforge",
                action="generate_practice",
                reasoning="Generating practice content",
                context_passed={"topic": session.current_topic}
            )
        
        # Default to tutoring
        return OrchestratorDecision(
            next_agent="gurukulguide",
            action="explain",
            reasoning="Default routing to tutor agent",
            context_passed={"topic": session.current_topic}
        )
    
    def _create_explicit_decision(
        self,
        action: str,
        session: SessionState,
        user_input: str
    ) -> OrchestratorDecision:
        """Create decision from explicit action request."""
        
        action_routing = {
            "diagnose": ("pragnabodh", "start_diagnostic"),
            "explain": ("gurukulguide", "explain"),
            "practice": ("vidyaforge", "generate_practice"),
            "accessibility": ("sarvshiksha", "transform"),
            "adapt": ("pragnabodh", "update_profile"),
        }
        
        agent, agent_action = action_routing.get(
            action,
            ("gurukulguide", "explain")
        )
        
        return OrchestratorDecision(
            next_agent=agent,
            action=agent_action,
            reasoning=f"Explicit {action} action requested",
            context_passed={
                "topic": session.current_topic,
                "profile": session.learner_profile.model_dump(),
                "user_input": user_input
            }
        )
    
    def _generate_transition_message(self, decision: OrchestratorDecision) -> str:
        """Generate a user-friendly transition message."""
        
        messages = {
            "pragnabodh": {
                "start_diagnostic": "🧠 Let me understand how you learn best. Starting a quick diagnostic...",
                "update_profile": "🔄 I noticed you might prefer a different approach. Let me adjust...",
                "continue_diagnostic": "📝 Continuing to understand your learning style..."
            },
            "gurukulguide": {
                "explain": "🧑‍🏫 Let me explain this concept in a way that works for you...",
                "re_explain": "💡 Let me try explaining this differently..."
            },
            "vidyaforge": {
                "generate_practice": "🛠️ Creating practice questions tailored to your level..."
            },
            "sarvshiksha": {
                "transform": "♿ Making this content more accessible for you..."
            }
        }
        
        agent_messages = messages.get(decision.next_agent, {})
        return agent_messages.get(
            decision.action,
            f"📍 Routing to {decision.next_agent.title()}..."
        )
    
    async def get_session_summary(self, session: SessionState) -> str:
        """Generate a human-readable session summary."""
        
        prompt = f"""Generate a brief, encouraging summary of this learning session.

SESSION DATA:
- Topic: {session.current_topic}
- Phase: {session.current_phase}
- Total interactions: {session.total_interactions}
- Teaching adaptations: {session.adaptation_count}
- Learner accuracy: {session.learner_profile.accuracy_rate():.0%}
- Learning style: {session.learner_profile.learning_style.value}

Keep it under 100 words, warm and motivational."""
        
        return await self.generate(prompt, temperature=0.8)
    
    def determine_adaptation_trigger(
        self,
        session: SessionState,
        answer_correct: bool,
        time_taken: float
    ) -> bool:
        """
        Determine if teaching style should be adapted.
        This is THE key function for the "wow moment".
        """
        
        # Triggers for adaptation:
        # 1. Wrong answer on a concept already explained
        if not answer_correct and len(session.explanations_given) > 0:
            return True
        
        # 2. Very slow response (struggling)
        if time_taken > 60:  # More than 60 seconds
            return True
        
        # 3. Low confidence indicated
        if session.learner_profile.confidence.value == "low":
            return True
        
        # 4. Multiple wrong answers
        if session.learner_profile.total_answers >= 3:
            if session.learner_profile.accuracy_rate() < 0.4:
                return True
        
        return False

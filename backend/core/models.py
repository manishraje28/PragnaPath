"""
PragnaPath - Data Models
Pydantic models for learner profiles, session state, and agent outputs.
"""

from pydantic import BaseModel, Field
from typing import Optional, Literal, List, Dict, Any
from datetime import datetime
from enum import Enum


# ============================================
# ENUMS FOR LEARNER PROFILE
# ============================================

class LearningStyle(str, Enum):
    CONCEPTUAL = "conceptual"
    VISUAL = "visual"
    EXAM_FOCUSED = "exam-focused"


class LearnerPace(str, Enum):
    SLOW = "slow"
    MEDIUM = "medium"
    FAST = "fast"


class ConfidenceLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class DepthPreference(str, Enum):
    INTUITION_FIRST = "intuition-first"
    FORMULA_FIRST = "formula-first"


class LearningIntent(str, Enum):
    """Why the learner is studying this topic - affects teaching approach"""
    EXAM = "exam"              # Focus on keywords, definitions, exam patterns
    CONCEPTUAL = "conceptual"  # Focus on intuition, reasoning, analogies
    INTERVIEW = "interview"    # Focus on trade-offs, edge cases, real-world
    REVISION = "revision"      # Focus on concise summaries, quick refreshers


# ============================================
# LEARNER PROFILE - Core Cognitive Model
# ============================================

class LearnerProfile(BaseModel):
    """
    The cognitive profile built by PragnaBodh agent.
    This profile conditions ALL downstream agent behavior.
    """
    learning_style: LearningStyle = Field(
        default=LearningStyle.CONCEPTUAL,
        description="How the learner prefers to understand concepts"
    )
    pace: LearnerPace = Field(
        default=LearnerPace.MEDIUM,
        description="Learning speed preference"
    )
    confidence: ConfidenceLevel = Field(
        default=ConfidenceLevel.MEDIUM,
        description="Learner's confidence level in the subject"
    )
    depth_preference: DepthPreference = Field(
        default=DepthPreference.INTUITION_FIRST,
        description="Prefers intuitive explanations or formal definitions first"
    )
    learning_intent: LearningIntent = Field(
        default=LearningIntent.CONCEPTUAL,
        description="Why the learner is studying - exam, interview, deep understanding, or revision"
    )
    
    # Misconception tracking
    detected_misconceptions: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="List of detected misconceptions with severity"
    )
    
    # Style preference vote tracking (for accurate style detection)
    style_votes: Dict[str, int] = Field(
        default_factory=lambda: {"conceptual": 0, "visual": 0, "exam-focused": 0},
        description="Vote counts for each learning style from diagnostic answers"
    )
    depth_votes: Dict[str, int] = Field(
        default_factory=lambda: {"intuition-first": 0, "formula-first": 0},
        description="Vote counts for depth preference from diagnostic answers"
    )
    
    # Additional tracking
    topics_explored: List[str] = Field(default_factory=list)
    correct_answers: int = Field(default=0)
    total_answers: int = Field(default=0)
    avg_response_time_seconds: float = Field(default=0.0)
    
    def accuracy_rate(self) -> float:
        if self.total_answers == 0:
            return 0.0
        return self.correct_answers / self.total_answers
    
    def finalize_style_from_votes(self) -> None:
        """Determine final learning style and depth preference from accumulated votes."""
        # Finalize learning style
        if self.style_votes:
            max_style = max(self.style_votes, key=self.style_votes.get)
            if self.style_votes[max_style] > 0:
                self.learning_style = LearningStyle(max_style)
        
        # Finalize depth preference
        if self.depth_votes:
            max_depth = max(self.depth_votes, key=self.depth_votes.get)
            if self.depth_votes[max_depth] > 0:
                self.depth_preference = DepthPreference(max_depth)
    
    def add_style_vote(self, style: str, depth: str = None) -> None:
        """Add a vote for a learning style and optionally depth preference."""
        if style in self.style_votes:
            self.style_votes[style] += 1
        if depth and depth in self.depth_votes:
            self.depth_votes[depth] += 1
    
    def to_context_string(self) -> str:
        """Generate a context string for agent prompts."""
        intent_desc = {
            LearningIntent.EXAM: "preparing for exams - focus on definitions, keywords, patterns",
            LearningIntent.CONCEPTUAL: "deep understanding - focus on intuition, reasoning, analogies",
            LearningIntent.INTERVIEW: "interview preparation - focus on trade-offs, edge cases, real-world",
            LearningIntent.REVISION: "quick revision - focus on concise summaries"
        }
        
        confidence_tone = {
            ConfidenceLevel.LOW: "Use gentle, encouraging tone. Take smaller steps. Add reassurance.",
            ConfidenceLevel.MEDIUM: "Use balanced tone with moderate pacing.",
            ConfidenceLevel.HIGH: "Use direct tone. Can move faster. Add challenge questions."
        }
        
        # Detailed style instructions for content generation
        style_instructions = {
            LearningStyle.CONCEPTUAL: "prefers stories, analogies, and real-world examples. Connect new concepts to familiar situations.",
            LearningStyle.VISUAL: "VISUAL LEARNER - MUST include ASCII diagrams, flowcharts, tables, and visual representations. Use boxes, arrows, and spatial layouts. Create text-based diagrams they can visualize.",
            LearningStyle.EXAM_FOCUSED: "prefers formal definitions, key terms, exam patterns, and mnemonics. Focus on what examiners look for."
        }
        
        style_detail = style_instructions.get(self.learning_style, "")
        
        return f"""
LEARNER PROFILE:
- Learning Style: {self.learning_style.value} ({style_detail})
- Learning Intent: {self.learning_intent.value} ({intent_desc.get(self.learning_intent, '')})
- Pace: {self.pace.value}
- Confidence: {self.confidence.value}
- TONE INSTRUCTION: {confidence_tone.get(self.confidence, '')}
- Depth Preference: {self.depth_preference.value}
- Accuracy: {self.accuracy_rate():.0%}
- Topics Explored: {', '.join(self.topics_explored) if self.topics_explored else 'None yet'}
- Known Misconceptions: {len(self.detected_misconceptions)} detected
- Style Votes: {self.style_votes}
"""


# ============================================
# DIAGNOSTIC MODELS
# ============================================

class DiagnosticQuestion(BaseModel):
    """A single diagnostic question."""
    id: str
    question: str
    options: List[str]
    correct_answer: int  # Index of correct option
    difficulty: Literal["easy", "medium", "hard"]
    topic: str
    concept_tested: str


class DiagnosticAnswer(BaseModel):
    """User's answer to a diagnostic question."""
    question_id: str
    selected_answer: int
    time_taken_seconds: float
    confidence_rating: Optional[int] = Field(None, ge=1, le=5)  # 1-5 self-rating


class DiagnosticResult(BaseModel):
    """Result of a diagnostic session."""
    questions: List[DiagnosticQuestion]
    answers: List[DiagnosticAnswer]
    profile_update: LearnerProfile
    insights: str


# ============================================
# CONTENT MODELS (VidyaForge Output)
# ============================================

class MCQQuestion(BaseModel):
    """Multiple choice question generated by VidyaForge."""
    question: str
    options: List[str]
    correct_answer: int
    explanation: str
    difficulty: Literal["easy", "medium", "hard"]


class Flashcard(BaseModel):
    """Flashcard for quick revision."""
    front: str
    back: str
    topic: str


class GeneratedContent(BaseModel):
    """Complete content package from VidyaForge."""
    topic: str
    summary: str
    mcqs: List[MCQQuestion]
    flashcards: List[Flashcard]
    key_points: List[str]


# ============================================
# EXPLANATION MODELS (GurukulGuide Output)
# ============================================

class TeachingStyle(str, Enum):
    STORY_ANALOGY = "story-analogy"
    STEP_BY_STEP = "step-by-step"
    EXAM_SMART = "exam-smart"
    VISUAL_MENTAL = "visual-mental"


class Explanation(BaseModel):
    """An explanation from GurukulGuide."""
    topic: str
    style_used: TeachingStyle
    content: str
    indian_analogy: Optional[str] = None
    key_takeaways: List[str]
    follow_up_question: str
    profile_at_generation: LearnerProfile


# ============================================
# ACCESSIBILITY MODELS (SarvShiksha Output)
# ============================================

class AccessibleContent(BaseModel):
    """Accessibility-transformed content from SarvShiksha."""
    original_content: str
    dyslexia_friendly: str
    screen_reader_friendly: str
    simplified_version: str


# ============================================
# SESSION STATE
# ============================================

class SessionState(BaseModel):
    """
    Complete session state managed by Sutradhar.
    This is passed between agents and persisted.
    """
    session_id: str
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    
    # Current state
    current_topic: Optional[str] = None
    current_phase: Literal[
        "welcome", 
        "diagnostic", 
        "learning", 
        "practice", 
        "review"
    ] = "welcome"
    
    # Learner profile
    learner_profile: LearnerProfile = Field(default_factory=LearnerProfile)
    
    # History
    diagnostic_history: List[DiagnosticResult] = Field(default_factory=list)
    explanations_given: List[Explanation] = Field(default_factory=list)
    content_generated: List[GeneratedContent] = Field(default_factory=list)
    
    # Interaction tracking
    total_interactions: int = 0
    adaptation_count: int = 0  # Times the style was adapted
    
    def record_adaptation(self):
        """Record that teaching style was adapted."""
        self.adaptation_count += 1
        self.updated_at = datetime.now()


# ============================================
# API REQUEST/RESPONSE MODELS
# ============================================

class StartSessionRequest(BaseModel):
    """Request to start a new learning session."""
    topic: Optional[str] = None
    user_name: Optional[str] = None


class StartSessionResponse(BaseModel):
    """Response after starting a session."""
    session_id: str
    message: str
    next_step: str


class DiagnosticStartRequest(BaseModel):
    """Request to start diagnostic."""
    session_id: str
    topic: str


class AnswerRequest(BaseModel):
    """Submit an answer."""
    session_id: str
    question_id: str
    answer: int
    time_taken_seconds: float
    confidence: Optional[int] = None


class ExplainRequest(BaseModel):
    """Request an explanation."""
    session_id: str
    topic: str
    subtopic: Optional[str] = None


class GenerateContentRequest(BaseModel):
    """Request content generation."""
    session_id: str
    topic: str


class AccessibilityRequest(BaseModel):
    """Request accessibility transformation."""
    content: str
    mode: Literal["dyslexia", "screen-reader", "simplified", "all"] = "all"


# ============================================
# AGENT COMMUNICATION MODELS
# ============================================

class AgentMessage(BaseModel):
    """Message passed between agents via Sutradhar."""
    from_agent: str
    to_agent: str
    action: str
    payload: Dict[str, Any]
    timestamp: datetime = Field(default_factory=datetime.now)


class OrchestratorDecision(BaseModel):
    """Decision made by Sutradhar orchestrator."""
    next_agent: str
    action: str
    reasoning: str
    context_passed: Dict[str, Any]

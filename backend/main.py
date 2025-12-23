"""
PragnaPath - FastAPI Backend Server (Built with Google ADK)
============================================================
Main API server that exposes agent functionality to the frontend.
Uses Google ADK (Agent Development Kit) for multi-agent orchestration.
"""

import os
import time
from datetime import datetime
from typing import Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import agents and core modules - now using Google ADK
from agents import (
    SutradharAgent,
    PragnaBodhAgent,
    GurukulGuideAgent,
    VidyaForgeAgent,
    SarvShikshaAgent,
    create_runner,
    GEMINI_MODEL
)
from core.session import session_manager, SessionManager
from core.models import (
    LearnerProfile,
    DiagnosticQuestion,
    DiagnosticAnswer,
    LearningStyle,
    LearnerPace,
    ConfidenceLevel,
    DepthPreference,
    LearningIntent
)


# ============================================
# APP LIFECYCLE
# ============================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle management with Google ADK."""
    # Startup
    print("🚀 Starting PragnaPath Server with Google ADK...")
    print(f"🤖 Using model: {GEMINI_MODEL}")
    print("🧠 Initializing Google ADK agents...")
    
    # Initialize all agents (they now use Google ADK internally)
    app.state.pragnabodh = PragnaBodhAgent()
    app.state.gurukulguide = GurukulGuideAgent()
    app.state.vidyaforge = VidyaForgeAgent()
    app.state.sarvshiksha = SarvShikshaAgent()
    
    # Initialize Sutradhar (orchestrator) with sub-agents for ADK multi-agent
    app.state.sutradhar = SutradharAgent()
    app.state.sutradhar.set_sub_agents([
        app.state.pragnabodh.get_adk_agent(),
        app.state.gurukulguide.get_adk_agent(),
        app.state.vidyaforge.get_adk_agent(),
        app.state.sarvshiksha.get_adk_agent()
    ])
    
    # Create ADK runner for the orchestrator
    app.state.adk_runner = create_runner(app.state.sutradhar.get_adk_agent())
    
    print("✅ All Google ADK agents initialized!")
    print(f"📍 Server ready at http://localhost:{os.getenv('PORT', 8000)}")
    
    yield
    
    # Shutdown
    print("👋 Shutting down PragnaPath Server...")


# ============================================
# FASTAPI APP
# ============================================

app = FastAPI(
    title="PragnaPath API",
    description="Cognitive-Adaptive Multi-Agent Learning Companion - Built with Google ADK",
    version="1.0.0",
    lifespan=lifespan
)


# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================
# REQUEST/RESPONSE MODELS
# ============================================

class StartSessionRequest(BaseModel):
    topic: Optional[str] = None
    user_name: Optional[str] = None


class AnswerSubmission(BaseModel):
    session_id: str
    question_id: str
    selected_answer: int
    time_taken_seconds: float
    confidence_rating: Optional[int] = None


class ExplainRequest(BaseModel):
    session_id: str
    topic: str
    subtopic: Optional[str] = None


class ReExplainRequest(BaseModel):
    session_id: str
    topic: str
    trigger: str = "user_request"  # or "low_accuracy", "slow_response"


class GenerateContentRequest(BaseModel):
    session_id: str
    topic: str
    content_type: str = "all"  # all, mcqs, flashcards, summary


class AccessibilityRequest(BaseModel):
    content: str
    mode: str = "all"  # all, dyslexia, screen-reader, simplified


class UpdateProfileRequest(BaseModel):
    session_id: str
    learning_style: Optional[str] = None
    pace: Optional[str] = None
    confidence: Optional[str] = None
    depth_preference: Optional[str] = None


# ============================================
# HEALTH & INFO ENDPOINTS
# ============================================

@app.get("/")
async def root():
    """API root - system info."""
    return {
        "name": "PragnaPath API",
        "version": "1.0.0",
        "tagline": "The AI that learns how YOU learn",
        "framework": "Google ADK (Agent Development Kit)",
        "model": GEMINI_MODEL,
        "agents": [
            {"name": "Sutradhar", "role": "Orchestrator", "type": "LlmAgent"},
            {"name": "PragnaBodh", "role": "Cognitive Engine", "type": "LlmAgent"},
            {"name": "GurukulGuide", "role": "Adaptive Tutor", "type": "LlmAgent"},
            {"name": "VidyaForge", "role": "Content Generator", "type": "LlmAgent"},
            {"name": "SarvShiksha", "role": "Accessibility", "type": "LlmAgent"}
        ]
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "framework": "Google ADK",
        "model": GEMINI_MODEL
    }


@app.get("/api/adk-info")
async def adk_info():
    """Get Google ADK configuration info."""
    return {
        "framework": "Google ADK (Agent Development Kit)",
        "framework_url": "https://google.github.io/adk-docs/",
        "model": GEMINI_MODEL,
        "agents": {
            "sutradhar": app.state.sutradhar.get_agent_info(),
            "pragnabodh": app.state.pragnabodh.get_agent_info(),
            "gurukulguide": app.state.gurukulguide.get_agent_info(),
            "vidyaforge": app.state.vidyaforge.get_agent_info(),
            "sarvshiksha": app.state.sarvshiksha.get_agent_info()
        },
        "multi_agent": {
            "orchestrator": "Sutradhar",
            "sub_agents": ["PragnaBodh", "GurukulGuide", "VidyaForge", "SarvShiksha"]
        }
    }



# ============================================
# SESSION ENDPOINTS
# ============================================

@app.post("/api/session/start")
async def start_session(request: StartSessionRequest):
    """Start a new learning session."""
    session = session_manager.create_session(topic=request.topic)
    
    return {
        "session_id": session.session_id,
        "message": f"🙏 Namaste! Welcome to PragnaPath. I'm here to help you learn {request.topic or 'Computer Science'} in a way that works best for YOU.",
        "next_step": "diagnostic",
        "profile": session.learner_profile.model_dump()
    }


@app.get("/api/session/{session_id}")
async def get_session(session_id: str):
    """Get session details."""
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return session_manager.get_session_summary(session_id)


@app.get("/api/session/{session_id}/profile")
async def get_profile(session_id: str):
    """Get current learner profile."""
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {
        "profile": session.learner_profile.model_dump(),
        "context": session.learner_profile.to_context_string()
    }


# ============================================
# DIAGNOSTIC ENDPOINTS (PragnaBodh)
# ============================================

@app.post("/api/diagnostic/start")
async def start_diagnostic(request: dict):
    """Start diagnostic assessment."""
    session_id = request.get("session_id")
    topic = request.get("topic", "Operating Systems")
    
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Update session
    session_manager.set_topic(session_id, topic)
    session_manager.set_phase(session_id, "diagnostic")
    
    # Get diagnostic from PragnaBodh
    pragnabodh: PragnaBodhAgent = app.state.pragnabodh
    result = await pragnabodh.execute({
        "action": "start_diagnostic",
        "topic": topic
    })
    
    return {
        "message": result["message"],
        "questions": [q.model_dump() for q in result["questions"]],
        "topic": topic,
        "total_questions": len(result["questions"])
    }


@app.post("/api/diagnostic/answer")
async def submit_answer(submission: AnswerSubmission):
    """Submit an answer to a diagnostic question."""
    session = session_manager.get_session(submission.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Get the question from PragnaBodh's database
    pragnabodh: PragnaBodhAgent = app.state.pragnabodh
    questions_data = pragnabodh._get_diagnostic_questions({"topic": session.current_topic})
    
    # Find the specific question
    question = None
    for q in questions_data["questions"]:
        if q.id == submission.question_id:
            question = q
            break
    
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    # Process the answer
    answer = DiagnosticAnswer(
        question_id=submission.question_id,
        selected_answer=submission.selected_answer,
        time_taken_seconds=submission.time_taken_seconds,
        confidence_rating=submission.confidence_rating
    )
    
    result = await pragnabodh.execute({
        "action": "process_answer",
        "answer": answer,
        "question": question,
        "profile": session.learner_profile
    })
    
    # Update session profile
    session_manager.update_profile(submission.session_id, result["updated_profile"])
    
    return {
        "is_correct": result["is_correct"],
        "feedback": result["feedback"],
        "updated_profile": result["updated_profile"].model_dump()
    }


@app.post("/api/diagnostic/complete")
async def complete_diagnostic(request: dict):
    """Complete diagnostic and build final profile."""
    session_id = request.get("session_id")
    
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # IMPORTANT: Finalize learning style from accumulated votes
    session.learner_profile.finalize_style_from_votes()
    session_manager.update_profile(session_id, session.learner_profile)
    
    # Transition to learning phase
    session_manager.set_phase(session_id, "learning")
    
    pragnabodh: PragnaBodhAgent = app.state.pragnabodh
    
    # Generate insights about the profile
    insights = await pragnabodh.generate(
        f"""Generate 2-3 sentences of personalized insight for this learner:
{session.learner_profile.to_context_string()}

Be encouraging and explain how their learning experience will be personalized.
Specifically mention their detected learning style: {session.learner_profile.learning_style.value}
Keep it warm and concise.""",
        temperature=0.8
    )
    
    return {
        "message": "🎯 Diagnostic complete! I now understand how you learn best.",
        "insights": insights,
        "profile": session.learner_profile.model_dump(),
        "next_step": "learning"
    }


# ============================================
# TUTORING ENDPOINTS (GurukulGuide)
# ============================================

@app.post("/api/explain")
async def explain_topic(request: ExplainRequest):
    """Get an adaptive explanation of a topic."""
    session = session_manager.get_session(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    gurukulguide: GurukulGuideAgent = app.state.gurukulguide
    
    result = await gurukulguide.execute({
        "topic": request.topic,
        "subtopic": request.subtopic,
        "profile": session.learner_profile,
        "is_re_explanation": False
    })
    
    # Store explanation in session
    session.explanations_given.append(result["explanation"])
    session_manager.update_session(session)
    
    return {
        "explanation": result["explanation"].model_dump(),
        "style_used": result["style_used"].value,
        "indian_analogy": result.get("indian_analogy"),
        "profile_used": session.learner_profile.model_dump()
    }


@app.post("/api/re-explain")
async def re_explain_topic(request: ReExplainRequest):
    """
    RE-EXPLAIN with a different style.
    THIS IS THE KEY "WOW MOMENT" ENDPOINT!
    """
    session = session_manager.get_session(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Get previous style
    previous_style = None
    if session.explanations_given:
        previous_style = session.explanations_given[-1].style_used
    
    # First, update the profile based on the trigger
    pragnabodh: PragnaBodhAgent = app.state.pragnabodh
    profile_result = await pragnabodh.execute({
        "action": "update_profile",
        "profile": session.learner_profile,
        "trigger": request.trigger,
        "performance": {"trigger": request.trigger}
    })
    
    new_profile = profile_result["updated_profile"]
    session_manager.update_profile(request.session_id, new_profile)
    
    # Now get a NEW explanation with the UPDATED profile
    gurukulguide: GurukulGuideAgent = app.state.gurukulguide
    
    result = await gurukulguide.execute({
        "topic": request.topic,
        "subtopic": None,
        "profile": new_profile,
        "is_re_explanation": True,
        "previous_style": previous_style
    })
    
    # Record adaptation
    session = session_manager.get_session(request.session_id)
    session.record_adaptation()
    session.explanations_given.append(result["explanation"])
    session_manager.update_session(session)
    
    return {
        "message": profile_result.get("adaptation_message", "🔄 Let me try a different approach!"),
        "explanation": result["explanation"].model_dump(),
        "style_used": result["style_used"].value,
        "previous_style": previous_style.value if previous_style else None,
        "style_changed": result["style_used"] != previous_style if previous_style else True,
        "new_profile": new_profile.model_dump(),
        "adaptation_count": session.adaptation_count
    }


@app.post("/api/compare-explanations")
async def compare_explanations(request: dict):
    """
    DEMO ENDPOINT: Show same topic with two different teaching styles.
    This is the JUDGE DEMO endpoint!
    """
    session_id = request.get("session_id")
    topic = request.get("topic", "Operating Systems: Deadlock")
    
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    gurukulguide: GurukulGuideAgent = app.state.gurukulguide
    
    # Create two different profiles
    profile_conceptual = LearnerProfile(
        learning_style=LearningStyle.CONCEPTUAL,
        pace=LearnerPace.SLOW,
        confidence=ConfidenceLevel.LOW,
        depth_preference=DepthPreference.INTUITION_FIRST
    )
    
    profile_exam = LearnerProfile(
        learning_style=LearningStyle.EXAM_FOCUSED,
        pace=LearnerPace.FAST,
        confidence=ConfidenceLevel.HIGH,
        depth_preference=DepthPreference.FORMULA_FIRST
    )
    
    result = await gurukulguide.compare_explanations(
        topic=topic,
        profile_before=profile_conceptual,
        profile_after=profile_exam
    )
    
    return {
        "topic": topic,
        "comparison": result,
        "message": "👀 Notice how the SAME topic is explained COMPLETELY DIFFERENTLY based on the learner profile!"
    }


# ============================================
# CONTENT GENERATION ENDPOINTS (VidyaForge)
# ============================================

@app.post("/api/generate-content")
async def generate_content(request: GenerateContentRequest):
    """Generate practice content (MCQs, flashcards, summary)."""
    session = session_manager.get_session(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Transition to practice phase
    session_manager.set_phase(request.session_id, "practice")
    
    vidyaforge: VidyaForgeAgent = app.state.vidyaforge
    
    result = await vidyaforge.execute({
        "topic": request.topic,
        "profile": session.learner_profile,
        "content_type": request.content_type
    })
    
    if "content" in result:
        session.content_generated.append(result["content"])
        session_manager.update_session(session)
        
        return {
            "content": result["content"].model_dump(),
            "message": result.get("message", "Content generated!"),
            "profile_used": session.learner_profile.model_dump()
        }
    
    return result


@app.post("/api/generate-quiz")
async def generate_quiz(request: dict):
    """Generate an adaptive quiz."""
    session_id = request.get("session_id")
    topic = request.get("topic")
    previous_results = request.get("previous_results", [])
    
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    vidyaforge: VidyaForgeAgent = app.state.vidyaforge
    
    result = await vidyaforge.generate_adaptive_quiz(
        topic=topic,
        profile=session.learner_profile,
        previous_results=previous_results
    )
    
    return result


# ============================================
# ACCESSIBILITY ENDPOINTS (SarvShiksha)
# ============================================

@app.post("/api/accessibility/transform")
async def transform_accessibility(request: AccessibilityRequest):
    """Transform content for accessibility."""
    sarvshiksha: SarvShikshaAgent = app.state.sarvshiksha
    
    result = await sarvshiksha.execute({
        "content": request.content,
        "mode": request.mode
    })
    
    return result


@app.post("/api/accessibility/analyze")
async def analyze_accessibility(request: dict):
    """Analyze content for accessibility issues."""
    content = request.get("content", "")
    
    sarvshiksha: SarvShikshaAgent = app.state.sarvshiksha
    result = await sarvshiksha.analyze_accessibility(content)
    
    return result


# ============================================
# PROFILE MANAGEMENT
# ============================================

@app.post("/api/profile/update")
async def update_profile_manual(request: UpdateProfileRequest):
    """Manually update learner profile (for demo/testing)."""
    session = session_manager.get_session(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    profile = session.learner_profile
    
    if request.learning_style:
        profile.learning_style = LearningStyle(request.learning_style)
    if request.pace:
        profile.pace = LearnerPace(request.pace)
    if request.confidence:
        profile.confidence = ConfidenceLevel(request.confidence)
    if request.depth_preference:
        profile.depth_preference = DepthPreference(request.depth_preference)
    
    session_manager.update_profile(request.session_id, profile)
    session.record_adaptation()
    session_manager.update_session(session)
    
    return {
        "message": "Profile updated!",
        "profile": profile.model_dump()
    }


# ============================================
# ORCHESTRATION ENDPOINT (Sutradhar)
# ============================================

@app.post("/api/orchestrate")
async def orchestrate(request: dict):
    """
    Central orchestration endpoint.
    Sutradhar decides which agent to invoke.
    """
    session_id = request.get("session_id")
    user_input = request.get("user_input", "")
    action = request.get("action", "auto")
    
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    sutradhar: SutradharAgent = app.state.sutradhar
    
    result = await sutradhar.execute({
        "session": session,
        "user_input": user_input,
        "action": action
    })
    
    return {
        "decision": result["decision"].model_dump(),
        "message": result["sutradhar_message"],
        "session_phase": session.current_phase
    }


# ============================================
# DEMO ENDPOINTS
# ============================================

# New request models for enhanced features
class MCQSubmitRequest(BaseModel):
    session_id: str
    questionIndex: Optional[int] = None
    question_index: Optional[int] = None
    selectedAnswer: Optional[int] = None
    selected_answer: Optional[int] = None
    correctAnswer: Optional[int] = None
    correct_answer: Optional[int] = None
    isCorrect: Optional[bool] = None
    is_correct: Optional[bool] = None
    difficulty: str = "medium"
    
    @property
    def get_is_correct(self) -> bool:
        return self.isCorrect if self.isCorrect is not None else (self.is_correct if self.is_correct is not None else False)
    
    @property
    def get_difficulty(self) -> str:
        return self.difficulty or "medium"


class EvaluateExplanationRequest(BaseModel):
    session_id: str
    topic: str
    learner_explanation: str


class VisualizationRequest(BaseModel):
    session_id: str
    topic: str
    concept_key: Optional[str] = None


# New request models for advanced features
class SetLearningIntentRequest(BaseModel):
    session_id: str
    intent: str  # exam, conceptual, interview, revision


class WhyModeRequest(BaseModel):
    session_id: str
    topic: str


class CompareConceptsRequest(BaseModel):
    session_id: str
    topic: str
    compare_with: Optional[str] = None  # If None, AI suggests a comparison


class MisconceptionCheckRequest(BaseModel):
    session_id: str
    topic: str
    learner_input: str  # Their explanation or wrong answer
    input_type: str  # "explain_back" or "mcq_wrong"


# ============================================
# ENHANCED ENDPOINTS FOR IMPROVEMENTS
# ============================================

@app.post("/api/learning-intent")
async def set_learning_intent(request: SetLearningIntentRequest):
    """
    Set the learner's intent (why they are learning).
    This conditions all future explanations.
    """
    session = session_manager.get_session(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Map string to enum
    intent_map = {
        "exam": LearningIntent.EXAM,
        "conceptual": LearningIntent.CONCEPTUAL,
        "interview": LearningIntent.INTERVIEW,
        "revision": LearningIntent.REVISION
    }
    
    intent = intent_map.get(request.intent.lower(), LearningIntent.CONCEPTUAL)
    session.learner_profile.learning_intent = intent
    session_manager.update_profile(request.session_id, session.learner_profile)
    
    # Generate intent-specific welcome message
    intent_messages = {
        LearningIntent.EXAM: "📝 Got it! I'll focus on **key definitions, exam patterns, and must-know concepts** that frequently appear in tests.",
        LearningIntent.CONCEPTUAL: "🧠 Perfect! I'll emphasize **deep understanding, intuition, and real-world analogies** so you truly grasp the concepts.",
        LearningIntent.INTERVIEW: "💼 Understood! I'll highlight **trade-offs, edge cases, and practical applications** that interviewers love to ask about.",
        LearningIntent.REVISION: "⚡ Quick revision mode! I'll give you **concise summaries and key points** to refresh your memory efficiently."
    }
    
    return {
        "intent": intent.value,
        "message": intent_messages.get(intent, "Let's begin learning!"),
        "profile": session.learner_profile.model_dump()
    }


@app.post("/api/why-mode")
async def explain_why(request: WhyModeRequest):
    """
    WHY-DRIVEN EXPLANATION MODE
    Explains why a concept exists, what problem it solves, and why it matters.
    """
    session = session_manager.get_session(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    gurukulguide: GurukulGuideAgent = app.state.gurukulguide
    profile = session.learner_profile
    
    prompt = f"""The learner wants to understand WHY they should learn about "{request.topic}".

{profile.to_context_string()}

Generate a compelling "WHY" explanation that covers:
1. 🌍 **Why does this concept exist?** - What problem in computing/real-world led to its creation?
2. 🔧 **What problem does it solve?** - Concrete scenarios where this is essential
3. 💥 **What breaks without it?** - Real consequences of not having/understanding this
4. 🎯 **Why it matters for YOU** - Based on their intent ({profile.learning_intent.value}):
   - If exam: "This appears in X% of OS exams..."
   - If interview: "Google/Amazon frequently ask about..."
   - If conceptual: "Understanding this unlocks..."
   - If revision: "Key takeaway to remember..."

Keep it concise but impactful (5-7 bullet points or short paragraphs).
Use engaging language. Make them CARE about learning this."""

    response = await gurukulguide.generate(prompt, temperature=0.7)
    
    return {
        "topic": request.topic,
        "why_explanation": response,
        "intent_context": profile.learning_intent.value
    }


@app.post("/api/misconception-check")
async def check_misconceptions(request: MisconceptionCheckRequest):
    """
    MISCONCEPTION DETECTION ENGINE
    Analyzes learner input for common misconceptions.
    """
    session = session_manager.get_session(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    pragnabodh: PragnaBodhAgent = app.state.pragnabodh
    gurukulguide: GurukulGuideAgent = app.state.gurukulguide
    profile = session.learner_profile
    
    # Step 1: Detect misconception
    detection_prompt = f"""Analyze this learner's input about "{request.topic}" for common misconceptions.

LEARNER'S INPUT ({request.input_type}):
"{request.learner_input}"

COMMON MISCONCEPTIONS for {request.topic} that students often have:
- Confusing similar concepts (e.g., deadlock vs starvation, stack vs heap)
- Misunderstanding cause-effect relationships
- Oversimplifying complex processes
- Confusing terminology

Respond with JSON:
{{
    "has_misconception": true/false,
    "misconception": "Brief description of what they got wrong",
    "confused_with": "What they might be confusing it with",
    "severity": "low|medium|high",
    "correct_understanding": "What they should understand instead"
}}

If no clear misconception, set has_misconception to false."""

    try:
        detection_response = await pragnabodh.generate_json(detection_prompt)
        import json
        detection = json.loads(detection_response)
    except:
        detection = {"has_misconception": False}
    
    if not detection.get("has_misconception", False):
        return {
            "has_misconception": False,
            "message": None
        }
    
    # Step 2: Generate correction with empathetic tone
    confidence = profile.confidence
    tone_instruction = ""
    if confidence == ConfidenceLevel.LOW:
        tone_instruction = "Use a very gentle, encouraging tone. Start with what they got RIGHT, then gently correct."
    elif confidence == ConfidenceLevel.HIGH:
        tone_instruction = "Be direct but friendly. They can handle straightforward correction."
    else:
        tone_instruction = "Use a balanced, supportive tone."
    
    correction_prompt = f"""A learner has a misconception about {request.topic}.

MISCONCEPTION: {detection.get('misconception', '')}
THEY MIGHT BE CONFUSING IT WITH: {detection.get('confused_with', '')}
CORRECT UNDERSTANDING: {detection.get('correct_understanding', '')}

{tone_instruction}

Generate a helpful correction that:
1. Acknowledges this is a common confusion ("Many learners think X, but...")
2. Clearly explains the difference
3. Gives a memorable way to remember the correct concept
4. Ends with encouragement

Keep it concise (3-4 sentences)."""

    correction = await gurukulguide.generate(correction_prompt, temperature=0.7)
    
    # Store misconception in profile
    misconception_record = {
        "topic": request.topic,
        "misconception": detection.get("misconception"),
        "severity": detection.get("severity", "medium"),
        "detected_at": datetime.now().isoformat()
    }
    profile.detected_misconceptions.append(misconception_record)
    session_manager.update_profile(request.session_id, profile)
    
    return {
        "has_misconception": True,
        "misconception": detection.get("misconception"),
        "confused_with": detection.get("confused_with"),
        "severity": detection.get("severity"),
        "correction": correction,
        "tone_used": "gentle" if confidence == ConfidenceLevel.LOW else "direct" if confidence == ConfidenceLevel.HIGH else "balanced"
    }


@app.post("/api/compare-concepts")
async def compare_concepts(request: CompareConceptsRequest):
    """
    COMPARATIVE EXPLAINER
    Compares the current topic with a similar/confusing concept.
    """
    session = session_manager.get_session(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    gurukulguide: GurukulGuideAgent = app.state.gurukulguide
    profile = session.learner_profile
    
    # If no comparison topic provided, suggest one
    if not request.compare_with:
        suggest_prompt = f"""For the topic "{request.topic}", what is the most commonly confused similar concept?
        
Examples:
- Deadlock → Starvation
- BFS → DFS
- Stack → Heap  
- Process → Thread
- Mutex → Semaphore

Return ONLY the comparison topic name, nothing else."""
        
        request.compare_with = await gurukulguide.generate(suggest_prompt, temperature=0.3, max_tokens=50)
        request.compare_with = request.compare_with.strip().strip('"').strip("'")
    
    # Generate comparison
    comparison_prompt = f"""Create a clear comparison between "{request.topic}" and "{request.compare_with}".

{profile.to_context_string()}

Format as a structured comparison that highlights:
1. **Definition** - One-line definition of each
2. **Key Difference** - The MAIN thing that distinguishes them
3. **When to Use** - Scenarios where each applies
4. **Common Confusion** - Why students mix them up
5. **Memory Trick** - A memorable way to remember the difference

Based on their learning intent ({profile.learning_intent.value}):
- Exam: Focus on definition differences and exam-style distinctions
- Interview: Focus on trade-offs and when to use each
- Conceptual: Focus on underlying principles
- Revision: Keep it very concise

Use a table or bullet format for clarity."""

    comparison = await gurukulguide.generate(comparison_prompt, temperature=0.6)
    
    return {
        "topic": request.topic,
        "compared_with": request.compare_with,
        "comparison": comparison,
        "intent_context": profile.learning_intent.value
    }


@app.post("/api/mcq/submit")
async def submit_mcq_answer(request: MCQSubmitRequest):
    """
    Submit an MCQ answer and update learner profile based on performance.
    Implements rule-based + AI hybrid profile adaptation.
    """
    session = session_manager.get_session(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    profile = session.learner_profile
    old_profile = profile.model_copy()
    
    # Get values from either camelCase or snake_case
    is_correct = request.get_is_correct
    difficulty = request.get_difficulty
    
    # Update answer statistics
    profile.total_answers += 1
    if is_correct:
        profile.correct_answers += 1
    
    # Rule-based profile adjustments (HYBRID AI + LOGIC)
    profile_changed = False
    change_reasons = []
    
    # Rule 1: Incorrect answer on hard question → lower confidence
    if not is_correct and difficulty == "hard":
        if profile.confidence == ConfidenceLevel.HIGH:
            profile.confidence = ConfidenceLevel.MEDIUM
            profile_changed = True
            change_reasons.append("Hard question missed → confidence adjusted")
        elif profile.confidence == ConfidenceLevel.MEDIUM:
            profile.confidence = ConfidenceLevel.LOW
            profile_changed = True
            change_reasons.append("Hard question missed → confidence lowered")
    
    # Rule 2: Multiple incorrect answers → suggest step-by-step approach
    accuracy = profile.accuracy_rate()
    if accuracy < 0.5 and profile.total_answers >= 3:
        if profile.depth_preference != DepthPreference.INTUITION_FIRST:
            profile.depth_preference = DepthPreference.INTUITION_FIRST
            profile_changed = True
            change_reasons.append("Low accuracy → switching to intuition-first approach")
    
    # Rule 3: High accuracy → can handle faster pace
    if accuracy >= 0.8 and profile.total_answers >= 3:
        if profile.pace == LearnerPace.SLOW:
            profile.pace = LearnerPace.MEDIUM
            profile_changed = True
            change_reasons.append("High accuracy → pace increased")
        elif profile.confidence == ConfidenceLevel.LOW:
            profile.confidence = ConfidenceLevel.MEDIUM
            profile_changed = True
            change_reasons.append("High accuracy → confidence boosted")
    
    # Update session
    session_manager.update_profile(request.session_id, profile)
    if profile_changed:
        session.record_adaptation()
        session_manager.update_session(session)
    
    return {
        "is_correct": is_correct,
        "profile_updated": profile_changed,
        "updated_profile": profile.model_dump(),
        "previous_profile": old_profile.model_dump(),
        "change_reasons": change_reasons,
        "current_accuracy": accuracy
    }


@app.post("/api/evaluate-explanation")
async def evaluate_explanation(request: EvaluateExplanationRequest):
    """
    Evaluate a learner's explanation of a concept.
    PragnaBodh classifies understanding as correct/partial/incorrect.
    """
    session = session_manager.get_session(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    pragnabodh: PragnaBodhAgent = app.state.pragnabodh
    
    # Use AI to evaluate the explanation
    prompt = f"""You are a teacher evaluating if a student understands "{request.topic}".

THE STUDENT WROTE:
\"\"\"{request.learner_explanation}\"\"\"

FIRST, determine if the student actually tried to explain {request.topic}:
- If they wrote meta-comments like "I don't understand", "explain to me", "help", or requests instead of an explanation → mark as "not_attempted"
- If they wrote something completely unrelated to {request.topic} → mark as "off_topic"  
- If they actually tried to explain what {request.topic} is/means/does → evaluate their understanding

CLASSIFICATION:
- "not_attempted" - They didn't try to explain; they asked questions or made meta-comments
- "off_topic" - They wrote about something unrelated
- "incorrect" - They tried but fundamentally misunderstood the concept
- "partial" - They have some understanding but missed key parts
- "correct" - They explained the core concept accurately

FEEDBACK RULES:
- If "not_attempted": Encourage them to try explaining in their own words what {request.topic} means
- If "off_topic": Gently redirect them to explain {request.topic}
- If they attempted: Quote their SPECIFIC words and explain what's right/wrong

Return JSON:
{{
    "understanding": "correct|partial|incorrect|not_attempted|off_topic",
    "feedback": "Your personalized feedback - quote their words if they attempted",
    "suggestions": ["suggestion 1", "suggestion 2"]
}}"""

    try:
        response = await pragnabodh.generate_json(prompt)
        import json
        result = json.loads(response)
        
        # Validate that the result has required fields
        if "understanding" not in result or "feedback" not in result:
            raise ValueError("Invalid response format")
        
        # Map not_attempted and off_topic to "incorrect" for profile updates but keep original for display
        display_understanding = result["understanding"]
        profile_understanding = result["understanding"]
        if result["understanding"] in ["not_attempted", "off_topic"]:
            profile_understanding = "incorrect"  # For profile logic
            
    except Exception as e:
        print(f"Error evaluating explanation: {e}")
        # Fallback evaluation
        result = {
            "understanding": "not_attempted",
            "feedback": f"It looks like you haven't explained {request.topic} yet. Try describing in your own words: What is {request.topic}? How does it work? Give a simple example if you can!",
            "suggestions": [
                f"Start by defining what {request.topic} means",
                "Try giving a simple example from everyday life"
            ]
        }
        profile_understanding = "incorrect"
    
    # Rule-based profile update based on understanding
    # Use profile_understanding which maps not_attempted/off_topic to incorrect
    eval_understanding = profile_understanding if 'profile_understanding' in dir() else result["understanding"]
    if eval_understanding in ["not_attempted", "off_topic"]:
        eval_understanding = "incorrect"
    
    profile = session.learner_profile
    old_profile = profile.model_copy()
    profile_changed = False
    
    if eval_understanding == "incorrect":
        # Lower confidence if learner struggles to explain
        if profile.confidence == ConfidenceLevel.HIGH:
            profile.confidence = ConfidenceLevel.MEDIUM
            profile_changed = True
        elif profile.confidence == ConfidenceLevel.MEDIUM:
            profile.confidence = ConfidenceLevel.LOW
            profile_changed = True
        
        # Suggest more step-by-step approach
        if profile.depth_preference == DepthPreference.FORMULA_FIRST:
            profile.depth_preference = DepthPreference.INTUITION_FIRST
            profile_changed = True
    
    elif eval_understanding == "correct":
        # Boost confidence if learner explains well
        if profile.confidence == ConfidenceLevel.LOW:
            profile.confidence = ConfidenceLevel.MEDIUM
            profile_changed = True
        elif profile.confidence == ConfidenceLevel.MEDIUM:
            profile.confidence = ConfidenceLevel.HIGH
            profile_changed = True
    
    if profile_changed:
        session_manager.update_profile(request.session_id, profile)
        session.record_adaptation()
        session_manager.update_session(session)
    
    return {
        **result,
        "profile_updated": profile_changed,
        "updated_profile": profile.model_dump() if profile_changed else None,
        "previous_profile": old_profile.model_dump() if profile_changed else None
    }


@app.post("/api/visualize")
async def generate_visualization(request: VisualizationRequest):
    """
    Generate structured visualization data for a topic.
    Returns Mermaid-compatible diagram code.
    """
    session = session_manager.get_session(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    gurukulguide: GurukulGuideAgent = app.state.gurukulguide
    
    # Generate visualization instructions using AI
    prompt = f"""Generate a Mermaid diagram for the concept: "{request.topic}"

Create a clear, educational diagram. Choose the appropriate type:
- flowchart TD for processes/flows
- stateDiagram-v2 for state machines
- sequenceDiagram for interactions

Return ONLY valid Mermaid code, nothing else. Keep it simple and readable.
Maximum 10 nodes for clarity.

Example formats:
flowchart TD
    A[Start] --> B{{Decision}}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]

stateDiagram-v2
    [*] --> State1
    State1 --> State2: event
    State2 --> [*]"""

    try:
        response = await gurukulguide.generate(prompt, temperature=0.3)
        
        # Clean up the response
        mermaid_code = response.strip()
        
        # Remove markdown code blocks if present
        if mermaid_code.startswith("```"):
            lines = mermaid_code.split("\n")
            mermaid_code = "\n".join(lines[1:-1] if lines[-1] == "```" else lines[1:])
        
        return {
            "mermaid": mermaid_code,
            "topic": request.topic,
            "type": "mermaid"
        }
    except Exception as e:
        # Fallback with a simple diagram
        fallback = f"""flowchart TD
    A[{request.topic}] --> B[Key Concept 1]
    A --> C[Key Concept 2]
    B --> D[Detail 1]
    C --> E[Detail 2]"""
        
        return {
            "mermaid": fallback,
            "topic": request.topic,
            "type": "mermaid",
            "fallback": True
        }


@app.post("/api/accessibility/sign-language")
async def generate_sign_language_scripts(request: dict):
    """
    Generate sign-language-ready scripts.
    Outputs short, gesture-friendly phrases.
    """
    content = request.get("content", "")
    
    sarvshiksha: SarvShikshaAgent = app.state.sarvshiksha
    
    prompt = f"""Convert this educational content into sign-language-ready phrases.

CONTENT:
{content}

Requirements:
1. Break into short, gesture-friendly phrases (3-5 words each)
2. Use simple, concrete words
3. Avoid idioms and abstract language
4. Focus on the key concepts
5. Maximum 8-10 phrases

Return as JSON array:
["phrase 1", "phrase 2", "phrase 3", ...]"""

    try:
        response = await sarvshiksha.generate_json(prompt)
        import json
        phrases = json.loads(response)
        
        # Ensure it's a list
        if isinstance(phrases, dict) and "phrases" in phrases:
            phrases = phrases["phrases"]
        
        return {
            "sign_language_phrases": phrases,
            "original_length": len(content),
            "phrase_count": len(phrases),
            "ready_for_avatar": True
        }
    except:
        # Fallback: simple sentence splitting
        import re
        sentences = re.split(r'[.!?]+', content)
        phrases = [s.strip()[:50] for s in sentences if s.strip()][:8]
        
        return {
            "sign_language_phrases": phrases,
            "original_length": len(content),
            "phrase_count": len(phrases),
            "ready_for_avatar": True,
            "fallback": True
        }


@app.get("/api/demo/topics")
async def get_demo_topics():
    """Get available demo topics."""
    return {
        "topics": [
            {"id": "os_deadlock", "name": "Operating Systems: Deadlock", "icon": "🔒"},
            {"id": "os_scheduling", "name": "Process Scheduling", "icon": "📊"},
            {"id": "ds_trees", "name": "Data Structures: Trees", "icon": "🌳"},
            {"id": "ds_hashing", "name": "Hash Tables", "icon": "#️⃣"},
            {"id": "algo_dp", "name": "Dynamic Programming", "icon": "🧩"},
            {"id": "algo_sorting", "name": "Sorting Algorithms", "icon": "📈"}
        ]
    }


@app.post("/api/demo/full-flow")
async def demo_full_flow(request: dict):
    """
    DEMO: Run the complete PragnaPath flow for judges.
    Shows the full adaptation cycle.
    """
    topic = request.get("topic", "Operating Systems: Deadlock")
    
    # 1. Create session
    session = session_manager.create_session(topic=topic)
    session_id = session.session_id
    
    # 2. Set initial profile (conceptual learner)
    initial_profile = LearnerProfile(
        learning_style=LearningStyle.CONCEPTUAL,
        pace=LearnerPace.MEDIUM,
        confidence=ConfidenceLevel.MEDIUM,
        depth_preference=DepthPreference.INTUITION_FIRST
    )
    session_manager.update_profile(session_id, initial_profile)
    
    # 3. Get first explanation
    gurukulguide: GurukulGuideAgent = app.state.gurukulguide
    first_explanation = await gurukulguide.execute({
        "topic": topic,
        "profile": initial_profile,
        "is_re_explanation": False
    })
    
    # 4. Simulate struggle - update profile
    updated_profile = LearnerProfile(
        learning_style=LearningStyle.EXAM_FOCUSED,
        pace=LearnerPace.SLOW,
        confidence=ConfidenceLevel.LOW,
        depth_preference=DepthPreference.FORMULA_FIRST
    )
    session_manager.update_profile(session_id, updated_profile)
    
    # 5. Get adapted explanation
    second_explanation = await gurukulguide.execute({
        "topic": topic,
        "profile": updated_profile,
        "is_re_explanation": True,
        "previous_style": first_explanation["style_used"]
    })
    
    return {
        "session_id": session_id,
        "topic": topic,
        "flow": {
            "step1_initial_profile": initial_profile.model_dump(),
            "step2_first_explanation": {
                "style": first_explanation["style_used"].value,
                "content": first_explanation["explanation"].content[:500] + "..."
            },
            "step3_trigger": "User answered incorrectly, took long time",
            "step4_updated_profile": updated_profile.model_dump(),
            "step5_adapted_explanation": {
                "style": second_explanation["style_used"].value,
                "content": second_explanation["explanation"].content[:500] + "..."
            }
        },
        "wow_moment": first_explanation["style_used"] != second_explanation["style_used"],
        "message": "👀 Notice how the teaching style CHANGED based on learner performance!"
    }


# ============================================
# RUN SERVER
# ============================================

if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    debug = os.getenv("DEBUG", "true").lower() == "true"
    
    print(f"""
    ╔══════════════════════════════════════════════════════════════╗
    ║                                                              ║
    ║   🧠 PragnaPath - Cognitive-Adaptive Learning Companion      ║
    ║                                                              ║
    ║   "The AI that learns how YOU learn"                         ║
    ║                                                              ║
    ╚══════════════════════════════════════════════════════════════╝
    """)
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=debug
    )

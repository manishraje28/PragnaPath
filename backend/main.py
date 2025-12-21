"""
PragnaPath - FastAPI Backend Server
===================================
Main API server that exposes agent functionality to the frontend.
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

# Import agents and core modules
from agents import (
    SutradharAgent,
    PragnaBodhAgent,
    GurukulGuideAgent,
    VidyaForgeAgent,
    SarvShikshaAgent
)
from core.session import session_manager, SessionManager
from core.models import (
    LearnerProfile,
    DiagnosticQuestion,
    DiagnosticAnswer,
    LearningStyle,
    LearnerPace,
    ConfidenceLevel,
    DepthPreference
)


# ============================================
# APP LIFECYCLE
# ============================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle management."""
    # Startup
    print("🚀 Starting PragnaPath Server...")
    print("🧠 Initializing agents...")
    
    # Initialize agents
    app.state.sutradhar = SutradharAgent()
    app.state.pragnabodh = PragnaBodhAgent()
    app.state.gurukulguide = GurukulGuideAgent()
    app.state.vidyaforge = VidyaForgeAgent()
    app.state.sarvshiksha = SarvShikshaAgent()
    
    print("✅ All agents initialized!")
    print(f"📍 Server ready at http://localhost:{os.getenv('PORT', 8000)}")
    
    yield
    
    # Shutdown
    print("👋 Shutting down PragnaPath Server...")


# ============================================
# FASTAPI APP
# ============================================

app = FastAPI(
    title="PragnaPath API",
    description="Cognitive-Adaptive Multi-Agent Learning Companion",
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
        "agents": [
            {"name": "Sutradhar", "role": "Orchestrator"},
            {"name": "PragnaBodh", "role": "Cognitive Engine"},
            {"name": "GurukulGuide", "role": "Adaptive Tutor"},
            {"name": "VidyaForge", "role": "Content Generator"},
            {"name": "SarvShiksha", "role": "Accessibility"}
        ]
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


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
    
    # Transition to learning phase
    session_manager.set_phase(session_id, "learning")
    
    pragnabodh: PragnaBodhAgent = app.state.pragnabodh
    
    # Generate insights about the profile
    insights = await pragnabodh.generate(
        f"""Generate 2-3 sentences of personalized insight for this learner:
{session.learner_profile.to_context_string()}

Be encouraging and explain how their learning experience will be personalized.
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

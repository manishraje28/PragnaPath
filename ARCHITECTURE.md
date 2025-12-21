# 🏗️ PragnaPath - Architecture Documentation

## System Overview

PragnaPath is a **multi-agent cognitive-adaptive learning system** built using Google ADK (Agent Development Kit) and Gemini models. The system observes how learners think and dynamically adapts teaching strategies.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USER INTERFACE                                 │
│                    (React + Tailwind + Framer Motion)                   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         FASTAPI BACKEND                                  │
│                     (Session Management + API)                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    🎛️ SUTRADHAR (ORCHESTRATOR)                          │
│              Central Controller - Routes & Coordinates                   │
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐│
│  │ 🧠 PRAGNABODH│  │🧑‍🏫 GURUKUL   │  │ 🛠️ VIDYAFORGE│  │♿ SARVSHIKSHA ││
│  │   Cognitive  │  │   GUIDE     │  │   Content    │  │ Accessibility││
│  │   Engine     │  │   Tutor     │  │   Generator  │  │    Layer     ││
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    GOOGLE GEMINI API                                     │
│              (gemini-2.0-flash / gemini-1.5-pro)                        │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Agent Specifications

### 🎛️ Sutradhar Agent (Orchestrator)

**Etymology**: "Sutradhar" = Narrator in Indian classical theatre

**Responsibility**: 
- Central coordination of all agents
- Decision routing based on session state
- Context passing between agents
- Session flow management

**Pattern**: Sequential Router with Decision Logic

**Key Methods**:
```python
async def execute(context) -> OrchestratorDecision
    # Analyzes session state and decides next agent

def determine_adaptation_trigger(session, answer_correct, time_taken) -> bool
    # Decides when to trigger teaching style adaptation
```

---

### 🧠 PragnaBodh Agent (Cognitive Engine)

**Etymology**: "Pragna" (wisdom) + "Bodh" (understanding)

**Responsibility**:
- Run diagnostic assessments
- Build learner cognitive profiles
- Track correctness, timing, confidence
- Continuous profile refinement

**Pattern**: Loop/Refinement Agent

**Output Schema**:
```json
{
  "learning_style": "conceptual | visual | exam-focused",
  "pace": "slow | medium | fast",
  "confidence": "low | medium | high",
  "depth_preference": "intuition-first | formula-first"
}
```

---

### 🧑‍🏫 GurukulGuide Agent (Adaptive Tutor)

**Etymology**: Inspired by Indian "Gurukul" mentorship system

**Responsibility**:
- Generate profile-conditioned explanations
- Adapt teaching style based on learner needs
- Use Indian-context analogies
- **THE KEY "WOW MOMENT" AGENT**

**Teaching Styles**:
1. **STORY_ANALOGY**: Stories, real-world examples, Indian context
2. **STEP_BY_STEP**: Numbered steps, methodical breakdown
3. **EXAM_SMART**: Definitions, key terms, exam patterns
4. **VISUAL_MENTAL**: Diagrams described in text

**Critical Feature**:
Same concept explained DIFFERENTLY based on profile changes.

---

### 🛠️ VidyaForge Agent (Content Generator)

**Etymology**: "Vidya" (knowledge) + "Forge" (to craft)

**Responsibility**:
- Generate adaptive MCQs
- Create flashcards
- Produce summaries
- Difficulty calibration based on profile

**Output**:
- 5 MCQs (tagged by difficulty)
- 3 Flashcards
- 1 Concept summary
- Key points list

---

### ♿ SarvShiksha Agent (Accessibility)

**Etymology**: "Sarv" (all) + "Shiksha" (education) = Education for All

**Responsibility**:
- Dyslexia-friendly transformations
- Screen-reader optimized content
- Simplified plain language versions
- Accessibility analysis

**Transformations**:
- Short sentences (max 15 words)
- Simple vocabulary
- Clear structure markers
- No dense paragraphs

---

## Data Flow

### Core Learning Loop

```
1. User selects topic
        │
        ▼
2. Sutradhar → PragnaBodh: "Run diagnostic"
        │
        ▼
3. PragnaBodh builds initial profile
        │
        ▼
4. Sutradhar → GurukulGuide: "Explain with profile"
        │
        ▼
5. GurukulGuide generates Style A explanation
        │
        ▼
6. User struggles (wrong answer / slow response)
        │
        ▼
7. Sutradhar detects adaptation trigger
        │
        ▼
8. Sutradhar → PragnaBodh: "Update profile"
        │
        ▼
9. PragnaBodh updates profile (style change)
        │
        ▼
10. Sutradhar → GurukulGuide: "Re-explain with NEW profile"
        │
        ▼
11. GurukulGuide generates Style B explanation
        │
        ▼
    ✨ VISIBLE ADAPTATION - THE WOW MOMENT ✨
```

---

## Session State Model

```python
class SessionState:
    session_id: str
    current_topic: str
    current_phase: Literal["welcome", "diagnostic", "learning", "practice", "review"]
    
    learner_profile: LearnerProfile
    
    diagnostic_history: List[DiagnosticResult]
    explanations_given: List[Explanation]
    content_generated: List[GeneratedContent]
    
    total_interactions: int
    adaptation_count: int  # Times style was changed
```

---

## API Endpoints

### Session
- `POST /api/session/start` - Start new session
- `GET /api/session/{id}` - Get session state
- `GET /api/session/{id}/profile` - Get learner profile

### Diagnostic (PragnaBodh)
- `POST /api/diagnostic/start` - Start diagnostic
- `POST /api/diagnostic/answer` - Submit answer
- `POST /api/diagnostic/complete` - Complete and build profile

### Tutoring (GurukulGuide)
- `POST /api/explain` - Get explanation
- `POST /api/re-explain` - **Get adapted explanation (WOW MOMENT)**
- `POST /api/compare-explanations` - Side-by-side comparison

### Content (VidyaForge)
- `POST /api/generate-content` - Generate MCQs, flashcards
- `POST /api/generate-quiz` - Adaptive quiz

### Accessibility (SarvShiksha)
- `POST /api/accessibility/transform` - Transform content

### Demo
- `GET /api/demo/topics` - Available topics
- `POST /api/demo/full-flow` - **Complete demo for judges**

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| AI Models | Google Gemini Pro / Flash |
| Agent Framework | Google ADK |
| Backend | Python 3.10+ / FastAPI |
| Frontend | React 18 / Vite / Tailwind |
| State | In-memory (production: Redis) |
| API Protocol | REST + JSON |

---

## Design Principles

1. **Agent Specialization**: Each agent has ONE clear job
2. **Context Continuity**: Profile flows through all agents
3. **Visible Adaptation**: Changes must be obvious to users
4. **Cultural Relevance**: Indian themes are integral, not decorative
5. **Accessibility First**: Not an afterthought
6. **Stability**: Reliable and production-ready

---

## Key Differentiators

| Generic AI Tutor | PragnaPath |
|-----------------|------------|
| Single model | 5 coordinated agents |
| Static responses | Adaptive teaching |
| One explanation style | Multiple styles, runtime switching |
| No learner modeling | Cognitive profile building |
| Add-on accessibility | Built-in accessibility agent |

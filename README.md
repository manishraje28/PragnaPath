# 🧠 PragnaPath - Cognitive-Adaptive Multi-Agent Learning Companion

> *"The AI that learns how YOU learn"*

## 🎯 What is PragnaPath?

PragnaPath is an **Indian-themed, cognitive-adaptive, multi-agent AI learning companion** built with **Google ADK (Agent Development Kit)**. Unlike generic AI tutors, PragnaPath observes how a learner thinks and **dynamically changes how it teaches**.

## 🏗️ Architecture - Google ADK Multi-Agent System

PragnaPath uses **[Google ADK (Agent Development Kit)](https://google.github.io/adk-docs/)** to orchestrate 5 specialized `LlmAgent` instances:

```
┌─────────────────────────────────────────────────────────────────┐
│                    🎛️ SUTRADHAR (Orchestrator)                  │
│             Google ADK LlmAgent with sub_agents                  │
└─────────────────────────────────────────────────────────────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         ▼                     ▼                     ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ 🧠 PRAGNABODH   │  │ 🧑‍🏫 GURUKULGUIDE│  │ 🛠️ VIDYAFORGE   │
│ LlmAgent        │  │ LlmAgent        │  │ LlmAgent        │
│                 │  │                 │  │                 │
│ • Diagnostics   │  │ • Explanations  │  │ • MCQs          │
│ • Profile Build │  │ • Analogies     │  │ • Flashcards    │
│ • Adaptation    │  │ • Multi-style   │  │ • Summaries     │
└─────────────────┘  └─────────────────┘  └─────────────────┘
                               │
                               ▼
                    ┌─────────────────┐
                    │ ♿ SARVSHIKSHA   │
                    │ LlmAgent        │
                    │                 │
                    │ • Dyslexia-safe │
                    │ • Screen-reader │
                    └─────────────────┘
```

### Google ADK Features Used:
- **`LlmAgent`** - Each agent is a Google ADK LlmAgent with custom instructions
- **`sub_agents`** - Sutradhar orchestrates other agents via ADK's multi-agent system
- **`Runner`** - ADK Runner manages session state and agent execution
- **`InMemorySessionService`** - Session management for learning state

## 🌟 Key Differentiators

1. **Multi-Agent Orchestration** - Not a single chatbot, but coordinated AI agents
2. **Real-time Cognitive Adaptation** - Teaching style changes based on learner behavior
3. **Indian-Context Analogies** - Culturally relevant explanations
4. **Accessibility-First** - Inclusive design as core feature

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- Google Cloud API Key (Gemini access)

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Add your GOOGLE_API_KEY to .env
python main.py
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 📁 Project Structure

```
PragnaPath/
├── backend/
│   ├── agents/
│   │   ├── sutradhar.py      # Orchestrator
│   │   ├── pragnabodh.py     # Cognitive Engine
│   │   ├── gurukulguide.py   # Adaptive Tutor
│   │   ├── vidyaforge.py     # Content Generator
│   │   └── sarvshiksha.py    # Accessibility
│   ├── core/
│   │   ├── session.py        # Session management
│   │   └── models.py         # Data models
│   ├── main.py               # FastAPI server
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/       # UI components
│   │   ├── pages/            # App pages
│   │   └── App.jsx
│   └── package.json
└── README.md
```

## 🎤 Demo Flow (The "Wow" Moment)

1. **User selects**: "Operating Systems: Deadlock"
2. **PragnaBodh**: Runs 4-5 diagnostic questions
3. **Profile Built**: `{style: "conceptual", pace: "slow", confidence: "low"}`
4. **GurukulGuide**: Explains with analogies and stories
5. **User struggles**: Answers incorrectly or slowly
6. **Profile Updates**: `{style: "exam-focused", depth: "formula-first"}`
7. **GurukulGuide**: **Same topic, DIFFERENT explanation style!**
8. **Judge reaction**: *"Oh wow, it actually changes how it teaches!"*

## 🛠️ Tech Stack

- **AI Framework**: [Google ADK (Agent Development Kit)](https://google.github.io/adk-docs/)
- **AI Models**: Google Gemini 2.0 Flash
- **Backend**: Python + FastAPI
- **Frontend**: React + Tailwind CSS
- **State**: ADK InMemorySessionService (can be upgraded to persistent storage)

## 📦 Installation

```bash
# Install Google ADK
pip install google-adk
```

---

*"शिक्षा सबके लिए" - Education for All*

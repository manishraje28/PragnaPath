# 🎤 PragnaPath - Demo Script for Judges

## Pre-Demo Checklist
- [ ] Backend server running (`start-backend.bat`)
- [ ] Frontend running (`start-frontend.bat`)
- [ ] Browser open to `http://localhost:3000`
- [ ] API Key configured in `.env`

---

## 🎬 DEMO SCRIPT (5 minutes)

### Opening (30 seconds)

> "Welcome to PragnaPath - the AI that learns how YOU learn. 
> Unlike generic AI tutors, PragnaPath is built as a multi-agent system that observes how a learner thinks and dynamically adapts its teaching style.
> Let me show you the magic."

---

### Part 1: Quick Judge Demo (1 minute)

1. **Click "Judge Demo Mode"** on the welcome screen
2. **Select "Operating Systems: Deadlock"**
3. Watch the 5-step animation run
4. **Point out the key moment:**

> "Notice how the profile changed from 'conceptual learner' to 'exam-focused' - and look at the two explanations side by side. 
> Same topic, completely different teaching approach. The first uses stories and analogies, the second uses definitions and exam patterns."

---

### Part 2: Full Experience (2 minutes)

1. **Click "Start Learning"**
2. **Select a topic** (e.g., "Data Structures: Trees")
3. **Go through the diagnostic:**

> "PragnaBodh, our cognitive engine, is now running a short diagnostic. 
> These aren't just knowledge questions - some are designed to detect HOW you prefer to learn."

4. **Answer a few questions** (mix of correct and incorrect)
5. **Show the profile that was built:**

> "Based on my answers, the system has built a cognitive profile. 
> Notice it detected I'm a [conceptual/visual/exam-focused] learner with [pace] and [confidence level]."

6. **Click "I'm Struggling - Explain Differently"**

> "THIS is the wow moment. Watch what happens..."

7. **Show the adaptation alert and new explanation style**

---

### Part 3: Architecture Highlight (1 minute)

> "Let me explain what's happening under the hood. This isn't one chatbot - it's 5 specialized agents coordinating through Google ADK:

> 1. **Sutradhar** - The orchestrator, like a narrator in Indian theatre
> 2. **PragnaBodh** - Builds the cognitive profile  
> 3. **GurukulGuide** - Adapts explanations to your style
> 4. **VidyaForge** - Generates practice content
> 5. **SarvShiksha** - Makes content accessible

> Each agent has a specific role, and they pass context between each other."

---

### Part 4: Additional Features (30 seconds)

1. **Click "Generate Practice Content"**
> "VidyaForge creates MCQs, flashcards, and summaries calibrated to your level."

2. **Click "Get Accessible Version"**
> "SarvShiksha transforms content for learners with dyslexia or those using screen readers. Accessibility is built-in, not an afterthought."

---

### Closing (30 seconds)

> "PragnaPath demonstrates three key innovations:
> 1. **Multi-agent orchestration** using Google ADK - not just prompt chaining
> 2. **Real-time cognitive adaptation** - the AI learns the learner
> 3. **Indian-context design** - from naming to analogies
>
> The future of education isn't one-size-fits-all. It's AI that understands YOU."

---

## 🎯 Key Talking Points

### If asked "What makes this different from ChatGPT?"
> "ChatGPT is a single model responding to prompts. PragnaPath is an orchestrated system of specialized agents. 
> When you struggle, multiple agents collaborate - one updates your profile, another changes the teaching approach, 
> and they maintain context across the session. It's architecture, not just prompting."

### If asked "How does ADK come into play?"
> "ADK provides the agent abstraction layer. Each of our 5 agents is an ADK agent with defined roles, 
> system instructions, and execution patterns. Sutradhar uses ADK's routing patterns to decide which agent handles each request. 
> We use both sequential and parallel agent patterns depending on the task."

### If asked about the Indian theme
> "The names come from Sanskrit and Indian culture:
> - Sutradhar means 'narrator' from classical Indian theatre
> - Gurukul is the ancient one-on-one teaching system
> - Pragna means wisdom, Bodh means understanding
> - SarvShiksha is inspired by India's 'Education for All' initiative
> The analogies reference Indian daily life - trains, festivals, cricket, mythology."

---

## ⚠️ Troubleshooting

### API not responding
- Check that GOOGLE_API_KEY is set in `backend/.env`
- Ensure you have Gemini API access

### Frontend not loading
- Run `npm install` in the frontend folder
- Check that port 3000 is free

### Slow responses
- First requests may be slower due to model cold start
- Subsequent requests should be faster

---

## 📊 Technical Stats to Mention

- **5 specialized agents** with distinct responsibilities
- **3 teaching styles** (story-analogy, step-by-step, exam-smart)
- **Real-time profile updates** based on performance
- **Indian-context analogies** for CS concepts
- **Accessibility transformations** (dyslexia, screen-reader, simplified)
- Built with **Google Gemini + ADK** + FastAPI + React

---

*"शिक्षा सबके लिए" - Education for All*

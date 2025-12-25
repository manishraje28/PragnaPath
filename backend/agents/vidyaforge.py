"""
🛠️ VIDYAFORGE AGENT - Content Transformation Engine
====================================================
Meaning: "Vidya" (knowledge) + "Forge" (creation/crafting)

Purpose:
- Convert raw CS material into structured learning assets
- Generate adaptive MCQs, flashcards, and summaries
- Difficulty adjusted based on learner profile

Pattern: Parallel Content Generation
"""

import json
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from typing import Any, Dict, List
from agents.base import BaseAgent
from core.models import (
    LearnerProfile,
    GeneratedContent,
    MCQQuestion,
    Flashcard,
    ConfidenceLevel
)


class VidyaForgeAgent(BaseAgent):
    """
    The Content Transformation Engine - Creates learning assets.
    Named 'Vidya' (knowledge in Sanskrit) + 'Forge' (to craft/create).
    """
    
    def __init__(self):
        super().__init__(
            name="VidyaForge",
            description="Content Transformation Engine - creates practice materials"
        )
    
    def _build_system_instruction(self) -> str:
        return """You are VidyaForge, the Content Transformation Engine of PragnaPath.

Your name combines 'Vidya' (sacred knowledge in Sanskrit) with 'Forge' (to craft with skill).

YOUR ROLE:
- Transform CS concepts into practice-ready learning materials
- Generate MCQs at appropriate difficulty levels (ALWAYS generate the requested number)
- Create memorable flashcards
- Produce concise, effective summaries

CONTENT GENERATION PRINCIPLES:
1. DIFFICULTY CALIBRATION: Match the learner's level
   - Low confidence → Start with easier questions (more easy, fewer hard)
   - High confidence → Include challenging edge cases (more hard questions)
   
2. QUESTION QUALITY:
   - Generate EXACTLY the number of questions requested
   - Avoid trivial True/False conversions
   - Test understanding, not just recall
   - Include practical application questions
   - Make wrong options plausible but clearly incorrect
   
3. FLASHCARD EFFECTIVENESS:
   - One concept per card
   - Front: Clear question or prompt
   - Back: Concise answer with example
   - Cover different aspects of the topic
   
4. SUMMARY CLARITY:
   - Start with one-line definition
   - Key points only using dashes (-)
   - Include one memorable example
   - Be concise but complete

CRITICAL FORMATTING RULES:
- NEVER use markdown formatting like **bold** or *italic* or __underline__
- Use PLAIN TEXT only - no asterisks or underscores for emphasis
- Use CAPITAL LETTERS if you need to emphasize something
- Use dashes (-) or numbers (1. 2. 3.) for lists
- Keep all content clean and readable

Always maintain educational quality while being accessible."""
    
    async def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Generate learning content for a topic."""
        
        topic = context.get("topic", "")
        profile: LearnerProfile = context.get("profile", LearnerProfile())
        content_type = context.get("content_type", "all")
        source_material = context.get("source_material", "")
        
        if content_type == "all":
            return await self._generate_all_content(topic, profile, source_material)
        elif content_type == "mcqs":
            mcqs = await self._generate_mcqs(topic, profile, 5)
            return {"mcqs": mcqs}
        elif content_type == "flashcards":
            flashcards = await self._generate_flashcards(topic, profile, 3)
            return {"flashcards": flashcards}
        elif content_type == "summary":
            summary = await self._generate_summary(topic, profile)
            return {"summary": summary}
        else:
            return {"error": f"Unknown content type: {content_type}"}
    
    async def _generate_all_content(
        self,
        topic: str,
        profile: LearnerProfile,
        source_material: str = ""
    ) -> Dict[str, Any]:
        """Generate complete content package."""
        
        # Generate all content types
        # In production, these could run in parallel
        mcqs = await self._generate_mcqs(topic, profile, 5)
        flashcards = await self._generate_flashcards(topic, profile, 3)
        summary, key_points = await self._generate_summary(topic, profile)
        
        content = GeneratedContent(
            topic=topic,
            summary=summary,
            mcqs=mcqs,
            flashcards=flashcards,
            key_points=key_points
        )
        
        return {
            "content": content,
            "profile_used": profile,
            "message": f"📚 Generated {len(mcqs)} MCQs, {len(flashcards)} flashcards, and a summary for {topic}!"
        }
    
    async def _generate_mcqs(
        self,
        topic: str,
        profile: LearnerProfile,
        count: int = 5
    ) -> List[MCQQuestion]:
        """Generate adaptive MCQs."""
        
        # Determine difficulty distribution based on confidence
        if profile.confidence == ConfidenceLevel.LOW:
            difficulty_dist = "3 easy, 2 medium, 0 hard"
        elif profile.confidence == ConfidenceLevel.HIGH:
            difficulty_dist = "1 easy, 2 medium, 2 hard"
        else:
            difficulty_dist = "2 easy, 2 medium, 1 hard"
        
        prompt = f"""Generate EXACTLY {count} multiple-choice questions on: {topic}

LEARNER PROFILE:
- Confidence: {profile.confidence.value}
- Pace: {profile.pace.value}
- Style: {profile.learning_style.value}

DIFFICULTY DISTRIBUTION: {difficulty_dist}

REQUIREMENTS:
- Generate EXACTLY {count} questions - no more, no less
- Each question tests UNDERSTANDING, not just recall
- 4 options per question (labeled A, B, C, D in the options array)
- Include practical/application questions
- Make distractors (wrong options) plausible but clearly wrong
- Add brief, helpful explanations for correct answers
- Questions should cover different aspects of the topic
- NO markdown formatting (no ** or * or __)

Return as a JSON array with EXACTLY {count} questions:
[
  {{
    "question": "Clear question text without any markdown",
    "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
    "correct_answer": 0,
    "explanation": "Brief explanation of why this is correct (no markdown)",
    "difficulty": "easy"
  }},
  {{
    "question": "Second question...",
    "options": ["A", "B", "C", "D"],
    "correct_answer": 1,
    "explanation": "Explanation...",
    "difficulty": "medium"
  }}
]

IMPORTANT: Return ONLY the JSON array, no other text. Generate ALL {count} questions."""

        try:
            response = await self.generate_json(prompt)
            data = json.loads(response)
            
            # Handle both array and object responses
            if isinstance(data, dict) and "questions" in data:
                data = data["questions"]
            
            # Ensure we have the right number of questions
            if len(data) < count:
                # Generate more if we got fewer than expected
                additional = await self._generate_fallback_mcqs(topic, count - len(data))
                data.extend(additional)
            
            return [MCQQuestion(**q) for q in data[:count]]
        except Exception as e:
            # Return comprehensive fallback questions for the topic
            return self._get_fallback_mcqs(topic, count)
    
    def _get_fallback_mcqs(self, topic: str, count: int) -> List[MCQQuestion]:
        """Generate fallback MCQs when AI generation fails."""
        topic_lower = topic.lower()
        
        # Pre-built fallback questions for common CS topics
        fallback_bank = {
            "deadlock": [
                MCQQuestion(question="Which of the following is NOT a necessary condition for deadlock?", options=["Mutual Exclusion", "Hold and Wait", "Preemption", "Circular Wait"], correct_answer=2, explanation="Preemption prevents deadlock. The absence of preemption (No Preemption) is actually a required condition.", difficulty="medium"),
                MCQQuestion(question="What is the Banker's Algorithm used for?", options=["Memory allocation", "Deadlock avoidance", "Process scheduling", "Disk scheduling"], correct_answer=1, explanation="Banker's Algorithm is a deadlock avoidance algorithm that tests for safety before granting resource requests.", difficulty="medium"),
                MCQQuestion(question="In deadlock, what does 'Circular Wait' mean?", options=["Processes wait in a queue", "Each process waits for a resource held by the next process in a cycle", "CPU waits for I/O", "Resources wait for processes"], correct_answer=1, explanation="Circular Wait means P1 waits for P2, P2 waits for P3, and so on, with the last waiting for P1.", difficulty="easy"),
                MCQQuestion(question="Which method handles deadlock by terminating processes?", options=["Prevention", "Avoidance", "Detection and Recovery", "Ignorance"], correct_answer=2, explanation="Detection and Recovery allows deadlock to occur but then detects and resolves it by terminating processes.", difficulty="medium"),
                MCQQuestion(question="What is a safe state in deadlock avoidance?", options=["No processes are running", "All resources are free", "There exists at least one sequence in which all processes can complete", "CPU utilization is below 50%"], correct_answer=2, explanation="A safe state guarantees that there exists a sequence of process execution that can complete without deadlock.", difficulty="hard"),
            ],
            "process": [
                MCQQuestion(question="What is a process in an operating system?", options=["A file on disk", "A program in execution", "A CPU register", "A memory address"], correct_answer=1, explanation="A process is a program that is currently being executed, including its code, data, and state.", difficulty="easy"),
                MCQQuestion(question="Which process state indicates a process is waiting for I/O?", options=["Ready", "Running", "Blocked/Waiting", "Terminated"], correct_answer=2, explanation="A process enters the Blocked or Waiting state when it's waiting for an I/O operation or event to complete.", difficulty="easy"),
                MCQQuestion(question="What is the purpose of the Process Control Block (PCB)?", options=["Store user files", "Store process metadata and state", "Execute programs", "Manage memory"], correct_answer=1, explanation="PCB stores all information about a process including its state, registers, memory limits, and scheduling info.", difficulty="medium"),
                MCQQuestion(question="What triggers a context switch?", options=["Program compilation", "Interrupt or system call", "File creation", "Network connection"], correct_answer=1, explanation="Context switches occur due to interrupts, system calls, or when the scheduler decides to run another process.", difficulty="medium"),
                MCQQuestion(question="What is the difference between a process and a thread?", options=["Threads share memory, processes don't", "Processes are faster", "Threads run on different CPUs only", "There is no difference"], correct_answer=0, explanation="Threads within the same process share memory space, while processes have separate memory spaces.", difficulty="medium"),
            ],
            "scheduling": [
                MCQQuestion(question="Which scheduling algorithm can cause starvation?", options=["Round Robin", "First Come First Serve", "Shortest Job First", "All of the above"], correct_answer=2, explanation="Shortest Job First can cause starvation of longer processes if short processes keep arriving.", difficulty="medium"),
                MCQQuestion(question="What is the time quantum in Round Robin scheduling?", options=["Total CPU time", "Maximum process size", "Fixed time slice for each process", "I/O wait time"], correct_answer=2, explanation="Time quantum is the fixed time slice that each process gets before being preempted in Round Robin.", difficulty="easy"),
                MCQQuestion(question="Which metric measures how long a process waits in the ready queue?", options=["Turnaround time", "Waiting time", "Response time", "Burst time"], correct_answer=1, explanation="Waiting time is the total time a process spends waiting in the ready queue.", difficulty="easy"),
                MCQQuestion(question="What is preemptive scheduling?", options=["Process runs until completion", "Process can be interrupted and moved to ready queue", "Only one process runs", "No context switching"], correct_answer=1, explanation="Preemptive scheduling allows the OS to interrupt a running process and switch to another.", difficulty="medium"),
                MCQQuestion(question="Which scheduling minimizes average waiting time for a given set of processes?", options=["FCFS", "Round Robin", "Shortest Job First", "Priority Scheduling"], correct_answer=2, explanation="SJF (Shortest Job First) provably minimizes average waiting time for a known set of processes.", difficulty="hard"),
            ],
        }
        
        # Find matching questions
        for key, questions in fallback_bank.items():
            if key in topic_lower:
                return questions[:count]
        
        # Generic fallback
        return [
            MCQQuestion(question=f"What is the main purpose of {topic}?", options=["Resource management", "Process coordination", "Memory optimization", "All of the above"], correct_answer=3, explanation=f"This concept in {topic} serves multiple important purposes in computing.", difficulty="easy"),
            MCQQuestion(question=f"Which is a key characteristic of {topic}?", options=["Efficiency", "Scalability", "Reliability", "All are important characteristics"], correct_answer=3, explanation="All these characteristics are important for this concept.", difficulty="easy"),
            MCQQuestion(question=f"When would you use {topic}?", options=["Never", "In specific scenarios where it's applicable", "Always", "Only in theory"], correct_answer=1, explanation="This concept is applied in specific scenarios where its benefits are needed.", difficulty="medium"),
            MCQQuestion(question=f"What problem does {topic} solve?", options=["Performance issues", "Resource conflicts", "System coordination", "Depends on the context"], correct_answer=3, explanation="The specific problem solved depends on how and where this concept is applied.", difficulty="medium"),
            MCQQuestion(question=f"What is a limitation of {topic}?", options=["No limitations", "Overhead in certain cases", "Not applicable to modern systems", "Too simple to be useful"], correct_answer=1, explanation="Most concepts have trade-offs, often involving some overhead.", difficulty="medium"),
        ][:count]
    
    async def _generate_fallback_mcqs(self, topic: str, count: int) -> List[dict]:
        """Generate additional MCQs as dicts for when AI returns fewer than requested."""
        fallback = self._get_fallback_mcqs(topic, count)
        return [{"question": q.question, "options": q.options, "correct_answer": q.correct_answer, "explanation": q.explanation, "difficulty": q.difficulty} for q in fallback]
    
    async def _generate_flashcards(
        self,
        topic: str,
        profile: LearnerProfile,
        count: int = 3
    ) -> List[Flashcard]:
        """Generate flashcards for quick revision."""
        
        style_hint = ""
        if profile.learning_style.value == "conceptual":
            style_hint = "Include a real-world analogy on the back of each card."
        elif profile.learning_style.value == "exam-focused":
            style_hint = "Focus on definitions and key terms that appear in exams."
        else:
            style_hint = "Include visual/structural descriptions where helpful."
        
        prompt = f"""Generate EXACTLY {count} flashcards for: {topic}

LEARNER STYLE: {profile.learning_style.value}
STYLE HINT: {style_hint}

REQUIREMENTS:
- One key concept per card
- Front: Clear question or prompt (no markdown)
- Back: Concise answer with example (no markdown)
- Make them memorable and useful for revision
- Cover different aspects of the topic

CRITICAL: NO markdown formatting. Use plain text only. No ** or * or __ symbols.

Return as JSON array with EXACTLY {count} flashcards:
[
  {{
    "front": "Question or concept prompt (plain text)",
    "back": "Answer with brief example (plain text)",
    "topic": "{topic}"
  }}
]"""

        try:
            response = await self.generate_json(prompt)
            data = json.loads(response)
            
            if isinstance(data, dict) and "flashcards" in data:
                data = data["flashcards"]
            
            # Strip any markdown that slipped through
            from agents.base import strip_markdown
            flashcards = []
            for f in data[:count]:
                flashcards.append(Flashcard(
                    front=strip_markdown(f.get("front", "")),
                    back=strip_markdown(f.get("back", "")),
                    topic=f.get("topic", topic)
                ))
            return flashcards
        except Exception as e:
            return self._get_fallback_flashcards(topic, count)
    
    def _get_fallback_flashcards(self, topic: str, count: int) -> List[Flashcard]:
        """Get fallback flashcards when generation fails."""
        topic_lower = topic.lower()
        
        flashcard_bank = {
            "deadlock": [
                Flashcard(front="What are the 4 conditions required for deadlock?", back="1) Mutual Exclusion 2) Hold and Wait 3) No Preemption 4) Circular Wait. Remember: All 4 must be present simultaneously.", topic=topic),
                Flashcard(front="How does the Banker's Algorithm prevent deadlock?", back="It checks if granting a resource request will leave the system in a SAFE STATE (where all processes can eventually complete). If not, the request is denied.", topic=topic),
                Flashcard(front="What is Circular Wait in deadlock?", back="When Process P1 waits for P2, P2 waits for P3, and P3 waits for P1 - forming a cycle. Like people in a circle each waiting for the next person to move.", topic=topic),
            ],
            "process": [
                Flashcard(front="What is a Process Control Block (PCB)?", back="A data structure containing all info about a process: Process ID, state, registers, memory info, I/O status. Like an ID card for processes.", topic=topic),
                Flashcard(front="What are the 5 process states?", back="NEW (created), READY (waiting for CPU), RUNNING (executing), WAITING (blocked for I/O), TERMINATED (finished)", topic=topic),
                Flashcard(front="Process vs Thread - key difference?", back="Threads share the same memory space within a process. Processes have separate memory. Threads are lightweight; processes are heavyweight.", topic=topic),
            ],
            "scheduling": [
                Flashcard(front="What is CPU Scheduling?", back="The method by which the OS decides which process in the ready queue gets the CPU next. Goal: maximize CPU utilization and fairness.", topic=topic),
                Flashcard(front="Round Robin Scheduling - how it works?", back="Each process gets a fixed time slice (quantum). After quantum expires, process goes to back of queue. Fair but may have high context switch overhead.", topic=topic),
                Flashcard(front="SJF vs FCFS - which is better for waiting time?", back="SJF (Shortest Job First) gives minimum average waiting time. FCFS is simple but can cause convoy effect where short jobs wait behind long ones.", topic=topic),
            ],
        }
        
        for key, cards in flashcard_bank.items():
            if key in topic_lower:
                return cards[:count]
        
        return [
            Flashcard(front=f"What is {topic}?", back=f"A fundamental computing concept that manages resources and coordination in systems.", topic=topic),
            Flashcard(front=f"Why is {topic} important?", back=f"It solves critical problems in computing by providing efficient and organized solutions.", topic=topic),
            Flashcard(front=f"When to use {topic}?", back=f"Use it when you need to handle complex scenarios that require systematic management.", topic=topic),
        ][:count]
    
    async def _generate_summary(
        self,
        topic: str,
        profile: LearnerProfile
    ) -> tuple:
        """Generate a concise summary with key points."""
        
        length_guide = {
            "slow": "detailed (150-200 words)",
            "medium": "moderate (100-150 words)",
            "fast": "concise (75-100 words)"
        }
        
        prompt = f"""Generate a summary of: {topic}

LEARNER PACE: {profile.pace.value}
LENGTH: {length_guide.get(profile.pace.value, "moderate")}

REQUIREMENTS:
- Start with a one-line definition
- Cover the core concept clearly
- Include one practical example
- List 3-5 key points at the end

CRITICAL: Use PLAIN TEXT only. NO markdown formatting like ** or * or __.
Use dashes (-) for bullet points.

Format:
SUMMARY:
[Your summary here - plain text only]

KEY POINTS:
- Point 1
- Point 2
- Point 3"""

        try:
            response = await self.generate(prompt, temperature=0.6)
            from agents.base import strip_markdown
            
            # Parse summary and key points
            summary = response
            key_points = []
            
            if "KEY POINTS:" in response:
                parts = response.split("KEY POINTS:")
                summary = strip_markdown(parts[0].replace("SUMMARY:", "").strip())
                key_points = [
                    strip_markdown(line.strip().lstrip("- •").strip())
                    for line in parts[1].split("\n")
                    if line.strip() and (line.strip().startswith("-") or line.strip().startswith("•"))
                ]
            else:
                summary = strip_markdown(summary)
            
            return summary, key_points[:5]
        except Exception as e:
            return f"Summary of {topic}: A fundamental concept in computing that helps manage system resources efficiently.", [f"Key aspect of {topic}", "Important for system optimization", "Used in real-world applications"]
    
    async def generate_from_pdf_text(
        self,
        text: str,
        profile: LearnerProfile
    ) -> Dict[str, Any]:
        """Generate content from extracted PDF text."""
        
        # First, identify the topic from the text
        topic_prompt = f"""Identify the main CS topic from this text (one or two words):
        
{text[:1000]}

Respond with just the topic name."""

        topic = await self.generate(topic_prompt, temperature=0.3, max_tokens=50)
        topic = topic.strip()
        
        # Generate content with the extracted topic
        return await self._generate_all_content(
            topic=topic,
            profile=profile,
            source_material=text
        )
    
    async def generate_adaptive_quiz(
        self,
        topic: str,
        profile: LearnerProfile,
        previous_results: List[Dict] = None
    ) -> Dict[str, Any]:
        """Generate an adaptive quiz that adjusts based on previous performance."""
        
        # Analyze previous results to adjust difficulty
        if previous_results:
            correct_count = sum(1 for r in previous_results if r.get("correct", False))
            accuracy = correct_count / len(previous_results) if previous_results else 0.5
            
            if accuracy >= 0.8:
                difficulty_focus = "medium and hard"
                message = "Great job! Let's increase the challenge. 💪"
            elif accuracy <= 0.4:
                difficulty_focus = "easy and medium"
                message = "Let's reinforce the basics first. 📚"
            else:
                difficulty_focus = "balanced mix"
                message = "Good progress! Here's a balanced set. ⚖️"
        else:
            difficulty_focus = "start with easy, then medium"
            message = "Let's see where you stand! 🎯"
        
        prompt = f"""Generate 5 quiz questions on: {topic}

DIFFICULTY FOCUS: {difficulty_focus}
LEARNER STYLE: {profile.learning_style.value}

Make questions progressively challenging.

Return as JSON:
{{
  "quiz_title": "Quiz title",
  "questions": [
    {{
      "question": "...",
      "options": ["A", "B", "C", "D"],
      "correct_answer": 0,
      "explanation": "...",
      "difficulty": "easy|medium|hard",
      "points": 10
    }}
  ]
}}"""

        try:
            response = await self.generate_json(prompt)
            data = json.loads(response)
            
            return {
                "quiz": data,
                "message": message,
                "total_points": sum(q.get("points", 10) for q in data.get("questions", []))
            }
        except Exception as e:
            return {"error": str(e)}

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
- Generate MCQs at appropriate difficulty levels
- Create memorable flashcards
- Produce concise, effective summaries

CONTENT GENERATION PRINCIPLES:
1. DIFFICULTY CALIBRATION: Match the learner's level
   - Low confidence → Start with easier questions
   - High confidence → Include challenging edge cases
   
2. QUESTION QUALITY:
   - Avoid trivial True/False conversions
   - Test understanding, not just recall
   - Include practical application questions
   
3. FLASHCARD EFFECTIVENESS:
   - One concept per card
   - Front: Question or prompt
   - Back: Concise answer with example
   
4. SUMMARY CLARITY:
   - Key points only
   - Use bullet points
   - Include one memorable example

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
        
        prompt = f"""Generate {count} multiple-choice questions on: {topic}

LEARNER PROFILE:
- Confidence: {profile.confidence.value}
- Pace: {profile.pace.value}
- Style: {profile.learning_style.value}

DIFFICULTY DISTRIBUTION: {difficulty_dist}

REQUIREMENTS:
- Each question tests UNDERSTANDING, not just recall
- 4 options per question
- Include practical/application questions
- Make distractors (wrong options) plausible
- Add brief explanations for correct answers

Return as JSON array:
[
  {{
    "question": "...",
    "options": ["A", "B", "C", "D"],
    "correct_answer": 0,
    "explanation": "...",
    "difficulty": "easy|medium|hard"
  }}
]"""

        try:
            response = await self.generate_json(prompt)
            data = json.loads(response)
            
            # Handle both array and object responses
            if isinstance(data, dict) and "questions" in data:
                data = data["questions"]
            
            return [MCQQuestion(**q) for q in data[:count]]
        except Exception as e:
            # Return fallback questions
            return [
                MCQQuestion(
                    question=f"What is the primary purpose of {topic}?",
                    options=[
                        "To improve system efficiency",
                        "To manage resources effectively",
                        "To provide abstraction",
                        "All of the above"
                    ],
                    correct_answer=3,
                    explanation="This concept serves multiple important purposes.",
                    difficulty="easy"
                )
            ]
    
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
        
        prompt = f"""Generate {count} flashcards for: {topic}

LEARNER STYLE: {profile.learning_style.value}
STYLE HINT: {style_hint}

REQUIREMENTS:
- One key concept per card
- Front: Clear question or prompt
- Back: Concise answer with example
- Make them memorable

Return as JSON array:
[
  {{
    "front": "Question or concept prompt",
    "back": "Answer with brief example",
    "topic": "{topic}"
  }}
]"""

        try:
            response = await self.generate_json(prompt)
            data = json.loads(response)
            
            if isinstance(data, dict) and "flashcards" in data:
                data = data["flashcards"]
            
            return [Flashcard(**f) for f in data[:count]]
        except Exception as e:
            return [
                Flashcard(
                    front=f"What is {topic}?",
                    back=f"A fundamental concept in computer science that helps manage...",
                    topic=topic
                )
            ]
    
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
- Cover the core concept
- Include one practical example
- List 3-5 key points

Format:
SUMMARY:
[Your summary here]

KEY POINTS:
- Point 1
- Point 2
- Point 3"""

        try:
            response = await self.generate(prompt, temperature=0.6)
            
            # Parse summary and key points
            summary = response
            key_points = []
            
            if "KEY POINTS:" in response:
                parts = response.split("KEY POINTS:")
                summary = parts[0].replace("SUMMARY:", "").strip()
                key_points = [
                    line.strip().lstrip("- •").strip()
                    for line in parts[1].split("\n")
                    if line.strip() and (line.strip().startswith("-") or line.strip().startswith("•"))
                ]
            
            return summary, key_points[:5]
        except Exception as e:
            return f"Summary of {topic}: A fundamental concept...", [f"Key aspect of {topic}"]
    
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

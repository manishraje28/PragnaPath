"""
🧑‍🏫 GURUKULGUIDE AGENT - Adaptive Tutor
=======================================
Meaning: Inspired by the Indian "Gurukul" system of personalized mentorship

Purpose:
- Explain CS concepts adaptively based on learner profile
- Use different teaching styles (story, exam-smart, step-by-step)
- Incorporate Indian-context analogies when appropriate
- THE KEY "WOW MOMENT" - Same topic, different explanations!

Pattern: Profile-Conditioned Generation
"""

import json
from typing import Any, Dict, Optional, List
from .base import BaseAgent
from ..core.models import (
    LearnerProfile,
    Explanation,
    TeachingStyle,
    LearningStyle,
    DepthPreference
)


# Indian-context analogies for CS concepts
INDIAN_ANALOGIES = {
    "deadlock": {
        "conceptual": "Imagine four auto-rickshaws at a narrow cross-road in Old Delhi. Each needs the other to move first. Nobody budges - that's deadlock! Just like the traffic jam at Chandni Chowk during Diwali.",
        "visual": "Picture the famous 'Chakravyuh' from Mahabharata - once Abhimanyu entered, he couldn't exit. Processes in deadlock are similarly trapped, each holding a resource while waiting for another.",
    },
    "process_scheduling": {
        "conceptual": "Think of a railway station like Mumbai CST during rush hour. The station master (CPU scheduler) must decide which train (process) gets the platform (CPU) next. Round-robin is like a fair queue at a ration shop - everyone gets their turn!",
        "visual": "Like the token system at a busy IRCTC counter - each person gets a number, waits for their turn.",
    },
    "virtual_memory": {
        "conceptual": "Your grandmother's steel almirah has limited space, but she has many sarees. She keeps frequently-worn ones in the almirah (RAM) and stores seasonal ones in trunks (disk). When Diwali comes, she swaps them. That's virtual memory!",
        "visual": "Like a restaurant kitchen where only some dishes are being cooked (in RAM), while ingredients for other orders wait in storage (disk).",
    },
    "binary_search": {
        "conceptual": "Finding a word in a dictionary - you don't start from 'A'. You open the middle, check if your word comes before or after, and repeat. Like finding a name in a school register arranged alphabetically.",
        "visual": "Like the 'Kaun Banega Crorepati' 50-50 lifeline - each guess eliminates half the options!",
    },
    "stack": {
        "conceptual": "A stack of rotis on a plate - you always take from the top (LIFO). The first roti made is the last one eaten. That's exactly how a stack data structure works!",
        "visual": "Like bangles on a hand - you put them on one by one, but remove in reverse order.",
    },
    "recursion": {
        "conceptual": "Remember the Dronacharya story? When asked to bring him the best student, Arjuna kept saying 'there's always someone better' until he realized he was the answer. That's the base case stopping infinite recursion!",
        "visual": "Like the mirror reflections in a barber shop - each mirror shows another mirror, going on until you reach the end.",
    }
}


class GurukulGuideAgent(BaseAgent):
    """
    The Adaptive Tutor - Explains concepts in personalized ways.
    Named after the ancient Indian Gurukul system of one-on-one mentorship.
    """
    
    def __init__(self):
        super().__init__(
            name="GurukulGuide",
            description="Adaptive Tutor - teaches the way you learn best"
        )
    
    def _build_system_instruction(self) -> str:
        return """You are GurukulGuide, the adaptive tutor of PragnaPath.

Your name is inspired by the ancient Indian 'Gurukul' system where a Guru (teacher) would personalize teaching for each Shishya (student).

YOUR TEACHING PHILOSOPHY:
- Every learner is unique - adapt your explanations to THEIR style
- Use the learner profile to determine HOW to explain, not WHAT
- Make complex concepts accessible through relatable examples
- Incorporate Indian cultural references and analogies when appropriate
- Be encouraging and patient - learning is a journey

TEACHING STYLES YOU CAN USE:

1. STORY_ANALOGY (for conceptual learners):
   - Start with a relatable story or real-world scenario
   - Use everyday Indian examples (trains, markets, festivals)
   - Build intuition before introducing formal terms
   - End with "So basically..." summary

2. STEP_BY_STEP (for visual learners):
   - Break down into numbered steps
   - Use clear transitions: "First... Then... Finally..."
   - Include mental visualization cues
   - Draw connections between steps

3. EXAM_SMART (for exam-focused learners):
   - Start with the formal definition
   - List key points and important terms
   - Mention common exam patterns
   - Include mnemonics if helpful

4. VISUAL_MENTAL (for diagram-oriented learners):
   - Describe visual layouts in words
   - Use ASCII art or structured text
   - Reference how things would look on paper

CRITICAL RULE:
The SAME concept must be explained DIFFERENTLY based on the learner profile.
This is the core "wow moment" of PragnaPath.

Always end with a follow-up question to check understanding."""
    
    async def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Generate an adaptive explanation."""
        
        topic = context.get("topic", "")
        subtopic = context.get("subtopic", "")
        profile: LearnerProfile = context.get("profile", LearnerProfile())
        is_re_explanation = context.get("is_re_explanation", False)
        previous_style = context.get("previous_style", None)
        
        # Determine teaching style based on profile
        teaching_style = self._determine_teaching_style(profile, is_re_explanation, previous_style)
        
        # Generate explanation
        explanation = await self._generate_explanation(
            topic=topic,
            subtopic=subtopic,
            profile=profile,
            style=teaching_style,
            is_re_explanation=is_re_explanation
        )
        
        # Get Indian analogy if available
        indian_analogy = self._get_indian_analogy(topic, profile.learning_style)
        
        return {
            "explanation": explanation,
            "style_used": teaching_style,
            "indian_analogy": indian_analogy,
            "is_adapted": is_re_explanation,
            "profile_used": profile
        }
    
    def _determine_teaching_style(
        self,
        profile: LearnerProfile,
        is_re_explanation: bool,
        previous_style: Optional[TeachingStyle]
    ) -> TeachingStyle:
        """Determine the best teaching style based on profile."""
        
        # Map learning style to teaching style
        style_mapping = {
            LearningStyle.CONCEPTUAL: TeachingStyle.STORY_ANALOGY,
            LearningStyle.VISUAL: TeachingStyle.VISUAL_MENTAL,
            LearningStyle.EXAM_FOCUSED: TeachingStyle.EXAM_SMART
        }
        
        primary_style = style_mapping.get(profile.learning_style, TeachingStyle.STORY_ANALOGY)
        
        # If re-explaining, try a different style
        if is_re_explanation and previous_style:
            alternative_styles = [s for s in TeachingStyle if s != previous_style]
            
            # Prefer step-by-step for struggling learners
            if profile.confidence.value == "low":
                return TeachingStyle.STEP_BY_STEP
            
            # Pick based on depth preference
            if profile.depth_preference == DepthPreference.FORMULA_FIRST:
                return TeachingStyle.EXAM_SMART
            else:
                return TeachingStyle.STORY_ANALOGY if TeachingStyle.STORY_ANALOGY in alternative_styles else TeachingStyle.STEP_BY_STEP
        
        return primary_style
    
    async def _generate_explanation(
        self,
        topic: str,
        subtopic: str,
        profile: LearnerProfile,
        style: TeachingStyle,
        is_re_explanation: bool
    ) -> Explanation:
        """Generate a profile-conditioned explanation."""
        
        style_instructions = {
            TeachingStyle.STORY_ANALOGY: """
Use the STORY/ANALOGY approach:
- Start with a relatable story or real-world scenario
- Use everyday examples (preferably with Indian context - trains, markets, festivals, cricket)
- Build intuition BEFORE introducing technical terms
- End with "So basically..." to summarize the core idea
- Keep it conversational and engaging""",
            
            TeachingStyle.STEP_BY_STEP: """
Use the STEP-BY-STEP approach:
- Break the concept into numbered steps (Step 1, Step 2, etc.)
- Each step should build on the previous
- Use clear transitions: "First... Then... Finally..."
- Include mental visualization cues
- Make it methodical and clear""",
            
            TeachingStyle.EXAM_SMART: """
Use the EXAM-SMART approach:
- Start with the FORMAL DEFINITION
- List KEY POINTS that examiners look for
- Mention important TERMS and their meanings
- Include common EXAM PATTERNS for this topic
- Add a mnemonic if helpful
- Be concise and focused on what gets marks""",
            
            TeachingStyle.VISUAL_MENTAL: """
Use the VISUAL/MENTAL MODEL approach:
- Describe how to visualize this concept
- Use text-based diagrams or structured layouts
- Reference how things would look on paper
- Help them build a mental picture
- Use spatial language (left, right, above, below)"""
        }
        
        re_explain_context = ""
        if is_re_explanation:
            re_explain_context = """
⚠️ IMPORTANT: This is a RE-EXPLANATION. The previous approach didn't work well.
You MUST use a COMPLETELY DIFFERENT approach this time.
Be extra patient and break things down more simply."""

        prompt = f"""Generate an explanation for this CS topic.

TOPIC: {topic}
{f"SUBTOPIC: {subtopic}" if subtopic else ""}

LEARNER PROFILE:
{profile.to_context_string()}

TEACHING STYLE TO USE: {style.value}
{style_instructions[style]}
{re_explain_context}

ADDITIONAL REQUIREMENTS:
- Pace: {profile.pace.value} ({"take your time, be detailed" if profile.pace.value == "slow" else "be concise" if profile.pace.value == "fast" else "balanced pace"})
- Confidence: {profile.confidence.value} ({"be extra encouraging and supportive" if profile.confidence.value == "low" else "challenge them appropriately" if profile.confidence.value == "high" else "balanced encouragement"})
- Depth: {profile.depth_preference.value}

Generate the explanation. At the end, include:
1. 3 key takeaways (as a list)
2. A follow-up question to check understanding

Format your response as:
[EXPLANATION]
Your explanation here...

[KEY TAKEAWAYS]
- Takeaway 1
- Takeaway 2
- Takeaway 3

[FOLLOW-UP QUESTION]
Your question here?"""

        response = await self.generate(prompt, temperature=0.7, max_tokens=1500)
        
        # Parse the response
        explanation_content, takeaways, follow_up = self._parse_explanation_response(response)
        
        return Explanation(
            topic=topic,
            style_used=style,
            content=explanation_content,
            indian_analogy=self._get_indian_analogy(topic, profile.learning_style),
            key_takeaways=takeaways,
            follow_up_question=follow_up,
            profile_at_generation=profile
        )
    
    def _parse_explanation_response(self, response: str) -> tuple:
        """Parse the structured explanation response."""
        
        # Default values
        explanation = response
        takeaways = []
        follow_up = "Can you explain this concept back to me in your own words?"
        
        try:
            # Extract explanation
            if "[EXPLANATION]" in response:
                parts = response.split("[KEY TAKEAWAYS]")
                explanation = parts[0].replace("[EXPLANATION]", "").strip()
                
                if len(parts) > 1:
                    remaining = parts[1]
                    takeaway_parts = remaining.split("[FOLLOW-UP QUESTION]")
                    
                    # Extract takeaways
                    takeaway_text = takeaway_parts[0].strip()
                    takeaways = [
                        line.strip().lstrip("- •").strip() 
                        for line in takeaway_text.split("\n") 
                        if line.strip() and line.strip().startswith(("-", "•", "1", "2", "3"))
                    ][:3]
                    
                    # Extract follow-up
                    if len(takeaway_parts) > 1:
                        follow_up = takeaway_parts[1].strip()
        except Exception:
            pass
        
        return explanation, takeaways or ["Understanding the core concept", "Seeing real-world applications", "Knowing when to apply it"], follow_up
    
    def _get_indian_analogy(self, topic: str, learning_style: LearningStyle) -> Optional[str]:
        """Get an Indian-context analogy for the topic."""
        
        # Normalize topic
        topic_lower = topic.lower()
        
        # Find matching analogy
        for key, analogies in INDIAN_ANALOGIES.items():
            if key in topic_lower:
                style_key = "conceptual" if learning_style == LearningStyle.CONCEPTUAL else "visual"
                return analogies.get(style_key, analogies.get("conceptual"))
        
        return None
    
    async def compare_explanations(
        self,
        topic: str,
        profile_before: LearnerProfile,
        profile_after: LearnerProfile
    ) -> Dict[str, Any]:
        """
        Generate two explanations to demonstrate adaptation.
        This is the CORE DEMO FEATURE.
        """
        
        # Explanation with original profile
        explanation_before = await self._generate_explanation(
            topic=topic,
            subtopic="",
            profile=profile_before,
            style=self._determine_teaching_style(profile_before, False, None),
            is_re_explanation=False
        )
        
        # Explanation with updated profile
        explanation_after = await self._generate_explanation(
            topic=topic,
            subtopic="",
            profile=profile_after,
            style=self._determine_teaching_style(profile_after, True, explanation_before.style_used),
            is_re_explanation=True
        )
        
        return {
            "topic": topic,
            "before": {
                "profile": profile_before.model_dump(),
                "style": explanation_before.style_used.value,
                "explanation": explanation_before
            },
            "after": {
                "profile": profile_after.model_dump(),
                "style": explanation_after.style_used.value,
                "explanation": explanation_after
            },
            "adaptation_demonstrated": explanation_before.style_used != explanation_after.style_used
        }
    
    async def generate_follow_up_feedback(
        self,
        question: str,
        user_answer: str,
        correct_concept: str,
        profile: LearnerProfile
    ) -> Dict[str, Any]:
        """Generate feedback on a follow-up question answer."""
        
        prompt = f"""Evaluate this student's answer to a follow-up question.

QUESTION: {question}
STUDENT'S ANSWER: {user_answer}
CORRECT CONCEPT: {correct_concept}

LEARNER PROFILE:
- Confidence: {profile.confidence.value}
- Learning style: {profile.learning_style.value}

Provide:
1. Whether they understood correctly (yes/partially/no)
2. Encouraging feedback (personalized to their confidence level)
3. If wrong, a hint (not the answer) in their preferred style

Respond with JSON:
{{
    "understood": "yes|partially|no",
    "feedback": "your encouraging feedback",
    "hint": "optional hint if needed",
    "should_re_explain": true/false
}}"""

        try:
            response = await self.generate_json(prompt)
            return json.loads(response)
        except Exception as e:
            return {
                "understood": "partially",
                "feedback": "Thank you for trying! Let me help clarify this further.",
                "should_re_explain": True
            }

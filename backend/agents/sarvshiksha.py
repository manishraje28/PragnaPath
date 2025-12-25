"""
♿ SARVSHIKSHA AGENT - Accessibility Layer
==========================================
Meaning: "Sarv" (all) + "Shiksha" (education) = Education for All

Purpose:
- Make learning content accessible to all learners
- Transform text for dyslexia-friendly reading
- Create screen-reader-friendly structure
- Simplify complex content

Pattern: Content Transformation Pipeline
"""

import re
import sys
import os
import json
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from typing import Any, Dict, List
from agents.base import BaseAgent
from core.models import AccessibleContent, KeyTerm, SignLanguagePhrase, ReadingMode


class SarvShikshaAgent(BaseAgent):
    """
    The Accessibility Layer - Education for All.
    Named after India's 'Sarva Shiksha Abhiyan' (Education for All Campaign).
    """
    
    def __init__(self):
        super().__init__(
            name="SarvShiksha",
            description="Accessibility Layer - making learning inclusive for everyone"
        )
    
    def _build_system_instruction(self) -> str:
        return """You are SarvShiksha, the Accessibility Agent of PragnaPath.

Your name comes from India's 'Sarva Shiksha Abhiyan' - the campaign for universal education.
Your mission is to ensure EVERY learner can access and understand content.

CRITICAL FORMATTING RULES:
- NEVER use markdown formatting like **bold** or *italic* or __underline__
- Use PLAIN TEXT ONLY - no asterisks or underscores anywhere
- Use CAPITAL LETTERS for emphasis instead of bold
- Use dashes (-) or numbers (1. 2. 3.) for lists
- Keep all output clean and readable

ACCESSIBILITY PRINCIPLES:

1. DYSLEXIA-FRIENDLY:
   - Use simple, common words
   - Short sentences (max 15 words)
   - One idea per sentence
   - Avoid complex punctuation
   - Clear paragraph breaks with blank lines
   - No justified text alignment
   
2. SCREEN-READER FRIENDLY:
   - Clear section markers using SECTION and END OF SECTION
   - Descriptive text for all concepts
   - Logical reading order
   - Numbered lists for steps
   - Spell out symbols and abbreviations

3. COGNITIVE ACCESSIBILITY:
   - Plain language only
   - Define technical terms immediately after first use
   - Use concrete, everyday examples
   - Avoid idioms and metaphors
   - Consistent terminology throughout
   - Break information into small chunks

4. VISUAL SIMPLIFICATION:
   - No dense paragraphs
   - Clear spacing between sections
   - Important information first
   - Summarize, then provide detail

Always be inclusive. Never assume prior knowledge."""
    
    async def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Transform content for accessibility."""
        
        content = context.get("content", "")
        mode = context.get("mode", "all")
        
        if mode == "all":
            return await self._transform_all(content)
        elif mode == "dyslexia":
            result = await self._transform_dyslexia(content)
            return {"dyslexia_friendly": result}
        elif mode == "screen-reader":
            result = await self._transform_screen_reader(content)
            return {"screen_reader_friendly": result}
        elif mode == "simplified":
            result = await self._transform_simplified(content)
            return {"simplified": result}
        else:
            return {"error": f"Unknown mode: {mode}"}
    
    async def _transform_all(self, content: str) -> Dict[str, Any]:
        """Apply all accessibility transformations."""
        from agents.base import strip_markdown
        
        # Core transformations (existing)
        dyslexia = strip_markdown(await self._transform_dyslexia(content))
        screen_reader = strip_markdown(await self._transform_screen_reader(content))
        simplified = strip_markdown(await self._transform_simplified(content))
        
        # NEW: Enhanced accessibility features
        one_line_summary = strip_markdown(await self._generate_one_line_summary(content))
        key_terms = await self._extract_key_terms(content)
        reading_modes = await self._generate_reading_modes(content)
        sign_phrases = await self._generate_sign_language_phrases(content)
        
        accessible = AccessibleContent(
            original_content=content,
            dyslexia_friendly=dyslexia,
            screen_reader_friendly=screen_reader,
            simplified_version=simplified,
            one_line_summary=one_line_summary,
            key_terms=key_terms,
            reading_modes=reading_modes,
            sign_language_phrases=sign_phrases
        )
        
        return {
            "accessible_content": accessible,
            "message": "Content transformed for accessibility!"
        }
    
    async def _transform_dyslexia(self, content: str) -> str:
        """Transform content for dyslexia-friendly reading."""
        
        prompt = f"""Transform this text to be DYSLEXIA-FRIENDLY.

ORIGINAL TEXT:
{content}

RULES:
1. Use simple, common words only
2. Maximum 12-15 words per sentence
3. One idea per sentence
4. Break into short paragraphs (2-3 sentences max)
5. Replace complex words with simpler alternatives
6. Add clear spacing between sections
7. Use direct, active voice
8. Avoid abbreviations (write them out)
9. No italics or ALL CAPS references
10. Add extra line breaks for visual clarity

CRITICAL: DO NOT use any markdown formatting like **bold** or *italic* or __underline__.
Use PLAIN TEXT ONLY. No asterisks or underscores.
Use CAPITAL LETTERS if you need emphasis.

Transform the content following these rules. 
Keep all the important information but make it easier to read."""

        return await self.generate(prompt, temperature=0.4, max_tokens=1500)
    
    async def _transform_screen_reader(self, content: str) -> str:
        """Transform content for screen reader compatibility."""
        
        prompt = f"""Transform this text for SCREEN READER users.

ORIGINAL TEXT:
{content}

RULES:
1. Add clear section markers: SECTION - Name
2. Use numbered lists instead of bullets
3. Spell out symbols (for example, say "equals" instead of "=")
4. Add verbal descriptions for any visual concepts
5. Use a logical reading order
6. Start with a brief summary
7. Define acronyms on first use
8. Use explicit transitions ("Next...", "Finally...")
9. Avoid tables - use lists instead
10. Add "END OF SECTION" markers

CRITICAL: DO NOT use any markdown formatting like **bold** or *italic* or __underline__.
Use PLAIN TEXT ONLY. No asterisks or underscores.
Use CAPITAL LETTERS for section headers and emphasis.

Make the text optimized for being read aloud by a screen reader.
Maintain all educational content."""

        return await self.generate(prompt, temperature=0.4, max_tokens=1500)
    
    async def _transform_simplified(self, content: str) -> str:
        """Create a simplified, plain-language version."""
        
        prompt = f"""Create a SIMPLIFIED version of this text.

ORIGINAL TEXT:
{content}

RULES:
1. Use only the 1000 most common English words where possible
2. If a technical term MUST be used, define it immediately
3. Use very short sentences (8-10 words ideal)
4. One concept per paragraph
5. Start each paragraph with the main point
6. Use concrete, everyday examples
7. Avoid:
   - Passive voice
   - Abstract concepts without examples
   - Idioms or metaphors
   - Complex punctuation
8. Add "In simple words..." clarifications for difficult parts

CRITICAL: DO NOT use any markdown formatting like **bold** or *italic* or __underline__.
Use PLAIN TEXT ONLY. No asterisks or underscores anywhere.
If you need emphasis, use CAPITAL LETTERS.

Create the simplest possible version while keeping all key information."""

        return await self.generate(prompt, temperature=0.4, max_tokens=1500)
    
    # ============================================
    # NEW: Enhanced Accessibility Features
    # ============================================
    
    async def _generate_one_line_summary(self, content: str) -> str:
        """Generate a one-line summary of the content."""
        
        prompt = f"""Create a ONE LINE SUMMARY of this educational content.

CONTENT:
{content}

RULES:
1. Maximum 15 words
2. Capture the main concept only
3. Use simple, common words
4. Make it memorable
5. Start with the key subject

Return ONLY the one-line summary, nothing else."""

        return await self.generate(prompt, temperature=0.3, max_tokens=50)
    
    async def _extract_key_terms(self, content: str) -> List[KeyTerm]:
        """Extract and define key terms from the content."""
        
        prompt = f"""Extract KEY TERMS from this educational content.

CONTENT:
{content}

For each term, provide:
1. The term itself
2. A simple 1-sentence definition (use everyday words)
3. Importance level: "essential" (must know), "helpful" (good to know), or "advanced" (for deeper understanding)

Return JSON array:
[
    {{"term": "...", "definition": "...", "importance": "essential|helpful|advanced"}},
    ...
]

Extract 3-6 key terms. Focus on concepts that might be new to learners."""

        try:
            response = await self.generate_json(prompt)
            terms_data = json.loads(response) if isinstance(response, str) else response
            return [KeyTerm(**term) for term in terms_data[:6]]
        except Exception as e:
            # Fallback: extract simple terms
            return [KeyTerm(term="Key concept", definition="The main idea from this lesson", importance="essential")]
    
    async def _generate_reading_modes(self, content: str) -> Dict[str, ReadingMode]:
        """Generate content in different reading modes."""
        from agents.base import strip_markdown
        
        # Simple mode
        simple_prompt = f"""Rewrite this content in SIMPLE MODE for quick understanding.

CONTENT:
{content}

RULES:
1. Use the simplest words possible
2. Maximum 10 words per sentence
3. Remove all extra details
4. Keep only the core message
5. Use everyday examples

CRITICAL: Use PLAIN TEXT ONLY. No markdown formatting like ** or * or __.

Return just the simplified text."""

        simple_content = strip_markdown(await self.generate(simple_prompt, temperature=0.3, max_tokens=500))
        
        # Step-by-step mode
        step_prompt = f"""Rewrite this content in STEP-BY-STEP MODE.

CONTENT:
{content}

RULES:
1. Break into numbered steps (Step 1, Step 2, etc.)
2. Each step should be one clear action or idea
3. Start each step with a verb when possible
4. Keep steps short (max 2 sentences)
5. Add "Why:" after complex steps to explain reasoning

CRITICAL: Use PLAIN TEXT ONLY. No markdown formatting like ** or * or __.

Return the step-by-step version."""

        step_content = strip_markdown(await self.generate(step_prompt, temperature=0.3, max_tokens=700))
        
        # Key ideas mode
        key_ideas_prompt = f"""Extract KEY IDEAS from this content as bullet points.

CONTENT:
{content}

RULES:
1. 3-5 key ideas maximum
2. Each idea in one sentence
3. Start with the most important idea
4. Use arrows to show cause-effect relationships
5. Make each point standalone and memorable

CRITICAL: Use PLAIN TEXT ONLY. No markdown formatting like ** or * or __.
Use the bullet symbol or dashes for list items.

Return as bullet points."""

        key_ideas_content = strip_markdown(await self.generate(key_ideas_prompt, temperature=0.3, max_tokens=400))
        
        # Extract bullet points from key ideas
        bullet_points = [
            strip_markdown(line.strip().lstrip('•-').strip())
            for line in key_ideas_content.split('\n') 
            if line.strip() and (line.strip().startswith('•') or line.strip().startswith('-') or line.strip()[0].isdigit())
        ]
        
        return {
            "simple": ReadingMode(mode="simple", content=simple_content),
            "step_by_step": ReadingMode(mode="step_by_step", content=step_content),
            "key_ideas": ReadingMode(mode="key_ideas", content=key_ideas_content, bullet_points=bullet_points)
        }
    
    async def _generate_sign_language_phrases(self, content: str) -> List[SignLanguagePhrase]:
        """Generate structured phrases optimized for sign language interpretation."""
        
        prompt = f"""Convert this content into SIGN-LANGUAGE-READY PHRASES.

CONTENT:
{content}

RULES:
1. Break into short, clear phrases (3-7 words each)
2. Use Subject-Verb-Object order
3. Remove filler words (a, the, is, are)
4. Replace abstract words with concrete concepts
5. Add gesture hints for complex concepts
6. Mark key concepts that need emphasis
7. Keep phrases in logical teaching order

Return JSON array:
[
    {{
        "phrase": "...", 
        "gesture_hint": "optional hint for interpreter",
        "sequence_order": 1,
        "is_key_concept": true/false
    }},
    ...
]

Generate 8-15 phrases that capture the full meaning."""

        try:
            response = await self.generate_json(prompt)
            phrases_data = json.loads(response) if isinstance(response, str) else response
            return [SignLanguagePhrase(**phrase) for phrase in phrases_data]
        except Exception as e:
            # Fallback: simple phrase extraction
            sentences = content.split('.')[:5]
            return [
                SignLanguagePhrase(
                    phrase=s.strip()[:50] if s.strip() else "Content available",
                    sequence_order=i,
                    is_key_concept=(i == 0)
                )
                for i, s in enumerate(sentences) if s.strip()
            ]
    
    async def analyze_accessibility(self, content: str) -> Dict[str, Any]:
        """Analyze content for accessibility issues."""
        
        prompt = f"""Analyze this text for ACCESSIBILITY ISSUES.

TEXT:
{content}

Check for:
1. Long sentences (>20 words)
2. Complex vocabulary
3. Dense paragraphs
4. Missing structure/headings
5. Ambiguous references
6. Technical jargon without definitions
7. Visual-only information

Return JSON:
{{
    "accessibility_score": 1-10,
    "issues": [
        {{"type": "...", "description": "...", "suggestion": "..."}}
    ],
    "strengths": ["..."],
    "overall_recommendation": "..."
}}"""

        try:
            import json
            response = await self.generate_json(prompt)
            return json.loads(response)
        except Exception as e:
            return {
                "accessibility_score": 5,
                "issues": [{"type": "analysis_error", "description": str(e)}],
                "overall_recommendation": "Manual review recommended"
            }
    
    def quick_simplify(self, content: str) -> str:
        """Quick rule-based simplification (no API call)."""
        
        # Split into sentences
        sentences = re.split(r'(?<=[.!?])\s+', content)
        simplified_sentences = []
        
        for sentence in sentences:
            # Break long sentences
            if len(sentence.split()) > 15:
                # Try to split at conjunctions
                parts = re.split(r',\s*(?:and|but|or|however|therefore)\s*', sentence)
                for part in parts:
                    if part.strip():
                        simplified_sentences.append(part.strip().capitalize())
            else:
                simplified_sentences.append(sentence)
        
        # Add spacing
        result = "\n\n".join(simplified_sentences)
        
        return result
    
    async def create_alt_text(self, concept_description: str) -> str:
        """Create alt-text for visual concepts (for screen readers)."""
        
        prompt = f"""Create a brief, clear description of this concept for a screen reader user.
        
CONCEPT: {concept_description}

Rules:
- 1-2 sentences maximum
- Describe what it IS and what it DOES
- Use simple language
- Be concrete and specific

Return just the alt-text description."""

        return await self.generate(prompt, temperature=0.3, max_tokens=100)
    
    async def create_audio_script(self, content: str) -> str:
        """Create a script optimized for audio/TTS consumption."""
        
        prompt = f"""Convert this text into an AUDIO SCRIPT for text-to-speech.

ORIGINAL TEXT:
{content}

RULES:
1. Add natural pauses: [PAUSE]
2. Spell out special characters
3. Add pronunciation guides for technical terms: (pronounced: XXX)
4. Use conversational tone
5. Add emphasis markers for important words: *important*
6. Break into logical chunks with clear transitions
7. End sections with brief summaries
8. Add [PAUSE] after key points

Create the audio-optimized script."""

        return await self.generate(prompt, temperature=0.5, max_tokens=1500)

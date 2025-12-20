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
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from typing import Any, Dict
from agents.base import BaseAgent
from core.models import AccessibleContent


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

ACCESSIBILITY PRINCIPLES:

1. DYSLEXIA-FRIENDLY:
   - Use simple, common words
   - Short sentences (max 15 words)
   - One idea per sentence
   - Avoid complex punctuation
   - Clear paragraph breaks
   - No justified text alignment
   
2. SCREEN-READER FRIENDLY:
   - Clear heading hierarchy
   - Descriptive link text
   - Alt text for concepts
   - Logical reading order
   - Numbered lists over bullets
   - Explicit section markers

3. COGNITIVE ACCESSIBILITY:
   - Plain language
   - Define technical terms immediately
   - Use concrete examples
   - Avoid idioms and metaphors
   - Consistent terminology
   - Chunked information

4. VISUAL SIMPLIFICATION:
   - No dense paragraphs
   - Clear spacing
   - Important info first
   - Summarize, then detail

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
        
        dyslexia = await self._transform_dyslexia(content)
        screen_reader = await self._transform_screen_reader(content)
        simplified = await self._transform_simplified(content)
        
        accessible = AccessibleContent(
            original_content=content,
            dyslexia_friendly=dyslexia,
            screen_reader_friendly=screen_reader,
            simplified_version=simplified
        )
        
        return {
            "accessible_content": accessible,
            "message": "♿ Content transformed for accessibility!"
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

Transform the content following these rules. 
Keep all the important information but make it easier to read."""

        return await self.generate(prompt, temperature=0.4, max_tokens=1500)
    
    async def _transform_screen_reader(self, content: str) -> str:
        """Transform content for screen reader compatibility."""
        
        prompt = f"""Transform this text for SCREEN READER users.

ORIGINAL TEXT:
{content}

RULES:
1. Add clear section markers: [SECTION: Name]
2. Use numbered lists instead of bullets
3. Spell out symbols (e.g., "equals" instead of "=")
4. Add verbal descriptions for any visual concepts
5. Use a logical reading order
6. Start with a brief summary
7. Define acronyms on first use
8. Use explicit transitions ("Next...", "Finally...")
9. Avoid tables - use lists instead
10. Add "[END OF SECTION]" markers

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
8. Add "In other words..." clarifications for difficult parts

Create the simplest possible version while keeping all key information."""

        return await self.generate(prompt, temperature=0.4, max_tokens=1500)
    
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

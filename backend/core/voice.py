"""
PragnaPath - Voice Assistant Service
=====================================
Real-time bidirectional voice conversation using:
- Browser Web Speech API for speech recognition (frontend)
- Google Gemini for intelligent responses  
- Edge TTS for high-quality Indian English voice output

This enables natural voice conversations with the AI tutor.
"""

import os
import io
import json
import asyncio
import base64
from typing import Optional, Dict, Any, AsyncGenerator
from enum import Enum
import edge_tts
from google import genai
from google.genai import types

# Get API key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", os.getenv("GOOGLE_API_KEY", ""))


class VoiceMode(str, Enum):
    """Voice interaction modes."""
    CONVERSATION = "conversation"  # General Q&A
    EXPLAIN = "explain"           # Topic explanation
    QUIZ = "quiz"                 # Quiz mode
    DOUBT = "doubt"               # Doubt clearing


class IndianVoice(str, Enum):
    """Indian English voice options for TTS."""
    NEERJA = "en-IN-NeerjaNeural"            # Female, warm teacher voice
    NEERJA_EXPRESS = "en-IN-NeerjaExpressiveNeural"  # Female, expressive
    PRABHAT = "en-IN-PrabhatNeural"          # Male, clear teacher voice


class VoiceAssistant:
    """
    Voice-enabled AI Teaching Assistant.
    Handles speech-to-text transcription, AI response generation,
    and text-to-speech synthesis for natural voice conversations.
    """
    
    def __init__(self):
        self.client = genai.Client(api_key=GEMINI_API_KEY)
        self.model = "gemini-2.0-flash-exp"
        self.default_voice = IndianVoice.NEERJA
        self.conversation_history = []
        
    def _get_system_prompt(self, mode: VoiceMode, topic: Optional[str] = None, profile: Optional[Dict] = None) -> str:
        """Get system prompt based on mode and context."""
        
        base_prompt = """You are PragnaPath's Voice Teaching Assistant - a friendly, encouraging AI tutor 
that speaks naturally with Indian students learning Computer Science.

VOICE RESPONSE RULES (CRITICAL):
1. Keep responses SHORT and CONVERSATIONAL (2-4 sentences max)
2. Speak naturally like a friendly teacher, not a textbook
3. Use simple words that are easy to pronounce
4. Avoid special characters, code syntax, or complex formatting
5. When explaining, use analogies and everyday examples
6. Be encouraging - say things like "Great question!", "Exactly right!", "Let me explain..."
7. If asked about code, describe it in words rather than reading code
8. End with a quick check or follow-up when appropriate

"""
        
        if mode == VoiceMode.EXPLAIN and topic:
            base_prompt += f"""
CURRENT MODE: Explaining "{topic}"
- Break the concept into simple, spoken explanations
- Use Indian analogies when possible (trains, cricket, daily life)
- After explaining, ask if they understood or have questions
"""
        
        elif mode == VoiceMode.QUIZ:
            base_prompt += """
CURRENT MODE: Quiz
- Ask one question at a time
- Give immediate feedback on answers
- If wrong, give hints before revealing the answer
- Keep score and be encouraging
"""
        
        elif mode == VoiceMode.DOUBT:
            base_prompt += """
CURRENT MODE: Doubt Clearing
- Listen carefully to the student's doubt
- Clarify step by step
- Use different examples if the first one doesn't work
- Be patient and supportive
"""
        
        if profile:
            base_prompt += f"""

LEARNER PROFILE:
- Learning Style: {profile.get('learning_style', 'conceptual')}
- Pace: {profile.get('pace', 'medium')}
- Confidence: {profile.get('confidence', 'medium')}
Adapt your explanations to match their style.
"""
        
        return base_prompt

    async def process_voice_input(
        self,
        text: str,
        mode: VoiceMode = VoiceMode.CONVERSATION,
        topic: Optional[str] = None,
        profile: Optional[Dict] = None,
        session_context: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Process transcribed voice input and generate a response.
        
        Args:
            text: Transcribed text from user's speech
            mode: Current interaction mode
            topic: Current topic being discussed
            profile: Learner profile for personalization
            session_context: Previous context from session
            
        Returns:
            Dict with response text, audio bytes, and metadata
        """
        
        try:
            # Build context
            system_prompt = self._get_system_prompt(mode, topic, profile)
            
            # Add conversation history for continuity
            history_context = ""
            if self.conversation_history:
                recent = self.conversation_history[-4:]  # Last 4 exchanges
                history_context = "\n\nRecent conversation:\n" + "\n".join([
                    f"Student: {h['user']}\nTeacher: {h['assistant']}" 
                    for h in recent
                ])
            
            # Build the prompt
            prompt = f"""{system_prompt}
{history_context}

{f"Current topic: {topic}" if topic else ""}
{f"Session context: {session_context}" if session_context else ""}

Student says: "{text}"

Respond naturally as a voice assistant (keep it short and conversational):"""

            # Generate response using Gemini
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.8,
                    max_output_tokens=300,  # Keep responses short for voice
                )
            )
            
            response_text = response.text.strip()
            
            # Clean the response for speech
            response_text = self._clean_for_speech(response_text)
            
            # Store in history
            self.conversation_history.append({
                "user": text,
                "assistant": response_text
            })
            
            # Keep history manageable
            if len(self.conversation_history) > 10:
                self.conversation_history = self.conversation_history[-10:]
            
            # Generate audio
            audio_bytes = await self._synthesize_speech(response_text)
            
            return {
                "success": True,
                "text": response_text,
                "audio_base64": base64.b64encode(audio_bytes).decode('utf-8') if audio_bytes else None,
                "mode": mode.value,
                "topic": topic
            }
            
        except Exception as e:
            print(f"Voice processing error: {e}")
            error_message = "I'm sorry, I had trouble understanding that. Could you please repeat?"
            error_audio = await self._synthesize_speech(error_message)
            
            return {
                "success": False,
                "text": error_message,
                "audio_base64": base64.b64encode(error_audio).decode('utf-8') if error_audio else None,
                "error": str(e)
            }
    
    def _clean_for_speech(self, text: str) -> str:
        """Clean text for natural speech output."""
        
        # Remove markdown
        import re
        text = re.sub(r'\*\*(.+?)\*\*', r'\1', text)
        text = re.sub(r'\*(.+?)\*', r'\1', text)
        text = re.sub(r'`(.+?)`', r'\1', text)
        text = re.sub(r'^#+\s*', '', text, flags=re.MULTILINE)
        
        # Remove code blocks
        text = re.sub(r'```[\s\S]*?```', '', text)
        
        # Convert bullet points to speech-friendly format
        text = re.sub(r'^\s*[-•]\s*', 'Next, ', text, flags=re.MULTILINE)
        text = re.sub(r'^\s*\d+\.\s*', '', text, flags=re.MULTILINE)
        
        # Remove special characters that don't read well
        text = text.replace('→', 'leads to')
        text = text.replace('←', 'comes from')
        text = text.replace('↓', 'then')
        text = text.replace('↑', 'above')
        text = text.replace('≥', 'greater than or equal to')
        text = text.replace('≤', 'less than or equal to')
        text = text.replace('!=', 'is not equal to')
        text = text.replace('==', 'equals')
        text = text.replace('&&', 'and')
        text = text.replace('||', 'or')
        
        # Clean up whitespace
        text = re.sub(r'\n+', ' ', text)
        text = re.sub(r'\s+', ' ', text)
        
        return text.strip()
    
    async def _synthesize_speech(
        self,
        text: str,
        voice: IndianVoice = None,
        rate: str = "+0%"
    ) -> bytes:
        """Convert text to speech using Edge TTS."""
        
        voice = voice or self.default_voice
        
        try:
            communicate = edge_tts.Communicate(
                text=text,
                voice=voice.value,
                rate=rate
            )
            
            audio_data = io.BytesIO()
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    audio_data.write(chunk["data"])
            
            return audio_data.getvalue()
            
        except Exception as e:
            print(f"TTS error: {e}")
            return b""
    
    async def text_to_speech(
        self,
        text: str,
        voice: str = None,
        rate: str = "+0%"
    ) -> bytes:
        """Public method for text-to-speech conversion."""
        
        voice_enum = IndianVoice.NEERJA
        if voice:
            try:
                voice_enum = IndianVoice(voice)
            except ValueError:
                pass
        
        # Clean text for speech
        clean_text = self._clean_for_speech(text)
        
        return await self._synthesize_speech(clean_text, voice_enum, rate)
    
    def clear_history(self):
        """Clear conversation history."""
        self.conversation_history = []
    
    async def get_greeting(self, topic: Optional[str] = None) -> Dict[str, Any]:
        """Get a voice greeting when starting a session."""
        
        if topic:
            greeting = f"Hello! I'm your PragnaPath voice assistant. I see you're learning about {topic}. Feel free to ask me anything, or say 'explain' to start learning!"
        else:
            greeting = "Hello! I'm your PragnaPath voice assistant. What would you like to learn today? You can ask me about any computer science topic!"
        
        audio_bytes = await self._synthesize_speech(greeting)
        
        return {
            "success": True,
            "text": greeting,
            "audio_base64": base64.b64encode(audio_bytes).decode('utf-8') if audio_bytes else None
        }


# Singleton instance
voice_assistant = VoiceAssistant()

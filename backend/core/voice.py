"""
PragnaPath - Voice Assistant Service
=====================================
Real-time voice conversation using:
- Google Gemini 2.5 Flash for intelligent text responses
- Gemini 2.5 Flash Native Audio Dialog (Live API) for natural speech
- Edge TTS as fallback for speech synthesis

Powered by Gemini's native audio capabilities for natural,
conversational AI tutoring.
"""

import os
import io
import json
import struct
import asyncio
import base64
import re
from typing import Optional, Dict, Any
from enum import Enum
import edge_tts
from google import genai
from google.genai import types

# Get API key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", os.getenv("GOOGLE_API_KEY", ""))


class VoiceMode(str, Enum):
    """Voice interaction modes."""
    CONVERSATION = "conversation"
    EXPLAIN = "explain"
    QUIZ = "quiz"
    DOUBT = "doubt"


class IndianVoice(str, Enum):
    """Indian English voice options for Edge TTS fallback."""
    NEERJA = "en-IN-NeerjaNeural"
    NEERJA_EXPRESS = "en-IN-NeerjaExpressiveNeural"
    PRABHAT = "en-IN-PrabhatNeural"


# Available Gemini Native Audio voices
NATIVE_VOICES = ["Aoede", "Charon", "Fenrir", "Kore", "Puck", "Leda", "Orus", "Zephyr"]


class VoiceAssistant:
    """
    Voice-enabled AI Teaching Assistant using Gemini 2.5 Flash Native Audio.

    Uses two models:
      - gemini-2.5-flash: for text response generation (fast, reliable)
      - gemini-2.5-flash-preview-native-audio-dialog: for natural speech via Live API

    Falls back to Edge TTS if native audio generation fails.
    """

    def __init__(self):
        self.client = genai.Client(api_key=GEMINI_API_KEY)
        # Text generation model
        self.text_model = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
        # Native audio dialog model (Live API - bidiGenerateContent)
        self.audio_model = "gemini-2.5-flash-native-audio-latest"
        # Voice for native audio (Kore = clear, friendly female voice)
        self.voice_name = "Kore"
        # Fallback Edge TTS voice
        self.default_voice = IndianVoice.NEERJA
        self.conversation_history = []
        print(f"[Voice] Initialized - text: {self.text_model}, audio: {self.audio_model}, voice: {self.voice_name}")

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
        Process transcribed voice input and generate a response with native audio.

        Flow:
        1. Generate text response via Gemini 2.5 Flash
        2. Generate native audio via Gemini 2.5 Flash Native Audio Dialog (Live API)
        3. Fall back to Edge TTS if native audio fails

        Returns:
            Dict with response text, audio bytes (WAV), and metadata
        """

        try:
            system_prompt = self._get_system_prompt(mode, topic, profile)

            # Build conversation context
            history_context = ""
            if self.conversation_history:
                recent = self.conversation_history[-4:]
                history_context = "\n\nRecent conversation:\n" + "\n".join([
                    f"Student: {h['user']}\nTeacher: {h['assistant']}"
                    for h in recent
                ])

            prompt = f"""{system_prompt}
{history_context}

{f"Current topic: {topic}" if topic else ""}
{f"Session context: {session_context}" if session_context else ""}

Student says: "{text}"

Respond naturally as a voice assistant (keep it short and conversational):"""

            # Step 1: Generate text response using Gemini 2.5 Flash
            loop = asyncio.get_event_loop()
            text_response = await loop.run_in_executor(None, lambda: (
                self.client.models.generate_content(
                    model=self.text_model,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        temperature=0.8,
                        max_output_tokens=300,
                    )
                )
            ))

            response_text = text_response.text.strip()
            response_text = self._clean_for_speech(response_text)
            print(f"[Voice] Text response: {response_text[:100]}...")

            # Store in history
            self.conversation_history.append({
                "user": text,
                "assistant": response_text
            })
            if len(self.conversation_history) > 10:
                self.conversation_history = self.conversation_history[-10:]

            # Step 2: Generate native audio from the response text
            audio_base64 = None
            audio_format = "wav"

            native_audio = await self._generate_native_audio(response_text)
            if native_audio:
                wav_bytes = self._pcm_to_wav(native_audio)
                audio_base64 = base64.b64encode(wav_bytes).decode('utf-8')
                audio_format = "wav"
                print(f"[Voice] Native audio OK: {len(wav_bytes)} bytes WAV")
            else:
                # Fallback to Edge TTS
                print("[Voice] Native audio unavailable, using Edge TTS fallback")
                edge_audio = await self._synthesize_speech_edge(response_text)
                if edge_audio:
                    audio_base64 = base64.b64encode(edge_audio).decode('utf-8')
                    audio_format = "mp3"

            return {
                "success": True,
                "text": response_text,
                "audio_base64": audio_base64,
                "audio_format": audio_format,
                "mode": mode.value,
                "topic": topic,
                "native_audio": native_audio is not None
            }

        except Exception as e:
            print(f"[Voice] Processing error: {e}")
            error_message = "I'm sorry, I had trouble with that. Could you please try again?"

            # Try edge-tts for error message
            error_audio = await self._synthesize_speech_edge(error_message)

            return {
                "success": False,
                "text": error_message,
                "audio_base64": base64.b64encode(error_audio).decode('utf-8') if error_audio else None,
                "audio_format": "mp3",
                "error": str(e)
            }

    # ============================================================
    #  NATIVE AUDIO GENERATION (Gemini 2.5 Flash Live API)
    # ============================================================

    async def _generate_native_audio(self, text: str) -> Optional[bytes]:
        """
        Generate speech using Gemini 2.5 Flash Native Audio Dialog via Live API.

        Connects to the Live API, sends text, and collects audio response chunks.
        Returns raw PCM audio bytes (24kHz, 16-bit, mono) or None on failure.
        """
        try:
            config = types.LiveConnectConfig(
                response_modalities=["AUDIO"],
                speech_config=types.SpeechConfig(
                    voice_config=types.VoiceConfig(
                        prebuilt_voice_config=types.PrebuiltVoiceConfig(
                            voice_name=self.voice_name
                        )
                    )
                ),
            )

            audio_chunks = []

            async with self.client.aio.live.connect(
                model=self.audio_model,
                config=config
            ) as session:
                # Send text to be spoken naturally
                await session.send_client_content(
                    turns=types.Content(
                        role="user",
                        parts=[types.Part(
                            text=f"Read this aloud naturally as a friendly, warm teacher: {text}"
                        )]
                    ),
                    turn_complete=True
                )

                # Collect audio response chunks
                async for message in session.receive():
                    if message.server_content:
                        if message.server_content.model_turn:
                            for part in message.server_content.model_turn.parts:
                                if part.inline_data:
                                    audio_chunks.append(part.inline_data.data)
                        if message.server_content.turn_complete:
                            break

            if audio_chunks:
                combined = b''.join(audio_chunks)
                print(f"[Voice] Native audio: {len(combined)} bytes from {len(audio_chunks)} chunks")
                return combined

            print("[Voice] Native audio: no chunks received")
            return None

        except Exception as e:
            print(f"[Voice] Native audio error: {e}")
            return None

    def _pcm_to_wav(self, pcm_data: bytes, sample_rate: int = 24000,
                    channels: int = 1, bits_per_sample: int = 16) -> bytes:
        """Convert raw PCM audio data to WAV format for browser playback."""
        data_size = len(pcm_data)
        byte_rate = sample_rate * channels * bits_per_sample // 8
        block_align = channels * bits_per_sample // 8

        # RIFF header
        header = struct.pack('<4sI4s', b'RIFF', 36 + data_size, b'WAVE')
        # fmt sub-chunk (PCM format = 1)
        fmt_chunk = struct.pack('<4sIHHIIHH',
                                b'fmt ', 16, 1, channels,
                                sample_rate, byte_rate,
                                block_align, bits_per_sample)
        # data sub-chunk
        data_chunk = struct.pack('<4sI', b'data', data_size)

        return header + fmt_chunk + data_chunk + pcm_data

    # ============================================================
    #  EDGE TTS FALLBACK
    # ============================================================

    async def _synthesize_speech_edge(
        self,
        text: str,
        voice: IndianVoice = None,
        rate: str = "+0%"
    ) -> Optional[bytes]:
        """Convert text to speech using Edge TTS (fallback when native audio unavailable)."""
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
            result = audio_data.getvalue()
            return result if result else None
        except Exception as e:
            print(f"[Voice] Edge TTS error: {e}")
            return None

    # ============================================================
    #  TEXT-TO-SPEECH PUBLIC API
    # ============================================================

    async def text_to_speech(
        self,
        text: str,
        voice: str = None,
        rate: str = "+0%"
    ) -> bytes:
        """Public method for text-to-speech conversion."""
        clean_text = self._clean_for_speech(text)

        # Try native audio first
        native = await self._generate_native_audio(clean_text)
        if native:
            return self._pcm_to_wav(native)

        # Fallback to Edge TTS
        voice_enum = IndianVoice.NEERJA
        if voice:
            try:
                voice_enum = IndianVoice(voice)
            except ValueError:
                pass
        result = await self._synthesize_speech_edge(clean_text, voice_enum, rate)
        return result or b""

    # ============================================================
    #  UTILITIES
    # ============================================================

    def _clean_for_speech(self, text: str) -> str:
        """Clean text for natural speech output."""
        # Remove markdown
        text = re.sub(r'\*\*(.+?)\*\*', r'\1', text)
        text = re.sub(r'\*(.+?)\*', r'\1', text)
        text = re.sub(r'`(.+?)`', r'\1', text)
        text = re.sub(r'^#+\s*', '', text, flags=re.MULTILINE)

        # Remove code blocks
        text = re.sub(r'```[\s\S]*?```', '', text)

        # Convert bullet points to speech-friendly format
        text = re.sub(r'^\s*[-\u2022]\s*', 'Next, ', text, flags=re.MULTILINE)
        text = re.sub(r'^\s*\d+\.\s*', '', text, flags=re.MULTILINE)

        # Replace symbols with words
        text = text.replace('\u2192', 'leads to')
        text = text.replace('\u2190', 'comes from')
        text = text.replace('\u2193', 'then')
        text = text.replace('\u2191', 'above')
        text = text.replace('\u2265', 'greater than or equal to')
        text = text.replace('\u2264', 'less than or equal to')
        text = text.replace('!=', 'is not equal to')
        text = text.replace('==', 'equals')
        text = text.replace('&&', 'and')
        text = text.replace('||', 'or')

        # Clean up whitespace
        text = re.sub(r'\n+', ' ', text)
        text = re.sub(r'\s+', ' ', text)

        return text.strip()

    def clear_history(self):
        """Clear conversation history."""
        self.conversation_history = []

    async def get_greeting(self, topic: Optional[str] = None) -> Dict[str, Any]:
        """Get a voice greeting when starting a session."""

        if topic:
            greeting = f"Hello! I'm your PragnaPath voice assistant. I see you're learning about {topic}. Feel free to ask me anything, or say explain to start learning!"
        else:
            greeting = "Hello! I'm your PragnaPath voice assistant. What would you like to learn today? You can ask me about any computer science topic!"

        # Try native audio for greeting
        audio_base64 = None
        audio_format = "wav"
        native = await self._generate_native_audio(greeting)
        if native:
            wav_bytes = self._pcm_to_wav(native)
            audio_base64 = base64.b64encode(wav_bytes).decode('utf-8')
        else:
            edge_audio = await self._synthesize_speech_edge(greeting)
            if edge_audio:
                audio_base64 = base64.b64encode(edge_audio).decode('utf-8')
                audio_format = "mp3"

        return {
            "success": True,
            "text": greeting,
            "audio_base64": audio_base64,
            "audio_format": audio_format
        }


# Singleton instance
voice_assistant = VoiceAssistant()

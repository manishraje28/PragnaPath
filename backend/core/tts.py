"""
PragnaPath - Text-to-Speech Service
Indian English voice synthesis for accessibility.
Uses Microsoft Edge TTS (free, high-quality voices).
"""

import io
import edge_tts
from typing import Optional
from enum import Enum


class IndianVoice(str, Enum):
    """Available Indian English voices."""
    # Female voices
    NEERJA = "en-IN-NeerjaNeural"  # Natural, warm female teacher voice
    NEERJA_EXPRESSIVE = "en-IN-NeerjaExpressiveNeural"  # More expressive
    
    # Male voices
    PRABHAT = "en-IN-PrabhatNeural"  # Clear male teacher voice


class TTSService:
    """
    Text-to-Speech service with Indian English voices.
    Designed for educational content accessibility.
    """
    
    # Default voice for teaching
    DEFAULT_VOICE = IndianVoice.NEERJA
    
    # Speech rate adjustments
    RATE_SLOW = "-20%"
    RATE_NORMAL = "+0%"
    RATE_FAST = "+15%"
    
    @staticmethod
    async def synthesize(
        text: str,
        voice: IndianVoice = DEFAULT_VOICE,
        rate: str = RATE_NORMAL,
        pitch: str = "+0Hz"
    ) -> bytes:
        """
        Convert text to speech audio (MP3 format).
        
        Args:
            text: The text to convert to speech
            voice: Indian English voice to use
            rate: Speech rate (-50% to +100%)
            pitch: Voice pitch adjustment
            
        Returns:
            MP3 audio bytes
        """
        # Clean text for better TTS
        cleaned_text = TTSService._clean_for_speech(text)
        
        # Create TTS communicate object
        communicate = edge_tts.Communicate(
            text=cleaned_text,
            voice=voice.value,
            rate=rate,
            pitch=pitch
        )
        
        # Collect audio chunks
        audio_chunks = []
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_chunks.append(chunk["data"])
        
        return b"".join(audio_chunks)
    
    @staticmethod
    async def synthesize_streaming(
        text: str,
        voice: IndianVoice = DEFAULT_VOICE,
        rate: str = RATE_NORMAL
    ):
        """
        Stream audio chunks for real-time playback.
        Yields MP3 audio chunks.
        """
        cleaned_text = TTSService._clean_for_speech(text)
        
        communicate = edge_tts.Communicate(
            text=cleaned_text,
            voice=voice.value,
            rate=rate
        )
        
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                yield chunk["data"]
    
    @staticmethod
    def _clean_for_speech(text: str) -> str:
        """
        Clean text for better speech synthesis.
        Handles markdown, code blocks, special characters.
        """
        import re
        
        # Remove markdown formatting
        text = re.sub(r'\*\*(.+?)\*\*', r'\1', text)  # Bold
        text = re.sub(r'\*(.+?)\*', r'\1', text)  # Italic
        text = re.sub(r'`(.+?)`', r'\1', text)  # Inline code
        text = re.sub(r'#{1,6}\s*', '', text)  # Headers
        
        # Handle code blocks - read them slowly
        text = re.sub(r'```[\w]*\n(.+?)```', r'Code example: \1', text, flags=re.DOTALL)
        
        # Replace common symbols with words
        text = text.replace('→', ' leads to ')
        text = text.replace('←', ' comes from ')
        text = text.replace('↔', ' is equivalent to ')
        text = text.replace('>=', ' greater than or equal to ')
        text = text.replace('<=', ' less than or equal to ')
        text = text.replace('!=', ' not equal to ')
        text = text.replace('==', ' equals ')
        text = text.replace('&&', ' and ')
        text = text.replace('||', ' or ')
        
        # Clean up URLs
        text = re.sub(r'https?://\S+', 'link', text)
        
        # Handle bullet points
        text = re.sub(r'^[-*]\s+', '', text, flags=re.MULTILINE)
        text = re.sub(r'^\d+\.\s+', '', text, flags=re.MULTILINE)
        
        # Clean excess whitespace
        text = re.sub(r'\n{3,}', '\n\n', text)
        text = re.sub(r' {2,}', ' ', text)
        
        return text.strip()
    
    @staticmethod
    def get_available_voices():
        """Get list of available Indian voices."""
        return [
            {
                "id": voice.value,
                "name": voice.name,
                "gender": "female" if "Neerja" in voice.value else "male",
                "description": TTSService._get_voice_description(voice)
            }
            for voice in IndianVoice
        ]
    
    @staticmethod
    def _get_voice_description(voice: IndianVoice) -> str:
        """Get human-readable description for a voice."""
        descriptions = {
            IndianVoice.NEERJA: "Natural, warm female teacher voice (recommended)",
            IndianVoice.NEERJA_EXPRESSIVE: "Expressive female voice with more emotion",
            IndianVoice.PRABHAT: "Clear, professional male teacher voice"
        }
        return descriptions.get(voice, "Indian English voice")


# Singleton instance
tts_service = TTSService()

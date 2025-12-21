"""
PragnaPath - Base Agent Class
Foundation for all PragnaPath agents using Google ADK patterns.
Supports Groq, Gemini, and OpenRouter.
"""

import os
import asyncio
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
from dotenv import load_dotenv

# Force reload of .env file
load_dotenv(override=True)

# Check which API to use
USE_OPENROUTER = os.getenv("USE_OPENROUTER", "false").lower() == "true"
USE_GROQ = os.getenv("USE_GROQ", "false").lower() == "true"

# Print which provider is active (for debugging)
print(f"🔌 API Provider: {'OpenRouter' if USE_OPENROUTER else 'Groq' if USE_GROQ else 'Gemini'}")

if USE_OPENROUTER:
    from openai import OpenAI
elif USE_GROQ:
    from groq import Groq
else:
    from google import genai
    from google.genai import types


class BaseAgent(ABC):
    """
    Base class for all PragnaPath agents.
    Implements common functionality and ADK-style patterns.
    """
    
    def __init__(
        self,
        name: str,
        description: str,
        model: str = None
    ):
        self.name = name
        self.description = description
        self.use_groq = USE_GROQ
        self.use_openrouter = USE_OPENROUTER
        
        if self.use_openrouter:
            # OpenRouter for flexible model access
            self.model = model or os.getenv("OPENROUTER_MODEL", "deepseek/deepseek-r1-0528:free")
            api_key = os.getenv("OPENROUTER_API_KEY")
            if not api_key:
                raise ValueError("OPENROUTER_API_KEY required. Get at https://openrouter.ai/keys")
            self.client = OpenAI(
                base_url="https://openrouter.ai/api/v1",
                api_key=api_key
            )
        elif self.use_groq:
            # Groq for development (fast & free)
            self.model = model or os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
            api_key = os.getenv("GROQ_API_KEY")
            if not api_key:
                raise ValueError("GROQ_API_KEY required. Get free at https://console.groq.com/keys")
            self.client = Groq(api_key=api_key)
        else:
            # Gemini for demo
            self.model = model or os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
            api_key = os.getenv("GOOGLE_API_KEY")
            if not api_key:
                raise ValueError("GOOGLE_API_KEY environment variable is required")
            self.client = genai.Client(api_key=api_key)
        
        # Agent-specific system instruction
        self._system_instruction = self._build_system_instruction()
    
    @abstractmethod
    def _build_system_instruction(self) -> str:
        """Build the system instruction for this agent."""
        pass
    
    @abstractmethod
    async def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute the agent's primary task.
        
        Args:
            context: Dictionary containing session state, learner profile, etc.
            
        Returns:
            Dictionary containing the agent's output
        """
        pass
    
    async def generate(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2048
    ) -> str:
        """
        Generate a response using LLM (Groq, Gemini, or OpenRouter).
        """
        try:
            if self.use_openrouter or self.use_groq:
                # OpenRouter and Groq both use OpenAI-compatible API
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": system_instruction or self._system_instruction},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=temperature,
                    max_tokens=max_tokens
                )
                return response.choices[0].message.content
            else:
                # Gemini API
                response = self.client.models.generate_content(
                    model=self.model,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        system_instruction=system_instruction or self._system_instruction,
                        temperature=temperature,
                        max_output_tokens=max_tokens
                    )
                )
                return response.text
        except Exception as e:
            return f"Error generating response: {str(e)}"
    
    async def generate_json(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 0.3
    ) -> str:
        """
        Generate a JSON response using LLM (Groq, Gemini, or OpenRouter).
        """
        json_instruction = (system_instruction or self._system_instruction) + """

IMPORTANT: Respond ONLY with valid JSON. No markdown, no code blocks, no explanation.
Start directly with { and end with }."""
        
        try:
            if self.use_openrouter:
                # OpenRouter API (OpenAI-compatible, but not all models support response_format)
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": json_instruction},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=temperature,
                    max_tokens=2048
                )
                result = response.choices[0].message.content
                # Clean up response - remove markdown code blocks if present
                if result.startswith("```"):
                    lines = result.split("\n")
                    result = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
                return result.strip()
            elif self.use_groq:
                # Groq API
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": json_instruction},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=temperature,
                    max_tokens=2048,
                    response_format={"type": "json_object"}
                )
                return response.choices[0].message.content
            else:
                # Gemini API
                response = self.client.models.generate_content(
                    model=self.model,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        system_instruction=json_instruction,
                        temperature=temperature,
                        max_output_tokens=2048,
                        response_mime_type="application/json"
                    )
                )
                return response.text
        except Exception as e:
            return f'{{"error": "{str(e)}"}}'
    
    def get_agent_info(self) -> Dict[str, str]:
        """Get agent metadata."""
        return {
            "name": self.name,
            "description": self.description,
            "model": self.model
        }
    
    def __repr__(self) -> str:
        return f"<{self.__class__.__name__}(name='{self.name}')>"

"""
PragnaPath - Base Agent Class
Foundation for all PragnaPath agents using Google ADK patterns.
"""

import os
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()


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
        self.model = model or os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
        
        # Initialize Gemini client
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
        Generate a response using Gemini.
        
        Args:
            prompt: The user prompt
            system_instruction: Override the default system instruction
            temperature: Creativity level (0.0 - 1.0)
            max_tokens: Maximum response length
            
        Returns:
            Generated text response
        """
        try:
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
        Generate a JSON response using Gemini.
        Uses lower temperature for structured output.
        """
        json_instruction = (system_instruction or self._system_instruction) + """

IMPORTANT: Respond ONLY with valid JSON. No markdown, no code blocks, no explanation.
Start directly with { and end with }."""
        
        try:
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

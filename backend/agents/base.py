"""
PragnaPath - Base Agent Class with Multi-Provider Support
=========================================================
Foundation for all PragnaPath agents using Google ADK (Agent Development Kit)
with fallback support for OpenRouter and Groq.
https://google.github.io/adk-docs/
"""

import os
import httpx
import json
from typing import Any, Dict, Optional, Callable, List
from dotenv import load_dotenv

# Load environment variables
load_dotenv(override=True)

# ============================================
# PROVIDER CONFIGURATION
# ============================================
USE_OPENROUTER = os.getenv("USE_OPENROUTER", "false").lower() == "true"
USE_GROQ = os.getenv("USE_GROQ", "false").lower() == "true"

# OpenRouter config
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "openai/gpt-4o-mini-2024-07-18")

# Groq config
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")

# Google/ADK config
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")

# Determine active provider
if USE_OPENROUTER and OPENROUTER_API_KEY:
    ACTIVE_PROVIDER = "openrouter"
    ACTIVE_MODEL = OPENROUTER_MODEL
    print(f"🔌 Using OpenRouter with model: {OPENROUTER_MODEL}")
elif USE_GROQ and GROQ_API_KEY:
    ACTIVE_PROVIDER = "groq"
    ACTIVE_MODEL = GROQ_MODEL
    print(f"🔌 Using Groq with model: {GROQ_MODEL}")
elif GOOGLE_API_KEY:
    ACTIVE_PROVIDER = "google"
    ACTIVE_MODEL = GEMINI_MODEL
    os.environ["GOOGLE_API_KEY"] = GOOGLE_API_KEY
    print(f"🔌 Using Google ADK with model: {GEMINI_MODEL}")
else:
    raise ValueError("No valid API key found. Set GOOGLE_API_KEY, OPENROUTER_API_KEY, or GROQ_API_KEY")

# Import Google ADK (for ADK web interface and structure)
from google.adk.agents import LlmAgent, Agent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types
import re


def strip_markdown(text: str) -> str:
    """
    Remove markdown formatting from text for clean display.
    Removes **bold**, *italic*, __underline__, etc.
    """
    if not text:
        return text
    
    # Remove bold (**text** or __text__)
    text = re.sub(r'\*\*(.+?)\*\*', r'\1', text)
    text = re.sub(r'__(.+?)__', r'\1', text)
    
    # Remove italic (*text* or _text_) - but be careful not to remove underscores in words
    text = re.sub(r'(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)', r'\1', text)
    text = re.sub(r'(?<!_)_(?!_)(.+?)(?<!_)_(?!_)', r'\1', text)
    
    # Remove code backticks (but keep the content)
    text = re.sub(r'`(.+?)`', r'\1', text)
    
    # Remove markdown headers (#, ##, ###)
    text = re.sub(r'^#{1,6}\s*', '', text, flags=re.MULTILINE)
    
    # Clean up any double spaces
    text = re.sub(r'  +', ' ', text)
    
    return text.strip()


def create_llm_agent(
    name: str,
    instruction: str,
    description: str = "",
    tools: List[Callable] = None,
    sub_agents: List[Agent] = None,
    model: str = None
) -> LlmAgent:
    """
    Factory function to create a Google ADK LlmAgent.
    
    Args:
        name: Unique name for the agent
        instruction: System instruction for the agent
        description: Brief description of what the agent does
        tools: List of tool functions the agent can use
        sub_agents: List of sub-agents for multi-agent systems
        model: LLM model to use (defaults to GEMINI_MODEL)
    
    Returns:
        Configured LlmAgent instance
    """
    agent = LlmAgent(
        name=name,
        model=model or GEMINI_MODEL,
        instruction=instruction,
        description=description,
        tools=tools or [],
        sub_agents=sub_agents or []
    )
    return agent


# Session service singleton
_session_service = None

def get_session_service() -> InMemorySessionService:
    """Get or create the session service singleton."""
    global _session_service
    if _session_service is None:
        _session_service = InMemorySessionService()
    return _session_service


def create_runner(agent: Agent, app_name: str = "pragnapath") -> Runner:
    """
    Create a Runner for executing agent interactions.
    
    Args:
        agent: The root agent to run
        app_name: Application name for session management
    
    Returns:
        Configured Runner instance
    """
    return Runner(
        agent=agent,
        app_name=app_name,
        session_service=get_session_service()
    )


async def run_agent_async(
    runner: Runner,
    user_id: str,
    session_id: str,
    message: str
) -> str:
    """
    Run an agent with a message and return the response.
    
    Args:
        runner: The ADK Runner
        user_id: User identifier
        session_id: Session identifier
        message: User message to process
    
    Returns:
        Agent response text
    """
    # Create or get session
    session = await runner.session_service.get_session(
        app_name=runner.app_name,
        user_id=user_id,
        session_id=session_id
    )
    
    if not session:
        session = await runner.session_service.create_session(
            app_name=runner.app_name,
            user_id=user_id,
            session_id=session_id
        )
    
    # Create user message content
    content = types.Content(
        role="user",
        parts=[types.Part(text=message)]
    )
    
    # Run the agent and collect response
    response_text = ""
    async for event in runner.run_async(
        user_id=user_id,
        session_id=session_id,
        new_message=content
    ):
        if hasattr(event, 'content') and event.content:
            for part in event.content.parts:
                if hasattr(part, 'text') and part.text:
                    response_text += part.text
    
    return response_text


# ============================================
# LEGACY COMPATIBILITY LAYER
# ============================================
# This provides backward compatibility with existing agent code
# while we transition to full ADK usage

from abc import ABC, abstractmethod


class BaseAgent(ABC):
    """
    Legacy base class for PragnaPath agents.
    Wraps Google ADK functionality for backward compatibility.
    
    Note: New agents should use create_llm_agent() directly.
    """
    
    def __init__(
        self,
        name: str,
        description: str,
        model: str = None
    ):
        self.name = name
        self.description = description
        self.model = model or GEMINI_MODEL
        
        # Build system instruction
        self._system_instruction = self._build_system_instruction()
        
        # Create underlying ADK agent
        self._adk_agent = create_llm_agent(
            name=name,
            instruction=self._system_instruction,
            description=description,
            model=self.model
        )
        
        # Create runner for this agent
        self._runner = create_runner(self._adk_agent)
    
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
        Generate a response using the active provider (OpenRouter, Groq, or Google).
        """
        system_msg = system_instruction or self._system_instruction
        
        try:
            if ACTIVE_PROVIDER == "openrouter":
                return await self._generate_openrouter(prompt, system_msg, temperature, max_tokens)
            elif ACTIVE_PROVIDER == "groq":
                return await self._generate_groq(prompt, system_msg, temperature, max_tokens)
            else:
                return await self._generate_google(prompt, system_msg, temperature, max_tokens)
        except Exception as e:
            return f"Error generating response: {str(e)}"
    
    async def _generate_openrouter(self, prompt: str, system_msg: str, temperature: float, max_tokens: int) -> str:
        """Generate using OpenRouter API."""
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://pragnapath.app",
                    "X-Title": "PragnaPath"
                },
                json={
                    "model": OPENROUTER_MODEL,
                    "messages": [
                        {"role": "system", "content": system_msg},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": temperature,
                    "max_tokens": max_tokens
                }
            )
            data = response.json()
            if "choices" in data and len(data["choices"]) > 0:
                return data["choices"][0]["message"]["content"]
            elif "error" in data:
                return f"OpenRouter Error: {data['error'].get('message', str(data['error']))}"
            return "No response from OpenRouter"
    
    async def _generate_groq(self, prompt: str, system_msg: str, temperature: float, max_tokens: int) -> str:
        """Generate using Groq API."""
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": GROQ_MODEL,
                    "messages": [
                        {"role": "system", "content": system_msg},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": temperature,
                    "max_tokens": max_tokens
                }
            )
            data = response.json()
            if "choices" in data and len(data["choices"]) > 0:
                return data["choices"][0]["message"]["content"]
            elif "error" in data:
                return f"Groq Error: {data['error'].get('message', str(data['error']))}"
            return "No response from Groq"
    
    async def _generate_google(self, prompt: str, system_msg: str, temperature: float, max_tokens: int) -> str:
        """Generate using Google Gemini API."""
        from google import genai
        
        client = genai.Client(api_key=GOOGLE_API_KEY)
        
        response = client.models.generate_content(
            model=self.model,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_msg,
                temperature=temperature,
                max_output_tokens=max_tokens
            )
        )
        return response.text
    
    async def generate_json(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 0.3
    ) -> str:
        """
        Generate a JSON response using the active provider.
        """
        json_instruction = (system_instruction or self._system_instruction) + """

IMPORTANT: Respond ONLY with valid JSON. No markdown, no code blocks, no explanation.
Start directly with { and end with }."""
        
        try:
            response = await self.generate(prompt, json_instruction, temperature, 2048)
            # Clean up response - remove markdown code blocks if present
            response = response.strip()
            if response.startswith("```json"):
                response = response[7:]
            if response.startswith("```"):
                response = response[3:]
            if response.endswith("```"):
                response = response[:-3]
            return response.strip()
        except Exception as e:
            return f'{{"error": "{str(e)}"}}'
    
    async def run_with_adk(self, user_id: str, session_id: str, message: str) -> str:
        """
        Run this agent using the full ADK pipeline.
        
        Args:
            user_id: User identifier
            session_id: Session identifier  
            message: User message to process
            
        Returns:
            Agent response text
        """
        return await run_agent_async(
            runner=self._runner,
            user_id=user_id,
            session_id=session_id,
            message=message
        )
    
    def get_adk_agent(self) -> LlmAgent:
        """Get the underlying ADK agent."""
        return self._adk_agent
    
    def get_agent_info(self) -> Dict[str, str]:
        """Get agent metadata."""
        return {
            "name": self.name,
            "description": self.description,
            "model": ACTIVE_MODEL,
            "provider": ACTIVE_PROVIDER,
            "framework": "Google ADK"
        }
    
    def __repr__(self) -> str:
        return f"<{self.__class__.__name__}(name='{self.name}', provider='{ACTIVE_PROVIDER}')>"


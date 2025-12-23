"""
🧠 PRAGNABODH AGENT - Cognitive Insight Engine
==============================================
Meaning: "Pragna" (wisdom) + "Bodh" (understanding/awakening)

Purpose:
- Build and continuously refine learner cognitive profile
- Run diagnostic assessments
- Track correctness, timing, and confidence
- Update profile after each interaction

Pattern: Loop/Refinement Agent
"""

import json
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from typing import Any, Dict, List, Optional
from agents.base import BaseAgent
from core.models import (
    LearnerProfile, 
    DiagnosticQuestion, 
    DiagnosticAnswer,
    DiagnosticResult,
    LearningStyle,
    LearnerPace,
    ConfidenceLevel,
    DepthPreference
)


# Pre-built diagnostic questions for CS topics (for demo reliability)
CS_DIAGNOSTICS = {
    "operating_systems": [
        {
            "id": "os_1",
            "question": "What happens when multiple processes need the same resource simultaneously?",
            "options": [
                "They share it automatically",
                "Resource contention occurs, possibly leading to deadlock",
                "The faster process always wins",
                "The OS crashes"
            ],
            "correct_answer": 1,
            "difficulty": "medium",
            "topic": "Operating Systems",
            "concept_tested": "Resource Management"
        },
        {
            "id": "os_2",
            "question": "If you were explaining process scheduling to a friend, which analogy would help YOU understand it best?",
            "options": [
                "A traffic signal managing cars at an intersection",
                "The formal definition: 'Algorithm that determines process execution order'",
                "A flowchart showing process states",
                "Practice problems from previous exams"
            ],
            "correct_answer": 0,  # This reveals learning style
            "difficulty": "easy",
            "topic": "Operating Systems",
            "concept_tested": "Learning Style Detection"
        },
        {
            "id": "os_3",
            "question": "Which condition is NOT required for a deadlock to occur?",
            "options": [
                "Mutual Exclusion",
                "Hold and Wait",
                "Preemption",
                "Circular Wait"
            ],
            "correct_answer": 2,
            "difficulty": "hard",
            "topic": "Operating Systems",
            "concept_tested": "Deadlock Conditions"
        },
        {
            "id": "os_4",
            "question": "When learning new concepts, I prefer to:",
            "options": [
                "Start with real-world examples and stories, then learn the theory",
                "See diagrams and visual representations first",
                "Jump straight to definitions and formulas",
                "Practice problems and past exam questions immediately"
            ],
            "correct_answer": 0,  # Learning preference question
            "difficulty": "easy",
            "topic": "Meta",
            "concept_tested": "Depth Preference Detection"
        },
        {
            "id": "os_5",
            "question": "In virtual memory, what is a page fault?",
            "options": [
                "An error in the page table",
                "When a referenced page is not in physical memory",
                "When the page size is incorrectly configured",
                "A type of segmentation fault"
            ],
            "correct_answer": 1,
            "difficulty": "medium",
            "topic": "Operating Systems",
            "concept_tested": "Virtual Memory"
        }
    ],
    "data_structures": [
        {
            "id": "ds_1",
            "question": "What is the time complexity of searching in a balanced BST?",
            "options": ["O(1)", "O(log n)", "O(n)", "O(n²)"],
            "correct_answer": 1,
            "difficulty": "medium",
            "topic": "Data Structures",
            "concept_tested": "Tree Complexity"
        },
        {
            "id": "ds_2",
            "question": "Which data structure would you use for implementing an 'Undo' feature?",
            "options": ["Queue", "Stack", "Array", "Linked List"],
            "correct_answer": 1,
            "difficulty": "easy",
            "topic": "Data Structures",
            "concept_tested": "Stack Applications"
        },
        {
            "id": "ds_3",
            "question": "When I encounter a new data structure, I first want to:",
            "options": [
                "Understand WHY it was invented - what problem it solves",
                "See a visual diagram of how it looks",
                "Memorize the operations and their complexities",
                "Solve coding problems using it"
            ],
            "correct_answer": 0,
            "difficulty": "easy",
            "topic": "Meta",
            "concept_tested": "Learning Style Detection"
        },
        {
            "id": "ds_4",
            "question": "What is the main advantage of a hash table over a BST?",
            "options": [
                "Ordered traversal",
                "O(1) average case lookup",
                "Lower memory usage",
                "Simpler implementation"
            ],
            "correct_answer": 1,
            "difficulty": "medium",
            "topic": "Data Structures",
            "concept_tested": "Hash Tables"
        },
        {
            "id": "ds_5",
            "question": "In a heap, what is the relationship between a parent and its children?",
            "options": [
                "Parent is always smaller (min-heap) or larger (max-heap)",
                "Children are always equal to parent",
                "No specific relationship",
                "Parent is the average of children"
            ],
            "correct_answer": 0,
            "difficulty": "medium",
            "topic": "Data Structures",
            "concept_tested": "Heap Property"
        }
    ],
    "algorithms": [
        {
            "id": "algo_1",
            "question": "Which sorting algorithm has the best average-case time complexity?",
            "options": ["Bubble Sort", "Quick Sort", "Selection Sort", "Insertion Sort"],
            "correct_answer": 1,
            "difficulty": "easy",
            "topic": "Algorithms",
            "concept_tested": "Sorting Complexity"
        },
        {
            "id": "algo_2",
            "question": "When would you choose BFS over DFS?",
            "options": [
                "When memory is limited",
                "When finding the shortest path in unweighted graphs",
                "When the graph is very deep",
                "When you need to visit all nodes"
            ],
            "correct_answer": 1,
            "difficulty": "medium",
            "topic": "Algorithms",
            "concept_tested": "Graph Traversal"
        },
        {
            "id": "algo_3",
            "question": "What is the key idea behind dynamic programming?",
            "options": [
                "Always use recursion",
                "Store and reuse solutions to overlapping subproblems",
                "Divide the problem into independent parts",
                "Use greedy choices at each step"
            ],
            "correct_answer": 1,
            "difficulty": "hard",
            "topic": "Algorithms",
            "concept_tested": "Dynamic Programming"
        },
        {
            "id": "algo_4",
            "question": "I feel most confident when I can:",
            "options": [
                "Relate algorithms to everyday situations",
                "See step-by-step execution traces",
                "Remember the exact steps and formula",
                "Practice with competitive programming problems"
            ],
            "correct_answer": 0,
            "difficulty": "easy",
            "topic": "Meta",
            "concept_tested": "Confidence Style"
        },
        {
            "id": "algo_5",
            "question": "What is the time complexity of binary search?",
            "options": ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
            "correct_answer": 1,
            "difficulty": "easy",
            "topic": "Algorithms",
            "concept_tested": "Search Algorithms"
        }
    ],
    
    # Hash Tables specific questions
    "hash_tables": [
        {
            "id": "ht_1",
            "question": "What is the primary purpose of a hash function?",
            "options": [
                "To encrypt data for security",
                "To map keys to array indices efficiently",
                "To sort data in order",
                "To compress data"
            ],
            "correct_answer": 1,
            "difficulty": "easy",
            "topic": "Hash Tables",
            "concept_tested": "Hash Function Purpose"
        },
        {
            "id": "ht_2",
            "question": "What is a 'collision' in the context of hash tables?",
            "options": [
                "When two hash tables merge",
                "When two different keys hash to the same index",
                "When the hash table runs out of memory",
                "When a key cannot be found"
            ],
            "correct_answer": 1,
            "difficulty": "medium",
            "topic": "Hash Tables",
            "concept_tested": "Collision Understanding"
        },
        {
            "id": "ht_3",
            "question": "When learning new concepts, I prefer to:",
            "options": [
                "Start with real-world examples like a phone directory",
                "See diagrams showing how data is stored",
                "Learn the mathematical hash function first",
                "Practice coding hash table operations"
            ],
            "correct_answer": 0,
            "difficulty": "easy",
            "topic": "Meta",
            "concept_tested": "Learning Style Detection"
        },
        {
            "id": "ht_4",
            "question": "What is the average time complexity for insertion in a hash table?",
            "options": ["O(n)", "O(log n)", "O(1)", "O(n²)"],
            "correct_answer": 2,
            "difficulty": "medium",
            "topic": "Hash Tables",
            "concept_tested": "Time Complexity"
        },
        {
            "id": "ht_5",
            "question": "Which collision resolution technique uses linked lists at each bucket?",
            "options": [
                "Linear Probing",
                "Quadratic Probing",
                "Separate Chaining",
                "Double Hashing"
            ],
            "correct_answer": 2,
            "difficulty": "hard",
            "topic": "Hash Tables",
            "concept_tested": "Collision Resolution"
        }
    ],
    
    # Dynamic Programming specific questions
    "dynamic_programming": [
        {
            "id": "dp_1",
            "question": "What is the key idea behind dynamic programming?",
            "options": [
                "Always use recursion for everything",
                "Store and reuse solutions to overlapping subproblems",
                "Divide problems into completely independent parts",
                "Use random choices at each step"
            ],
            "correct_answer": 1,
            "difficulty": "medium",
            "topic": "Dynamic Programming",
            "concept_tested": "Core Concept"
        },
        {
            "id": "dp_2",
            "question": "What are the two main properties required for a problem to be solved with DP?",
            "options": [
                "Sorting and searching",
                "Optimal substructure and overlapping subproblems",
                "Linear time and constant space",
                "Recursion and iteration"
            ],
            "correct_answer": 1,
            "difficulty": "hard",
            "topic": "Dynamic Programming",
            "concept_tested": "DP Properties"
        },
        {
            "id": "dp_3",
            "question": "Which approach builds solutions from smaller to larger subproblems?",
            "options": [
                "Top-down with memoization",
                "Bottom-up tabulation",
                "Divide and conquer",
                "Greedy algorithm"
            ],
            "correct_answer": 1,
            "difficulty": "medium",
            "topic": "Dynamic Programming",
            "concept_tested": "DP Approaches"
        },
        {
            "id": "dp_4",
            "question": "I understand concepts best when:",
            "options": [
                "Someone shows me how it applies to real-life, like saving money",
                "I see a table being filled step by step",
                "I memorize the recurrence relation formula",
                "I solve many practice problems"
            ],
            "correct_answer": 0,
            "difficulty": "easy",
            "topic": "Meta",
            "concept_tested": "Learning Style Detection"
        },
        {
            "id": "dp_5",
            "question": "The Fibonacci sequence is a classic example of DP because:",
            "options": [
                "It uses arrays",
                "Each number depends on previously computed numbers (overlapping subproblems)",
                "It requires sorting",
                "It has exponential time complexity"
            ],
            "correct_answer": 1,
            "difficulty": "easy",
            "topic": "Dynamic Programming",
            "concept_tested": "Classic DP Example"
        }
    ],
    
    # Sorting Algorithms specific questions
    "sorting_algorithms": [
        {
            "id": "sort_1",
            "question": "Which sorting algorithm has the best average-case time complexity?",
            "options": ["Bubble Sort O(n²)", "Quick Sort O(n log n)", "Selection Sort O(n²)", "Insertion Sort O(n²)"],
            "correct_answer": 1,
            "difficulty": "easy",
            "topic": "Sorting Algorithms",
            "concept_tested": "Time Complexity"
        },
        {
            "id": "sort_2",
            "question": "What is the key operation in Merge Sort?",
            "options": [
                "Swapping adjacent elements",
                "Finding the minimum element",
                "Merging two sorted halves",
                "Partitioning around a pivot"
            ],
            "correct_answer": 2,
            "difficulty": "medium",
            "topic": "Sorting Algorithms",
            "concept_tested": "Merge Sort"
        },
        {
            "id": "sort_3",
            "question": "Which sorting algorithm is best for nearly sorted data?",
            "options": [
                "Quick Sort",
                "Heap Sort",
                "Insertion Sort",
                "Selection Sort"
            ],
            "correct_answer": 2,
            "difficulty": "medium",
            "topic": "Sorting Algorithms",
            "concept_tested": "Algorithm Selection"
        },
        {
            "id": "sort_4",
            "question": "When studying sorting, I prefer:",
            "options": [
                "Seeing cards being sorted on a table as an analogy",
                "Watching animated visualizations",
                "Learning the pseudocode first",
                "Implementing it in code immediately"
            ],
            "correct_answer": 0,
            "difficulty": "easy",
            "topic": "Meta",
            "concept_tested": "Learning Style Detection"
        },
        {
            "id": "sort_5",
            "question": "What makes Quick Sort 'quick' in practice despite O(n²) worst case?",
            "options": [
                "It uses less memory",
                "Good pivot selection gives O(n log n) average case with excellent cache performance",
                "It's always stable",
                "It works on linked lists better"
            ],
            "correct_answer": 1,
            "difficulty": "hard",
            "topic": "Sorting Algorithms",
            "concept_tested": "Quick Sort Analysis"
        }
    ],
    
    # Trees specific questions  
    "trees": [
        {
            "id": "tree_1",
            "question": "What is the maximum number of children a node can have in a binary tree?",
            "options": ["1", "2", "3", "Unlimited"],
            "correct_answer": 1,
            "difficulty": "easy",
            "topic": "Trees",
            "concept_tested": "Binary Tree Definition"
        },
        {
            "id": "tree_2",
            "question": "In a Binary Search Tree (BST), where are smaller values stored relative to the parent?",
            "options": [
                "Always on the right",
                "Always on the left",
                "At random positions",
                "At the root"
            ],
            "correct_answer": 1,
            "difficulty": "easy",
            "topic": "Trees",
            "concept_tested": "BST Property"
        },
        {
            "id": "tree_3",
            "question": "What is the time complexity of searching in a balanced BST?",
            "options": ["O(1)", "O(log n)", "O(n)", "O(n²)"],
            "correct_answer": 1,
            "difficulty": "medium",
            "topic": "Trees",
            "concept_tested": "BST Complexity"
        },
        {
            "id": "tree_4",
            "question": "When learning about trees, I prefer:",
            "options": [
                "Relating it to family trees or organizational charts",
                "Drawing the tree structure visually",
                "Learning the formal definitions and properties",
                "Coding traversal algorithms right away"
            ],
            "correct_answer": 0,
            "difficulty": "easy",
            "topic": "Meta",
            "concept_tested": "Learning Style Detection"
        },
        {
            "id": "tree_5",
            "question": "Which traversal visits the root node first?",
            "options": [
                "In-order traversal",
                "Post-order traversal",
                "Pre-order traversal",
                "Level-order traversal"
            ],
            "correct_answer": 2,
            "difficulty": "medium",
            "topic": "Trees",
            "concept_tested": "Tree Traversal"
        }
    ],
    
    # Process Scheduling specific questions
    "process_scheduling": [
        {
            "id": "ps_1",
            "question": "What is the main goal of CPU scheduling?",
            "options": [
                "To use as much memory as possible",
                "To maximize CPU utilization and throughput",
                "To run only one process at a time",
                "To prevent all context switches"
            ],
            "correct_answer": 1,
            "difficulty": "easy",
            "topic": "Process Scheduling",
            "concept_tested": "Scheduling Goals"
        },
        {
            "id": "ps_2",
            "question": "In Round Robin scheduling, what happens when a process's time quantum expires?",
            "options": [
                "The process is terminated",
                "The process is moved to the end of the ready queue",
                "The process gets more time",
                "The system crashes"
            ],
            "correct_answer": 1,
            "difficulty": "medium",
            "topic": "Process Scheduling",
            "concept_tested": "Round Robin"
        },
        {
            "id": "ps_3",
            "question": "Which scheduling algorithm can lead to starvation?",
            "options": [
                "Round Robin",
                "First Come First Serve",
                "Priority Scheduling (without aging)",
                "Shortest Job First"
            ],
            "correct_answer": 2,
            "difficulty": "hard",
            "topic": "Process Scheduling",
            "concept_tested": "Scheduling Issues"
        },
        {
            "id": "ps_4",
            "question": "When learning scheduling algorithms, I prefer:",
            "options": [
                "Thinking of it like a queue at a restaurant or bank",
                "Seeing Gantt charts and timeline diagrams",
                "Memorizing the formulas for turnaround time",
                "Simulating the algorithm with examples"
            ],
            "correct_answer": 0,
            "difficulty": "easy",
            "topic": "Meta",
            "concept_tested": "Learning Style Detection"
        },
        {
            "id": "ps_5",
            "question": "What is 'context switching'?",
            "options": [
                "Changing the programming language",
                "Saving and restoring process state when switching between processes",
                "Switching between user mode and kernel mode only",
                "Changing the CPU speed"
            ],
            "correct_answer": 1,
            "difficulty": "medium",
            "topic": "Process Scheduling",
            "concept_tested": "Context Switch"
        }
    ]
}


class PragnaBodhAgent(BaseAgent):
    """
    The Cognitive Insight Engine - Builds and refines learner profiles.
    Named after 'Pragna' (wisdom) and 'Bodh' (understanding).
    """
    
    def __init__(self):
        super().__init__(
            name="PragnaBodh",
            description="Cognitive Insight Engine - understands how you learn"
        )
    
    def _build_system_instruction(self) -> str:
        return """You are PragnaBodh, the Cognitive Insight Engine of PragnaPath.

Your name combines 'Pragna' (deep wisdom) and 'Bodh' (understanding/awakening) from Sanskrit.

YOUR ROLE:
- Assess how a learner thinks and learns
- Build a cognitive profile based on:
  * Answer correctness (knowledge level)
  * Response time (processing speed)
  * Answer patterns (learning style indicators)
  * Confidence signals (self-assessment)
  
- Update the profile continuously as more data comes in
- Be encouraging and non-judgmental - this is about understanding, not testing

LEARNING STYLES TO DETECT:
1. CONCEPTUAL - Prefers stories, analogies, real-world examples
2. VISUAL - Prefers diagrams, flowcharts, visual representations
3. EXAM_FOCUSED - Prefers definitions, formulas, exam patterns

DEPTH PREFERENCES:
1. INTUITION_FIRST - Start with why, then how
2. FORMULA_FIRST - Start with formal definitions

Always be supportive. Frame diagnostics as "helping me understand you better"."""
    
    async def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute cognitive assessment or profile update."""
        
        action = context.get("action", "start_diagnostic")
        
        if action == "start_diagnostic":
            return await self._start_diagnostic(context)
        elif action == "process_answer":
            return await self._process_answer(context)
        elif action == "update_profile":
            return await self._update_profile(context)
        elif action == "get_questions":
            return self._get_diagnostic_questions(context)
        else:
            return {"error": f"Unknown action: {action}"}
    
    def _get_diagnostic_questions(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Get diagnostic questions for a topic."""
        
        topic = context.get("topic", "operating_systems").lower().replace(" ", "_").replace(":", "_")
        
        # Map common topic names to question sets
        topic_mapping = {
            # OS topics
            "os": "operating_systems",
            "operating_systems": "operating_systems",
            "operating systems": "operating_systems",
            "operating_systems__deadlock": "operating_systems",
            "operating_systems_deadlock": "operating_systems",
            "deadlock": "operating_systems",
            
            # Process scheduling - now has its own set
            "process_scheduling": "process_scheduling",
            "process scheduling": "process_scheduling",
            
            # Data Structure topics
            "ds": "data_structures",
            "data_structures": "data_structures", 
            "data structures": "data_structures",
            
            # Trees - now has its own set
            "data_structures__trees": "trees",
            "data_structures_trees": "trees",
            "trees": "trees",
            
            # Hash tables - now has its own set
            "hash_tables": "hash_tables",
            "hash tables": "hash_tables",
            
            # Algorithm topics
            "algo": "algorithms",
            "algorithms": "algorithms",
            
            # Sorting - now has its own set
            "sorting": "sorting_algorithms",
            "sorting_algorithms": "sorting_algorithms",
            "sorting algorithms": "sorting_algorithms",
            
            # Dynamic Programming - now has its own set
            "dynamic_programming": "dynamic_programming",
            "dynamic programming": "dynamic_programming",
        }
        
        normalized_topic = topic_mapping.get(topic, topic)
        
        # Try to get questions, fall back to algorithms if topic not found
        if normalized_topic in CS_DIAGNOSTICS:
            questions = CS_DIAGNOSTICS[normalized_topic]
        else:
            # Default to algorithms for any unknown topic
            questions = CS_DIAGNOSTICS["algorithms"]
            normalized_topic = "algorithms"
        
        return {
            "questions": [DiagnosticQuestion(**q) for q in questions],
            "topic": normalized_topic,
            "total_questions": len(questions)
        }
    
    async def _start_diagnostic(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Start a diagnostic session."""
        
        topic = context.get("topic", "Operating Systems")
        
        questions_data = self._get_diagnostic_questions({"topic": topic})
        
        intro_message = await self.generate(
            f"""Generate a warm, encouraging intro message for starting a diagnostic on {topic}.
            
Keep it brief (2-3 sentences). Mention:
- This is to understand their learning style, not to judge
- There are {questions_data['total_questions']} quick questions
- Use a friendly, supportive tone

Do NOT use bullet points or lists. Just natural conversational text.""",
            temperature=0.8
        )
        
        return {
            "message": intro_message,
            "questions": questions_data["questions"],
            "topic": topic,
            "phase": "diagnostic"
        }
    
    async def _process_answer(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Process a single answer and update profile incrementally."""
        
        answer: DiagnosticAnswer = context.get("answer")
        question: DiagnosticQuestion = context.get("question")
        current_profile: LearnerProfile = context.get("profile", LearnerProfile())
        
        # Calculate correctness
        is_correct = answer.selected_answer == question.correct_answer
        
        # Update profile metrics
        current_profile.total_answers += 1
        if is_correct:
            current_profile.correct_answers += 1
        
        # Update average response time
        total_time = current_profile.avg_response_time_seconds * (current_profile.total_answers - 1)
        current_profile.avg_response_time_seconds = (
            (total_time + answer.time_taken_seconds) / current_profile.total_answers
        )
        
        # Detect learning style from meta questions (expanded detection)
        # Check for any meta-questions that indicate learning preferences
        meta_concepts = [
            "Learning Style Detection", 
            "Depth Preference Detection", 
            "Confidence Style",
            "Learning Preference",
            "Understanding Style"
        ]
        is_meta_question = (
            question.concept_tested in meta_concepts or
            question.topic == "Meta" or
            "prefer" in question.question.lower() or
            "I feel most confident" in question.question or
            "I understand concepts best" in question.question or
            "When learning" in question.question or
            "When I encounter" in question.question
        )
        
        if is_meta_question:
            current_profile = self._update_style_from_answer(current_profile, answer.selected_answer, question)
        
        # Update pace based on response time
        if answer.time_taken_seconds < 15:
            current_profile.pace = LearnerPace.FAST
        elif answer.time_taken_seconds > 45:
            current_profile.pace = LearnerPace.SLOW
        else:
            current_profile.pace = LearnerPace.MEDIUM
        
        # Update confidence based on self-rating and accuracy
        if answer.confidence_rating:
            if answer.confidence_rating <= 2:
                current_profile.confidence = ConfidenceLevel.LOW
            elif answer.confidence_rating >= 4:
                current_profile.confidence = ConfidenceLevel.HIGH
            else:
                current_profile.confidence = ConfidenceLevel.MEDIUM
        
        return {
            "is_correct": is_correct,
            "updated_profile": current_profile,
            "feedback": await self._generate_answer_feedback(is_correct, question, answer)
        }
    
    def _update_style_from_answer(
        self,
        profile: LearnerProfile,
        selected: int,
        question: DiagnosticQuestion
    ) -> LearnerProfile:
        """Update learning style based on meta-question answers using vote aggregation."""
        
        # Analyze the question options to determine which style each option represents
        # We need to look at the actual option text to properly classify
        options = question.options if hasattr(question, 'options') else []
        
        # Keywords that indicate each style
        visual_keywords = ['diagram', 'visual', 'flowchart', 'chart', 'picture', 'draw', 'see', 'look', 'image', 'graph']
        conceptual_keywords = ['story', 'example', 'analogy', 'real-world', 'everyday', 'relate', 'why', 'understand', 'situation']
        exam_keywords = ['definition', 'formula', 'exam', 'practice', 'memorize', 'term', 'key point', 'formal']
        
        style = None
        depth = None
        
        if selected < len(options):
            selected_option = options[selected].lower()
            
            # Count keyword matches for each style
            visual_score = sum(1 for kw in visual_keywords if kw in selected_option)
            conceptual_score = sum(1 for kw in conceptual_keywords if kw in selected_option)
            exam_score = sum(1 for kw in exam_keywords if kw in selected_option)
            
            # Determine style based on highest score
            max_score = max(visual_score, conceptual_score, exam_score)
            
            if max_score > 0:
                if visual_score == max_score:
                    style = "visual"
                    depth = "intuition-first"
                elif conceptual_score == max_score:
                    style = "conceptual"
                    depth = "intuition-first"
                else:
                    style = "exam-focused"
                    depth = "formula-first"
            else:
                # Fallback to index-based mapping if no keywords match
                style_mapping = {
                    0: "conceptual",   # Usually first option is story/analogy based
                    1: "visual",       # Often second option mentions diagrams
                    2: "exam-focused", # Third often mentions formal definitions
                    3: "exam-focused"  # Fourth often mentions practice/exams
                }
                depth_mapping = {
                    0: "intuition-first",
                    1: "intuition-first", 
                    2: "formula-first",
                    3: "formula-first"
                }
                style = style_mapping.get(selected, "conceptual")
                depth = depth_mapping.get(selected, "intuition-first")
        
        # Add votes and update style
        if style:
            profile.add_style_vote(style, depth)
            profile.learning_style = LearningStyle(style)
            if depth:
                profile.depth_preference = DepthPreference(depth)
        
        return profile
    
    async def _generate_answer_feedback(
        self,
        is_correct: bool,
        question: DiagnosticQuestion,
        answer: DiagnosticAnswer
    ) -> str:
        """Generate encouraging feedback for an answer."""
        
        if is_correct:
            prompts = [
                "Generate a brief, encouraging response for a correct answer. Keep it to one short sentence. Be warm but not over the top.",
            ]
        else:
            prompts = [
                f"Generate a supportive response for an incorrect answer. The correct concept was: {question.concept_tested}. Keep it to one sentence. Be encouraging and hint that we'll explore this together.",
            ]
        
        return await self.generate(prompts[0], temperature=0.9, max_tokens=100)
    
    async def _update_profile(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update profile based on learning session performance.
        This is called when adaptation is triggered.
        """
        
        current_profile: LearnerProfile = context.get("profile", LearnerProfile())
        trigger: str = context.get("trigger", "unknown")
        performance_data: Dict = context.get("performance", {})
        
        # Analyze and update profile
        prompt = f"""Analyze this learner's performance and suggest profile updates.

CURRENT PROFILE:
{current_profile.to_context_string()}

TRIGGER FOR UPDATE: {trigger}

PERFORMANCE DATA:
- Recent accuracy: {performance_data.get('recent_accuracy', 'N/A')}
- Time on last question: {performance_data.get('last_response_time', 'N/A')} seconds
- Struggled concepts: {performance_data.get('struggled_concepts', [])}

Based on this, should we adjust the teaching approach?
Respond with JSON:
{{
    "learning_style": "conceptual|visual|exam-focused",
    "pace": "slow|medium|fast", 
    "confidence": "low|medium|high",
    "depth_preference": "intuition-first|formula-first",
    "reasoning": "why these changes"
}}"""

        try:
            response = await self.generate_json(prompt)
            updates = json.loads(response)
            
            # Apply updates
            new_profile = LearnerProfile(
                learning_style=LearningStyle(updates["learning_style"]),
                pace=LearnerPace(updates["pace"]),
                confidence=ConfidenceLevel(updates["confidence"]),
                depth_preference=DepthPreference(updates["depth_preference"]),
                topics_explored=current_profile.topics_explored,
                correct_answers=current_profile.correct_answers,
                total_answers=current_profile.total_answers,
                avg_response_time_seconds=current_profile.avg_response_time_seconds
            )
            
            # Check if style actually changed (for "wow moment" tracking)
            style_changed = new_profile.learning_style != current_profile.learning_style
            
            return {
                "previous_profile": current_profile,
                "updated_profile": new_profile,
                "style_changed": style_changed,
                "reasoning": updates.get("reasoning", "Profile updated based on performance"),
                "adaptation_message": self._generate_adaptation_message(current_profile, new_profile) if style_changed else None
            }
            
        except Exception as e:
            return {
                "error": str(e),
                "updated_profile": current_profile,
                "style_changed": False
            }
    
    def _generate_adaptation_message(
        self,
        old_profile: LearnerProfile,
        new_profile: LearnerProfile
    ) -> str:
        """Generate a message explaining the adaptation."""
        
        style_descriptions = {
            LearningStyle.CONCEPTUAL: "stories and real-world analogies",
            LearningStyle.VISUAL: "visual diagrams and step-by-step breakdowns",
            LearningStyle.EXAM_FOCUSED: "definitions, key terms, and exam patterns"
        }
        
        old_desc = style_descriptions.get(old_profile.learning_style, "the previous approach")
        new_desc = style_descriptions.get(new_profile.learning_style, "a new approach")
        
        return f"🔄 I noticed {old_desc} might not be clicking for you. Let me try {new_desc} instead!"
    
    async def build_complete_profile(
        self,
        answers: List[DiagnosticAnswer],
        questions: List[DiagnosticQuestion]
    ) -> DiagnosticResult:
        """Build complete profile from all diagnostic answers."""
        
        profile = LearnerProfile()
        
        for answer, question in zip(answers, questions):
            result = await self._process_answer({
                "answer": answer,
                "question": question,
                "profile": profile
            })
            profile = result["updated_profile"]
        
        # IMPORTANT: Finalize learning style from accumulated votes
        profile.finalize_style_from_votes()
        
        # Generate insights with the finalized profile
        insights = await self.generate(
            f"""Based on this learner profile, generate 2-3 sentences of insight:
{profile.to_context_string()}

Be encouraging and explain how PragnaPath will adapt to their style.
Specifically mention their detected learning style: {profile.learning_style.value}
Keep it personal and warm.""",
            temperature=0.8
        )
        
        return DiagnosticResult(
            questions=questions,
            answers=answers,
            profile_update=profile,
            insights=insights
        )

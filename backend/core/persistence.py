"""
PragnaPath - Lightweight User Persistence
MongoDB-based storage for user profiles and progress.
Gracefully degrades to in-memory if MongoDB is unavailable.
"""

import os
import uuid
import logging
from datetime import datetime
from typing import Optional, Dict, Any, List
from contextlib import asynccontextmanager

logger = logging.getLogger(__name__)

# MongoDB imports - optional dependency
try:
    from motor.motor_asyncio import AsyncIOMotorClient
    from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
    MONGODB_AVAILABLE = True
except ImportError:
    MONGODB_AVAILABLE = False
    logger.warning("Motor/PyMongo not installed. Running without persistence.")


class UserPersistence:
    """
    Lightweight persistence layer for user data.
    Stores: user_id, learner profile, per-topic progress.
    Falls back to in-memory if MongoDB unavailable.
    """
    
    def __init__(self):
        self._client: Optional[Any] = None
        self._db: Optional[Any] = None
        self._connected: bool = False
        self._in_memory_store: Dict[str, Dict] = {}  # Fallback storage
        
    async def connect(self) -> bool:
        """
        Attempt to connect to MongoDB.
        Returns True if connected, False if falling back to in-memory.
        """
        if not MONGODB_AVAILABLE:
            logger.info("MongoDB driver not available. Using in-memory storage.")
            return False
            
        mongo_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
        db_name = os.getenv("MONGODB_DB", "pragnapath")
        
        if not mongo_uri or mongo_uri == "mongodb://localhost:27017":
            logger.info("No MONGODB_URI configured. Using in-memory storage.")
            return False
        
        try:
            self._client = AsyncIOMotorClient(
                mongo_uri,
                serverSelectionTimeoutMS=10000,  # 10s for Atlas cloud
                connectTimeoutMS=10000,
                retryWrites=True
            )
            # Test connection
            await self._client.admin.command('ping')
            self._db = self._client[db_name]
            self._connected = True
            
            # Create indexes for efficient lookups
            await self._ensure_indexes()
            
            logger.info(f"✅ Connected to MongoDB: {db_name}")
            return True
            
        except (ConnectionFailure, ServerSelectionTimeoutError) as e:
            logger.warning(f"MongoDB unavailable ({e}). Using in-memory storage.")
            self._connected = False
            return False
        except Exception as e:
            logger.warning(f"MongoDB connection error: {e}. Using in-memory storage.")
            self._connected = False
            return False
    
    async def _ensure_indexes(self):
        """Create database indexes for efficient queries."""
        if not self._connected or self._db is None:
            return
            
        try:
            # Users collection - indexed by user_id
            await self._db.users.create_index("user_id", unique=True)
            
            # Profiles collection - separate table for learner profiles
            await self._db.profiles.create_index("user_id", unique=True)
            
            # Profile history collection - for tracking profile evolution
            await self._db.profile_history.create_index([
                ("user_id", 1),
                ("timestamp", -1)  # Most recent first
            ])
            
            # Progress collection - compound index
            await self._db.progress.create_index([
                ("user_id", 1),
                ("topic", 1)
            ], unique=True)
            
        except Exception as e:
            logger.warning(f"Index creation warning: {e}")
    
    async def disconnect(self):
        """Close MongoDB connection."""
        if self._client:
            self._client.close()
            self._connected = False
            logger.info("MongoDB connection closed.")
    
    @property
    def is_connected(self) -> bool:
        """Check if persistence is available."""
        return self._connected
    
    # ========================================
    # USER MANAGEMENT
    # ========================================
    
    def generate_guest_id(self) -> str:
        """Generate a stable guest user ID."""
        return f"guest_{uuid.uuid4().hex[:12]}"
    
    async def get_or_create_user(self, user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Get existing user or create a new guest user.
        Returns user document with profile.
        """
        if not user_id:
            user_id = self.generate_guest_id()
        
        if self._connected and self._db is not None:
            return await self._get_or_create_user_mongo(user_id)
        else:
            return self._get_or_create_user_memory(user_id)
    
    async def _get_or_create_user_mongo(self, user_id: str) -> Dict[str, Any]:
        """MongoDB implementation of get_or_create_user."""
        try:
            user = await self._db.users.find_one({"user_id": user_id})
            
            if user:
                # Update last seen and increment session count
                await self._db.users.update_one(
                    {"user_id": user_id},
                    {
                        "$set": {"last_seen": datetime.utcnow()},
                        "$inc": {"session_count": 1}
                    }
                )
                user["_id"] = str(user["_id"])  # Convert ObjectId to string
                return user
            
            # Create new user (profile stored in separate collection)
            new_user = {
                "user_id": user_id,
                "created_at": datetime.utcnow(),
                "last_seen": datetime.utcnow(),
                "session_count": 1
            }
            
            await self._db.users.insert_one(new_user)
            new_user["_id"] = str(new_user["_id"])
            return new_user
            
        except Exception as e:
            logger.error(f"MongoDB error in get_or_create_user: {e}")
            return self._get_or_create_user_memory(user_id)
    
    def _get_or_create_user_memory(self, user_id: str) -> Dict[str, Any]:
        """In-memory fallback for get_or_create_user."""
        if user_id not in self._in_memory_store:
            self._in_memory_store[user_id] = {
                "user_id": user_id,
                "created_at": datetime.utcnow(),
                "last_seen": datetime.utcnow(),
                "session_count": 1
            }
        else:
            self._in_memory_store[user_id]["last_seen"] = datetime.utcnow()
            self._in_memory_store[user_id]["session_count"] = \
                self._in_memory_store[user_id].get("session_count", 0) + 1
        
        return self._in_memory_store[user_id].copy()
    
    # ========================================
    # LEARNER PROFILE PERSISTENCE (Separate Collection)
    # ========================================
    
    async def save_learner_profile(self, user_id: str, profile: Dict[str, Any]) -> bool:
        """
        Save the learner profile to the profiles collection.
        Also saves a snapshot to profile_history for tracking evolution.
        """
        if self._connected and self._db is not None:
            return await self._save_profile_mongo(user_id, profile)
        else:
            return self._save_profile_memory(user_id, profile)
    
    async def _save_profile_mongo(self, user_id: str, profile: Dict[str, Any]) -> bool:
        """MongoDB implementation - saves to separate profiles collection."""
        try:
            now = datetime.utcnow()
            
            # Prepare profile document
            profile_doc = {
                "user_id": user_id,
                "learning_style": profile.get("learning_style"),
                "pace": profile.get("pace"),
                "confidence": profile.get("confidence"),
                "depth_preference": profile.get("depth_preference"),
                "learning_intent": profile.get("learning_intent"),
                "correct_answers": profile.get("correct_answers", 0),
                "total_answers": profile.get("total_answers", 0),
                "topics_explored": profile.get("topics_explored", []),
                "detected_misconceptions": profile.get("detected_misconceptions", []),
                "style_votes": profile.get("style_votes", {}),
                "updated_at": now
            }
            
            # Upsert into profiles collection
            result = await self._db.profiles.update_one(
                {"user_id": user_id},
                {
                    "$set": profile_doc,
                    "$setOnInsert": {"created_at": now}
                },
                upsert=True
            )
            
            # Save snapshot to history (for tracking profile evolution)
            # Only save significant changes (every 5th update or style change)
            should_save_history = False
            existing = await self._db.profiles.find_one({"user_id": user_id})
            if existing:
                # Check if learning style changed
                if existing.get("learning_style") != profile.get("learning_style"):
                    should_save_history = True
                # Or every 5 answers
                elif profile.get("total_answers", 0) % 5 == 0 and profile.get("total_answers", 0) > 0:
                    should_save_history = True
            else:
                should_save_history = True  # First profile
            
            if should_save_history:
                history_doc = {
                    "user_id": user_id,
                    "timestamp": now,
                    "snapshot": profile_doc.copy()
                }
                await self._db.profile_history.insert_one(history_doc)
            
            return result.modified_count > 0 or result.upserted_id is not None
            
        except Exception as e:
            logger.error(f"MongoDB error saving profile: {e}")
            return self._save_profile_memory(user_id, profile)
    
    def _save_profile_memory(self, user_id: str, profile: Dict[str, Any]) -> bool:
        """In-memory fallback for save_learner_profile."""
        # Store in a separate "profiles" key for consistency with DB structure
        if "_profiles" not in self._in_memory_store:
            self._in_memory_store["_profiles"] = {}
        
        self._in_memory_store["_profiles"][user_id] = {
            "user_id": user_id,
            "profile": profile,
            "updated_at": datetime.utcnow()
        }
        return True
    
    async def get_learner_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve stored learner profile from the profiles collection.
        Returns None if user not found or no profile stored.
        """
        if self._connected and self._db is not None:
            return await self._get_profile_mongo(user_id)
        else:
            return self._get_profile_memory(user_id)
    
    async def _get_profile_mongo(self, user_id: str) -> Optional[Dict[str, Any]]:
        """MongoDB implementation - reads from profiles collection."""
        try:
            profile_doc = await self._db.profiles.find_one({"user_id": user_id})
            if profile_doc:
                # Return in the format expected by LearnerProfile model
                profile_doc.pop("_id", None)
                profile_doc.pop("user_id", None)
                profile_doc.pop("created_at", None)
                profile_doc.pop("updated_at", None)
                return profile_doc
            return None
            
        except Exception as e:
            logger.error(f"MongoDB error getting profile: {e}")
            return self._get_profile_memory(user_id)
    
    def _get_profile_memory(self, user_id: str) -> Optional[Dict[str, Any]]:
        """In-memory fallback for get_learner_profile."""
        profiles = self._in_memory_store.get("_profiles", {})
        profile_data = profiles.get(user_id)
        return profile_data.get("profile") if profile_data else None
    
    async def get_profile_history(self, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get profile evolution history for a user.
        Returns list of profile snapshots, most recent first.
        """
        if self._connected and self._db is not None:
            try:
                cursor = self._db.profile_history.find(
                    {"user_id": user_id}
                ).sort("timestamp", -1).limit(limit)
                
                history = []
                async for doc in cursor:
                    doc["_id"] = str(doc["_id"])
                    history.append(doc)
                return history
            except Exception as e:
                logger.error(f"MongoDB error getting profile history: {e}")
                return []
        return []  # No history in memory mode
    
    # ========================================
    # TOPIC PROGRESS TRACKING
    # ========================================
    
    async def save_topic_progress(
        self,
        user_id: str,
        topic: str,
        progress: Dict[str, Any]
    ) -> bool:
        """
        Save progress for a specific topic.
        progress includes: accuracy, questions_answered, last_phase, etc.
        """
        if self._connected and self._db is not None:
            return await self._save_progress_mongo(user_id, topic, progress)
        else:
            return self._save_progress_memory(user_id, topic, progress)
    
    async def _save_progress_mongo(
        self,
        user_id: str,
        topic: str,
        progress: Dict[str, Any]
    ) -> bool:
        """MongoDB implementation of save_topic_progress."""
        try:
            result = await self._db.progress.update_one(
                {"user_id": user_id, "topic": topic},
                {
                    "$set": {
                        **progress,
                        "updated_at": datetime.utcnow()
                    },
                    "$setOnInsert": {
                        "created_at": datetime.utcnow()
                    }
                },
                upsert=True
            )
            return result.modified_count > 0 or result.upserted_id is not None
            
        except Exception as e:
            logger.error(f"MongoDB error saving progress: {e}")
            return self._save_progress_memory(user_id, topic, progress)
    
    def _save_progress_memory(
        self,
        user_id: str,
        topic: str,
        progress: Dict[str, Any]
    ) -> bool:
        """In-memory fallback for save_topic_progress."""
        if user_id not in self._in_memory_store:
            self._in_memory_store[user_id] = {"user_id": user_id}
        
        if "progress" not in self._in_memory_store[user_id]:
            self._in_memory_store[user_id]["progress"] = {}
        
        self._in_memory_store[user_id]["progress"][topic] = {
            **progress,
            "updated_at": datetime.utcnow()
        }
        return True
    
    async def get_topic_progress(
        self,
        user_id: str,
        topic: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Get progress for a topic or all topics.
        If topic is None, returns all topic progress.
        """
        if self._connected and self._db is not None:
            return await self._get_progress_mongo(user_id, topic)
        else:
            return self._get_progress_memory(user_id, topic)
    
    async def _get_progress_mongo(
        self,
        user_id: str,
        topic: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """MongoDB implementation of get_topic_progress."""
        try:
            if topic:
                result = await self._db.progress.find_one(
                    {"user_id": user_id, "topic": topic}
                )
                if result:
                    result["_id"] = str(result["_id"])
                return result
            else:
                cursor = self._db.progress.find({"user_id": user_id})
                progress_list = await cursor.to_list(length=100)
                return {
                    p["topic"]: {k: v for k, v in p.items() if k not in ["_id", "user_id", "topic"]}
                    for p in progress_list
                }
                
        except Exception as e:
            logger.error(f"MongoDB error getting progress: {e}")
            return self._get_progress_memory(user_id, topic)
    
    def _get_progress_memory(
        self,
        user_id: str,
        topic: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """In-memory fallback for get_topic_progress."""
        user = self._in_memory_store.get(user_id)
        if not user or "progress" not in user:
            return None
        
        if topic:
            return user["progress"].get(topic)
        return user["progress"]
    
    # ========================================
    # USER DATA SUMMARY
    # ========================================
    
    async def get_user_summary(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a complete summary of user data for session restoration.
        Includes profile, all topic progress, and metadata.
        """
        user = await self.get_or_create_user(user_id)
        profile = await self.get_learner_profile(user_id)
        progress = await self.get_topic_progress(user_id)
        
        return {
            "user_id": user_id,
            "is_returning": profile is not None,
            "learner_profile": profile,
            "topic_progress": progress or {},
            "session_count": user.get("session_count", 0),
            "first_seen": user.get("created_at"),
            "last_seen": user.get("last_seen")
        }


# Global persistence instance
user_persistence = UserPersistence()

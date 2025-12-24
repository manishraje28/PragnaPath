"""
PragnaPath - User Authentication
Supports both simple email/password auth and MongoDB Atlas App Services.
Gracefully degrades to simple auth if App Services not configured.
"""

import os
import hashlib
import secrets
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field

logger = logging.getLogger(__name__)

# Try to import JWT for token handling
try:
    import jwt
    JWT_AVAILABLE = True
except ImportError:
    JWT_AVAILABLE = False
    logger.warning("PyJWT not installed. Token auth will use simple tokens.")


# ============================================
# AUTH MODELS
# ============================================

class UserCreate(BaseModel):
    """Request model for user registration."""
    email: EmailStr
    password: str = Field(min_length=6)
    name: Optional[str] = None


class UserLogin(BaseModel):
    """Request model for user login."""
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """Response model for user data (no password)."""
    user_id: str
    email: str
    name: Optional[str] = None
    created_at: datetime
    is_guest: bool = False


class AuthToken(BaseModel):
    """Authentication token response."""
    access_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds
    user: UserResponse


# ============================================
# AUTH SERVICE
# ============================================

class AuthService:
    """
    Authentication service supporting:
    - Guest access (anonymous, auto-generated ID)
    - Email/password registration and login
    - Token-based session management
    """
    
    def __init__(self):
        self._db = None
        self._secret_key = os.getenv("JWT_SECRET_KEY", secrets.token_hex(32))
        self._token_expiry_hours = int(os.getenv("TOKEN_EXPIRY_HOURS", "72"))
    
    def set_database(self, db):
        """Set the MongoDB database reference."""
        self._db = db
    
    @property
    def is_available(self) -> bool:
        """Check if auth service has database access."""
        return self._db is not None
    
    # ========================================
    # PASSWORD HASHING
    # ========================================
    
    def _hash_password(self, password: str) -> str:
        """Hash password with salt."""
        salt = secrets.token_hex(16)
        hash_obj = hashlib.pbkdf2_hmac(
            'sha256',
            password.encode(),
            salt.encode(),
            100000
        )
        return f"{salt}:{hash_obj.hex()}"
    
    def _verify_password(self, password: str, hashed: str) -> bool:
        """Verify password against hash."""
        try:
            salt, hash_value = hashed.split(':')
            hash_obj = hashlib.pbkdf2_hmac(
                'sha256',
                password.encode(),
                salt.encode(),
                100000
            )
            return hash_obj.hex() == hash_value
        except Exception:
            return False
    
    # ========================================
    # TOKEN MANAGEMENT
    # ========================================
    
    def _generate_token(self, user_id: str, email: str) -> tuple[str, int]:
        """Generate access token. Returns (token, expiry_seconds)."""
        expiry_seconds = self._token_expiry_hours * 3600
        expires_at = datetime.utcnow() + timedelta(hours=self._token_expiry_hours)
        
        if JWT_AVAILABLE:
            payload = {
                "user_id": user_id,
                "email": email,
                "exp": expires_at,
                "iat": datetime.utcnow()
            }
            token = jwt.encode(payload, self._secret_key, algorithm="HS256")
        else:
            # Simple token fallback
            token = f"{user_id}:{secrets.token_hex(32)}"
        
        return token, expiry_seconds
    
    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify and decode access token."""
        if not token:
            return None
        
        if JWT_AVAILABLE:
            try:
                payload = jwt.decode(token, self._secret_key, algorithms=["HS256"])
                return {
                    "user_id": payload.get("user_id"),
                    "email": payload.get("email")
                }
            except jwt.ExpiredSignatureError:
                logger.warning("Token expired")
                return None
            except jwt.InvalidTokenError:
                logger.warning("Invalid token")
                return None
        else:
            # Simple token: just extract user_id
            try:
                user_id = token.split(':')[0]
                return {"user_id": user_id, "email": None}
            except Exception:
                return None
    
    # ========================================
    # GUEST ACCESS
    # ========================================
    
    async def create_guest(self) -> AuthToken:
        """Create anonymous guest user."""
        import uuid
        
        guest_id = f"guest_{uuid.uuid4().hex[:12]}"
        now = datetime.utcnow()
        
        guest_user = {
            "user_id": guest_id,
            "email": f"{guest_id}@guest.pragnapath.local",
            "name": "Guest Learner",
            "is_guest": True,
            "created_at": now,
            "last_seen": now
        }
        
        # Store in database if available
        if self._db is not None:
            try:
                await self._db.users.insert_one(guest_user)
            except Exception as e:
                logger.warning(f"Could not persist guest user: {e}")
        
        token, expiry = self._generate_token(guest_id, guest_user["email"])
        
        return AuthToken(
            access_token=token,
            expires_in=expiry,
            user=UserResponse(
                user_id=guest_id,
                email=guest_user["email"],
                name=guest_user["name"],
                created_at=now,
                is_guest=True
            )
        )
    
    # ========================================
    # USER REGISTRATION
    # ========================================
    
    async def register(self, user_data: UserCreate) -> Optional[AuthToken]:
        """Register new user with email and password."""
        if self._db is None:
            logger.error("Database not available for registration")
            return None
        
        # Check if email already exists
        existing = await self._db.users.find_one({"email": user_data.email})
        if existing:
            return None  # Email already registered
        
        now = datetime.utcnow()
        import uuid
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        
        new_user = {
            "user_id": user_id,
            "email": user_data.email,
            "password_hash": self._hash_password(user_data.password),
            "name": user_data.name or user_data.email.split('@')[0],
            "is_guest": False,
            "created_at": now,
            "last_seen": now,
            "learner_profile": None
        }
        
        try:
            await self._db.users.insert_one(new_user)
        except Exception as e:
            logger.error(f"Registration failed: {e}")
            return None
        
        token, expiry = self._generate_token(user_id, user_data.email)
        
        return AuthToken(
            access_token=token,
            expires_in=expiry,
            user=UserResponse(
                user_id=user_id,
                email=user_data.email,
                name=new_user["name"],
                created_at=now,
                is_guest=False
            )
        )
    
    # ========================================
    # USER LOGIN
    # ========================================
    
    async def login(self, credentials: UserLogin) -> Optional[AuthToken]:
        """Login with email and password."""
        if self._db is None:
            logger.error("Database not available for login")
            return None
        
        user = await self._db.users.find_one({"email": credentials.email})
        
        if not user:
            return None  # User not found
        
        if not self._verify_password(credentials.password, user.get("password_hash", "")):
            return None  # Wrong password
        
        # Update last seen
        await self._db.users.update_one(
            {"user_id": user["user_id"]},
            {"$set": {"last_seen": datetime.utcnow()}}
        )
        
        token, expiry = self._generate_token(user["user_id"], user["email"])
        
        return AuthToken(
            access_token=token,
            expires_in=expiry,
            user=UserResponse(
                user_id=user["user_id"],
                email=user["email"],
                name=user.get("name"),
                created_at=user.get("created_at", datetime.utcnow()),
                is_guest=user.get("is_guest", False)
            )
        )
    
    # ========================================
    # UPGRADE GUEST TO REGISTERED USER
    # ========================================
    
    async def upgrade_guest(
        self,
        guest_user_id: str,
        email: str,
        password: str,
        name: Optional[str] = None
    ) -> Optional[AuthToken]:
        """
        Convert a guest account to a registered account.
        Preserves all learning data and profile.
        """
        if self._db is None:
            return None
        
        # Check if guest exists
        guest = await self._db.users.find_one({"user_id": guest_user_id, "is_guest": True})
        if not guest:
            return None
        
        # Check if email is already taken
        existing = await self._db.users.find_one({"email": email})
        if existing:
            return None
        
        now = datetime.utcnow()
        
        # Upgrade the guest account
        await self._db.users.update_one(
            {"user_id": guest_user_id},
            {
                "$set": {
                    "email": email,
                    "password_hash": self._hash_password(password),
                    "name": name or email.split('@')[0],
                    "is_guest": False,
                    "upgraded_at": now,
                    "last_seen": now
                }
            }
        )
        
        token, expiry = self._generate_token(guest_user_id, email)
        
        return AuthToken(
            access_token=token,
            expires_in=expiry,
            user=UserResponse(
                user_id=guest_user_id,
                email=email,
                name=name or email.split('@')[0],
                created_at=guest.get("created_at", now),
                is_guest=False
            )
        )
    
    # ========================================
    # GET USER BY ID
    # ========================================
    
    async def get_user(self, user_id: str) -> Optional[UserResponse]:
        """Get user by ID."""
        if self._db is None:
            return None
        
        user = await self._db.users.find_one({"user_id": user_id})
        if not user:
            return None
        
        return UserResponse(
            user_id=user["user_id"],
            email=user["email"],
            name=user.get("name"),
            created_at=user.get("created_at", datetime.utcnow()),
            is_guest=user.get("is_guest", False)
        )


# Global auth service instance
auth_service = AuthService()

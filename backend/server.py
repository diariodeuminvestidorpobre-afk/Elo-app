from fastapi import FastAPI, APIRouter, HTTPException, Header, File, UploadFile, Response, Request, Query, Cookie
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone, timedelta
import requests
from emergentintegrations.llm.chat import LlmChat, UserMessage
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest
from pywebpush import webpush, WebPushException
import json
import asyncio
from contextlib import asynccontextmanager

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Emergent Keys
EMERGENT_KEY = os.environ.get('EMERGENT_LLM_KEY')
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY')

# VAPID keys for push notifications (generated with: vapid --gen)
VAPID_PRIVATE_KEY = os.environ.get('VAPID_PRIVATE_KEY', 'MHcCAQEEIBz5qC9vQ8xQp5qGz_q2c0Q6oZ5qCPCPmXQfD5M8xqGIoAoGCCqGSM49AwEHoUQDQgAEebqJRiBS+8HiS7-MbqD5qGz_q2c0Q6oZ5qCPCPmXQfD5M8xqGIV5qWQlGmqHXjGQm0d9x5qNKqWZkL5g2Qkk==')
VAPID_PUBLIC_KEY = os.environ.get('VAPID_PUBLIC_KEY', 'BEl62iUYgUivxIkv-GyuBGpqGz_q2c0Q6oZ5qCPCPmXQfD5M8xqGIV5qWQlGmqHXjGQm0d9x5qNKqWZkL5g2Qkk')
VAPID_CLAIMS = {
    "sub": "mailto:support@elo.com"
}

# Object Storage
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
APP_NAME = "elo"
storage_key = None

# Stripe Checkout
stripe_checkout = None

# Global task for background notification processing
notification_task = None

async def notification_processor():
    """Background task to process grouped notifications every 2 minutes"""
    while True:
        try:
            await asyncio.sleep(120)  # Wait 2 minutes
            await process_grouped_notifications()
        except Exception as e:
            logger.error(f"Error in notification processor: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global notification_task
    try:
        init_storage()
        logger.info("Storage initialized")
        
        # Seed some verses if empty
        count = await db.daily_verses.count_documents({})
        if count == 0:
            verses = [
                {
                    "verse_text": "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.",
                    "reference": "João 3:16",
                    "translation": "NVI",
                    "date": datetime.now(timezone.utc).date().isoformat()
                },
                {
                    "verse_text": "O Senhor é o meu pastor; nada me faltará.",
                    "reference": "Salmos 23:1",
                    "translation": "NVI",
                    "date": ""
                },
                {
                    "verse_text": "Posso todas as coisas naquele que me fortalece.",
                    "reference": "Filipenses 4:13",
                    "translation": "NVI",
                    "date": ""
                },
                {
                    "verse_text": "Confie no Senhor de todo o seu coração e não se apoie em seu próprio entendimento.",
                    "reference": "Provérbios 3:5",
                    "translation": "NVI",
                    "date": ""
                },
                {
                    "verse_text": "Tudo posso naquele que me fortalece.",
                    "reference": "Filipenses 4:13",
                    "translation": "NVI",
                    "date": ""
                }
            ]
            await db.daily_verses.insert_many(verses)
            logger.info("Seeded daily verses")
        
        # Start background notification processor
        notification_task = asyncio.create_task(notification_processor())
        logger.info("Notification processor started")
        
    except Exception as e:
        logger.error(f"Startup error: {e}")
    
    yield
    
    # Shutdown
    if notification_task:
        notification_task.cancel()
        try:
            await notification_task
        except asyncio.CancelledError:
            pass
    client.close()

# Create the main app
app = FastAPI(lifespan=lifespan)
api_router = APIRouter(prefix="/api")

# ============= MODELS =============

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    bio: Optional[str] = None
    followers_count: int = 0
    following_count: int = 0
    created_at: str

class UserSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    session_token: str
    user_id: str
    expires_at: str
    created_at: str

class Video(BaseModel):
    model_config = ConfigDict(extra="ignore")
    video_id: str
    user_id: str
    user_name: str
    user_picture: Optional[str] = None
    storage_path: str
    thumbnail_path: Optional[str] = None
    caption: str
    likes_count: int = 0
    comments_count: int = 0
    shares_count: int = 0
    created_at: str

class PrayerRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    prayer_id: str
    user_id: str
    user_name: str
    user_picture: Optional[str] = None
    text: str
    prayer_count: int = 0
    comments_count: int = 0
    created_at: str

class Community(BaseModel):
    model_config = ConfigDict(extra="ignore")
    community_id: str
    name: str
    description: str
    image_url: Optional[str] = None
    member_count: int = 0
    moderator_id: str
    moderator_name: str
    created_at: str

class DailyVerse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    date: str
    verse_text: str
    reference: str
    translation: str = "NVI"

class NotificationPreferences(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    likes: bool = True
    comments: bool = True
    prayers: bool = True
    follows: bool = True
    community_messages: bool = True
    new_videos: bool = False
    daily_verse: bool = False

class PendingNotification(BaseModel):
    model_config = ConfigDict(extra="ignore")
    notification_id: str
    recipient_user_id: str
    sender_user_id: str
    sender_name: str
    notification_type: str  # like, comment, prayer, follow
    context_id: str  # video_id, prayer_id, etc
    context_type: str  # video, prayer, etc
    message: str
    created_at: str
    processed: bool = False

# ============= STORAGE FUNCTIONS =============

def init_storage():
    global storage_key
    if storage_key:
        return storage_key
    try:
        resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
        resp.raise_for_status()
        storage_key = resp.json()["storage_key"]
        return storage_key
    except Exception as e:
        logger.error(f"Storage init failed: {e}")
        raise

def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120
    )
    resp.raise_for_status()
    return resp.json()

def get_object(path: str) -> tuple[bytes, str]:
    key = init_storage()
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key}, timeout=60
    )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")

# ============= AUTH HELPER =============

async def get_current_user(authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)) -> User:
    token = None
    if session_token:
        token = session_token
    elif authorization and authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "")
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    session_doc = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session_doc:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    user_doc = await db.users.find_one({"user_id": session_doc["user_id"]}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    return User(**user_doc)

# ============= MODERATION =============

async def moderate_content(text: str) -> bool:
    """Returns True if content is appropriate, False if inappropriate"""
    try:
        chat = LlmChat(
            api_key=EMERGENT_KEY,
            session_id=f"moderation_{uuid.uuid4().hex[:8]}",
            system_message="Você é um moderador de conteúdo para uma rede social cristã. Analise o texto e responda APENAS 'APPROVED' se o conteúdo é apropriado para um público cristão (sem palavrões, conteúdo sexual, violência, blasfêmia), ou 'REJECTED' se for inapropriado."
        ).with_model("openai", "gpt-4o")
        
        message = UserMessage(text=f"Analise este conteúdo: {text}")
        response = await chat.send_message(message)
        
        return "APPROVED" in response.upper()
    except Exception as e:
        logger.error(f"Moderation error: {e}")
        return True

# ============= AUTH ROUTES =============

@api_router.post("/auth/session")
async def create_session(request: Request):
    """Exchange session_id for user data and create session"""
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    # REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    try:
        resp = requests.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id},
            timeout=10
        )
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to get session data: {str(e)}")
    
    # Check if user exists
    user_doc = await db.users.find_one({"email": data["email"]}, {"_id": 0})
    
    if not user_doc:
        # Create new user
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user_data = {
            "user_id": user_id,
            "email": data["email"],
            "name": data["name"],
            "picture": data.get("picture"),
            "bio": None,
            "followers_count": 0,
            "following_count": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user_data)
    else:
        user_id = user_doc["user_id"]
        # Update user info
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {
                "name": data["name"],
                "picture": data.get("picture")
            }}
        )
    
    # Create session
    session_token = data["session_token"]
    session_data = {
        "session_token": session_token,
        "user_id": user_id,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.user_sessions.insert_one(session_data)
    
    # Get user data
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    
    response = JSONResponse(content=user_doc)
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7*24*60*60,
        path="/"
    )
    return response

@api_router.get("/auth/me")
async def get_me(authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    try:
        current_user = await get_current_user(authorization, session_token)
        return current_user
    except HTTPException:
        raise

@api_router.post("/auth/logout")
async def logout(session_token: Optional[str] = Cookie(None)):
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response = JSONResponse(content={"message": "Logged out"})
    response.delete_cookie("session_token", path="/")
    return response

# ============= USER ROUTES =============

@api_router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: str):
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    return User(**user_doc)

@api_router.put("/users/profile")
async def update_profile(bio: Optional[str] = None):
    user = await get_current_user()
    update_data = {}
    if bio is not None:
        update_data["bio"] = bio
    
    if update_data:
        await db.users.update_one({"user_id": user.user_id}, {"$set": update_data})
    
    user_doc = await db.users.find_one({"user_id": user.user_id}, {"_id": 0})
    return User(**user_doc)

@api_router.post("/users/{user_id}/follow")
async def follow_user(user_id: str):
    user = await get_current_user()
    
    if user.user_id == user_id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")
    
    # Check if already following
    existing = await db.follows.find_one({
        "follower_id": user.user_id,
        "following_id": user_id
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Already following")
    
    # Create follow
    await db.follows.insert_one({
        "follower_id": user.user_id,
        "following_id": user_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Update counts
    await db.users.update_one({"user_id": user.user_id}, {"$inc": {"following_count": 1}})
    await db.users.update_one({"user_id": user_id}, {"$inc": {"followers_count": 1}})
    
    return {"message": "Following"}

@api_router.delete("/users/{user_id}/follow")
async def unfollow_user(user_id: str):
    user = await get_current_user()
    
    result = await db.follows.delete_one({
        "follower_id": user.user_id,
        "following_id": user_id
    })
    
    if result.deleted_count > 0:
        await db.users.update_one({"user_id": user.user_id}, {"$inc": {"following_count": -1}})
        await db.users.update_one({"user_id": user_id}, {"$inc": {"followers_count": -1}})
    
    return {"message": "Unfollowed"}

# ============= VIDEO ROUTES =============

@api_router.post("/videos/upload")
async def upload_video(file: UploadFile = File(...)):
    user = await get_current_user()
    
    # Validate file type
    if not file.content_type or not file.content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="Only video files allowed")
    
    # Read file
    data = await file.read()
    
    # Check file size (max 50MB)
    if len(data) > 50 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 50MB)")
    
    # Upload to storage
    ext = file.filename.split(".")[-1] if "." in file.filename else "mp4"
    path = f"{APP_NAME}/videos/{user.user_id}/{uuid.uuid4()}.{ext}"
    
    try:
        result = put_object(path, data, file.content_type)
        
        # Store in database
        video_id = f"video_{uuid.uuid4().hex[:12]}"
        video_data = {
            "video_id": video_id,
            "user_id": user.user_id,
            "user_name": user.name,
            "user_picture": user.picture,
            "storage_path": result["path"],
            "caption": "",
            "likes_count": 0,
            "comments_count": 0,
            "shares_count": 0,
            "is_deleted": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.videos.insert_one(video_data)
        
        return {"video_id": video_id, "storage_path": result["path"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@api_router.put("/videos/{video_id}/caption")
async def update_caption(video_id: str, caption: str):
    user = await get_current_user()
    
    # Moderate caption
    is_approved = await moderate_content(caption)
    if not is_approved:
        raise HTTPException(status_code=400, detail="Caption contains inappropriate content")
    
    video = await db.videos.find_one({"video_id": video_id, "user_id": user.user_id})
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    await db.videos.update_one({"video_id": video_id}, {"$set": {"caption": caption}})
    return {"message": "Caption updated"}

@api_router.get("/videos/feed")
async def get_video_feed(limit: int = 20, skip: int = 0):
    videos = await db.videos.find(
        {"is_deleted": False},
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    return videos

@api_router.get("/videos/{video_id}/download")
async def download_video(video_id: str):
    video = await db.videos.find_one({"video_id": video_id, "is_deleted": False}, {"_id": 0})
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    try:
        data, content_type = get_object(video["storage_path"])
        return Response(content=data, media_type=content_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")

@api_router.post("/videos/{video_id}/like")
async def like_video(video_id: str):
    user = await get_current_user()
    
    # Get video details
    video = await db.videos.find_one({"video_id": video_id})
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    # Check if already liked
    existing = await db.likes.find_one({"video_id": video_id, "user_id": user.user_id})
    if existing:
        # Unlike
        await db.likes.delete_one({"video_id": video_id, "user_id": user.user_id})
        await db.videos.update_one({"video_id": video_id}, {"$inc": {"likes_count": -1}})
        return {"liked": False}
    else:
        # Like
        await db.likes.insert_one({
            "video_id": video_id,
            "user_id": user.user_id,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        await db.videos.update_one({"video_id": video_id}, {"$inc": {"likes_count": 1}})
        
        # Queue notification instead of sending immediately
        if video["user_id"] != user.user_id:
            await queue_notification(
                recipient_user_id=video["user_id"],
                sender_user_id=user.user_id,
                sender_name=user.name,
                notification_type="like",
                context_id=video_id,
                context_type="video",
                message="curtiu seu vídeo"
            )
        
        return {"liked": True}

@api_router.post("/videos/{video_id}/comment")
async def comment_video(video_id: str, text: str):
    user = await get_current_user()
    
    # Get video details
    video = await db.videos.find_one({"video_id": video_id})
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    # Moderate comment
    is_approved = await moderate_content(text)
    if not is_approved:
        raise HTTPException(status_code=400, detail="Comment contains inappropriate content")
    
    comment_id = f"comment_{uuid.uuid4().hex[:12]}"
    await db.comments.insert_one({
        "comment_id": comment_id,
        "video_id": video_id,
        "user_id": user.user_id,
        "user_name": user.name,
        "user_picture": user.picture,
        "text": text,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    await db.videos.update_one({"video_id": video_id}, {"$inc": {"comments_count": 1}})
    
    # Queue notification instead of sending immediately
    if video["user_id"] != user.user_id:
        await queue_notification(
            recipient_user_id=video["user_id"],
            sender_user_id=user.user_id,
            sender_name=user.name,
            notification_type="comment",
            context_id=video_id,
            context_type="video",
            message=text
        )
    
    return {"comment_id": comment_id}

@api_router.get("/videos/{video_id}/comments")
async def get_comments(video_id: str, limit: int = 50):
    comments = await db.comments.find(
        {"video_id": video_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    return comments

# ============= PRAYER ROUTES =============

@api_router.post("/prayers")
async def create_prayer(text: str):
    user = await get_current_user()
    
    # Moderate prayer
    is_approved = await moderate_content(text)
    if not is_approved:
        raise HTTPException(status_code=400, detail="Prayer contains inappropriate content")
    
    prayer_id = f"prayer_{uuid.uuid4().hex[:12]}"
    prayer_data = {
        "prayer_id": prayer_id,
        "user_id": user.user_id,
        "user_name": user.name,
        "user_picture": user.picture,
        "text": text,
        "prayer_count": 0,
        "comments_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.prayer_requests.insert_one(prayer_data)
    return {"prayer_id": prayer_id}

@api_router.get("/prayers")
async def get_prayers(limit: int = 20, skip: int = 0):
    prayers = await db.prayer_requests.find(
        {},
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return prayers

@api_router.post("/prayers/{prayer_id}/pray")
async def pray_for_request(prayer_id: str):
    user = await get_current_user()
    
    # Get prayer details
    prayer = await db.prayer_requests.find_one({"prayer_id": prayer_id})
    if not prayer:
        raise HTTPException(status_code=404, detail="Prayer not found")
    
    # Check if already prayed
    existing = await db.prayer_interactions.find_one({
        "prayer_id": prayer_id,
        "user_id": user.user_id
    })
    
    if not existing:
        await db.prayer_interactions.insert_one({
            "prayer_id": prayer_id,
            "user_id": user.user_id,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        await db.prayer_requests.update_one(
            {"prayer_id": prayer_id},
            {"$inc": {"prayer_count": 1}}
        )
        
        # Queue notification instead of sending immediately
        if prayer["user_id"] != user.user_id:
            await queue_notification(
                recipient_user_id=prayer["user_id"],
                sender_user_id=user.user_id,
                sender_name=user.name,
                notification_type="prayer",
                context_id=prayer_id,
                context_type="prayer",
                message="orou pelo seu pedido"
            )
    
    return {"prayed": True}

# ============= COMMUNITY ROUTES =============

@api_router.post("/communities")
async def create_community(name: str, description: str):
    user = await get_current_user()
    
    community_id = f"community_{uuid.uuid4().hex[:12]}"
    community_data = {
        "community_id": community_id,
        "name": name,
        "description": description,
        "image_url": None,
        "member_count": 1,
        "moderator_id": user.user_id,
        "moderator_name": user.name,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.communities.insert_one(community_data)
    
    # Add creator as member
    await db.community_members.insert_one({
        "community_id": community_id,
        "user_id": user.user_id,
        "role": "moderator",
        "joined_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"community_id": community_id}

@api_router.get("/communities")
async def get_communities(limit: int = 20):
    communities = await db.communities.find(
        {},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    return communities

@api_router.post("/communities/{community_id}/join")
async def join_community(community_id: str):
    user = await get_current_user()
    
    # Check if already member
    existing = await db.community_members.find_one({
        "community_id": community_id,
        "user_id": user.user_id
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Already a member")
    
    await db.community_members.insert_one({
        "community_id": community_id,
        "user_id": user.user_id,
        "role": "member",
        "joined_at": datetime.now(timezone.utc).isoformat()
    })
    
    await db.communities.update_one(
        {"community_id": community_id},
        {"$inc": {"member_count": 1}}
    )
    
    return {"message": "Joined community"}

@api_router.get("/communities/{community_id}/messages")
async def get_community_messages(community_id: str, limit: int = 50):
    # Check if member
    user = await get_current_user()
    member = await db.community_members.find_one({
        "community_id": community_id,
        "user_id": user.user_id
    })
    
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this community")
    
    messages = await db.community_messages.find(
        {"community_id": community_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    return messages

@api_router.post("/communities/{community_id}/messages")
async def send_community_message(community_id: str, message: str):
    user = await get_current_user()
    
    # Check if member
    member = await db.community_members.find_one({
        "community_id": community_id,
        "user_id": user.user_id
    })
    
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this community")
    
    # Moderate message
    is_approved = await moderate_content(message)
    if not is_approved:
        raise HTTPException(status_code=400, detail="Message contains inappropriate content")
    
    message_id = f"msg_{uuid.uuid4().hex[:12]}"
    await db.community_messages.insert_one({
        "message_id": message_id,
        "community_id": community_id,
        "user_id": user.user_id,
        "user_name": user.name,
        "user_picture": user.picture,
        "message": message,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message_id": message_id}

# ============= VERSE ROUTES =============

@api_router.get("/verses/daily", response_model=DailyVerse)
async def get_daily_verse():
    today = datetime.now(timezone.utc).date().isoformat()
    
    # Check if we have a verse for today
    verse = await db.daily_verses.find_one({"date": today}, {"_id": 0})
    
    if not verse:
        # Select a random verse from our collection
        verses = await db.daily_verses.find({}, {"_id": 0}).to_list(1000)
        if verses:
            import random
            verse = random.choice(verses)
            verse["date"] = today
            await db.daily_verses.update_one(
                {"reference": verse["reference"]},
                {"$set": {"date": today}},
                upsert=True
            )
        else:
            # Default verse
            verse = {
                "date": today,
                "verse_text": "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.",
                "reference": "João 3:16",
                "translation": "NVI"
            }
    
    return DailyVerse(**verse)

# ============= NOTIFICATION ROUTES =============

@api_router.post("/notifications/subscribe")
async def subscribe_to_notifications(request: Request):
    user = await get_current_user()
    body = await request.json()
    subscription = body.get("subscription")
    
    if not subscription:
        raise HTTPException(status_code=400, detail="Subscription data required")
    
    # Store subscription in database
    await db.push_subscriptions.update_one(
        {"user_id": user.user_id},
        {
            "$set": {
                "user_id": user.user_id,
                "subscription": subscription,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        },
        upsert=True
    )
    
    return {"message": "Subscribed successfully"}

@api_router.post("/notifications/unsubscribe")
async def unsubscribe_from_notifications(request: Request):
    user = await get_current_user()
    
    await db.push_subscriptions.delete_one({"user_id": user.user_id})
    
    return {"message": "Unsubscribed successfully"}

@api_router.get("/notifications/vapid-public-key")
async def get_vapid_public_key():
    return {"publicKey": VAPID_PUBLIC_KEY}

@api_router.get("/notifications/preferences", response_model=NotificationPreferences)
async def get_notification_preferences():
    user = await get_current_user()
    
    prefs = await db.notification_preferences.find_one({"user_id": user.user_id}, {"_id": 0})
    
    if not prefs:
        # Create default preferences
        default_prefs = {
            "user_id": user.user_id,
            "likes": True,
            "comments": True,
            "prayers": True,
            "follows": True,
            "community_messages": True,
            "new_videos": False,
            "daily_verse": False
        }
        await db.notification_preferences.insert_one(default_prefs)
        return NotificationPreferences(**default_prefs)
    
    return NotificationPreferences(**prefs)

@api_router.put("/notifications/preferences")
async def update_notification_preferences(
    likes: Optional[bool] = None,
    comments: Optional[bool] = None,
    prayers: Optional[bool] = None,
    follows: Optional[bool] = None,
    community_messages: Optional[bool] = None,
    new_videos: Optional[bool] = None,
    daily_verse: Optional[bool] = None
):
    user = await get_current_user()
    
    update_data = {}
    if likes is not None:
        update_data["likes"] = likes
    if comments is not None:
        update_data["comments"] = comments
    if prayers is not None:
        update_data["prayers"] = prayers
    if follows is not None:
        update_data["follows"] = follows
    if community_messages is not None:
        update_data["community_messages"] = community_messages
    if new_videos is not None:
        update_data["new_videos"] = new_videos
    if daily_verse is not None:
        update_data["daily_verse"] = daily_verse
    
    if update_data:
        await db.notification_preferences.update_one(
            {"user_id": user.user_id},
            {"$set": update_data},
            upsert=True
        )
    
    prefs = await db.notification_preferences.find_one({"user_id": user.user_id}, {"_id": 0})
    return NotificationPreferences(**prefs)

@api_router.post("/notifications/process")
async def process_notifications_endpoint():
    """Endpoint to manually trigger notification processing (for testing)"""
    await process_grouped_notifications()
    return {"message": "Notifications processed"}

async def send_push_notification(user_id: str, title: str, body: str, url: str = "/", tag: str = "default", notification_type: str = "general"):
    """Helper function to send push notification to a user"""
    try:
        # Check user's notification preferences
        prefs = await db.notification_preferences.find_one({"user_id": user_id})
        
        if prefs:
            # Check if this type of notification is enabled
            type_mapping = {
                "like": "likes",
                "comment": "comments",
                "prayer": "prayers",
                "follow": "follows",
                "community": "community_messages",
                "video": "new_videos",
                "verse": "daily_verse"
            }
            
            pref_key = type_mapping.get(notification_type, "general")
            if pref_key != "general" and not prefs.get(pref_key, True):
                return False  # User has disabled this type of notification
        
        # Get user's subscription
        subscription_doc = await db.push_subscriptions.find_one({"user_id": user_id})
        
        if not subscription_doc:
            return False
        
        subscription_info = subscription_doc["subscription"]
        
        # Prepare notification payload
        payload = json.dumps({
            "title": title,
            "body": body,
            "url": url,
            "tag": tag,
            "badgeCount": 1
        })
        
        # Send push notification
        webpush(
            subscription_info=subscription_info,
            data=payload,
            vapid_private_key=VAPID_PRIVATE_KEY,
            vapid_claims=VAPID_CLAIMS
        )
        
        return True
    except WebPushException as e:
        logger.error(f"Push notification failed: {e}")
        # If subscription is invalid, remove it
        if e.response and e.response.status_code in [404, 410]:
            await db.push_subscriptions.delete_one({"user_id": user_id})
        return False
    except Exception as e:
        logger.error(f"Error sending push notification: {e}")
        return False

async def queue_notification(
    recipient_user_id: str,
    sender_user_id: str,
    sender_name: str,
    notification_type: str,
    context_id: str,
    context_type: str,
    message: str
):
    """Queue a notification for grouped processing"""
    try:
        notification_id = f"notif_{uuid.uuid4().hex[:12]}"
        
        await db.pending_notifications.insert_one({
            "notification_id": notification_id,
            "recipient_user_id": recipient_user_id,
            "sender_user_id": sender_user_id,
            "sender_name": sender_name,
            "notification_type": notification_type,
            "context_id": context_id,
            "context_type": context_type,
            "message": message,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "processed": False
        })
        
        return True
    except Exception as e:
        logger.error(f"Error queuing notification: {e}")
        return False

async def process_grouped_notifications():
    """Process and send grouped notifications"""
    try:
        # Get all unprocessed notifications older than 2 minutes
        cutoff_time = datetime.now(timezone.utc) - timedelta(minutes=2)
        
        pending = await db.pending_notifications.find({
            "processed": False,
            "created_at": {"$lt": cutoff_time.isoformat()}
        }).to_list(1000)
        
        if not pending:
            return
        
        # Group by recipient, type, and context
        groups = {}
        for notif in pending:
            key = f"{notif['recipient_user_id']}_{notif['notification_type']}_{notif['context_id']}"
            if key not in groups:
                groups[key] = []
            groups[key].append(notif)
        
        # Process each group
        for key, notifications in groups.items():
            if not notifications:
                continue
            
            first = notifications[0]
            count = len(notifications)
            
            # Build grouped message
            if count == 1:
                # Single notification
                title, body = format_single_notification(first)
            else:
                # Multiple notifications
                title, body = format_grouped_notification(first, notifications, count)
            
            # Determine URL based on context
            url_map = {
                "video": "/feed",
                "prayer": "/prayers",
                "community": "/communities",
                "profile": "/profile"
            }
            url = url_map.get(first["context_type"], "/")
            
            # Send the grouped notification
            await send_push_notification(
                user_id=first["recipient_user_id"],
                title=title,
                body=body,
                url=url,
                tag=f"{first['notification_type']}_{first['context_id']}",
                notification_type=first["notification_type"]
            )
            
            # Mark as processed
            notification_ids = [n["notification_id"] for n in notifications]
            await db.pending_notifications.update_many(
                {"notification_id": {"$in": notification_ids}},
                {"$set": {"processed": True, "processed_at": datetime.now(timezone.utc).isoformat()}}
            )
        
        logger.info(f"Processed {len(groups)} notification groups")
        
    except Exception as e:
        logger.error(f"Error processing grouped notifications: {e}")

def format_single_notification(notif):
    """Format a single notification"""
    type_formats = {
        "like": ("❤️ Nova Curtida", f"{notif['sender_name']} curtiu seu vídeo"),
        "comment": ("💬 Novo Comentário", f"{notif['sender_name']}: {notif['message'][:50]}..."),
        "prayer": ("🙏 Nova Oração", f"{notif['sender_name']} orou pelo seu pedido"),
        "follow": ("👤 Novo Seguidor", f"{notif['sender_name']} começou a seguir você")
    }
    
    return type_formats.get(notif["notification_type"], ("Notificação", notif["message"]))

def format_grouped_notification(first, notifications, count):
    """Format a grouped notification"""
    first_name = first["sender_name"]
    
    if count == 2:
        # Two people
        second_name = notifications[1]["sender_name"]
        type_formats = {
            "like": ("❤️ Novas Curtidas", f"{first_name} e {second_name} curtiram seu vídeo"),
            "comment": ("💬 Novos Comentários", f"{first_name} e {second_name} comentaram seu vídeo"),
            "prayer": ("🙏 Novas Orações", f"{first_name} e {second_name} oraram pelo seu pedido"),
            "follow": ("👤 Novos Seguidores", f"{first_name} e {second_name} começaram a seguir você")
        }
    else:
        # Three or more people
        others = count - 1
        type_formats = {
            "like": ("❤️ Novas Curtidas", f"{first_name} e mais {others} pessoas curtiram seu vídeo"),
            "comment": ("💬 Novos Comentários", f"{first_name} e mais {others} pessoas comentaram seu vídeo"),
            "prayer": ("🙏 Novas Orações", f"{first_name} e mais {others} pessoas oraram pelo seu pedido"),
            "follow": ("👤 Novos Seguidores", f"{first_name} e mais {others} pessoas começaram a seguir você")
        }
    
    return type_formats.get(first["notification_type"], ("Notificações", f"{count} novas notificações"))

# ============= PAYMENT ROUTES =============

@api_router.post("/payments/checkout")
async def create_checkout(package_type: str, origin_url: str):
    user = await get_current_user()
    
    # Define packages (amounts in dollars)
    PACKAGES = {
        "small": 5.0,
        "medium": 10.0,
        "large": 20.0
    }
    
    if package_type not in PACKAGES:
        raise HTTPException(status_code=400, detail="Invalid package")
    
    amount = PACKAGES[package_type]
    
    # Initialize Stripe if not already
    global stripe_checkout
    if not stripe_checkout:
        host_url = origin_url
        webhook_url = f"{host_url}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    success_url = f"{origin_url}/donate/success?session_id={{{{CHECKOUT_SESSION_ID}}}}"
    cancel_url = f"{origin_url}/donate"
    
    request = CheckoutSessionRequest(
        amount=amount,
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "user_id": user.user_id,
            "package": package_type
        }
    )
    
    session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(request)
    
    # Store transaction
    await db.payment_transactions.insert_one({
        "session_id": session.session_id,
        "user_id": user.user_id,
        "amount": amount,
        "currency": "usd",
        "package": package_type,
        "payment_status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/payments/checkout/status/{session_id}")
async def get_checkout_status(session_id: str):
    user = await get_current_user()
    
    global stripe_checkout
    if not stripe_checkout:
        raise HTTPException(status_code=500, detail="Stripe not initialized")
    
    status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)
    
    # Update transaction
    transaction = await db.payment_transactions.find_one({"session_id": session_id})
    if transaction and transaction.get("payment_status") != "paid":
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {
                "payment_status": status.payment_status,
                "status": status.status,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
    
    return status

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    global stripe_checkout
    if not stripe_checkout:
        raise HTTPException(status_code=500, detail="Stripe not initialized")
    
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        # Update transaction based on webhook
        if webhook_response.payment_status == "paid":
            await db.payment_transactions.update_one(
                {"session_id": webhook_response.session_id},
                {"$set": {
                    "payment_status": "paid",
                    "event_type": webhook_response.event_type,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
        
        return {"received": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
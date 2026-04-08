from fastapi import FastAPI, APIRouter, HTTPException, Request
import os
import logging
from typing import Optional
from datetime import datetime, timezone
import jwt
import requests
from bson import ObjectId
from Models import MessageModel
from backend import database as db

# JWT Configuration
JWT_ALGORITHM = "HS256"

def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])}, {"password_hash": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["_id"] = str(user["_id"])
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_optional_user(request: Request) -> Optional[dict]:
    try:
        return await get_current_user(request)
    except:
        return None

# Create the main app
app = FastAPI(title="Corações Peludos API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Object Storage Configuration
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "coracoes-peludos"
storage_key = None

def init_storage():
    """Initialize storage once at startup"""
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
        return None

def put_object(path: str, data: bytes, content_type: str) -> dict:
    """Upload file to storage"""
    key = init_storage()
    if not key:
        raise HTTPException(status_code=500, detail="Storage not initialized")
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120
    )
    resp.raise_for_status()
    return resp.json()

def get_object(path: str) -> tuple:
    """Download file from storage"""
    key = init_storage()
    if not key:
        raise HTTPException(status_code=500, detail="Storage not initialized")
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key}, timeout=60
    )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")

# ======================= MESSAGE ROUTES =======================

@api_router.post("/messages")
async def send_message(data: MessageModel, request: Request):
    user = await get_current_user(request)
    
    receiver = await db.users.find_one({"_id": ObjectId(data.receiver_id)})
    if not receiver:
        raise HTTPException(status_code=404, detail="Receiver not found")
    
    pet_name = None
    if data.pet_id:
        pet = await db.pets.find_one({"_id": ObjectId(data.pet_id)})
        pet_name = pet["name"] if pet else None
    
    message_doc = {
        "sender_id": user["_id"],
        "sender_name": user["name"],
        "receiver_id": data.receiver_id,
        "receiver_name": receiver["name"],
        "content": data.content,
        "pet_id": data.pet_id,
        "pet_name": pet_name,
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    result = await db.messages.insert_one(message_doc)
    
    # Create notification
    await db.notifications.insert_one({
        "user_id": data.receiver_id,
        "title": "Nova mensagem",
        "message": f"Você recebeu uma mensagem de {user['name']}",
        "notification_type": "message",
        "related_id": str(result.inserted_id),
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"id": str(result.inserted_id), "message": "Message sent"}

@api_router.get("/messages")
async def get_messages(request: Request):
    user = await get_current_user(request)
    
    # Get conversations
    messages = await db.messages.find({
        "$or": [
            {"sender_id": user["_id"]},
            {"receiver_id": user["_id"]}
        ]
    }).sort("created_at", -1).to_list(1000)
    
    # Group by conversation partner
    conversations = {}
    for msg in messages:
        partner_id = msg["receiver_id"] if msg["sender_id"] == user["_id"] else msg["sender_id"]
        partner_name = msg["receiver_name"] if msg["sender_id"] == user["_id"] else msg["sender_name"]
        
        if partner_id not in conversations:
            conversations[partner_id] = {
                "partner_id": partner_id,
                "partner_name": partner_name,
                "last_message": msg["content"],
                "last_message_time": msg["created_at"],
                "unread_count": 0
            }
        
        if msg["receiver_id"] == user["_id"] and not msg["read"]:
            conversations[partner_id]["unread_count"] += 1
    
    return list(conversations.values())

@api_router.get("/messages/{partner_id}")
async def get_conversation(partner_id: str, request: Request):
    user = await get_current_user(request)
    
    messages = await db.messages.find({
        "$or": [
            {"sender_id": user["_id"], "receiver_id": partner_id},
            {"sender_id": partner_id, "receiver_id": user["_id"]}
        ]
    }).sort("created_at", 1).to_list(100)
    
    # Mark as read
    await db.messages.update_many(
        {"sender_id": partner_id, "receiver_id": user["_id"], "read": False},
        {"$set": {"read": True}}
    )
    
    result = []
    for msg in messages:
        msg["id"] = str(msg["_id"])
        del msg["_id"]
        msg["is_mine"] = msg["sender_id"] == user["_id"]
        result.append(msg)
    
    return result
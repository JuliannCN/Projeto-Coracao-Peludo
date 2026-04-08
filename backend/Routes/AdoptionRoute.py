from fastapi import FastAPI, APIRouter, HTTPException, Request
import os
import logging
from typing import Optional
from datetime import datetime, timezone
import jwt
import requests
from bson import ObjectId
from Models import AdoptionModel
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

# ======================= ADOPTION ROUTES =======================

@api_router.post("/adoptions")
async def create_adoption_request(data: AdoptionModel, request: Request):
    user = await get_current_user(request)
    
    pet = await db.pets.find_one({"_id": ObjectId(data.pet_id)})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    if pet["status"] != "available":
        raise HTTPException(status_code=400, detail="Pet is not available for adoption")
    
    # Check if already requested
    existing = await db.adoptions.find_one({
        "pet_id": data.pet_id,
        "user_id": user["_id"],
        "status": "pending"
    })
    if existing:
        raise HTTPException(status_code=400, detail="You already have a pending request for this pet")
    
    adoption_doc = {
        "pet_id": data.pet_id,
        "pet_name": pet["name"],
        "user_id": user["_id"],
        "user_name": user["name"],
        "user_email": user["email"],
        "ong_id": pet["ong_id"],
        "message": data.message,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    result = await db.adoptions.insert_one(adoption_doc)
    
    # Create notification for ONG
    await db.notifications.insert_one({
        "user_id": pet["ong_id"],
        "title": "Nova solicitação de adoção",
        "message": f"{user['name']} quer adotar {pet['name']}",
        "notification_type": "adoption_request",
        "related_id": str(result.inserted_id),
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"id": str(result.inserted_id), "message": "Adoption request sent"}

@api_router.get("/adoptions/user")
async def get_user_adoptions(request: Request):
    user = await get_current_user(request)
    adoptions = await db.adoptions.find({"user_id": user["_id"]}).sort("created_at", -1).to_list(100)
    
    result = []
    for adoption in adoptions:
        adoption["id"] = str(adoption["_id"])
        del adoption["_id"]
        # Get pet info
        pet = await db.pets.find_one({"_id": ObjectId(adoption["pet_id"])})
        if pet:
            adoption["pet_photo"] = pet.get("photos", [None])[0] if pet.get("photos") else None
        result.append(adoption)
    
    return result

@api_router.get("/adoptions/ong")
async def get_ong_adoptions(request: Request):
    user = await get_current_user(request)
    if user["user_type"] not in ["ong", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    adoptions = await db.adoptions.find({"ong_id": user["_id"]}).sort("created_at", -1).to_list(100)
    
    result = []
    for adoption in adoptions:
        adoption["id"] = str(adoption["_id"])
        del adoption["_id"]
        # Get pet info
        pet = await db.pets.find_one({"_id": ObjectId(adoption["pet_id"])})
        if pet:
            adoption["pet_photo"] = pet.get("photos", [None])[0] if pet.get("photos") else None
        result.append(adoption)
    
    return result

@api_router.put("/adoptions/{adoption_id}")
async def update_adoption_status(adoption_id: str, request: Request):
    user = await get_current_user(request)
    body = await request.json()
    status = body.get("status")
    
    if status not in ["approved", "rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    adoption = await db.adoptions.find_one({"_id": ObjectId(adoption_id)})
    if not adoption:
        raise HTTPException(status_code=404, detail="Adoption request not found")
    
    if adoption["ong_id"] != user["_id"] and user["user_type"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.adoptions.update_one(
        {"_id": ObjectId(adoption_id)},
        {"$set": {"status": status}}
    )
    
    # If approved, update pet status
    if status == "approved":
        await db.pets.update_one(
            {"_id": ObjectId(adoption["pet_id"])},
            {"$set": {"status": "adopted"}}
        )
        # Reject other pending requests for this pet
        await db.adoptions.update_many(
            {"pet_id": adoption["pet_id"], "status": "pending", "_id": {"$ne": ObjectId(adoption_id)}},
            {"$set": {"status": "rejected"}}
        )
    
    # Create notification for user
    await db.notifications.insert_one({
        "user_id": adoption["user_id"],
        "title": "Atualização da solicitação de adoção",
        "message": f"Sua solicitação para adotar {adoption['pet_name']} foi {'aprovada' if status == 'approved' else 'rejeitada'}",
        "notification_type": "adoption_request",
        "related_id": adoption_id,
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": f"Adoption request {status}"}
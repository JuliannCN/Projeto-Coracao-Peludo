from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, File, UploadFile, Depends, Query
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import secrets
import requests
from bson import ObjectId

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_ALGORITHM = "HS256"

def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]

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

# Password hashing
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

# JWT Token Management
def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id, 
        "email": email, 
        "exp": datetime.now(timezone.utc) + timedelta(minutes=60),
        "type": "access"
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id, 
        "exp": datetime.now(timezone.utc) + timedelta(days=7), 
        "type": "refresh"
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

# Auth helper
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

# ======================= MODELS =======================

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    user_type: str = "user"  # user, ong, admin
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    # ONG specific fields
    ong_name: Optional[str] = None
    cnpj: Optional[str] = None
    description: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    user_type: str
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    avatar_url: Optional[str] = None
    ong_name: Optional[str] = None
    cnpj: Optional[str] = None
    description: Optional[str] = None
    created_at: str

class PetCreate(BaseModel):
    name: str
    pet_type: str  # dog, cat, bird, other
    breed: Optional[str] = None
    age: str  # puppy, young, adult, senior
    size: str  # small, medium, large
    gender: str  # male, female
    description: str
    health_info: Optional[str] = None
    vaccinated: bool = False
    neutered: bool = False
    special_needs: Optional[str] = None
    city: str
    state: str

class PetResponse(BaseModel):
    id: str
    name: str
    pet_type: str
    breed: Optional[str] = None
    age: str
    size: str
    gender: str
    description: str
    health_info: Optional[str] = None
    vaccinated: bool
    neutered: bool
    special_needs: Optional[str] = None
    city: str
    state: str
    photos: List[str] = []
    ong_id: str
    ong_name: str
    status: str  # available, adopted, pending
    created_at: str

class AdoptionRequestCreate(BaseModel):
    pet_id: str
    message: str

class AdoptionRequestResponse(BaseModel):
    id: str
    pet_id: str
    pet_name: str
    user_id: str
    user_name: str
    user_email: str
    ong_id: str
    message: str
    status: str  # pending, approved, rejected
    created_at: str

class ForumPostCreate(BaseModel):
    title: str
    content: str
    category: str  # dicas, curiosidades, saude, adocao

class ForumPostResponse(BaseModel):
    id: str
    title: str
    content: str
    category: str
    author_id: str
    author_name: str
    author_avatar: Optional[str] = None
    comments_count: int = 0
    likes_count: int = 0
    created_at: str

class CommentCreate(BaseModel):
    content: str

class CommentResponse(BaseModel):
    id: str
    post_id: str
    content: str
    author_id: str
    author_name: str
    author_avatar: Optional[str] = None
    created_at: str

class MessageCreate(BaseModel):
    receiver_id: str
    content: str
    pet_id: Optional[str] = None

class MessageResponse(BaseModel):
    id: str
    sender_id: str
    sender_name: str
    receiver_id: str
    receiver_name: str
    content: str
    pet_id: Optional[str] = None
    pet_name: Optional[str] = None
    read: bool = False
    created_at: str

class NotificationResponse(BaseModel):
    id: str
    user_id: str
    title: str
    message: str
    notification_type: str  # adoption_request, message, forum_reply, system
    related_id: Optional[str] = None
    read: bool = False
    created_at: str

# ======================= AUTH ROUTES =======================

@api_router.post("/auth/register")
async def register(user_data: UserCreate, response: Response):
    # Check if email exists
    existing = await db.users.find_one({"email": user_data.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user document
    user_doc = {
        "name": user_data.name,
        "email": user_data.email.lower(),
        "password_hash": hash_password(user_data.password),
        "user_type": user_data.user_type,
        "phone": user_data.phone,
        "address": user_data.address,
        "city": user_data.city,
        "state": user_data.state,
        "avatar_url": None,
        "favorites": [],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Add ONG specific fields
    if user_data.user_type == "ong":
        user_doc["ong_name"] = user_data.ong_name
        user_doc["cnpj"] = user_data.cnpj
        user_doc["description"] = user_data.description
    
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    # Create tokens
    access_token = create_access_token(user_id, user_data.email.lower())
    refresh_token = create_refresh_token(user_id)
    
    # Set cookies
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=True, samesite="none", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=True, samesite="none", max_age=604800, path="/")
    
    return {
        "id": user_id,
        "name": user_data.name,
        "email": user_data.email.lower(),
        "user_type": user_data.user_type,
        "ong_name": user_data.ong_name if user_data.user_type == "ong" else None,
        "token": access_token
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin, request: Request, response: Response):
    email = credentials.email.lower()
    
    # Check brute force
    ip = request.client.host if request.client else "unknown"
    identifier = f"{ip}:{email}"
    attempt = await db.login_attempts.find_one({"identifier": identifier})
    
    if attempt and attempt.get("count", 0) >= 5:
        lockout_until = attempt.get("lockout_until")
        if lockout_until:
            if isinstance(lockout_until, str):
                lockout_until = datetime.fromisoformat(lockout_until)
            if lockout_until.tzinfo is None:
                lockout_until = lockout_until.replace(tzinfo=timezone.utc)
            if lockout_until > datetime.now(timezone.utc):
                raise HTTPException(status_code=429, detail="Too many attempts. Try again later.")
    
    # Find user
    user = await db.users.find_one({"email": email})
    if not user:
        # Increment failed attempts
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {"$inc": {"count": 1}, "$set": {"lockout_until": (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()}},
            upsert=True
        )
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Verify password
    if not verify_password(credentials.password, user["password_hash"]):
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {"$inc": {"count": 1}, "$set": {"lockout_until": (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()}},
            upsert=True
        )
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Clear failed attempts
    await db.login_attempts.delete_one({"identifier": identifier})
    
    user_id = str(user["_id"])
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=True, samesite="none", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=True, samesite="none", max_age=604800, path="/")
    
    return {
        "id": user_id,
        "name": user["name"],
        "email": user["email"],
        "user_type": user["user_type"],
        "ong_name": user.get("ong_name"),
        "avatar_url": user.get("avatar_url"),
        "token": access_token
    }

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/")
    return {"message": "Logged out successfully"}

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return {
        "id": user["_id"],
        "name": user["name"],
        "email": user["email"],
        "user_type": user["user_type"],
        "phone": user.get("phone"),
        "address": user.get("address"),
        "city": user.get("city"),
        "state": user.get("state"),
        "avatar_url": user.get("avatar_url"),
        "ong_name": user.get("ong_name"),
        "cnpj": user.get("cnpj"),
        "description": user.get("description"),
        "favorites": user.get("favorites", [])
    }

@api_router.post("/auth/refresh")
async def refresh_token(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        new_access = create_access_token(str(user["_id"]), user["email"])
        response.set_cookie(key="access_token", value=new_access, httponly=True, secure=True, samesite="none", max_age=3600, path="/")
        return {"token": new_access}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ======================= GOOGLE AUTH (Emergent) =======================

@api_router.post("/auth/google/session")
async def google_session(request: Request, response: Response):
    body = await request.json()
    session_id = body.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="Missing session_id")
    
    # Get session data from Emergent Auth
    try:
        resp = requests.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id},
            timeout=30
        )
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        logger.error(f"Google auth error: {e}")
        raise HTTPException(status_code=400, detail="Failed to verify Google session")
    
    email = data.get("email", "").lower()
    name = data.get("name", "")
    picture = data.get("picture")
    
    # Find or create user
    user = await db.users.find_one({"email": email})
    if not user:
        user_doc = {
            "name": name,
            "email": email,
            "password_hash": None,  # Google users don't have password
            "user_type": "user",
            "avatar_url": picture,
            "favorites": [],
            "auth_provider": "google",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        result = await db.users.insert_one(user_doc)
        user_id = str(result.inserted_id)
    else:
        user_id = str(user["_id"])
        # Update avatar if changed
        if picture and user.get("avatar_url") != picture:
            await db.users.update_one({"_id": user["_id"]}, {"$set": {"avatar_url": picture}})
    
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=True, samesite="none", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=True, samesite="none", max_age=604800, path="/")
    
    user_data = await db.users.find_one({"_id": ObjectId(user_id)}, {"password_hash": 0, "_id": 0})
    
    return {
        "id": user_id,
        "name": user_data["name"],
        "email": user_data["email"],
        "user_type": user_data["user_type"],
        "avatar_url": user_data.get("avatar_url"),
        "token": access_token
    }

# ======================= USER ROUTES =======================

@api_router.put("/users/profile")
async def update_profile(request: Request):
    user = await get_current_user(request)
    body = await request.json()
    
    update_fields = {}
    allowed_fields = ["name", "phone", "address", "city", "state", "ong_name", "description"]
    for field in allowed_fields:
        if field in body:
            update_fields[field] = body[field]
    
    if update_fields:
        await db.users.update_one({"_id": ObjectId(user["_id"])}, {"$set": update_fields})
    
    return {"message": "Profile updated"}

@api_router.post("/users/avatar")
async def upload_avatar(request: Request, file: UploadFile = File(...)):
    user = await get_current_user(request)
    
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    path = f"{APP_NAME}/avatars/{user['_id']}/{uuid.uuid4()}.{ext}"
    
    data = await file.read()
    result = put_object(path, data, file.content_type or "image/jpeg")
    
    # Save to files collection
    await db.files.insert_one({
        "id": str(uuid.uuid4()),
        "storage_path": result["path"],
        "original_filename": file.filename,
        "content_type": file.content_type,
        "size": result.get("size", len(data)),
        "user_id": user["_id"],
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Update user avatar
    await db.users.update_one({"_id": ObjectId(user["_id"])}, {"$set": {"avatar_url": result["path"]}})
    
    return {"path": result["path"]}

@api_router.post("/users/favorites/{pet_id}")
async def add_favorite(pet_id: str, request: Request):
    user = await get_current_user(request)
    await db.users.update_one(
        {"_id": ObjectId(user["_id"])},
        {"$addToSet": {"favorites": pet_id}}
    )
    return {"message": "Added to favorites"}

@api_router.delete("/users/favorites/{pet_id}")
async def remove_favorite(pet_id: str, request: Request):
    user = await get_current_user(request)
    await db.users.update_one(
        {"_id": ObjectId(user["_id"])},
        {"$pull": {"favorites": pet_id}}
    )
    return {"message": "Removed from favorites"}

@api_router.get("/users/favorites")
async def get_favorites(request: Request):
    user = await get_current_user(request)
    favorites = user.get("favorites", [])
    if not favorites:
        return []
    
    pets = []
    for pet_id in favorites:
        try:
            pet = await db.pets.find_one({"_id": ObjectId(pet_id)}, {"_id": 0})
            if pet:
                pet["id"] = pet_id
                pets.append(pet)
        except:
            continue
    
    return pets

# ======================= PET ROUTES =======================

@api_router.post("/pets")
async def create_pet(pet_data: PetCreate, request: Request):
    user = await get_current_user(request)
    if user["user_type"] not in ["ong", "admin"]:
        raise HTTPException(status_code=403, detail="Only ONGs can create pets")
    
    pet_doc = {
        "name": pet_data.name,
        "pet_type": pet_data.pet_type,
        "breed": pet_data.breed,
        "age": pet_data.age,
        "size": pet_data.size,
        "gender": pet_data.gender,
        "description": pet_data.description,
        "health_info": pet_data.health_info,
        "vaccinated": pet_data.vaccinated,
        "neutered": pet_data.neutered,
        "special_needs": pet_data.special_needs,
        "city": pet_data.city,
        "state": pet_data.state,
        "photos": [],
        "ong_id": user["_id"],
        "ong_name": user.get("ong_name") or user["name"],
        "status": "available",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    result = await db.pets.insert_one(pet_doc)
    return {"id": str(result.inserted_id), "message": "Pet created successfully"}

@api_router.post("/pets/{pet_id}/photos")
async def upload_pet_photo(pet_id: str, request: Request, file: UploadFile = File(...)):
    user = await get_current_user(request)
    
    pet = await db.pets.find_one({"_id": ObjectId(pet_id)})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    if pet["ong_id"] != user["_id"] and user["user_type"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    path = f"{APP_NAME}/pets/{pet_id}/{uuid.uuid4()}.{ext}"
    
    data = await file.read()
    result = put_object(path, data, file.content_type or "image/jpeg")
    
    await db.pets.update_one(
        {"_id": ObjectId(pet_id)},
        {"$push": {"photos": result["path"]}}
    )
    
    return {"path": result["path"]}

@api_router.get("/pets")
async def list_pets(
    pet_type: Optional[str] = None,
    age: Optional[str] = None,
    size: Optional[str] = None,
    city: Optional[str] = None,
    state: Optional[str] = None,
    status: str = "available",
    page: int = 1,
    limit: int = 12
):
    query = {"status": status}
    if pet_type:
        query["pet_type"] = pet_type
    if age:
        query["age"] = age
    if size:
        query["size"] = size
    if city:
        query["city"] = {"$regex": city, "$options": "i"}
    if state:
        query["state"] = state
    
    skip = (page - 1) * limit
    total = await db.pets.count_documents(query)
    
    pets = await db.pets.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    result = []
    for pet in pets:
        pet["id"] = str(pet["_id"])
        del pet["_id"]
        result.append(pet)
    
    return {
        "pets": result,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }

@api_router.get("/pets/{pet_id}")
async def get_pet(pet_id: str):
    try:
        pet = await db.pets.find_one({"_id": ObjectId(pet_id)})
    except:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    pet["id"] = str(pet["_id"])
    del pet["_id"]
    
    # Get ONG info
    ong = await db.users.find_one({"_id": ObjectId(pet["ong_id"])}, {"password_hash": 0})
    if ong:
        pet["ong_info"] = {
            "id": str(ong["_id"]),
            "name": ong.get("ong_name") or ong["name"],
            "email": ong["email"],
            "phone": ong.get("phone"),
            "city": ong.get("city"),
            "state": ong.get("state"),
            "description": ong.get("description")
        }
    
    return pet

@api_router.put("/pets/{pet_id}")
async def update_pet(pet_id: str, request: Request):
    user = await get_current_user(request)
    body = await request.json()
    
    pet = await db.pets.find_one({"_id": ObjectId(pet_id)})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    if pet["ong_id"] != user["_id"] and user["user_type"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    allowed_fields = ["name", "pet_type", "breed", "age", "size", "gender", "description", 
                      "health_info", "vaccinated", "neutered", "special_needs", "city", "state", "status"]
    update_fields = {k: v for k, v in body.items() if k in allowed_fields}
    
    if update_fields:
        await db.pets.update_one({"_id": ObjectId(pet_id)}, {"$set": update_fields})
    
    return {"message": "Pet updated"}

@api_router.delete("/pets/{pet_id}")
async def delete_pet(pet_id: str, request: Request):
    user = await get_current_user(request)
    
    pet = await db.pets.find_one({"_id": ObjectId(pet_id)})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    if pet["ong_id"] != user["_id"] and user["user_type"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.pets.delete_one({"_id": ObjectId(pet_id)})
    return {"message": "Pet deleted"}

@api_router.get("/ongs/{ong_id}/pets")
async def get_ong_pets(ong_id: str):
    pets = await db.pets.find({"ong_id": ong_id}).sort("created_at", -1).to_list(100)
    result = []
    for pet in pets:
        pet["id"] = str(pet["_id"])
        del pet["_id"]
        result.append(pet)
    return result

# ======================= ADOPTION ROUTES =======================

@api_router.post("/adoptions")
async def create_adoption_request(data: AdoptionRequestCreate, request: Request):
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

# ======================= FORUM ROUTES =======================

@api_router.post("/forum/posts")
async def create_forum_post(data: ForumPostCreate, request: Request):
    user = await get_current_user(request)
    
    post_doc = {
        "title": data.title,
        "content": data.content,
        "category": data.category,
        "author_id": user["_id"],
        "author_name": user["name"],
        "author_avatar": user.get("avatar_url"),
        "likes": [],
        "comments_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    result = await db.forum_posts.insert_one(post_doc)
    return {"id": str(result.inserted_id), "message": "Post created"}

@api_router.get("/forum/posts")
async def list_forum_posts(
    category: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 10
):
    query = {}
    if category:
        query["category"] = category
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"content": {"$regex": search, "$options": "i"}}
        ]
    
    skip = (page - 1) * limit
    total = await db.forum_posts.count_documents(query)
    
    posts = await db.forum_posts.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    result = []
    for post in posts:
        post["id"] = str(post["_id"])
        del post["_id"]
        post["likes_count"] = len(post.get("likes", []))
        del post["likes"]
        result.append(post)
    
    return {
        "posts": result,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }

@api_router.get("/forum/posts/{post_id}")
async def get_forum_post(post_id: str, request: Request):
    try:
        post = await db.forum_posts.find_one({"_id": ObjectId(post_id)})
    except:
        raise HTTPException(status_code=404, detail="Post not found")
    
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    post["id"] = str(post["_id"])
    del post["_id"]
    post["likes_count"] = len(post.get("likes", []))
    
    # Check if current user liked
    try:
        user = await get_optional_user(request)
        post["user_liked"] = user["_id"] in post.get("likes", []) if user else False
    except:
        post["user_liked"] = False
    
    del post["likes"]
    
    # Get comments
    comments = await db.forum_comments.find({"post_id": post_id}).sort("created_at", 1).to_list(100)
    post["comments"] = []
    for comment in comments:
        comment["id"] = str(comment["_id"])
        del comment["_id"]
        post["comments"].append(comment)
    
    return post

@api_router.post("/forum/posts/{post_id}/comments")
async def create_comment(post_id: str, data: CommentCreate, request: Request):
    user = await get_current_user(request)
    
    post = await db.forum_posts.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    comment_doc = {
        "post_id": post_id,
        "content": data.content,
        "author_id": user["_id"],
        "author_name": user["name"],
        "author_avatar": user.get("avatar_url"),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    result = await db.forum_comments.insert_one(comment_doc)
    
    # Update comments count
    await db.forum_posts.update_one(
        {"_id": ObjectId(post_id)},
        {"$inc": {"comments_count": 1}}
    )
    
    # Notify post author
    if post["author_id"] != user["_id"]:
        await db.notifications.insert_one({
            "user_id": post["author_id"],
            "title": "Novo comentário",
            "message": f"{user['name']} comentou em seu post",
            "notification_type": "forum_reply",
            "related_id": post_id,
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    return {"id": str(result.inserted_id), "message": "Comment added"}

@api_router.post("/forum/posts/{post_id}/like")
async def like_post(post_id: str, request: Request):
    user = await get_current_user(request)
    
    post = await db.forum_posts.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    likes = post.get("likes", [])
    if user["_id"] in likes:
        # Unlike
        await db.forum_posts.update_one(
            {"_id": ObjectId(post_id)},
            {"$pull": {"likes": user["_id"]}}
        )
        return {"liked": False}
    else:
        # Like
        await db.forum_posts.update_one(
            {"_id": ObjectId(post_id)},
            {"$addToSet": {"likes": user["_id"]}}
        )
        return {"liked": True}

# ======================= MESSAGE ROUTES =======================

@api_router.post("/messages")
async def send_message(data: MessageCreate, request: Request):
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

# ======================= NOTIFICATION ROUTES =======================

@api_router.get("/notifications")
async def get_notifications(request: Request, unread_only: bool = False):
    user = await get_current_user(request)
    
    query = {"user_id": user["_id"]}
    if unread_only:
        query["read"] = False
    
    notifications = await db.notifications.find(query).sort("created_at", -1).limit(50).to_list(50)
    
    result = []
    for notif in notifications:
        notif["id"] = str(notif["_id"])
        del notif["_id"]
        result.append(notif)
    
    return result

@api_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, request: Request):
    user = await get_current_user(request)
    
    await db.notifications.update_one(
        {"_id": ObjectId(notification_id), "user_id": user["_id"]},
        {"$set": {"read": True}}
    )
    
    return {"message": "Marked as read"}

@api_router.put("/notifications/read-all")
async def mark_all_notifications_read(request: Request):
    user = await get_current_user(request)
    
    await db.notifications.update_many(
        {"user_id": user["_id"], "read": False},
        {"$set": {"read": True}}
    )
    
    return {"message": "All marked as read"}

# ======================= FILE ROUTES =======================

@api_router.get("/files/{path:path}")
async def download_file(path: str, auth: Optional[str] = Query(None)):
    record = await db.files.find_one({"storage_path": path, "is_deleted": False})
    if not record:
        # Try to get directly from storage
        try:
            data, content_type = get_object(path)
            return Response(content=data, media_type=content_type)
        except:
            raise HTTPException(status_code=404, detail="File not found")
    
    data, content_type = get_object(path)
    return Response(content=data, media_type=record.get("content_type", content_type))

# ======================= STATS ROUTES =======================

@api_router.get("/stats")
async def get_stats():
    pets_available = await db.pets.count_documents({"status": "available"})
    pets_adopted = await db.pets.count_documents({"status": "adopted"})
    ongs_count = await db.users.count_documents({"user_type": "ong"})
    users_count = await db.users.count_documents({"user_type": "user"})
    
    return {
        "pets_available": pets_available,
        "pets_adopted": pets_adopted,
        "ongs_count": ongs_count,
        "users_count": users_count
    }

# ======================= ROOT ROUTE =======================

@api_router.get("/")
async def root():
    return {"message": "Corações Peludos API", "version": "1.0.0"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[os.environ.get("FRONTEND_URL", "http://localhost:3000"), "*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event
@app.on_event("startup")
async def startup():
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    await db.pets.create_index([("status", 1), ("created_at", -1)])
    await db.pets.create_index("ong_id")
    await db.adoptions.create_index([("user_id", 1), ("status", 1)])
    await db.adoptions.create_index([("ong_id", 1), ("status", 1)])
    await db.forum_posts.create_index([("category", 1), ("created_at", -1)])
    await db.messages.create_index([("sender_id", 1), ("receiver_id", 1)])
    await db.notifications.create_index([("user_id", 1), ("read", 1)])
    
    # Initialize storage
    try:
        init_storage()
        logger.info("Storage initialized")
    except Exception as e:
        logger.error(f"Storage init failed: {e}")
    
    # Seed admin
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@example.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        hashed = hash_password(admin_password)
        await db.users.insert_one({
            "email": admin_email,
            "password_hash": hashed,
            "name": "Admin",
            "user_type": "admin",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        logger.info("Admin user created")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})
        logger.info("Admin password updated")
    
    # Write test credentials
    import pathlib
    pathlib.Path("/app/memory").mkdir(parents=True, exist_ok=True)
    with open("/app/memory/test_credentials.md", "w") as f:
        f.write(f"""# Test Credentials

## Admin Account
- Email: {admin_email}
- Password: {admin_password}
- Role: admin

## Auth Endpoints
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me
- POST /api/auth/refresh
- POST /api/auth/google/session
""")
    logger.info("Test credentials written")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

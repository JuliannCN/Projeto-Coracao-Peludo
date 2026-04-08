from fastapi import FastAPI, APIRouter, HTTPException, Request, File, UploadFile
import os
import logging
from typing import Optional
import uuid
from datetime import datetime, timezone
import jwt
import requests
from bson import ObjectId
from Models import PetModel
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

# ======================= PET ROUTES =======================

@api_router.post("/pets")
async def create_pet(pet_data: PetModel, request: Request):
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
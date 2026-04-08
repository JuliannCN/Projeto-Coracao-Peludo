from fastapi import FastAPI, APIRouter, HTTPException, Request
import os
import logging
from typing import Optional
from datetime import datetime, timezone
import jwt
import requests
from bson import ObjectId
from Models import ForumModel, CommentModel
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

# ======================= FORUM ROUTES =======================

@api_router.post("/forum/posts")
async def create_forum_post(data: ForumModel, request: Request):
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
async def create_comment(post_id: str, data: CommentModel, request: Request):
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
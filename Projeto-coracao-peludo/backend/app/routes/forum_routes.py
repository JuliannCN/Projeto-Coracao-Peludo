from fastapi import APIRouter
from app.controllers.forum_controller import (
    create_post_controller,
    list_posts_controller,
    get_post_controller,
    update_post_controller,
    delete_post_controller
)
from app.schemas.forum_schema import ForumCreate, ForumUpdate

router = APIRouter(prefix="/forum", tags=["Forum"])


@router.post("/")
async def create_post(post: ForumCreate):
    author_id = "mock_user_id"
    return await create_post_controller(post, author_id)


@router.get("/")
async def get_posts():
    return await list_posts_controller()


@router.get("/{post_id}")
async def get_post(post_id: str):
    return await get_post_controller(post_id)


@router.put("/{post_id}")
async def update_post(post_id: str, post: ForumUpdate):
    return await update_post_controller(post_id, post.dict(exclude_unset=True))


@router.delete("/{post_id}")
async def delete_post(post_id: str):
    return await delete_post_controller(post_id)
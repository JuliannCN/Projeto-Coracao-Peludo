from fastapi import APIRouter
from app.controllers.user_controller import (
    create_user_controller,
    list_users_controller,
    get_user_profile,
    update_user_profile,
    delete_user_controller
)
from app.schemas.user_schema import UserCreate, UserUpdate

router = APIRouter(prefix="/users", tags=["Users"])


@router.post("/")
async def create_user(user: UserCreate):
    return await create_user_controller(user)


@router.get("/")
async def get_users():
    return await list_users_controller()


@router.get("/{user_id}")
async def get_user(user_id: str):
    return await get_user_profile(user_id)


@router.put("/{user_id}")
async def update_user(user_id: str, user: UserUpdate):
    return await update_user_profile(user_id, user.dict(exclude_unset=True))


@router.delete("/{user_id}")
async def delete_user(user_id: str):
    return await delete_user_controller(user_id)
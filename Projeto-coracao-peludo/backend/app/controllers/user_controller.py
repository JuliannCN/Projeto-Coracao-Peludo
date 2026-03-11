from app.services.user_service import (
    create_user,
    get_users,
    get_user_by_id,
    update_user,
    delete_user
)


async def create_user_controller(user):
    return await create_user(user)


async def list_users_controller():
    return await get_users()


async def get_user_profile(user_id: str):
    return await get_user_by_id(user_id)


async def update_user_profile(user_id: str, data):
    return await update_user(user_id, data)


async def delete_user_controller(user_id: str):
    return await delete_user(user_id)
from app.services.forum_service import (
    create_post,
    get_posts,
    get_post_by_id,
    update_post,
    delete_post
)


async def create_post_controller(post, author_id: str):
    return await create_post(post, author_id)


async def list_posts_controller():
    return await get_posts()


async def get_post_controller(post_id: str):
    return await get_post_by_id(post_id)


async def update_post_controller(post_id: str, data):
    return await update_post(post_id, data)


async def delete_post_controller(post_id: str):
    return await delete_post(post_id)
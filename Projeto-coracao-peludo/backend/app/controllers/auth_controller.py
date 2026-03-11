from app.services.auth_service import register_user, login_user


async def register_user_controller(user):
    return await register_user(user)


async def login_user_controller(email: str, password: str):
    return await login_user(email, password)
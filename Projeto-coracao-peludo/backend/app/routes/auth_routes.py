from fastapi import APIRouter
from app.controllers.auth_controller import (
    register_user_controller,
    login_user_controller
)
from app.schemas.user_schema import UserCreate
from pydantic import BaseModel

router = APIRouter(prefix="/auth", tags=["Auth"])


class LoginSchema(BaseModel):
    email: str
    password: str


@router.post("/register")
async def register(user: UserCreate):
    return await register_user_controller(user)


@router.post("/login")
async def login(data: LoginSchema):
    return await login_user_controller(data.email, data.password)
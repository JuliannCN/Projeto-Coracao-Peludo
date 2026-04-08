from pydantic import BaseModel, EmailStr
from typing import Optional

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
from pydantic import BaseModel
from typing import Optional


class PetCreate(BaseModel):
    name: str
    species: str
    breed: str
    age: int
    description: Optional[str] = None


class PetUpdate(BaseModel):
    name: Optional[str] = None
    species: Optional[str] = None
    breed: Optional[str] = None
    age: Optional[int] = None
    description: Optional[str] = None
    adopted: Optional[bool] = None


class PetResponse(BaseModel):
    id: str
    name: str
    species: str
    breed: str
    age: int
    description: Optional[str]
    owner_id: Optional[str]
    adopted: bool
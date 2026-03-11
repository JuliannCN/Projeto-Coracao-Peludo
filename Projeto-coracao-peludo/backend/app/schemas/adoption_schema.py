from pydantic import BaseModel
from typing import Optional


class AdoptionCreate(BaseModel):
    pet_id: str


class AdoptionUpdate(BaseModel):
    status: Optional[str] = None


class AdoptionResponse(BaseModel):
    id: str
    pet_id: str
    adopter_id: str
    status: str
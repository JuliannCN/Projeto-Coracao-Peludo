from pydantic import BaseModel, EmailStr
from typing import List, Optional

# ======================= MODELS =======================

class PetCreate(BaseModel):
    name: str
    pet_type: str  # Cachorro, Gato, Outro
    breed: Optional[str] = None
    age: str  # Filhote, Jovem, Adulto, Idoso
    size: str  # Pequeno, Médio, Grande
    gender: str  # Macho, Fêmea
    description: str
    health_info: Optional[str] = None
    vaccinated: bool = False
    neutered: bool = False
    special_needs: Optional[str] = None
    city: str
    state: str

class PetResponse(BaseModel):
    id: str
    name: str
    pet_type: str
    breed: Optional[str] = None
    age: str
    size: str
    gender: str
    description: str
    health_info: Optional[str] = None
    vaccinated: bool
    neutered: bool
    special_needs: Optional[str] = None
    city: str
    state: str
    photos: List[str] = []
    ong_id: str
    ong_name: str
    status: str  # Disponível, Adotado, Pendente
    created_at: str
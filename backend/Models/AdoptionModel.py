from pydantic import BaseModel

# ======================= MODELS =======================

class AdoptionRequestCreate(BaseModel):
    pet_id: str
    message: str

class AdoptionRequestResponse(BaseModel):
    id: str
    pet_id: str
    pet_name: str
    user_id: str
    user_name: str
    user_email: str
    ong_id: str
    message: str
    status: str  # Pendente, Aprovado, Rejeitado
    created_at: str
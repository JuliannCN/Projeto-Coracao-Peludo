from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext
from app.database import user_collection
from app.config import settings
from app.models.user_model import user_entity

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str):
    return pwd_context.hash(password)


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict):
    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )

    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )

    return encoded_jwt


async def register_user(user):
    user_dict = user.dict()

    user_dict["password"] = hash_password(user_dict["password"])

    result = await user_collection.insert_one(user_dict)

    new_user = await user_collection.find_one({"_id": result.inserted_id})

    return user_entity(new_user)


async def login_user(email: str, password: str):
    user = await user_collection.find_one({"email": email})

    if not user:
        return {"error": "Usuário não encontrado"}

    if not verify_password(password, user["password"]):
        return {"error": "Senha incorreta"}

    token = create_access_token({"user_id": str(user["_id"])})

    return {
        "access_token": token,
        "token_type": "bearer"
    }
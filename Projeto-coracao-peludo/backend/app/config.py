from pydantic_settings import BaseSettings


class Settings(BaseSettings):

    MONGO_URL: str = "mongodb+srv://julianncosta2203_db_user:nBIBhdmjKdHSKewS@projetocoracaopeludo.psfemrx.mongodb.net/?retryWrites=true&w=majority"

    DATABASE_NAME: str = "coracoes_peludos"

    SECRET_KEY: str = "coracoes_peludos_secret_key"

    ALGORITHM: str = "HS256"

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60


settings = Settings()
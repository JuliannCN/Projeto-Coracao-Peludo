# main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import auth_routes
from app.routes import user_routes
from app.routes import pet_routes
from app.routes import adoption_routes
from app.routes import forum_routes
from app.routes import chat_routes


app = FastAPI(
    title="Corações Peludos API",
    description="API para sistema de adoção de animais domésticos",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_routes.router, prefix="/auth", tags=["Auth"])
app.include_router(user_routes.router, prefix="/users", tags=["Users"])
app.include_router(pet_routes.router, prefix="/pets", tags=["Pets"])
app.include_router(adoption_routes.router, prefix="/adoptions", tags=["Adoptions"])
app.include_router(forum_routes.router, prefix="/forum", tags=["Forum"])
app.include_router(chat_routes.router, prefix="/chat", tags=["Chat"])


@app.get("/")
async def root():
    return {"message": "API Corações Peludos está funcionando"}
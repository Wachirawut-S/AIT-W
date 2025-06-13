from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.auth import router as auth_router
from .api.admin import router as admin_router
from .api.doctor import router as doctor_router
from .database import init_models

app = FastAPI()

# Allow CORS for local development (adjust origins in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or specify ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create tables automatically on startup (dev convenience)
@app.on_event("startup")
async def on_startup():
    await init_models()

app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(doctor_router)

@app.get("/ping")
async def ping():
    return {"status": "ok"}

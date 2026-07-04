from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base
import models  # noqa: F401  (needed so tables register with Base before create_all)

from routers import auth as auth_router

app = FastAPI(title="MedFlow API")

# Allow the React frontend (running on localhost:5173 by default with Vite) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create tables if they don't exist yet (safe to leave in during development)
Base.metadata.create_all(bind=engine)

app.include_router(auth_router.router)


@app.get("/")
def root():
    return {"message": "MedFlow API is running"}
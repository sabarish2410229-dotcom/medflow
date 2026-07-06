import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base
import models

from routers import auth as auth_router
from routers import inventory as inventory_router
from routers import procurement as procurement_router
from routers import orders as orders_router
from routers import exchange as exchange_router

app = FastAPI(title="MedFlow API")

# Read allowed frontend origins from environment; falls back to localhost for local dev
allowed_origins = os.getenv("FRONTEND_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(auth_router.router)
app.include_router(inventory_router.router)
app.include_router(procurement_router.router)
app.include_router(orders_router.router)
app.include_router(exchange_router.router)


@app.get("/")
def root():
    return {"message": "MedFlow API is running"}
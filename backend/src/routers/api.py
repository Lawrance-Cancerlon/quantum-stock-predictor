from fastapi import APIRouter
from src.routers import predict, fetch, auth, favorites

api = APIRouter()

api.include_router(predict.router, prefix="/predict", tags=["predict"])
api.include_router(fetch.router, prefix="/fetch", tags=["fetch"])
api.include_router(auth.router, prefix="/auth", tags=["auth"])
api.include_router(favorites.router, prefix="/favorites", tags=["favorites"])

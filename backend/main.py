import os
import sys
import logging
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv, find_dotenv
from src.routers.api import api
from src.database import engine, Base
from src.models import User, Favorite  # noqa: F401 — register models for table creation

load_dotenv(find_dotenv(), override=False)


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title=os.getenv("API_NAME"),
    description=os.getenv("API_DESCRIPTION"),
    version=os.getenv("API_VERSION") + "." + os.getenv("API_SUBVERSION"),
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api, prefix="/api/v" + os.getenv("API_VERSION") + "." + os.getenv("API_SUBVERSION"))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=os.getenv("API_HOST"),
        port=int(os.getenv("API_PORT")),
        reload=True,
        reload_excludes=["__pycache__", "logs"],
        log_level="debug"
    )

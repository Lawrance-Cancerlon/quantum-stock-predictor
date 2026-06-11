from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from src.dependencies.database import get_db
from src.dependencies.auth import get_current_user
from src.models.user import User
from src.auth.hashing import hash_password, verify_password
from src.auth.jwt import create_access_token
from src.types.response import OkResponse, BadRequestResponse, ConflictResponse

router = APIRouter()


class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str


class LoginRequest(BaseModel):
    username: str
    password: str


@router.post("/register")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == req.username).first():
        return ConflictResponse("Username already taken")
    if db.query(User).filter(User.email == req.email).first():
        return ConflictResponse("Email already registered")
    if len(req.password) < 6:
        return BadRequestResponse("Password must be at least 6 characters")

    user = User(
        username=req.username,
        email=req.email,
        hashed_password=hash_password(req.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    return OkResponse({
        "token": token,
        "user": {"id": user.id, "username": user.username, "email": user.email},
    })


@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == req.username).first()
    if not user or not verify_password(req.password, user.hashed_password):
        return BadRequestResponse("Invalid username or password")

    token = create_access_token({"sub": str(user.id)})
    return OkResponse({
        "token": token,
        "user": {"id": user.id, "username": user.username, "email": user.email},
    })


@router.get("/me")
def me(current_user: User = Depends(get_current_user)):
    return OkResponse({
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
    })

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from src.dependencies.database import get_db
from src.dependencies.auth import get_current_user
from src.models.user import User
from src.models.favorite import Favorite
from src.types.response import OkResponse, ConflictResponse, NotFoundResponse

router = APIRouter()


class FavoriteRequest(BaseModel):
    symbol: str


@router.get("/")
def list_favorites(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    favorites = db.query(Favorite).filter(Favorite.user_id == current_user.id).all()
    return OkResponse([
        {"id": f.id, "symbol": f.symbol, "created_at": str(f.created_at)}
        for f in favorites
    ])


@router.post("/")
def add_favorite(
    req: FavoriteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    symbol = req.symbol.upper().strip()
    existing = db.query(Favorite).filter(
        Favorite.user_id == current_user.id,
        Favorite.symbol == symbol,
    ).first()
    if existing:
        return ConflictResponse("Stock already in favorites")

    fav = Favorite(user_id=current_user.id, symbol=symbol)
    db.add(fav)
    db.commit()
    db.refresh(fav)
    return OkResponse({"id": fav.id, "symbol": fav.symbol, "created_at": str(fav.created_at)})


@router.delete("/{symbol}")
def remove_favorite(
    symbol: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    fav = db.query(Favorite).filter(
        Favorite.user_id == current_user.id,
        Favorite.symbol == symbol.upper(),
    ).first()
    if not fav:
        return NotFoundResponse("Favorite not found")

    db.delete(fav)
    db.commit()
    return OkResponse({"deleted": True, "symbol": symbol.upper()})

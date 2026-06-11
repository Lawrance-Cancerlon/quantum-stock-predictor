from fastapi import APIRouter, Query, Depends

from src.dependencies.services import get_predict_service
from src.services.predict_service import PredictService
from src.types.response import OkResponse, NotFoundResponse

router = APIRouter()


@router.get("/")
def predict(
    symbol: str = Query(..., description="The stock symbol to predict"),
    model: str = Query("lstm", description="Model to use: lstm or qlstm"),
    predict_service: PredictService = Depends(get_predict_service),
):
    model_key = model.lower().strip()
    if model_key not in ("lstm", "qlstm"):
        return NotFoundResponse(message=f"Unknown model '{model_key}'. Use 'lstm' or 'qlstm'.")
    try:
        if model_key == "lstm":
            return OkResponse(predict_service.predict_lstm(symbol))
        return OkResponse(predict_service.predict_qlstm(symbol))
    except ValueError as e:
        return NotFoundResponse(message=str(e))
    except Exception as e:
        return NotFoundResponse(message=f"Unexpected error during prediction: {e}")

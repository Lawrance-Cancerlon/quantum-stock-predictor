from fastapi import APIRouter, Query, Depends

from src.dependencies.services import get_data_service
from src.services.data_service import DataService
from src.types.response import OkResponse, NotFoundResponse

router = APIRouter()


@router.get("/stock")
def fetch_stock_data(
    symbol: str = Query(..., description="The stock symbol to fetch data for"),
    n_days: int = Query(30, ge=1, description="Number of days of stock data to fetch"),
    data_service: DataService = Depends(get_data_service),
):
    try:
        return OkResponse(data_service.prepare_stock_data(symbol, n_days=n_days))
    except ValueError as e:
        return NotFoundResponse(message=str(e))
    except Exception as e:
        return NotFoundResponse(message=f"Unexpected error fetching stock data: {e}")


@router.get("/sentiment")
def fetch_sentiment_data(
    symbol: str = Query(..., description="The stock symbol to fetch sentiment data for"),
    n_news: int = Query(20, ge=1, description="Number of news articles to analyze for sentiment"),
    data_service: DataService = Depends(get_data_service),
):
    try:
        return OkResponse(data_service.prepare_sentiment_data(symbol, n_news=n_news))
    except ValueError as e:
        return NotFoundResponse(message=str(e))
    except Exception as e:
        return NotFoundResponse(message=f"Unexpected error fetching sentiment data: {e}")

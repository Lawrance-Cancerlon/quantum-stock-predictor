from functools import lru_cache
from src.services.data_service import DataService
from src.services.predict_service import PredictService

@lru_cache
def get_data_service() -> DataService:
    return DataService()

@lru_cache
def get_predict_service() -> PredictService:
    return PredictService()
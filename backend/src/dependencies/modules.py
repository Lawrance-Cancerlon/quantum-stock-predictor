from functools import lru_cache
from src.modules.data_scaler import DataScaler
from src.modules.lstm_model import LSTMModel
from src.modules.qlstm_model import QLSTMModel
from src.modules.stock_fetcher import StockFetcher
from src.modules.news_scraper import NewsScraper
from src.modules.sentiment_analyzer import SentimentAnalyzer


@lru_cache
def get_data_scaler() -> DataScaler:
    return DataScaler()

@lru_cache
def get_lstm_model() -> LSTMModel:
    return LSTMModel(timesteps=30, features=5).load("models/lstm_model.keras")

@lru_cache
def get_qlstm_model() -> QLSTMModel:
    return QLSTMModel(timesteps=30, features=5).load("models/qlstm_model.keras")

@lru_cache
def get_stock_fetcher() -> StockFetcher:
    return StockFetcher()

@lru_cache
def get_news_scraper() -> NewsScraper:
    return NewsScraper()

@lru_cache
def get_sentiment_analyzer() -> SentimentAnalyzer:
    return SentimentAnalyzer()
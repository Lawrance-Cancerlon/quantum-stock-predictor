import numpy as np
from src.dependencies.modules import get_stock_fetcher, get_news_scraper, get_sentiment_analyzer


class DataService:
    def __init__(self):
        self.stock_fetcher = get_stock_fetcher()
        self.news_scraper = get_news_scraper()
        self.sentiment_analyzer = get_sentiment_analyzer()

    def prepare_data(self, symbol: str, n_days: int = 30, n_news: int = 20) -> tuple[np.ndarray, object, float]:
        price = self.stock_fetcher.fetch_stock_data(symbol, n_days + 10)
        if price is None:
            raise ValueError(f"Could not fetch stock data for '{symbol}'")
        price = price.tail(n_days + 1)
        if len(price) < n_days + 1:
            raise ValueError(f"Insufficient data for '{symbol}': got {len(price)} days, need {n_days + 1}")

        news = self.news_scraper.scrape_news(symbol, n_news)
        if news is None:
            raise ValueError(f"Could not fetch news for '{symbol}'")

        sentiment = self.sentiment_analyzer.get_summary(news['news'].tolist())
        if sentiment is None:
            raise ValueError(f"Could not analyze sentiment for '{symbol}'")

        data = []
        for i in range(1, n_days + 1):
            prev = price.iloc[i - 1]
            curr = price.iloc[i]
            day_features = np.array([
                (curr['Open'] - prev['Open']) / prev['Open'] if prev['Open'] != 0 else 0,
                (curr['High'] - prev['High']) / prev['High'] if prev['High'] != 0 else 0,
                (curr['Low'] - prev['Low']) / prev['Low'] if prev['Low'] != 0 else 0,
                (curr['Close'] - prev['Close']) / prev['Close'] if prev['Close'] != 0 else 0,
                (curr['Volume'] - prev['Volume']) / prev['Volume'] if prev['Volume'] != 0 else 0,
            ])
            data.append(day_features.tolist())
        base = price.iloc[n_days]
        return np.array(data), base, sentiment["overall"]

    def prepare_stock_data(self, symbol: str, n_days: int = 30) -> list[dict]:
        price = self.stock_fetcher.fetch_stock_data(symbol, n_days + 10)
        if price is None:
            raise ValueError(f"Could not fetch stock data for '{symbol}'")
        price = price.tail(n_days)
        if "Date" in price.columns:
            price = price.copy()
            price["Date"] = price["Date"].astype(str)
        return price.to_dict(orient="records")

    def prepare_sentiment_data(self, symbol: str, n_news: int = 20) -> dict:
        news = self.news_scraper.scrape_news(symbol, n_news)
        if news is None:
            raise ValueError(f"Could not fetch news for '{symbol}'")
        return self.sentiment_analyzer.get_summary(news['news'].tolist())

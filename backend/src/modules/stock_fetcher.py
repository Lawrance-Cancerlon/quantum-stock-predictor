import logging
import pandas as pd
import yfinance as yf

logger = logging.getLogger(__name__)


class StockFetcher:
    def fetch_stock_data(self, symbol: str, duration: int = 30) -> pd.DataFrame | None:
        try:
            symbol = symbol.upper() + ".JK"
            ticker = yf.Ticker(symbol)
            history = ticker.history(period=f"{duration}d")
            if history.empty:
                return None
            history.reset_index(inplace=True)
            return history
        except Exception as e:
            logger.error("Failed to fetch stock data for %s: %s", symbol, e)
            return None

import logging
import numpy as np
from decimal import Decimal, ROUND_HALF_UP

from src.services.data_service import DataService
from src.dependencies.modules import get_data_scaler, get_lstm_model, get_qlstm_model

logger = logging.getLogger(__name__)


class PredictService:
    def __init__(self):
        self.data_service = DataService()
        self.data_scaler = get_data_scaler()
        self.lstm_model = get_lstm_model()
        self.qlstm_model = get_qlstm_model()

    @staticmethod
    def _to_ohlc_dict(values: np.ndarray) -> dict:
        return {
            "open": float(values[0]),
            "high": float(values[1]),
            "low": float(values[2]),
            "close": float(values[3]),
        }

    @staticmethod
    def _tick_size(price: float) -> int:
        if price < 200:
            return 1
        if price < 500:
            return 2
        if price < 2000:
            return 5
        if price < 5000:
            return 10
        return 25

    def _round_to_tick(self, price: float) -> float:
        normalized = Decimal(str(price))
        for _ in range(3):
            step = Decimal(self._tick_size(float(normalized)))
            rounded = (normalized / step).quantize(Decimal("1"), rounding=ROUND_HALF_UP) * step
            if rounded == normalized:
                break
            normalized = rounded
        return float(normalized)

    def _normalize_ohlc_to_tick(self, values: np.ndarray) -> np.ndarray:
        return np.array([self._round_to_tick(value) for value in values], dtype=float)

    def _predict_with_model(self, model, symbol: str) -> dict:
        data, base, sentiment = self.data_service.prepare_data(symbol)

        sequence = np.expand_dims(data, axis=0)
        data_scaled = self.data_scaler.transform_x(sequence)
        sentiment_scaled = self.data_scaler.transform_sent(np.array([[sentiment]], dtype=float))

        pred_scaled = model.predict(data_scaled, sentiment_scaled)
        pred_change = self.data_scaler.inverse_transform_y(pred_scaled).reshape(-1)

        base_ohlc = np.array([
            base["Open"],
            base["High"],
            base["Low"],
            base["Close"],
        ], dtype=float)
        pred_actual = base_ohlc * (1.0 + pred_change)
        pred_adjusted = self._normalize_ohlc_to_tick(pred_actual)

        return self._to_ohlc_dict(pred_adjusted)

    def predict_lstm(self, symbol: str) -> dict:
        try:
            return self._predict_with_model(self.lstm_model, symbol)
        except ValueError as e:
            logger.error("LSTM prediction failed for %s: %s", symbol, e)
            raise ValueError(str(e)) from e

    def predict_qlstm(self, symbol: str) -> dict:
        try:
            return self._predict_with_model(self.qlstm_model, symbol)
        except ValueError as e:
            logger.error("QLSTM prediction failed for %s: %s", symbol, e)
            raise ValueError(str(e)) from e

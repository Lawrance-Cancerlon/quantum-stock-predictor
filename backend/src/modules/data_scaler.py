import pickle as pkl
import numpy as np
from pathlib import Path


class DataScaler:
    def __init__(self):
        scaler_path = Path(__file__).resolve().parents[2] / "models" / "scalers.pkl"
        with scaler_path.open("rb") as scaler_file:
            self.scaler = pkl.load(scaler_file)
        self.x_scaler = self.scaler['X_scaler']
        self.sent_scaler = self.scaler['sent_scaler']
        self.y_scaler = self.scaler['y_scaler']

    def transform_x(self, x: np.ndarray) -> np.ndarray:
        return self.x_scaler.transform(x.reshape(-1, x.shape[-1])).reshape(x.shape)

    def transform_sent(self, sent: np.ndarray) -> np.ndarray:
        return self.sent_scaler.transform(sent)

    def inverse_transform_y(self, y: np.ndarray) -> np.ndarray:
        return self.y_scaler.inverse_transform(y)

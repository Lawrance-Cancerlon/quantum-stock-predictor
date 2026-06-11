from tensorflow.keras.layers import Input, LSTM, Dense, Concatenate
from tensorflow.keras.models import Model, load_model
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping

class LSTMModel:
    """
    Pure LSTM model for stock price prediction.
    
    Architecture:
        Time Series → LSTM → Dense
                        ↑
                  Sentiment → Dense
    """
    def __init__(self, timesteps, features, lstm_units=64, dense_units=32, 
                 learning_rate=1e-3, n_outputs=4):
        self.timesteps = timesteps
        self.features = features
        self.lstm_units = lstm_units
        self.dense_units = dense_units
        self.learning_rate = learning_rate
        self.n_outputs = n_outputs
        self.model = self._build_model()
        self.history = None
        
    def _build_model(self):
        ts_input = Input(shape=(self.timesteps, self.features), name='timeseries_input')
        lstm_out = LSTM(self.lstm_units, activation='tanh')(ts_input)
        
        sent_input = Input(shape=(1,), name='sentiment_input')
        sent_dense = Dense(16, activation='relu')(sent_input)
        
        combined = Concatenate()([lstm_out, sent_dense])
        dense_out = Dense(self.dense_units, activation='relu')(combined)
        outputs = Dense(self.n_outputs, activation='linear')(dense_out)
        
        model = Model(inputs=[ts_input, sent_input], outputs=outputs)
        model.compile(optimizer=Adam(learning_rate=self.learning_rate), loss='mae')
        
        return model
    
    def fit(self, X_train, sent_train, y_train, epochs=100, batch_size=32, 
            validation_split=0.2, patience=10, verbose=1):
        early_stopping = EarlyStopping(
            monitor='val_loss', patience=patience, restore_best_weights=True
        )
        self.history = self.model.fit(
            [X_train, sent_train], y_train,
            validation_split=validation_split,
            epochs=epochs,
            batch_size=batch_size,
            callbacks=[early_stopping],
            verbose=verbose
        )
        return self.history
    
    def predict(self, X_test, sent_test):
        return self.model.predict([X_test, sent_test])
    
    def summary(self):
        return self.model.summary()

    def save(self, path):
        self.model.save(path)
    
    def load(self, path):
        self.model = load_model(path)
        return self
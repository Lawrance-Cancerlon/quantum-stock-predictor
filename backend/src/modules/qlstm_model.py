import numpy as np

import tensorflow as tf
from tensorflow.keras.initializers import RandomUniform
from tensorflow.keras.layers import Layer, Input, Dense, Concatenate, RNN
from tensorflow.keras.models import Model, load_model
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping

from qiskit import QuantumCircuit
from qiskit.circuit import ParameterVector
from qiskit.quantum_info import Pauli, SparsePauliOp
from qiskit.primitives import StatevectorEstimator
from qiskit_machine_learning.gradients import ParamShiftEstimatorGradient
from qiskit_machine_learning.neural_networks import EstimatorQNN

class QLSTMGate(Layer):
    """
    A Keras layer that wraps a Variational Quantum Circuit (VQC).
    
    This layer replaces a classical LSTM gate with a quantum circuit.
    Uses EstimatorQNN with parameter-shift gradients for differentiability.
    """
    def __init__(self, n_qubits, n_layers=2, name="quantum_gate", **kwargs):
        super().__init__(name=name, **kwargs)
        self.n_qubits = n_qubits
        self.n_layers = n_layers
        self.n_weights = n_qubits * n_layers * 2

        self.circuit, self.input_params, self.weight_params = self._create_quantum_circuit()
        self.observables = self._create_observables()

        self.qnn = EstimatorQNN(
            circuit = self.circuit,
            input_params=list(self.input_params),
            weight_params=list(self.weight_params),
            observables=self.observables,
            estimator=StatevectorEstimator(),
            gradient=ParamShiftEstimatorGradient(StatevectorEstimator()),
            input_gradients=True
        )

    def _create_quantum_circuit(self):
        """
        Create a VQC circuit for use in EstimatorQNN.
        """
        input_params = ParameterVector(f'{self.name}_input', self.n_qubits)
        weight_params = ParameterVector(f'{self.name}_weight', self.n_qubits * self.n_layers * 2)

        qc = QuantumCircuit(self.n_qubits)
        wp_idx = 0

        for _ in range(self.n_layers):
            # Data encoding
            for i in range(self.n_qubits):
                qc.ry(input_params[i], i)

            # Variational layer
            for i in range(self.n_qubits):
                qc.ry(weight_params[wp_idx], i)
                wp_idx += 1
                qc.rz(weight_params[wp_idx], i)
                wp_idx += 1

            # Entangling layer
            for i in range(self.n_qubits-1):
                qc.cx(i, i+1)
            if self.n_qubits > 2:
                qc.cx(self.n_qubits-1, 0)

            # Data re-uploading
            for i in range(self.n_qubits):
                qc.ry(input_params[i], i)

        return qc, input_params, weight_params

    def _create_observables(self):
        """Create Z observable for each qubit."""
        observables = []
        for i in range(self.n_qubits):
            pauli_str = 'I' * i + 'Z' + 'I' * (self.n_qubits - i - 1)
            observables.append(SparsePauliOp(Pauli(pauli_str)))
        return observables

    def build(self, input_shape):
        """Build the layer."""
        self.quantum_weights = self.add_weight(
            name="quantum_weights",
            shape=(self.n_weights,),
            initializer=RandomUniform(0, 2 * np.pi),
            trainable=True
        )
        super().build(input_shape)

    def call(self, inputs):
        """
        Forward pass through the quantum gate with proper gradient support.
        """
        @tf.custom_gradient
        def quantum_op(x, w):
            def forward_fn(inputs_tensor, weights_tensor):
                inputs_np = inputs_tensor.numpy().astype(np.float64)
                weights_np = weights_tensor.numpy().astype(np.float64)
                outputs = self.qnn.forward(inputs_np, weights_np)
                return tf.cast(outputs, tf.float32)
            
            result = tf.py_function(
                func=forward_fn,
                inp=[x, w],
                Tout=tf.float32
            )
            result.set_shape((x.shape[0], self.n_qubits))
            
            def grad_fn(upstream):
                def backward_fn(inputs_tensor, weights_tensor, upstream_tensor):
                    inputs_np = inputs_tensor.numpy().astype(np.float64)
                    weights_np = weights_tensor.numpy().astype(np.float64)
                    upstream_np = upstream_tensor.numpy().astype(np.float64)

                    input_gradients, weight_gradients = self.qnn.backward(inputs_np, weights_np)
                    
                    if weight_gradients is None:
                        weight_grad = np.zeros_like(weights_np)
                    else:
                        weight_grad = np.einsum('bo,bow->w', upstream_np, weight_gradients)
                    
                    if input_gradients is None:
                        input_grad = np.zeros_like(inputs_np)
                    else:
                        input_grad = np.einsum('bo,boi->bi', upstream_np, input_gradients)
                    
                    return (
                        tf.cast(input_grad, tf.float32),
                        tf.cast(weight_grad, tf.float32)
                    )
                
                input_grad, weight_grad = tf.py_function(
                    func=backward_fn,
                    inp=[x, w, upstream],
                    Tout=[tf.float32, tf.float32]
                )
                input_grad.set_shape(x.shape)
                weight_grad.set_shape(w.shape)
                
                return input_grad, weight_grad
            
            return result, grad_fn
        
        return quantum_op(inputs, self.quantum_weights)

    def get_config(self):
        """Return config for serialization."""
        config = super().get_config()
        config.update({
            'n_qubits': self.n_qubits,
            'n_layers': self.n_layers
        })
        return config

    @classmethod
    def from_config(cls, config):
        """Create layer from config."""
        return cls(**config)

    def get_build_config(self):
        """Return build config for serialization."""
        return {'input_shape': (None, self.n_qubits)}

    def build_from_config(self, config):
        """Build layer from config."""
        self.build(config.get('input_shape', (None, self.n_qubits)))

class QLSTMCell(Layer):
    """
    Quantum LSTM Cell as a Keras Layer.
    
    Replaces the 4 classical LSTM gates (forget, input, cell, output)
    with Variational Quantum Circuits.
    
    Architecture matches the manual QLSTM implementation exactly.
    """
    def __init__(self, units, n_layers=2, **kwargs):
        """
        Args:
            units: Hidden state dimension (= number of qubits)
            n_layers: Number of VQC layers per gate
        """
        super().__init__(**kwargs)
        self.units = units
        self.n_layers = n_layers
        self.state_size = [units, units]
        self.output_size = units

        self.compress = Dense(
            self.units,
            activation='tanh',
            name='compress'
        )

        self.forget_gate = QLSTMGate(
            n_qubits=self.units,
            n_layers=self.n_layers,
            name="forget"
        )
        self.input_gate = QLSTMGate(
            n_qubits=self.units,
            n_layers=self.n_layers,
            name="input"
        )
        self.cell_gate = QLSTMGate(
            n_qubits=self.units,
            n_layers=self.n_layers,
            name="cell"
        )
        self.output_gate = QLSTMGate(
            n_qubits=self.units,
            n_layers=self.n_layers,
            name="output"
        )

    def build(self, input_shape):
        """Build the layer - required by Keras."""
        combined_dim = self.units + input_shape[-1]
        self.compress.build((None, combined_dim))
        self.forget_gate.build((None, self.units))
        self.input_gate.build((None, self.units))
        self.cell_gate.build((None, self.units))
        self.output_gate.build((None, self.units))
        super().build(input_shape)

    def call(self, inputs, states):
        """
        Process one timestep.
        
        Args:
            inputs: Input at current timestep (batch, input_dim)
            states: [h_prev, c_prev] - previous hidden and cell states
        
        Returns:
            output: Current hidden state (batch, units)
            new_states: [h_new, c_new]
        """
        h_prev, c_prev = states
        
        combined = tf.concat([h_prev, inputs], axis=-1)
        
        compressed = self.compress(combined)
        
        quantum_input = compressed * np.pi
        
        f_raw = self.forget_gate(quantum_input)
        i_raw = self.input_gate(quantum_input)
        c_tilde = self.cell_gate(quantum_input)
        o_raw = self.output_gate(quantum_input)
        
        f = (f_raw + 1.0) / 2.0
        i = (i_raw + 1.0) / 2.0
        o = (o_raw + 1.0) / 2.0
        
        c_new = f * c_prev + i * c_tilde
        h_new = o * tf.tanh(c_new)
        
        return h_new, [h_new, c_new]

    def get_initial_state(self, inputs=None, batch_size=None, dtype=None):
        """Return zero initial states."""
        if batch_size is None:
            batch_size = tf.shape(inputs)[0]
        if dtype is None:
            dtype = tf.float32
        return [
            tf.zeros((batch_size, self.units), dtype=dtype),
            tf.zeros((batch_size, self.units), dtype=dtype)
        ]

    def get_config(self):
        """Return config for serialization."""
        config = super().get_config()
        config.update({
            'units': self.units,
            'n_layers': self.n_layers
        })
        return config

    @classmethod
    def from_config(cls, config):
        """Create layer from config."""
        return cls(**config)
    
class QLSTMModel:
    """
    Quantum LSTM Model using Keras layers.
    
    Architecture (same as manual implementation):
        Time Series → QLSTM Cell (4 quantum gates) → Concatenate with Sentiment → Dense → Output
    
    Benefits over manual implementation:
        - Uses Keras training loop (.fit, .predict)
        - Parameter-shift gradients (faster than numerical)
        - Easy integration with other Keras layers
    """
    def __init__(self, timesteps, features, hidden_dim=4, n_layers=2, 
                 n_outputs=4, learning_rate=0.01, dense_units=16):
        """
        Args:
            timesteps: Number of timesteps in input sequence
            features: Number of features per timestep
            hidden_dim: Hidden state dimension (= number of qubits)
            n_layers: Number of VQC layers per gate
            n_outputs: Number of output dimensions
            learning_rate: Learning rate for optimizer
            sentiment_units: Hidden units for sentiment processing
        """
        self.timesteps = timesteps
        self.features = features
        self.hidden_dim = hidden_dim
        self.n_layers = n_layers
        self.n_outputs = n_outputs
        self.learning_rate = learning_rate
        self.dense_units = dense_units
        
        self.model = self._build_model()
        self.history = None

    def _build_model(self):
        ts_input = Input(shape=(self.timesteps, self.features), name='timeseries_input')
        qlstm_cell = QLSTMCell(units=self.hidden_dim, n_layers=self.n_layers)
        qlstm_out = RNN(qlstm_cell, return_sequences=False)(ts_input)

        sent_input = Input(shape=(1,), name='sentiment_input')
        sent_dense = Dense(16, activation='relu')(sent_input)

        combined = Concatenate()([qlstm_out, sent_dense])
        dense_out = Dense(self.dense_units, activation='relu')(combined)
        outputs = Dense(self.n_outputs, activation='linear')(dense_out)

        model = Model(inputs=[ts_input, sent_input], outputs=outputs)
        model.compile(optimizer=Adam(learning_rate=self.learning_rate), loss='mae')

        return model
            
    def fit(self, X_train, sent_train, y_train, epochs=100, batch_size=32, 
            validation_split=0.2, patience=10, verbose=1):
        early_stopping = EarlyStopping(monitor='val_loss', patience=patience, restore_best_weights=True)

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
        self.model = load_model(path, custom_objects={'QLSTMGate': QLSTMGate, 'QLSTMCell': QLSTMCell})
        return self
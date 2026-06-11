'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';

interface StockInputProps {
  onSubmit: (symbol: string) => void;
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
}

export default function StockInput({
  onSubmit,
  placeholder = 'Enter stock symbol (e.g., BBRI)',
  disabled = false,
  isLoading = false,
}: StockInputProps) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  const validateSymbol = (symbol: string): boolean => {
    const trimmed = symbol.trim().toUpperCase();
    if (trimmed.length === 0) {
      setError('Stock symbol cannot be empty');
      return false;
    }
    if (trimmed.length > 5) {
      setError('Stock symbol must be 5 characters or less');
      return false;
    }
    if (!/^[A-Z0-9]+$/.test(trimmed)) {
      setError('Stock symbol must contain only letters and numbers');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateSymbol(input)) {
      onSubmit(input.trim().toUpperCase());
      setInput('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            if (error) setError('');
          }}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          className={`w-full rounded-lg border-2 px-4 py-3 pr-12 text-base font-semibold transition-colors sm:text-lg
            ${error
              ? 'border-red-500 bg-red-950/30'
              : 'border-white/20 bg-white/5'
            }
            ${disabled || isLoading
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:border-white/30 focus:outline-none focus:border-blue-500'
            }
            text-white placeholder-slate-400
          `}
        />
        <button
          type="submit"
          disabled={disabled || isLoading}
          className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 transition-colors sm:right-3
            ${disabled || isLoading
              ? 'text-slate-600 cursor-not-allowed'
              : 'text-slate-300 hover:text-blue-400'
            }
          `}
        >
          <Search className="w-5 h-5" />
        </button>
      </div>
      {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
    </form>
  );
}

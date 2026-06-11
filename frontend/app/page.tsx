'use client';

import { useRouter } from "next/navigation";
import { useStore } from "./lib/store";
import { useState } from "react";
import { api } from "./lib/api";
import { Alert, Spinner, StockInput } from "@/app/components";

export default function Home() {
  const router = useRouter();
  const { setSelectedSymbol } = useStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (symbol: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const stockData = await api.fetchStockData(symbol);

      if (api.isError(stockData)) {
        setError(stockData.message);
        return;
      }

      setSelectedSymbol(symbol);
      router.push(`/${symbol}`);
    } catch (error) {
      setError("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col justify-between overflow-auto">
      <div className="relative flex flex-1 flex-col items-center overflow-hidden px-4 py-8 sm:px-6 sm:py-12 lg:justify-center lg:py-0">
        <div className="relative z-10 mx-auto w-full max-w-5xl lg:-translate-y-6">
          <div className="mb-10 text-center sm:mb-12">
            <div className="mb-4 flex flex-row items-center justify-center gap-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
                Stock Price Predictor
              </h1>
            </div>
            <p className="mx-auto max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg lg:text-xl">
              LSTM and QLSTM powered stock price predictor with real-time sentiment analysis
            </p>
          </div>
          <div className="mx-auto w-full max-w-2xl rounded-2xl border border-white/20 bg-white/10 p-5 shadow-2xl backdrop-blur-md sm:p-8">
            <h2 className="mb-5 text-center text-xl font-bold text-white sm:mb-6 sm:text-2xl">
              Get Started
            </h2>

            {error && (
              <Alert
                message={error}
                onDismiss={() => setError(null)}
              />
            )}

            {isLoading ? (
              <Spinner text="Validating stock symbol..." />
            ) : (
              <div className="mx-auto w-full max-w-md">
                <StockInput
                  onSubmit={handleSubmit}
                  placeholder="Enter stock symbol (e.g., BBRI, BMRI, ASII)"
                  disabled={isLoading}
                  isLoading={isLoading}
                />
              </div>
            )}
          </div>

          <div className="mt-8 text-center sm:mt-12">
            <p className="mb-4 text-sm text-slate-400 sm:mb-5">
              Popular Indonesian stocks to try:
            </p>
            <div className="flex flex-wrap justify-center gap-2.5 sm:gap-3">
              {['BBRI', 'BMRI', 'ASII', 'BBTN', 'ADRO'].map((stock) => (
                <button
                  key={stock}
                  type="button"
                  onClick={() => handleSubmit(stock)}
                  disabled={isLoading}
                  className="min-w-20 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:text-base"
                >
                  {stock}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 bg-black/50 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-5 text-center text-xs leading-relaxed text-slate-400 sm:px-6 sm:py-6 sm:text-sm">
          <p>
            Disclaimer: This is an educational tool. These predictions are not financial advice.
            Please do your own research before making investment decisions.
          </p>
        </div>
      </div>
    </div>
  );
}

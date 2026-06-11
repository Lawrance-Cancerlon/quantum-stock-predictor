"use client";

import { useParams, useRouter } from "next/navigation";
import { useStore } from "../lib/store";
import { useEffect, useState } from "react";
import { StockData } from "../lib/types";
import { api } from "../lib/api";
import { Spinner, Alert } from "../components";
import CandleChart from "../components/CandleChart";
import ModelSelectionCard from "../components/ModelSelectionCard";
import SentimentCard from "../components/SentimentCard";
import FavoriteButton from "../components/FavoriteButton";
import { ArrowLeft } from "lucide-react";

export default function StockPage() {
    const router = useRouter();
    const params = useParams();
    const symbol = params?.symbol as string;
    const {
        selectedModel,
        setSelectedModel,
        currentPrediction,
        currentSentiment,
        setCurrentSentiment,
        isLoading,
        setIsLoading,
        error,
        setError,
        getStockData,
        setStockData,
        makePrediction,
        reset,
    } = useStore();

    const [stockData, setLocalStockData] = useState<StockData[] | null>(null);
    const [chartLoading, setChartLoading] = useState(false);
    const [predictionError, setPredictionError] = useState<string | null>(null);

    useEffect(() => {
        if (!symbol) return;

        const fetch = async () => {
            reset();
            setIsLoading(true);
            setError(null);

            try {
                const cachedData = getStockData(symbol);
                const stockData = cachedData || (await api.fetchStockData(symbol, 500));

                if (api.isError(stockData)) {
                    setError(stockData.message);
                    return;
                }
                setLocalStockData(stockData);
                if (!cachedData) {
                    setStockData(symbol, stockData);
                }

                const sentimentData = await api.fetchSentimentData(symbol);

                if (!api.isError(sentimentData)) {
                    setCurrentSentiment(sentimentData);
                }
            } catch (error) {
                setError("An unexpected error occurred.");
            } finally {
                setIsLoading(false);
            }
        };

        fetch();
    }, [symbol, setIsLoading, setError, setStockData, setCurrentSentiment, getStockData]);

    const handlePredict = async (model: "lstm" | "qlstm") => {
        if (!symbol) return;

        setPredictionError(null);
        await makePrediction(symbol, model);
    };

    const handleDataRangeChange = async (requestedSize?: number) => {
        if (!symbol || !stockData || stockData.length === 0) return;

        const nextRequestSize = requestedSize ?? Math.min(500, stockData.length + 100);

        setChartLoading(true);
        try {
            const newData = await api.fetchStockData(symbol, nextRequestSize);

            if (!api.isError(newData)) {
                const existingDates = new Set(stockData.map(d => d.Date));
                const filteredNewData = newData.filter(d => !existingDates.has(d.Date));
                const mergedData = [...filteredNewData, ...stockData];

                setLocalStockData(mergedData);
                setStockData(symbol, mergedData);
            }
        } catch (err) {
            console.error("Failed to fetch additional data", err);
        } finally {
            setChartLoading(false);
        }
    };

    const handleHome = () => {
        router.push(`/`);
    };

    if (isLoading) {
        return (
            <div className="flex-1 overflow-hidden bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 p-4 sm:p-6">
                <div className="mx-auto flex h-full max-w-7xl items-center justify-center">
                    <Spinner text="Loading stock data..." />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 overflow-hidden bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 p-4 sm:p-6">
                <div className="mx-auto flex h-full max-w-7xl items-center justify-center">
                    <Alert
                        title="Error Loading Stock Data"
                        message={error}
                        onDismiss={() => setError(null)}
                        onRetry={handleHome}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
            <div className="flex-1 min-h-0 overflow-auto p-4 sm:p-6">
                <div className="mx-auto flex min-h-0 max-w-7xl flex-col gap-4 lg:h-full">
                <div className="shrink-0 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleHome}
                            className="p-2 rounded-lg hover:bg-white/10 transition-all"
                        >
                            <ArrowLeft className="w-5 h-5 text-blue-400" />
                        </button>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-white leading-none">
                                {symbol.toUpperCase()}
                            </h1>
                            <p className="mt-1 text-sm text-slate-400">
                                Historical data & prediction analysis
                            </p>
                        </div>
                        <FavoriteButton symbol={symbol} />
                    </div>
                </div>

                <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2.2fr)_minmax(360px,1fr)]">
                    <div className="min-h-0">
                        <div className="min-h-0 rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-md lg:p-5" style={{ height: '100%' }}>
                            {stockData && stockData.length > 0 ? (
                                <CandleChart
                                    data={stockData}
                                    onDataRangeChange={handleDataRangeChange}
                                    isLoading={chartLoading}
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center">
                                    <p className="text-slate-400">No chart data available</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid min-h-0 gap-4 lg:grid-rows-[auto_1fr]">
                        <ModelSelectionCard
                            selectedModel={selectedModel}
                            onModelChange={setSelectedModel}
                            onPredict={handlePredict}
                            prediction={currentPrediction}
                            isLoading={false}
                        />

                        <SentimentCard sentiment={currentSentiment} isLoading={isLoading} />
                    </div>
                </div>

                {predictionError && (
                    <div className="mt-6">
                        <Alert
                            title="Prediction Error"
                            message={predictionError}
                            onDismiss={() => setPredictionError(null)}
                        />
                    </div>
                )}
            </div>
            </div>
            <div className="shrink-0 border-t border-white/10 bg-black/50 backdrop-blur-sm">
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

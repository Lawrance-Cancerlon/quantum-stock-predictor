import { create } from "zustand";
import { PredictionData, SentimentData, StockData } from "./types";
import { api } from "./api";

interface Store {
    selectedSymbol: string | null;
    setSelectedSymbol: (symbol: string | null) => void;

    selectedModel: "lstm" | "qlstm";
    setSelectedModel: (model: "lstm" | "qlstm") => void;

    stockDataCache: Record<string, StockData[]> | null;
    setStockData: (symbol: string, data: StockData[]) => void;
    getStockData: (symbol: string) => StockData[] | null;

    currentPrediction: PredictionData | null;
    setCurrentPrediction: (prediction: PredictionData | null) => void;

    currentSentiment: SentimentData | null;
    setCurrentSentiment: (sentiment: SentimentData | null) => void;

    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;

    error: string | null;
    setError: (error: string | null) => void;

    makePrediction: (symbol: string, model: "lstm" | "qlstm") => Promise<void>;

    reset: () => void;
}

export const useStore = create<Store>((set, get) => ({
    selectedSymbol: null,
    setSelectedSymbol: (symbol) => set({ selectedSymbol: symbol }),

    selectedModel: "lstm",
    setSelectedModel: (model) => set({ selectedModel: model }),

    stockDataCache: null,
    setStockData: (symbol, data) => set((state) => ({
        stockDataCache: {
            ...state.stockDataCache,
            [symbol]: data
        }
    })),
    getStockData: (symbol) => {
        const state = get();
        return state.stockDataCache?.[symbol] || null;
    },

    currentPrediction: null,
    setCurrentPrediction: (prediction) => set({ currentPrediction: prediction }),

    currentSentiment: null,
    setCurrentSentiment: (sentiment) => set({ currentSentiment: sentiment }),

    isLoading: false,
    setIsLoading: (loading) => set({ isLoading: loading }),

    error: null,
    setError: (error) => set({ error: error }),

    makePrediction: async (symbol: string, model: "lstm" | "qlstm") => {
        set({ error: null });
        try {
            const result = await api.fetchPredictionData(symbol, model);

            if ("status" in result && result.status !== 200) {
                set({ error: result.message });
            } else {
                set({ currentPrediction: result as PredictionData });
            }
        } catch (err) {
            set({ error: "Failed to make prediction" });
        }
    },

    reset: () => set({
        selectedSymbol: null,
        selectedModel: "lstm",
        currentPrediction: null,
        currentSentiment: null,
        isLoading: false,
        error: null
    })
}))
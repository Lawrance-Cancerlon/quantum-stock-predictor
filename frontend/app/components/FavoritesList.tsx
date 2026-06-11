"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "../lib/api";
import { FavoriteItem, PredictionData } from "../lib/types";
import { Trash2, Loader } from "lucide-react";

interface FavoriteWithPrice extends FavoriteItem {
    lastPrice?: number;
    lastPriceLoaded: boolean;
    prediction?: PredictionData;
    predictionLoaded: boolean;
}

export default function FavoritesList() {
    const router = useRouter();
    const [favorites, setFavorites] = useState<FavoriteWithPrice[]>([]);
    const [initialLoading, setInitialLoading] = useState(true);
    const [selectedModel, setSelectedModel] = useState<"lstm" | "qlstm">("lstm");

    useEffect(() => {
        const load = async () => {
            const result = await api.getFavorites();
            if (api.isError(result)) {
                setInitialLoading(false);
                return;
            }
            const items: FavoriteWithPrice[] = result.map((f) => ({
                ...f,
                lastPriceLoaded: false,
                predictionLoaded: false,
            }));
            setFavorites(items);
            setInitialLoading(false);

            items.forEach((item, index) => {
                fetchStockInfo(item.symbol, index);
            });
        };
        load();
    }, []);

    useEffect(() => {
        if (favorites.length === 0) return;

        setFavorites((prev) =>
            prev.map((f) => ({ ...f, prediction: undefined, predictionLoaded: false }))
        );

        favorites.forEach((item, index) => {
            fetchPrediction(item.symbol, index, selectedModel);
        });
    }, [selectedModel]);

    const fetchStockInfo = async (symbol: string, index: number) => {
        const stockResult = await api.fetchStockData(symbol, 1);
        const lastPrice = !api.isError(stockResult) && stockResult.length > 0
            ? stockResult[stockResult.length - 1].Close
            : undefined;

        setFavorites((prev) =>
            prev.map((f, i) =>
                i === index ? { ...f, lastPrice, lastPriceLoaded: true } : f
            )
        );

        await fetchPrediction(symbol, index, selectedModel);
    };

    const fetchPrediction = async (symbol: string, index: number, model: "lstm" | "qlstm") => {
        const predResult = await api.fetchPredictionData(symbol, model);
        const prediction = !api.isError(predResult) ? (predResult as PredictionData) : undefined;

        setFavorites((prev) =>
            prev.map((f, i) =>
                i === index ? { ...f, prediction, predictionLoaded: true } : f
            )
        );
    };

    const handleRemove = async (symbol: string) => {
        const result = await api.removeFavorite(symbol);
        if (!api.isError(result)) {
            setFavorites((prev) => prev.filter((f) => f.symbol !== symbol));
        }
    };

    if (initialLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader className="w-6 h-6 text-blue-400 animate-spin" />
            </div>
        );
    }

    if (favorites.length === 0) {
        return (
            <div className="rounded-2xl border border-white/20 bg-white/10 p-8 backdrop-blur-md text-center">
                <p className="text-slate-400">No favorites yet. Browse stocks and click the star to add them.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <p className="text-xs font-medium text-slate-300">Prediction Model:</p>
                <div className="flex gap-1">
                    {(["lstm", "qlstm"] as const).map((model) => (
                        <button
                            key={model}
                            onClick={() => setSelectedModel(model)}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase transition-colors ${
                                selectedModel === model
                                    ? "bg-blue-600 text-white"
                                    : "bg-white/5 text-slate-400 hover:bg-white/10"
                            }`}
                        >
                            {model}
                        </button>
                    ))}
                </div>
            </div>

            {favorites.map((fav) => (
                <div
                    key={fav.id}
                    className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md p-4 hover:bg-white/15 transition-colors cursor-pointer"
                    onClick={() => router.push(`/${fav.symbol}`)}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-white">{fav.symbol}</h3>
                            <p className="text-xs text-slate-400">IDX Stock</p>
                        </div>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRemove(fav.symbol);
                            }}
                            className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
                            title="Remove from favorites"
                        >
                            <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                    </div>

                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-3">
                        <div className="rounded-lg bg-white/5 px-3 py-2">
                            <p className="text-xs text-slate-400">Last Close</p>
                            {fav.lastPriceLoaded ? (
                                <p className="text-sm font-semibold text-white">
                                    {fav.lastPrice != null ? `Rp ${fav.lastPrice.toLocaleString()}` : "N/A"}
                                </p>
                            ) : (
                                <div className="h-4 w-16 bg-slate-700 rounded animate-pulse mt-1" />
                            )}
                        </div>
                        <div className="rounded-lg bg-white/5 px-3 py-2">
                            <p className="text-xs text-slate-400">Pred. Open</p>
                            {fav.predictionLoaded ? (
                                <p className="text-sm font-semibold text-green-400">
                                    {fav.prediction ? `Rp ${fav.prediction.open.toLocaleString()}` : "N/A"}
                                </p>
                            ) : (
                                <div className="h-4 w-16 bg-slate-700 rounded animate-pulse mt-1" />
                            )}
                        </div>
                        <div className="rounded-lg bg-white/5 px-3 py-2">
                            <p className="text-xs text-slate-400">Pred. High</p>
                            {fav.predictionLoaded ? (
                                <p className="text-sm font-semibold text-green-400">
                                    {fav.prediction ? `Rp ${fav.prediction.high.toLocaleString()}` : "N/A"}
                                </p>
                            ) : (
                                <div className="h-4 w-16 bg-slate-700 rounded animate-pulse mt-1" />
                            )}
                        </div>
                        <div className="rounded-lg bg-white/5 px-3 py-2">
                            <p className="text-xs text-slate-400">Pred. Low</p>
                            {fav.predictionLoaded ? (
                                <p className="text-sm font-semibold text-red-400">
                                    {fav.prediction ? `Rp ${fav.prediction.low.toLocaleString()}` : "N/A"}
                                </p>
                            ) : (
                                <div className="h-4 w-16 bg-slate-700 rounded animate-pulse mt-1" />
                            )}
                        </div>
                        <div className="rounded-lg bg-white/5 px-3 py-2">
                            <p className="text-xs text-slate-400">Pred. Close</p>
                            {fav.predictionLoaded ? (
                                <p className="text-sm font-semibold text-blue-400">
                                    {fav.prediction ? `Rp ${fav.prediction.close.toLocaleString()}` : "N/A"}
                                </p>
                            ) : (
                                <div className="h-4 w-16 bg-slate-700 rounded animate-pulse mt-1" />
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

'use client';

import { useState } from 'react';
import { Loader } from 'lucide-react';
import { PredictionData } from '../lib/types';

interface ModelSelectionCardProps {
    selectedModel: 'lstm' | 'qlstm';
    onModelChange: (model: 'lstm' | 'qlstm') => void;
    onPredict: (model: 'lstm' | 'qlstm') => Promise<void>;
    prediction: PredictionData | null;
    isLoading?: boolean;
}

export default function ModelSelectionCard({
    selectedModel,
    onModelChange,
    onPredict,
    prediction,
    isLoading = false,
}: ModelSelectionCardProps) {
    const [isLocalLoading, setIsLocalLoading] = useState(false);

    const handlePredict = async () => {
        setIsLocalLoading(true);
        try {
            await onPredict(selectedModel);
        } finally {
            setIsLocalLoading(false);
        }
    };

    return (
        <div className="flex h-auto lg:h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur-md lg:p-3.5 gap-2">
            <div className="shrink-0">
                <h3 className="text-base font-semibold text-white">Next Day Prediction</h3>
            </div>

            <div className="shrink-0">
                <p className="text-xs font-medium text-slate-300 mb-1.5">Select Model</p>
                <div className="space-y-1">
                    {(['lstm', 'qlstm'] as const).map((model) => (
                        <label
                            key={model}
                            className="flex items-center gap-3 rounded-lg px-3 py-1.5 cursor-pointer transition-all hover:bg-white/5"
                        >
                            <input
                                type="radio"
                                name="model"
                                value={model}
                                checked={selectedModel === model}
                                onChange={() => onModelChange(model)}
                                className="h-4 w-4 accent-blue-400"
                            />
                            <span className="text-sm font-medium uppercase text-white">{model}</span>
                            <span className="ml-auto text-[11px] text-slate-400">
                                {model === 'lstm' ? 'LSTM' : 'Quantum LSTM'}
                            </span>
                        </label>
                    ))}
                </div>
            </div>

            <button
                onClick={handlePredict}
                disabled={isLocalLoading || isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition-all hover:bg-blue-700 disabled:bg-slate-600 shrink-0"
            >
                {isLocalLoading || isLoading ? (
                    <>
                        <Loader className="h-4 w-4 animate-spin" />
                        Predicting...
                    </>
                ) : (
                    <>
                        Predict Next Day
                    </>
                )}
            </button>

            <div className="flex-1 min-h-0 overflow-hidden rounded-lg bg-white/5 p-2 flex flex-col">
                {prediction ? (
                    <div className="flex flex-col h-full">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-300 shrink-0 mb-1.5">
                            Predicted Values
                        </p>
                        <div className="grid grid-cols-2 gap-1.5 flex-1 min-h-0">
                            <div className="rounded bg-white/5 px-2 py-1 flex flex-col justify-center overflow-hidden">
                                <p className="text-[10px] text-slate-400">Open</p>
                                <p className="text-xs font-bold text-green-400 leading-tight truncate">
                                    Rp {prediction.open.toLocaleString()}
                                </p>
                            </div>
                            <div className="rounded bg-white/5 px-2 py-1 flex flex-col justify-center overflow-hidden">
                                <p className="text-[10px] text-slate-400">High</p>
                                <p className="text-xs font-bold text-blue-400 leading-tight truncate">
                                    Rp {prediction.high.toLocaleString()}
                                </p>
                            </div>
                            <div className="rounded bg-white/5 px-2 py-1 flex flex-col justify-center overflow-hidden">
                                <p className="text-[10px] text-slate-400">Low</p>
                                <p className="text-xs font-bold text-purple-400 leading-tight truncate">
                                    Rp {prediction.low.toLocaleString()}
                                </p>
                            </div>
                            <div className="rounded bg-white/5 px-2 py-1 flex flex-col justify-center overflow-hidden">
                                <p className="text-[10px] text-slate-400">Close</p>
                                <p className="text-xs font-bold text-red-400 leading-tight truncate">
                                    Rp {prediction.close.toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col h-full">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 shrink-0 mb-1.5">
                            Predicted Values
                        </p>
                        <div className="grid grid-cols-2 gap-1.5 flex-1 min-h-0">
                            <div className="rounded bg-white/5 px-2 py-1 flex flex-col justify-center">
                                <p className="text-[10px] text-slate-400">Open</p>
                                <p className="text-xs font-bold text-slate-500 leading-tight">--</p>
                            </div>
                            <div className="rounded bg-white/5 px-2 py-1 flex flex-col justify-center">
                                <p className="text-[10px] text-slate-400">High</p>
                                <p className="text-xs font-bold text-slate-500 leading-tight">--</p>
                            </div>
                            <div className="rounded bg-white/5 px-2 py-1 flex flex-col justify-center">
                                <p className="text-[10px] text-slate-400">Low</p>
                                <p className="text-xs font-bold text-slate-500 leading-tight">--</p>
                            </div>
                            <div className="rounded bg-white/5 px-2 py-1 flex flex-col justify-center">
                                <p className="text-[10px] text-slate-400">Close</p>
                                <p className="text-xs font-bold text-slate-500 leading-tight">--</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

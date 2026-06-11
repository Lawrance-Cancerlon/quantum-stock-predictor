'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { SentimentData } from '../lib/types';
import Spinner from './Spinner';

interface SentimentCardProps {
    sentiment: SentimentData | null;
    isLoading?: boolean;
}

export default function SentimentCard({ sentiment, isLoading = false }: SentimentCardProps) {
    const sentimentColor = useMemo(() => {
        if (!sentiment) return 'gray';
        if (sentiment.positive > sentiment.negative && sentiment.positive > sentiment.neutral) {
            return 'green';
        } else if (sentiment.negative > sentiment.positive && sentiment.negative > sentiment.neutral) {
            return 'red';
        }
        return 'gray';
    }, [sentiment]);

    const sentimentLabel = useMemo(() => {
        if (!sentiment) return 'N/A';
        if (sentiment.positive > sentiment.negative && sentiment.positive > sentiment.neutral) {
            return 'Positive';
        } else if (sentiment.negative > sentiment.positive && sentiment.negative > sentiment.neutral) {
            return 'Negative';
        }
        return 'Neutral';
    }, [sentiment]);

    const pieData = useMemo(() => {
        if (!sentiment) return [];
        return [
            { name: 'Positive', value: sentiment.positive },
            { name: 'Negative', value: sentiment.negative },
            { name: 'Neutral', value: sentiment.neutral },
        ].filter(item => item.value > 0);
    }, [sentiment]);

    const colorMap: Record<string, string> = {
        'Positive': '#10b981',
        'Negative': '#ef4444',
        'Neutral': '#94a3b8',
    };

    const CustomTooltip = (props: any) => {
        const { active, payload } = props;
        if (!active || !payload || payload.length === 0) return null;
        return (
            <div className="bg-slate-900/90 border border-blue-400/30 rounded-lg p-2 backdrop-blur-md">
                <p className="text-blue-300 text-sm font-semibold">{payload[0].name}</p>
                <p className="text-white text-sm">{payload[0].value.toFixed(1)}%</p>
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="flex h-auto lg:h-full min-h-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-md lg:p-5">
                <Spinner text="Loading sentiment..." />
            </div>
        );
    }

    if (!sentiment) {
        return (
            <div className="flex h-auto lg:h-full min-h-0 flex-col rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-md lg:p-5">
                <div className="mb-3 shrink-0">
                    <h3 className="text-base font-semibold text-white">Market Sentiment</h3>
                </div>
                <p className="text-sm text-slate-400">No sentiment data available</p>
            </div>
        );
    }

    return (
        <div className="flex h-auto lg:h-full min-h-0 flex-col rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-md lg:p-5">
            <div className="mb-3 shrink-0">
                <h3 className="text-base font-semibold text-white">Market Sentiment</h3>
            </div>

            <div className="mb-3 rounded-lg bg-white/5 p-3 text-center shrink-0">
                <p className="mb-1 text-[11px] uppercase tracking-wide text-slate-400">Overall Sentiment</p>
                <div className="flex items-baseline justify-center gap-2">
                    <span
                        className={`text-lg font-semibold ${
                            sentimentColor === 'green'
                                ? 'text-green-400'
                                : sentimentColor === 'red'
                                ? 'text-red-400'
                                : 'text-slate-400'
                        }`}
                    >
                        {sentimentLabel}
                    </span>
                </div>
            </div>

            {pieData.length > 0 && (
                <div className="mb-3 flex-1 min-h-37.5">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={38}
                                outerRadius={62}
                                dataKey="value"
                                isAnimationActive={false}
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={colorMap[entry.name]} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            )}

            <div className="mt-auto grid grid-cols-3 gap-2 text-sm shrink-0">
                <div className="flex flex-col items-start justify-between rounded bg-white/5 p-2">
                    <span className="text-green-400">Positive</span>
                    <span className="font-semibold text-white">{(sentiment.positive * 100).toFixed(1)}%</span>
                </div>
                <div className="flex flex-col items-start justify-between rounded bg-white/5 p-2">
                    <span className="text-red-400">Negative</span>
                    <span className="font-semibold text-white">{(sentiment.negative * 100).toFixed(1)}%</span>
                </div>
                <div className="flex flex-col items-start justify-between rounded bg-white/5 p-2">
                    <span className="text-slate-400">Neutral</span>
                    <span className="font-semibold text-white">{(sentiment.neutral * 100).toFixed(1)}%</span>
                </div>
            </div>
        </div>
    );
}

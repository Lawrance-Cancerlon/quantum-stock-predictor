'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StockData } from '../lib/types';

interface CandleChartProps {
    data: StockData[];
    onDataRangeChange?: (requestedSize?: number) => void;
    isLoading?: boolean;
}

type TooltipState = {
    x: number;
    y: number;
    point: StockData;
} | null;

const VIEWBOX_WIDTH = 1000;
const PRICE_TOP = 18;
const PRICE_HEIGHT = 402;
const LEFT_PAD = 64;
const RIGHT_PAD = 24;
const PRICE_INNER_PAD = 10;
const VOL_VIEWBOX_HEIGHT = 360;
const VOL_TOP_DEFAULT = 18;
const VOL_LABEL_OFFSET = 12;
const MIN_ZOOM_LEVEL = 20;
const HISTORY_CAP = 500;

function formatDateLabel(date: string) {
    return new Date(date).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
    });
}

function formatNumber(value: number) {
    return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export default function CandleChart({ data, onDataRangeChange, isLoading = false }: CandleChartProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [zoomLevel, setZoomLevel] = useState(60);
    const [visibleStart, setVisibleStart] = useState(0);
    const isPanning = useRef(false);
    const panStartX = useRef(0);
    const panStartIndex = useRef(0);
    const pendingIndex = useRef<number | null>(null);
    const rafId = useRef<number | null>(null);
    const chartMetricsRef = useRef<any>(null);
    const [tooltip, setTooltip] = useState<TooltipState>(null);
    const [hasRequestedMore, setHasRequestedMore] = useState(false);

    useEffect(() => {
        setZoomLevel((current) => Math.min(current, Math.max(MIN_ZOOM_LEVEL, data.length)));
        setVisibleStart(() => Math.max(0, data.length - Math.min(data.length, 60)));
    }, [data.length]);

    useEffect(() => {
        if (data.length > 0) {
            setHasRequestedMore(false);
        }
    }, [data.length]);

    const visibleData = useMemo(() => {
        const maxStart = Math.max(0, data.length - zoomLevel);
        const start = Math.max(0, Math.min(visibleStart, maxStart));
        const end = Math.min(data.length, start + zoomLevel);
        if (data.length === 0) return [];
        return data.slice(start, end);
    }, [data, zoomLevel, visibleStart]);

    const chartMetrics = useMemo(() => {
        const prices = visibleData
            .flatMap((item) => [item.High, item.Low])
            .filter((v): v is number => v != null && isFinite(v));
        const priceMin = prices.length > 0 ? Math.min(...prices) : 0;
        const priceMax = prices.length > 0 ? Math.max(...prices) : 1;
        const priceRange = priceMax - priceMin || 1;
        const volumeMax = Math.max(...visibleData.map((item) => item.Volume).filter((v): v is number => v != null && isFinite(v)), 1);

        const plotWidth = VIEWBOX_WIDTH - LEFT_PAD - RIGHT_PAD - PRICE_INNER_PAD * 2;
        const pricePlotTop = PRICE_TOP + PRICE_INNER_PAD;
        const pricePlotHeight = PRICE_HEIGHT - PRICE_INNER_PAD * 2;
        const priceScale = (value: number) => pricePlotTop + (pricePlotHeight - ((value - priceMin) / priceRange) * pricePlotHeight);
        const step = visibleData.length > 0 ? plotWidth / visibleData.length : plotWidth;

        const metrics = { plotWidth, priceScale, step, volumeMax, pricePlotTop, pricePlotHeight };
        chartMetricsRef.current = metrics;
        return metrics;
    }, [visibleData]);

    const requestMoreHistory = () => {
        if (!data.length || hasRequestedMore || data.length >= HISTORY_CAP) {
            return;
        }

        const nextRequestSize = Math.min(HISTORY_CAP, Math.max(data.length + 100, Math.ceil(data.length * 1.5)));
        setHasRequestedMore(true);
        onDataRangeChange?.(nextRequestSize);
        window.setTimeout(() => setHasRequestedMore(false), 1200);
    };

    const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
        event.preventDefault();

        if (event.deltaY > 0) {
            setZoomLevel((current) => {
                const next = Math.min(HISTORY_CAP, current + 8);
                if (next > data.length) {
                    requestMoreHistory();
                }
                return next;
            });
        } else {
            setZoomLevel((current) => Math.max(MIN_ZOOM_LEVEL, current - 8));
        }
    };

    const yTicks = useMemo(() => {
        if (visibleData.length === 0) return [];

        const prices = visibleData
            .flatMap((item) => [item.High, item.Low])
            .filter((v): v is number => v != null && isFinite(v));
        if (prices.length === 0) return [];
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const span = max - min || 1;
        const ticks = 4;

        return Array.from({ length: ticks + 1 }, (_, index) => {
            const value = min + (span / ticks) * index;
            return {
                value,
                y: chartMetrics.priceScale(value),
            };
        });
    }, [visibleData, chartMetrics]);

    const volumeTicks = useMemo(() => {
        if (visibleData.length === 0) return [];

        const max = chartMetrics.volumeMax || 1;
        const ticks = 4;

        const VOL_TOP = VOL_TOP_DEFAULT;
        const VOL_BOTTOM = VOL_VIEWBOX_HEIGHT - VOL_LABEL_OFFSET;
        const VOL_PLOT_HEIGHT = VOL_BOTTOM - VOL_TOP;

        return Array.from({ length: ticks + 1 }, (_, index) => {
            const value = (max / ticks) * index;
            const y = VOL_TOP + VOL_PLOT_HEIGHT - (value / max) * VOL_PLOT_HEIGHT;
            return { value, y };
        });
    }, [visibleData, chartMetrics]);

    const closeAreaPath = useMemo(() => {
        if (visibleData.length === 0) {
            return '';
        }
        const baseline = PRICE_TOP + PRICE_HEIGHT - PRICE_INNER_PAD;
        const validPoints = visibleData
            .map((point, index) => ({ point, index }))
            .filter(({ point }) => point.Close != null && isFinite(point.Close));
        if (validPoints.length === 0) return '';
        const points = validPoints.map(({ point, index }) => {
            const x = LEFT_PAD + PRICE_INNER_PAD + index * chartMetrics.step + chartMetrics.step / 2;
            const y = chartMetrics.priceScale(point.Close!);
            return `${x},${y}`;
        });

        const firstX = LEFT_PAD + PRICE_INNER_PAD + validPoints[0].index * chartMetrics.step + chartMetrics.step / 2;
        const lastX = LEFT_PAD + PRICE_INNER_PAD + validPoints[validPoints.length - 1].index * chartMetrics.step + chartMetrics.step / 2;

        return [`M ${firstX} ${baseline}`, `L ${points.join(' L ')}`, `L ${lastX} ${baseline}`, 'Z'].join(' ');
    }, [visibleData, chartMetrics]);

    useEffect(() => {
        return () => {
            if (rafId.current) {
                cancelAnimationFrame(rafId.current);
                rafId.current = null;
            }
            pendingIndex.current = null;
        };
    }, []);

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!e.isPrimary) return;
        if (zoomLevel >= data.length) return;
        const el = containerRef.current;
        e.preventDefault();
        try { el?.setPointerCapture(e.pointerId); } catch {}
        isPanning.current = true;
        panStartX.current = e.clientX;
        panStartIndex.current = visibleStart;
        (document.body.style as any).userSelect = 'none';
        try { (document.body.style as any).overflowX = 'hidden'; } catch {}
    };

    const flushPending = () => {
        if (pendingIndex.current == null) return;
        setVisibleStart(pendingIndex.current);
        pendingIndex.current = null;
        if (rafId.current) {
            cancelAnimationFrame(rafId.current);
            rafId.current = null;
        }
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isPanning.current) return;
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const deltaX = e.clientX - panStartX.current;
        const step = chartMetricsRef.current?.step || 1;
        const indexDelta = Math.round(-deltaX / step);
        const maxStart = Math.max(0, data.length - zoomLevel);
        const next = Math.max(0, Math.min(maxStart, panStartIndex.current + indexDelta));

        pendingIndex.current = next;
        if (rafId.current == null) {
            rafId.current = requestAnimationFrame(() => {
                flushPending();
            });
        }
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!e.isPrimary) return;
        const el = containerRef.current;
        try { el?.releasePointerCapture(e.pointerId); } catch {}
        isPanning.current = false;
        flushPending();
        (document.body.style as any).userSelect = '';
        try { (document.body.style as any).overflowX = ''; } catch {}
    };

    const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
        handlePointerUp(e);
    };

    return (
        <div
            ref={containerRef}
            className="relative flex h-full min-h-0 flex-col gap-2 overflow-hidden"
            style={{ touchAction: 'none' }}
            onWheel={handleWheel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            onMouseLeave={() => { setTooltip(null); isPanning.current = false; pendingIndex.current = null; try { (document.body.style as any).overflowX = ''; } catch {} }}
        >
            {isLoading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-slate-950/50 backdrop-blur-sm">
                    <div className="h-8 w-8 animate-spin rounded-full border border-blue-400 border-t-transparent" />
                </div>
            )}

            <div className="shrink-0 flex items-center justify-between px-1 text-xs text-slate-400">
                <span>Scroll to zoom</span>
                <span>{zoomLevel >= data.length ? 'All loaded' : `${visibleData.length} candles`}</span>
            </div>

            <div className="relative min-h-0 rounded-xl border border-slate-700/60 bg-slate-950/40 overflow-hidden" style={{ flex: '4 1 0%', minHeight: 0 }}>
                <svg viewBox={`0 0 ${VIEWBOX_WIDTH} ${PRICE_TOP + PRICE_HEIGHT}`} preserveAspectRatio="none" className="h-full w-full">
                    <defs>
                        <linearGradient id="closeAreaFill" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.30" />
                            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.03" />
                        </linearGradient>
                    </defs>
                    <rect x="0" y="0" width={VIEWBOX_WIDTH} height={PRICE_TOP + PRICE_HEIGHT} fill="rgba(15, 23, 42, 0.36)" />

                    {closeAreaPath && <path d={closeAreaPath} fill="url(#closeAreaFill)" />}

                    {yTicks.map((tick) => (
                        <g key={tick.value}>
                            <line x1={LEFT_PAD} x2={VIEWBOX_WIDTH - RIGHT_PAD} y1={tick.y} y2={tick.y} stroke="#334155" strokeDasharray="4 4" />
                            <text x={10} y={tick.y + 4} fill="#94a3b8" fontSize="12">{formatNumber(tick.value)}</text>
                        </g>
                    ))}

                    {visibleData.map((point, index) => {
                        if (point.Open == null || point.Close == null || point.High == null || point.Low == null) {
                            return null;
                        }
                        const xCenter = LEFT_PAD + PRICE_INNER_PAD + index * chartMetrics.step + chartMetrics.step / 2;
                        const candleWidth = Math.max(4, chartMetrics.step * 0.55);
                        const color = point.Close >= point.Open ? '#10b981' : '#ef4444';
                        const bodyTop = chartMetrics.priceScale(Math.max(point.Open, point.Close));
                        const bodyBottom = chartMetrics.priceScale(Math.min(point.Open, point.Close));
                        const bodyHeight = Math.max(bodyBottom - bodyTop, 1);
                        const wickTop = chartMetrics.priceScale(point.High);
                        const wickBottom = chartMetrics.priceScale(point.Low);

                        return (
                            <g key={`${point.Date}-${index}`}>
                                <line x1={xCenter} x2={xCenter} y1={wickTop} y2={wickBottom} stroke={color} strokeWidth={2} />
                                <rect x={xCenter - candleWidth / 2} y={bodyTop} width={candleWidth} height={bodyHeight} rx={1} fill={color} opacity={0.95} />
                            </g>
                        );
                    })}

                    {visibleData.map((point, index) => {
                        if (visibleData.length < 10 || index % Math.max(1, Math.floor(visibleData.length / 6)) !== 0) {
                            return null;
                        }

                        const x = LEFT_PAD + PRICE_INNER_PAD + index * chartMetrics.step + chartMetrics.step / 2;
                        return (
                            <text key={`${point.Date}-tick`} x={x} y={PRICE_TOP + PRICE_HEIGHT - 8} fill="#94a3b8" fontSize="11" textAnchor="middle">
                                {formatDateLabel(point.Date)}
                            </text>
                        );
                    })}

                    <text x={LEFT_PAD} y={18} fill="#cbd5e1" fontSize="12" fontWeight={600}>Price</text>
                </svg>

                {tooltip && tooltip.point.Open != null && (
                    <div
                        className="pointer-events-none absolute z-20 rounded-lg border border-blue-400/30 bg-slate-950/90 px-3 py-2 text-xs text-white shadow-xl backdrop-blur-md"
                        style={{
                            left: Math.min(tooltip.x + 12, VIEWBOX_WIDTH - 170),
                            top: Math.max(tooltip.y, 12),
                        }}
                    >
                        <div className="mb-1 font-semibold text-blue-300">{tooltip.point.Date}</div>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                            <span className="text-slate-400">Open</span><span>{tooltip.point.Open.toFixed(2)}</span>
                            <span className="text-slate-400">High</span><span>{tooltip.point.High.toFixed(2)}</span>
                            <span className="text-slate-400">Low</span><span>{tooltip.point.Low.toFixed(2)}</span>
                            <span className="text-slate-400">Close</span><span>{tooltip.point.Close.toFixed(2)}</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="relative min-h-0 rounded-xl border border-slate-700/60 bg-slate-950/30 overflow-hidden" style={{ flex: '1.3 1 0%', minHeight: 0 }}>
                <svg viewBox={`0 0 ${VIEWBOX_WIDTH} ${VOL_VIEWBOX_HEIGHT}`} preserveAspectRatio="none" className="h-full w-full">
                    <defs>
                        <linearGradient id="volumeFillUp" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.90" />
                            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.55" />
                        </linearGradient>
                        <linearGradient id="volumeFillDown" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.90" />
                            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.55" />
                        </linearGradient>
                    </defs>
                    <rect x="0" y="0" width={VIEWBOX_WIDTH} height={VOL_VIEWBOX_HEIGHT} fill="rgba(2, 6, 23, 0.28)" />

                    {volumeTicks.map((tick) => (
                        <g key={tick.value}>
                            <line x1={LEFT_PAD} x2={VIEWBOX_WIDTH - RIGHT_PAD} y1={tick.y} y2={tick.y} stroke="#1f2937" strokeDasharray="4 4" />
                            <text x={10} y={tick.y + 4} fill="#94a3b8" fontSize="12">{Math.round(tick.value / 1_000_000)}M</text>
                        </g>
                    ))}

                    {visibleData.map((point, index) => {
                        if (point.Volume == null || point.Open == null || point.Close == null) {
                            return null;
                        }
                        const VOL_TOP = VOL_TOP_DEFAULT;
                        const VOL_BOTTOM = VOL_VIEWBOX_HEIGHT - VOL_LABEL_OFFSET;
                        const VOL_PLOT_HEIGHT = VOL_BOTTOM - VOL_TOP;

                        const xCenter = LEFT_PAD + PRICE_INNER_PAD + index * chartMetrics.step + chartMetrics.step / 2;
                        const barWidth = Math.max(4, chartMetrics.step * 0.55);
                        const max = chartMetrics.volumeMax || 1;
                        const barHeight = (point.Volume / max) * VOL_PLOT_HEIGHT;
                        const barTop = VOL_TOP + (VOL_PLOT_HEIGHT - barHeight);
                        const color = point.Close >= point.Open ? '#3b82f6' : '#a855f7';

                        return (
                            <rect
                                key={`${point.Date}-volume`}
                                x={xCenter - barWidth / 2}
                                y={barTop}
                                width={barWidth}
                                height={Math.max(barHeight, 1)}
                                rx={1}
                                fill={point.Close >= point.Open ? 'url(#volumeFillUp)' : 'url(#volumeFillDown)'}
                                opacity={0.88}
                            />
                        );
                    })}

                    {visibleData.map((point, index) => {
                        if (visibleData.length < 10 || index % Math.max(1, Math.floor(visibleData.length / 6)) !== 0) {
                            return null;
                        }

                        const x = LEFT_PAD + PRICE_INNER_PAD + index * chartMetrics.step + chartMetrics.step / 2;
                        const labelY = VOL_VIEWBOX_HEIGHT - 8;
                        return (
                            <text key={`${point.Date}-volume-tick`} x={x} y={labelY} fill="#94a3b8" fontSize="11" textAnchor="middle">
                                {formatDateLabel(point.Date)}
                            </text>
                        );
                    })}

                    <text x={LEFT_PAD} y={18} fill="#cbd5e1" fontSize="12" fontWeight={600}>Volume</text>
                </svg>
            </div>
        </div>
    );
}

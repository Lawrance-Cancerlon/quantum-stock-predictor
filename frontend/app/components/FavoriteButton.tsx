"use client";

import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { useAuthStore } from "../lib/auth-store";
import { api } from "../lib/api";
import { useRouter } from "next/navigation";

interface FavoriteButtonProps {
    symbol: string;
}

export default function FavoriteButton({ symbol }: FavoriteButtonProps) {
    const { isAuthenticated } = useAuthStore();
    const router = useRouter();
    const [isFavorite, setIsFavorite] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) return;
        api.isFavorited(symbol).then(setIsFavorite);
    }, [symbol, isAuthenticated]);

    const toggle = async () => {
        if (!isAuthenticated) {
            router.push("/login");
            return;
        }
        setIsLoading(true);
        if (isFavorite) {
            const result = await api.removeFavorite(symbol);
            if (!api.isError(result)) setIsFavorite(false);
        } else {
            const result = await api.addFavorite(symbol);
            if (!api.isError(result)) setIsFavorite(true);
        }
        setIsLoading(false);
    };

    return (
        <button
            onClick={toggle}
            disabled={isLoading}
            className="p-2 rounded-lg hover:bg-white/10 transition-all"
            title={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
            <Star
                className={`w-5 h-5 transition-colors ${
                    isFavorite ? "fill-yellow-400 text-yellow-400" : "text-slate-400"
                }`}
            />
        </button>
    );
}

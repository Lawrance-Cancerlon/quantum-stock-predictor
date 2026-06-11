"use client";

import AuthGate from "../components/AuthGate";
import FavoritesList from "../components/FavoritesList";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function FavoritesPage() {
    const router = useRouter();

    return (
        <AuthGate>
            <div className="flex flex-1 min-h-0 flex-col bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 p-4 sm:p-6 overflow-auto">
                <div className="mx-auto max-w-7xl w-full">
                    <div className="flex items-center gap-4 mb-6">
                        <button
                            onClick={() => router.push("/")}
                            className="p-2 rounded-lg hover:bg-white/10 transition-all"
                        >
                            <ArrowLeft className="w-5 h-5 text-blue-400" />
                        </button>
                        <h1 className="text-2xl sm:text-3xl font-bold text-white">My Favorites</h1>
                    </div>
                    <FavoritesList />
                </div>
            </div>
        </AuthGate>
    );
}

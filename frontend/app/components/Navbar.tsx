"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useAuthStore } from "../lib/auth-store";
import { Star, LogOut } from "lucide-react";

export default function Navbar() {
    const { user, isAuthenticated, isLoading, initialize, logout } = useAuthStore();

    useEffect(() => {
        initialize();
    }, [initialize]);

    if (isLoading) return null;

    return (
        <nav className="border-b border-white/10 bg-black/30 backdrop-blur-md px-4 py-3 relative z-50">
            <div className="mx-auto max-w-7xl flex items-center justify-between">
                <Link href="/" className="text-lg font-bold text-white">
                    Stock Predictor
                </Link>
                <div className="flex items-center gap-4">
                    {isAuthenticated ? (
                        <>
                            <Link
                                href="/favorites"
                                className="text-sm text-slate-300 hover:text-white transition-colors flex items-center gap-1"
                            >
                                <Star className="w-4 h-4" /> Favorites
                            </Link>
                            <span className="text-sm text-slate-400">{user?.username}</span>
                            <button
                                onClick={logout}
                                className="text-sm text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
                            >
                                <LogOut className="w-4 h-4" /> Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link
                                href="/login"
                                className="text-sm text-slate-300 hover:text-white transition-colors flex items-center gap-1"
                            >
                                Login
                            </Link>
                            <Link
                                href="/register"
                                className="text-sm bg-blue-600 px-3 py-1.5 rounded-lg text-white hover:bg-blue-700 transition-colors flex items-center gap-1"
                            >
                                Register
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}

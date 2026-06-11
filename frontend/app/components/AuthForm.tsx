"use client";

import { useState } from "react";
import { useAuthStore } from "../lib/auth-store";
import { useRouter } from "next/navigation";
import { Loader } from "lucide-react";

interface AuthFormProps {
    mode: "login" | "register";
}

export default function AuthForm({ mode }: AuthFormProps) {
    const router = useRouter();
    const { login, register } = useAuthStore();
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        const errMsg = mode === "login"
            ? await login(username, password)
            : await register(username, email, password);

        setIsLoading(false);
        if (errMsg) {
            setError(errMsg);
        } else {
            router.push("/");
        }
    };

    return (
        <div className="rounded-2xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-md sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-1.5">
                        Username
                    </label>
                    <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
                        placeholder="Enter your username"
                    />
                </div>

                {mode === "register" && (
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
                            placeholder="Enter your email"
                        />
                    </div>
                )}

                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1.5">
                        Password
                    </label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
                        placeholder="Enter your password"
                    />
                </div>

                {error && (
                    <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {isLoading && <Loader className="w-4 h-4 animate-spin" />}
                    {isLoading
                        ? (mode === "login" ? "Logging in..." : "Creating account...")
                        : (mode === "login" ? "Login" : "Create Account")
                    }
                </button>
            </form>
        </div>
    );
}

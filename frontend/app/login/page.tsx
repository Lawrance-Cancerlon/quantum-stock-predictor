"use client";

import AuthForm from "../components/AuthForm";
import Link from "next/link";

export default function LoginPage() {
    return (
        <div className="flex flex-1 items-center justify-center bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">Welcome Back</h1>
                    <p className="mt-2 text-sm text-slate-400">Sign in to manage your favorites</p>
                </div>
                <AuthForm mode="login" />
                <p className="text-center text-sm text-slate-400 mt-6">
                    Don&apos;t have an account?{" "}
                    <Link href="/register" className="text-blue-400 hover:underline">
                        Register
                    </Link>
                </p>
            </div>
        </div>
    );
}

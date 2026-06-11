"use client";

import AuthForm from "../components/AuthForm";
import Link from "next/link";

export default function RegisterPage() {
    return (
        <div className="flex flex-1 items-center justify-center bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">Create Account</h1>
                    <p className="mt-2 text-sm text-slate-400">Join to start tracking your favorite stocks</p>
                </div>
                <AuthForm mode="register" />
                <p className="text-center text-sm text-slate-400 mt-6">
                    Already have an account?{" "}
                    <Link href="/login" className="text-blue-400 hover:underline">
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
}

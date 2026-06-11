"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../lib/auth-store";
import Spinner from "./Spinner";

export default function AuthGate({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { isAuthenticated, isLoading } = useAuthStore();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push("/login");
        }
    }, [isLoading, isAuthenticated, router]);

    if (isLoading) return <Spinner text="Checking authentication..." />;
    if (!isAuthenticated) return null;

    return <>{children}</>;
}

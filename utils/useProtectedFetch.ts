"use client";

import { useUser } from "@auth0/nextjs-auth0/client";
import { useRouter } from "next/navigation"; // Update to use App Router navigation
import { useEffect, useState } from "react";

export function useProtectedFetch() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/api/auth/login");
    }

    if (!isLoading && user) {
      setIsReady(true);
    }
  }, [user, isLoading, router]);

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    if (!isReady) {
      throw new Error("User not authenticated");
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 401) {
        router.push("/api/auth/login");
        throw new Error("Unauthorized");
      }

      return response;
    } catch (error) {
      console.error("Error making authenticated request:", error);
      throw error;
    }
  };

  return { fetchWithAuth, isReady, user };
}

"use client";

import { useUser } from "@auth0/nextjs-auth0/client";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { LogIn, LogOut, UserCircle } from "lucide-react";
import { useState } from "react";

export default function AuthButton() {
  const { user, error, isLoading } = useUser();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Handle login click
  const handleLogin = () => {
    // Get current path for returnTo
    const currentPath = window.location.pathname;
    const returnParam = encodeURIComponent(currentPath);

    // Navigate to login with returnTo parameter
    router.push(`/api/auth/login?returnTo=${returnParam}`);
  };

  // Handle logout click
  const handleLogout = () => {
    router.push("/api/auth/logout");
  };

  if (isLoading) {
    return (
      <Button variant="outline" disabled className="flex gap-2 items-center">
        <UserCircle className="h-4 w-4 animate-pulse" />
        <span className="animate-pulse">Loading...</span>
      </Button>
    );
  }

  if (error) {
    console.error("Auth error:", error);
    return (
      <Button
        onClick={handleLogin}
        variant="destructive"
        className="flex gap-2 items-center"
      >
        <LogIn className="h-4 w-4" />
        <span>Login Error</span>
      </Button>
    );
  }

  if (user) {
    return (
      <div className="relative">
        <div
          className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-800 cursor-pointer"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {user.picture ? (
            <div className="w-8 h-8 rounded-full overflow-hidden">
              <Image
                src={user.picture}
                alt={user.name || "User"}
                width={32}
                height={32}
                className="object-cover"
                priority
              />
            </div>
          ) : (
            <UserCircle className="h-8 w-8 text-green-400" />
          )}
          <div className="hidden md:block">
            <div className="text-sm font-semibold text-green-400">
              {user.name}
            </div>
            <div className="text-xs text-gray-400">{user.email}</div>
          </div>
        </div>

        {isMenuOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-green-600/30 rounded-md shadow-lg p-2 z-10">
            <div className="md:hidden p-2 border-b border-gray-700">
              <div className="text-sm font-semibold text-green-400">
                {user.name}
              </div>
              <div className="text-xs text-gray-400 truncate">{user.email}</div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 hover:text-green-400 rounded flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <Button onClick={handleLogin} className="flex gap-2 items-center">
      <LogIn className="h-4 w-4" />
      <span>Sign In</span>
    </Button>
  );
}

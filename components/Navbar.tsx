"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Home, MessageSquare, Shield } from "lucide-react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { user, isLoading } = useUser();

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  // Define navigation items
  const navItems = [
    { label: "Home", href: "/", icon: <Home className="h-4 w-4" /> },
    {
      label: "Chatbot",
      href: "/chatbot",
      icon: <MessageSquare className="h-4 w-4" />,
    },
  ];

  // Only add Protected route for logged-in users
  if (user) {
    navItems.push({
      label: "Protected",
      href: "/protected",
      icon: <Shield className="h-4 w-4" />,
    });
  }

  // Handle login/logout
  const handleAuth = () => {
    if (user) {
      window.location.href = "/api/auth/logout";
    } else {
      const returnTo = encodeURIComponent(pathname);
      window.location.href = `/api/auth/login?returnTo=${returnTo}`;
    }
  };

  return (
    <nav className="bg-gray-900 border-b border-green-600/30">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between h-16">
          {/* Logo and desktop navigation */}
          <div className="flex items-center">
            <Link
              href="/"
              className="flex-shrink-0 flex items-center text-green-400 font-pixel"
            >
              <span className="text-xl">TechStack</span>
            </Link>
            <div className="hidden md:ml-6 md:flex md:space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    pathname === item.href
                      ? "bg-gray-800 text-green-400"
                      : "text-gray-300 hover:bg-gray-700 hover:text-green-400"
                  )}
                >
                  {item.icon}
                  <span className="ml-2">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Auth button and mobile menu button */}
          <div className="flex items-center">
            <div className="hidden md:flex items-center">
              <button
                onClick={handleAuth}
                className="px-4 py-2 text-sm font-medium rounded-md border border-green-500 hover:bg-green-500 hover:text-black transition-colors"
              >
                {isLoading ? "Loading..." : user ? "Sign Out" : "Sign In"}
              </button>
              {user && (
                <div className="ml-3 flex items-center">
                  <div className="text-sm font-medium text-gray-300">
                    {user.name}
                  </div>
                  {user.picture && (
                    <img
                      className="ml-2 h-8 w-8 rounded-full border border-green-500/50"
                      src={user.picture}
                      alt={user.name || "User"}
                    />
                  )}
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden ml-2 flex items-center">
              <button
                onClick={toggleMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-green-400 hover:bg-gray-700"
                aria-expanded={isOpen}
              >
                <span className="sr-only">Open main menu</span>
                {isOpen ? (
                  <X className="block h-6 w-6" />
                ) : (
                  <Menu className="block h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-gray-800 border-t border-gray-700">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMenu}
                className={cn(
                  "flex items-center px-3 py-2 rounded-md text-base font-medium",
                  pathname === item.href
                    ? "bg-gray-700 text-green-400"
                    : "text-gray-300 hover:bg-gray-700 hover:text-green-400"
                )}
              >
                {item.icon}
                <span className="ml-2">{item.label}</span>
              </Link>
            ))}

            {/* Mobile auth button */}
            <button
              onClick={handleAuth}
              className="w-full mt-4 flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md border border-green-500 hover:bg-green-500 hover:text-black transition-colors"
            >
              {isLoading ? "Loading..." : user ? "Sign Out" : "Sign In"}
            </button>

            {/* Mobile user info */}
            {user && (
              <div className="flex items-center mt-4 px-3 py-2">
                {user.picture && (
                  <img
                    className="h-10 w-10 rounded-full border border-green-500/50"
                    src={user.picture}
                    alt={user.name || "User"}
                  />
                )}
                <div className="ml-3">
                  <div className="text-base font-medium text-green-300">
                    {user.name}
                  </div>
                  <div className="text-sm font-medium text-gray-400 truncate max-w-[200px]">
                    {user.email}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

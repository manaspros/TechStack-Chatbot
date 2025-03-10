"use client";

import { useUser } from "@auth0/nextjs-auth0/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Shield,
  User,
  Clock,
  Calendar,
  Mail,
  Key,
  RefreshCcw,
  MessageSquare,
  LogOut,
  Globe,
  LinkIcon,
  Phone,
  CheckCircle,
  XCircle,
  Info,
} from "lucide-react";
import { format } from "date-fns";

export default function ProtectedPage() {
  const { user, error, isLoading } = useUser();
  const router = useRouter();
  const [lastLogin, setLastLogin] = useState<string | null>(null);

  // Handle redirecting to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user && !error) {
      router.push("/api/auth/login?returnTo=/protected");
    }
  }, [user, isLoading, error, router]);

  // Simulate fetching additional user data
  useEffect(() => {
    if (user) {
      // Simulate API call to get last login time
      setTimeout(() => {
        setLastLogin(new Date().toISOString());
      }, 1000);
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        <p className="mt-4 text-green-400">Loading your profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 p-6 rounded-lg border border-red-500/30 max-w-2xl mx-auto my-8">
        <h2 className="text-xl text-red-400 font-bold mb-4">
          Authentication Error
        </h2>
        <p className="mb-4 text-gray-300">{error.message}</p>
        <button
          onClick={() => router.push("/api/auth/login?returnTo=/protected")}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-gray-300 mb-4">Please sign in to access this page</p>
      </div>
    );
  }

  // Get all available user information
  const userInfo = Object.entries(user).filter(([key]) => key !== "picture");

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="h-8 w-8 text-green-400" />
        <h1 className="text-2xl font-bold text-green-400">
          Protected User Profile
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Profile Card */}
        <div className="md:col-span-1 bg-gray-800/50 border border-green-500/30 rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 border-b border-gray-700 bg-gray-800 flex justify-between items-center">
            <h2 className="text-lg font-bold text-green-400">Your Profile</h2>
            <User className="h-5 w-5 text-green-400" />
          </div>
          <div className="p-5 flex flex-col items-center text-center">
            {user.picture ? (
              <img
                src={user.picture}
                alt={user.name || "User"}
                className="h-32 w-32 rounded-full border-4 border-green-400/50 shadow-lg mb-4"
              />
            ) : (
              <div className="h-32 w-32 rounded-full bg-gray-700 flex items-center justify-center mb-4">
                <User className="h-16 w-16 text-gray-400" />
              </div>
            )}
            <h3 className="text-xl font-bold text-white mb-1">{user.name}</h3>
            <p className="text-gray-400 mb-4">{user.email}</p>

            <div className="w-full space-y-3 text-left">
              <div className="flex items-center">
                <span className="text-sm text-gray-300">
                  {user.nickname || "No nickname set"}
                </span>
              </div>
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2 text-gray-400" />
                <span className="text-sm text-gray-300 flex items-center gap-1">
                  {user.email_verified ? (
                    <CheckCircle className="h-3 w-3 text-green-400" />
                  ) : (
                    <XCircle className="h-3 w-3 text-red-400" />
                  )}
                  {user.email_verified
                    ? "Verified email"
                    : "Email not verified"}
                </span>
              </div>
              <div className="flex items-center">
                <Key className="h-4 w-4 mr-2 text-gray-400" />
                <span className="text-sm text-gray-300">
                  Auth ID: {user.sub?.split("|")[0]}...
                </span>
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-gray-400" />
                <span className="text-sm text-gray-300">
                  {lastLogin
                    ? `Last login: ${format(new Date(lastLogin), "PPp")}`
                    : "Loading login info..."}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* User Data Cards */}
        <div className="md:col-span-2 grid grid-cols-1 gap-6">
          {/* All User Fields */}
          <div className="bg-gray-800/50 border border-green-500/30 rounded-lg shadow-lg overflow-hidden">
            <div className="p-4 border-b border-gray-700 bg-gray-800 flex justify-between items-center">
              <h2 className="text-lg font-bold text-green-400">
                Complete Profile Data
              </h2>
              <Info className="h-5 w-5 text-green-400" />
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="text-left py-2 px-3 border-b border-gray-700 font-medium text-green-400">
                      Field
                    </th>
                    <th className="text-left py-2 px-3 border-b border-gray-700 font-medium text-green-400">
                      Value
                    </th>
                  </tr>
                </thead>
                <tbody className="text-gray-300">
                  {userInfo.map(([key, value]) => (
                    <tr key={key} className="hover:bg-gray-700/40">
                      <td className="py-2 px-3 border-b border-gray-700 font-mono">
                        {key}
                      </td>
                      <td className="py-2 px-3 border-b border-gray-700 font-mono break-all">
                        {typeof value === "object"
                          ? JSON.stringify(value)
                          : String(value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Raw JSON View */}
          <div className="bg-gray-800/50 border border-green-500/30 rounded-lg shadow-lg overflow-hidden">
            <div className="p-4 border-b border-gray-700 bg-gray-800 flex justify-between items-center">
              <h2 className="text-lg font-bold text-green-400">
                Raw User Data (JSON)
              </h2>
              <RefreshCcw className="h-5 w-5 text-green-400" />
            </div>
            <div className="p-4">
              <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto text-xs font-mono text-green-300 max-h-[200px]">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        {/* Account Actions */}
        <div className="md:col-span-3 bg-gray-800/50 border border-green-500/30 rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 border-b border-gray-700 bg-gray-800">
            <h2 className="text-lg font-bold text-green-400">
              Account Actions
            </h2>
          </div>
          <div className="p-5 flex flex-wrap gap-4">
            <button
              onClick={() => router.push("/chatbot")}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors flex items-center gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              Go to Chatbot
            </button>

            <button
              onClick={() => router.push("/")}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors flex items-center gap-2"
            >
              <Globe className="h-4 w-4" />
              Back to Home
            </button>

            <button
              onClick={() => router.push("/api/auth/logout")}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";
import { useAuth } from "@/lib/authContext";
import { useRouter } from "next/navigation";

/**
 * Navigation Header
 * - Shows user info and logout button
 * - Navigation links to main features
 */

export default function NavHeader() {
  const { logout } = useAuth();
  const router = useRouter();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <button onClick={() => router.push("/")} className="text-xl font-bold text-blue-600">
              BuildWise
            </button>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-4">
            <button
              onClick={() => router.push("/design")}
              className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded"
            >
              Design Canvas
            </button>
            <button
              onClick={() => router.push("/generative-ai-legacy")}
              className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded"
            >
              Generative AI
            </button>
            <button
              onClick={() => router.push("/student")}
              className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded"
            >
              Student Mode
            </button>
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-3">
            <button
              onClick={logout}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

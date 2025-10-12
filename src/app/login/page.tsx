// app/login/page.tsx
"use client";
import React, { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate login process
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Redirect to main app (you can implement actual auth here)
    window.location.href = "/generative-ai";
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl mb-4">
            <span className="text-white text-2xl font-bold">B</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Buildwise</h1>
          <p className="text-gray-600">Sign in to generate amazing architecture designs</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 pl-12"
                  placeholder="Enter your email"
                  required
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                  📧
                </div>
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 pl-12 pr-12"
                  placeholder="Enter your password"
                  required
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                  🔒
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-600">Remember me</span>
              </label>
              <Link 
                href="/forgot-password" 
                className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg shadow-md hover:from-blue-700 hover:to-purple-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Signing in...
                </span>
              ) : (
                "Sign In ✨"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6 flex items-center">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="px-4 text-sm text-gray-500">or continue with</span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>

          {/* Social Login Buttons */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <span className="text-lg mr-2">🔗</span>
              <span className="text-sm font-medium">Google</span>
            </button>
            <button className="flex items-center justify-center px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <span className="text-lg mr-2">📘</span>
              <span className="text-sm font-medium">GitHub</span>
            </button>
          </div>

          {/* Register Link */}
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Don&apos;t have an account?{" "}
              <Link 
                href="/register" 
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Sign up for free
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            By signing in, you agree to our{" "}
            <Link href="/terms" className="text-blue-600 hover:underline">Terms of Service</Link>
            {" "}and{" "}
            <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
// app/login/page.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [loading, setLoading] = useState(false),
    [error, setError] = useState<string | null>(null),
    [remember, setRemember] = useState(false);

  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, remember })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Login failed");
      }

      // Store token in localStorage
      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      // redirect to dashboard
      router.push("/");
    } catch (err: any) {
      setError(err?.message || "Unexpected error");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white
        bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)]
        bg-[size:24px_24px] overflow-auto"
    >
      {/* radial glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full blur-[120px] opacity-30 bg-gradient-to-br from-indigo-600 to-violet-700"></div>
      </div>

      <div
        className="relative z-10 w-full max-w-md px-6 py-8
          bg-zinc-900/70 backdrop-blur-xl rounded-2xl border border-white/5 shadow-2xl"
        role="main"
      >
        {/* Logo */}
        <div className="flex items-center justify-center">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-500 shadow-indigo-500/20">
            <svg width="36" height="36" viewBox="0 0 48 48" fill="none" aria-hidden>
              <rect x="6" y="6" width="36" height="36" rx="9" fill="rgba(255,255,255,0.06)" />
              <path d="M14 18h20v4H14z" fill="white" fillOpacity="0.95" />
              <path d="M12 26h24v4H12z" fill="white" fillOpacity="0.85" />
              <path d="M16 14h6v4h-6zM26 14h6v4h-6z" fill="rgba(255,255,255,0.95)" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="mt-5 text-center text-2xl font-semibold text-white">Welcome back</h1>
        <p className="mt-2 text-center text-sm text-zinc-400">
          Sign in to continue to <span className="font-medium">BuildWise</span> — your architecture cockpit.
        </p>

        {/* Form */}
        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <div className="space-y-3">
            <label className="sr-only" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-950/40 border border-white/8 rounded-xl px-4 py-3 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition"
            />

            <label className="sr-only" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-950/40 border border-white/8 rounded-xl px-4 py-3 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition"
            />
          </div>

          {/* inline row: remember + forgot */}
          <div className="flex items-center justify-between text-sm text-zinc-400">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 rounded border-white/10 bg-zinc-900 accent-indigo-500"
              />
              <span>Remember me</span>
            </label>
            <Link href="/forgot-password" className="text-indigo-400 hover:underline">
              Forgot?
            </Link>
          </div>

          {error && (
            <div className="text-sm text-red-400 bg-red-900/10 px-3 py-2 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-1 inline-flex items-center justify-center gap-2 rounded-xl py-3 text-white font-semibold
                       bg-gradient-to-r from-indigo-600 to-violet-500 shadow-lg shadow-indigo-600/30 hover:opacity-95 transition disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {/* Social */}
        <div className="mt-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { /* replace with your social auth */ }}
              className="flex-1 inline-flex items-center gap-3 justify-center rounded-xl px-3 py-3 bg-zinc-900/40 border border-white/6 hover:bg-zinc-900/50 transition"
            >
              <svg width="18" height="18" viewBox="0 0 48 48" fill="none" aria-hidden>
                <path d="M44 24.5c0-.7-.06-1.3-.17-1.92H24v4.02h11.95c-.52 2.82-2.1 5.2-4.48 6.8v2.84h7.25C41.5 35.9 44 30.6 44 24.5z" fill="#4285F4"/>
                <path d="M24 44c5.9 0 10.84-1.98 14.45-5.38l-7.25-2.84c-2.02 1.36-4.6 2.1-7.2 2.1-5.54 0-10.24-3.73-11.92-8.74H4.24v2.76C7.88 38.66 15.48 44 24 44z" fill="#34A853"/>
                <path d="M12.08 27.04a14.5 14.5 0 017.92-10.47v-2.92H12.75A24.02 24.02 0 004 24.5c0 3.8.92 7.4 2.59 10.66l5.49-2.12z" fill="#FBBC05"/>
                <path d="M24 13.5c3.21 0 6.12 1.1 8.4 3.27l6.27-6.27C35.36 6.72 30.45 4.5 24 4.5 15.48 4.5 7.88 9.84 4.24 17.27l7.83 2.76C13.76 17.23 18.46 13.5 24 13.5z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            <button
              onClick={() => { /* replace with your social auth */ }}
              className="flex-1 inline-flex items-center gap-3 justify-center rounded-xl px-3 py-3 bg-zinc-900/40 border border-white/6 hover:bg-zinc-900/50 transition"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.16 6.84 9.5.5.09.66-.22.66-.48 0-.24-.01-.87-.01-1.71-2.78.61-3.37-1.34-3.37-1.34-.45-1.17-1.11-1.48-1.11-1.48-.91-.62.07-.6.07-.6 1.01.07 1.54 1.05 1.54 1.05.9 1.54 2.36 1.1 2.94.84.09-.65.35-1.1.63-1.36-2.22-.25-4.56-1.11-4.56-4.95 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02A9.6 9.6 0 0112 6.85c.85.004 1.71.12 2.51.35 1.9-1.29 2.74-1.02 2.74-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.85-2.34 4.7-4.57 4.95.36.31.68.92.68 1.86 0 1.34-.01 2.42-.01 2.75 0 .26.16.58.67.48A10 10 0 0022 12c0-5.52-4.48-10-10-10z" fill="currentColor" />
              </svg>
              Continue with GitHub
            </button>
          </div>
        </div>

        {/* Footer row */}
        <div className="mt-6 flex items-center justify-between text-sm text-zinc-400">
          <div>
            Don't have an account?{" "}
            <Link href="/register" className="text-indigo-400 hover:underline">
              Create one
            </Link>
          </div>
          <Link href="/terms" className="hover:underline">
            Terms
          </Link>
        </div>
      </div>
    </div>
  );
}

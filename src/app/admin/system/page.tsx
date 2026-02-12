"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Database,
  Server,
  Zap,
  XCircle,
} from "lucide-react";

interface SystemData {
  system: {
    useRealAI: boolean;
    openaiModel: string;
    nodeEnv: string;
    databaseConnected: boolean;
    uptime: number;
    memoryUsage: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
    };
  };
  stats: {
    users: number;
    projects: number;
    logs: number;
  };
  recentErrors: Array<{
    _id: string;
    mode: string;
    errorMessage: string;
    timestamp: string;
  }>;
}

export default function SystemPage() {
  const [data, setData] = useState<SystemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchSystemData();
  }, []);

  const fetchSystemData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch("/api/admin/system", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 403) {
        setError("Admin access required");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch system data");
      }

      const result = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err.message || "Failed to load system data");
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(0)} MB`;
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading system data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-400">{error}</p>
          <Link
            href="/admin"
            className="mt-4 inline-block text-purple-400 hover:text-purple-300"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">System Health</h1>
              <p className="text-sm text-zinc-400 mt-1">
                Monitor system status and performance
              </p>
            </div>
            <Link
              href="/admin"
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b border-zinc-800 bg-zinc-900/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-6">
            <Link
              href="/admin"
              className="px-4 py-3 text-zinc-400 hover:text-white transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/users"
              className="px-4 py-3 text-zinc-400 hover:text-white transition-colors"
            >
              Users
            </Link>
            <Link
              href="/admin/projects"
              className="px-4 py-3 text-zinc-400 hover:text-white transition-colors"
            >
              Projects
            </Link>
            <Link
              href="/admin/ai-usage"
              className="px-4 py-3 text-zinc-400 hover:text-white transition-colors"
            >
              AI Usage
            </Link>
            <Link
              href="/admin/system"
              className="px-4 py-3 border-b-2 border-purple-500 text-purple-400 font-medium"
            >
              System
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-zinc-400">Database</div>
              {data.system.databaseConnected ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
            </div>
            <div className="text-lg font-semibold">
              {data.system.databaseConnected ? "Connected" : "Disconnected"}
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-zinc-400">AI Mode</div>
              {data.system.useRealAI ? (
                <Zap className="w-5 h-5 text-yellow-500" />
              ) : (
                <Activity className="w-5 h-5 text-blue-500" />
              )}
            </div>
            <div className="text-lg font-semibold">
              {data.system.useRealAI ? "Real AI" : "Mock"}
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-zinc-400">Environment</div>
              <Server className="w-5 h-5 text-purple-500" />
            </div>
            <div className="text-lg font-semibold capitalize">
              {data.system.nodeEnv}
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-zinc-400">Uptime</div>
              <Activity className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-lg font-semibold">
              {formatUptime(data.system.uptime)}
            </div>
          </div>
        </div>

        {/* Configuration */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Configuration</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">OpenAI Model</span>
              <span className="font-mono text-sm bg-zinc-800 px-3 py-1 rounded">
                {data.system.openaiModel}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Use Real AI</span>
              <span
                className={`font-medium ${
                  data.system.useRealAI ? "text-yellow-400" : "text-blue-400"
                }`}
              >
                {data.system.useRealAI ? "Enabled" : "Disabled"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Node Environment</span>
              <span className="font-medium">{data.system.nodeEnv}</span>
            </div>
          </div>
        </div>

        {/* Memory Usage */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Memory Usage</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">RSS (Total)</span>
              <span className="font-mono text-sm">
                {formatBytes(data.system.memoryUsage.rss)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Heap Total</span>
              <span className="font-mono text-sm">
                {formatBytes(data.system.memoryUsage.heapTotal)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Heap Used</span>
              <span className="font-mono text-sm">
                {formatBytes(data.system.memoryUsage.heapUsed)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">External</span>
              <span className="font-mono text-sm">
                {formatBytes(data.system.memoryUsage.external)}
              </span>
            </div>
          </div>
        </div>

        {/* Database Stats */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Database Stats</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-zinc-400 mb-1">Users</div>
              <div className="text-2xl font-bold">{data.stats.users}</div>
            </div>
            <div>
              <div className="text-sm text-zinc-400 mb-1">Projects</div>
              <div className="text-2xl font-bold text-purple-400">
                {data.stats.projects}
              </div>
            </div>
            <div>
              <div className="text-sm text-zinc-400 mb-1">AI Logs</div>
              <div className="text-2xl font-bold text-blue-400">
                {data.stats.logs}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Errors */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Recent AI Errors</h2>
          {data.recentErrors.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-zinc-400">No recent errors</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.recentErrors.map((error) => (
                <div
                  key={error._id}
                  className="border border-zinc-800 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="inline-block px-2 py-0.5 bg-red-500/10 text-red-400 rounded text-xs font-medium mb-2">
                        {error.mode}
                      </span>
                      <p className="text-sm text-zinc-300">
                        {error.errorMessage}
                      </p>
                    </div>
                    <span className="text-xs text-zinc-500">
                      {formatDate(error.timestamp)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter
} from "lucide-react";

interface AILog {
  _id: string;
  userId: string;
  user: {
    name: string;
    email: string;
  };
  mode: "student" | "generative" | "manual";
  intent: string;
  success: boolean;
  validationPassed: boolean;
  errorMessage?: string;
  timestamp: string;
  durationMs?: number;
}

interface AIUsageData {
  logs: AILog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  stats: {
    total: number;
    successRate: number;
    validationRate: number;
  };
}

export default function AIUsagePage() {
  const [data, setData] = useState<AIUsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [modeFilter, setModeFilter] = useState<string>("");
  const [successFilter, setSuccessFilter] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    fetchLogs();
  }, [page, modeFilter, successFilter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50",
      });
      if (modeFilter) params.append("mode", modeFilter);
      if (successFilter) params.append("success", successFilter);

      const response = await fetch(`/api/admin/ai-usage?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 403) {
        setError("Admin access required");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch AI usage logs");
      }

      const result = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err.message || "Failed to load logs");
    } finally {
      setLoading(false);
    }
  };

  const getModeColor = (mode: string) => {
    switch (mode) {
      case "student": return "text-blue-400 bg-blue-500/10";
      case "generative": return "text-purple-400 bg-purple-500/10";
      case "manual": return "text-green-400 bg-green-500/10";
      default: return "text-zinc-400 bg-zinc-500/10";
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return "—";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading AI usage logs...</p>
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
          <Link href="/admin" className="mt-4 inline-block text-purple-400 hover:text-purple-300">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">AI Usage Logs</h1>
              <p className="text-sm text-zinc-400 mt-1">Monitor AI requests and performance</p>
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
              className="px-4 py-3 border-b-2 border-purple-500 text-purple-400 font-medium"
            >
              AI Usage
            </Link>
            <Link
              href="/admin/system"
              className="px-4 py-3 text-zinc-400 hover:text-white transition-colors"
            >
              System
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <div className="text-sm text-zinc-400 mb-1">Total Requests</div>
            <div className="text-2xl font-bold">{data.stats.total}</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <div className="text-sm text-zinc-400 mb-1">Success Rate</div>
            <div className="text-2xl font-bold text-green-400">{data.stats.successRate}%</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <div className="text-sm text-zinc-400 mb-1">Validation Rate</div>
            <div className="text-2xl font-bold text-blue-400">{data.stats.validationRate}%</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-4">
            <Filter className="w-4 h-4 text-zinc-400" />
            <span className="text-sm text-zinc-400">Filters:</span>
            
            <select
              value={modeFilter}
              onChange={(e) => {
                setModeFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
            >
              <option value="">All Modes</option>
              <option value="student">Student</option>
              <option value="generative">Generative</option>
              <option value="manual">Manual</option>
            </select>

            <select
              value={successFilter}
              onChange={(e) => {
                setSuccessFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
            >
              <option value="">All Status</option>
              <option value="true">Success</option>
              <option value="false">Failed</option>
            </select>

            {(modeFilter || successFilter) && (
              <button
                onClick={() => {
                  setModeFilter("");
                  setSuccessFilter("");
                  setPage(1);
                }}
                className="text-sm text-purple-400 hover:text-purple-300"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Mode</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Intent</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Duration</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {data.logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-zinc-500">
                      No logs found
                    </td>
                  </tr>
                ) : (
                  data.logs.map((log) => (
                    <tr key={log._id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-4 py-3 text-sm text-zinc-400">
                        {formatTimestamp(log.timestamp)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="font-medium">{log.user.name}</div>
                        <div className="text-xs text-zinc-500">{log.user.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getModeColor(log.mode)}`}>
                          {log.mode}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-400">{log.intent}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {log.success ? (
                            log.validationPassed ? (
                              <>
                                <CheckCircle className="w-4 h-4 text-green-400" />
                                <span className="text-xs text-green-400">Success</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-4 h-4 text-amber-400" />
                                <span className="text-xs text-amber-400">Invalid</span>
                              </>
                            )
                          ) : (
                            <>
                              <XCircle className="w-4 h-4 text-red-400" />
                              <span className="text-xs text-red-400">Failed</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-400">
                        {formatDuration(log.durationMs)}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-500">
                        {log.errorMessage ? (
                          <span className="text-red-400 truncate block max-w-xs" title={log.errorMessage}>
                            {log.errorMessage}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data.pagination.pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800">
              <div className="text-sm text-zinc-400">
                Page {data.pagination.page} of {data.pagination.pages} ({data.pagination.total} total)
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm flex items-center gap-1 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => Math.min(data.pagination.pages, p + 1))}
                  disabled={page === data.pagination.pages}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm flex items-center gap-1 transition-colors"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

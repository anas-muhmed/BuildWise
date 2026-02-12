"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Users, 
  Folder, 
  Activity, 
  Settings,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react";

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalProjects: number;
  aiRequests: {
    total: number;
    student: number;
    generative: number;
    manual: number;
  };
  systemStatus: {
    useRealAI: boolean;
    model: string;
    rateLimitActive: boolean;
  };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch("/api/admin/dashboard", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 403) {
        setError("Admin access required");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard stats");
      }

      const data = await response.json();
      setStats(data);
      setError(null); // Clear any previous errors
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading dashboard...</p>
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
          <Link href="/" className="mt-4 inline-block text-purple-400 hover:text-purple-300">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-zinc-400 mt-1">System oversight and governance</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchStats}
                disabled={loading}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm transition-colors flex items-center gap-2"
              >
                <Activity className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
              <Link
                href="/"
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors"
              >
                Go Home
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b border-zinc-800 bg-zinc-900/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-6">
            <Link
              href="/admin"
              className="px-4 py-3 border-b-2 border-purple-500 text-purple-400 font-medium"
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
              className="px-4 py-3 text-zinc-400 hover:text-white transition-colors"
            >
              System
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Users */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8 text-blue-400" />
              <span className="text-xs text-zinc-500">Users</span>
            </div>
            <div className="text-3xl font-bold mb-1">{stats.totalUsers}</div>
            <div className="text-sm text-zinc-400">
              {stats.activeUsers} active
            </div>
          </div>

          {/* Total Projects */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Folder className="w-8 h-8 text-purple-400" />
              <span className="text-xs text-zinc-500">Projects</span>
            </div>
            <div className="text-3xl font-bold mb-1">{stats.totalProjects}</div>
            <div className="text-sm text-zinc-400">Total created</div>
          </div>

          {/* AI Requests */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Activity className="w-8 h-8 text-green-400" />
              <span className="text-xs text-zinc-500">AI Requests</span>
            </div>
            <div className="text-3xl font-bold mb-1">{stats.aiRequests.total}</div>
            <div className="text-sm text-zinc-400">All time</div>
          </div>

          {/* System Status */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Settings className="w-8 h-8 text-amber-400" />
              <span className="text-xs text-zinc-500">Status</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              {stats.systemStatus.useRealAI ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-sm font-medium">Real AI Active</span>
                </>
              ) : (
                <>
                  <Clock className="w-5 h-5 text-amber-400" />
                  <span className="text-sm font-medium">Mock Mode</span>
                </>
              )}
            </div>
            <div className="text-xs text-zinc-400">{stats.systemStatus.model}</div>
          </div>
        </div>

        {/* AI Requests Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Requests by Mode */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Requests by Mode</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-zinc-400">Student Mode</span>
                  <span className="text-sm font-medium">{stats.aiRequests.student}</span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500"
                    style={{
                      width: stats.aiRequests.total > 0 
                        ? `${(stats.aiRequests.student / stats.aiRequests.total) * 100}%`
                        : '0%',
                    }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-zinc-400">Generative AI</span>
                  <span className="text-sm font-medium">{stats.aiRequests.generative}</span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500"
                    style={{
                      width: stats.aiRequests.total > 0
                        ? `${(stats.aiRequests.generative / stats.aiRequests.total) * 100}%`
                        : '0%',
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-zinc-400">Manual Design</span>
                  <span className="text-sm font-medium">{stats.aiRequests.manual}</span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500"
                    style={{
                      width: stats.aiRequests.total > 0
                        ? `${(stats.aiRequests.manual / stats.aiRequests.total) * 100}%`
                        : '0%',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link
                href="/admin/users"
                className="block p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
              >
                <div className="font-medium mb-1">Manage Users</div>
                <div className="text-sm text-zinc-400">View and manage user accounts</div>
              </Link>
              
              <Link
                href="/admin/ai-usage"
                className="block p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
              >
                <div className="font-medium mb-1">AI Usage Logs</div>
                <div className="text-sm text-zinc-400">Monitor AI requests and performance</div>
              </Link>

              <Link
                href="/admin/system"
                className="block p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
              >
                <div className="font-medium mb-1">System Configuration</div>
                <div className="text-sm text-zinc-400">View and manage system settings</div>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

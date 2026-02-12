"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Users as UsersIcon,
  Shield,
  User as UserIcon,
  AlertCircle,
  CheckCircle,
  XCircle
} from "lucide-react";

interface User {
  _id: string;
  name: string;
  email: string;
  role: "student" | "admin" | "teacher" | "guest";
  isActive: boolean;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch("/api/admin/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 403) {
        setError("Admin access required");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (err: any) {
      setError(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (userId: string, updates: Partial<User>) => {
    try {
      setUpdating(userId);
      const token = localStorage.getItem("token");

      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, updates }),
      });

      if (!response.ok) {
        throw new Error("Failed to update user");
      }

      // Refresh users list
      await fetchUsers();
    } catch (err: any) {
      alert(err.message || "Failed to update user");
    } finally {
      setUpdating(null);
    }
  };

  const toggleRole = (user: User) => {
    const newRole = user.role === "admin" ? "student" : "admin";
    if (confirm(`Change ${user.name}'s role to ${newRole}?`)) {
      updateUser(user._id, { role: newRole });
    }
  };

  const toggleActive = (user: User) => {
    const action = user.isActive ? "disable" : "enable";
    if (confirm(`${action} ${user.name}?`)) {
      updateUser(user._id, { isActive: !user.isActive });
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin": return "text-red-400 bg-red-500/10";
      case "teacher": return "text-purple-400 bg-purple-500/10";
      case "student": return "text-blue-400 bg-blue-500/10";
      default: return "text-zinc-400 bg-zinc-500/10";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin": return <Shield className="w-4 h-4" />;
      default: return <UserIcon className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading users...</p>
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

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">User Management</h1>
              <p className="text-sm text-zinc-400 mt-1">View and manage user accounts</p>
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
              className="px-4 py-3 border-b-2 border-purple-500 text-purple-400 font-medium"
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
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <div className="text-sm text-zinc-400 mb-1">Total Users</div>
            <div className="text-2xl font-bold">{users.length}</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <div className="text-sm text-zinc-400 mb-1">Active Users</div>
            <div className="text-2xl font-bold text-green-400">
              {users.filter(u => u.isActive).length}
            </div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <div className="text-sm text-zinc-400 mb-1">Admins</div>
            <div className="text-2xl font-bold text-red-400">
              {users.filter(u => u.role === "admin").length}
            </div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <div className="text-sm text-zinc-400 mb-1">Students</div>
            <div className="text-2xl font-bold text-blue-400">
              {users.filter(u => u.role === "student").length}
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Created</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-zinc-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user._id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-zinc-500">{user.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${getRoleColor(user.role)}`}>
                          {getRoleIcon(user.role)}
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {user.isActive ? (
                          <span className="inline-flex items-center gap-1.5 text-green-400 text-xs">
                            <CheckCircle className="w-4 h-4" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-red-400 text-xs">
                            <XCircle className="w-4 h-4" />
                            Disabled
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-400">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => toggleRole(user)}
                            disabled={updating === user._id}
                            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded text-xs font-medium transition-colors"
                          >
                            {user.role === "admin" ? "Demote" : "Promote"}
                          </button>
                          <button
                            onClick={() => toggleActive(user)}
                            disabled={updating === user._id}
                            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                              user.isActive 
                                ? "bg-red-600 hover:bg-red-700"
                                : "bg-green-600 hover:bg-green-700"
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {user.isActive ? "Disable" : "Enable"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

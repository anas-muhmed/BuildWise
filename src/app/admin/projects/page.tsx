"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Folder,
  User,
  AlertCircle,
  Calendar,
  FileCode
} from "lucide-react";

interface Project {
  _id: string;
  title: string;
  description?: string;
  userId: string;
  createdAt: string;
  updatedAt?: string;
  snapshotCount: number;
  owner?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch("/api/admin/projects", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 403) {
        setError("Admin access required");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }

      const data = await response.json();
      setProjects(data.projects || []);
    } catch (err: any) {
      setError(err.message || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin": return "text-red-400";
      case "teacher": return "text-purple-400";
      case "student": return "text-blue-400";
      default: return "text-zinc-400";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading projects...</p>
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
              <h1 className="text-2xl font-bold">Projects</h1>
              <p className="text-sm text-zinc-400 mt-1">View all projects across users</p>
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
              className="px-4 py-3 border-b-2 border-purple-500 text-purple-400 font-medium"
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <div className="text-sm text-zinc-400 mb-1">Total Projects</div>
            <div className="text-2xl font-bold">{projects.length}</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <div className="text-sm text-zinc-400 mb-1">Total Snapshots</div>
            <div className="text-2xl font-bold text-purple-400">
              {projects.reduce((sum, p) => sum + p.snapshotCount, 0)}
            </div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <div className="text-sm text-zinc-400 mb-1">Avg. per Project</div>
            <div className="text-2xl font-bold text-blue-400">
              {projects.length > 0
                ? (projects.reduce((sum, p) => sum + p.snapshotCount, 0) / projects.length).toFixed(1)
                : "0"}
            </div>
          </div>
        </div>

        {/* Projects List */}
        {projects.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-12 text-center">
            <Folder className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-500">No projects found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => (
              <div
                key={project._id}
                className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 hover:bg-zinc-900/70 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{project.title}</h3>
                      {project.snapshotCount > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded text-xs">
                          <FileCode className="w-3 h-3" />
                          {project.snapshotCount} snapshot{project.snapshotCount !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    {project.description && (
                      <p className="text-sm text-zinc-400 mb-3">{project.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-zinc-500">
                      {project.owner ? (
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" />
                          <span className={getRoleColor(project.owner.role)}>
                            {project.owner.name}
                          </span>
                          <span className="text-zinc-600">•</span>
                          <span>{project.owner.email}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" />
                          <span className="text-zinc-600">Unknown user</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Created {formatDate(project.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

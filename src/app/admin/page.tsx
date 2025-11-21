"use client";
import React, { useEffect, useState } from "react";

type Design = {
  _id: string;
  title: string;
  status?: string;
  createdAt?: string;
  userId?: { _id: string; name?: string; email?: string } | string;
};
type User = { _id: string; name: string; email: string; createdAt?: string };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AdminLog = { _id: string; adminId: { name?: string; email?: string } | string; action: string; designId?: { title?: string } | string; createdAt?: string; meta?: any };

function getToken() {
  return (typeof window !== "undefined" && localStorage.getItem("admin_token")) || "";
}

export default function AdminDashboard() {
  const [tab, setTab] = useState<"projects" | "users" | "logs">("projects");
  const [designs, setDesigns] = useState<Design[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // helper fetch wrapper
  async function api(path: string, opts: RequestInit = {}) {
    const token = getToken();
    const headers = { ...(opts.headers || {}), Authorization: token ? `Bearer ${token}` : "" };
    const res = await fetch(path, { ...opts, headers });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json?.error || res.statusText || "Request failed");
    }
    return res.json();
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, page]);

  async function loadData() {
    setLoading(true);
    try {
      if (tab === "projects") {
        const url = `/api/admin/designs?page=${page}&limit=${limit}&q=${encodeURIComponent(q)}`;
        const data = await api(url);
        setDesigns(data?.designs || []);
      } else if (tab === "users") {
        const data = await api("/api/admin/users");
        setUsers(data?.users || []);
      } else {
        const data = await api("/api/admin/logs");
        setLogs(data?.logs || []);
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  // actions
  async function verifyDesign(id: string) {
    if (!confirm("Verify this project?")) return;
    try {
      await api(`/api/admin/projects/${id}/verify`, { method: "POST" });
      setMessage("Project verified");
      loadData();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed to verify");
    }
  }

  async function flagDesign(id: string) {
    const reason = prompt("Reason for flagging (short):") || "No reason provided";
    try {
      await api(`/api/admin/projects/${id}/flag`, { method: "POST", body: JSON.stringify({ reason }), headers: { "Content-Type": "application/json" } });
      setMessage("Project flagged");
      loadData();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed to flag");
    }
  }

  async function purgeDesign(id: string) {
    if (!confirm("Permanently delete this design? This cannot be undone.")) return;
    try {
      await api(`/api/admin/designs/${id}/purge`, { method: "DELETE" });
      setMessage("Project purged");
      loadData();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed to purge");
    }
  }

  // small UI components
  const Header = () => (
    <div className="flex items-center justify-between mb-4">
      <h1 className="text-xl font-semibold">Admin Dashboard</h1>
      <div className="flex gap-2 items-center">
        <div className="text-sm text-slate-600">Token: {getToken() ? "Present" : "Missing"}</div>
        <button
          onClick={() => { localStorage.removeItem("admin_token"); setMessage("Logged out (local token removed)"); }}
          className="px-3 py-1 text-sm rounded bg-red-500 text-white"
        >
          Logout
        </button>
      </div>
    </div>
  );

  const SearchBar = () => (
    <div className="flex gap-2 mb-3">
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title or owner" className="flex-1 px-3 py-2 border rounded" />
      <button onClick={() => { setPage(1); loadData(); }} className="px-3 py-2 bg-blue-600 text-white rounded">Search</button>
    </div>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Header />

      <div className="mb-4 flex gap-2">
        <button onClick={()=>{setTab("projects"); setPage(1);}} className={`px-3 py-1 rounded ${tab==="projects" ? "bg-blue-600 text-white" : "bg-gray-100"}`}>Projects</button>
        <button onClick={()=>{setTab("users"); setPage(1);}} className={`px-3 py-1 rounded ${tab==="users" ? "bg-blue-600 text-white" : "bg-gray-100"}`}>Users</button>
        <button onClick={()=>{setTab("logs"); setPage(1);}} className={`px-3 py-1 rounded ${tab==="logs" ? "bg-blue-600 text-white" : "bg-gray-100"}`}>Logs</button>
      </div>

      {message && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <div className="flex justify-between items-center">
            <div className="text-sm text-yellow-800">{message}</div>
            <button onClick={()=>setMessage(null)} className="text-sm px-2">✕</button>
          </div>
        </div>
      )}

      {tab === "projects" && (
        <>
          <SearchBar />
          <div className="overflow-x-auto bg-white rounded shadow">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-2">Title</th>
                  <th className="text-left p-2">Owner</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Created</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="p-6 text-center">Loading...</td></tr>
                ) : designs.length === 0 ? (
                  <tr><td colSpan={5} className="p-6 text-center text-slate-500">No projects</td></tr>
                ) : designs.map((d) => (
                  <tr key={d._id} className="border-t">
                    <td className="p-2">{d.title || "Untitled"}</td>
                    <td className="p-2">{typeof d.userId === "object" && d.userId ? `${d.userId.name || ""} (${d.userId.email || ""})` : "—" }</td>
                    <td className="p-2">{d.status || "draft"}</td>
                    <td className="p-2">{d.createdAt ? new Date(d.createdAt).toLocaleString() : "-"}</td>
                    <td className="p-2 flex gap-2">
                      <button onClick={()=>verifyDesign(d._id)} className="px-2 py-1 bg-green-500 text-white rounded text-sm">Verify</button>
                      <button onClick={()=>flagDesign(d._id)} className="px-2 py-1 bg-orange-500 text-white rounded text-sm">Flag</button>
                      <button onClick={()=>purgeDesign(d._id)} className="px-2 py-1 bg-red-600 text-white rounded text-sm">Purge</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex justify-between items-center">
            <div className="text-sm text-slate-600">Page {page}</div>
            <div>
              <button onClick={()=>{ if(page>1) setPage(p=>p-1); }} className="px-3 py-1 border rounded mr-2">Prev</button>
              <button onClick={()=>{ setPage(p=>p+1); }} className="px-3 py-1 border rounded">Next</button>
            </div>
          </div>
        </>
      )}

      {tab === "users" && (
        <div className="overflow-auto bg-white rounded shadow p-2">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr><th className="p-2 text-left">Name</th><th className="p-2 text-left">Email</th><th className="p-2 text-left">Created</th></tr>
            </thead>
            <tbody>
              {users.length === 0 ? <tr><td colSpan={3} className="p-6 text-center">No users</td></tr> : users.map(u=>(
                <tr key={u._id} className="border-t">
                  <td className="p-2">{u.name}</td>
                  <td className="p-2">{u.email}</td>
                  <td className="p-2">{u.createdAt ? new Date(u.createdAt).toLocaleString() : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "logs" && (
        <div className="overflow-auto bg-white rounded shadow p-2">
          <table className="w-full">
            <thead className="bg-gray-50"><tr><th className="p-2 text-left">When</th><th className="p-2 text-left">Admin</th><th className="p-2 text-left">Action</th><th className="p-2 text-left">Design</th></tr></thead>
            <tbody>
              {logs.length === 0 ? <tr><td colSpan={4} className="p-6 text-center">No logs</td></tr> : logs.map(l=>(
                <tr key={l._id} className="border-t">
                  <td className="p-2">{l.createdAt ? new Date(l.createdAt).toLocaleString() : "-"}</td>
                  <td className="p-2">{typeof l.adminId === "object" && l.adminId ? `${l.adminId.name || ""} (${l.adminId.email||""})` : "admin"}</td>
                  <td className="p-2">{l.action}</td>
                  <td className="p-2">{typeof l.designId === "object" && l.designId ? l.designId.title || "-" : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

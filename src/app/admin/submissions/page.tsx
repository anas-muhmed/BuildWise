"use client";
import React, { useEffect, useState } from "react";

/**
 * Admin Submissions UI (minimal)
 * - Lists submissions
 * - Buttons: View, Verify, Flag, Add Feedback
 * - Calls the admin API endpoints above
 */

type Submission = {
  _id: string;
  projectId: { _id?: string; appType?: string } | string;
  userId: { _id?: string; name?: string; email?: string } | string;
  status: string;
  createdAt?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  architecture?: any;
  notes?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adminFeedback?: any;
};

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("admin_token");
}

export default function AdminSubmissionsPage() {
  const [subs, setSubs] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Submission | null>(null);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");

  async function load() {
    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch("/api/admin/submissions", {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Failed");
      setSubs(j.submissions || []);
    } catch (e) {
      alert("Error loading: " + (e instanceof Error ? e.message : "Unknown error"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function verify(id: string) {
    if (!confirm("Verify submission?")) return;
    const token = getToken();
    const res = await fetch(`/api/admin/submissions/${id}/verify`, {
      method: "POST",
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    const j = await res.json();
    if (!res.ok) return alert("Err: " + j?.error);
    alert("Verified");
    load();
  }

  async function flagIt(id: string) {
    if (!reason) return alert("Provide reason");
    const token = getToken();
    const res = await fetch(`/api/admin/submissions/${id}/flag`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ reason }),
    });
    const j = await res.json();
    if (!res.ok) return alert("Err: " + j?.error);
    alert("Flagged");
    setReason("");
    load();
  }

  async function addFeedback(id: string) {
    const token = getToken();
    const res = await fetch(`/api/admin/submissions/${id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ note, status: "reviewed" }),
    });
    const j = await res.json();
    if (!res.ok) return alert("Err: " + j?.error);
    alert("Feedback saved");
    setNote("");
    load();
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">Admin — Submissions</h1>
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-8">
            <div className="bg-white rounded-xl p-4 shadow">
              {loading && <div>Loading...</div>}
              {!loading && subs.length === 0 && <div>No submissions</div>}
              <ul className="space-y-2">
                {subs.map((s) => (
                  <li key={s._id} className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <div className="font-medium">{typeof s.projectId === "object" ? s.projectId.appType : "project"}</div>
                      <div className="text-xs text-gray-500">By: {typeof s.userId === "object" ? s.userId.name || s.userId.email : s.userId}</div>
                      <div className="text-xs text-gray-400">Status: {s.status} • {s.createdAt ? new Date(s.createdAt).toLocaleString() : ""}</div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setSelected(s)} className="px-3 py-1 border rounded">View</button>
                      <button onClick={() => verify(s._id)} className="px-3 py-1 bg-green-600 text-white rounded">Verify</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="col-span-4">
            <div className="bg-white rounded-xl p-4 shadow mb-4">
              <h4 className="font-semibold mb-2">Quick Flag</h4>
              <textarea className="w-full p-2 border rounded h-24" value={reason} onChange={(e)=>setReason(e.target.value)} placeholder="Reason for flagging"></textarea>
              <div className="mt-2 flex gap-2">
                <button onClick={() => { if (!selected) return alert("Select a submission first"); flagIt(selected._id);} } className="px-3 py-1 bg-red-600 text-white rounded">Flag Selected</button>
                <button onClick={() => load()} className="px-3 py-1 border rounded">Refresh</button>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow">
              <h4 className="font-semibold mb-2">Selected Submission</h4>
              {!selected && <div className="text-sm text-gray-500">Pick a submission to preview</div>}
              {selected && (
                <>
                  <div className="text-sm text-gray-700 mb-2">By: {typeof selected.userId === "object" ? selected.userId.name || selected.userId.email : ""}</div>
                  <div className="text-xs text-gray-500 mb-2">Status: {selected.status}</div>
                  <div className="text-xs text-gray-600 mb-3">Architecture preview (nodes count: {(selected.architecture?.nodes||[]).length})</div>
                  <div className="text-sm text-gray-700 mb-2">
                    <textarea placeholder="Add feedback..." value={note} onChange={(e)=>setNote(e.target.value)} className="w-full border p-2 h-24 rounded"></textarea>
                    <div className="flex gap-2 mt-2">
                      <button onClick={()=>addFeedback(selected._id)} className="px-3 py-1 bg-indigo-600 text-white rounded">Save Feedback</button>
                      <button onClick={()=>{ setSelected(null); setNote(""); }} className="px-3 py-1 border rounded">Clear</button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

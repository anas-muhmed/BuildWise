"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Submission = {
  _id: string;
  projectId: string;
  userId: string;
  status: string;
  notes?: string;
  createdAt: string;
  grade?: number;
};

/**
 * Admin UI component for reviewing student submissions
 */
export default function StudentSubmissionQueue() {
  const [subs, setSubs] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const token = typeof window !== "undefined" 
    ? localStorage.getItem("token") || undefined 
    : undefined;

  useEffect(() => { 
    load(); 
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/submissions`, { 
        headers: token ? { Authorization: `Bearer ${token}` } : {} 
      });
      const j = await res.json();
      
      if (j.ok) {
        setSubs(j.submissions || []);
      } else {
        alert(j.error || "load failed");
      }
    } catch (err) {
      console.error("Failed to load submissions", err);
    } finally { 
      setLoading(false); 
    }
  }

  async function review(id: string, action: string) {
    const note = action === "request_changes" 
      ? prompt("Request note to student:") || "" 
      : "";
    const gradeStr = action === "approve" 
      ? prompt("Grade (number) optional:") || undefined 
      : undefined;
    const grade = gradeStr ? Number(gradeStr) : undefined;
    
    const res = await fetch(`/api/admin/submissions/${id}/review`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json", 
        ...(token ? { Authorization: `Bearer ${token}` } : {}) 
      },
      body: JSON.stringify({ 
        action: action === "approve" ? "approve" : 
                action === "reject" ? "reject" : 
                "request_changes", 
        notes: note, 
        grade 
      })
    });
    
    const j = await res.json();
    
    if (!j.ok) {
      alert(j.error || "review failed");
      return;
    }
    
    alert("Reviewed successfully");
    load();
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-zinc-400">
        Loading submissions...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white">Student Submissions</h2>
        <p className="text-sm text-zinc-400">Review and approve student project submissions</p>
      </div>
      
      {subs.length === 0 ? (
        <div className="p-8 text-center text-zinc-500">
          No submissions found
        </div>
      ) : (
        subs.map(s => (
          <div key={s._id} className="p-3 bg-zinc-900 border border-zinc-800 rounded">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-white font-medium">
                  Project: {s.projectId}
                </div>
                <div className="text-xs text-zinc-400">
                  By: {s.userId} • {new Date(s.createdAt).toLocaleString()}
                </div>
                {s.grade && (
                  <div className="text-xs text-emerald-400 mt-1">
                    Grade: {s.grade}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => review(s._id, "approve")}
                  className="bg-emerald-600 hover:bg-emerald-700"
                  size="sm"
                >
                  Approve
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => review(s._id, "request_changes")}
                  size="sm"
                >
                  Request Changes
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => review(s._id, "reject")}
                  size="sm"
                >
                  Reject
                </Button>
              </div>
            </div>
            {s.notes && (
              <div className="mt-2 text-xs text-zinc-300 p-2 bg-zinc-800 rounded">
                <span className="text-zinc-500">Notes:</span> {s.notes}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

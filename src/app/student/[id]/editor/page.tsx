"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function StudentEditorGate() {
  const params = useParams() as { id: string };
  const projectId = params.id;
  const router = useRouter();
  const [message, setMessage] = useState("Preparing editor...");
  const token = typeof window !== "undefined" ? localStorage.getItem("token") || undefined : undefined;

  useEffect(() => {
    (async () => {
      if (!projectId) {
        setMessage("Missing project id");
        return;
      }
      try {
        setMessage("Verifying user...");
        const authRes = await fetch("/api/auth/me", { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        const authJson = await authRes.json();
        if (!authJson.ok) {
          setMessage("You must be logged in to access the editor.");
          return;
        }
        const role = authJson.user?.role || "student";
        setMessage("Loading project...");
        const projectRes = await fetch(`/api/student/project/${projectId}/export`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const projectData = await projectRes.json();
        if (!projectData.ok && !projectData.project) {
          setMessage("Project not found or you do not have access.");
          return;
        }

        // student -> put ?student=true, teacher/admin -> no flag (full rights)
        const target = role === "student"
          ? `/generative/projects/${projectId}/builder?student=true`
          : `/generative/projects/${projectId}/builder`;

        setMessage("Opening architecture builder...");
        setTimeout(() => router.push(target), 300);
      } catch (e) {
        console.error(e);
        setMessage("Failed to open editor. See console.");
      }
    })();
  }, [projectId, router, token]);

  return (
    <div className="p-8 max-w-3xl mx-auto text-center">
      <div className="p-6 bg-zinc-900 border border-zinc-800 rounded">
        <h2 className="text-lg text-white font-semibold">Student Editor</h2>
        <p className="text-sm text-zinc-400 mt-2">{message}</p>
      </div>
    </div>
  );
}

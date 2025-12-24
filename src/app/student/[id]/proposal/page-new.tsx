"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function StudentProposalPage() {
  const params = useParams() as { id: string };
  const router = useRouter();
  const projectId = params.id;
  const token = typeof window !== "undefined" ? localStorage.getItem("token") || undefined : undefined;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [project, setProject] = useState<any | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [snapshot, setSnapshot] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/student/project/${projectId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const data = await res.json();
        if (!mounted) return;
        if (data.project) {
          setProject(data.project);
          
          // Fetch snapshot using unified endpoint
          try {
            const snapRes = await fetch(`/api/student/project/${projectId}/snapshot?mode=latest`, {
              headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            const snapData = await snapRes.json();
            if (snapData.ok && snapData.ready && snapData.snapshot) {
              setSnapshot(snapData.snapshot);
              sessionStorage.setItem(`snapshot:${projectId}`, JSON.stringify(snapData.snapshot));
            }
          } catch (snapErr) {
            console.warn('[proposal] Failed to load snapshot:', snapErr);
          }
        } else {
          throw new Error(data.error || "Project not found");
        }
      } catch (e) {
        const error = e as Error;
        if (mounted) setErr(error?.message || "Failed to load project");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [projectId, token]);

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="text-zinc-400">Loading proposal...</div></div>;
  if (err) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="text-red-400">{err}</div></div>;
  if (!project) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="text-red-400">Project not found</div></div>;

  const { skillLevel, selectedFeatures = [], members = [], team_size = 1 } = project;
  const totalMembers = members.length;
  
  // Simple team splitting logic (deterministic)
  function splitIntoTeams() {
    if (totalMembers === 0 || team_size < 1) return [];
    const teams = [];
    for (let i = 0; i < members.length; i += team_size) {
      teams.push(members.slice(i, i + team_size));
    }
    return teams;
  }
  
  const teams = splitIntoTeams();
  
  // Work buckets (hardcoded, simple)
  const workBuckets = [
    { name: "Frontend", desc: "Mobile/Web app, user interface" },
    { name: "Backend", desc: "API Gateway, business logic, services" },
    { name: "Database", desc: "Data models, queries, migrations" },
    { name: "Realtime/Infra", desc: "WebSocket, notifications, deployment" }
  ];
  
  // Assign work buckets to teams (round-robin)
  function assignWork() {
    return teams.map((team, idx) => {
      const assigned = workBuckets.filter((_, bucketIdx) => bucketIdx % teams.length === idx);
      return { team, assigned };
    });
  }
  
  const teamAssignments = assignWork();

  const handleRegenerate = async () => {
    try {
      await fetch(`/api/student/project/${projectId}/seed`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      window.location.reload();
    } catch (error) {
      console.error('Regenerate failed:', error);
    }
  };

  const handleOpenEditor = () => {
    if (snapshot) {
      sessionStorage.setItem(`snapshot:${projectId}`, JSON.stringify(snapshot));
    }
    router.push(`/student/${projectId}/builder`);
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* 1️⃣ PROJECT CONTEXT (WHY) */}
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-6">
          <h2 className="text-2xl font-bold mb-2">{project.title || project.appType}</h2>
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-zinc-800 rounded text-sm">{project.appType}</span>
            <span className="px-3 py-1 bg-zinc-800 rounded text-sm capitalize">{skillLevel} level</span>
            {snapshot && <span className="px-3 py-1 bg-green-900/30 text-green-400 rounded text-sm">Snapshot Ready</span>}
          </div>
          <p className="text-zinc-400">
            This project helps your team practice {selectedFeatures.includes('auth') ? 'authentication, ' : ''}
            {selectedFeatures.includes('payments') ? 'payment flows, ' : ''}
            {selectedFeatures.includes('realtime') ? 'real-time updates, ' : ''}
            backend services and database design at {skillLevel} level.
          </p>
        </div>

        {/* 2️⃣ TEAM CONFIGURATION (WHO) */}
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-6">
          <h3 className="text-xl font-semibold mb-4">Team Configuration</h3>
          
          {totalMembers === 0 ? (
            <div className="p-4 bg-amber-900/20 border border-amber-800 rounded-lg">
              <p className="text-amber-400 font-medium">No team members added</p>
              <p className="text-amber-300/80 text-sm mt-1">Solo project — you'll work through all modules yourself.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                <div className="p-3 bg-zinc-800 rounded">
                  <div className="text-zinc-500">Total Members</div>
                  <div className="text-2xl font-bold">{totalMembers}</div>
                </div>
                <div className="p-3 bg-zinc-800 rounded">
                  <div className="text-zinc-500">Team Size</div>
                  <div className="text-2xl font-bold">{team_size}</div>
                </div>
                <div className="p-3 bg-zinc-800 rounded">
                  <div className="text-zinc-500">Number of Teams</div>
                  <div className="text-2xl font-bold">{teams.length}</div>
                </div>
              </div>
              
              <div className="p-3 bg-blue-900/10 border border-blue-800 rounded text-sm text-blue-300">
                💡 <strong>Team size</strong> = number of students per sub-team. 
                Example: {totalMembers} members ÷ team size {team_size} = {teams.length} team{teams.length > 1 ? 's' : ''}
              </div>
            </>
          )}
        </div>

        {/* 3️⃣ WORK SPLIT PREVIEW (CORE FEATURE) */}
        {totalMembers > 0 && teams.length > 0 && (
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-6">
            <h3 className="text-xl font-semibold mb-4">Team Work Distribution</h3>
            <p className="text-zinc-400 text-sm mb-6">Each team is responsible for specific parts of the system:</p>
            
            <div className="space-y-6">
              {teamAssignments.map((assignment, idx) => (
                <div key={idx} className="p-5 bg-zinc-800 border border-zinc-700 rounded-lg">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-white">Team {idx + 1}</h4>
                      <div className="flex gap-2 mt-2">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {assignment.team.map((member: any, mIdx: number) => (
                          <div key={mIdx} className="flex items-center gap-2 px-3 py-1 bg-zinc-900 rounded">
                            <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-xs text-white font-medium">
                              {member.name?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <span className="text-sm text-zinc-300">{member.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Responsible for:</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {assignment.assigned.map((bucket, bIdx) => (
                        <div key={bIdx} className="p-3 bg-zinc-900 rounded border border-zinc-700">
                          <div className="font-medium text-white">{bucket.name}</div>
                          <div className="text-xs text-zinc-400 mt-1">{bucket.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4️⃣ WHAT HAPPENS NEXT (HOW) */}
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-6">
          <h3 className="text-xl font-semibold mb-4">What Happens Next</h3>
          <ol className="space-y-2 text-zinc-400 mb-6">
            <li className="flex items-start gap-2">
              <span className="text-indigo-400 font-medium">1.</span>
              <span>Review your team responsibilities above</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-400 font-medium">2.</span>
              <span>Open editor to inspect the generated architecture</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-400 font-medium">3.</span>
              <span>Each team focuses on their assigned modules</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-400 font-medium">4.</span>
              <span>Finalize and export the design</span>
            </li>
          </ol>
          
          <div className="flex gap-3">
            <button 
              onClick={handleOpenEditor}
              disabled={!snapshot}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                snapshot 
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              }`}
            >
              {snapshot ? 'Open Editor' : 'Waiting for Snapshot...'}
            </button>
            <button 
              onClick={handleRegenerate}
              className="px-6 py-3 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              Regenerate
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

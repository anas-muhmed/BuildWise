"use client";

import React, { useState } from "react";
import DashboardLayoutWrapper from "@/components/DashboardLayoutWrapper";
import { Users, Sparkles, CheckCircle } from "lucide-react";

type Student = {
  name: string;
  email: string;
  skills: string[];
  availableHours: number;
};

type Team = {
  members: Student[];
  totalHours: number;
  skillCoverage: string[];
};

export default function TeacherDashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [newStudent, setNewStudent] = useState({ name: "", email: "", skills: "", hours: "20" });
  const [projectReqs, setProjectReqs] = useState<string[]>(["React", "Node"]);
  const [teamSize, setTeamSize] = useState(2);
  const [minHours, setMinHours] = useState(30);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addStudent = () => {
    if (!newStudent.name || !newStudent.email) return;
    const skills = newStudent.skills.split(",").map(s => s.trim()).filter(Boolean);
    setStudents([...students, {
      name: newStudent.name,
      email: newStudent.email,
      skills,
      availableHours: parseInt(newStudent.hours) || 20
    }]);
    setNewStudent({ name: "", email: "", skills: "", hours: "20" });
  };

  const generateTeams = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/student/teams/distribute-v2", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          students,
          projectRequirements: projectReqs,
          teamSize,
          minHoursPerTeam: minHours
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to distribute teams");
      setTeams(data.teams || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error generating teams");
    } finally {
      setLoading(false);
    }
  };

  const removeStudent = (index: number) => {
    setStudents(students.filter((_, i) => i !== index));
  };

  const addRequirement = (req: string) => {
    if (req && !projectReqs.includes(req)) {
      setProjectReqs([...projectReqs, req]);
    }
  };

  const removeRequirement = (req: string) => {
    setProjectReqs(projectReqs.filter(r => r !== req));
  };

  return (
    <DashboardLayoutWrapper activeNav="teacher" breadcrumb="Teacher Dashboard">
      <div className="space-y-6">
        {/* Hero */}
        <div className="rounded-2xl bg-gradient-to-br from-indigo-900/50 via-zinc-900 to-zinc-950 border border-zinc-800 p-8">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-indigo-400" />
            <span className="text-sm font-medium text-indigo-400">Teacher Mode</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Team Distribution Engine</h1>
          <p className="text-zinc-400">AI-powered skill-based team formation with capacity tracking</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Student Management */}
          <div className="space-y-6">
            <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-6">
              <h2 className="text-xl font-bold mb-4">Add Students</h2>
              <div className="space-y-3">
                <input
                  placeholder="Student Name"
                  value={newStudent.name}
                  onChange={e => setNewStudent({ ...newStudent, name: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm"
                />
                <input
                  placeholder="Email"
                  value={newStudent.email}
                  onChange={e => setNewStudent({ ...newStudent, email: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm"
                />
                <input
                  placeholder="Skills (comma-separated: React, Node, Python)"
                  value={newStudent.skills}
                  onChange={e => setNewStudent({ ...newStudent, skills: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm"
                />
                <input
                  type="number"
                  placeholder="Available Hours"
                  value={newStudent.hours}
                  onChange={e => setNewStudent({ ...newStudent, hours: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm"
                />
                <button
                  onClick={addStudent}
                  className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded text-sm font-medium transition-colors"
                >
                  Add Student
                </button>
              </div>
            </div>

            <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-6">
              <h2 className="text-xl font-bold mb-4">Students ({students.length})</h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {students.length === 0 && (
                  <p className="text-sm text-zinc-500">No students added yet</p>
                )}
                {students.map((s, i) => (
                  <div key={i} className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50 flex items-start justify-between">
                    <div>
                      <div className="font-medium text-sm">{s.name}</div>
                      <div className="text-xs text-zinc-500">{s.email}</div>
                      <div className="text-xs text-zinc-400 mt-1">
                        Skills: {s.skills.join(", ") || "None"} • {s.availableHours}h
                      </div>
                    </div>
                    <button
                      onClick={() => removeStudent(i)}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Configuration */}
          <div className="space-y-6">
            <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-6">
              <h2 className="text-xl font-bold mb-4">Project Configuration</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-zinc-400 mb-2 block">Required Skills</label>
                  <div className="flex gap-2 flex-wrap mb-2">
                    {projectReqs.map(req => (
                      <span key={req} className="px-2 py-1 bg-indigo-500/20 text-indigo-400 text-xs rounded flex items-center gap-1">
                        {req}
                        <button onClick={() => removeRequirement(req)} className="text-indigo-300 hover:text-indigo-200">×</button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      id="new-req"
                      placeholder="Add skill..."
                      className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm"
                      onKeyDown={e => {
                        if (e.key === "Enter") {
                          const val = (e.target as HTMLInputElement).value.trim();
                          if (val) {
                            addRequirement(val);
                            (e.target as HTMLInputElement).value = "";
                          }
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        const input = document.getElementById("new-req") as HTMLInputElement;
                        const val = input?.value.trim();
                        if (val) {
                          addRequirement(val);
                          input.value = "";
                        }
                      }}
                      className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded text-sm"
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-zinc-400 mb-2 block">Team Size</label>
                  <input
                    type="number"
                    value={teamSize}
                    onChange={e => setTeamSize(parseInt(e.target.value) || 2)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm"
                  />
                </div>

                <div>
                  <label className="text-sm text-zinc-400 mb-2 block">Minimum Hours per Team</label>
                  <input
                    type="number"
                    value={minHours}
                    onChange={e => setMinHours(parseInt(e.target.value) || 30)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm"
                  />
                </div>

                <button
                  onClick={generateTeams}
                  disabled={students.length < teamSize || loading}
                  className="w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 rounded-lg font-medium text-sm transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-4 h-4" />
                  {loading ? "Generating..." : "Generate Teams"}
                </button>

                {error && (
                  <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded p-3">
                    {error}
                  </div>
                )}
              </div>
            </div>

            {teams.length > 0 && (
              <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <h2 className="text-xl font-bold">Generated Teams ({teams.length})</h2>
                </div>
                <div className="space-y-3">
                  {teams.map((team, i) => (
                    <div key={i} className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <div className="font-medium text-sm text-green-400 mb-2">Team {i + 1}</div>
                      <div className="space-y-1 mb-2">
                        {team.members.map((m, j) => (
                          <div key={j} className="text-xs text-zinc-300">
                            • {m.name} ({m.skills.join(", ")}) - {m.availableHours}h
                          </div>
                        ))}
                      </div>
                      <div className="text-xs text-zinc-400">
                        Total: {team.totalHours}h • Coverage: {team.skillCoverage.join(", ")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayoutWrapper>
  );
}

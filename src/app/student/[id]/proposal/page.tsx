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
            console.warn("Failed to load snapshot:", snapErr);
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

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="text-zinc-400">Loading...</div></div>;
  if (err) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="text-red-400">{err}</div></div>;
  if (!project) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="text-red-400">Project not found</div></div>;

  const { skillLevel, selectedFeatures = [], members = [], team_size = 1 } = project;
  const totalMembers = members.length;
  function splitIntoTeams() {
    if (totalMembers === 0 || team_size < 1) return [];
    const teams = [];
    for (let i = 0; i < members.length; i += team_size) {
      teams.push(members.slice(i, i + team_size));
    }
    return teams;
  }
  const teams = splitIntoTeams();
  
  // ============================================================================
  // TASK GENERATION ENGINE
  // ============================================================================
  // Core principle: Never assign "domains". Always assign "actions".
  // Bad: "Frontend", "Backend", "Database"
  // Good: "Create login UI", "Write user schema", "Test payment flow"
  //
  // Logic:
  // 1. Extract modules from snapshot (Auth, Payments, etc.) or use features
  // 2. Generate concrete tasks per module based on skill level
  // 3. Distribute tasks to members round-robin
  // 4. For zero-skill members: add "Getting Started" tasks first
  // ============================================================================
  
  // Task generation based on project features and snapshot
  function generateTasksForProject() {
    // Extract modules from snapshot (if available)
    const modules: string[] = [];
    if (snapshot?.nodes) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      snapshot.nodes.forEach((node: any) => {
        if (node.type === 'service' || node.type === 'feature') {
          modules.push(node.data?.label || node.id);
        }
      });
    }
    
    // Fallback: use selected features to generate modules
    const featureModules = selectedFeatures.map((f: string) => {
      const map: Record<string, string> = {
        auth: 'Authentication',
        crud: 'CRUD Operations',
        payments: 'Payments',
        realtime: 'Real-time Updates',
        notifications: 'Notifications',
        search: 'Search'
      };
      return map[f] || f;
    });
    
    const allModules: string[] = [...new Set([...modules, ...featureModules])];
    if (allModules.length === 0) {
      return ['Core Features', 'Database Setup', 'API Integration'];
    }
    
    return allModules.slice(0, 4); // Max 4 modules
  }
  
  function generateTasksForModule(moduleName: string, memberSkillLevel: string) {
    // Skill level: beginner, intermediate, advanced (from member or project)
    const isAdvanced = memberSkillLevel === 'advanced' || memberSkillLevel === 'intermediate';
    
    const taskTemplates: Record<string, { learning: string[], design: string[], implementation: string[], testing: string[] }> = {
      'Authentication': {
        learning: [
          'Read JWT token basics (search: "JWT authentication explained")',
          'Test existing login at /api/auth/login with Postman'
        ],
        design: [
          'Draw auth flow diagram: signup → login → token → protected route',
          'Design User schema: email, password (hashed), createdAt'
        ],
        implementation: [
          'Write POST /api/auth/register endpoint (hash password with bcrypt)',
          'Write POST /api/auth/login endpoint (return JWT token)',
          'Create login form UI (email + password fields)'
        ],
        testing: [
          'Test: signup with valid email creates user',
          'Test: login with wrong password fails',
          'Test: token validates on protected routes'
        ]
      },
      'Payments': {
        learning: [
          'Read Stripe test mode docs: https://stripe.com/docs/testing',
          'Understand webhook concept (Stripe → your server notifications)'
        ],
        design: [
          'Plan payment flow: select plan → checkout → confirmation',
          'Design Payment schema: userId, amount, status, stripePaymentId'
        ],
        implementation: [
          'Integrate Stripe Checkout (use test keys)',
          'Build payment confirmation page (/payment/success)',
          'Set up webhook endpoint /api/webhooks/stripe'
        ],
        testing: [
          'Test with Stripe test card: 4242 4242 4242 4242',
          'Verify webhook receives payment.succeeded event',
          'Confirm payment record saves to database'
        ]
      },
      'CRUD Operations': {
        learning: [
          'Review REST API concepts (GET, POST, PUT, DELETE)',
          'Look at existing API route structure in /api folder'
        ],
        design: [
          'Design data model for main entity (fields, types, relationships)',
          'Plan API endpoints: GET /items, POST /items, PUT /items/:id, DELETE /items/:id'
        ],
        implementation: [
          'Write GET /api/items endpoint (fetch all records)',
          'Write POST /api/items endpoint (create new record)',
          'Build form UI for creating/editing items'
        ],
        testing: [
          'Test: create item via form saves to database',
          'Test: update item changes fields correctly',
          'Test: delete item removes from database'
        ]
      },
      'Real-time Updates': {
        learning: [
          'Learn WebSocket basics (search: "Socket.io getting started")',
          'Understand pub/sub pattern (one user sends → all users receive)'
        ],
        design: [
          'Plan real-time events: user_joined, message_sent, status_changed',
          'Design message schema: userId, content, timestamp, roomId'
        ],
        implementation: [
          'Set up Socket.io server in /api/socket',
          'Implement event listener: socket.on("message", ...)',
          'Build real-time UI component (show live updates)'
        ],
        testing: [
          'Test: open app in 2 tabs, send message from tab 1',
          'Verify: tab 2 receives message instantly',
          'Test: handle disconnect/reconnect gracefully'
        ]
      },
      'Notifications': {
        learning: [
          'Read push notification basics (browser notifications API)',
          'Review email sending with Resend or SendGrid'
        ],
        design: [
          'Plan notification triggers: new message, payment success, reminder',
          'Design Notification schema: userId, type, message, read, createdAt'
        ],
        implementation: [
          'Write notification creation function (save to DB)',
          'Build notification badge UI (unread count)',
          'Send test email notification via API'
        ],
        testing: [
          'Test: trigger notification creates record',
          'Test: mark notification as read updates DB',
          'Test: email notification arrives in inbox'
        ]
      }
    };
    
    const defaultTasks = {
      learning: [
        'Read project README.md and architecture overview',
        'Look at similar open-source examples on GitHub'
      ],
      design: [
        'Create design mockups or wireframes',
        'Plan data structure and API endpoints'
      ],
      implementation: [
        'Write core backend logic',
        'Build user interface components',
        'Connect frontend to backend API'
      ],
      testing: [
        'Test main functionality manually',
        'Verify edge cases (empty input, errors)',
        'Fix bugs and update documentation'
      ]
    };
    
    const tasks = taskTemplates[moduleName] || defaultTasks;
    
    // Return tasks based on skill level - ORDERED, not flat
    if (isAdvanced) {
      return [
        ...tasks.design.slice(0, 1),
        ...tasks.implementation,
        ...tasks.testing.slice(0, 1)
      ];
    } else {
      // Beginners: heavy learning, then guided implementation
      return [
        ...tasks.learning,
        ...tasks.design.slice(0, 1),
        ...tasks.implementation.slice(0, 1),
        ...tasks.testing
      ];
    }
  }
  
  function assignTasksToMembers() {
    const modules = generateTasksForProject();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return teams.map((team: any[], teamIdx: number) => {
      return {
        teamNumber: teamIdx + 1,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        members: team.map((member: any, memberIdx: number) => {
          // Determine member skill level
          const hasSkills = member.skill_tags && member.skill_tags.length > 0;
          const memberSkillLevel = hasSkills ? (member.skill_tags[0].level || skillLevel) : 'beginner';
          
          // Assign modules round-robin
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const assignedModules = modules.filter((_: any, idx: number) => 
            idx % team.length === memberIdx
          );
          
          // Generate tasks for assigned modules with ORDER NUMBERS
          let taskNumber = 1;
          const tasks = assignedModules.flatMap((mod: string) => 
            generateTasksForModule(mod, memberSkillLevel).map((task: string) => ({
              order: taskNumber++,
              module: mod,
              title: task,
              completed: false,
              blocked: false,
              blockReason: null
            }))
          );
          
          // If no skills, add starter tasks AT THE BEGINNING
          if (!hasSkills) {
            const starterTasks = [
              { order: 0, module: 'Getting Started', title: 'Clone repository: git clone <repo-url>', completed: false, blocked: false, blockReason: null },
              { order: 0, module: 'Getting Started', title: 'Install dependencies: npm install', completed: false, blocked: false, blockReason: null },
              { order: 0, module: 'Getting Started', title: 'Read README.md and project structure overview', completed: false, blocked: false, blockReason: null },
              { order: 0, module: 'Getting Started', title: 'Ask team: "What should I focus on first?"', completed: false, blocked: false, blockReason: null }
            ];
            // Reorder: starter tasks first, then renumber
            const allTasks = [...starterTasks, ...tasks];
            allTasks.forEach((t, idx) => { t.order = idx + 1; });
            return {
              name: member.name,
              email: member.email,
              skillLevel: memberSkillLevel,
              hasSkills,
              tasks: allTasks.slice(0, 10) // Max 10 tasks per person
            };
          }
          
          return {
            name: member.name,
            email: member.email,
            skillLevel: memberSkillLevel,
            hasSkills,
            tasks: tasks.slice(0, 8) // Max 8 tasks per person
          };
        })
      };
    });
  }
  
  const teamAssignments = totalMembers > 0 ? assignTasksToMembers() : [];
  const handleRegenerate = async () => {
    try {
      await fetch(`/api/student/project/${projectId}/seed`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      window.location.reload();
    } catch (error) {
      console.error("Regenerate failed:", error);
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
        
        {/* PHASE BANNER */}
        <div className="rounded-xl bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-indigo-700 p-6">
          <div className="flex items-start gap-4">
            <div className="text-3xl">🧭</div>
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-2">Phase 0: Orientation</h2>
              <p className="text-zinc-300 text-sm mb-3">
                You are in the planning phase. <strong>Do not open the editor yet.</strong>
              </p>
              <div className="space-y-1 text-sm text-zinc-400">
                <div>✓ Read project goal below (1 min)</div>
                <div>✓ See your role and team (30 sec)</div>
                <div>✓ Review your personal tasks (3 min)</div>
                <div className="text-indigo-300 font-medium mt-2">→ Only then: review architecture in editor</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-6">
          <h2 className="text-2xl font-bold mb-2">{project.title || project.appType}</h2>
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-zinc-800 rounded text-sm">{project.appType}</span>
            <span className="px-3 py-1 bg-zinc-800 rounded text-sm capitalize">{skillLevel} level</span>
            {snapshot && <span className="px-3 py-1 bg-green-900/30 text-green-400 rounded text-sm">Snapshot Ready</span>}
          </div>
          <p className="text-zinc-400">
            This project helps your team practice {selectedFeatures.includes("auth") ? "authentication, " : ""}
            {selectedFeatures.includes("payments") ? "payment flows, " : ""}
            {selectedFeatures.includes("realtime") ? "real-time updates, " : ""}
            backend services and database design at {skillLevel} level.
          </p>
        </div>
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-6">
          <h3 className="text-xl font-semibold mb-4">Team Configuration</h3>
          {totalMembers === 0 ? (
            <div className="p-4 bg-amber-900/20 border border-amber-800 rounded-lg">
              <p className="text-amber-400 font-medium">No team members added</p>
              <p className="text-amber-300/80 text-sm mt-1">Solo project — you will work through all modules yourself.</p>
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
                Example: {totalMembers} members ÷ team size {team_size} = {teams.length} team{teams.length > 1 ? "s" : ""}
              </div>
            </>
          )}
        </div>
        {totalMembers > 0 && teams.length > 0 && (
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">📋</span>
              <h3 className="text-xl font-semibold">Phase 1: Your Tasks</h3>
            </div>
            <p className="text-zinc-400 text-sm mb-6">
              Follow these in order. Each task builds on the previous one.
            </p>
            <div className="space-y-8">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {teamAssignments.map((assignment: any, teamIdx: number) => (
                <div key={teamIdx} className="space-y-4">
                  <h4 className="text-lg font-semibold text-white border-b border-zinc-700 pb-2">
                    Team {assignment.teamNumber}
                  </h4>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {assignment.members.map((member: any, memberIdx: number) => (
                    <div key={memberIdx} className="p-4 bg-zinc-800 border border-zinc-700 rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm text-white font-medium">
                            {member.name?.[0]?.toUpperCase() || "U"}
                          </div>
                          <div>
                            <div className="text-white font-medium">{member.name}</div>
                            <div className="text-xs text-zinc-500 capitalize">
                              {member.skillLevel} level{!member.hasSkills && " • New to development"}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-zinc-400">
                          {member.tasks.filter((t: any) => t.completed).length} / {member.tasks.length} done
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {member.tasks.map((task: any, taskIdx: number) => (
                          <div 
                            key={taskIdx} 
                            className={`flex items-start gap-3 p-2 rounded transition-colors ${
                              taskIdx === 0 ? 'bg-indigo-900/20 border border-indigo-700' : 'hover:bg-zinc-700/50'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-[24px]">
                              <span className="text-xs font-mono text-zinc-500">{task.order}.</span>
                            </div>
                            <input 
                              type="checkbox" 
                              checked={task.completed}
                              readOnly
                              className="mt-1 w-4 h-4 rounded border-zinc-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                            <div className="flex-1">
                              <div className="text-sm text-zinc-200">{task.title}</div>
                              <div className="text-xs text-zinc-500 mt-0.5">{task.module}</div>
                            </div>
                            {taskIdx === 0 && (
                              <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded">START HERE</span>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      {!member.hasSkills && (
                        <div className="mt-3 p-2 bg-blue-900/20 border border-blue-800 rounded text-xs text-blue-300">
                          💡 <strong>New to this?</strong> Do tasks 1-4 first to get comfortable, then help teammates with testing and docs.
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* PHASE 2: Team Sync Rules */}
        {totalMembers > 1 && (
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🤝</span>
              <h3 className="text-xl font-semibold">Phase 2: Team Sync Rules</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-zinc-800 border border-zinc-700 rounded-lg">
                <div className="text-amber-400 font-semibold mb-2">⏱️ If Blocked</div>
                <p className="text-sm text-zinc-300">
                  Stuck for more than 24 hours? Ping the other team. Don't wait in silence.
                </p>
              </div>
              <div className="p-4 bg-zinc-800 border border-zinc-700 rounded-lg">
                <div className="text-green-400 font-semibold mb-2">✅ If Finished Early</div>
                <p className="text-sm text-zinc-300">
                  Done with your tasks? Help test another module or improve documentation.
                </p>
              </div>
              <div className="p-4 bg-zinc-800 border border-zinc-700 rounded-lg">
                <div className="text-blue-400 font-semibold mb-2">🤔 If Confused</div>
                <p className="text-sm text-zinc-300">
                  Don't understand the task? Re-open this page. Don't jump into the editor randomly.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* PHASE 3: Architecture Review */}
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">🏗️</span>
            <h3 className="text-xl font-semibold">Phase 3: Architecture Review</h3>
          </div>
          <p className="text-zinc-400 text-sm mb-6">
            After completing your personal tasks above, review the architecture to understand how everything connects.
          </p>
          <ol className="space-y-2 text-zinc-400 mb-6">
            <li className="flex items-start gap-2">
              <span className="text-indigo-400 font-medium">1.</span>
              <span>Complete at least 3-4 personal tasks from Phase 1</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-400 font-medium">2.</span>
              <span>Open architecture editor to see how modules connect</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-400 font-medium">3.</span>
              <span>Identify dependencies (which parts need to be built first)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-400 font-medium">4.</span>
              <span>Finalize and export the design when ready</span>
            </li>
          </ol>
          <div className="flex gap-3">
            <button 
              onClick={handleOpenEditor}
              disabled={!snapshot}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                snapshot 
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white" 
                  : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
              }`}
            >
              {snapshot ? "Review Architecture" : "Waiting for Snapshot..."}
            </button>
            <button 
              onClick={handleRegenerate}
              className="px-6 py-3 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              Regenerate Project
            </button>
          </div>
          {snapshot && (
            <p className="text-xs text-zinc-500 mt-3">
              💡 Tip: Complete some personal tasks first before reviewing architecture. It will make more sense.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

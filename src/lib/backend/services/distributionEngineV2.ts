// src/lib/backend/services/distributionEngineV2.ts
import { nanoid } from "nanoid";

/**
 * Hours-aware Team Distribution engine (v2)
 *
 * Inputs:
 * - roles: [{ title, tasks: [{ id?, title, estimatedHours? }] }]
 * - roster: [{ userId, name, skills: string[], capacity: number }]
 * - roleSkillMap: mapping roleTitle -> required skill tokens
 *
 * Outputs:
 * - assignments: [{ userId, name, primaryRole, score, assignedTasks: [{id,title,estimatedHours}], assignedHours, capacity, overloaded }]
 * - warnings: string[]
 *
 * Strategy:
 * 1) Score members for roles (skill overlap + capacity factor) to determine primaryRole.
 * 2) Ensure each role has at least one member (fallback to best candidate).
 * 3) For each role, assign tasks by greedy best-fit:
 *    - Sort tasks descending by estimatedHours (largest-first).
 *    - For each task, pick the member for that role with the most remaining capacity who still has >= 0 capacity.
 *    - If no member has enough remaining capacity, assign to the member with highest remaining capacity anyway and mark overloaded.
 * 4) Return per-user totals and warnings.
 *
 * Deterministic, simple, and auditable.
 */

export type Role = {
  title: string;
  description?: string;
  tasks?: Array<{ id?: string; title: string; estimatedHours?: number }>;
};

export type RosterMember = {
  userId: string;
  name: string;
  skills?: string[];
  capacity?: number; // hours available (default 20)
};

export type Assignment = {
  userId: string;
  name: string;
  primaryRole: string;
  score: number;
  assignedTasks: { id: string; title: string; estimatedHours: number }[];
  assignedHours: number;
  capacity: number;
  overloaded?: boolean;
  skill_gap?: boolean;
};

function scoreMemberForRole(member: RosterMember, role: Role, roleSkillMap: Record<string, string[]>) {
  const required = roleSkillMap[role.title] || [];
  const skills = (member.skills || []).map(s => s.toLowerCase());
  const overlap = required.reduce((acc, r) => acc + (skills.includes(r.toLowerCase()) ? 1 : 0), 0);
  const cap = member.capacity || 20;
  // score: overlap priority + small capacity factor
  return overlap + Math.min(0.5, cap / 100);
}

export function distributeTeamHours({
  roles,
  roster,
  roleSkillMap = {}
}: {
  roles: Role[];
  roster: RosterMember[];
  roleSkillMap?: Record<string, string[]>;
}): { assignments: Assignment[]; warnings: string[] } {
  roster = roster || [];
  roles = roles || [];
  const warnings: string[] = [];

  // normalize roster capacity default
  roster = roster.map(m => ({ capacity: typeof m.capacity === "number" ? m.capacity : 20, ...m }));

  // Build candidate lists and member best roles
  const roleCandidates: Record<string, Array<{ member: RosterMember; score: number }>> = {};
  for (const r of roles) {
    const arr = roster.map(m => ({ member: m, score: scoreMemberForRole(m, r, roleSkillMap) }));
    arr.sort((a, b) => (b.score - a.score) || ((b.member.capacity || 0) - (a.member.capacity || 0)) || a.member.name.localeCompare(b.member.name));
    roleCandidates[r.title] = arr;
  }

  const memberBestRole: Record<string, { role: string; score: number }> = {};
  for (const m of roster) {
    let best = { role: "unassigned", score: -1 };
    for (const r of roles) {
      const s = scoreMemberForRole(m, r, roleSkillMap);
      if (s > best.score) best = { role: r.title, score: s };
    }
    memberBestRole[m.userId] = best;
  }

  // Collect roleAssignedMembers
  const roleAssignedMembers: Record<string, RosterMember[]> = {};
  for (const r of roles) roleAssignedMembers[r.title] = [];
  for (const m of roster) {
    const best = memberBestRole[m.userId];
    if (best && best.score >= 0) {
      roleAssignedMembers[best.role] = roleAssignedMembers[best.role] || [];
      roleAssignedMembers[best.role].push(m);
    }
  }

  // Ensure every role has at least one member; fallback to top candidate
  for (const r of roles) {
    if (!roleAssignedMembers[r.title] || roleAssignedMembers[r.title].length === 0) {
      const candidates = roleCandidates[r.title] || [];
      if (candidates.length === 0) {
        warnings.push(`No roster available to fill role ${r.title}`);
        roleAssignedMembers[r.title] = [];
        continue;
      }
      const top = candidates[0].member;
      roleAssignedMembers[r.title] = [top];
      warnings.push(`No clear owner for role ${r.title}. Assigned best available: ${top.name}`);
    }
  }

  // Per-user state
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userState: Record<string, { remaining: number; assignedTasks: any[]; assignedHours: number }> = {};
  for (const m of roster) {
    userState[m.userId] = { remaining: m.capacity || 20, assignedTasks: [], assignedHours: 0 };
  }

  // Assignment loop per role
  for (const r of roles) {
    const members = roleAssignedMembers[r.title] || [];
    // fallback if no members at all
    if (!members || members.length === 0) {
      warnings.push(`Role ${r.title} has no available members; tasks will be unassigned.`);
      continue;
    }

    // prepare tasks with estimatedHours (default 2 hours)
    const tasks = (r.tasks || []).map(t => ({
      id: t.id || `t-${nanoid(6)}`,
      title: t.title,
      estimatedHours: typeof t.estimatedHours === "number" ? t.estimatedHours : 2
    }));

    // sort tasks largest-first to reduce fragmentation
    tasks.sort((a, b) => b.estimatedHours - a.estimatedHours);

    for (const task of tasks) {
      // pick member in this role with largest remaining capacity; tie-break deterministic: userId
      const candidate = members
        .map(m => ({ m, remaining: userState[m.userId]?.remaining ?? (m.capacity || 20) }))
        .sort((a, b) => {
          const diff = b.remaining - a.remaining;
          if (Math.abs(diff) > 1e-6) return diff;
          return a.m.userId.localeCompare(b.m.userId);
        })[0];

      if (!candidate) {
        // shouldn't happen but keep guard
        warnings.push(`No members found for role ${r.title} when assigning task ${task.title}`);
        continue;
      }

      // If candidate has enough remaining, allocate
      if (candidate.remaining >= task.estimatedHours) {
        userState[candidate.m.userId].assignedTasks.push(task);
        userState[candidate.m.userId].assignedHours += task.estimatedHours;
        userState[candidate.m.userId].remaining -= task.estimatedHours;
      } else {
        // no one has enough for this task: pick member with largest remaining and assign anyway -> overload
        const top = members
          .map(m => ({ m, remaining: userState[m.userId]?.remaining ?? (m.capacity || 20) }))
          .sort((a, b) => {
            const diff = b.remaining - a.remaining;
            if (Math.abs(diff) > 1e-6) return diff;
            return a.m.userId.localeCompare(b.m.userId);
          })[0];

        // assign and mark overload via assignedHours > capacity later
        userState[top.m.userId].assignedTasks.push(task);
        userState[top.m.userId].assignedHours += task.estimatedHours;
        userState[top.m.userId].remaining -= task.estimatedHours;
        warnings.push(`Overload: task "${task.title}" assigned to ${top.m.name} (capacity exceeded).`);
      }
    }
  }

  // Build final assignments
  const assignments: Assignment[] = roster.map(m => {
    const best = memberBestRole[m.userId] || { role: "unassigned", score: 0 };
    const st = userState[m.userId] || { remaining: m.capacity || 20, assignedTasks: [], assignedHours: 0 };
    const overloaded = st.assignedHours > (m.capacity || 20);
    // skill gap check
    const req = roleSkillMap[best.role] || [];
    const skills = (m.skills || []).map(s => s.toLowerCase());
    const skill_gap = req.length > 0 ? !req.some(rq => skills.includes(rq.toLowerCase())) : false;

    return {
      userId: m.userId,
      name: m.name,
      primaryRole: best.role,
      score: Number(best.score.toFixed(3)),
      assignedTasks: st.assignedTasks,
      assignedHours: Number((st.assignedHours || 0).toFixed(2)),
      capacity: m.capacity || 20,
      overloaded: overloaded || undefined,
      ...(skill_gap ? { skill_gap: true } : {})
    };
  });

  if (!roster || roster.length === 0) warnings.push("Empty roster — no assignments made");

  return { assignments, warnings };
}

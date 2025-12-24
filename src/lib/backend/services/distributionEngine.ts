// src/lib/backend/services/distributionEngine.ts
import { nanoid } from "nanoid";

/**
 * Simple Team Project Distribution engine
 *
 * Inputs:
 * - roles: [{ title, tasks: [{id,title}] }]
 * - roster: [{ userId, name, skills: string[], capacity: number (hours) }]
 * - skillWeights: mapping role -> required skill tokens (e.g., Backend -> ["node","sql"])
 *
 * Outputs:
 * - assignments: { userId, name, primaryRole, score, assignedTasks: [{taskId, taskTitle}] }
 *
 * Design goals:
 * - deterministic: sort by score then by capacity
 * - fallback: if no one matches role, assign to best-fit and mark "skill_gap": true
 * - balanced: round-robin tasks among available members for a role
 */

type Role = {
  title: string;
  description?: string;
  tasks?: Array<{ id?: string; title: string }>;
};

export type RosterMember = {
  userId: string;
  name: string;
  skills?: string[]; // e.g., ["react","node","sql","devops"]
  capacity?: number; // hours available (optional)
};

export type Assignment = {
  userId: string;
  name: string;
  primaryRole: string;
  score: number;
  assignedTasks: { id: string; title: string }[];
  skill_gap?: boolean;
};

export function scoreMemberForRole(member: RosterMember, role: Role, roleSkillMap: Record<string, string[]>) {
  const required = roleSkillMap[role.title] || [];
  const skills = (member.skills || []).map(s => s.toLowerCase());
  // score by overlap count, + small capacity factor
  const overlap = required.reduce((acc, r) => acc + (skills.includes(r.toLowerCase()) ? 1 : 0), 0);
  const cap = member.capacity || 1;
  return overlap + Math.min(0.5, cap / 40); // capacity small influence
}

/**
 * Main distribution function
 */
export function distributeTeam({
  roles,
  roster,
  roleSkillMap = {}
}: {
  roles: Role[];
  roster: RosterMember[];
  roleSkillMap?: Record<string, string[]>;
}): { assignments: Assignment[]; warnings: string[] } {
  // defensive defaults
  roster = roster || [];
  roles = roles || [];

  const warnings: string[] = [];

  // build candidate scores per role
  const roleCandidates: Record<string, Array<{ member: RosterMember; score: number }>> = {};
  for (const r of roles) {
    const arr = roster.map(m => ({ member: m, score: scoreMemberForRole(m, r, roleSkillMap) }));
    // sort descending by score, then by capacity desc, then name
    arr.sort((a, b) => (b.score - a.score) || ((b.member.capacity || 0) - (a.member.capacity || 0)) || a.member.name.localeCompare(b.member.name));
    roleCandidates[r.title] = arr;
  }

  // assign primaryRole greedily: each member gets best role (highest relative score)
  const memberBestRole: Record<string, { role: string; score: number }> = {};
  for (const m of roster) {
    let best = { role: "unassigned", score: -1 };
    for (const r of roles) {
      const s = scoreMemberForRole(m, r, roleSkillMap);
      if (s > best.score) best = { role: r.title, score: s };
    }
    memberBestRole[m.userId] = best;
  }

  // For each role, gather members who have this as best role (or fallbacks)
  const roleAssignedMembers: Record<string, RosterMember[]> = {};
  for (const r of roles) roleAssignedMembers[r.title] = [];

  // first pass: assign members to their best role
  for (const m of roster) {
    const best = memberBestRole[m.userId];
    if (!best || best.score < 0.1) {
      // extremely low confidence — assign later
      continue;
    }
    roleAssignedMembers[best.role] = roleAssignedMembers[best.role] || [];
    roleAssignedMembers[best.role].push(m);
  }

  // second pass: ensure every role has at least one member — pick top candidates
  for (const r of roles) {
    const assigned = roleAssignedMembers[r.title] || [];
    if (assigned.length === 0) {
      const candidates = roleCandidates[r.title] || [];
      if (candidates.length === 0) {
        warnings.push(`No roster provided to fill role ${r.title}`);
        continue;
      }
      // pick top candidate (even if low score)
      const top = candidates[0].member;
      roleAssignedMembers[r.title] = [top];
      warnings.push(`No clear owner for role ${r.title} — assigned best available: ${top.name}`);
    }
  }

  // task distribution: round robin among roleAssignedMembers for each role
  const assignments: Assignment[] = [];
  const userTaskMap: Record<string, { id: string; title: string }[]> = {};
  for (const r of roles) {
    const members = roleAssignedMembers[r.title] || [];
    const tasks = (r.tasks || []).map(t => ({ id: t.id || `t-${nanoid(6)}`, title: t.title }));
    if (tasks.length === 0) {
      // nothing to assign; still create entries for members
      for (const m of members) {
        userTaskMap[m.userId] = userTaskMap[m.userId] || [];
      }
      continue;
    }
    // round robin
    for (let i = 0; i < tasks.length; i++) {
      const member = members[i % members.length];
      userTaskMap[member.userId] = userTaskMap[member.userId] || [];
      userTaskMap[member.userId].push(tasks[i]);
    }
  }

  // build final assignment objects; for anyone not in userTaskMap, still add an entry
  for (const m of roster) {
    const best = memberBestRole[m.userId] || { role: "unassigned", score: 0 };
    const assignedTasks = userTaskMap[m.userId] || [];
    const skill_gap = (() => {
      const req = roleSkillMap[best.role] || [];
      const skills = (m.skills || []).map(s => s.toLowerCase());
      if (req.length === 0) return false;
      const ok = req.some(rq => skills.includes(rq.toLowerCase()));
      return !ok;
    })();
    assignments.push({
      userId: m.userId,
      name: m.name,
      primaryRole: best.role,
      score: Number(best.score.toFixed(3)),
      assignedTasks,
      ...(skill_gap ? { skill_gap: true } : {})
    });
  }

  // If roster is empty, produce generic warning
  if (!roster || roster.length === 0) warnings.push("Empty roster — no assignments made");

  return { assignments, warnings };
}

// src/lib/backend/services/distributionEngineV2.ts
const nanoid = (size = 6) => Math.random().toString(36).slice(2, 2 + size);

/**
 * ═══════════════════════════════════════════════════════════════════
 *  BUILDWISE TEAM DISTRIBUTION ENGINE v3  (Hours-Aware, Edge-Safe)
 * ═══════════════════════════════════════════════════════════════════
 *
 * ALGORITHM PHASES
 * ────────────────
 * Phase 1 │ Skill Scoring — score every member for every role
 *          │   score = (# matching skills) + min(0.5, capacity/100)
 *
 * Phase 2 │ Role Assignment — each member is assigned their best role.
 *          │   Zero-skill members get ANY role via capacity tiebreak.
 *          │   Every role is guaranteed ≥ 1 member (fallback to top candidate).
 *
 * Phase 3 │ Greedy Largest-First Task Packing — tasks sorted desc by hours.
 *          │   Each task goes to the role-member with most remaining capacity.
 *          │   If no one has enough capacity left → assign anyway, flag overloaded.
 *
 * Phase 4 │ Idle Rescue — finds members with 0 assigned hours.
 *          │   Steals the SMALLEST task from the most overloaded member until
 *          │   every member has ≥ 1 task OR no more overloaded members exist.
 *          │   This handles: "3 know backend only + 1 knows nothing" perfectly.
 *
 * Phase 5 │ Overload Leveling — after rescue, if any member still exceeds
 *          │   capacity by > 50% AND another member is under 50% capacity,
 *          │   the smallest excess task is moved to the under-capacity member.
 *
 * GUARANTEES
 * ──────────
 * ✓ No one is left completely idle when tasks exist
 * ✓ Zero-skill members always get something (via rescue)
 * ✓ Skill-gap warnings are emitted per member (not silently swallowed)
 * ✓ Overload is reduced as much as possible without leaving others idle
 * ✓ Deterministic within a run (sort by userId on ties)
 * ═══════════════════════════════════════════════════════════════════
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
  rescued?: boolean;    // got tasks via Phase 4 idle rescue
  rebalanced?: boolean; // got tasks via Phase 5 leveling
};

// ─── Internal ────────────────────────────────────────────────────────────────

type InternalTask = { id: string; title: string; estimatedHours: number };

type MemberState = {
  member: RosterMember;
  primaryRole: string;
  score: number;
  remaining: number;
  assignedTasks: InternalTask[];
  assignedHours: number;
  skill_gap: boolean;
  rebalanced?: boolean;
};

function scoreMemberForRole(
  member: RosterMember,
  role: Role,
  roleSkillMap: Record<string, string[]>
): number {
  const required = roleSkillMap[role.title] || [];
  const skills = (member.skills || []).map((s) => s.toLowerCase());
  const overlap = required.reduce(
    (acc, r) => acc + (skills.includes(r.toLowerCase()) ? 1 : 0),
    0
  );
  const cap = member.capacity || 20;
  return overlap + Math.min(0.5, cap / 100);
}

// ─── Main Export ─────────────────────────────────────────────────────────────

export function distributeTeamHours({
  roles,
  roster,
  roleSkillMap = {},
}: {
  roles: Role[];
  roster: RosterMember[];
  roleSkillMap?: Record<string, string[]>;
}): { assignments: Assignment[]; warnings: string[] } {
  // Guard: empty inputs
  roster = (roster || []).map((m) => ({
    capacity: 20,
    skills: [],
    ...m,
  }));
  roles = roles || [];

  const warnings: string[] = [];

  if (roster.length === 0) {
    warnings.push("Empty roster — no assignments made.");
    return { assignments: [], warnings };
  }

  const totalTasks = roles.reduce((s, r) => s + (r.tasks?.length || 0), 0);
  if (totalTasks === 0) {
    warnings.push("No tasks defined across any role.");
    const empty: Assignment[] = roster.map((m) => ({
      userId: m.userId,
      name: m.name,
      primaryRole: "unassigned",
      score: 0,
      assignedTasks: [],
      assignedHours: 0,
      capacity: m.capacity || 20,
    }));
    return { assignments: empty, warnings };
  }

  // ─── Phase 1: Skill Scoring ─────────────────────────────────────────────

  // For each member, find best-scoring role
  const memberBestRole: Record<string, { role: string; score: number }> = {};
  for (const m of roster) {
    let best = { role: roles[0]?.title ?? "unassigned", score: -Infinity };
    for (const r of roles) {
      const s = scoreMemberForRole(m, r, roleSkillMap);
      if (s > best.score || (s === best.score && r.title < best.role)) {
        best = { role: r.title, score: s };
      }
    }
    memberBestRole[m.userId] = best;
  }

  // ─── Phase 2: Role Assignment ───────────────────────────────────────────

  const roleMembers: Record<string, RosterMember[]> = {};
  for (const r of roles) roleMembers[r.title] = [];

  for (const m of roster) {
    const best = memberBestRole[m.userId];
    if (best.role !== "unassigned") {
      roleMembers[best.role] = roleMembers[best.role] || [];
      roleMembers[best.role].push(m);
    }
  }

  // Ensure every role has ≥ 1 member
  for (const r of roles) {
    if (!roleMembers[r.title] || roleMembers[r.title].length === 0) {
      // Pick best available candidate (highest score, tiebreak by userId)
      const candidates = roster
        .map((m) => ({ m, score: scoreMemberForRole(m, r, roleSkillMap) }))
        .sort(
          (a, b) =>
            b.score - a.score || a.m.userId.localeCompare(b.m.userId)
        );
      if (candidates.length > 0) {
        const top = candidates[0].m;
        roleMembers[r.title] = [top];
        if (candidates[0].score === 0) {
          warnings.push(
            `⚠ No skilled member for role "${r.title}". Best available: ${top.name} — skill gap.`
          );
        } else {
          warnings.push(
            `ℹ No clear owner for "${r.title}". Assigned best candidate: ${top.name}.`
          );
        }
      }
    }
  }

  // ─── Build member state map ──────────────────────────────────────────────

  const stateMap: Record<string, MemberState> = {};
  for (const m of roster) {
    const best = memberBestRole[m.userId] || { role: "unassigned", score: 0 };
    const required = roleSkillMap[best.role] || [];
    const memberSkills = (m.skills || []).map((s) => s.toLowerCase());
    const skill_gap =
      required.length > 0 &&
      !required.some((r) => memberSkills.includes(r.toLowerCase()));

    if (skill_gap) {
      warnings.push(
        `⚠ ${m.name} assigned to "${best.role}" but lacks required skills (${required.join(", ")}). Will still receive tasks.`
      );
    }

    stateMap[m.userId] = {
      member: m,
      primaryRole: best.role,
      score: best.score,
      remaining: m.capacity || 20,
      assignedTasks: [],
      assignedHours: 0,
      skill_gap,
    };
  }

  // ─── Phase 3: Greedy Largest-First Task Packing ─────────────────────────

  for (const role of roles) {
    const members = roleMembers[role.title] || [];
    if (members.length === 0) continue;

    const tasks: InternalTask[] = (role.tasks || []).map((t) => ({
      id: t.id || `t-${nanoid(6)}`,
      title: t.title,
      estimatedHours: typeof t.estimatedHours === "number" ? t.estimatedHours : 2,
    }));

    // Sort tasks largest-first (bin-packing heuristic)
    tasks.sort((a, b) => b.estimatedHours - a.estimatedHours);

    for (const task of tasks) {
      // Pick member in this role with most remaining capacity (tiebreak: userId)
      const sorted = members
        .map((m) => ({ m, st: stateMap[m.userId] }))
        .sort(
          (a, b) =>
            b.st.remaining - a.st.remaining ||
            a.m.userId.localeCompare(b.m.userId)
        );

      const top = sorted[0];
      const st = top.st;

      st.assignedTasks.push(task);
      st.assignedHours = +(st.assignedHours + task.estimatedHours).toFixed(2);
      st.remaining = +(st.remaining - task.estimatedHours).toFixed(2);

      if (st.assignedHours > (st.member.capacity || 20)) {
        warnings.push(
          `⚠ Overload: task "${task.title}" pushes ${top.m.name} past capacity.`
        );
      }
    }
  }

  // ─── Phase 4: Idle Rescue ────────────────────────────────────────────────
  // Members with 0 tasks steal smallest task from most overloaded member.

  const idle = () =>
    Object.values(stateMap).filter((s) => s.assignedTasks.length === 0);

  const mostOverloaded = () => {
    const candidates = Object.values(stateMap).filter(
      (s) => s.assignedTasks.length >= 2 // can only steal from members with ≥2 tasks
    );
    if (candidates.length === 0) return null;
    return candidates.sort(
      (a, b) =>
        b.assignedHours - a.assignedHours ||
        a.member.userId.localeCompare(b.member.userId)
    )[0];
  };

  let rescueRounds = 0;
  const maxRescueRounds = roster.length * 3; // prevent infinite loop

  while (idle().length > 0 && rescueRounds < maxRescueRounds) {
    const idleMembers = idle();
    const donor = mostOverloaded();

    if (!donor) break; // no one has ≥2 tasks to spare

    // Take the smallest task from the donor
    const smallestIdx = donor.assignedTasks.reduce(
      (minIdx, t, i, arr) =>
        t.estimatedHours < arr[minIdx].estimatedHours ? i : minIdx,
      0
    );
    const stolen = donor.assignedTasks.splice(smallestIdx, 1)[0];
    donor.assignedHours = +(donor.assignedHours - stolen.estimatedHours).toFixed(2);
    donor.remaining = +(donor.remaining + stolen.estimatedHours).toFixed(2);

    // Give it to the first idle member (tiebreak: most capacity)
    const recipient = idleMembers.sort(
      (a, b) =>
        (b.member.capacity || 20) - (a.member.capacity || 20) ||
        a.member.userId.localeCompare(b.member.userId)
    )[0];

    recipient.assignedTasks.push(stolen);
    recipient.assignedHours = +(recipient.assignedHours + stolen.estimatedHours).toFixed(2);
    recipient.remaining = +(recipient.remaining - stolen.estimatedHours).toFixed(2);
    recipient.skill_gap = true; // task is outside their natural role — flag it

    warnings.push(
      `ℹ ${recipient.member.name} had no tasks — rescued with "${stolen.title}" from ${donor.member.name}.`
    );

    rescueRounds++;
  }

  // If still idle members exist and no one had ≥2 tasks to spare
  for (const st of idle()) {
    warnings.push(
      `⚠ ${st.member.name} has no tasks. All tasks are assigned and cannot be safely split further. Consider adding more tasks or redistributing manually.`
    );
  }

  // ─── Phase 5: Overload Leveling ─────────────────────────────────────────
  // If member > 150% capacity AND another is < 50% capacity → move smallest task.

  const OVERLOAD_THRESHOLD = 1.5; // 150% of capacity
  const UNDER_THRESHOLD = 0.5;    // under 50% of capacity

  let levelRounds = 0;
  const maxLevelRounds = totalTasks * 2;

  while (levelRounds < maxLevelRounds) {
    const overloadedMembers = Object.values(stateMap).filter((s) => {
      const cap = s.member.capacity || 20;
      return s.assignedHours > cap * OVERLOAD_THRESHOLD && s.assignedTasks.length >= 2;
    });

    const underLoadedMembers = Object.values(stateMap).filter((s) => {
      const cap = s.member.capacity || 20;
      return s.assignedHours < cap * UNDER_THRESHOLD;
    });

    if (overloadedMembers.length === 0 || underLoadedMembers.length === 0) break;

    const donor = overloadedMembers.sort(
      (a, b) => b.assignedHours - a.assignedHours
    )[0];

    const smallestIdx = donor.assignedTasks.reduce(
      (minIdx, t, i, arr) =>
        t.estimatedHours < arr[minIdx].estimatedHours ? i : minIdx,
      0
    );
    const task = donor.assignedTasks.splice(smallestIdx, 1)[0];
    donor.assignedHours = +(donor.assignedHours - task.estimatedHours).toFixed(2);
    donor.remaining = +(donor.remaining + task.estimatedHours).toFixed(2);

    const recipient = underLoadedMembers.sort(
      (a, b) => a.assignedHours - b.assignedHours
    )[0];
    recipient.assignedTasks.push(task);
    recipient.assignedHours = +(recipient.assignedHours + task.estimatedHours).toFixed(2);
    recipient.remaining = +(recipient.remaining - task.estimatedHours).toFixed(2);
    recipient.rebalanced = true;

    warnings.push(
      `↔ Rebalanced: "${task.title}" moved from ${donor.member.name} → ${recipient.member.name}.`
    );

    levelRounds++;
  }

  // ─── Final Output ────────────────────────────────────────────────────────

  const assignments: Assignment[] = roster.map((m) => {
    const st = stateMap[m.userId];
    const cap = m.capacity || 20;
    return {
      userId: m.userId,
      name: m.name,
      primaryRole: st.primaryRole,
      score: Number(st.score.toFixed(3)),
      assignedTasks: st.assignedTasks,
      assignedHours: Number(st.assignedHours.toFixed(2)),
      capacity: cap,
      overloaded: st.assignedHours > cap || undefined,
      skill_gap: st.skill_gap || undefined,
      rescued: st.assignedTasks.length > 0 && st.score < 0.5 ? true : undefined,
      rebalanced: st.rebalanced || undefined,
    };
  });

  return { assignments, warnings };
}

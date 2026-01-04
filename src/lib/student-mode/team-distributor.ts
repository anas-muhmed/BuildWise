import { TeamMember, Skill } from "./team-types";
import { skillForNode } from "./team-rules";

type ArchitectureNode = {
  id: string;
  label: string;
  type: string;
};

export type Assignment = {
  nodeId: string;
  nodeLabel: string;
  nodeType: string;
  requiredSkill: Skill;
  assignedTo: TeamMember | null;
  reason?: string;
};

export type DistributionResult = {
  assignments: Assignment[];
  warnings: string[];
  coverage: {
    assigned: number;
    unassigned: number;
    total: number;
  };
};

/**
 * Distributes architecture components to team members based on skills
 * Pure function - deterministic and testable
 */
export function distributeWork(
  nodes: ArchitectureNode[],
  team: TeamMember[]
): DistributionResult {
  const assignments: Assignment[] = [];
  const warnings: string[] = [];
  const workload = new Map<string, number>();

  // Initialize workload counter
  team.forEach(member => workload.set(member.id, 0));

  // Assign each node
  for (const node of nodes) {
    const requiredSkill = skillForNode(node.type);

    // Find team members with required skill
    const candidates = team.filter(member =>
      member.skills.includes(requiredSkill)
    );

    if (candidates.length === 0) {
      // No one has required skill
      assignments.push({
        nodeId: node.id,
        nodeLabel: node.label,
        nodeType: node.type,
        requiredSkill,
        assignedTo: null,
        reason: `No team member with skill: ${requiredSkill}`,
      });
      warnings.push(`${node.label} requires ${requiredSkill} but no team member has this skill`);
      continue;
    }

    // Pick candidate with least workload (load balancing)
    const candidate = candidates.reduce((least, current) => {
      const leastLoad = workload.get(least.id) || 0;
      const currentLoad = workload.get(current.id) || 0;
      return currentLoad < leastLoad ? current : least;
    });

    // Assign
    assignments.push({
      nodeId: node.id,
      nodeLabel: node.label,
      nodeType: node.type,
      requiredSkill,
      assignedTo: candidate,
    });

    // Increment workload
    workload.set(candidate.id, (workload.get(candidate.id) || 0) + 1);
  }

  // Check for overload
  workload.forEach((count, memberId) => {
    if (count > 3) {
      const member = team.find(m => m.id === memberId);
      warnings.push(`${member?.name} is assigned ${count} components - potential overload`);
    }
  });

  const assigned = assignments.filter(a => a.assignedTo !== null).length;
  const unassigned = assignments.length - assigned;

  return {
    assignments,
    warnings,
    coverage: {
      assigned,
      unassigned,
      total: assignments.length,
    },
  };
}

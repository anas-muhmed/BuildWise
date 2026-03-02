import { TeamSetupData, RosterMember, RoleDefinition } from "./team-types";

const KEY = (projectId: string) => `bw_team_setup_${projectId}`;
const RESULT_KEY = (projectId: string) => `bw_team_result_${projectId}`;

// ------- Save / Load Setup Input -------

export function saveTeamSetup(projectId: string, data: TeamSetupData): void {
  try {
    localStorage.setItem(KEY(projectId), JSON.stringify(data));
  } catch {
    // ignore storage errors
  }
}

export function loadTeamSetup(projectId: string): TeamSetupData | null {
  try {
    const raw = localStorage.getItem(KEY(projectId));
    if (!raw) return null;
    return JSON.parse(raw) as TeamSetupData;
  } catch {
    return null;
  }
}

// ------- Save / Load Distribution Result -------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function saveDistributionResult(projectId: string, result: any): void {
  try {
    localStorage.setItem(RESULT_KEY(projectId), JSON.stringify(result));
  } catch {
    // ignore
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function loadDistributionResult(projectId: string): any | null {
  try {
    const raw = localStorage.getItem(RESULT_KEY(projectId));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ------- Defaults -------

export function defaultRoles(): RoleDefinition[] {
  return [
    {
      title: "Backend Developer",
      tasks: [
        { title: "API Design & Implementation", estimatedHours: 8 },
        { title: "Business Logic & Services", estimatedHours: 6 },
      ],
    },
    {
      title: "Frontend Developer",
      tasks: [
        { title: "UI Components & Pages", estimatedHours: 8 },
        { title: "API Integration", estimatedHours: 4 },
      ],
    },
    {
      title: "DevOps Engineer",
      tasks: [
        { title: "Docker & Deployment Setup", estimatedHours: 6 },
        { title: "CI/CD Pipeline", estimatedHours: 4 },
      ],
    },
    {
      title: "Database Admin",
      tasks: [
        { title: "Schema Design", estimatedHours: 4 },
        { title: "Query Optimization", estimatedHours: 3 },
      ],
    },
  ];
}

export const ALL_SKILLS: { value: string; label: string; color: string }[] = [
  { value: "backend", label: "Backend", color: "#6366f1" },
  { value: "frontend", label: "Frontend", color: "#3b82f6" },
  { value: "database", label: "Database", color: "#10b981" },
  { value: "devops", label: "DevOps", color: "#f59e0b" },
  { value: "security", label: "Security", color: "#ef4444" },
  { value: "mobile", label: "Mobile", color: "#8b5cf6" },
  { value: "ml", label: "ML/AI", color: "#ec4899" },
  { value: "qa", label: "QA/Testing", color: "#14b8a6" },
];

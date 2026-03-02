export type Skill =
  | "frontend"
  | "backend"
  | "database"
  | "devops"
  | "security"
  | "mobile"
  | "ml"
  | "qa";

export type TeamMember = {
  id: string;
  name: string;
  skills: Skill[];
};

// Richer type used by the team-setup page and distributionEngineV2
export type RosterMember = {
  userId: string;
  name: string;
  skills: string[];
  capacity: number; // hours per week available
};

export type TaskItem = {
  id?: string;
  title: string;
  estimatedHours: number;
};

export type RoleDefinition = {
  title: string;
  tasks: TaskItem[];
};

export type TeamSetupData = {
  roster: RosterMember[];
  roles: RoleDefinition[];
};

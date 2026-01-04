export type Skill =
  | "frontend"
  | "backend"
  | "database"
  | "devops";

export type TeamMember = {
  id: string;
  name: string;
  skills: Skill[];
};

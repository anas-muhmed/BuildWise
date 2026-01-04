export function getProjectContext(projectId: string) {
  // mock for now - will be replaced with actual project data
  return {
    teamSize: 1,
    experienceLevel: "beginner" as const,
  };
}

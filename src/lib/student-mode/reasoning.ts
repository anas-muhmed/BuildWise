export type ReasoningAnswer =
  | "transactional"
  | "informational"
  | "communication"
  | "low_users"
  | "medium_users"
  | "high_users"
  | "no_sensitive"
  | "auth_only"
  | "payments"
  | "no_realtime"
  | "polling"
  | "realtime"
  | "stop_all"
  | "partial_fail"
  | "self_heal"
  | "single_server"
  | "cloud_scaling"
  | "learning"
  | "beginners"
  | "mixed"
  | "experienced";

export const reasoningQuestions = [
  {
    id: "system_type",
    title: "What kind of system is this?",
    options: [
      { label: "Transactional", value: "transactional" },
      { label: "Informational", value: "informational" },
      { label: "Communication", value: "communication" },
    ],
  },
  {
    id: "user_load",
    title: "Expected number of users?",
    options: [
      { label: "Very Low", value: "low_users" },
      { label: "Medium", value: "medium_users" },
      { label: "High", value: "high_users" },
    ],
  },
  {
    id: "data_sensitivity",
    title: "Sensitive data involved?",
    options: [
      { label: "No", value: "no_sensitive" },
      { label: "Login only", value: "auth_only" },
      { label: "Payments / Personal data", value: "payments" },
    ],
  },
  {
    id: "realtime",
    title: "Real-time updates required?",
    options: [
      { label: "No", value: "no_realtime" },
      { label: "Polling is fine", value: "polling" },
      { label: "Yes, real-time", value: "realtime" },
    ],
  },
  {
    id: "failure",
    title: "Failure behavior?",
    options: [
      { label: "System can stop", value: "stop_all" },
      { label: "Partial failure ok", value: "partial_fail" },
      { label: "Self-recovery needed", value: "self_heal" },
    ],
  },
  {
    id: "deployment",
    title: "Deployment style?",
    options: [
      { label: "Single server", value: "single_server" },
      { label: "Cloud scaling", value: "cloud_scaling" },
      { label: "Learning / unsure", value: "learning" },
    ],
  },
  {
    id: "team",
    title: "Team skill level?",
    options: [
      { label: "Beginners", value: "beginners" },
      { label: "Mixed", value: "mixed" },
      { label: "Experienced", value: "experienced" },
    ],
  },
];

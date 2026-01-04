import { projectDefinitionStore, reasoningStore, architectureStore } from "./store";
import { buildArchitecture } from "./architecture-rules";

/**
 * Seeds stores with test data for consistent testing
 * Call this on server start or in tests
 */
export function seedTestData() {
  const testProjectId = "test-project-1";

  // Seed project definition
  projectDefinitionStore.set(testProjectId, {
    name: "E-commerce Platform",
    goal: "Build an online store with payments",
    audience: "developers",
  });

  // Seed reasoning answers
  const testAnswers = {
    system_type: "transactional",
    user_load: "medium",
    data_sensitivity: "payments",
    realtime: "polling",
    failure: "self_heal",
    deployment: "cloud_scaling",
    team: "small",
  };

  reasoningStore.set(testProjectId, {
    index: 7, // All questions answered
    answers: testAnswers,
  });

  // Seed architecture
  const architecture = buildArchitecture(testProjectId, testAnswers);
  architectureStore.set(testProjectId, architecture);

  console.log(`✅ Seeded test data for project: ${testProjectId}`);
}

/**
 * Clears all stores (useful for testing)
 */
export function clearAllData() {
  projectDefinitionStore.clear();
  reasoningStore.clear();
  architectureStore.clear();
  console.log("🗑️  Cleared all data");
}

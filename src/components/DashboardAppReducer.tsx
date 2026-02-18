// components/DashboardAppReducer.tsx
/**
 * Refactored DashboardApp using useReducer for better state management
 * 
 * Benefits:
 * - Single state update per action
 * - Predictable state transitions
 * - Easier testing
 * - Better performance (fewer re-renders)
 */

import { useReducer } from "react";

// State shape
interface DashboardState {
  showLoginModal: boolean;
  generativeInput: string;
  loading: boolean;
  recentProjects: RecentProject[];
  loadingProjects: boolean;
  error: string | null;
}

interface RecentProject {
  _id: string;
  title: string;
  current_phase: number;
  updated_at: string;
}

// Action types
type DashboardAction =
  | { type: "OPEN_LOGIN_MODAL" }
  | { type: "CLOSE_LOGIN_MODAL" }
  | { type: "SET_INPUT"; payload: string }
  | { type: "START_GENERATION" }
  | { type: "GENERATION_SUCCESS" }
  | { type: "GENERATION_ERROR"; payload: string }
  | { type: "START_LOADING_PROJECTS" }
  | { type: "LOAD_PROJECTS_SUCCESS"; payload: RecentProject[] }
  | { type: "LOAD_PROJECTS_ERROR"; payload: string }
  | { type: "CLEAR_ERROR" };

// Initial state
const initialState: DashboardState = {
  showLoginModal: false,
  generativeInput: "",
  loading: false,
  recentProjects: [],
  loadingProjects: true,
  error: null,
};

// Reducer function
function dashboardReducer(
  state: DashboardState,
  action: DashboardAction
): DashboardState {
  switch (action.type) {
    case "OPEN_LOGIN_MODAL":
      return { ...state, showLoginModal: true };

    case "CLOSE_LOGIN_MODAL":
      return { ...state, showLoginModal: false };

    case "SET_INPUT":
      return { ...state, generativeInput: action.payload };

    case "START_GENERATION":
      return { ...state, loading: true, error: null };

    case "GENERATION_SUCCESS":
      return { ...state, loading: false };

    case "GENERATION_ERROR":
      return { ...state, loading: false, error: action.payload };

    case "START_LOADING_PROJECTS":
      return { ...state, loadingProjects: true, error: null };

    case "LOAD_PROJECTS_SUCCESS":
      return {
        ...state,
        recentProjects: action.payload,
        loadingProjects: false,
      };

    case "LOAD_PROJECTS_ERROR":
      return {
        ...state,
        loadingProjects: false,
        error: action.payload,
      };

    case "CLEAR_ERROR":
      return { ...state, error: null };

    default:
      return state;
  }
}

// Custom hook
export function useDashboardState() {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);

  // Action creators
  const actions = {
    openLoginModal: () => dispatch({ type: "OPEN_LOGIN_MODAL" }),
    closeLoginModal: () => dispatch({ type: "CLOSE_LOGIN_MODAL" }),
    setInput: (input: string) => dispatch({ type: "SET_INPUT", payload: input }),
    startGeneration: () => dispatch({ type: "START_GENERATION" }),
    generationSuccess: () => dispatch({ type: "GENERATION_SUCCESS" }),
    generationError: (error: string) =>
      dispatch({ type: "GENERATION_ERROR", payload: error }),
    startLoadingProjects: () => dispatch({ type: "START_LOADING_PROJECTS" }),
    loadProjectsSuccess: (projects: RecentProject[]) =>
      dispatch({ type: "LOAD_PROJECTS_SUCCESS", payload: projects }),
    loadProjectsError: (error: string) =>
      dispatch({ type: "LOAD_PROJECTS_ERROR", payload: error }),
    clearError: () => dispatch({ type: "CLEAR_ERROR" }),
  };

  return { state, actions };
}

// ============================================
// USAGE EXAMPLE in Component:
// ============================================
/*
export default function DashboardApp() {
  const { isAuthenticated } = useAuth();
  const { state, actions } = useDashboardState();

  // Fetch recent projects on mount
  React.useEffect(() => {
    const fetchRecentProjects = async () => {
      actions.startLoadingProjects();
      
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await fetch("/api/generative/projects", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          actions.loadProjectsSuccess(data.projects || []);
        } else {
          actions.loadProjectsError("Failed to load projects");
        }
      } catch (error) {
        actions.loadProjectsError("Network error");
      }
    };

    if (isAuthenticated) {
      fetchRecentProjects();
    }
  }, [isAuthenticated]);

  // Handle generation
  const handleGenerate = async () => {
    if (!state.generativeInput.trim()) {
      actions.generationError("Please enter a description");
      return;
    }

    actions.startGeneration();

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ prompt: state.generativeInput }),
      });

      if (response.ok) {
        actions.generationSuccess();
        // Navigate or update UI
      } else {
        actions.generationError("Generation failed");
      }
    } catch (error) {
      actions.generationError("Network error");
    }
  };

  return (
    <div>
      {state.error && (
        <div className="error-banner">
          {state.error}
          <button onClick={actions.clearError}>×</button>
        </div>
      )}
      
      <input
        value={state.generativeInput}
        onChange={(e) => actions.setInput(e.target.value)}
        disabled={state.loading}
      />
      
      <button onClick={handleGenerate} disabled={state.loading}>
        {state.loading ? "Generating..." : "Generate"}
      </button>

      {state.loadingProjects ? (
        <div>Loading projects...</div>
      ) : (
        <ProjectsList projects={state.recentProjects} />
      )}

      {state.showLoginModal && (
        <LoginModal onClose={actions.closeLoginModal} />
      )}
    </div>
  );
}
*/

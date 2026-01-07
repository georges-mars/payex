import { create } from 'zustand';

interface AppState {
  // Default states
  isAuthenticated: boolean;
  
  // Common app-wide states (add as needed for your app)
  // Examples: onboardingCompleted, userRole, currentView, etc.
  
  // Generic state container - can hold any additional state
  [key: string]: any;
}

interface AppStateStore extends AppState {
  // Update any part of the state
  updateState: (updates: Partial<AppState>) => void;
  
  // Get current state
  getState: () => AppState;
  
  // Clear all state (useful for logout)
  clearState: () => void;
  
  // Reset to initial state
  resetState: () => void;
}

const initialState: AppState = {
  isAuthenticated: false,
  // Add more default states as needed
  // IMPORTANT: When your app needs navigation decisions based on state,
  // add those flags here and coordinate with entity stores
};

export const useAppStateStore = create<AppStateStore>((set, get) => ({
  ...initialState,
  
  updateState: (updates) => {
    // This triggers React re-renders for components using this store
    // Components should use useEffect to react to these state changes
    set((state) => ({
      ...state,
      ...updates
    }));
  },
  
  getState: () => {
    const state = get();
    // Return only the state data, excluding functions
    const { updateState, getState, clearState, resetState, ...stateData } = state;
    return stateData as AppState;
  },
  
  clearState: () => {
    set(initialState);
  },
  
  resetState: () => {
    set({
      ...initialState,
      updateState: get().updateState,
      getState: get().getState,
      clearState: get().clearState,
      resetState: get().resetState,
    });
  },
}));

// Helper hook to access specific state values
export const useAppState = <T = any>(key: string): T => {
  return useAppStateStore((state) => state[key]);
};

// Helper to update state from outside React components
export const updateAppState = (updates: Partial<AppState>) => {
  useAppStateStore.getState().updateState(updates);
};

// Helper to get state from outside React components  
export const getAppState = () => {
  return useAppStateStore.getState().getState();
};
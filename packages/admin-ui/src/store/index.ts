import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'frontline_operator' | 'manager' | 'admin' | 'engineering' | 'compliance_reviewer';
  initials: string;
}

interface AppState {
  currentUser: User;
  selectedLocationId: string | null;
  activeFilters: Record<string, string>;

  setSelectedLocation: (locationId: string | null) => void;
  setFilter: (key: string, value: string) => void;
  clearFilters: () => void;
  removeFilter: (key: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentUser: {
    id: 'user-001',
    name: 'Dr. J. Garcia',
    email: 'jgarcia@veinclinic.com',
    role: 'admin',
    initials: 'JG',
  },

  selectedLocationId: null,
  activeFilters: {},

  setSelectedLocation: (locationId) =>
    set({ selectedLocationId: locationId }),

  setFilter: (key, value) =>
    set((state) => ({
      activeFilters: { ...state.activeFilters, [key]: value },
    })),

  clearFilters: () => set({ activeFilters: {} }),

  removeFilter: (key) =>
    set((state) => {
      const next = { ...state.activeFilters };
      delete next[key];
      return { activeFilters: next };
    }),
}));

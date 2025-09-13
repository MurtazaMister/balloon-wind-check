import { create } from "zustand";

interface SelectionState {
  selectedPointIds: string[]; // feature ids from points-source
  togglePoint: (id: string) => void;
  clearSelection: () => void;
  addPoint: (id: string) => void;
  removePoint: (id: string) => void;
  setSelectedPoints: (ids: string[]) => void;
}

export const useSelection = create<SelectionState>((set, get) => ({
  selectedPointIds: [],
  
  togglePoint: (id: string) => {
    const current = get().selectedPointIds;
    if (current.includes(id)) {
      set({ selectedPointIds: current.filter(pointId => pointId !== id) });
    } else {
      // Hard cap at 100 points
      if (current.length >= 100) {
        // Show toast warning (we'll implement this later)
        console.warn('Maximum 100 points can be selected');
        return;
      }
      set({ selectedPointIds: [...current, id] });
    }
  },
  
  clearSelection: () => {
    set({ selectedPointIds: [] });
  },
  
  addPoint: (id: string) => {
    const current = get().selectedPointIds;
    if (!current.includes(id) && current.length < 100) {
      set({ selectedPointIds: [...current, id] });
    }
  },
  
  removePoint: (id: string) => {
    const current = get().selectedPointIds;
    set({ selectedPointIds: current.filter(pointId => pointId !== id) });
  },
  
  setSelectedPoints: (ids: string[]) => {
    // Enforce 100 point limit
    const limitedIds = ids.slice(0, 100);
    set({ selectedPointIds: limitedIds });
  }
}));

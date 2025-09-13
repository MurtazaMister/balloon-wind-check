import { create } from "zustand";

interface UIState {
  hourOffset: number; // 0..23
  playing: boolean;
  hoveredTrackId?: string | null;
  isPlaying: boolean;           // default false
  loopVideo: boolean;          // default true
  playbackFps: number;         // default 2 (i.e., 500ms per step)
  selectedBalloons: Set<string>; // selected balloon track IDs
  enabledColors: Set<string>;  // enabled color categories (green, blue, orange, red)
  viewMode: 'all' | 'selected'; // view mode for points display
  showHintsModal: boolean;     // show hints modal on load
  setHourOffset: (h: number) => void;
  setPlaying: (p: boolean) => void;
  setHoveredTrackId: (id: string | null) => void;
  setIsPlaying: (b: boolean) => void;
  setLoopVideo: (b: boolean) => void;
  setPlaybackFps: (n: number) => void;
  setSelectedBalloons: (balloons: Set<string>) => void;
  addSelectedBalloon: (trackId: string) => void;
  removeSelectedBalloon: (trackId: string) => void;
  clearSelectedBalloons: () => void;
  setEnabledColors: (colors: Set<string>) => void;
  toggleColor: (color: string) => void;
  setViewMode: (mode: 'all' | 'selected') => void;
  setShowHintsModal: (show: boolean) => void;
}
export const useUI = create<UIState>((set) => ({
  hourOffset: 0,
  playing: false,
  hoveredTrackId: null,
  isPlaying: false,
  loopVideo: true,
  playbackFps: 2,
  selectedBalloons: new Set(),
  enabledColors: new Set(['green', 'blue', 'orange', 'red']), // All colors enabled by default
  viewMode: 'all', // default to showing all points
  showHintsModal: true, // show hints modal on first load
  setHourOffset: (h) => set({ hourOffset: h }),
  setPlaying: (p) => set({ playing: p }),
  setHoveredTrackId: (id) => set({ hoveredTrackId: id }),
  setIsPlaying: (b) => set({ isPlaying: b }),
  setLoopVideo: (b) => set({ loopVideo: b }),
  setPlaybackFps: (n) => set({ playbackFps: n }),
  setSelectedBalloons: (balloons) => set({ selectedBalloons: balloons }),
  addSelectedBalloon: (trackId) => set((state) => {
    const newSet = new Set(state.selectedBalloons);
    newSet.add(trackId);
    return { selectedBalloons: newSet };
  }),
  removeSelectedBalloon: (trackId) => set((state) => {
    const newSet = new Set(state.selectedBalloons);
    newSet.delete(trackId);
    return { selectedBalloons: newSet };
  }),
  clearSelectedBalloons: () => set({ selectedBalloons: new Set() }),
  setEnabledColors: (colors) => set({ enabledColors: colors }),
  toggleColor: (color) => set((state) => {
    const newSet = new Set(state.enabledColors);
    if (newSet.has(color)) {
      newSet.delete(color);
    } else {
      newSet.add(color);
    }
    return { enabledColors: newSet };
  }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setShowHintsModal: (show) => set({ showHintsModal: show }),
}));

import { create } from "zustand";

interface UIState {
  hourOffset: number; // 0..23
  playing: boolean;
  hoveredTrackId?: string | null;
  showPoints: boolean;          // default true
  isPlaying: boolean;           // default false
  playbackFps: number;         // default 2 (i.e., 500ms per step)
  selectedBalloons: Set<string>; // selected balloon track IDs
  setHourOffset: (h: number) => void;
  setPlaying: (p: boolean) => void;
  setHoveredTrackId: (id: string | null) => void;
  setShowPoints: (b: boolean) => void;
  setIsPlaying: (b: boolean) => void;
  setPlaybackFps: (n: number) => void;
  setSelectedBalloons: (balloons: Set<string>) => void;
  addSelectedBalloon: (trackId: string) => void;
  removeSelectedBalloon: (trackId: string) => void;
  clearSelectedBalloons: () => void;
}
export const useUI = create<UIState>((set) => ({
  hourOffset: 0,
  playing: false,
  hoveredTrackId: null,
  showPoints: true,
  isPlaying: false,
  playbackFps: 2,
  selectedBalloons: new Set(),
  setHourOffset: (h) => set({ hourOffset: h }),
  setPlaying: (p) => set({ playing: p }),
  setHoveredTrackId: (id) => set({ hoveredTrackId: id }),
  setShowPoints: (b) => set({ showPoints: b }),
  setIsPlaying: (b) => set({ isPlaying: b }),
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
}));

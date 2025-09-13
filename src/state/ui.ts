import { create } from "zustand";

interface UIState {
  hourOffset: number; // 0..23
  playing: boolean;
  setHourOffset: (h: number) => void;
  setPlaying: (p: boolean) => void;
}
export const useUI = create<UIState>((set) => ({
  hourOffset: 0,
  playing: false,
  setHourOffset: (h) => set({ hourOffset: h }),
  setPlaying: (p) => set({ playing: p }),
}));

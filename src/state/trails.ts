import { create } from 'zustand';
import RBush from 'rbush';
import type { Sample } from '../types/balloon';

export type Hour = 0|1|2|3|4|5|6|7|8|9|10|11|12|13|14|15|16|17|18|19|20|21|22|23;

export type HourBucket = { h: number; samples: Sample[] };

export type SegmentProps = {
  id: string;          // unique
  trackId: string;
  h0: number;          // start hour for pair (h -> h+1)
  dAltKm: number;
  absDAltKm: number;
  lengthKm: number;
  speedMs: number;
};

export type SegmentFeature = GeoJSON.Feature<GeoJSON.LineString, SegmentProps>;

export type IndexItem = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  id: string;
  trackId: string;
  pairH: number;
};

export interface TrailsState {
  // Raw buckets (by hour)
  hourBuckets: Map<number, Sample[]>;
  setHourBucket(h: number, samples: Sample[]): void;

  // Segments per hour pair (h -> h+1)
  pairSegments: Map<number, SegmentFeature[]>;
  setPairSegments(h: number, segs: SegmentFeature[]): void;

  // Spatial index for all segment bounding boxes (RBush)
  index: RBush<IndexItem>;
  insertIndex(items: IndexItem[]): void;

  // Visible subset cache for current viewport
  visible: SegmentFeature[];
  setVisible(fc: SegmentFeature[]): void;

  // Settings
  trailsMaxHours: 6 | 12 | 24;
  setTrailsMaxHours(h: 6|12|24): void;

  // Track to segment mapping for hover optimization
  trackToSegmentIds: Map<string, string[]>;
  setTrackToSegmentIds(map: Map<string, string[]>): void;

  // Last hovered track for optimization
  lastHoveredTrackId: string | null;
  setLastHoveredTrackId(id: string | null): void;
}

export const useTrails = create<TrailsState>((set) => ({
  hourBuckets: new Map(),
  pairSegments: new Map(),
  index: new RBush<IndexItem>(),
  visible: [],
  trailsMaxHours: 6,
  trackToSegmentIds: new Map(),
  lastHoveredTrackId: null,

  setHourBucket: (h: number, samples: Sample[]) => {
    set((state) => {
      const newBuckets = new Map(state.hourBuckets);
      newBuckets.set(h, samples);
      return { hourBuckets: newBuckets };
    });
  },

  setPairSegments: (h: number, segs: SegmentFeature[]) => {
    set((state) => {
      const newSegments = new Map(state.pairSegments);
      newSegments.set(h, segs);
      return { pairSegments: newSegments };
    });
  },

  insertIndex: (items: IndexItem[]) => {
    set((state) => {
      const newIndex = new RBush<IndexItem>();
      // Copy all existing items
      state.index.all().forEach(item => newIndex.insert(item));
      // Add new items one by one
      items.forEach(item => newIndex.insert(item));
      return { index: newIndex };
    });
  },

  setVisible: (fc: SegmentFeature[]) => {
    set({ visible: fc });
  },

  setTrailsMaxHours: (h: 6|12|24) => {
    set({ trailsMaxHours: h });
  },

  setTrackToSegmentIds: (map: Map<string, string[]>) => {
    set({ trackToSegmentIds: map });
  },

  setLastHoveredTrackId: (id: string | null) => {
    set({ lastHoveredTrackId: id });
  },
}));

import type { Sample } from '../types/balloon';

export interface BalloonTrack {
  id: string;
  samples: Sample[];
}

/**
 * Groups samples into balloon tracks by linking nearby points across hours
 * Uses proximity-based matching to identify the same balloon across time steps
 */
export function buildBalloonTracks(samples: Sample[]): BalloonTrack[] {
  
  // For now, let's create a simple approach: each sample is its own track
  // This will help us debug the display issue first
  const tracks: BalloonTrack[] = [];
  
  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i];
    const trackId = `balloon-${sample.h}-${i}`;
    tracks.push({
      id: trackId,
      samples: [sample]
    });
  }
  
  return tracks;
}

/**
 * Get all samples for a specific balloon track across all hours
 */
export function getTrackSamplesForHour(track: BalloonTrack, hour: number): Sample | null {
  return track.samples.find(sample => sample.h === hour) || null;
}

/**
 * Check if a sample belongs to a specific track
 */
export function isSampleInTrack(sample: Sample, track: BalloonTrack): boolean {
  return track.samples.some(s => 
    s.lat === sample.lat && 
    s.lon === sample.lon && 
    s.h === sample.h &&
    s.t === sample.t
  );
}

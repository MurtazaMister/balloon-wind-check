import { getDistance } from 'geolib';
import type { Sample } from '../types/balloon';

export type Track = { id: string; samples: Sample[] };

export function buildTracks(
  samples: Sample[],
  maxKmPerHour = 500
): Track[] {
  // Sort by hour, then by time, then by lat/lon for stable ordering
  const sortedSamples = samples.sort((a, b) => {
    if (a.h !== b.h) return a.h - b.h;
    if (a.t !== b.t) return a.t.localeCompare(b.t);
    if (a.lat !== b.lat) return a.lat - b.lat;
    return a.lon - b.lon;
  });

  const tracks: Track[] = [];
  const samplesByHour = new Map<number, Sample[]>();

  // Group samples by hour
  for (const sample of sortedSamples) {
    if (!samplesByHour.has(sample.h)) {
      samplesByHour.set(sample.h, []);
    }
    samplesByHour.get(sample.h)!.push(sample);
  }

  // Build tracks by linking consecutive hours
  for (let h = 0; h < 23; h++) {
    const currentHourSamples = samplesByHour.get(h) || [];
    const nextHourSamples = samplesByHour.get(h + 1) || [];

    if (currentHourSamples.length === 0 || nextHourSamples.length === 0) {
      continue;
    }

    // Link each current hour sample to nearest next hour sample
    for (const currentSample of currentHourSamples) {
      let nearestNextSample: Sample | null = null;
      let minDistance = Infinity;

      for (const nextSample of nextHourSamples) {
        const distance = getDistance(
          { latitude: currentSample.lat, longitude: currentSample.lon },
          { latitude: nextSample.lat, longitude: nextSample.lon }
        );

        if (distance < minDistance && distance <= maxKmPerHour * 1000) {
          minDistance = distance;
          nearestNextSample = nextSample;
        }
      }

      if (nearestNextSample) {
        // Find or create track for this sample
        let track = tracks.find(t => 
          t.samples.some(s => 
            s.lat === currentSample.lat && 
            s.lon === currentSample.lon && 
            s.t === currentSample.t
          )
        );

        if (!track) {
          // Create new track
          const trackId = `t${currentSample.t}-${currentSample.lat.toFixed(2)}-${currentSample.lon.toFixed(2)}-${tracks.length}`;
          track = { id: trackId, samples: [currentSample] };
          tracks.push(track);
        }

        // Add next sample to track if not already present
        const alreadyInTrack = track.samples.some(s => 
          s.lat === nearestNextSample!.lat && 
          s.lon === nearestNextSample!.lon && 
          s.t === nearestNextSample!.t
        );

        if (!alreadyInTrack) {
          track.samples.push(nearestNextSample);
        }
      }
    }
  }

  return tracks;
}

export function buildSegmentFeatures(tracks: Track[]): GeoJSON.FeatureCollection<GeoJSON.LineString> {
  const features: GeoJSON.Feature<GeoJSON.LineString>[] = [];

  for (const track of tracks) {
    // Sort track samples by hour and time
    const sortedTrackSamples = track.samples.sort((a, b) => {
      if (a.h !== b.h) return a.h - b.h;
      return a.t.localeCompare(b.t);
    });

    // Create segments between consecutive samples
    for (let i = 0; i < sortedTrackSamples.length - 1; i++) {
      const current = sortedTrackSamples[i];
      const next = sortedTrackSamples[i + 1];

      // Calculate distance and speed
      const distance = getDistance(
        { latitude: current.lat, longitude: current.lon },
        { latitude: next.lat, longitude: next.lon }
      );
      const speedMs = distance / 3600; // meters per second

      // Calculate altitude change
      const dAltKm = next.altKm - current.altKm;
      const absDAltKm = Math.abs(dAltKm);

      const segmentId = `${track.id}-${i}`;

      features.push({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [
            [current.lon, current.lat],
            [next.lon, next.lat]
          ]
        },
        properties: {
          id: segmentId,
          trackId: track.id,
          h0: current.h,
          dAltKm,
          absDAltKm,
          speedMs
        }
      });
    }
  }

  return {
    type: 'FeatureCollection',
    features
  };
}

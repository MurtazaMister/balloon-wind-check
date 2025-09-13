// Worker for building trail segments off the main thread
// Input: { left: Sample[], right: Sample[], hLeft: number, maxKmPerHour: number }
// Output: { pairH: number, segments: SegmentFeature[], indexItems: IndexItem[] }

import type { Sample } from '../types/balloon';
import type { SegmentFeature, IndexItem } from '../state/trails';

// Copy the great-circle distance calculation from geolib
function getDistance(
  point1: { latitude: number; longitude: number },
  point2: { latitude: number; longitude: number }
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (point2.latitude - point1.latitude) * Math.PI / 180;
  const dLon = (point2.longitude - point1.longitude) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in meters
}

function buildPairSegments(
  left: Sample[], 
  right: Sample[], 
  hLeft: number, 
  maxKmPerHour = 500
): { segments: SegmentFeature[]; indexItems: IndexItem[] } {
  const segments: SegmentFeature[] = [];
  const indexItems: IndexItem[] = [];
  const tracks = new Map<string, Sample[]>();

  // Sort samples for stable ordering
  const sortedLeft = [...left].sort((a, b) => {
    if (a.t !== b.t) return a.t.localeCompare(b.t);
    if (a.lat !== b.lat) return a.lat - b.lat;
    return a.lon - b.lon;
  });

  const sortedRight = [...right].sort((a, b) => {
    if (a.t !== b.t) return a.t.localeCompare(b.t);
    if (a.lat !== b.lat) return a.lat - b.lat;
    return a.lon - b.lon;
  });

  // Link each left sample to nearest right sample
  for (const leftSample of sortedLeft) {
    let nearestRightSample: Sample | null = null;
    let minDistance = Infinity;

    for (const rightSample of sortedRight) {
      const distance = getDistance(
        { latitude: leftSample.lat, longitude: leftSample.lon },
        { latitude: rightSample.lat, longitude: rightSample.lon }
      );

      if (distance < minDistance && distance <= maxKmPerHour * 1000) {
        minDistance = distance;
        nearestRightSample = rightSample;
      }
    }

    if (nearestRightSample) {
      // Create track ID
      const trackId = `t${leftSample.t}-${leftSample.lat.toFixed(2)}-${leftSample.lon.toFixed(2)}-${hLeft}`;
      
      // Store track samples
      if (!tracks.has(trackId)) {
        tracks.set(trackId, [leftSample]);
      }
      
      const trackSamples = tracks.get(trackId)!;
      const alreadyInTrack = trackSamples.some(s => 
        s.lat === nearestRightSample!.lat && 
        s.lon === nearestRightSample!.lon && 
        s.t === nearestRightSample!.t
      );

      if (!alreadyInTrack) {
        trackSamples.push(nearestRightSample);
      }
    }
  }

  // Build segments from tracks
  for (const [trackId, trackSamples] of tracks) {
    if (trackSamples.length < 2) continue;

    // Sort track samples by time
    const sortedTrackSamples = trackSamples.sort((a, b) => a.t.localeCompare(b.t));

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
      const lengthKm = distance / 1000; // kilometers

      // Calculate altitude change
      const dAltKm = next.altKm - current.altKm;
      const absDAltKm = Math.abs(dAltKm);

      const segmentId = `${trackId}-${i}`;

      const segment: SegmentFeature = {
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
          trackId,
          h0: hLeft,
          dAltKm,
          absDAltKm,
          lengthKm,
          speedMs
        }
      };

      segments.push(segment);

      // Calculate bounding box for spatial index
      const minLon = Math.min(current.lon, next.lon);
      const maxLon = Math.max(current.lon, next.lon);
      const minLat = Math.min(current.lat, next.lat);
      const maxLat = Math.max(current.lat, next.lat);

      indexItems.push({
        minX: minLon,
        minY: minLat,
        maxX: maxLon,
        maxY: maxLat,
        id: segmentId,
        trackId,
        pairH: hLeft
      });
    }
  }

  return { segments, indexItems };
}

self.onmessage = (e) => {
  try {
    const { left, right, hLeft, maxKmPerHour } = e.data;
    
    const result = buildPairSegments(left, right, hLeft, maxKmPerHour);
    
    self.postMessage({
      pairH: hLeft,
      segments: result.segments,
      indexItems: result.indexItems
    });
  } catch (error) {
    self.postMessage({
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

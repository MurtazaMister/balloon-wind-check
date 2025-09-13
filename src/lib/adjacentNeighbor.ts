import type { Sample } from '../types/balloon';

export type Neighbor = {
  hasNeighbor: boolean;
  fromHour: 'prev' | 'next';
  speedMs: number;      // distance / 3600
  headingDeg: number;   // gc bearing
};

// Great circle distance calculation (Haversine formula)
function greatCircleDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
}

// Great circle bearing calculation
function greatCircleBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const lat1Rad = lat1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;
  
  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - 
            Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  
  let bearing = Math.atan2(y, x) * 180 / Math.PI;
  return (bearing + 360) % 360; // Normalize to 0-360
}

export function findAdjacentVector(
  point: Sample,
  hourBuckets: Map<number, Sample[]> | { [key: number]: Sample[] },
  maxKm = 500
): Neighbor {
  const { lat, lon, h } = point;
  
  // Look in h-1 and h+1 buckets
  const prevHour = h === 0 ? 23 : h - 1;
  const nextHour = h === 23 ? 0 : h + 1;
  
  // Handle both Map and plain object
  const prevSamples = (hourBuckets instanceof Map ? hourBuckets.get(prevHour) : hourBuckets[prevHour]) || [];
  const nextSamples = (hourBuckets instanceof Map ? hourBuckets.get(nextHour) : hourBuckets[nextHour]) || [];
  
  let closestPrev: Sample | null = null;
  let closestNext: Sample | null = null;
  let minPrevDist = Infinity;
  let minNextDist = Infinity;
  
  // Find closest neighbor in previous hour
  for (const sample of prevSamples) {
    const dist = greatCircleDistance(lat, lon, sample.lat, sample.lon);
    if (dist < maxKm && dist < minPrevDist) {
      minPrevDist = dist;
      closestPrev = sample;
    }
  }
  
  // Find closest neighbor in next hour
  for (const sample of nextSamples) {
    const dist = greatCircleDistance(lat, lon, sample.lat, sample.lon);
    if (dist < maxKm && dist < minNextDist) {
      minNextDist = dist;
      closestNext = sample;
    }
  }
  
  // Determine which neighbor is closer
  if (closestPrev && closestNext) {
    if (minPrevDist <= minNextDist) {
      // Use previous hour neighbor
      const distance = minPrevDist;
      const speedMs = distance / 3.6; // Convert km/h to m/s (distance/3600*1000)
      const headingDeg = greatCircleBearing(closestPrev.lat, closestPrev.lon, lat, lon);
      
      return {
        hasNeighbor: true,
        fromHour: 'prev',
        speedMs,
        headingDeg
      };
    } else {
      // Use next hour neighbor
      const distance = minNextDist;
      const speedMs = distance / 3.6; // Convert km/h to m/s
      const headingDeg = greatCircleBearing(lat, lon, closestNext.lat, closestNext.lon);
      
      return {
        hasNeighbor: true,
        fromHour: 'next',
        speedMs,
        headingDeg
      };
    }
  } else if (closestPrev) {
    // Only previous hour neighbor available
    const distance = minPrevDist;
    const speedMs = distance / 3.6;
    const headingDeg = greatCircleBearing(closestPrev.lat, closestPrev.lon, lat, lon);
    
    return {
      hasNeighbor: true,
      fromHour: 'prev',
      speedMs,
      headingDeg
    };
  } else if (closestNext) {
    // Only next hour neighbor available
    const distance = minNextDist;
    const speedMs = distance / 3.6;
    const headingDeg = greatCircleBearing(lat, lon, closestNext.lat, closestNext.lon);
    
    return {
      hasNeighbor: true,
      fromHour: 'next',
      speedMs,
      headingDeg
    };
  }
  
  // No neighbor found
  return {
    hasNeighbor: false,
    fromHour: 'prev',
    speedMs: 0,
    headingDeg: 0
  };
}

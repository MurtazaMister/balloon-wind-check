import { nearestPressureLevel, roundHourUtc } from '../lib/levels';

type PointIn = {
  id: string; 
  lat: number; 
  lon: number; 
  altKm: number; 
  t: string; 
  h: number;
  obs_speed?: number; 
  obs_head?: number;
};

type MessageIn = { points: PointIn[] };

type MessageOut = {
  features: GeoJSON.Feature<GeoJSON.Point>[];
  stats: {
    count: number;
    med_dspeed: number;
    p90_dspeed: number;
    med_dhead: number;
    p90_dhead: number;
  };
};

// Cache for API responses
const cache = new Map<string, { u: number; v: number }>();

// Helper function to calculate smallest angle difference
function smallestAngleDiff(angle1: number, angle2: number): number {
  let diff = angle1 - angle2;
  while (diff > 180) diff -= 360;
  while (diff < -180) diff += 360;
  return diff;
}

// Helper function to calculate statistics
function calculateStats(values: number[]): { median: number; p90: number } {
  if (values.length === 0) return { median: 0, p90: 0 };
  
  const sorted = [...values].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const p90Index = Math.floor(sorted.length * 0.9);
  const p90 = sorted[p90Index];
  
  return { median, p90 };
}

// Fetch forecast data for a single point
async function fetchForecast(lat: number, lon: number, level: number, hourIso: string): Promise<{ u: number; v: number } | null> {
  const latBucket = Math.round(lat * 4) / 4; // Bucket to 0.25°
  const lonBucket = Math.round(lon * 4) / 4;
  const epochHour = Math.floor(new Date(hourIso).getTime() / 3600000);
  const cacheKey = `${latBucket}:${lonBucket}:${epochHour}:${level}`;
  
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }
  
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=wind_speed_10m,wind_direction_10m&start=${hourIso}&end=${hourIso}&timezone=UTC`;
    
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`Forecast API failed for ${lat},${lon}: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    const hourly = data.hourly;
    
    if (!hourly || !hourly.wind_speed_10m || !hourly.wind_direction_10m) {
      console.warn(`No wind data at ${lat},${lon}`);
      return null;
    }
    
    const speed = hourly.wind_speed_10m[0];
    const direction = hourly.wind_direction_10m[0];
    
    if (speed === null || direction === null) {
      console.warn(`Null wind data at ${lat},${lon}`);
      return null;
    }
    
    // Convert speed and direction to u,v components
    const directionRad = direction * Math.PI / 180;
    const u = -speed * Math.sin(directionRad); // Negative because meteorological convention
    const v = -speed * Math.cos(directionRad);
    
    const result = { u, v };
    cache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.warn(`Forecast fetch error for ${lat},${lon}:`, error);
    return null;
  }
}

// Convert u,v components to speed and heading
function uvToSpeedHeading(u: number, v: number): { speed: number; heading: number } {
  const speed = Math.sqrt(u * u + v * v);
  let heading = Math.atan2(u, v) * 180 / Math.PI;
  heading = (heading + 360) % 360; // Normalize to 0-360
  return { speed, heading };
}

// Process points with concurrency limit
async function processPoints(points: PointIn[]): Promise<MessageOut> {
  const features: GeoJSON.Feature<GeoJSON.Point>[] = [];
  const speedDiffs: number[] = [];
  const headDiffs: number[] = [];
  
  // Process points in batches of 6 to limit concurrent requests
  const batchSize = 6;
  for (let i = 0; i < points.length; i += batchSize) {
    const batch = points.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (point) => {
      const level = nearestPressureLevel(point.altKm);
      const hourIso = roundHourUtc(point.t);
      
      const forecast = await fetchForecast(point.lat, point.lon, level, hourIso);
      
      if (!forecast || point.obs_speed === undefined || point.obs_head === undefined) {
        return null;
      }
      
      const { speed: fc_speed, heading: fc_head } = uvToSpeedHeading(forecast.u, forecast.v);
      const d_speed = fc_speed - point.obs_speed;
      const d_head = smallestAngleDiff(fc_head, point.obs_head);
      
      // Collect statistics
      speedDiffs.push(Math.abs(d_speed));
      headDiffs.push(Math.abs(d_head));
      
      return {
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [point.lon, point.lat]
        },
        properties: {
          id: point.id,
          fc_speed,
          fc_head,
          level,
          obs_speed: point.obs_speed,
          obs_head: point.obs_head,
          d_speed,
          d_head,
          tHour: hourIso
        }
      } as GeoJSON.Feature<GeoJSON.Point>;
    });
    
    const batchResults = await Promise.all(batchPromises);
    const validResults = batchResults.filter((f): f is GeoJSON.Feature<GeoJSON.Point> => f !== null);
    features.push(...validResults);
  }
  
  const stats = {
    count: features.length,
    med_dspeed: calculateStats(speedDiffs).median,
    p90_dspeed: calculateStats(speedDiffs).p90,
    med_dhead: calculateStats(headDiffs).median,
    p90_dhead: calculateStats(headDiffs).p90
  };
  
  return { features, stats };
}

// Worker message handler
self.onmessage = async (event: MessageEvent<MessageIn>) => {
  try {
    const { points } = event.data;
    const result = await processPoints(points);
    self.postMessage(result);
  } catch (error) {
    console.error('Worker error:', error);
    self.postMessage({
      features: [],
      stats: { count: 0, med_dspeed: 0, p90_dspeed: 0, med_dhead: 0, p90_dhead: 0 }
    });
  }
};

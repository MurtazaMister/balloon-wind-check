import { RawTripletArray } from './guards';
import type { Sample } from '../types/balloon';

// Test function to manually fetch a single hour
export async function testFetchSingleHour(hour: number = 0): Promise<any> {
  const url = `/api/windborne/${hour.toString().padStart(2, '0')}.json`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
}

export async function fetchLast24h(): Promise<Sample[]> {
  const now = new Date();
  const promises = [];
  
  
  // Create promises for hours 0-23
  for (let h = 0; h < 24; h++) {
    const url = `/api/windborne/${h.toString().padStart(2, '0')}.json`;
    promises.push(
      fetch(url)
        .then(async (response) => {
          if (!response.ok) {
            console.warn(`Failed to fetch ${url}: HTTP ${response.status}`);
            throw new Error(`HTTP ${response.status}`);
          }
          const data = await response.json();
          return { hour: h, data };
        })
        .catch((error) => {
          console.warn(`Error fetching ${url}:`, error);
          // Check if it's a CORS error
          if (error.name === 'TypeError' && error.message.includes('CORS')) {
            console.warn(`CORS error for ${url} - this might be expected for external APIs`);
          }
          // Skip silently on failure
          return { hour: h, data: null };
        })
    );
  }

  const results = await Promise.allSettled(promises);
  const samples: Sample[] = [];
  const seen = new Set<string>();

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value.data) {
      const { hour, data } = result.value;
      
      try {
        const parsed = RawTripletArray.parse(data);
        const timestamp = new Date(now.getTime() - hour * 60 * 60 * 1000).toISOString();
        
        for (const [lat, lon, altKm] of parsed) {
          // Validate ranges
          if (
            lat >= -90 && lat <= 90 &&
            lon >= -180 && lon <= 180 &&
            altKm >= 0 && altKm <= 40 &&
            !isNaN(lat) && !isNaN(lon) && !isNaN(altKm)
          ) {
            // Create deduplication key
            const key = `${timestamp}|${lat.toFixed(5)}|${lon.toFixed(5)}|${altKm.toFixed(2)}`;
            
            if (!seen.has(key)) {
              seen.add(key);
              samples.push({
                lat,
                lon,
                altKm,
                t: timestamp,
                h: hour
              });
            }
          }
        }
      } catch {
        // Skip invalid data silently
      }
    }
  }

  // Sort by timestamp ascending
  const sortedSamples = samples.sort((a, b) => a.t.localeCompare(b.t));
  
  // Debug: Log sample distribution by hour
  const samplesByHour = new Map<number, number>();
  sortedSamples.forEach(sample => {
    samplesByHour.set(sample.h, (samplesByHour.get(sample.h) || 0) + 1);
  });
  
  // Debug: Log first few samples
  
  return sortedSamples;
}

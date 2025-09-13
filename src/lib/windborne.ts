import { RawTripletArray } from './guards';
import type { Sample } from '../types/balloon';

export async function fetchLast24h(): Promise<Sample[]> {
  const now = new Date();
  const promises = [];
  
  console.log('Starting fetchLast24h...');
  
  // Create promises for hours 0-23
  for (let h = 0; h < 24; h++) {
    const url = `/api/windborne/${h.toString().padStart(2, '0')}.json`;
    console.log(`Fetching: ${url}`);
    promises.push(
      fetch(url)
        .then(async (response) => {
          if (!response.ok) {
            console.warn(`Failed to fetch ${url}: HTTP ${response.status}`);
            throw new Error(`HTTP ${response.status}`);
          }
          const data = await response.json();
          console.log(`Successfully fetched ${url}, got ${Array.isArray(data) ? data.length : 'non-array'} items`);
          return { hour: h, data };
        })
        .catch((error) => {
          console.warn(`Error fetching ${url}:`, error);
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
  console.log(`fetchLast24h completed: ${sortedSamples.length} samples`);
  return sortedSamples;
}

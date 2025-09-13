import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useTrails } from '../state/trails';
import { buildPairSegmentsOffMain } from '../lib/segmentsWorker';
import { RawTripletArray } from '../lib/guards';
import { WINDBORNE_BASE } from '../lib/constants';
import type { Sample } from '../types/balloon';

// Fetch a single hour bucket
async function fetchHourBucket(hour: number): Promise<Sample[]> {
  const now = new Date();
  const url = `${WINDBORNE_BASE}/${hour.toString().padStart(2, '0')}.json`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    const parsed = RawTripletArray.parse(data);
    const timestamp = new Date(now.getTime() - hour * 60 * 60 * 1000).toISOString();
    
    const samples: Sample[] = [];
    const seen = new Set<string>();
    
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
    
    return samples;
  } catch (error) {
    console.warn(`Error fetching hour ${hour}:`, error);
    // Check if it's a CORS error
    if (error instanceof Error && error.name === 'TypeError' && error.message.includes('CORS')) {
      console.warn(`CORS error for hour ${hour} - this might be expected for external APIs`);
    }
    return [];
  }
}

// Hook for lazy hour bucket loading
export function useLazyHourBuckets() {
  const { 
    hourBuckets, 
    setHourBucket, 
    setPairSegments, 
    insertIndex
  } = useTrails();

  // Initial load: fetch hours 0..5 (most recent 6h)
  const initialQuery = useQuery({
    queryKey: ['hour-buckets', 'initial'],
    queryFn: async () => {
      const promises = [];
      for (let h = 0; h < 6; h++) {
        promises.push(fetchHourBucket(h));
      }
      const results = await Promise.all(promises);
      
      // Store in state
      results.forEach((samples, index) => {
        if (samples.length > 0) {
          setHourBucket(index, samples);
        }
      });
      
      return results;
    },
    staleTime: 60_000, // 1 minute
    refetchInterval: 120_000, // 2 minutes
  });

  // Background prefetch for remaining hours (6..23)
  useEffect(() => {
    const prefetchRemaining = async () => {
      const promises = [];
      for (let h = 6; h < 24; h++) {
        promises.push(fetchHourBucket(h));
      }
      
      const results = await Promise.all(promises);
      
      // Store in state as they arrive
      results.forEach((samples, index) => {
        const hour = index + 6;
        if (samples.length > 0) {
          setHourBucket(hour, samples);
        }
      });
    };

    // Start prefetch after initial load
    if (initialQuery.isSuccess) {
      prefetchRemaining();
    }
  }, [initialQuery.isSuccess, setHourBucket]);

  // Build segments when hour buckets arrive
  useEffect(() => {
    const buildSegmentsForNewBuckets = async () => {
      for (let h = 0; h < 23; h++) {
        const leftSamples = hourBuckets.get(h);
        const rightSamples = hourBuckets.get(h + 1);
        
        if (leftSamples && rightSamples && leftSamples.length > 0 && rightSamples.length > 0) {
          try {
            const result = await buildPairSegmentsOffMain({
              left: leftSamples,
              right: rightSamples,
              hLeft: h,
              maxKmPerHour: 500
            });
            
            setPairSegments(result.pairH, result.segments);
            insertIndex(result.indexItems);
          } catch (error) {
            console.warn(`Error building segments for hour pair ${h}-${h+1}:`, error);
          }
        }
      }
    };

    if (hourBuckets.size > 0) {
      buildSegmentsForNewBuckets();
    }
  }, [hourBuckets, setPairSegments, insertIndex]);

  return {
    isLoading: initialQuery.isLoading,
    error: initialQuery.error,
    hourBuckets
  };
}

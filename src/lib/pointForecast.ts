export async function getForecastForPoints(points: Array<{
  id: string; 
  lat: number; 
  lon: number; 
  altKm: number; 
  t: string; 
  h: number;
  obs_speed: number; 
  obs_head: number;
}>): Promise<{
  fc: GeoJSON.FeatureCollection<GeoJSON.Point>;
  stats: { 
    count: number; 
    med_dspeed: number; 
    p90_dspeed: number; 
    med_dhead: number; 
    p90_dhead: number 
  };
}> {
  return new Promise((resolve, reject) => {
    // Create worker instance
    const worker = new Worker(new URL('../workers/pointForecast.worker.ts', import.meta.url), {
      type: 'module'
    });
    
    worker.onmessage = (event) => {
      const { features, stats } = event.data;
      worker.terminate();
      
      resolve({
        fc: {
          type: 'FeatureCollection',
          features
        },
        stats
      });
    };
    
    worker.onerror = (error) => {
      console.error('Worker error:', error);
      worker.terminate();
      reject(error);
    };
    
    // Send points to worker
    worker.postMessage({ points });
  });
}

import { useEffect, useRef } from 'react';
import { Map } from 'maplibre-gl';
import { useUI } from '../state/ui';
import { useTrails } from '../state/trails';
import { findAdjacentVector } from '../lib/adjacentNeighbor';
import { getForecastForPoints } from '../lib/pointForecast';
import type { Sample } from '../types/balloon';

interface PointCompareLayersProps {
  map: Map;
  samples: Sample[];
  hourOffset: number;
}

export function PointCompareLayers({ map, samples, hourOffset }: PointCompareLayersProps) {
  const { selectedBalloons } = useUI();
  const { hourBuckets } = useTrails();
  const sourceAddedRef = useRef(false);
  const arrowImagesRef = useRef<{ obs: string; fc: string } | null>(null);

  // Create arrow images
  useEffect(() => {
    if (!map || arrowImagesRef.current) return;

    const createArrowImage = (color: string, name: string): string => {
      // Check if image already exists
      if (map.hasImage && map.hasImage(name)) {
        return name;
      }

      const canvas = document.createElement('canvas');
      canvas.width = 20;
      canvas.height = 20;
      const ctx = canvas.getContext('2d')!;
      
      // Draw arrow pointing up (will be rotated)
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(10, 2);  // tip
      ctx.lineTo(6, 18);  // bottom left
      ctx.lineTo(8, 18);  // bottom left inner
      ctx.lineTo(8, 14);  // shaft left
      ctx.lineTo(12, 14); // shaft right
      ctx.lineTo(12, 18); // bottom right inner
      ctx.lineTo(14, 18); // bottom right
      ctx.closePath();
      ctx.fill();
      
      // Convert canvas to ImageData for MapLibre
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      map.addImage(name, imageData);
      return name;
    };

    try {
      const obsArrow = createArrowImage('#2196F3', 'arrowObs'); // Blue
      const fcArrow = createArrowImage('#F44336', 'arrowFc');  // Red
      
      arrowImagesRef.current = { obs: obsArrow, fc: fcArrow };
    } catch (error) {
      console.warn('Error creating arrow images:', error);
    }
  }, [map]);

  // Add source and layers
  useEffect(() => {
    if (!map || sourceAddedRef.current) return;

    // Add source
    map.addSource('wind-arrows', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
      promoteId: 'id'
    });

    // Add observed arrows layer
    map.addLayer({
      id: 'obs-arrows',
      type: 'symbol',
      source: 'wind-arrows',
      layout: {
        'icon-image': 'arrowObs',
        'icon-size': 0.8,
        'icon-rotate': ['get', 'obs_head'],
        'icon-allow-overlap': true
      }
    });

    // Add forecast arrows layer
    map.addLayer({
      id: 'fc-arrows',
      type: 'symbol',
      source: 'wind-arrows',
      layout: {
        'icon-image': 'arrowFc',
        'icon-size': 0.8,
        'icon-rotate': ['get', 'fc_head'],
        'icon-offset': [0, 10],
        'icon-allow-overlap': true
      }
    });

    sourceAddedRef.current = true;

    return () => {
      if (map && typeof map.removeLayer === 'function' && typeof map.removeSource === 'function') {
        try {
          if (map.getLayer && map.getLayer('obs-arrows')) map.removeLayer('obs-arrows');
          if (map.getLayer && map.getLayer('fc-arrows')) map.removeLayer('fc-arrows');
          if (map.getSource && map.getSource('wind-arrows')) map.removeSource('wind-arrows');
          
          // Remove images if they exist
          if (map.removeImage) {
            if (map.hasImage && map.hasImage('arrowObs')) map.removeImage('arrowObs');
            if (map.hasImage && map.hasImage('arrowFc')) map.removeImage('arrowFc');
          }
        } catch (error) {
          console.warn('Map cleanup error (safe to ignore):', error);
        }
      }
      sourceAddedRef.current = false;
      arrowImagesRef.current = null;
    };
  }, [map]);

  // Update data when selection changes
  useEffect(() => {
    if (!map || !sourceAddedRef.current || selectedBalloons.size === 0) {
      // Clear the source data
      if (map && map.getSource) {
        try {
          const source = map.getSource('wind-arrows') as maplibregl.GeoJSONSource;
          if (source) {
            source.setData({ type: 'FeatureCollection', features: [] });
          }
        } catch (error) {
          console.warn('Map source access error (safe to ignore):', error);
        }
      }
      return;
    }

    const updateForecastData = async () => {
      try {
        // Use existing balloon selection system to track balloons to current hour
        const selectedSamples: Sample[] = [];
        
        // Group samples by hour for tracking
        const samplesByHour: { [key: number]: Sample[] } = {};
        for (const sample of samples) {
          if (!samplesByHour[sample.h]) {
            samplesByHour[sample.h] = [];
          }
          samplesByHour[sample.h].push(sample);
        }

        // Track each selected balloon to the current hour
        for (const trackId of selectedBalloons) {
          const match = trackId.match(/track-(\d+)-(\d+)/);
          if (!match) continue;
          
          const startHour = parseInt(match[1]);
          const startIndex = parseInt(match[2]);
          
          // Get the starting sample
          const startSamples = samplesByHour[startHour] || [];
          if (startIndex >= startSamples.length) continue;
          
          const startSample = startSamples[startIndex];
          let currentSample = startSample;
          
          // Track this balloon up to the current hourOffset
          for (let h = startHour + 1; h <= hourOffset; h++) {
            const nextHourSamples = samplesByHour[h] || [];
            if (nextHourSamples.length === 0) break;
            
            let closestSample: Sample | null = null;
            let minDistance = Infinity;
            
            for (const nextSample of nextHourSamples) {
              const latDiff = nextSample.lat - currentSample.lat;
              const lonDiff = nextSample.lon - currentSample.lon;
              const distance = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff);
              
              if (distance < minDistance && distance < 5.0) {
                minDistance = distance;
                closestSample = nextSample;
              }
            }
            
            if (closestSample) {
              currentSample = closestSample;
            } else {
              break; // Can't track further
            }
          }
          
          selectedSamples.push(currentSample);
        }

        const pointsWithObserved = selectedSamples
          .map(sample => {
            const neighbor = findAdjacentVector(sample, samplesByHour);
            if (!neighbor.hasNeighbor) {
              return null;
            }
            
            return {
              id: `${sample.lat},${sample.lon},${sample.h}`,
              lat: sample.lat,
              lon: sample.lon,
              altKm: sample.altKm,
              t: sample.t,
              h: sample.h,
              obs_speed: neighbor.speedMs,
              obs_head: neighbor.headingDeg
            };
          })
          .filter((point): point is NonNullable<typeof point> => point !== null);


        if (pointsWithObserved.length === 0) {
          if (map && map.getSource) {
            try {
              const source = map.getSource('wind-arrows') as maplibregl.GeoJSONSource;
              if (source) {
                source.setData({ type: 'FeatureCollection', features: [] });
              }
            } catch (error) {
              console.warn('Map source access error (safe to ignore):', error);
            }
          }
          return;
        }

        // Limit to 100 points
        const limitedPoints = pointsWithObserved.slice(0, 100);
        
        // Get forecast data
        const { fc } = await getForecastForPoints(limitedPoints);
        
        // Update map source
        if (map && map.getSource) {
          try {
            const source = map.getSource('wind-arrows') as maplibregl.GeoJSONSource;
            if (source) {
              source.setData(fc);
            }
          } catch (error) {
            console.warn('Map source access error (safe to ignore):', error);
          }
        }
      } catch (error) {
        console.error('Error updating forecast data:', error);
      }
    };

    updateForecastData();
  }, [map, selectedBalloons, samples, hourBuckets, hourOffset]);

  return null; // This component only manages map layers
}

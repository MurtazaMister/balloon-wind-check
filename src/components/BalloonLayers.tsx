import { useEffect, useMemo, useState } from 'react';
import maplibregl, { Map as MapLibreMap } from 'maplibre-gl';
import { useUI } from '../state/ui';
import { useSelection } from '../state/selection';
import type { Sample } from '../types/balloon';

type Props = {
  map: MapLibreMap;
  samples: Sample[];        // all 24h (for points only)
  hourOffset: number;       // which hour to display as "current"
};

export function BalloonLayers({ map, samples, hourOffset }: Props) {
  const { 
    enabledColors,
    isPlaying,
    selectedBalloons,
    viewMode,
    addSelectedBalloon,
    removeSelectedBalloon,
    setViewMode
  } = useUI();

  const { togglePoint } = useSelection();
  
  // Tooltip state
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    content: string;
  }>({ visible: false, x: 0, y: 0, content: '' });
  
  
  // Debug: Log sample distribution by hour
  const samplesByHour = new Map<number, number>();
  samples.forEach(sample => {
    samplesByHour.set(sample.h, (samplesByHour.get(sample.h) || 0) + 1);
  });

  // Auto-switch to selected view when playing and there are selected points
  useEffect(() => {
    if (isPlaying && selectedBalloons.size > 0 && viewMode === 'all') {
      setViewMode('selected');
    }
  }, [isPlaying, selectedBalloons.size, viewMode, setViewMode]);

  // Build points data filtered by current hour offset and enabled colors
  const pointsData = useMemo(() => {
    const pointFeatures: GeoJSON.Feature<GeoJSON.Point>[] = [];
    
    if (viewMode === 'selected') {
      // Show only current timestep points for selected balloons during playback
      // or show trajectory trail when paused
      for (const trackId of selectedBalloons) {
        const match = trackId.match(/track-(\d+)-(\d+)/);
        if (!match) continue;
        
        const startHour = parseInt(match[1]);
        const startIndex = parseInt(match[2]);
        
        // Group samples by hour
        const samplesByHour = new Map<number, Sample[]>();
        for (const sample of samples) {
          if (!samplesByHour.has(sample.h)) {
            samplesByHour.set(sample.h, []);
          }
          samplesByHour.get(sample.h)!.push(sample);
        }
        
        // Get the starting sample
        const startSamples = samplesByHour.get(startHour) || [];
        if (startIndex >= startSamples.length) continue;
        
        const startSample = startSamples[startIndex];
        
        if (isPlaying) {
          // During playback: show only the current timestep point
          // Find the balloon's position at the current hourOffset
          let currentSample = startSample;
          
          // Track this balloon up to the current hourOffset
          for (let h = startHour + 1; h <= hourOffset; h++) {
            const nextHourSamples = samplesByHour.get(h) || [];
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
              break;
            }
          }
          
          // Only show the current timestep point
          const altitude = currentSample.altKm;
          if (altitude < 5 && !enabledColors.has('green')) continue;
          if (altitude >= 5 && altitude < 10 && !enabledColors.has('blue')) continue;
          if (altitude >= 10 && altitude < 20 && !enabledColors.has('orange')) continue;
          if (altitude >= 20 && !enabledColors.has('red')) continue;
          
          pointFeatures.push({
            type: 'Feature' as const,
            geometry: {
              type: 'Point' as const,
              coordinates: [currentSample.lon, currentSample.lat]
            },
            properties: {
            altitude: currentSample.altKm,
            timestamp: currentSample.t,
            h: currentSample.h,
            trackId: trackId,
            isSelected: true,
            isTrajectory: false, // During playback, show selected balloons at normal size
            isPaused: !isPlaying
          }
          });
        } else {
          // When paused: show trajectory trail up to current hourOffset
          const trajectory: Sample[] = [startSample];
          let currentSample = startSample;
          
          for (let h = startHour + 1; h <= hourOffset; h++) {
            const nextHourSamples = samplesByHour.get(h) || [];
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
              trajectory.push(closestSample);
              currentSample = closestSample;
            } else {
              break;
            }
          }
          
          // Add trajectory trail points
          for (const sample of trajectory) {
            const altitude = sample.altKm;
            if (altitude < 5 && !enabledColors.has('green')) continue;
            if (altitude >= 5 && altitude < 10 && !enabledColors.has('blue')) continue;
            if (altitude >= 10 && altitude < 20 && !enabledColors.has('orange')) continue;
            if (altitude >= 20 && !enabledColors.has('red')) continue;
            
            pointFeatures.push({
              type: 'Feature' as const,
              geometry: {
                type: 'Point' as const,
                coordinates: [sample.lon, sample.lat]
              },
              properties: {
                altitude: sample.altKm,
                timestamp: sample.t,
                h: sample.h,
                trackId: trackId,
                isSelected: true,
                isTrajectory: true,
                isPaused: !isPlaying
              }
            });
          }
        }
      }
    } else {
      // Show all balloons for current hour + any selected balloons from other hours
      const currentHourSamples = samples.filter(sample => {
        if (sample.h !== hourOffset) return false;
        
        // Filter by enabled colors based on altitude
        const altitude = sample.altKm;
        if (altitude < 5 && !enabledColors.has('green')) return false;
        if (altitude >= 5 && altitude < 10 && !enabledColors.has('blue')) return false;
        if (altitude >= 10 && altitude < 20 && !enabledColors.has('orange')) return false;
        if (altitude >= 20 && !enabledColors.has('red')) return false;
        
        return true;
      });
      
      
      // Debug: Log altitude distribution
      const altitudeCounts = { green: 0, blue: 0, orange: 0, red: 0 };
      currentHourSamples.forEach(sample => {
        if (sample.altKm < 5) altitudeCounts.green++;
        else if (sample.altKm < 10) altitudeCounts.blue++;
        else if (sample.altKm < 20) altitudeCounts.orange++;
        else altitudeCounts.red++;
      });
      
      // Process current hour samples
      const pointFeaturesForCurrentHour: GeoJSON.Feature<GeoJSON.Point>[] = currentHourSamples.map((sample, index) => {
        const trackId = `track-${sample.h}-${index}`;
        const isSelected = selectedBalloons.has(trackId);
        
        return {
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
            coordinates: [sample.lon, sample.lat]
          },
          properties: {
            altitude: sample.altKm,
            timestamp: sample.t,
            h: sample.h,
            trackId,
            isSelected,
            isTrajectory: false,
            isPaused: !isPlaying
          }
        };
      });
      
      // Process selected balloons - track them to current timestep
      const pointFeaturesForSelectedBalloons: GeoJSON.Feature<GeoJSON.Point>[] = [];
      for (const trackId of selectedBalloons) {
        const match = trackId.match(/track-(\d+)-(\d+)/);
        if (!match) continue;
        
        const startHour = parseInt(match[1]);
        const startIndex = parseInt(match[2]);
        
        // Skip if this is already from the current hour (will be handled above)
        if (startHour === hourOffset) continue;
        
        // Group samples by hour
        const samplesByHour = new Map<number, Sample[]>();
        for (const sample of samples) {
          if (!samplesByHour.has(sample.h)) {
            samplesByHour.set(sample.h, []);
          }
          samplesByHour.get(sample.h)!.push(sample);
        }
        
        // Get the starting sample
        const startSamples = samplesByHour.get(startHour) || [];
        if (startIndex >= startSamples.length) continue;
        
        const startSample = startSamples[startIndex];
        
        // Track this balloon to the current hourOffset
        let currentSample = startSample;
        
        for (let h = startHour + 1; h <= hourOffset; h++) {
          const nextHourSamples = samplesByHour.get(h) || [];
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
            break;
          }
        }
        
        // Apply color filtering
        const altitude = currentSample.altKm;
        if (altitude < 5 && !enabledColors.has('green')) continue;
        if (altitude >= 5 && altitude < 10 && !enabledColors.has('blue')) continue;
        if (altitude >= 10 && altitude < 20 && !enabledColors.has('orange')) continue;
        if (altitude >= 20 && !enabledColors.has('red')) continue;
        
        pointFeaturesForSelectedBalloons.push({
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
            coordinates: [currentSample.lon, currentSample.lat]
          },
          properties: {
            altitude: currentSample.altKm,
            timestamp: currentSample.t,
            h: currentSample.h,
            trackId, // Use the original trackId from selectedBalloons
            isSelected: true, // Always selected since these are from selectedBalloons
            isTrajectory: false,
            isPaused: !isPlaying
          }
        });
      }
      
      pointFeatures.push(...pointFeaturesForCurrentHour);
      pointFeatures.push(...pointFeaturesForSelectedBalloons);
    }

    return {
      type: 'FeatureCollection',
      features: pointFeatures
    } as GeoJSON.FeatureCollection<GeoJSON.Point>;
  }, [samples, hourOffset, enabledColors, selectedBalloons, viewMode, isPlaying]);

  // Build trajectory segments for selected balloons - only when needed
  const trajectoryData = useMemo(() => {
    if (selectedBalloons.size === 0) {
      return {
        type: 'FeatureCollection',
        features: []
      } as GeoJSON.FeatureCollection<GeoJSON.LineString>;
    }

    const features: GeoJSON.Feature<GeoJSON.LineString>[] = [];
    
    // For now, let's keep it simple and not build complex trajectories
    // This will be implemented later when the basic point display works
    
    return {
      type: 'FeatureCollection',
      features
    } as GeoJSON.FeatureCollection<GeoJSON.LineString>;
  }, [selectedBalloons]);

  useEffect(() => {
    if (!map.isStyleLoaded()) {
      return;
    }

    // Add points source and layer
    if (!map.getSource('points-source')) {
      map.addSource('points-source', {
        type: 'geojson',
        data: pointsData,
        promoteId: 'id'
      });

      map.addLayer({
        id: 'points-layer',
        type: 'circle',
        source: 'points-source',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, [
              'case',
              ['get', 'isTrajectory'], 2,  // Smaller radius for trajectory points
              3
            ],
            20, [
              'case',
              ['get', 'isTrajectory'], 2,  // Smaller radius for trajectory points
              5
            ]
          ],
          'circle-color': [
            'case',
            ['<', ['get', 'altitude'], 5], '#4CAF50',    // 0-5km: Green
            ['<', ['get', 'altitude'], 10], '#2196F3',   // 5-10km: Blue
            ['<', ['get', 'altitude'], 20], '#FF9800',   // 10-20km: Orange
            '#F44336'                                     // >20km: Red
          ],
          'circle-opacity': [
            'case',
            ['get', 'isTrajectory'], 0.6,  // More transparent for trajectory points
            0.8
          ],
          'circle-stroke-width': [
            'case',
            ['all', ['get', 'isSelected'], ['get', 'isPaused']], 1.5,  // Show border only when selected AND paused
            1
          ],
          'circle-stroke-color': [
            'case',
            ['all', ['get', 'isSelected'], ['get', 'isPaused']], '#000000',  // Black stroke for selected points when paused
            '#ffffff'  // White stroke for unselected points or when playing
          ]
        }
      });
    } else {
      (map.getSource('points-source') as maplibregl.GeoJSONSource).setData(pointsData);
    }

    // Add trajectory source and layer
    if (!map.getSource('trajectory-source')) {
      map.addSource('trajectory-source', {
        type: 'geojson',
        data: trajectoryData,
        promoteId: 'id'
      });

      map.addLayer({
        id: 'trajectory-layer',
        type: 'line',
        source: 'trajectory-source',
        paint: {
          'line-width': 2,
          'line-color': '#000000',
          'line-opacity': 0.8
        }
      });
    } else {
      (map.getSource('trajectory-source') as maplibregl.GeoJSONSource).setData(trajectoryData);
    }

    // Optimized hover handler for tooltips only
    const handleMouseMove = (e: maplibregl.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: ['points-layer']
      });

      if (features.length > 0) {
        const feature = features[0];
        
        // Show tooltip for points only when not playing
        if (feature.layer.id === 'points-layer' && !isPlaying) {
          const lat = feature.properties?.altitude ? 
            (feature.geometry as any).coordinates[1] : null;
          const lon = feature.properties?.altitude ? 
            (feature.geometry as any).coordinates[0] : null;
          const alt = feature.properties?.altitude;
          
          if (lat !== null && lon !== null && alt !== null) {
            setTooltip({
              visible: true,
              x: e.point.x,
              y: e.point.y,
              content: `[${lat.toFixed(4)}, ${lon.toFixed(4)}, ${alt.toFixed(2)}km]`
            });
          }
        } else {
          setTooltip({ visible: false, x: 0, y: 0, content: '' });
        }
      } else {
        setTooltip({ visible: false, x: 0, y: 0, content: '' });
      }
    };

    const handleMouseLeave = () => {
      setTooltip({ visible: false, x: 0, y: 0, content: '' });
    };

    map.on('mousemove', 'points-layer', handleMouseMove);
    map.on('mouseleave', 'points-layer', handleMouseLeave);

    // Change cursor on hover
    const handleMouseEnter = () => {
      map.getCanvas().style.cursor = 'pointer';
    };
    const handleMouseLeaveCursor = () => {
      map.getCanvas().style.cursor = '';
    };

    map.on('mouseenter', 'points-layer', handleMouseEnter);
    map.on('mouseleave', 'points-layer', handleMouseLeaveCursor);

    // Click handler for balloon track selection and point selection (only when not playing)
    const handleClick = (e: maplibregl.MapMouseEvent) => {
      if (isPlaying) return; // Don't allow selection during playback
      
      const features = map.queryRenderedFeatures(e.point, {
        layers: ['points-layer']
      });

      if (features.length > 0) {
        const feature = features[0];
        const trackId = feature.properties?.trackId;
        const lat = feature.properties?.lat;
        const lon = feature.properties?.lon;
        const h = feature.properties?.h;
        
        // Handle balloon track selection (existing functionality)
        if (trackId) {
          if (selectedBalloons.has(trackId)) {
            removeSelectedBalloon(trackId);
          } else {
            addSelectedBalloon(trackId);
          }
        }
        
        // Handle point selection for wind comparison (new functionality)
        if (lat !== undefined && lon !== undefined && h !== undefined) {
          const pointId = `${lat},${lon},${h}`;
          togglePoint(pointId);
        }
      }
    };

    map.on('click', 'points-layer', handleClick);

    return () => {
      // Clean up event listeners
      if (map && typeof map.off === 'function') {
        map.off('mousemove', 'points-layer', handleMouseMove);
        map.off('mouseleave', 'points-layer', handleMouseLeave);
        map.off('mouseenter', 'points-layer', handleMouseEnter);
        map.off('mouseleave', 'points-layer', handleMouseLeaveCursor);
        map.off('click', 'points-layer', handleClick);

        // Clean up layers and sources
        try {
          if (map.getLayer && map.getLayer('points-layer')) {
            map.removeLayer('points-layer');
          }
          if (map.getSource && map.getSource('points-source')) {
            map.removeSource('points-source');
          }
          if (map.getLayer && map.getLayer('trajectory-layer')) {
            map.removeLayer('trajectory-layer');
          }
          if (map.getSource && map.getSource('trajectory-source')) {
            map.removeSource('trajectory-source');
          }
        } catch (error) {
          // Silently ignore cleanup errors during unmount
          console.warn('Map cleanup error (safe to ignore):', error);
        }
      }
    };
  }, [map, pointsData, trajectoryData, isPlaying, selectedBalloons, addSelectedBalloon, removeSelectedBalloon, togglePoint]);

  // Update points layer visibility
  useEffect(() => {
    if (!map || !map.getLayer || !map.getLayer('points-layer')) return;

    // Always show points layer (filtering is done at data level)
    map.setLayoutProperty('points-layer', 'visibility', 'visible');
  }, [map, hourOffset, enabledColors]);

  // Hide tooltip when animation starts playing
  useEffect(() => {
    if (isPlaying) {
      setTooltip({ visible: false, x: 0, y: 0, content: '' });
    }
  }, [isPlaying]);

  return (
    <>
      {/* Tooltip */}
      {tooltip.visible && (
        <div
          style={{
            position: 'absolute',
            left: tooltip.x + 10,
            top: tooltip.y - 10,
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontFamily: 'monospace',
            pointerEvents: 'none',
            zIndex: 1000,
            whiteSpace: 'nowrap'
          }}
        >
          {tooltip.content}
        </div>
      )}
    </>
  );
}
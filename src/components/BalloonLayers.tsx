import { useEffect, useMemo, useState } from 'react';
import maplibregl, { Map as MapLibreMap } from 'maplibre-gl';
import { useUI } from '../state/ui';
import type { Sample } from '../types/balloon';

type Props = {
  map: MapLibreMap;
  samples: Sample[];        // all 24h (for points only)
  hourOffset: number;       // which hour to display as "current"
};

export function BalloonLayers({ map, samples, hourOffset }: Props) {
  const { 
    showPoints, 
    isPlaying
  } = useUI();
  
  // Tooltip state
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    content: string;
  }>({ visible: false, x: 0, y: 0, content: '' });
  
  console.log(`BalloonLayers: received ${samples.length} samples, hourOffset: ${hourOffset}`);

  // Build points data filtered by current hour offset
  const pointsData = useMemo(() => {
    // Filter samples by current hour offset
    const filteredSamples = samples.filter(sample => sample.h === hourOffset);
    
    const pointFeatures: GeoJSON.Feature<GeoJSON.Point>[] = filteredSamples.map((sample, index) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [sample.lon, sample.lat]
      },
      properties: {
        altitude: sample.altKm,
        timestamp: sample.t,
        h: sample.h,
        trackId: `track-${sample.h}-${index}` // Simple track ID for points
      }
    }));

    return {
      type: 'FeatureCollection',
      features: pointFeatures
    } as GeoJSON.FeatureCollection<GeoJSON.Point>;
  }, [samples, hourOffset]);

  useEffect(() => {
    if (!map.isStyleLoaded()) return;

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
            0, 3,
            20, 5
          ],
          'circle-color': [
            'case',
            ['<', ['get', 'altitude'], 5], '#4CAF50',    // 0-5km: Green
            ['<', ['get', 'altitude'], 10], '#2196F3',   // 5-10km: Blue
            ['<', ['get', 'altitude'], 20], '#FF9800',   // 10-20km: Orange
            '#F44336'                                     // >20km: Red
          ],
          'circle-opacity': 0.8,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#ffffff'
        }
      });
    } else {
      (map.getSource('points-source') as maplibregl.GeoJSONSource).setData(pointsData);
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

    return () => {
      // Clean up event listeners
      map.off('mousemove', 'points-layer', handleMouseMove);
      map.off('mouseleave', 'points-layer', handleMouseLeave);
      map.off('mouseenter', 'points-layer', handleMouseEnter);
      map.off('mouseleave', 'points-layer', handleMouseLeaveCursor);

      // Clean up layers and sources
      if (map.getLayer('points-layer')) {
        map.removeLayer('points-layer');
      }
      if (map.getSource('points-source')) {
        map.removeSource('points-source');
      }
    };
  }, [map, pointsData, isPlaying]);

  // Update points layer visibility
  useEffect(() => {
    if (!map.getLayer('points-layer')) return;

    if (!showPoints) {
      // Hide points layer
      map.setLayoutProperty('points-layer', 'visibility', 'none');
    } else {
      // Show points layer
      map.setLayoutProperty('points-layer', 'visibility', 'visible');
    }
  }, [map, showPoints, hourOffset]);

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
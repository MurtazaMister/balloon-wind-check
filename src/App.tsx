import { useEffect, useRef, useState } from 'react';
import maplibregl, { Map } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MAP_STYLE_URL } from './mapStyle';
import { useBalloons } from './hooks/useBalloons';
import { useUI } from './state/ui';
import { BalloonLayers } from './components/BalloonLayers';
import { Controls } from './components/Controls';
import { InfoBadge } from './components/InfoBadge';
import { Legend } from './components/Legend';

const hasWebGL = () => {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl') || c.getContext('experimental-webgl'));
  } catch {
    return false;
  }
};

function App() {
  const mapRef = useRef<Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const hourOffsetRef = useRef(0);
  
  const { data: samples } = useBalloons();
  const { hourOffset, isPlaying, playbackFps, setHourOffset } = useUI();

  // Keep ref in sync with state
  useEffect(() => {
    hourOffsetRef.current = hourOffset;
  }, [hourOffset]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    if (!hasWebGL()) {
      console.error('WebGL not available in this browser/device.');
      return;
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE_URL,
      center: [0, 20],
      zoom: 1.6,
      attributionControl: false, // ok (boolean is allowed)
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.addControl(new maplibregl.AttributionControl(), 'bottom-right');

    map.on('load', () => {
      console.log('Map loaded');
      setMapLoaded(true);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      setMapLoaded(false);
    };
  }, []);

  // Playback effect
  useEffect(() => {
    if (!isPlaying) return;

    const intervalMs = (1000 / playbackFps) * 0.5; // 500ms for 2fps
    const intervalId = setInterval(() => {
      const nextHour = (hourOffsetRef.current + 1) % 24;
      setHourOffset(nextHour);
    }, intervalMs);

    return () => clearInterval(intervalId);
  }, [isPlaying, playbackFps, setHourOffset]);

  return (
    <div style={{ height: '100vh', width: '100vw', position: 'relative' }}>
      <div ref={containerRef} style={{ height: '100%', width: '100%' }} />
      
      {/* Controls */}
      <Controls />
      
      {/* Info Badge */}
      <InfoBadge />

      {/* Legend */}
      <Legend />

      {/* Balloon layers */}
      {mapLoaded && mapRef.current && samples && (
        <BalloonLayers 
          map={mapRef.current} 
          samples={samples} 
          hourOffset={hourOffset} 
        />
      )}
    </div>
  );
}

export default App;

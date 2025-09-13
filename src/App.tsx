import { useEffect, useRef } from "react";
import maplibregl, { Map } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MAP_STYLE_URL } from "./mapStyle";

function App() {
  const mapRef = useRef<Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (containerRef.current && !mapRef.current) {
      const map = new maplibregl.Map({
        container: containerRef.current,
        style: MAP_STYLE_URL,
        center: [0, 20],
        zoom: 1.6,
        attributionControl: false, // disable built-in
      });
      map.addControl(new maplibregl.AttributionControl(), "bottom-right");
      mapRef.current = map;
    }
    return () => mapRef.current?.remove();
  }, []);

  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      <div ref={containerRef} style={{ height: "100%", width: "100%" }} />
    </div>
  );
}

export default App;

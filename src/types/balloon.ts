export type RawPoint = [number, number, number]; // [lat, lon, alt_km]

export interface BalloonPoint {
  lat: number;
  lon: number;
  altKm: number;
  t: string; // ISO
}

export interface BalloonVector {
  speedMs: number;
  bearingDeg: number;
}

export interface BalloonSample extends BalloonPoint {
  observed?: BalloonVector;    // from track segment
  forecast?: BalloonVector;    // from external API
  delta?: { speedMs: number; bearingDiffDeg: number };
}

export type BalloonTrack = BalloonSample[];

// Use proxy path in production to avoid CORS issues
export const WINDBORNE_BASE = "/api/windborne";
export const HOURS_BACK = 24;
export const MAX_REASONABLE_MS = 120; // drop segments faster than 120 m/s
export const PRESSURE_LEVELS = [850, 700, 500, 300, 250, 200] as const; // hPa

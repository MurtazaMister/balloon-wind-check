export function nearestPressureLevel(altKm: number): 850|700|500|300|250|200 {
  if (altKm < 3) return 850;
  if (altKm < 6) return 700;
  if (altKm < 9) return 500;
  if (altKm < 12) return 300;
  if (altKm < 15) return 250;
  return 200;
}

export function roundHourUtc(iso: string): string {
  const date = new Date(iso);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hour = String(date.getUTCHours()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hour}:00:00Z`;
}

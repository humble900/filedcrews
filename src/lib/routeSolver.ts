export interface RouteStop {
  id: string;
  latitude: number;
  longitude: number;
  scheduled_start?: string;
}

// Calculate distance between two points in kilometers
export function getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Heuristic route optimization (Nearest Neighbor algorithm)
export function optimizeRoute(stops: RouteStop[]): RouteStop[] {
  if (stops.length <= 1) return stops;

  const result: RouteStop[] = [];
  const unvisited = [...stops];

  // Pick first stop as initial point
  let current = unvisited.splice(0, 1)[0];
  result.push(current);

  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let minDistance = getHaversineDistance(
      current.latitude,
      current.longitude,
      unvisited[0].latitude,
      unvisited[0].longitude
    );

    for (let i = 1; i < unvisited.length; i++) {
      const distance = getHaversineDistance(
        current.latitude,
        current.longitude,
        unvisited[i].latitude,
        unvisited[i].longitude
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearestIndex = i;
      }
    }

    current = unvisited.splice(nearestIndex, 1)[0];
    result.push(current);
  }

  return result;
}

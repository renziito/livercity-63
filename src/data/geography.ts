export const LIVERPOOL_BOUNDS = {
  west: -3.02,
  east: -2.85,
  south: 53.355,
  north: 53.445
} as const;

export const WORLD_SIZE = { width: 260, depth: 230 } as const;

export type GeoPoint = { lat: number; lon: number };
export type WorldPoint = { x: number; z: number };

export function geoToWorld(point: GeoPoint): WorldPoint {
  return {
    x: ((point.lon - LIVERPOOL_BOUNDS.west) / (LIVERPOOL_BOUNDS.east - LIVERPOOL_BOUNDS.west)) * WORLD_SIZE.width - WORLD_SIZE.width / 2,
    z: ((LIVERPOOL_BOUNDS.north - point.lat) / (LIVERPOOL_BOUNDS.north - LIVERPOOL_BOUNDS.south)) * WORLD_SIZE.depth - WORLD_SIZE.depth / 2
  };
}

export function worldToMapPercent(point: { x: number; z: number }) {
  return {
    x: ((point.x + WORLD_SIZE.width / 2) / WORLD_SIZE.width) * 100,
    y: ((point.z + WORLD_SIZE.depth / 2) / WORLD_SIZE.depth) * 100
  };
}

export const LIVERPOOL_SATELLITE_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=-3.02,53.355,-2.85,53.445&bboxSR=4326&imageSR=4326&size=2048,1812&format=jpg&f=image';

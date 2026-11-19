import { mkdir, readFile, writeFile } from 'node:fs/promises';

const bounds = { south: 53.355, west: -3.02, north: 53.445, east: -2.85 };
const inside = ([lon, lat]) =>
  lon >= bounds.west && lon <= bounds.east && lat >= bounds.south && lat <= bounds.north;

const source = JSON.parse(await readFile('tmp/liverpool.geojson', 'utf8'));
if (!Array.isArray(source.features)) throw new Error('Osmium did not produce a GeoJSON FeatureCollection.');

const roads = [];
const buildings = [];
let nextId = 1;

function addRoad(tags, coordinates) {
  if (coordinates.length < 2 || !coordinates.some(inside)) return;
  roads.push({ id: nextId++, tags, coordinates });
}

function addBuilding(tags, coordinates) {
  if (coordinates.length < 4 || !coordinates.some(inside)) return;
  const first = coordinates[0];
  const last = coordinates[coordinates.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) return;
  buildings.push({ id: nextId++, tags, coordinates });
}

for (const feature of source.features) {
  const properties = feature.properties ?? {};
  const tags = properties.tags ?? properties;
  const geometry = feature.geometry;
  if (!geometry || !tags) continue;

  if (tags.highway) {
    if (geometry.type === 'LineString') addRoad(tags, geometry.coordinates);
    if (geometry.type === 'MultiLineString') {
      for (const line of geometry.coordinates) addRoad(tags, line);
    }
    continue;
  }

  if (!tags.building) continue;
  if (geometry.type === 'Polygon') addBuilding(tags, geometry.coordinates[0] ?? []);
  if (geometry.type === 'MultiPolygon') {
    for (const polygon of geometry.coordinates) addBuilding(tags, polygon[0] ?? []);
  }
}

if (!roads.length || !buildings.length) {
  throw new Error('The Merseyside extract did not contain both Liverpool roads and building footprints.');
}

const output = {
  source: 'OpenStreetMap contributors via Geofabrik Merseyside extract',
  license: 'ODbL-1.0',
  retrievedAt: new Date().toISOString(),
  bounds,
  roads,
  buildings
};

await mkdir('public/data', { recursive: true });
await writeFile('public/data/liverpool-osm.json', JSON.stringify(output));
console.log(`Prepared ${roads.length} road segments and ${buildings.length} building footprints from Merseyside.`);

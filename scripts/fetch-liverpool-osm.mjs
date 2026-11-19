import { mkdir, writeFile } from 'node:fs/promises';

const bounds = { south: 53.355, west: -3.02, north: 53.445, east: -2.85 };
const query = `[out:json][timeout:240];
(
  way["highway"~"^(motorway|trunk|primary|secondary|tertiary|residential|unclassified|living_street|service|pedestrian|footway|path|cycleway|steps)$"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
  way["building"](53.395,-3.006,53.414,-2.975);
  way["building"](53.366,-2.910,53.390,-2.855);
  way["building"](53.378,-2.940,53.398,-2.900);
  way["building"](53.422,-2.930,53.443,-2.890);
);
out body geom;`;

const endpoints = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.nchc.org.tw/api/interpreter'
];

let payload;
let lastError;
for (const endpoint of endpoints) {
  for (let attempt = 1; attempt <= 1; attempt++) {
    try {
      console.log('Requesting Liverpool OSM geometry from', endpoint, 'attempt', attempt);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'user-agent': 'LiverCity/0.1 (https://github.com/renziito/livercity-63)'
        },
        body: 'data=' + encodeURIComponent(query),
        signal: AbortSignal.timeout(90000)
      });
      if (!response.ok) throw new Error('Overpass HTTP ' + response.status);
      payload = await response.json();
      if (!Array.isArray(payload.elements)) throw new Error('Unexpected Overpass response');
      break;
    } catch (error) {
      lastError = error;
      console.warn(String(error));
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }
  if (payload) break;
}

if (!payload) {
  throw new Error('Could not download Liverpool OpenStreetMap data: ' + String(lastError));
}

const roads = [];
const buildings = [];
for (const element of payload.elements) {
  if (element.type !== 'way' || !Array.isArray(element.geometry)) continue;
  const coordinates = element.geometry
    .filter(point => Number.isFinite(point.lat) && Number.isFinite(point.lon))
    .map(point => [point.lon, point.lat]);
  if (element.tags?.highway && coordinates.length >= 2) {
    roads.push({ id: element.id, tags: element.tags, coordinates });
  } else if (element.tags?.building && coordinates.length >= 4) {
    const first = coordinates[0];
    const last = coordinates[coordinates.length - 1];
    if (first[0] === last[0] && first[1] === last[1]) {
      buildings.push({ id: element.id, tags: element.tags, coordinates });
    }
  }
}

const output = {
  source: 'OpenStreetMap contributors',
  license: 'ODbL-1.0',
  retrievedAt: new Date().toISOString(),
  bounds,
  roads,
  buildings
};

await mkdir('public/data', { recursive: true });
await writeFile('public/data/liverpool-osm.json', JSON.stringify(output));
console.log(`Saved ${roads.length} roads and ${buildings.length} building footprints.`);

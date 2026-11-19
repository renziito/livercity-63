import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { gameVariables } from '../data/variables';
import { LIVERPOOL_LOCATIONS } from '../data/locations';
import { LIVERPOOL_SATELLITE_URL, WORLD_SIZE, geoToWorld } from '../data/geography';
import type { WalkableSegment } from './navigation';

type OSMWay = {
  id: number;
  tags: Record<string, string>;
  coordinates: [number, number][];
};
type OSMData = {
  source: string;
  license: string;
  roads: OSMWay[];
  buildings: OSMWay[];
};

const brickPalette = ['#985b48', '#a36550', '#875344', '#b4775b', '#795044', '#a96c55'];
const material = (color: string, roughness = 0.9) =>
  new THREE.MeshStandardMaterial({ color, roughness, flatShading: true });

function addBox(parent: THREE.Group, x: number, y: number, z: number, w: number, h: number, d: number, color: string) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material(color));
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function roadWidth(tags: Record<string, string>) {
  const type = tags.highway;
  const explicit = Number.parseFloat(tags.width ?? '');
  if (Number.isFinite(explicit) && explicit >= 1.5 && explicit <= 40) return explicit;
  const lanes = Number.parseInt(tags.lanes ?? '', 10);
  if (Number.isFinite(lanes) && lanes > 0 && lanes <= 8) return Math.max(3.2, lanes * 3.15);
  const widths: Record<string, number> = {
    motorway: 14, trunk: 12, primary: 10, secondary: 8.5, tertiary: 7,
    residential: 6, unclassified: 5.5, living_street: 4.5, service: 4,
    pedestrian: 4, footway: 2, path: 1.6, cycleway: 2.4, steps: 1.8
  };
  return widths[type] ?? 5;
}

function createRibbonGeometry(ways: OSMWay[], sidewalks: boolean) {
  const positions: number[] = [];
  const indices: number[] = [];
  let vertex = 0;

  for (const way of ways) {
    const coords = way.coordinates.map(([lon, lat]) => geoToWorld({ lon, lat }));
    const width = roadWidth(way.tags) + (sidewalks ? 2.8 : 0);
    const half = width / 2;

    for (let i = 0; i < coords.length - 1; i++) {
      const a = coords[i], b = coords[i + 1];
      const dx = b.x - a.x, dz = b.z - a.z;
      const length = Math.hypot(dx, dz);
      if (length < 0.6) continue;
      const px = -dz / length * half;
      const pz = dx / length * half;
      const y = sidewalks ? 0.035 : 0.065;

      positions.push(
        a.x + px, y, a.z + pz,
        a.x - px, y, a.z - pz,
        b.x - px, y, b.z - pz,
        b.x + px, y, b.z + pz
      );
      indices.push(vertex, vertex + 2, vertex + 1, vertex, vertex + 3, vertex + 2);
      vertex += 4;
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createSidewalkGeometry(ways: OSMWay[]) {
  const positions: number[] = [];
  const indices: number[] = [];
  let vertex = 0;

  for (const way of ways) {
    if (!['primary', 'secondary', 'tertiary', 'residential', 'unclassified', 'living_street'].includes(way.tags.highway)) continue;
    const coords = way.coordinates.map(([lon, lat]) => geoToWorld({ lon, lat }));
    const halfRoad = roadWidth(way.tags) / 2;
    const pavement = 1.35;

    for (let i = 0; i < coords.length - 1; i++) {
      const a = coords[i], b = coords[i + 1];
      const dx = b.x - a.x, dz = b.z - a.z;
      const length = Math.hypot(dx, dz);
      if (length < 0.6) continue;
      const px = -dz / length, pz = dx / length;

      for (const side of [-1, 1]) {
        const inner = halfRoad * side;
        const outer = (halfRoad + pavement) * side;
        positions.push(
          a.x + px * inner, 0.12, a.z + pz * inner,
          a.x + px * outer, 0.12, a.z + pz * outer,
          b.x + px * outer, 0.12, b.z + pz * outer,
          b.x + px * inner, 0.12, b.z + pz * inner
        );
        if (side > 0) indices.push(vertex, vertex + 1, vertex + 2, vertex, vertex + 2, vertex + 3);
        else indices.push(vertex, vertex + 2, vertex + 1, vertex, vertex + 3, vertex + 2);
        vertex += 4;
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function buildingHeight(tags: Record<string, string>) {
  const explicit = Number.parseFloat((tags.height ?? '').replace(/m$/i, '').trim());
  if (Number.isFinite(explicit) && explicit >= 3 && explicit <= 160) return explicit;
  const levels = Number.parseFloat(tags['building:levels'] ?? tags.levels ?? '');
  if (Number.isFinite(levels) && levels >= 1 && levels <= 45) return levels * 3.1;
  const type = tags.building;
  if (type === 'industrial' || type === 'warehouse' || type === 'retail') return 8.5;
  if (type === 'church' || type === 'cathedral') return 15;
  if (type === 'apartments' || type === 'commercial' || type === 'office') return 11;
  return 7.2;
}

function buildingColor(tags: Record<string, string>, index: number) {
  const type = tags.building;
  if (type === 'industrial' || type === 'warehouse') return '#77756e';
  if (type === 'church' || type === 'cathedral' || type === 'civic') return '#a49b87';
  if (type === 'commercial' || type === 'retail' || type === 'office') return '#92715b';
  return brickPalette[index % brickPalette.length];
}

function createBuildingGeometry(way: OSMWay, index: number) {
  const coords = way.coordinates;
  if (coords.length < 4) return null;
  const points = coords.slice(0, -1).map(([lon, lat]) => geoToWorld({ lon, lat }));
  if (points.length < 3) return null;

  const shape = new THREE.Shape();
  shape.moveTo(points[0].x, -points[0].z);
  for (let i = 1; i < points.length; i++) shape.lineTo(points[i].x, -points[i].z);
  shape.closePath();

  const height = buildingHeight(way.tags);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: false,
    curveSegments: 1,
    steps: 1
  });
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, 0.06, 0);
  geometry.computeVertexNormals();

  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const point of points) {
    minX = Math.min(minX, point.x); maxX = Math.max(maxX, point.x);
    minZ = Math.min(minZ, point.z); maxZ = Math.max(maxZ, point.z);
  }
  return {
    geometry,
    color: buildingColor(way.tags, index),
    height,
    points,
    collider: new THREE.Box3(
      new THREE.Vector3(minX - 0.15, 0, minZ - 0.15),
      new THREE.Vector3(maxX + 0.15, height + 0.5, maxZ + 0.15)
    )
  };
}

async function loadOpenStreetMap(group: THREE.Group, colliders: THREE.Box3[], walkableSegments: WalkableSegment[], spawnPosition: THREE.Vector3) {
  const dataUrl = new URL('data/liverpool-osm.json', document.baseURI);
  const response = await fetch(dataUrl);
  if (!response.ok) throw new Error('No se pudo cargar el extracto OpenStreetMap (' + response.status + ')');
  const data = await response.json() as OSMData;
  if (!Array.isArray(data.roads) || !Array.isArray(data.buildings)) throw new Error('El extracto OSM no tiene el formato esperado.');

  const roads = data.roads.filter(way => way.coordinates.length >= 2);
  const buildings = data.buildings.filter(way => way.coordinates.length >= 4);

  // The pedestrian navigation mesh follows mapped public streets and footpaths.
  // Motorways, private roads and ways explicitly closed to pedestrians are excluded.
  const pedestrianHighways = new Set([
    'primary', 'secondary', 'tertiary', 'residential', 'unclassified',
    'living_street', 'service', 'pedestrian', 'footway', 'path', 'steps', 'cycleway'
  ]);
  const pedestrianWays = roads.filter((way) =>
    pedestrianHighways.has(way.tags.highway) &&
    !['no', 'private'].includes(way.tags.access ?? '') &&
    way.tags.foot !== 'no'
  );
  const footways = new Set(['footway', 'path', 'pedestrian', 'steps', 'living_street', 'cycleway']);
  for (const way of pedestrianWays) {
    const coords = way.coordinates.map(([lon, lat]) => geoToWorld({ lon, lat }));
    const halfWidth = footways.has(way.tags.highway)
      ? Math.max(1.05, roadWidth(way.tags) / 2)
      : roadWidth(way.tags) / 2 + 1.35;
    for (let i = 0; i < coords.length - 1; i++) {
      const a = coords[i], b = coords[i + 1];
      if (Math.hypot(b.x - a.x, b.z - a.z) > 0.5) {
        walkableSegments.push({ ax: a.x, az: a.z, bx: b.x, bz: b.z, halfWidth });
      }
    }
  }

  if (!walkableSegments.length) throw new Error('OpenStreetMap no contiene calles peatonales transitables.');
  // Begin in central Liverpool, at a real mapped street close to Lime Street.
  const requestedStart = geoToWorld({ lat: 53.40815, lon: -2.97915 });
  let nearest: { x: number; z: number; distance: number; nx: number; nz: number; tx: number; tz: number; halfWidth: number } | null = null;
  for (const segment of walkableSegments) {
    const dx = segment.bx - segment.ax, dz = segment.bz - segment.az;
    const lengthSq = dx * dx + dz * dz;
    if (lengthSq < 0.01) continue;
    const length = Math.sqrt(lengthSq);
    const t = THREE.MathUtils.clamp(((requestedStart.x - segment.ax) * dx + (requestedStart.z - segment.az) * dz) / lengthSq, 0, 1);
    const x = segment.ax + dx * t, z = segment.az + dz * t;
    const distance = Math.hypot(requestedStart.x - x, requestedStart.z - z);
    if (!nearest || distance < nearest.distance) {
      let nx = -dz / length, nz = dx / length;
      if ((requestedStart.x - x) * nx + (requestedStart.z - z) * nz < 0) { nx *= -1; nz *= -1; }
      nearest = { x, z, distance, nx, nz, tx: dx / length, tz: dz / length, halfWidth: segment.halfWidth };
    }
  }
  if (!nearest) throw new Error('No se encontró una calle adecuada para el punto inicial.');
  const pavementOffset = Math.max(0.8, nearest.halfWidth - 0.9);
  spawnPosition.set(nearest.x + nearest.nx * pavementOffset - nearest.tx * 1.2, 0, nearest.z + nearest.nz * pavementOffset - nearest.tz * 1.2);
  const stop = createBusStop(group, nearest.x + nearest.nx * pavementOffset + nearest.tx * 2.0, nearest.z + nearest.nz * pavementOffset + nearest.tz * 2.0, Math.atan2(nearest.tx, nearest.tz));
  stop.name = 'Lime Street bus stop';

  const roadGeometry = createRibbonGeometry(roads, false);
  const roadMesh = new THREE.Mesh(roadGeometry, material('#34383a'));
  roadMesh.name = 'OpenStreetMap road network';
  roadMesh.receiveShadow = true;
  group.add(roadMesh);

  const sidewalkGeometry = createSidewalkGeometry(roads);
  const sidewalkMesh = new THREE.Mesh(sidewalkGeometry, material('#aaa69a'));
  sidewalkMesh.name = 'OpenStreetMap pavements';
  sidewalkMesh.receiveShadow = true;
  group.add(sidewalkMesh);

  const byColor = new Map<string, THREE.BufferGeometry[]>();
  const windowMatrices: THREE.Matrix4[] = [];
  const windowAnchor = new THREE.Object3D();
  buildings.forEach((way, index) => {
    const result = createBuildingGeometry(way, index);
    if (!result) return;
    const list = byColor.get(result.color) ?? [];
    list.push(result.geometry);
    byColor.set(result.color, list);
    colliders.push(result.collider);

    const floors = Math.min(4, Math.max(1, Math.floor(result.height / 3)));
    for (let edge = 0; edge < result.points.length; edge++) {
      const a = result.points[edge];
      const b = result.points[(edge + 1) % result.points.length];
      const dx = b.x - a.x, dz = b.z - a.z;
      const length = Math.hypot(dx, dz);
      if (length < 4.8) continue;
      const count = Math.min(3, Math.max(1, Math.floor(length / 4.8)));
      for (let floor = 0; floor < floors; floor++) {
        for (let n = 0; n < count; n++) {
          const t = (n + 1) / (count + 1);
          windowAnchor.position.set(a.x + dx * t, 1.75 + floor * 2.7, a.z + dz * t);
          windowAnchor.rotation.set(0, Math.atan2(-dz, dx), 0);
          windowAnchor.scale.set(1, 1, 1);
          windowAnchor.updateMatrix();
          windowMatrices.push(windowAnchor.matrix.clone());
        }
      }
    }
  });

  for (const [color, geometries] of byColor) {
    const merged = mergeGeometries(geometries, false);
    geometries.forEach(geometry => geometry.dispose());
    if (!merged) continue;
    merged.computeVertexNormals();
    const mesh = new THREE.Mesh(merged, material(color));
    mesh.name = 'OpenStreetMap buildings ' + color;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  if (windowMatrices.length) {
    const windowMesh = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.85, 1.1, 0.08),
      new THREE.MeshStandardMaterial({ color: '#2c4146', roughness: 0.38, metalness: 0.18 }),
      windowMatrices.length
    );
    windowMatrices.forEach((matrix, index) => windowMesh.setMatrixAt(index, matrix));
    windowMesh.instanceMatrix.needsUpdate = true;
    windowMesh.name = 'OSM building windows';
    group.add(windowMesh);
  }

  console.info(`LiverCity OSM loaded: ${roads.length} roads, ${buildings.length} building footprints, ${windowMatrices.length} windows.`);
  window.dispatchEvent(new CustomEvent('livercity-world-ready', {
    detail: { roads: roads.length, buildings: buildings.length }
  }));
}

function createBusStop(parent: THREE.Group, x: number, z: number, rotation: number) {
  const stop = new THREE.Group();
  stop.position.set(x, 0, z);
  stop.rotation.y = rotation;
  const metal = material('#26383b', 0.55);
  const glass = new THREE.MeshStandardMaterial({ color: '#9bb5b5', roughness: 0.2, metalness: 0.15, transparent: true, opacity: 0.34 });
  const yellow = material('#e4b34f', 0.65);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.07, 2.8, 8), metal);
  pole.position.set(-1.25, 1.4, 0);
  pole.castShadow = true;
  stop.add(pole);
  const sign = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.72, 0.09), yellow);
  sign.position.set(-1.25, 2.65, 0);
  sign.castShadow = true;
  stop.add(sign);
  const signFace = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.56, 0.025), material('#243c48', 0.6));
  signFace.position.set(-1.25, 2.65, 0.06);
  stop.add(signFace);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.14, 1.55), metal);
  roof.position.set(0.35, 2.65, 0);
  roof.castShadow = true;
  stop.add(roof);
  const back = new THREE.Mesh(new THREE.BoxGeometry(3.3, 1.85, 0.07), glass);
  back.position.set(0.35, 1.68, -0.68);
  stop.add(back);
  const side = new THREE.Mesh(new THREE.BoxGeometry(0.07, 1.85, 1.35), glass);
  side.position.set(1.95, 1.68, 0);
  stop.add(side);
  const bench = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.13, 0.42), material('#70513c'));
  bench.position.set(0.25, 0.62, -0.32);
  bench.castShadow = true;
  stop.add(bench);
  const legs = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.58, 0.12), metal);
  legs.position.set(0.25, 0.32, -0.32);
  stop.add(legs);
  parent.add(stop);
  return stop;
}

function makeLandmark(parent: THREE.Group, location: typeof LIVERPOOL_LOCATIONS[number], seed: number, colliders: THREE.Box3[]) {
  const { x, z } = location.world;
  const building = new THREE.Group();
  building.position.set(x, 0, z);
  building.name = 'Landmark: ' + location.name;
  parent.add(building);

  const width = location.id === 'royal-albert-dock' || location.id === 'albert-dock' ? 24 : 13;
  const depth = location.id === 'royal-albert-dock' || location.id === 'albert-dock' ? 19 : 11;
  const height = location.id === 'cavern' ? 13 : location.id === 'albert-dock' ? 17 : 9 + (seed % 3) * 2;
  addBox(building, 0, height / 2, 0, width, height, depth, location.color);
  addBox(building, 0, height + 0.2, 0, width + 0.6, 0.4, depth + 0.6, '#3e3935');

  for (let y = 2; y < height - 1; y += 2.8) {
    for (let xx = -width / 2 + 1.5; xx < width / 2; xx += 2.2) {
      addBox(building, xx, y, -depth / 2 - 0.08, 0.9, 1.25, 0.12, '#31484b');
    }
  }
  colliders.push(new THREE.Box3(
    new THREE.Vector3(x - width / 2 - 0.6, 0, z - depth / 2 - 0.6),
    new THREE.Vector3(x + width / 2 + 0.6, height + 1, z + depth / 2 + 0.6)
  ));

  const marker = new THREE.Group();
  marker.position.set(x, 0, z + depth / 2 + 5);
  marker.userData.interactionId = location.id;
  marker.userData.locationId = location.id;
  marker.userData.prompt = `EXPLORAR ${location.name.toUpperCase()}`;
  marker.userData.lookAt = new THREE.Vector3(x, 2.5, z);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.82, 0.075, 8, 32), new THREE.MeshBasicMaterial({ color: '#e6b45e' }));
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.08;
  marker.add(ring);
  const beam = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.58, 8), new THREE.MeshBasicMaterial({ color: '#e6b45e' }));
  beam.position.y = 0.78;
  marker.add(beam);
  parent.add(marker);
  return marker;
}

export function buildCity() {
  const group = new THREE.Group();
  const interactables: THREE.Object3D[] = [];
  const colliders: THREE.Box3[] = [];
  const walkableSegments: WalkableSegment[] = [];
  const spawnPosition = new THREE.Vector3();

  const groundMaterial = material('#8a9183');
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(WORLD_SIZE.width, WORLD_SIZE.depth), groundMaterial);
  const loader = new THREE.TextureLoader();
  loader.setCrossOrigin('anonymous');
  loader.load(LIVERPOOL_SATELLITE_URL, texture => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    groundMaterial.map = texture;
    groundMaterial.color.set('#ffffff');
    groundMaterial.needsUpdate = true;
  }, undefined, () => console.warn('LiverCity: imagen satelital no disponible.'));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.12;
  ground.receiveShadow = true;
  group.add(ground);

  // Real road centre-lines and building footprints are downloaded at build time from OSM.
  const ready = loadOpenStreetMap(group, colliders, walkableSegments, spawnPosition);

  LIVERPOOL_LOCATIONS.forEach((location, index) => {
    interactables.push(makeLandmark(group, location, index, colliders));
  });

  const church = LIVERPOOL_LOCATIONS.find(place => place.id === 'st-peters')!;
  const jack = new THREE.Group();
  jack.position.set(church.world.x, 0, church.world.z + 10);
  jack.userData.interactionId = gameVariables.characters.john.id;
  jack.userData.prompt = `HABLAR CON ${gameVariables.characters.john.displayName.toUpperCase()}`;
  jack.userData.lookAt = new THREE.Vector3(jack.position.x, 1.7, jack.position.z);
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.36, 0.9, 4, 8), material('#344b50'));
  body.position.y = 0.92;
  jack.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.29, 12, 10), material('#d9ad86'));
  head.position.y = 1.72;
  jack.add(head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), material('#493a31'));
  hair.scale.y = 0.55;
  hair.position.y = 1.91;
  jack.add(hair);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.05, 8, 32), new THREE.MeshBasicMaterial({ color: '#e4a84c' }));
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.08;
  jack.add(ring);
  group.add(jack);
  interactables.push(jack);

  return { group, interactables, colliders, walkableSegments, spawnPosition, ready };
}

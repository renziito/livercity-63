import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { gameVariables } from '../data/variables';
import { LIVERPOOL_LOCATIONS } from '../data/locations';
import { LIVERPOOL_SATELLITE_URL, WORLD_SIZE, geoToWorld } from '../data/geography';
import type { WalkableSegment } from './navigation';
import { LIVERPOOL_TRAVEL_DESTINATIONS, travelDestinationWorld } from '../data/travel';

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

async function loadOpenStreetMap(group: THREE.Group, colliders: THREE.Box3[], walkableSegments: WalkableSegment[], buildingFootprints: { x: number; z: number }[][], spawnPosition: THREE.Vector3, interactables: THREE.Object3D[]) {
  const appBasePath = window.location.pathname.startsWith('/livercity-63/') ? '/livercity-63/' : '/';
  const dataUrl = new URL(`${appBasePath}data/liverpool-osm.json`, window.location.origin);
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
  const requestedStart = geoToWorld({ lat: 53.40730, lon: -2.97770 });
  buildingFootprints.push(...buildings.map(way => way.coordinates.slice(0, -1).map(([lon, lat]) => geoToWorld({ lon, lat }))));
  const stationSpawn = findStreetSpawn(
    new THREE.Vector3(requestedStart.x, 0, requestedStart.z),
    walkableSegments,
    buildingFootprints,
    colliders
  );
  spawnPosition.copy(stationSpawn.position);
  console.info('LiverCity safe spawn selected:', stationSpawn.position.toArray());
  createVictorianStation(group, spawnPosition);

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
    // Do not use the footprint's axis-aligned bounding box as a solid collider.
    // Liverpool's rotated/concave building footprints create enormous false-positive
    // rectangles that can cover nearby streets and trap the player at spawn.
    // Landmark colliders remain enabled; OSM buildings stay visual until polygon
    // collision is implemented.

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

function createVictorianStation(parent: THREE.Group, spawn: THREE.Vector3) {
  // A grand Victorian railway frontage inspired by London's great termini,
  // placed in front of the player's Lime Street arrival point.
  const station = new THREE.Group();
  station.name = 'Lime Street Station · Victorian railway frontage';
  station.position.set(spawn.x, 0, spawn.z - 30);

  const brick = material('#8f5140');
  const darkBrick = material('#653b32');
  const stone = material('#d4c2a0');
  const iron = material('#26383a', 0.58);
  const glass = new THREE.MeshStandardMaterial({
    color: '#9fb9b4', roughness: 0.22, metalness: 0.18,
    transparent: true, opacity: 0.58, side: THREE.DoubleSide
  });
  const gold = material('#c9a15e', 0.55);

  const addPart = (geometry: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number) => {
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    station.add(mesh);
    return mesh;
  };

  // Broad masonry wings and a tall central entrance hall.
  addBox(station, -14, 6.2, 0, 10, 12.4, 8, '#8f5140');
  addBox(station, 14, 6.2, 0, 10, 12.4, 8, '#8f5140');
  addBox(station, 0, 10.2, -1.8, 18.5, 4.4, 8, '#985744');
  addBox(station, 0, 14.1, -1.8, 20, 0.55, 9, '#d4c2a0');
  addBox(station, 0, 3.1, 3.9, 38, 0.5, 0.7, '#d4c2a0');

  // Corner towers, stone cornices and parapets.
  for (const x of [-18.2, 18.2]) {
    addBox(station, x, 8.3, 0, 2.1, 16.6, 9.2, '#794638');
    addBox(station, x, 16.8, 0, 2.8, 0.55, 10, '#d4c2a0');
    addBox(station, x, 17.7, 0, 1.45, 1.3, 1.45, '#985744');
    addPart(new THREE.ConeGeometry(1.1, 1.5, 4), stone, x, 19.1, 0).rotation.y = Math.PI / 4;
  }

  // Tall arched entrance glazing and repeated iron mullions.
  addPart(new THREE.BoxGeometry(10.5, 7.8, 0.22), glass, 0, 7.3, 4.12);
  for (let x = -5; x <= 5.01; x += 2.5) {
    addPart(new THREE.BoxGeometry(0.16, 8.2, 0.3), iron, x, 7.3, 4.28);
  }
  addPart(new THREE.BoxGeometry(10.8, 0.2, 0.3), iron, 0, 7.4, 4.28);
  for (const x of [-6.1, 6.1]) {
    const column = addPart(new THREE.CylinderGeometry(0.42, 0.52, 8.4, 12), stone, x, 4.2, 4.1);
    column.castShadow = true;
    addBox(station, x, 8.55, 4.1, 1.35, 0.45, 1.35, '#d4c2a0');
  }

  // Round clock above the entrance.
  addPart(new THREE.CylinderGeometry(1.28, 1.28, 0.24, 40), gold, 0, 13.05, 2.55).rotation.x = Math.PI / 2;
  addPart(new THREE.CylinderGeometry(1.04, 1.04, 0.27, 40), material('#f0e4c8'), 0, 13.05, 2.7).rotation.x = Math.PI / 2;
  addPart(new THREE.BoxGeometry(0.09, 0.68, 0.08), iron, 0, 13.25, 2.88);
  addPart(new THREE.BoxGeometry(0.52, 0.08, 0.08), iron, 0.2, 13.05, 2.88);

  // Long iron-and-glass train-shed roof behind the facade.
  const roof = addPart(new THREE.BoxGeometry(34, 0.22, 25), glass, 0, 13.1, -12);
  roof.rotation.x = -0.08;
  for (const x of [-16, -8, 0, 8, 16]) {
    const arch = addPart(new THREE.TorusGeometry(12.1, 0.2, 8, 36, Math.PI), iron, x, 5.4, -11);
    arch.rotation.z = Math.PI;
    addPart(new THREE.BoxGeometry(0.22, 13.5, 0.22), iron, x, 6.8, -11);
  }
  for (let z = -23; z <= -2; z += 5.2) {
    addPart(new THREE.BoxGeometry(34, 0.12, 0.12), iron, 0, 13.25, z);
  }

  // Station name board facing the arriving player.
  const signCanvas = document.createElement('canvas');
  signCanvas.width = 1024;
  signCanvas.height = 180;
  const context = signCanvas.getContext('2d');
  if (context) {
    context.fillStyle = '#17272b'; context.fillRect(0, 0, 1024, 180);
    context.strokeStyle = '#d0aa68'; context.lineWidth = 8; context.strokeRect(8, 8, 1008, 164);
    context.fillStyle = '#f2e6c9'; context.font = 'bold 76px Georgia'; context.textAlign = 'center';
    context.fillText('LIME STREET STATION', 512, 105);
    context.fillStyle = '#d9b875'; context.font = '26px Arial';
    context.fillText('LIVERPOOL  ·  EST. 1836', 512, 148);
  }
  const sign = addPart(new THREE.PlaneGeometry(13, 2.3), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(signCanvas) }), 0, 10.2, 4.42);
  sign.name = 'Lime Street Station sign';

  parent.add(station);
  return station;
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

function pointInFootprint(x: number, z: number, polygon: { x: number; z: number }[]) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i], b = polygon[j];
    const crosses = (a.z > z) !== (b.z > z) &&
      x < ((b.x - a.x) * (z - a.z)) / ((b.z - a.z) || Number.EPSILON) + a.x;
    if (crosses) inside = !inside;
  }
  return inside;
}

function distanceToFootprintEdge(x: number, z: number, polygon: { x: number; z: number }[]) {
  let minimum = Infinity;
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i], b = polygon[(i + 1) % polygon.length];
    const dx = b.x - a.x, dz = b.z - a.z;
    const lengthSq = dx * dx + dz * dz;
    const t = lengthSq > 0
      ? THREE.MathUtils.clamp(((x - a.x) * dx + (z - a.z) * dz) / lengthSq, 0, 1)
      : 0;
    minimum = Math.min(minimum, Math.hypot(x - (a.x + dx * t), z - (a.z + dz * t)));
  }
  return minimum;
}

function findStreetSpawn(
  target: THREE.Vector3,
  segments: WalkableSegment[],
  buildingFootprints: { x: number; z: number }[][] = [],
  colliders: THREE.Box3[] = []
) {
  // Restrict the expensive footprint checks to buildings around the destination.
  // The full Liverpool extract contains thousands of polygons; checking every
  // polygon for every candidate freezes the browser during world initialization.
  const searchRadius = 85;
  const nearbyFootprints = buildingFootprints.flatMap((polygon) => {
    if (polygon.length < 3) return [];
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const point of polygon) {
      minX = Math.min(minX, point.x); maxX = Math.max(maxX, point.x);
      minZ = Math.min(minZ, point.z); maxZ = Math.max(maxZ, point.z);
    }
    if (
      maxX < target.x - searchRadius || minX > target.x + searchRadius ||
      maxZ < target.z - searchRadius || minZ > target.z + searchRadius
    ) return [];
    return [{ polygon, minX, maxX, minZ, maxZ }];
  });

  // Only the closest street segments can produce a useful arrival point.
  // This bounds work even in central Liverpool, where OSM has dense street data.
  const nearestSegments = segments
    .map(segment => {
      const dx = segment.bx - segment.ax, dz = segment.bz - segment.az;
      const lengthSq = dx * dx + dz * dz;
      if (lengthSq < 0.01) return null;
      const t = THREE.MathUtils.clamp(((target.x - segment.ax) * dx + (target.z - segment.az) * dz) / lengthSq, 0, 1);
      const x = segment.ax + dx * t, z = segment.az + dz * t;
      return { segment, distance: Math.hypot(target.x - x, target.z - z) };
    })
    .filter((item): item is { segment: WalkableSegment; distance: number } => item !== null)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 48);

  const candidates: {
    position: THREE.Vector3;
    distance: number;
    nearest: { x: number; z: number; distance: number; nx: number; nz: number; tx: number; tz: number; halfWidth: number };
  }[] = [];

  for (const item of nearestSegments) {
    const segment = item.segment;
    const dx = segment.bx - segment.ax, dz = segment.bz - segment.az;
    const lengthSq = dx * dx + dz * dz;
    const length = Math.sqrt(lengthSq);
    const t = THREE.MathUtils.clamp(((target.x - segment.ax) * dx + (target.z - segment.az) * dz) / lengthSq, 0, 1);
    const x = segment.ax + dx * t, z = segment.az + dz * t;
    const distance = Math.hypot(target.x - x, target.z - z);
    let nx = -dz / length, nz = dx / length;
    if ((target.x - x) * nx + (target.z - z) * nz < 0) { nx *= -1; nz *= -1; }
    const tx = dx / length, tz = dz / length;
    const nearest = { x, z, distance, nx, nz, tx, tz, halfWidth: segment.halfWidth };
    const baseOffset = Math.max(0.8, segment.halfWidth - 0.9);

    for (const side of [1, -1]) {
      for (const lateral of [baseOffset, Math.max(0.65, baseOffset - 1.2), baseOffset + 1.2]) {
        for (const along of [-3, -1.5, 0, 1.5, 3]) {
          const candidateX = x + nx * lateral * side + tx * along;
          const candidateZ = z + nz * lateral * side + tz * along;
          const blockedByBuilding = nearbyFootprints.some(footprint => {
            if (
              candidateX < footprint.minX - 1.15 || candidateX > footprint.maxX + 1.15 ||
              candidateZ < footprint.minZ - 1.15 || candidateZ > footprint.maxZ + 1.15
            ) return false;
            return pointInFootprint(candidateX, candidateZ, footprint.polygon) ||
              distanceToFootprintEdge(candidateX, candidateZ, footprint.polygon) < 1.15;
          });
          const blockedByLandmark = colliders.some(box =>
            candidateX > box.min.x - 0.8 && candidateX < box.max.x + 0.8 &&
            candidateZ > box.min.z - 0.8 && candidateZ < box.max.z + 0.8
          );
          if (blockedByBuilding || blockedByLandmark) continue;
          const position = new THREE.Vector3(candidateX, 0, candidateZ);
          candidates.push({ position, distance: position.distanceTo(target), nearest });
        }
      }
    }
  }

  candidates.sort((a, b) => a.distance - b.distance);
  const best = candidates[0];
  if (!best) throw new Error('No se encontró una posición de aparición libre de edificios en las calles peatonales.');
  return { position: best.position, nearest: best.nearest };
}

function createTicketBooth(parent: THREE.Group, position: THREE.Vector3, interactables: THREE.Object3D[]) {
  const booth = new THREE.Group();
  booth.name = 'Liverpool station ticket office';
  const brass = '#c59a56';
  const dark = '#24383a';
  const wood = '#80543c';
  const glass = '#b6c9bd';
  addBox(booth, 0, 1.25, 0, 5.8, 2.5, 2.2, wood);
  addBox(booth, 0, 2.65, 0, 6.2, 0.22, 2.5, brass);
  addBox(booth, 0, 2.95, -0.15, 5.7, 0.38, 2.25, dark);
  addBox(booth, 0, 1.85, 1.13, 2.25, 0.8, 0.08, glass);
  addBox(booth, 0, 1.28, 1.2, 2.55, 0.12, 0.42, brass);
  addBox(booth, -2.45, 1.55, 0.2, 0.16, 2.9, 0.16, brass);
  addBox(booth, 2.45, 1.55, 0.2, 0.16, 2.9, 0.16, brass);

  const signCanvas = document.createElement('canvas');
  signCanvas.width = 768; signCanvas.height = 180;
  const ctx = signCanvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#17272b'; ctx.fillRect(0, 0, 768, 180);
    ctx.strokeStyle = '#d0aa68'; ctx.lineWidth = 8; ctx.strokeRect(8, 8, 752, 164);
    ctx.fillStyle = '#f2e6c9'; ctx.font = 'bold 70px Georgia'; ctx.textAlign = 'center';
    ctx.fillText('TICKETS', 384, 105);
    ctx.fillStyle = '#d9b875'; ctx.font = '25px Arial';
    ctx.fillText('TAQUILLA · LIVERPOOL', 384, 148);
  }
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 1.12), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(signCanvas) }));
  sign.position.set(0, 3.15, 1.28);
  booth.add(sign);
  booth.position.copy(position);
  parent.add(booth);

  const trigger = new THREE.Group();
  trigger.position.copy(position).add(new THREE.Vector3(0, 0, 3.1));
  trigger.userData.interactionId = 'travel-hub';
  trigger.userData.prompt = 'COMPRAR TICKET · TAQUILLA';
  trigger.userData.lookAt = position.clone().add(new THREE.Vector3(0, 1.8, 0.8));
  parent.add(trigger);
  interactables.push(trigger);

  return (nextPosition: THREE.Vector3) => {
    booth.position.copy(nextPosition);
    trigger.position.copy(nextPosition).add(new THREE.Vector3(0, 0, 3.1));
    trigger.userData.lookAt = nextPosition.clone().add(new THREE.Vector3(0, 1.8, 0.8));
  };
}

function makeLandmark(parent: THREE.Group, location: typeof LIVERPOOL_LOCATIONS[number], seed: number, colliders: THREE.Box3[]) {
  const { x, z } = location.world;
  const building = new THREE.Group();
  building.position.set(x, 0, z);
  building.name = 'Landmark: ' + location.name;
  parent.add(building);

  const privateHome = ['ringo-home', 'george-home', 'mendips', 'forthlin-road'].includes(location.id);
  if (!privateHome) {
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
  }

  const marker = new THREE.Group();
  marker.position.set(x + (privateHome ? 7 : 0), 0, z + (privateHome ? 7 : 16));
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
  const buildingFootprints: { x: number; z: number }[][] = [];
  const spawnPosition = new THREE.Vector3();
  let moveTicketBooth: (position: THREE.Vector3) => void = () => undefined;

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
  const ready = loadOpenStreetMap(group, colliders, walkableSegments, buildingFootprints, spawnPosition, interactables).then(() => {
    moveTicketBooth = createTicketBooth(group, spawnPosition.clone().add(new THREE.Vector3(0, 0, -4)), interactables);
    // The station is a bounded rectangular hub; leaving it is done by buying a ticket.
    const halfWidth = 48, halfDepth = 38, wallHeight = 5, wall = 1.4;
    colliders.push(
      new THREE.Box3(new THREE.Vector3(spawnPosition.x-halfWidth,0,spawnPosition.z-halfDepth-wall/2),new THREE.Vector3(spawnPosition.x+halfWidth,wallHeight,spawnPosition.z-halfDepth+wall/2)),
      new THREE.Box3(new THREE.Vector3(spawnPosition.x-halfWidth,0,spawnPosition.z+halfDepth-wall/2),new THREE.Vector3(spawnPosition.x+halfWidth,wallHeight,spawnPosition.z+halfDepth+wall/2)),
      new THREE.Box3(new THREE.Vector3(spawnPosition.x-halfWidth-wall/2,0,spawnPosition.z-halfDepth),new THREE.Vector3(spawnPosition.x-halfWidth+wall/2,wallHeight,spawnPosition.z+halfDepth)),
      new THREE.Box3(new THREE.Vector3(spawnPosition.x+halfWidth-wall/2,0,spawnPosition.z-halfDepth),new THREE.Vector3(spawnPosition.x+halfWidth+wall/2,wallHeight,spawnPosition.z+halfDepth))
    );
  });

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

  const travelTo = (destinationId: string) => {
    const destination = LIVERPOOL_TRAVEL_DESTINATIONS.find(item => item.id === destinationId);
    if (!destination) return null;
    const target = travelDestinationWorld(destination);
    const zoneSegments = walkableSegments.filter(segment => {
      const midX = (segment.ax + segment.bx) / 2;
      const midZ = (segment.az + segment.bz) / 2;
      return Math.hypot(midX - target.x, midZ - target.z) <= destination.radius + segment.halfWidth;
    });
    if (!zoneSegments.length) return null;
    const spawn = findStreetSpawn(new THREE.Vector3(target.x, 0, target.z), zoneSegments, buildingFootprints, colliders);
    const activeSegments = zoneSegments.filter(segment => {
      const midX = (segment.ax + segment.bx) / 2;
      const midZ = (segment.az + segment.bz) / 2;
      return Math.hypot(midX - spawn.position.x, midZ - spawn.position.z) <= destination.radius + segment.halfWidth;
    });
    moveTicketBooth(spawn.position.clone().add(new THREE.Vector3(0, 0, -4)));
    return { position: spawn.position, walkableSegments: activeSegments.length ? activeSegments : zoneSegments, destination };
  };

  const returnToStation = () => moveTicketBooth(spawnPosition.clone().add(new THREE.Vector3(0, 0, -4)));
  return { group, interactables, colliders, walkableSegments, spawnPosition, ready, travelTo, returnToStation };
}

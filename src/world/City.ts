import * as THREE from 'three';
import { gameVariables } from '../data/variables';
import { LIVERPOOL_LOCATIONS } from '../data/locations';
import { LIVERPOOL_SATELLITE_URL, WORLD_SIZE } from '../data/geography';

const palette = ['#8b5140', '#a15d48', '#765044', '#b07a5e', '#6f4940', '#9a624c'];
const mat = (color: string, roughness = 0.92) => new THREE.MeshStandardMaterial({ color, roughness, flatShading: true });

function box(parent: THREE.Group, x: number, y: number, z: number, w: number, h: number, d: number, color: string, cast = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
  mesh.position.set(x, y, z);
  mesh.castShadow = cast;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addRoad(parent: THREE.Group, x: number, z: number, length: number, width: number, rotation: number) {
  const road = new THREE.Mesh(new THREE.PlaneGeometry(width, length), mat('#343a3b'));
  road.rotation.x = -Math.PI / 2;
  road.rotation.z = rotation;
  road.position.set(x, 0.015, z);
  road.receiveShadow = true;
  parent.add(road);

  // Pavements on both sides make the street feel like a real walkable block.
  for (const side of [-1, 1]) {
    const sidewalk = new THREE.Mesh(new THREE.BoxGeometry(width * 0.18, 0.22, length), mat('#aaa69a'));
    sidewalk.position.set(x + Math.cos(rotation) * side * width * 0.59, 0.11, z - Math.sin(rotation) * side * width * 0.59);
    sidewalk.rotation.y = -rotation;
    sidewalk.receiveShadow = true;
    parent.add(sidewalk);
  }

  // Dashed centre markings, kept subtle for narrow residential streets.
  for (let t = -length / 2 + 8; t < length / 2 - 5; t += 15) {
    const dash = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.025, 4.2), mat('#d5c9a4'));
    dash.position.set(x + Math.sin(rotation) * t, 0.045, z + Math.cos(rotation) * t);
    dash.rotation.y = -rotation;
    parent.add(dash);
  }
}

function addTerrace(parent: THREE.Group, x: number, z: number, width: number, depth: number, height: number, color: string, facing: number, colliders: THREE.Box3[]) {
  const house = new THREE.Group();
  house.position.set(x, 0, z);
  house.rotation.y = facing;
  parent.add(house);

  // Traditional north-west England brick terrace with a pitched-looking roof silhouette.
  box(house, 0, height / 2, 0, width, height, depth, color);
  box(house, 0, height + 0.22, 0, width + 0.24, 0.42, depth + 0.24, '#393536');
  box(house, 0, height + 0.47, 0, width * 0.52, 0.28, depth + 0.18, '#55443e');

  const frontZ = -depth / 2 - 0.055;
  const floors = Math.max(2, Math.floor(height / 3.1));
  const windowsPerFloor = Math.max(2, Math.floor(width / 4.5));
  for (let floor = 0; floor < floors; floor++) {
    const y = 1.25 + floor * 2.65;
    for (let i = 0; i < windowsPerFloor; i++) {
      const wx = -width / 2 + (i + 0.5) * width / windowsPerFloor;
      box(house, wx, y, frontZ - 0.045, 0.66, 0.92, 0.12, '#344b50', false);
    }
  }
  box(house, 0, 1.05, frontZ - 0.06, 0.95, 2.05, 0.16, '#4b3028', false);
  box(house, 0, 1.08, frontZ - 0.16, 0.7, 1.8, 0.05, '#283d42', false);
  box(house, 0, 2.16, frontZ - 0.19, 0.12, 0.08, 0.04, '#d6b66d', false);

  // Chimneys and parapets break the repeated roofline.
  if ((Math.round(x + z) & 1) === 0) {
    box(house, -width * 0.32, height + 1.05, depth * 0.22, 0.55, 1.35, 0.55, '#704638');
  }
  colliders.push(new THREE.Box3(
    new THREE.Vector3(x - width / 2 - 0.35, 0, z - depth / 2 - 0.35),
    new THREE.Vector3(x + width / 2 + 0.35, height + 1.8, z + depth / 2 + 0.35)
  ));
}

function addStreetFurniture(parent: THREE.Group, x: number, z: number, rotation: number, seed: number) {
  const lamp = new THREE.Group();
  lamp.position.set(x, 0, z);
  lamp.rotation.y = rotation;
  parent.add(lamp);
  box(lamp, 0, 2.4, 0, 0.12, 4.8, 0.12, '#303638');
  box(lamp, 0.42, 4.7, 0, 0.95, 0.12, 0.12, '#303638');
  box(lamp, 0.88, 4.55, 0, 0.42, 0.22, 0.32, '#e4c98a');

  if (seed % 3 === 0) {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 2.4, 7), mat('#594638'));
    trunk.position.set(x + 2.8, 1.2, z + 1.8);
    parent.add(trunk);
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1.9, 1), mat('#526b50'));
    crown.position.set(x + 2.8, 3.3, z + 1.8);
    crown.scale.y = 1.2;
    crown.castShadow = true;
    parent.add(crown);
  }
}

function addDistrict(parent: THREE.Group, centerX: number, centerZ: number, rotation: number, seed: number, colliders: THREE.Box3[]) {
  const colliderStart = colliders.length;
  const district = new THREE.Group();
  district.position.set(centerX, 0, centerZ);
  district.rotation.y = rotation;
  parent.add(district);

  const block = 58;
  const roadWidth = 10;
  const gridCount = 3;
  const span = block * (gridCount - 1) + roadWidth;
  // Slightly irregular street grid: the Liverpool street pattern is compact, not a perfect US grid.
  for (let i = 0; i < gridCount; i++) {
    const offset = (i - (gridCount - 1) / 2) * block;
    const drift = Math.sin(seed * 1.7 + i * 1.31) * 5;
    addRoad(district, offset + drift, 0, span + 24, roadWidth, 0);
    addRoad(district, 0, offset - drift * 0.55, span + 24, roadWidth, Math.PI / 2);
  }

  let buildingIndex = 0;
  for (let gx = 0; gx < gridCount - 1; gx++) {
    for (let gz = 0; gz < gridCount - 1; gz++) {
      const cx = (gx - (gridCount - 2) / 2) * block;
      const cz = (gz - (gridCount - 2) / 2) * block;
      // Houses line the four edges of each block, leaving a shared rear yard.
      for (let side = 0; side < 4; side++) {
        for (let n = 0; n < 2; n++) {
          const along = (n - 0.5) * 14;
          const edge = block / 2 - 8;
          let bx = cx, bz = cz, facing = 0;
          if (side === 0) { bx += along; bz -= edge; facing = 0; }
          if (side === 1) { bx += along; bz += edge; facing = Math.PI; }
          if (side === 2) { bx -= edge; bz += along; facing = Math.PI / 2; }
          if (side === 3) { bx += edge; bz += along; facing = -Math.PI / 2; }
          const width = 10 + ((buildingIndex + seed) % 3) * 1.4;
          const depth = 8 + ((buildingIndex + seed) % 2) * 2;
          const height = 8.5 + ((buildingIndex * 7 + seed) % 4) * 1.35;
          addTerrace(district, bx, bz, width, depth, height, palette[(buildingIndex + seed) % palette.length], facing, colliders);
          buildingIndex++;
        }
      }
    }
  }

  // Street lamps at alternate junctions.
  for (let i = 0; i < gridCount; i++) {
    for (let j = 0; j < gridCount; j++) {
      if ((i + j + seed) % 2 === 0) {
        const x = (i - (gridCount - 1) / 2) * block + 8;
        const z = (j - (gridCount - 1) / 2) * block + 8;
        addStreetFurniture(district, x, z, rotation, seed + i + j);
      }
    }
  }

  // Convert neighbourhood-local collision boxes into world coordinates, including district rotation.
  district.updateMatrixWorld(true);
  for (let i = colliderStart; i < colliders.length; i++) {
    colliders[i].applyMatrix4(district.matrixWorld);
  }
}

function makeLandmark(parent: THREE.Group, location: typeof LIVERPOOL_LOCATIONS[number], seed: number, colliders: THREE.Box3[]) {
  const { x, z } = location.world;
  const building = new THREE.Group();
  building.position.set(x, 0, z);
  parent.add(building);

  const width = location.id === 'royal-albert-dock' ? 24 : 13;
  const depth = location.id === 'royal-albert-dock' ? 19 : 11;
  const height = location.id === 'cavern-club' ? 13 : location.id === 'royal-albert-dock' ? 17 : 9 + (seed % 3) * 2;
  box(building, 0, height / 2, 0, width, height, depth, location.color);
  box(building, 0, height + 0.2, 0, width + 0.6, 0.4, depth + 0.6, '#3e3935');
  for (let y = 2; y < height - 1; y += 2.8) {
    for (let xx = -width / 2 + 1.5; xx < width / 2; xx += 2.2) {
      box(building, xx, y, -depth / 2 - 0.08, 0.9, 1.25, 0.12, '#31484b', false);
      box(building, xx, y, -depth / 2 - 0.15, 1.05, 0.08, 0.08, '#d6c7a9', false);
    }
  }
  const door = box(building, 0, 1.2, -depth / 2 - 0.1, 1.4, 2.4, 0.18, '#342820', false);
  door.userData.locationName = location.name;
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

  const groundMaterial = mat('#8a9183');
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(WORLD_SIZE.width, WORLD_SIZE.depth), groundMaterial);
  const loader = new THREE.TextureLoader();
  loader.setCrossOrigin('anonymous');
  loader.load(LIVERPOOL_SATELLITE_URL, (texture) => {
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

  // Dense, walkable neighbourhoods around the real places: terrace rows, pavements,
  // junctions, road markings, lamps and trees. Each district is oriented differently.
  const districts = [
    { id: 'st-peters', angle: 0.18 },
    { id: 'penny-lane', angle: -0.12 },
    { id: 'cavern-club', angle: 0.32 },
    { id: 'royal-albert-dock', angle: -0.28 },
    { id: 'casbah', angle: 0.08 }
  ];
  districts.forEach((district, index) => {
    const place = LIVERPOOL_LOCATIONS.find((item) => item.id === district.id);
    if (place) addDistrict(group, place.world.x, place.world.z, district.angle, index + 2, colliders);
  });

  LIVERPOOL_LOCATIONS.forEach((location, index) => {
    interactables.push(makeLandmark(group, location, index, colliders));
  });

  // Jack waits just outside St Peter's, near the opening mission spawn.
  const church = LIVERPOOL_LOCATIONS.find((place) => place.id === 'st-peters')!;
  const jack = new THREE.Group();
  jack.position.set(church.world.x, 0, church.world.z + 10);
  jack.userData.interactionId = gameVariables.characters.john.id;
  jack.userData.prompt = `HABLAR CON ${gameVariables.characters.john.displayName.toUpperCase()}`;
  jack.userData.lookAt = new THREE.Vector3(jack.position.x, 1.7, jack.position.z);
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.36, 0.9, 4, 8), mat('#344b50'));
  body.position.y = 0.92;
  jack.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.29, 12, 10), mat('#d9ad86'));
  head.position.y = 1.72;
  jack.add(head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), mat('#493a31'));
  hair.scale.y = 0.55;
  hair.position.y = 1.91;
  jack.add(hair);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.05, 8, 32), new THREE.MeshBasicMaterial({ color: '#e4a84c' }));
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.08;
  jack.add(ring);
  group.add(jack);
  interactables.push(jack);

  return { group, interactables, colliders };
}

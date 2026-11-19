import * as THREE from 'three';
import { gameVariables } from '../data/variables';
import { LIVERPOOL_LOCATIONS } from '../data/locations';
import { LIVERPOOL_SATELLITE_URL, WORLD_SIZE } from '../data/geography';

const material = (color: string) => new THREE.MeshStandardMaterial({
  color, roughness: 0.94, flatShading: true
});

function addBox(
  parent: THREE.Group, x: number, y: number, z: number,
  w: number, h: number, d: number, color: string
) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material(color));
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function makeLandmarkBuilding(
  parent: THREE.Group, x: number, z: number, color: string, seed: number
) {
  const building = new THREE.Group();
  building.position.set(x, 0, z);
  parent.add(building);

  const width = 8.5;
  const depth = 7;
  const height = 7 + (seed % 3);
  addBox(building, 0, height / 2, 0, width, height, depth, color);
  addBox(building, 0, height + 0.15, 0, width + 0.3, 0.3, depth + 0.3, '#454846');

  for (let y = 1.4; y < height - 0.5; y += 1.8) {
    for (let xx = -width / 2 + 0.8; xx < width / 2 - 0.4; xx += 1.5) {
      addBox(building, xx, y, -depth / 2 - 0.035, 0.62, 0.9, 0.07,
        seed % 2 ? '#344c50' : '#52676a');
    }
  }
  addBox(building, 0, 1.05, -depth / 2 - 0.08, 1.1, 1.9, 0.16, '#283538');

  const sign = addBox(building, 0, height - 1.1, -depth / 2 - 0.09, 6.9, 0.72, 0.14, '#253337');
  sign.userData.locationName = LIVERPOOL_LOCATIONS[seed % LIVERPOOL_LOCATIONS.length]?.name;

  const collider = new THREE.Box3(
    new THREE.Vector3(x - width / 2 - 0.3, 0, z - depth / 2 - 0.3),
    new THREE.Vector3(x + width / 2 + 0.3, height + 1, z + depth / 2 + 0.3)
  );
  return { building, collider };
}

export function buildCity() {
  const group = new THREE.Group();
  const interactables: THREE.Object3D[] = [];
  const colliders: THREE.Box3[] = [];

  // The 3D ground and both UI maps use this exact Liverpool geographic extent.
  // We deliberately do not draw a synthetic road grid over real satellite streets.
  const groundMaterial = material('#ffffff');
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(WORLD_SIZE.width, WORLD_SIZE.depth),
    groundMaterial
  );
  const satelliteLoader = new THREE.TextureLoader();
  satelliteLoader.setCrossOrigin('anonymous');
  satelliteLoader.load(
    LIVERPOOL_SATELLITE_URL,
    (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(8, 4);
      groundMaterial.map = texture;
      groundMaterial.color.set('#ffffff');
      groundMaterial.needsUpdate = true;
    },
    undefined,
    () => console.warn('LiverCity: no se pudo cargar la imagen satelital de Liverpool.')
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.1;
  ground.receiveShadow = true;
  group.add(ground);

  // Landmarks are georeferenced from their real latitude/longitude in locations.ts.
  LIVERPOOL_LOCATIONS.forEach((location, index) => {
    const { x, z } = location.world;
    const { collider } = makeLandmarkBuilding(group, x, z, location.color, index);
    colliders.push(collider);

    const marker = new THREE.Group();
    marker.position.set(x, 0, z + 5.7);
    marker.userData.interactionId = location.id;
    marker.userData.locationId = location.id;
    marker.userData.prompt = `${location.prompt} ${location.name.toUpperCase()}`;
    marker.userData.lookAt = new THREE.Vector3(x, 2.5, z);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.82, 0.075, 8, 32),
      new THREE.MeshBasicMaterial({ color: '#e6b45e' })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.08;
    marker.add(ring);

    const beam = new THREE.Mesh(
      new THREE.ConeGeometry(0.16, 0.58, 8),
      new THREE.MeshBasicMaterial({ color: '#e6b45e' })
    );
    beam.position.y = 0.78;
    marker.add(beam);
    group.add(marker);
    interactables.push(marker);
  });

  // Jack waits beside St Peter's Church in Woolton, at the real church location.
  const church = LIVERPOOL_LOCATIONS.find((place) => place.id === 'st-peters')!;
  const jack = new THREE.Group();
  jack.position.set(church.world.x, 0, church.world.z + 10);
  jack.userData.interactionId = gameVariables.characters.john.id;
  jack.userData.prompt = `HABLAR CON ${gameVariables.characters.john.displayName.toUpperCase()}`;
  jack.userData.lookAt = new THREE.Vector3(jack.position.x, 1.7, jack.position.z);

  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.36, 0.9, 4, 8),
    material('#344b50')
  );
  body.position.y = 0.92;
  jack.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.29, 12, 10), material('#d9ad86'));
  head.position.y = 1.72;
  jack.add(head);

  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), material('#493a31'));
  hair.scale.y = 0.55;
  hair.position.y = 1.91;
  jack.add(hair);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.58, 0.05, 8, 32),
    new THREE.MeshBasicMaterial({ color: '#e4a84c' })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.08;
  jack.add(ring);
  group.add(jack);
  interactables.push(jack);

  return { group, interactables, colliders };
}

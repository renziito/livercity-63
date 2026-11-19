import { gameVariables } from '../data/variables';
import * as THREE from 'three';

const mat = (color: string, roughness = 0.92) =>
  new THREE.MeshStandardMaterial({ color, roughness, flatShading: true });

function box(
  parent: THREE.Group, x: number, y: number, z: number,
  w: number, h: number, d: number, material: THREE.Material, cast = true
) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = cast;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function building(
  parent: THREE.Group, x: number, z: number, w: number, d: number,
  h: number, color: string, seed: number
) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  parent.add(group);

  const wall = mat(color);
  const dark = mat('#28373a');
  const glass = mat('#344d50');
  const trim = mat('#e8d6b5');
  box(group, 0, h / 2, 0, w, h, d, wall);
  box(group, 0, h + 0.12, 0, w + 0.22, 0.24, d + 0.22, mat('#3e4543'));

  for (let floor = 1; floor < h - 0.2; floor += 1.55) {
    for (let col = -w / 2 + 0.65; col < w / 2 - 0.25; col += 1.15) {
      box(group, col, floor, -d / 2 - 0.012, 0.48, 0.78, 0.05, glass, false);
      box(group, col, floor - 0.43, -d / 2 - 0.045, 0.58, 0.09, 0.13, trim, false);
      box(group, col, floor + 0.44, -d / 2 - 0.045, 0.58, 0.08, 0.13, trim, false);
    }
  }

  box(group, 0, 1.05, -d / 2 - 0.04, 1.05, 1.9, 0.12, dark, false);
  if (seed % 2 === 0) box(group, 0, h + 0.4, 0, w * 0.48, 0.42, d * 0.75, mat('#b34f3c'));

  // The collision volume is deliberately a little wider than the walls and roof.
  const collider = new THREE.Box3(
    new THREE.Vector3(x - w / 2 - 0.12, 0, z - d / 2 - 0.12),
    new THREE.Vector3(x + w / 2 + 0.12, h + 1, z + d / 2 + 0.12)
  );
  return { group, collider };
}

function sign(parent: THREE.Group, x: number, y: number, z: number, textColor: string, label: string) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.55, 0.13), mat('#243338'));
  mesh.position.set(x, y, z);
  parent.add(mesh);

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 96;
  const context = canvas.getContext('2d')!;
  context.fillStyle = '#243338';
  context.fillRect(0, 0, 512, 96);
  context.fillStyle = textColor;
  context.font = 'bold 42px Georgia';
  context.textAlign = 'center';
  context.fillText(label, 256, 63);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const plate = new THREE.Mesh(
    new THREE.PlaneGeometry(2.65, 0.48),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true })
  );
  plate.position.set(x, y, z + 0.075);
  parent.add(plate);
}

function marker(parent: THREE.Group, id: string, prompt: string, x: number, z: number, color: string) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.userData.interactionId = id;
  group.userData.prompt = prompt;
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.48, 0.045, 8, 32),
    new THREE.MeshBasicMaterial({ color })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.08;
  group.add(ring);
  const dot = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.35, 8), new THREE.MeshBasicMaterial({ color }));
  dot.position.y = 0.65;
  group.add(dot);
  parent.add(group);
  return group;
}

export function buildCity() {
  const group = new THREE.Group();
  const interactables: THREE.Object3D[] = [];
  const colliders: THREE.Box3[] = [];
  const ground = mat('#b7ad91');
  const road = mat('#414d4d');
  const pavement = mat('#c9bea4');

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), ground);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.08;
  floor.receiveShadow = true;
  group.add(floor);

  const street = new THREE.Mesh(new THREE.PlaneGeometry(17, 72), road);
  street.rotation.x = -Math.PI / 2;
  street.position.set(0, 0, -1);
  street.receiveShadow = true;
  group.add(street);

  for (const side of [-1, 1]) {
    const walk = new THREE.Mesh(new THREE.BoxGeometry(4, 0.18, 70), pavement);
    walk.position.set(side * 10, 0.02, -1);
    walk.receiveShadow = true;
    group.add(walk);
  }

  for (let z = -30; z <= 29; z += 7) {
    const dash = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.025, 3.1), mat('#d7c8a2'));
    dash.position.set(0, 0.025, z);
    group.add(dash);
  }

  const colors = ['#c27c5c', '#d2b88b', '#8b9c91', '#a8a08a', '#b56c55', '#c7c0a4'];
  let seed = 1;
  for (const side of [-1, 1]) {
    for (let z = -29; z <= 25; z += 10) {
      const width = 5.2 + (seed % 3) * 0.5;
      const result = building(group, side * 16, z, width, 7, 7 + (seed % 3) * 1.4, colors[seed % colors.length], seed++);
      colliders.push(result.collider);
    }
  }

  const club = building(group, -5, -12, 6, 7, 5.8, '#9b5948', 3);
  colliders.push(club.collider);
  sign(club.group, 0, 4.5, -3.58, '#edb55e', gameVariables.places.cavernClub.displayName.toUpperCase());

  const shop = building(group, 5, 12, 5.5, 6, 5.2, '#71877d', 4);
  colliders.push(shop.collider);
  sign(shop.group, 0, 4.1, -3.08, '#e7bd71', gameVariables.places.recordShop.displayName.toUpperCase());

  interactables.push(marker(
    group, 'club', `VISIT ${gameVariables.places.cavernClub.displayName.toUpperCase()}`,
    -5, -16, '#e7b45d'
  ));
  interactables.push(marker(
    group, 'recordshop', `VISIT ${gameVariables.places.recordShop.displayName.toUpperCase()}`,
    5, 8, '#e7b45d'
  ));

  const johnny = new THREE.Group();
  johnny.position.set(-1.5, 0, -13.7);
  johnny.userData.interactionId = gameVariables.characters.john.id;
  johnny.userData.prompt = `TALK TO ${gameVariables.characters.john.displayName.toUpperCase()}`;

  const characterBody = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 0.85, 4, 8), mat('#344b50'));
  characterBody.position.y = 0.9;
  characterBody.castShadow = true;
  johnny.add(characterBody);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.29, 12, 10), mat('#d9ad86'));
  head.position.y = 1.72;
  head.castShadow = true;
  johnny.add(head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), mat('#493a31'));
  hair.scale.set(1, 0.55, 1);
  hair.position.set(0, 1.91, 0);
  johnny.add(hair);

  const markerRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.55, 0.045, 8, 32),
    new THREE.MeshBasicMaterial({ color: '#e4a84c' })
  );
  markerRing.rotation.x = Math.PI / 2;
  markerRing.position.y = 0.08;
  johnny.add(markerRing);
  group.add(johnny);
  interactables.push(johnny);

  for (const [x, z, color] of [[-10, 2, '#b45e43'], [10, -23, '#d1b16f']] as [number, number, string][]) {
    const car = new THREE.Group();
    car.position.set(x, 0.12, z);
    box(car, 0, 0.55, 0, 2.2, 0.65, 4.1, mat(color));
    box(car, 0, 1.05, -0.25, 1.75, 0.65, 2.1, mat('#38484a'));
    for (const wheelX of [-1.05, 1.05]) {
      for (const wheelZ of [-1.25, 1.25]) {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.2, 12), mat('#20282a'));
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wheelX, 0.38, wheelZ);
        car.add(wheel);
      }
    }
    group.add(car);
    colliders.push(new THREE.Box3(
      new THREE.Vector3(x - 1.25, 0, z - 2.15),
      new THREE.Vector3(x + 1.25, 1.8, z + 2.15)
    ));
  }

  for (const side of [-1, 1]) {
    for (let z = -26; z < 25; z += 13) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 3.5, 8), mat('#343d3c'));
      pole.position.set(side * 11, 1.75, z);
      group.add(pole);
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), mat('#f4d49a'));
      lamp.position.set(side * 11, 3.55, z);
      group.add(lamp);
    }
  }

  return { group, interactables, colliders };
}

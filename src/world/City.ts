import { gameVariables } from '../data/variables';
import * as THREE from 'three';

const material = (color: string) => new THREE.MeshStandardMaterial({ color, roughness: 0.94, flatShading: true });

function addBox(parent: THREE.Group, x: number, y: number, z: number, w: number, h: number, d: number, color: string) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material(color));
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function makeBuilding(parent: THREE.Group, x: number, z: number, w: number, d: number, h: number, color: string, seed: number) {
  const b = new THREE.Group();
  b.position.set(x, 0, z);
  parent.add(b);
  addBox(b, 0, h / 2, 0, w, h, d, color);
  addBox(b, 0, h + 0.15, 0, w + 0.3, 0.3, d + 0.3, '#454846');
  for (let y = 1.3; y < h - 0.5; y += 1.7) {
    for (let xx = -w / 2 + 0.7; xx < w / 2 - 0.4; xx += 1.35) {
      addBox(b, xx, y, -d / 2 - 0.025, 0.58, 0.88, 0.06, seed % 2 ? '#344c50' : '#52676a');
    }
  }
  addBox(b, 0, 1.05, -d / 2 - 0.08, 1.1, 1.9, 0.16, '#283538');
  const collider = new THREE.Box3(new THREE.Vector3(x-w/2-0.2,0,z-d/2-0.2),new THREE.Vector3(x+w/2+0.2,h+1,z+d/2+0.2));
  return { building: b, collider };
}

function addLandmark(parent: THREE.Group, interactables: THREE.Object3D[], colliders: THREE.Box3[], id: string, name: string, x: number, z: number, color: string, prompt = 'EXPLORAR') {
  const { building, collider } = makeBuilding(parent, x, z, 10, 8, 8, color, Math.round(x+z));
  colliders.push(collider);
  const sign = addBox(building, 0, 5.5, -4.12, 6.8, 0.9, 0.16, '#253337');
  sign.userData.landmarkName = name;
  const marker = new THREE.Group();
  marker.position.set(x, 0, z - 6.2);
  marker.userData.interactionId = id;
  marker.userData.prompt = `${prompt} ${name.toUpperCase()}`;
  marker.userData.lookAt = new THREE.Vector3(x, 2.5, z);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.08, 8, 32), new THREE.MeshBasicMaterial({color:'#e6b45e'}));
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.08;
  marker.add(ring);
  const beam = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.65, 8), new THREE.MeshBasicMaterial({color:'#e6b45e'}));
  beam.position.y = 0.85;
  marker.add(beam);
  parent.add(marker);
  interactables.push(marker);
}

export function buildCity() {
  const group = new THREE.Group();
  const interactables: THREE.Object3D[] = [];
  const colliders: THREE.Box3[] = [];
  // The playable world is a scaled, navigable interpretation of Liverpool's real street geography.
  // Central waterfront, compact city centre, southern suburbs and the north-west Casbah area
  // retain their relative direction and separation.
  const groundMaterial = material('#ffffff');
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(260, 220), groundMaterial);
  // Esri World Imagery satellite/aerial base for Liverpool. The 3D streets and buildings
  // are placed over this real geographic reference; the texture falls back to the terrain
  // material if the imagery service is temporarily unavailable.
  const satelliteUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=-3.08,53.32,-2.80,53.47&bboxSR=4326&imageSR=4326&size=2048,2048&format=jpg&f=image';
  const satelliteLoader = new THREE.TextureLoader();
  satelliteLoader.setCrossOrigin('anonymous');
  satelliteLoader.load(satelliteUrl, (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    groundMaterial.map = texture;
    groundMaterial.color.set('#ffffff');
    groundMaterial.needsUpdate = true;
  }, undefined, () => console.warn('LiverCity: satellite imagery unavailable; using procedural terrain.'));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.1;
  ground.receiveShadow = true;
  group.add(ground);

  // Mersey waterfront west of the city centre.
  const water = new THREE.Mesh(new THREE.PlaneGeometry(54, 220), new THREE.MeshStandardMaterial({color:'#547d88',roughness:0.35}));
  water.rotation.x = -Math.PI/2;
  water.position.set(-112, -0.04, 0);
  group.add(water);
  const waterfront = new THREE.Mesh(new THREE.PlaneGeometry(4, 210), material('#b9ad91'));
  waterfront.rotation.x = -Math.PI/2;
  waterfront.position.set(-83, 0.01, 0);
  group.add(waterfront);

  // Major road corridors form a loose, irregular grid inspired by the real street network.
  const roads: Array<[number,number,number,number]> = [
    [-55,0,5,205],[-25,0,5,205],[8,0,5,205],[38,0,5,205],[68,0,5,205],[98,0,5,205],
    [0,-82,180,5],[0,-52,180,5],[0,-22,180,5],[0,12,180,5],[0,44,180,5],[0,76,180,5]
  ];
  for (const [x,z,w,d] of roads) {
    const r = new THREE.Mesh(new THREE.PlaneGeometry(w,d), material('#41494a'));
    r.rotation.x = -Math.PI/2;
    r.position.set(x,0.015,z);
    group.add(r);
    const pavement = new THREE.Mesh(new THREE.PlaneGeometry(w+2,d+2), material('#c3b99f'));
    pavement.rotation.x = -Math.PI/2;
    pavement.position.set(x,0.005,z);
    group.add(pavement);
    const asphalt = new THREE.Mesh(new THREE.PlaneGeometry(w,d), material('#41494a'));
    asphalt.rotation.x = -Math.PI/2;
    asphalt.position.set(x,0.025,z);
    group.add(asphalt);
  }

  // Urban blocks and residential streets. Blocks are deliberately varied rather than a perfect grid.
  const colors = ['#b9785e','#c8b18b','#8b9990','#aa9b83','#9f6d59','#c4bba6'];
  let seed = 0;
  const landmarkClearings: Array<[number,number]> = [
    [-26,-9],[-38,8],[-67,-28],[-53,-40],[-44,-42],[8,-5],
    [40,20],[85,35],[82,43],[92,29],[55,45],[45,-50]
  ];
  // Put building blocks between the main road corridors and leave clear approaches
  // around every historic landmark so their E interaction markers remain reachable.
  for (let x = -40; x <= 80; x += 30) {
    for (let z = -67; z <= 83; z += 30) {
      const jitterX = ((seed * 17) % 5) - 2;
      const jitterZ = ((seed * 11) % 5) - 2;
      const bx = x + jitterX;
      const bz = z + jitterZ;
      if (landmarkClearings.some(([lx,lz]) => Math.abs(bx-lx) < 12 && Math.abs(bz-lz) < 12)) continue;
      const w = 7 + (seed % 3);
      const d = 7 + ((seed + 1) % 3);
      const h = 6 + (seed % 4) * 1.5;
      const result = makeBuilding(group,bx,bz,w,d,h,colors[seed%colors.length],seed++);
      colliders.push(result.collider);
    }
  }

  // City-centre and waterfront landmarks.
  addLandmark(group,interactables,colliders,'cavern',gameVariables.places.cavernClub.displayName,-26,-9,'#9b5948','VISITAR');
  addLandmark(group,interactables,colliders,'jacaranda','The Jacaranda',-38,8,'#98744f','VISITAR');
  addLandmark(group,interactables,colliders,'pier-head','Pier Head y la estatua de los Beatles',-67,-28,'#b6a58a','CONOCER');
  addLandmark(group,interactables,colliders,'albert-dock','Royal Albert Dock',-53,-40,'#9b6b52','EXPLORAR');
  addLandmark(group,interactables,colliders,'beatles-story','The Beatles Story',-44,-42,'#7d8c84','VISIT');
  addLandmark(group,interactables,colliders,'recordshop',gameVariables.places.recordShop.displayName,8,-5,'#71877d','VISIT');

  // South Liverpool: Penny Lane, childhood-home area, St Peter's and Strawberry Field.
  addLandmark(group,interactables,colliders,'penny-lane',gameVariables.places.pennyLane.displayName,40,20,'#b58a60','EXPLORAR');
  addLandmark(group,interactables,colliders,'st-peters',gameVariables.places.stPetersChurch.displayName,85,35,'#9a9b89','VISIT');
  addLandmark(group,interactables,colliders,'strawberry-field','Strawberry Field',82,43,'#a65b4b','VISIT');
  addLandmark(group,interactables,colliders,'mendips','Mendips · John Lennon childhood home',92,29,'#c0aa86','CONOCER');
  addLandmark(group,interactables,colliders,'forthlin-road','20 Forthlin Road · Paul McCartney childhood home',55,45,'#b88c67','INSPECT');

  // North-west: Casbah Coffee Club in West Derby.
  addLandmark(group,interactables,colliders,'casbah',gameVariables.places.casbahCoffeeClub.displayName,45,-50,'#947a65','VISIT');

  // Parks, rail corridors and green residential pockets.
  for (const [x,z,w,d] of [[28,5,26,20],[48,85,22,14],[96,28,18,26],[-5,80,20,18]] as number[][]) {
    const park = new THREE.Mesh(new THREE.PlaneGeometry(w,d), material('#6d896d'));
    park.rotation.x = -Math.PI/2;
    park.position.set(x,0.03,z);
    group.add(park);
    for(let i=0;i<7;i++){
      const tree = new THREE.Group();
      tree.position.set(x-w/2+((i*7)%w),0,z-d/2+((i*5)%d));
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18,0.24,2,6),material('#65513d'));
      trunk.position.y=1; tree.add(trunk);
      const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1.2,0),material('#45694e'));
      crown.position.y=2.7; tree.add(crown); group.add(tree);
    }
  }

  // Mission-giver NPC in the central district. All interactions are explicit E actions.
  const jack = new THREE.Group();
  jack.position.set(85,0,18.5);
  jack.userData.interactionId = gameVariables.characters.john.id;
  jack.userData.prompt = `HABLAR CON ${gameVariables.characters.john.displayName.toUpperCase()}`;
  jack.userData.lookAt = new THREE.Vector3(85,1.7,18.5);
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.36,0.9,4,8),material('#344b50'));
  body.position.y=0.92; jack.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.29,12,10),material('#d9ad86'));
  head.position.y=1.72; jack.add(head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.3,10,8),material('#493a31'));
  hair.scale.y=0.55; hair.position.y=1.91; jack.add(hair);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.58,0.05,8,32),new THREE.MeshBasicMaterial({color:'#e4a84c'}));
  ring.rotation.x=Math.PI/2; ring.position.y=0.08; jack.add(ring);
  group.add(jack); interactables.push(jack);

  return { group, interactables, colliders };
}

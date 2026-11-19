import { gameVariables } from '../data/variables';
import * as THREE from 'three';
import { buildCity } from '../world/City';
import { Player } from '../player/Player';
import { MissionManager } from '../missions/MissionManager';
import { UI } from '../ui/UI';
import { LIVERPOOL_LOCATIONS } from '../data/locations';

export class Game {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 180);
  renderer: THREE.WebGLRenderer;
  player: Player;
  missions: MissionManager;
  ui: UI;
  clock = new THREE.Clock();
  interactables: THREE.Object3D[] = [];
  started = false;

  private resize = () => {
    const width = window.visualViewport?.width ?? window.innerWidth;
    const height = window.visualViewport?.height ?? window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth <= 700 ? 1.25 : 1.7));
  };

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: window.innerWidth > 700,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth <= 700 ? 1.25 : 1.7));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = window.innerWidth > 700;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;

    this.scene.background = new THREE.Color('#9fb4b0');
    this.scene.fog = new THREE.Fog('#9fb4b0', 36, 105);
    this.camera.position.set(0, 5, 9);
    this.scene.add(new THREE.HemisphereLight('#fff1d4', '#48545a', 2.1));

    const sun = new THREE.DirectionalLight('#ffe0ad', 3.1);
    sun.position.set(-18, 30, 14);
    sun.castShadow = window.innerWidth > 700;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -35;
    sun.shadow.camera.right = 35;
    sun.shadow.camera.top = 35;
    sun.shadow.camera.bottom = -35;
    this.scene.add(sun);

    const city = buildCity();
    this.scene.add(city.group);
    this.interactables = city.interactables;
    this.player = new Player(this.scene, this.camera, city.colliders);
    this.missions = new MissionManager();
    this.ui = new UI(this.missions);

    this.ui.bindStart(() => {
      this.started = true;
      this.player.setEnabled(true);
    });
    this.ui.bindInteract(() => this.interact());
    this.ui.bindMap(() => this.ui.toggleMap());
    window.addEventListener('resize', this.resize);
    window.visualViewport?.addEventListener('resize', this.resize);
    this.player.setEnabled(false);
    this.animate();
  }

  private interact() {
    const target = this.player.nearest(this.interactables, 3.2);
    if (!target) return;

    const id = target.userData.interactionId as string;
    const lookAt = target.userData.lookAt as THREE.Vector3 | undefined;
    const targetPosition = lookAt ?? target.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 2, 0));
    this.player.lookAtInteraction(targetPosition);

    if (id === gameVariables.characters.john.id) {
      this.ui.openProtagonistDialogue();
      return;
    }

    if (this.missions.stage === 'to-shop' && id === this.missions.currentMission?.targetId) {
      this.missions.findInstrument();
      this.ui.notify('¡OBJETIVO CUMPLIDO! · REGRESA CON JACK');
    }

    const location = LIVERPOOL_LOCATIONS.find((place) => place.id === id);
    if (location) {
      this.ui.openLocation(location.id);
    }
  }

  private animate = () => {
    requestAnimationFrame(this.animate);
    const dt = Math.min(this.clock.getDelta(), 0.05);
    if (this.started) {
      this.player.update(dt);
      const target = this.player.nearest(this.interactables, 3.2);
      this.ui.setInteraction(target ? (target.userData.prompt as string || 'INTERACT') : '');
      this.ui.updateMap(this.player.getPosition(), this.missions.target, this.missions.stage);
      this.ui.refresh();
    }
    this.renderer.render(this.scene, this.camera);
  };
}

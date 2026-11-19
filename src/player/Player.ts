import * as THREE from 'three';
import { geoToWorld } from '../data/geography';

type MoveKey = 'forward' | 'back' | 'left' | 'right';

export class Player {
  group = new THREE.Group();
  private body: THREE.Mesh;
  private keys = new Set<string>();
  private enabled = false;
  private cameraYaw = 0;
  private pointerLockRequested = false;
  private running = false;
  private moveTouch = new Set<MoveKey>();
  private lookPointer: number | null = null;
  private lastX = 0;
  private interactionLook: THREE.Vector3 | null = null;
  private interactionLookUntil = 0;
  private readonly radius = 0.42;

  constructor(
    private scene: THREE.Scene,
    private camera: THREE.PerspectiveCamera,
    private colliders: THREE.Box3[]
  ) {
    const jacket = new THREE.MeshStandardMaterial({ color: '#d0a15f', flatShading: true });
    const skin = new THREE.MeshStandardMaterial({ color: '#d9ad86', flatShading: true });
    const trousers = new THREE.MeshStandardMaterial({ color: '#34434a', flatShading: true });
    const hair = new THREE.MeshStandardMaterial({ color: '#44372f', flatShading: true });

    this.body = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 0.82, 4, 8), jacket);
    this.body.position.y = 0.92;
    this.body.castShadow = true;
    this.group.add(this.body);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.27, 12, 10), skin);
    head.position.y = 1.72;
    head.castShadow = true;
    this.group.add(head);

    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.29, 10, 8), hair);
    cap.scale.y = 0.55;
    cap.position.y = 1.91;
    this.group.add(cap);

    const legs = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.52, 0.3), trousers);
    legs.position.set(0, 0.28, 0);
    this.group.add(legs);

    const wooltonStart = geoToWorld({ lat: 53.37597, lon: -2.86948 });
    this.group.position.set(wooltonStart.x + 2.5, 0, wooltonStart.z + 10);
    this.group.rotation.y = 0;
    scene.add(this.group);

    window.addEventListener('keydown', (event) => {
      const key = event.key.toLowerCase();
      this.keys.add(key);
      if (['w', 'a', 's', 'd', ' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        event.preventDefault();
      }
    });
    window.addEventListener('keyup', (event) => this.keys.delete(event.key.toLowerCase()));
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.moveTouch.clear();
      this.running = false;
    });

    const canvas = document.getElementById('game') as HTMLCanvasElement;
    // Desktop: click the game area once to capture the mouse, then move horizontally to orbit.
    canvas.addEventListener('click', () => {
      if (!this.enabled || window.innerWidth <= 700 || document.pointerLockElement === canvas) return;
      canvas.requestPointerLock?.();
    });
    document.addEventListener('pointerlockchange', () => {
      this.pointerLockRequested = document.pointerLockElement === canvas;
    });
    document.addEventListener('mousemove', (event) => {
      if (this.enabled && document.pointerLockElement === canvas) {
        this.cameraYaw -= event.movementX * 0.003;
      }
    });

    this.bindMobile();
  }

  private bindMobile() {
    document.querySelectorAll<HTMLButtonElement>('[data-move]').forEach((button) => {
      const key = button.dataset.move as MoveKey;
      const down = (event: PointerEvent) => {
        event.preventDefault();
        this.moveTouch.add(key);
        button.classList.add('active');
        try { button.setPointerCapture(event.pointerId); } catch { /* Pointer capture may be unavailable. */ }
      };
      const up = (event: PointerEvent) => {
        event.preventDefault();
        this.moveTouch.delete(key);
        button.classList.remove('active');
      };
      button.addEventListener('pointerdown', down);
      button.addEventListener('pointerup', up);
      button.addEventListener('pointercancel', up);
      button.addEventListener('lostpointercapture', up);
    });

    document.querySelectorAll<HTMLButtonElement>('[data-action="run"]').forEach((button) => {
      const down = (event: PointerEvent) => {
        event.preventDefault();
        this.running = true;
        button.classList.add('active');
        try { button.setPointerCapture(event.pointerId); } catch { /* Ignore unsupported capture. */ }
      };
      const up = () => {
        this.running = false;
        button.classList.remove('active');
      };
      button.addEventListener('pointerdown', down);
      button.addEventListener('pointerup', up);
      button.addEventListener('pointercancel', up);
      button.addEventListener('lostpointercapture', up);
    });

    const zone = document.getElementById('look-zone');
    if (!zone) return;
    zone.addEventListener('pointerdown', (event: PointerEvent) => {
      event.preventDefault();
      this.lookPointer = event.pointerId;
      this.lastX = event.clientX;
      try { zone.setPointerCapture(event.pointerId); } catch { /* Ignore unsupported capture. */ }
    });
    zone.addEventListener('pointermove', (event: PointerEvent) => {
      if (this.lookPointer !== event.pointerId) return;
      event.preventDefault();
      this.cameraYaw -= (event.clientX - this.lastX) * 0.008;
      this.lastX = event.clientX;
    });
    const endLook = (event: PointerEvent) => {
      if (this.lookPointer === event.pointerId) this.lookPointer = null;
    };
    zone.addEventListener('pointerup', endLook);
    zone.addEventListener('pointercancel', endLook);
    zone.addEventListener('lostpointercapture', endLook);
  }

  setEnabled(value: boolean) {
    this.enabled = value;
  }

  update(dt: number) {
    if (!this.enabled) return;

    const forward = this.keys.has('w') || this.keys.has('arrowup') || this.moveTouch.has('forward');
    const back = this.keys.has('s') || this.keys.has('arrowdown') || this.moveTouch.has('back');
    const left = this.keys.has('a') || this.keys.has('arrowleft') || this.moveTouch.has('left');
    const right = this.keys.has('d') || this.keys.has('arrowright') || this.moveTouch.has('right');
    const isRunning = this.keys.has('shift') || this.running;

    // Movement is camera-relative: W/S move along the view direction and A/D strafe.
    // Keep cameraYaw independent from the character's facing so held keys cannot add
    // another 90 degrees every frame (the previous source of spinning/incorrect movement).
    const localX = Number(right) - Number(left);
    const localZ = Number(back) - Number(forward);
    const movement = new THREE.Vector3(localX, 0, localZ);

    if (movement.lengthSq() > 0) {
      movement.normalize();
      const sin = Math.sin(this.cameraYaw);
      const cos = Math.cos(this.cameraYaw);
      const worldX = movement.x * cos + movement.z * sin;
      const worldZ = -movement.x * sin + movement.z * cos;
      const distance = (isRunning ? 7.2 : 4.2) * dt;
      this.moveWithCollisions(worldX * distance, worldZ * distance);

      // Face the direction of travel while the camera remains independently controllable.
      const heading = Math.atan2(worldX, -worldZ);
      this.group.rotation.y = heading;
      this.body.position.y = 0.92 + Math.sin(performance.now() * 0.012) * (isRunning ? 0.035 : 0.018);
    }

    this.group.position.x = THREE.MathUtils.clamp(this.group.position.x, -5650, 5650);
    this.group.position.z = THREE.MathUtils.clamp(this.group.position.z, -5000, 5000);
    this.updateCamera(dt);
  }

  private moveWithCollisions(deltaX: number, deltaZ: number) {
    const nextX = THREE.MathUtils.clamp(this.group.position.x + deltaX, -5650, 5650);
    if (!this.collides(nextX, this.group.position.z)) this.group.position.x = nextX;

    const nextZ = THREE.MathUtils.clamp(this.group.position.z + deltaZ, -5000, 5000);
    if (!this.collides(this.group.position.x, nextZ)) this.group.position.z = nextZ;
  }

  private collides(x: number, z: number) {
    return this.colliders.some((box) =>
      x > box.min.x - this.radius &&
      x < box.max.x + this.radius &&
      z > box.min.z - this.radius &&
      z < box.max.z + this.radius
    );
  }

  lookAtInteraction(target: THREE.Vector3) {
    const direction = target.clone().sub(this.group.position);
    direction.y = 0;
    if (direction.lengthSq() > 0.001) {
      direction.normalize();
      this.cameraYaw = Math.atan2(-direction.x, -direction.z);
      this.interactionLook = target.clone();
      this.interactionLookUntil = performance.now() + 1800;
    }
  }

  private updateCamera(dt: number) {
    // Camera orbit follows mouse/touch yaw; it does not get overwritten by strafing.
    const offset = new THREE.Vector3(
      Math.sin(this.cameraYaw) * 6.5,
      3.6,
      Math.cos(this.cameraYaw) * 6.5
    );
    const target = this.group.position.clone().add(new THREE.Vector3(0, 1.35, 0));
    const desired = target.clone().add(offset);
    this.camera.position.lerp(desired, 1 - Math.exp(-5 * dt));
    const focus = this.interactionLook && performance.now() < this.interactionLookUntil ? this.interactionLook : target;
    if (focus === target) this.interactionLook = null;
    this.camera.lookAt(focus);
  }

  nearest(objects: THREE.Object3D[], range: number) {
    let best: THREE.Object3D | null = null;
    let distance = range;
    for (const object of objects) {
      const current = this.group.position.distanceTo(object.getWorldPosition(new THREE.Vector3()));
      if (current < distance) {
        best = object;
        distance = current;
      }
    }
    return best;
  }

  getPosition() {
    return this.group.position;
  }
}

import * as THREE from 'three';

type MoveKey = 'forward' | 'back' | 'left' | 'right';

export class Player {
  group = new THREE.Group();
  private body: THREE.Mesh;
  private keys = new Set<string>();
  private enabled = false;
  private cameraYaw = 0;
  private running = false;
  private moveTouch = new Set<MoveKey>();
  private lookPointer: number | null = null;
  private lastX = 0;
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

    this.group.position.set(0, 0, 20);
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
    canvas.addEventListener('click', () => {
      if (this.enabled && window.innerWidth > 700) canvas.requestPointerLock?.();
    });
    document.addEventListener('mousemove', (event) => {
      if (document.pointerLockElement === canvas) this.cameraYaw -= event.movementX * 0.0025;
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
    const movement = new THREE.Vector3(Number(right) - Number(left), 0, Number(back) - Number(forward));

    if (movement.lengthSq() > 0) {
      movement.normalize();
      // Forward is always relative to the current camera/player heading.
      // The camera yaw is applied once here; camera follow uses the resulting player heading.
      const angle = this.group.rotation.y + this.cameraYaw + Math.atan2(movement.x, -movement.z);
      const distance = (isRunning ? 7.2 : 4.2) * dt;
      this.moveWithCollisions(Math.sin(angle) * distance, -Math.cos(angle) * distance);
      this.group.rotation.y = angle;
      this.cameraYaw = 0;
      this.body.position.y = 0.92 + Math.sin(performance.now() * 0.012) * (isRunning ? 0.035 : 0.018);
    }

    this.group.position.x = THREE.MathUtils.clamp(this.group.position.x, -27, 27);
    this.group.position.z = THREE.MathUtils.clamp(this.group.position.z, -32, 32);
    this.updateCamera(dt);
  }

  private moveWithCollisions(deltaX: number, deltaZ: number) {
    const nextX = THREE.MathUtils.clamp(this.group.position.x + deltaX, -27, 27);
    if (!this.collides(nextX, this.group.position.z)) this.group.position.x = nextX;

    const nextZ = THREE.MathUtils.clamp(this.group.position.z + deltaZ, -32, 32);
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

  private updateCamera(dt: number) {
    // The character faces local -Z, so the camera must stay behind it on +Z.
    // This keeps the visible camera direction and W/ArrowUp movement aligned.
    const offset = new THREE.Vector3(
      Math.sin(this.group.rotation.y) * 6.5,
      3.6,
      Math.cos(this.group.rotation.y) * 6.5
    );
    const target = this.group.position.clone().add(new THREE.Vector3(0, 1.35, 0));
    const desired = target.clone().add(offset);
    this.camera.position.lerp(desired, 1 - Math.exp(-5 * dt));
    this.camera.lookAt(target);
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

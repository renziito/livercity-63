import * as THREE from 'three';
export class Player {
  group=new THREE.Group();private body:THREE.Mesh;private keys=new Set<string>();private enabled=false;private cameraYaw=0;private running=false;private vehicle:THREE.Object3D|null=null;private moveTouch=new Set<string>();private lookPointer:number|null=null;private lastX=0;
  constructor(private scene:THREE.Scene,private camera:THREE.PerspectiveCamera){
    const jacket=new THREE.MeshStandardMaterial({color:'#d0a15f',flatShading:true}),skin=new THREE.MeshStandardMaterial({color:'#d9ad86',flatShading:true}),trousers=new THREE.MeshStandardMaterial({color:'#34434a',flatShading:true}),hair=new THREE.MeshStandardMaterial({color:'#44372f',flatShading:true});
    this.body=new THREE.Mesh(new THREE.CapsuleGeometry(.34,.82,4,8),jacket);this.body.position.y=.92;this.body.castShadow=true;this.group.add(this.body);
    const head=new THREE.Mesh(new THREE.SphereGeometry(.27,12,10),skin);head.position.y=1.72;head.castShadow=true;this.group.add(head);
    const cap=new THREE.Mesh(new THREE.SphereGeometry(.29,10,8),hair);cap.scale.y=.55;cap.position.y=1.91;this.group.add(cap);
    const legs=new THREE.Mesh(new THREE.BoxGeometry(.48,.52,.3),trousers);legs.position.set(0,.28,0);this.group.add(legs);
    this.group.position.set(0,0,20);this.group.rotation.y=Math.PI;scene.add(this.group);
    window.addEventListener('keydown',e=>{this.keys.add(e.key.toLowerCase());if(['w','a','s','d',' ','arrowup','arrowdown','arrowleft','arrowright'].includes(e.key.toLowerCase()))e.preventDefault();});
    window.addEventListener('keyup',e=>this.keys.delete(e.key.toLowerCase()));
    const canvas=document.getElementById('game')!;canvas.addEventListener('click',()=>{if(this.enabled&&innerWidth>700)canvas.requestPointerLock?.();});
    document.addEventListener('mousemove',e=>{if(document.pointerLockElement===canvas)this.cameraYaw-=e.movementX*.0025;});this.bindMobile();
  }
  private bindMobile(){
    document.querySelectorAll<HTMLButtonElement>('[data-move]').forEach(b=>{const key=b.dataset.move!;const down=(e:Event)=>{e.preventDefault();this.moveTouch.add(key);b.classList.add('active');};const up=(e:Event)=>{e.preventDefault();this.moveTouch.delete(key);b.classList.remove('active');};b.addEventListener('pointerdown',down);b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);b.addEventListener('pointerleave',up);});
    document.querySelectorAll<HTMLButtonElement>('[data-action="run"]').forEach(b=>{b.addEventListener('pointerdown',()=>this.running=true);['pointerup','pointercancel','pointerleave'].forEach(ev=>b.addEventListener(ev,()=>this.running=false));});
    const zone=document.getElementById('look-zone')!;zone.addEventListener('pointerdown',e=>{const p=e as PointerEvent;this.lookPointer=p.pointerId;this.lastX=p.clientX;zone.setPointerCapture(p.pointerId);});
    zone.addEventListener('pointermove',e=>{const p=e as PointerEvent;if(this.lookPointer===p.pointerId){this.cameraYaw-=(p.clientX-this.lastX)*.008;this.lastX=p.clientX;}});
    zone.addEventListener('pointerup',()=>this.lookPointer=null);zone.addEventListener('pointercancel',()=>this.lookPointer=null);
  }
  setEnabled(v:boolean){this.enabled=v;}
  update(dt:number){
    if(!this.enabled)return;
    const forward=this.keys.has('w')||this.keys.has('arrowup')||this.moveTouch.has('forward'),back=this.keys.has('s')||this.keys.has('arrowdown')||this.moveTouch.has('back'),left=this.keys.has('a')||this.keys.has('arrowleft')||this.moveTouch.has('left'),right=this.keys.has('d')||this.keys.has('arrowright')||this.moveTouch.has('right');
    this.running=this.keys.has('shift')||this.running;const v=new THREE.Vector3(Number(right)-Number(left),0,Number(back)-Number(forward));
    if(v.lengthSq()>0){v.normalize();const angle=Math.atan2(v.x,v.z)+this.cameraYaw,speed=this.running?7.2:4.2;this.group.position.x+=Math.sin(angle)*speed*dt;this.group.position.z+=Math.cos(angle)*speed*dt;this.group.rotation.y=angle;this.body.position.y=.92+Math.sin(performance.now()*.012)*(this.running?.035:.018);}
    this.group.position.x=THREE.MathUtils.clamp(this.group.position.x,-27,27);this.group.position.z=THREE.MathUtils.clamp(this.group.position.z,-32,32);this.updateCamera(dt);this.running=false;
  }
  private updateCamera(dt:number){const desiredYaw=this.group.rotation.y+this.cameraYaw,offset=new THREE.Vector3(Math.sin(desiredYaw+Math.PI)*6.5,3.6,Math.cos(desiredYaw+Math.PI)*6.5),target=this.group.position.clone().add(new THREE.Vector3(0,1.35,0)),desired=target.clone().add(offset);this.camera.position.lerp(desired,1-Math.exp(-5*dt));this.camera.lookAt(target);}
  nearest(objects:THREE.Object3D[],range:number){let best:THREE.Object3D|null=null,dist=range;for(const o of objects){const d=this.group.position.distanceTo(o.getWorldPosition(new THREE.Vector3()));if(d<dist){best=o;dist=d;}}return best;}
  toggleVehicle(vehicle:THREE.Object3D){if(this.vehicle){this.vehicle=null;return;}this.vehicle=vehicle;}
}

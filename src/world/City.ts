import { gameVariables } from '../data/variables';
import * as THREE from 'three';
const mat=(color:string,roughness=.92)=>new THREE.MeshStandardMaterial({color,roughness,flatShading:true});
function box(parent:THREE.Group,x:number,y:number,z:number,w:number,h:number,d:number,material:THREE.Material,cast=true){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y,z);m.castShadow=cast;m.receiveShadow=true;parent.add(m);return m;}
function building(parent:THREE.Group,x:number,z:number,w:number,d:number,h:number,color:string,seed:number){
 const g=new THREE.Group();g.position.set(x,0,z);parent.add(g);const wall=mat(color),dark=mat('#28373a'),glass=mat('#344d50'),trim=mat('#e8d6b5');box(g,0,h/2,0,w,h,d,wall);box(g,0,h+.12,0,w+.22,.24,d+.22,mat('#3e4543'));
 for(let floor=1;floor<h-.2;floor+=1.55)for(let col=-w/2+.65;col<w/2-.25;col+=1.15){box(g,col,floor,-d/2-.012,.48,.78,.05,glass,false);box(g,col,floor-.43,-d/2-.045,.58,.09,.13,trim,false);box(g,col,floor+.44,-d/2-.045,.58,.08,.13,trim,false);}
 box(g,0,1.05,-d/2-.04,1.05,1.9,.12,dark,false);if(seed%2===0)box(g,0,h+.4,0,w*.48,.42,d*.75,mat('#b34f3c'));return g;
}
function sign(parent:THREE.Group,x:number,y:number,z:number,textColor:string,label:string){const m=new THREE.Mesh(new THREE.BoxGeometry(2.8,.55,.13),mat('#243338'));m.position.set(x,y,z);parent.add(m);const c=document.createElement('canvas');c.width=512;c.height=96;const ctx=c.getContext('2d')!;ctx.fillStyle='#243338';ctx.fillRect(0,0,512,96);ctx.fillStyle=textColor;ctx.font='bold 42px Georgia';ctx.textAlign='center';ctx.fillText(label,256,63);const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;const p=new THREE.Mesh(new THREE.PlaneGeometry(2.65,.48),new THREE.MeshBasicMaterial({map:tex,transparent:true}));p.position.set(x,y,z+.075);parent.add(p);}
function marker(parent:THREE.Group,id:string,prompt:string,x:number,z:number,color:string){const g=new THREE.Group();g.position.set(x,0,z);g.userData.interactionId=id;g.userData.prompt=prompt;const ring=new THREE.Mesh(new THREE.TorusGeometry(.48,.045,8,32),new THREE.MeshBasicMaterial({color}));ring.rotation.x=Math.PI/2;ring.position.y=.08;g.add(ring);const dot=new THREE.Mesh(new THREE.ConeGeometry(.12,.35,8),new THREE.MeshBasicMaterial({color}));dot.position.y=.65;g.add(dot);parent.add(g);return g;}
export function buildCity(){
 const group=new THREE.Group(),interactables:THREE.Object3D[]=[];const ground=mat('#b7ad91'),road=mat('#414d4d'),pavement=mat('#c9bea4');
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(100,100),ground);floor.rotation.x=-Math.PI/2;floor.position.y=-.08;floor.receiveShadow=true;group.add(floor);
 const street=new THREE.Mesh(new THREE.PlaneGeometry(17,72),road);street.rotation.x=-Math.PI/2;street.position.set(0,0,-1);street.receiveShadow=true;group.add(street);
 for(const side of [-1,1]){const walk=new THREE.Mesh(new THREE.BoxGeometry(4,.18,70),pavement);walk.position.set(side*10,.02,-1);walk.receiveShadow=true;group.add(walk);}
 for(let z=-30;z<=29;z+=7){const dash=new THREE.Mesh(new THREE.BoxGeometry(.12,.025,3.1),mat('#d7c8a2'));dash.position.set(0,.025,z);group.add(dash);}
 const colors=['#c27c5c','#d2b88b','#8b9c91','#a8a08a','#b56c55','#c7c0a4'];let seed=1;
 for(const side of [-1,1])for(let z=-29;z<=25;z+=10){const w=5.2+(seed%3)*.5;building(group,side*16,z,w,7,7+(seed%3)*1.4,colors[seed%colors.length],seed++);}
 const club=building(group,-5,-12,6,7,5.8,'#9b5948',3);sign(club,0,4.5,-3.58,'#edb55e',gameVariables.places.cavernClub.displayName.toUpperCase());
 const shop=building(group,5,12,5.5,6,5.2,'#71877d',4);sign(shop,0,4.1,-3.08,'#e7bd71',gameVariables.places.recordShop.displayName.toUpperCase());
 interactables.push(marker(group,'club',`VISIT ${gameVariables.places.cavernClub.displayName.toUpperCase()}`,-5,-16,'#e7b45d'));
 interactables.push(marker(group,'recordshop',`VISIT ${gameVariables.places.recordShop.displayName.toUpperCase()}`,5,8,'#e7b45d'));
 const johnny=new THREE.Group();johnny.position.set(-1.5,0,-13.7);johnny.userData.interactionId=gameVariables.characters.john.id;johnny.userData.prompt=`TALK TO ${gameVariables.characters.john.displayName.toUpperCase()}`;
 const body=new THREE.Mesh(new THREE.CapsuleGeometry(.34,.85,4,8),mat('#344b50'));body.position.y=.9;body.castShadow=true;johnny.add(body);
 const head=new THREE.Mesh(new THREE.SphereGeometry(.29,12,10),mat('#d9ad86'));head.position.y=1.72;head.castShadow=true;johnny.add(head);
 const hair=new THREE.Mesh(new THREE.SphereGeometry(.3,10,8),mat('#493a31'));hair.scale.set(1,.55,1);hair.position.set(0,1.91,0);johnny.add(hair);
 const markerRing=new THREE.Mesh(new THREE.TorusGeometry(.55,.045,8,32),new THREE.MeshBasicMaterial({color:'#e4a84c'}));markerRing.rotation.x=Math.PI/2;markerRing.position.y=.08;johnny.add(markerRing);group.add(johnny);interactables.push(johnny);
 for(const [x,z,c] of [[-10,2,'#b45e43'],[10,-23,'#d1b16f']] as [number,number,string][]){const car=new THREE.Group();car.position.set(x,.12,z);box(car,0,.55,0,2.2,.65,4.1,mat(c));box(car,0,1.05,-.25,1.75,.65,2.1,mat('#38484a'));for(const wx of [-1.05,1.05])for(const wz of [-1.25,1.25]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.38,.38,.2,12),mat('#20282a'));wheel.rotation.z=Math.PI/2;wheel.position.set(wx,.38,wz);car.add(wheel);}group.add(car);}
 for(const side of [-1,1])for(let z=-26;z<25;z+=13){const pole=new THREE.Mesh(new THREE.CylinderGeometry(.07,.1,3.5,8),mat('#343d3c'));pole.position.set(side*11,1.75,z);group.add(pole);const lamp=new THREE.Mesh(new THREE.SphereGeometry(.2,8,8),mat('#f4d49a'));lamp.position.set(side*11,3.55,z);group.add(lamp);}
 return {group,interactables};
}

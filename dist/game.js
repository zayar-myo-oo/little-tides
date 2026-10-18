import * as THREE from './vendor/three.module.js';

// Little Tides: original procedural art, character, world, and audio.
const $ = id => document.getElementById(id);
const show = (id, visible=true) => $(id).classList.toggle('hidden', !visible);
const clamp = THREE.MathUtils.clamp, lerp = THREE.MathUtils.lerp;
const smooth = (a,b,x) => { const t=clamp((x-a)/(b-a),0,1); return t*t*(3-2*t); };
let seed=7319;
const rand = () => { seed=(seed*1664525+1013904223)>>>0; return seed/4294967296; };
const pick = a => a[Math.floor(rand()*a.length)];
const canvas=$('world');
let renderer;
try { renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,preserveDrawingBuffer:true}); }
catch { $('loading').innerHTML='<div class="loading-mark">≈</div><p>This little island needs WebGL. Please enable hardware acceleration or try another browser.</p>'; throw new Error('WebGL unavailable'); }
renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.28;
const scene=new THREE.Scene();scene.background=new THREE.Color('#bfcfb2');scene.fog=new THREE.FogExp2('#bfcfb2',.007);
const camera=new THREE.PerspectiveCamera(40,innerWidth/innerHeight,.1,220);
const hemi=new THREE.HemisphereLight('#fff6d4','#61795e',2.9);scene.add(hemi);
const sun=new THREE.DirectionalLight('#ffe5b5',3.5);sun.position.set(-25,45,30);sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-47;sun.shadow.camera.right=47;sun.shadow.camera.top=47;sun.shadow.camera.bottom=-47;sun.shadow.camera.far=130;sun.shadow.normalBias=.065;sun.shadow.bias=-.0002;sun.shadow.radius=4;scene.add(sun);
const materials={};
function mat(color,extra={}){const key=color+JSON.stringify(extra);return materials[key]??=new THREE.MeshStandardMaterial({color,roughness:1,flatShading:true,...extra});}
function mesh(geo,color,parent=scene,extra={}){const m=new THREE.Mesh(geo,mat(color,extra));m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function box(w,h,d,color,x=0,y=0,z=0,parent=scene){const m=mesh(new THREE.BoxGeometry(w,h,d),color,parent);m.position.set(x,y,z);return m;}
function ball(r,color,x,y,z,parent=scene,detail=1){const m=mesh(new THREE.IcosahedronGeometry(r,detail),color,parent);m.position.set(x,y,z);return m;}
function cyl(rt,rb,h,color,x,y,z,parent=scene,n=8){const m=mesh(new THREE.CylinderGeometry(rt,rb,h,n),color,parent);m.position.set(x,y,z);return m;}
function link(a,b,r,color,parent=scene){const va=new THREE.Vector3(...a),vb=new THREE.Vector3(...b);const m=cyl(r,r,va.distanceTo(vb),color,0,0,0,parent,6);m.position.copy(va).add(vb).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),vb.sub(va).normalize());return m;}
function ground(x,z){const r=Math.hypot(x,z);return .65+1.05*(1-smooth(18,30,r))-2.4*smooth(25,34,r)+10.5*Math.exp(-((x+10)**2/115+(z+10)**2/125))+.3*Math.sin(x*.27)*Math.sin(z*.25)*(1-smooth(23,31,r));}
const terrainGeometry=new THREE.PlaneGeometry(76,76,110,110);terrainGeometry.rotateX(-Math.PI/2);
const pos=terrainGeometry.attributes.position;
for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i);pos.setY(i,ground(x,z));}
const terrainFlat=terrainGeometry.toNonIndexed();terrainFlat.computeVertexNormals();
const colors=[];const tp=terrainFlat.attributes.position;
const grassColors=['#99af72','#9db276','#a0b578','#a2b67a','#97ae70'];
for(let i=0;i<tp.count;i+=3){const x=(tp.getX(i)+tp.getX(i+1)+tp.getX(i+2))/3,z=(tp.getZ(i)+tp.getZ(i+1)+tp.getZ(i+2))/3,y=ground(x,z);let color=new THREE.Color(y<.95?'#ddd2a2':y>9?pick(['#aab087','#b0b991','#a0ad7e']):pick(grassColors));for(let j=0;j<3;j++)colors.push(color.r,color.g,color.b);}
terrainFlat.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
const terrain=new THREE.Mesh(terrainFlat,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,flatShading:true}));terrain.receiveShadow=true;scene.add(terrain);
const seaGeo=new THREE.PlaneGeometry(360,360,90,90);seaGeo.rotateX(-Math.PI/2);
const sea=mesh(seaGeo,'#79aaa0',scene,{roughness:.38,metalness:.08});sea.castShadow=false;sea.position.y=-.15;
// Wide, translucent shoreline ripples and small surface glints.
const ripples=[];
for(let i=0;i<6;i++){const ring=new THREE.Mesh(new THREE.RingGeometry(30+i*1.3,30.12+i*1.3,100),new THREE.MeshBasicMaterial({color:'#d4e4c9',transparent:true,opacity:.17-i*.018,side:THREE.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.y=.03+i*.004;scene.add(ring);ripples.push(ring);}
const glints=new THREE.Group();scene.add(glints);
for(let i=0;i<170;i++){const x=(rand()-.5)*180,z=(rand()-.5)*180;if(Math.hypot(x,z)<33)continue;const m=mesh(new THREE.PlaneGeometry(.4+rand()*1.8,.045),'#d7e5cb',glints,{transparent:true,opacity:.38});m.rotation.x=-Math.PI/2;m.position.set(x,.09,z);m.castShadow=false;}
const colliders=[],sways=[],birds=[],clouds=[];
function stone(x,z,s=1){const m=ball(s,pick(['#a6afa0','#929f94','#b9bca2']),x,ground(x,z)+s*.3,z);m.scale.set(1.3,.7,1);m.rotation.set(rand(),rand()*6,rand());return m;}
function tree(x,z,s=1,type=0){const group=new THREE.Group();group.position.set(x,ground(x,z),z);group.scale.setScalar(s);scene.add(group);cyl(.16,.24,2.7,'#826e50',0,1.35,0,group);if(type===0){for(let j=0;j<3;j++){const cone=mesh(new THREE.ConeGeometry(1.55-j*.3,2.8-j*.25,7),['#577f57','#6f925f','#85a66b'][j],group);cone.position.y=2.4+j*1.1;}}else{ball(1.8,'#7b995e',0,3.2,0,group);ball(1.3,'#93ae6c',-.9,3.5,.2,group);ball(1.15,'#a0b876',.8,3.8,0,group);}sways.push({group,phase:rand()*6,amp:.015});colliders.push({x,z,r:s*.4});}
// Trails are laid as small overlapping matte patches, following the terrain.
function path(points,width=1.4){for(let k=0;k<points.length-1;k++){const a=new THREE.Vector2(...points[k]),b=new THREE.Vector2(...points[k+1]);const steps=Math.ceil(a.distanceTo(b)*3);for(let j=0;j<=steps;j++){const p=a.clone().lerp(b,j/steps);const patch=mesh(new THREE.CircleGeometry(width*(.9+rand()*.2),9),'#d1c59a');patch.rotation.x=-Math.PI/2;patch.position.set(p.x,ground(p.x,p.y)+.055,p.y);patch.castShadow=false;}}}
const summitPath=[[0,14],[-1,8],[-6,4],[-13,2],[-19,-3],[-19,-10],[-15,-15],[-10,-15],[-9,-10]];
path(summitPath,1.25);path([[-1,8],[5,8],[10,15],[10,25]],1.05);path([[5,8],[10,4],[13,-2],[16,-6]],.9);
function nearPath(x,z){return [...summitPath, [10,21],[10,25],[7,8],[11,3],[15,-4]].some(p=>Math.hypot(x-p[0],z-p[1])<3.2);}
for(let i=0;i<110;i++){let x=(rand()-.5)*58,z=(rand()-.5)*58;if(ground(x,z)<1.25||Math.hypot(x,z)>27||nearPath(x,z)||Math.hypot(x+9,z+10)<4.2||Math.hypot(x-9,z-2)<6)continue;tree(x,z,.55+rand()*.6,rand()>.5?1:0);}
for(let i=0;i<65;i++){let x=(rand()-.5)*61,z=(rand()-.5)*61;if(ground(x,z)>.25&&!nearPath(x,z))stone(x,z,.3+rand()*.8);}
// Instanced meadow tufts keep this world lightweight on phones.
const grassGeo=new THREE.ConeGeometry(.10,.55,3);grassGeo.translate(0,.24,0);
const blades=new THREE.InstancedMesh(grassGeo,mat('#8ba25e',{side:THREE.DoubleSide}),2200);scene.add(blades);blades.receiveShadow=true;
const dummy=new THREE.Object3D();let bladeCount=0;
for(let i=0;i<3300&&bladeCount<2200;i++){const x=(rand()-.5)*57,z=(rand()-.5)*57;if(ground(x,z)<1.1||nearPath(x,z))continue;dummy.position.set(x,ground(x,z),z);dummy.rotation.set((rand()-.5)*.4,rand()*6,(rand()-.5)*.4);dummy.scale.setScalar(.6+rand()*.8);dummy.updateMatrix();blades.setMatrixAt(bladeCount++,dummy.matrix);}blades.count=bladeCount;
for(let i=0;i<100;i++){const x=(rand()-.5)*48,z=(rand()-.5)*48;if(ground(x,z)<1.2||nearPath(x,z))continue;const y=ground(x,z);cyl(.025,.025,.35,'#789059',x,y+.17,z);ball(.13,pick(['#eee5b7','#d4a06f','#e4c8ac']),x,y+.4,z,scene,0);}
// The old dock.
const dock=new THREE.Group();scene.add(dock);
for(let j=0;j<29;j++)box(3.1,.17,.33,j%3?'#ad8b61':'#bd9c70',10,1.32,24+j*.39,dock);
for(const x of [8.65,11.35])for(const z of [25,29,33.8]){cyl(.12,.16,2.5,'#756a4c',x,.6,z,dock);ball(.15,'#bda17a',x,1.92,z,dock,0);}
box(.16,.19,11.3,'#7f7452',8.9,1.12,29.3,dock);box(.16,.19,11.3,'#7f7452',11.1,1.12,29.3,dock);
const buoy=cyl(.23,.2,.65,'#dca177',13.5,.25,35);cyl(.25,.25,.17,'#efe8c5',13.5,.35,35);
// A tiny cabin with an awning, chimney, a mailbox, and a porch.
const cabin=new THREE.Group();cabin.position.set(10,ground(10,1),1);cabin.rotation.y=-.28;scene.add(cabin);
box(4,3.1,3.5,'#e5d7af',0,1.55,0,cabin);box(4.4,.28,3.9,'#a8a388',0,.1,0,cabin);
const roof=mesh(new THREE.ConeGeometry(3.65,1.8,4),'#af7452',cabin);roof.position.y=3.65;roof.rotation.y=Math.PI/4;roof.scale.z=.9;
box(.85,1.85,.15,'#587b6c',.4,1,-1.8,cabin);ball(.065,'#d7ba75',.65,1.05,-1.91,cabin,0);
for(const x of [-1.2,1.35]){box(.7,.8,.12,'#f5edc9',x,1.9,-1.82,cabin);box(.05,.8,.14,'#8e9b7c',x,1.9,-1.9,cabin);box(.7,.05,.14,'#8e9b7c',x,1.9,-1.9,cabin);}
box(.55,1.6,.6,'#c3b994',1.1,4.0,.6,cabin);box(4.4,.14,2,'#a9a07c',0,.25,-2.4,cabin);
for(const x of [-1.8,1.8])cyl(.07,.07,2.4,'#8c8c63',x,1.4,-3.2,cabin);
const awning=box(4.2,.12,1.8,'#d9b77f',0,2.6,-2.7,cabin);awning.rotation.x=.15;
colliders.push({x:10,z:1,r:2.7});
const mailbox=new THREE.Group();mailbox.position.set(6.3,ground(6.3,5),5);scene.add(mailbox);cyl(.09,.12,1.2,'#8f7954',0,.6,0,mailbox);box(.65,.5,.8,'#718c6f',0,1.3,0,mailbox);box(.4,.06,.05,'#354f40',0,1.38,.42,mailbox);box(.05,.4,.12,'#c58f60',.38,1.4,0,mailbox);
// Lighthouse at the end of the winding uphill trail.
const lighthouse=new THREE.Group();lighthouse.position.set(-9,ground(-9,-10),-10);scene.add(lighthouse);
cyl(1.65,1.85,.4,'#b7b89b',0,.1,0,lighthouse,12);cyl(.95,1.35,6.5,'#e9e3c7',0,3.4,0,lighthouse,12);cyl(1.1,1.18,1.1,'#b87351',0,4,0,lighthouse,12);
cyl(1.2,1.2,.22,'#778c7b',0,6.6,0,lighthouse,12);cyl(.84,.84,1.1,'#b9ceba',0,7.2,0,lighthouse,8);for(let i=0;i<8;i++){const a=i/8*Math.PI*2;cyl(.045,.045,1.2,'#587267',Math.cos(a)*.85,7.2,Math.sin(a)*.85,lighthouse,5);}const cap=mesh(new THREE.ConeGeometry(1.3,.85,8),'#6d8b77',lighthouse);cap.position.y=8.2;ball(.12,'#d7c6a0',0,8.75,0,lighthouse);
box(.6,1.3,.15,'#6c8572',.1,.8,1.3,lighthouse);colliders.push({x:-9,z:-10,r:1.6});
const beacon=new THREE.PointLight('#ffe6a0',0,18);beacon.position.set(-9,lighthouse.position.y+7.3,-10);scene.add(beacon);
// Benches are rest spots; the camp is a second quiet place to sit.
function bench(x,z,rotation=0){const g=new THREE.Group();g.position.set(x,ground(x,z),z);g.rotation.y=rotation;scene.add(g);for(const xx of [-.85,.85])for(const zz of [-.3,.3])box(.12,.65,.12,'#6c7860',xx,.3,zz,g);box(2.2,.15,.95,'#b8976b',0,.65,0,g);box(2.2,.55,.12,'#b8976b',0,1.15,-.42,g);return g;}
bench(-13,-13,-.7);bench(-5,9,.2);
const camp=new THREE.Group();camp.position.set(-7,ground(-7,10),10);scene.add(camp);
for(let i=0;i<9;i++){const a=i/9*Math.PI*2;ball(.21,'#a8aa8c',Math.cos(a)*.68,.12,Math.sin(a)*.68,camp,0);}link([-.5,.13,-.2],[.5,.13,.2],.12,'#8a6d48',camp);link([.4,.18,-.4],[-.4,.18,.4],.12,'#8a6d48',camp);
const flame=mesh(new THREE.ConeGeometry(.3,.8,5),'#edb168',camp,{emissive:'#eb994a',emissiveIntensity:.6});flame.position.y=.6;const fireLight=new THREE.PointLight('#ffc175',1.2,7);fireLight.position.set(-7,camp.position.y+1,10);scene.add(fireLight);
function sign(x,z,text,rotation=0){const g=new THREE.Group();g.position.set(x,ground(x,z),z);g.rotation.y=rotation;scene.add(g);cyl(.07,.09,1.3,'#9a8560',0,.65,0,g);const c=document.createElement('canvas');c.width=512;c.height=128;const cx=c.getContext('2d');cx.fillStyle='#dcd2ad';cx.fillRect(0,0,512,128);cx.fillStyle='#50624a';cx.font='500 36px Georgia';cx.textAlign='center';cx.fillText(text,256,78);const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;const board=new THREE.Mesh(new THREE.BoxGeometry(2.8,.7,.12),[mat('#c0b287'),mat('#c0b287'),mat('#c0b287'),mat('#c0b287'),new THREE.MeshBasicMaterial({map:tex}),mat('#c0b287')]);board.position.y=1.4;g.add(board);}
sign(7,20,'OLD DOCK  →',-.2);sign(-3,5,'←  THE SLOW WAY',.2);sign(-16,-13,'ALMOST THERE',.7);
// Pip: a small, original traveler, modeled entirely from simple shapes.
function traveler(coat='#dba56d',hatColor='#d5c596',scale=1){const g=new THREE.Group(),body=new THREE.Group();g.add(body);g.scale.setScalar(scale);
 const torso=mesh(new THREE.CylinderGeometry(.36,.47,.9,8),coat,body);torso.position.y=.98;
 const head=ball(.34,'#e6b99a',0,1.73,0,body,2);head.scale.set(1,.98,.9);
 ball(.085,'#d8a98a',-.32,1.73,0,body);ball(.085,'#d8a98a',.32,1.73,0,body);
 const brim=cyl(.7,.73,.095,hatColor,0,2.02,0,body,14);brim.rotation.z=-.045;cyl(.39,.47,.35,hatColor,0,2.2,0,body,12);cyl(.45,.45,.08,'#6c8974',0,2.08,0,body,12);
 for(const x of [-.12,.12]){ball(.033,'#3a4134',x,1.76,.3,body,1);}ball(.047,'#d89d79',0,1.67,.325,body,1);
 const scarf=mesh(new THREE.TorusGeometry(.28,.09,5,10),'#6f9784',body);scarf.rotation.x=Math.PI/2;scarf.position.y=1.47;box(.16,.35,.09,'#6f9784',.17,1.27,.34,body);
 const backpack=box(.58,.65,.26,'#6e8776',0,1.02,-.39,body);box(.45,.27,.1,'#91a18a',0,.87,-.56,body);box(.32,.12,.32,'#d8c69e',0,1.4,-.44,body);
 const arms=[],legs=[];
 for(const side of [-1,1]){const arm=new THREE.Group();arm.position.set(side*.43,1.28,0);body.add(arm);const sleeve=cyl(.14,.12,.59,coat,0,-.22,0,arm);ball(.115,'#e6b99a',0,-.57,0,arm);arms.push(arm);const leg=new THREE.Group();leg.position.set(side*.21,.58,0);body.add(leg);box(.24,.45,.25,'#536f63',0,-.16,0,leg);const shoe=box(.28,.17,.4,'#70634d',0,-.43,.07,leg);legs.push(leg);}
 const rod=new THREE.Group();rod.position.set(.02,-.5,0);arms[1].add(rod);link([0,0,0],[0,2.6,.8],.022,'#80674c',rod);rod.visible=false;
 return {g,body,arms,legs,rod};}
const pip=traveler();scene.add(pip.g);pip.g.position.set(0,ground(0,14)+.02,14);pip.g.rotation.y=Math.PI;
const keeper=traveler('#91a18a','#b9b7a0',.92);keeper.g.position.set(5.5,ground(5.5,6),6);keeper.g.rotation.y=1.1;scene.add(keeper.g);
// Small, slow-life details: gulls, drifting clouds, and floating motes.
for(let i=0;i<7;i++){const g=new THREE.Group();for(const side of [-1,1]){const w=box(.7,.055,.24,'#f1edda',side*.3,0,0,g);w.rotation.z=side*.25;}scene.add(g);birds.push({g,phase:rand()*6,r:18+rand()*17,y:15+rand()*8});}
for(let i=0;i<9;i++){const g=new THREE.Group();for(let j=0;j<4;j++){const b=ball(2+rand()*1.5,'#e7e9d4',j*2,rand(),0,g,1);b.scale.set(1,.45,.7);b.castShadow=false;}g.position.set((rand()-.5)*130,23+rand()*12,(rand()-.5)*100-15);scene.add(g);clouds.push(g);}
const moteGeo=new THREE.BufferGeometry(),motePositions=[];for(let i=0;i<65;i++)motePositions.push((rand()-.5)*50,2+rand()*5,(rand()-.5)*50);moteGeo.setAttribute('position',new THREE.Float32BufferAttribute(motePositions,3));const motes=new THREE.Points(moteGeo,new THREE.PointsMaterial({color:'#fff0b4',size:.09,transparent:true,opacity:.5}));scene.add(motes);

// Batch stationary geometry by material. Moving trees and actors stay independent.
function batchStatic(parent,excluded=new Set()){
 const groups=new Map();parent.updateMatrixWorld(true);
 for(const child of [...parent.children]){if(!child.isMesh||child.isInstancedMesh||Array.isArray(child.material)||excluded.has(child)||child.geometry.attributes.color)continue;const key=child.material.uuid+':'+child.castShadow+':'+child.receiveShadow;const list=groups.get(key)||[];list.push(child);groups.set(key,list);}
 for(const list of groups.values()){if(list.length<2)continue;const positions=[],normals=[],uvs=[];for(const child of list){child.updateMatrix();const g=(child.geometry.index?child.geometry.toNonIndexed():child.geometry.clone()).applyMatrix4(child.matrix);const p=g.attributes.position,n=g.attributes.normal,u=g.attributes.uv;for(let i=0;i<p.count;i++){positions.push(p.getX(i),p.getY(i),p.getZ(i));normals.push(n?.getX(i)||0,n?.getY(i)||0,n?.getZ(i)||0);uvs.push(u?.getX(i)||0,u?.getY(i)||0);}g.dispose();parent.remove(child);}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geo.computeBoundingSphere();const m=new THREE.Mesh(geo,list[0].material);m.castShadow=list[0].castShadow;m.receiveShadow=list[0].receiveShadow;parent.add(m);}
}
batchStatic(scene,new Set([sea,terrain,buoy]));batchStatic(cabin);batchStatic(dock);batchStatic(lighthouse);batchStatic(mailbox);batchStatic(camp,new Set([flame]));batchStatic(glints);

const species=[
 {name:'Silver Sprat',color:'#9ebeb8',fin:'#758f83',description:'A little flash of silver, with a whole ocean to explore.',min:9,max:17},
 {name:'Peach Perch',color:'#dda484',fin:'#b97962',description:'Sunset-colored fins and a wonderfully unhurried attitude.',min:17,max:29},
 {name:'Sage Minnow',color:'#a9b786',fin:'#7c9064',description:'A shy little neighbor who prefers the quieter currents.',min:7,max:13},
 {name:'Golden Bream',color:'#d8bc75',fin:'#a58c54',description:'Like a small piece of afternoon sunlight, just passing through.',min:23,max:38},
 {name:'Moon Carp',color:'#b7b9ca',fin:'#8a8caa',description:'A dreamer from the deep. Some say it follows the moon.',min:30,max:49},
 {name:'Blue Lantern',color:'#86aeb6',fin:'#5d8f9a',description:'Rare as a perfect quiet moment. Worth remembering, never keeping.',min:14,max:25}
];
function fishSVG(f){return `<svg viewBox="0 0 220 115" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M156 56L204 26Q198 55 207 85Z" fill="${f.fin}"/><path d="M78 32Q105 2 130 32L125 49Z" fill="${f.fin}"/><path d="M85 80Q105 111 130 79Z" fill="${f.fin}"/><ellipse cx="101" cy="57" rx="66" ry="34" fill="${f.color}"/><path d="M50 68Q100 93 154 67Q130 96 80 86Z" fill="#fff" opacity=".17"/><path d="M107 54Q123 64 107 77" fill="${f.fin}"/><path d="M71 36Q58 57 72 78" fill="none" stroke="${f.fin}" stroke-width="2"/><circle cx="52" cy="50" r="5" fill="#faf5df"/><circle cx="51" cy="50" r="2.7" fill="#334d43"/><path d="M35 62l7 1" stroke="#59796c" stroke-width="2" stroke-linecap="round"/><path d="M85 43l6 4m9-6 6 4m9-4 6 4m-30 9 6 4m9-4 6 4m9-4 6 4" stroke="#fff" opacity=".22" fill="none" stroke-width="2"/></svg>`;}
let saved={fish:{},released:0,places:[],day:0};
try{const s=JSON.parse(localStorage.getItem('little-tides-v1'));if(s&&typeof s==='object'){saved.fish=s.fish&&typeof s.fish==='object'?s.fish:{};saved.released=Math.max(0,Number(s.released)||0);saved.places=Array.isArray(s.places)?s.places:[];saved.day=clamp(Number(s.day)||0,0,2);}}catch{}
const save=()=>{try{localStorage.setItem('little-tides-v1',JSON.stringify(saved));}catch{}};
function updateJournal(){const count=species.filter(f=>saved.fish[f.name]).length;$('fish-count').textContent=`${count} / 6`;$('species-grid').innerHTML=species.map(f=>{const seen=saved.fish[f.name];return `<article class="species ${seen?'':'unknown'}">${fishSVG(f)}<h3>${seen?f.name:'An unknown friend'}</h3><p>${seen?`Longest encounter: ${seen.best} cm`:'Waiting out in the blue'}</p></article>`;}).join('');$('journal-footer').textContent=`${saved.released} fish returned to the sea · ${count} of 6 little encounters remembered`;
 for(const name of ['dock','summit','release']){$('check-'+name).classList.toggle('done',saved.places.includes(name));$('check-'+name).textContent=saved.places.includes(name)?'✓':'';}}
updateJournal();
let toastTimer;
function toast(text){$('toast').textContent=text;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),4300);}
function discover(name,text){if(!saved.places.includes(name)){saved.places.push(name);save();updateJournal();toast(text);audio.chime();}}
const state={playing:false,modal:null,fishing:'off',fishTime:0,biteAt:0,biteEnd:0,reel:0,caught:null,seated:false,photo:false,zoom:23,yaw:.65,pitch:.63,vertical:0,grounded:true,speed:0,t:0,lastInteraction:0};
const keys=new Set();let stickX=0,stickY=0,jumpRequested=false;
const cameraTarget=new THREE.Vector3(0,3,0),cameraGoal=new THREE.Vector3(),lookGoal=new THREE.Vector3();
const float=ball(.11,'#e6a174',10,.15,38);float.visible=false;
const lineGeo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3()]);
const fishingLine=new THREE.Line(lineGeo,new THREE.LineBasicMaterial({color:'#f1e8ca',transparent:true,opacity:.75}));scene.add(fishingLine);fishingLine.visible=false;
const fishRing=new THREE.Mesh(new THREE.RingGeometry(.32,.36,32),new THREE.MeshBasicMaterial({color:'#eef1cf',side:THREE.DoubleSide,transparent:true,opacity:.6}));fishRing.rotation.x=-Math.PI/2;fishRing.visible=false;scene.add(fishRing);
const spots={dock:new THREE.Vector3(10,1.45,33.3),summit:new THREE.Vector3(-13,ground(-13,-13),-13),camp:new THREE.Vector3(-5,ground(-5,9),9),keeper:keeper.g.position};
function onDock(x,z){return Math.abs(x-10)<1.48&&z>23.6&&z<35.05;}
function walkHeight(x,z){return onDock(x,z)?Math.max(1.42,ground(x,z)):ground(x,z);}
function nearby(){const p=pip.g.position;if(p.distanceTo(spots.dock)<3.9)return 'dock';if(p.distanceTo(spots.summit)<3.3)return 'summit';if(p.distanceTo(spots.camp)<2.5)return 'camp';if(p.distanceTo(spots.keeper)<2.7)return 'keeper';return null;}
function setPrompt(){if(!state.playing||state.modal||state.fishing!=='off'){show('prompt',false);return;}const n=nearby();show('prompt',!!n);if(n)$('prompt').querySelector('span').textContent=state.seated?'Get up, when you’re ready':{dock:'Cast a line into the blue',summit:'Sit. You’ve come a little way.',camp:'Rest by the campfire',keeper:'Say hello to Moss'}[n];}
function start(){if(state.playing)return;state.playing=true;document.body.classList.add('playing');show('welcome',false);show('intro-postcard',false);show('objectives');show('controls');if(matchMedia('(pointer:coarse), (max-width:700px)').matches)show('mobile-controls');canvas.focus();toast('Welcome, Pip. Follow the sandy path to the old dock.');}
$('start').onclick=start;$('home').onclick=e=>{e.preventDefault();if(state.fishing!=='off')cancelFishing();state.playing=false;state.seated=false;document.body.classList.remove('playing');show('welcome');show('intro-postcard');show('objectives',false);show('controls',false);show('mobile-controls',false);show('prompt',false);};
let previousFocus=null;
function openModal(id){if(state.fishing!=='off')return;previousFocus=document.activeElement;state.modal=id;keys.clear();show(id);$(id).querySelector('button')?.focus();setPrompt();if(id==='journal')updateJournal();}
function closeModal(){if(state.modal==='catch')return;if(state.modal)show(state.modal,false);state.modal=null;(previousFocus||canvas).focus();}
$('journal-button').onclick=()=>openModal('journal');$('help').onclick=()=>openModal('help-modal');
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=closeModal);
for(const id of ['journal','help-modal'])$(id).addEventListener('click',e=>{if(e.target===$(id))closeModal();});
document.querySelectorAll('[data-spot]').forEach(b=>b.onclick=()=>toast({dock:'The old dock is on the southeast shore. Follow the wooden signs.',summit:'The sandy path winds uphill to the lighthouse. Take the slow way.',release:'At the end of the dock, press E to cast a line.'}[b.dataset.spot]));
function interact(){if(!state.playing)return;if(state.modal)return;if(state.fishing!=='off'){fishAction();return;}if(state.seated){state.seated=false;toast('A little lighter. Ready to wander.');return;}const n=nearby();if(n==='dock')beginFishing();else if(n==='keeper'){toast(pick(['Moss: “The fish don’t keep appointments. You shouldn’t either.”','Moss: “There’s a bench up by the lighthouse. Best view on the island.”','Moss: “Catch a little company. Then let it find its way home.”','Moss: “Six kinds of fish call this bay home. Have you met them all?”']));keeper.g.lookAt(pip.g.position.x,keeper.g.position.y,pip.g.position.z);audio.chime();}else if(n==='summit'||n==='camp'){state.seated=true;pip.g.position.copy(spots[n]);pip.g.position.y+=.65;pip.g.rotation.y=n==='camp'?Math.PI:.8;if(n==='summit'){state.yaw=-2.4;state.pitch=.57;state.zoom=32;}toast(n==='summit'?'There you are. The whole island, and a little room to breathe.':'Stay a while. Even the fire is taking its time.');}}
$('prompt').onclick=interact;$('mobile-action').onclick=interact;$('mobile-jump').onpointerdown=e=>{e.preventDefault();jumpRequested=true;};
function beginFishing(){state.seated=false;state.fishing='waiting';state.fishTime=state.t;state.biteAt=state.t+3.5+Math.random()*4;pip.g.position.set(10,1.44,33.4);pip.g.rotation.y=0;pip.rod.visible=true;pip.arms[1].rotation.x=-.95;float.visible=fishingLine.visible=fishRing.visible=true;float.position.set(10+Math.random()*.7,.12,38+Math.random()*1.2);fishRing.position.set(float.position.x,.06,float.position.z);show('fishing');show('prompt',false);show('reel-track',false);$('fishing-label').textContent='A MOMENT OF STILLNESS';$('fishing-title').textContent='Let the water do its thing.';$('fishing-copy').textContent='Watch your float. Press E when it dips!';$('fishing-action').textContent='Waiting for a nibble…';$('fishing-action').disabled=true;audio.splash();}
function cancelFishing(){state.fishing='off';pip.rod.visible=false;float.visible=fishingLine.visible=fishRing.visible=false;show('fishing',false);show('reel-track',false);pip.arms[1].rotation.x=0;}
function fishAction(){if(state.fishing==='bite'){state.fishing='reeling';state.fishTime=state.t;show('reel-track');$('fishing-label').textContent='EASY DOES IT';$('fishing-title').textContent='A little give. A little take.';$('fishing-copy').textContent='Press E or tap Reel when the marker is in the green.';$('fishing-action').textContent='Reel gently';audio.chime();}else if(state.fishing==='reeling'){if(state.reel>=.35&&state.reel<=.65)landFish();else{state.fishing='miss';$('fishing-title').textContent='A little too eager.';$('fishing-copy').textContent='Your new friend slipped away. There’s always another moment.';$('fishing-action').textContent='Cast again';show('reel-track',false);audio.splash();}}else if(state.fishing==='miss'){cancelFishing();beginFishing();}}
$('fishing-action').onclick=fishAction;$('cancel-fishing').onclick=cancelFishing;
function landFish(){const roll=Math.random();const index=roll<.27?0:roll<.50?1:roll<.71?2:roll<.87?3:roll<.96?4:5;const f=species[index];const length=Math.round(f.min+Math.random()*(f.max-f.min));state.caught={f,length};cancelFishing();state.modal='catch';$('fish-art').innerHTML=fishSVG(f);$('catch-title').textContent=f.name;$('catch-description').textContent=f.description;$('catch-length').textContent=length+' cm of little wonder';$('new-species').textContent=saved.fish[f.name]?'A FAMILIAR LITTLE FRIEND':'NEW FIELD NOTE';show('catch');$('release').focus();audio.chime();}
$('release').onclick=()=>{if(!state.caught)return;const {f,length}=state.caught;const old=saved.fish[f.name];saved.fish[f.name]={best:Math.max(old?.best||0,length),count:(old?.count||0)+1};saved.released++;show('catch',false);state.modal=null;state.caught=null;discover('release','A small kindness. Your fish is home again. ♡');save();updateJournal();audio.splash();toast(`${f.name} swims free. A memory stays in your field notes.`);canvas.focus();};

// Soft, original lo-fi audio: no recordings, accounts, or remote audio assets.
const audio={ctx:null,on:false,timer:null,step:0,next:0,master:null,noise:null,
 init(){if(this.ctx)return;const C=window.AudioContext||window.webkitAudioContext;if(!C){toast('Audio is unavailable in this browser.');return;}this.ctx=new C();this.master=this.ctx.createGain();this.master.gain.value=.4;this.master.connect(this.ctx.destination);const buffer=this.ctx.createBuffer(1,this.ctx.sampleRate*3,this.ctx.sampleRate);const a=buffer.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=(Math.random()*2-1)*.4;this.noise=buffer;},
 tone(freq,t,dur,volume=.1,type='sine'){if(!this.ctx||!this.on)return;const o=this.ctx.createOscillator(),g=this.ctx.createGain(),filter=this.ctx.createBiquadFilter();o.type=type;o.frequency.value=freq;filter.type='lowpass';filter.frequency.value=1400;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume,t+.025);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(filter);filter.connect(g);g.connect(this.master);o.start(t);o.stop(t+dur+.05);},
 hiss(t,dur,volume,freq){if(!this.ctx||!this.on)return;const s=this.ctx.createBufferSource(),g=this.ctx.createGain(),f=this.ctx.createBiquadFilter();s.buffer=this.noise;f.type='bandpass';f.frequency.value=freq;f.Q.value=.8;g.gain.setValueAtTime(volume,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);s.connect(f);f.connect(g);g.connect(this.master);s.start(t);s.stop(t+dur);},
 schedule(){if(!this.on)return;const c=this.ctx;while(this.next<c.currentTime+.25){const t=this.next,s=this.step%32;const chords=[[130.81,164.81,196,246.94],[110,130.81,164.81,196],[87.31,110,130.81,164.81],[98,123.47,146.83,174.61]];const chord=chords[Math.floor(s/8)];if(s%8===0){chord.forEach((f,i)=>this.tone(f*2,t+i*.026,2.7,.045,'triangle'));this.tone(chord[0]/2,t,1.3,.14);}if(s%4===0)this.tone(58,t,.19,.16);if(s%4===2)this.hiss(t,.15,.08,1500);if(s%2===0)this.hiss(t,.055,.035,6200);if([3,7,11,14,19,23,27,30].includes(s))this.tone(chord[(s+1)%4]*4,t,.6,.038,'sine');if(s%8===0)this.hiss(t,2.9,.025,450);this.step++;this.next+=60/74/2;}},
 async toggle(){this.init();if(!this.ctx)return;await this.ctx.resume();this.on=!this.on;if(this.on){this.master.gain.setTargetAtTime(.4,this.ctx.currentTime,.15);this.next=this.ctx.currentTime+.08;this.schedule();this.timer=setInterval(()=>this.schedule(),90);toast('Lo-fi on. A small soundtrack for doing very little.');}else{clearInterval(this.timer);this.master.gain.setTargetAtTime(0,this.ctx.currentTime,.15);}updateSound();},
 chime(){if(this.on){const t=this.ctx.currentTime;this.tone(523.25,t,.6,.12);this.tone(659.25,t+.13,.8,.09);}},
 splash(){if(this.on)this.hiss(this.ctx.currentTime,.7,.2,650);}
};
function updateSound(){$('sound').querySelector('span').style.display=audio.on?'none':'';$('sound').setAttribute('aria-label',audio.on?'Turn off lo-fi music':'Turn on lo-fi music');$('sound').setAttribute('aria-pressed',String(audio.on));}
$('sound').onclick=()=>audio.toggle();
const palettes=[{name:'Golden afternoon',sky:'#bfd1c0',water:'#659e9d',light:'#ffe4bc',intensity:2.7,hemi:2.25,icon:'☀',exposure:1.08},{name:'Peach-hour daydream',sky:'#d6b6a1',water:'#8baba5',light:'#ffb180',intensity:2.5,hemi:1.9,icon:'◒',exposure:1.08},{name:'Blue-hour hush',sky:'#718a9d',water:'#526e83',light:'#d4d4ef',intensity:1.2,hemi:1.4,icon:'☾',exposure:1.05}];
function setDay(index){saved.day=index;const p=palettes[index];$('time-label').textContent=p.name;$('sun-icon').textContent=p.icon;$('day-button').textContent=p.icon;document.body.classList.toggle('night',index===2);save();}
setDay(saved.day);$('day-button').onclick=()=>{setDay((saved.day+1)%3);toast(palettes[saved.day].name+'. Take it all in.');};
$('photo-button').onclick=()=>{if(state.modal||state.photo)return;state.photo=true;document.body.classList.add('photograph');show('photo-frame');setTimeout(()=>{try{renderer.render(scene,camera);const c=document.createElement('canvas');c.width=canvas.width;c.height=canvas.height;const ctx=c.getContext('2d');ctx.drawImage(canvas,0,0);ctx.strokeStyle='#fff6d9aa';ctx.lineWidth=2;ctx.strokeRect(30,30,c.width-60,c.height-60);ctx.fillStyle='#fff8df';ctx.font=`${Math.round(c.width/40)}px Georgia`;ctx.fillText('little tides',60,c.height-65);ctx.font=`${Math.round(c.width/110)}px Arial`;ctx.fillText('A MOMENT TO KEEP',63,c.height-42);const a=document.createElement('a');a.download='little-tides-postcard.png';a.href=c.toDataURL('image/png');a.click();toast('A little piece of the island, saved as a postcard.');}catch{toast('Your browser could not save this postcard.');}state.photo=false;document.body.classList.remove('photograph');show('photo-frame',false);},250);};

window.addEventListener('keydown',e=>{if(state.modal&&e.key==='Tab'){const buttons=[...$(state.modal).querySelectorAll('button:not([disabled])')];if(buttons.length){e.preventDefault();let n=buttons.indexOf(document.activeElement);n=(n+(e.shiftKey?-1:1)+buttons.length)%buttons.length;buttons[n].focus();}return;}const key=e.key.toLowerCase();if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(key))e.preventDefault();if(e.repeat){if(['e',' ','j','m','escape'].includes(key))return;}keys.add(key);if(key==='escape'){if(state.fishing!=='off')cancelFishing();else closeModal();}if(state.modal)return;if(key==='e')interact();if(key===' '&&!state.fishing.startsWith('wait'))jumpRequested=true;if(key==='j')openModal('journal');if(key==='m')audio.toggle();});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>{keys.clear();stickX=stickY=0;});
document.addEventListener('visibilitychange',()=>{keys.clear();if(document.hidden&&audio.ctx)audio.ctx.suspend();else if(audio.on)audio.ctx?.resume();});
let drag=null;
canvas.addEventListener('pointerdown',e=>{drag={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;state.yaw-=(e.clientX-drag.x)*.006;state.pitch=clamp(state.pitch+(e.clientY-drag.y)*.003,.28,1.1);drag.x=e.clientX;drag.y=e.clientY;});
canvas.addEventListener('pointerup',()=>drag=null);canvas.addEventListener('pointercancel',()=>drag=null);
canvas.addEventListener('wheel',e=>{e.preventDefault();state.zoom=clamp(state.zoom+e.deltaY*.016,12,40);},{passive:false});
let joystickId=null;
$('joystick').addEventListener('pointerdown',e=>{joystickId=e.pointerId;$('joystick').setPointerCapture(e.pointerId);moveStick(e);});
function moveStick(e){if(joystickId!==e.pointerId)return;const r=$('joystick').getBoundingClientRect(),dx=e.clientX-r.left-50,dy=e.clientY-r.top-50;const l=Math.max(35,Math.hypot(dx,dy));stickX=dx/l;stickY=dy/l;$('stick').style.transform=`translate(${stickX*29}px,${stickY*29}px)`;}
$('joystick').addEventListener('pointermove',moveStick);for(const event of ['pointerup','pointercancel'])$('joystick').addEventListener(event,()=>{joystickId=null;stickX=stickY=0;$('stick').style.transform='';});
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));if(state.playing)show('mobile-controls',matchMedia('(pointer:coarse), (max-width:700px)').matches);});

let lastTime=performance.now(),lastUI=0;
function update(dt){state.t+=dt;const t=state.t,p=pip.g.position;
 const pal=palettes[saved.day];scene.background.lerp(new THREE.Color(pal.sky),dt*.65);scene.fog.color.copy(scene.background);sea.material.color.lerp(new THREE.Color(pal.water),dt*.65);sun.color.lerp(new THREE.Color(pal.light),dt*.65);sun.intensity=lerp(sun.intensity,pal.intensity,dt*.65);hemi.intensity=lerp(hemi.intensity,pal.hemi,dt*.65);renderer.toneMappingExposure=lerp(renderer.toneMappingExposure,pal.exposure,dt*.65);beacon.intensity=lerp(beacon.intensity,saved.day===2?4:0,dt);fireLight.intensity=(saved.day===2?3.5:1.1)+Math.sin(t*9)*.15;
 for(const s of sways){s.group.rotation.z=Math.sin(t*.8+s.phase)*s.amp;s.group.rotation.x=Math.cos(t*.6+s.phase)*s.amp*.6;}
 for(const b of birds){const a=t*.08+b.phase;b.g.position.set(Math.cos(a)*b.r,b.y+Math.sin(t+b.phase)*.5,Math.sin(a)*b.r);b.g.rotation.y=-a;b.g.children.forEach((w,i)=>w.rotation.z=(i===0?-1:1)*(.2+Math.sin(t*3+b.phase)*.25));}
 clouds.forEach((c,i)=>{c.position.x+=dt*(.13+i*.012);if(c.position.x>90)c.position.x=-90;});glints.position.y=Math.sin(t*.4)*.025;glints.children.forEach((g,i)=>{g.material.opacity=.19+Math.sin(t+i)*.08;});ripples.forEach((r,i)=>{r.scale.setScalar(1+Math.sin(t*.45+i*.7)*.012);});buoy.position.y=.25+Math.sin(t*1.8)*.1;buoy.rotation.z=Math.sin(t*1.2)*.1;flame.scale.set(1+Math.sin(t*8)*.12,1+Math.cos(t*10)*.16,1);motes.rotation.y=t*.009;motes.material.opacity=saved.day===2?.8:.2;
 const waterVertices=seaGeo.attributes.position;for(let i=0;i<waterVertices.count;i++){const x=waterVertices.getX(i),z=waterVertices.getZ(i);waterVertices.setY(i,(Math.sin(x*.18+t*.65)+Math.cos(z*.16+t*.5))*.065);}waterVertices.needsUpdate=true;
 let moving=false;
 if(state.playing&&!state.modal&&state.fishing==='off'&&!state.photo){let x=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0)+stickX,z=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0)+stickY;const mag=Math.hypot(x,z);moving=mag>.12;if(moving){state.seated=false;x/=Math.max(1,mag);z/=Math.max(1,mag);const speed=keys.has('shift')?6.1:3.6;const dx=(x*Math.cos(state.yaw)+z*Math.sin(state.yaw))*speed*dt,dz=(-x*Math.sin(state.yaw)+z*Math.cos(state.yaw))*speed*dt;let nx=p.x+dx,nz=p.z+dz;for(const c of colliders){const d=Math.hypot(nx-c.x,nz-c.z),r=c.r+.34;if(d<r&&d>.001){nx=c.x+(nx-c.x)/d*r;nz=c.z+(nz-c.z)/d*r;}}if(walkHeight(nx,nz)>.2||onDock(nx,nz)){p.x=nx;p.z=nz;}else{if(walkHeight(nx,p.z)>.2)p.x=nx;if(walkHeight(p.x,nz)>.2)p.z=nz;}const targetAngle=Math.atan2(dx,dz);pip.g.rotation.y+=Math.atan2(Math.sin(targetAngle-pip.g.rotation.y),Math.cos(targetAngle-pip.g.rotation.y))*Math.min(1,dt*13);}
 if(jumpRequested&&state.grounded&&!state.seated){state.vertical=5.5;state.grounded=false;}jumpRequested=false;const floor=walkHeight(p.x,p.z)+.025+(state.seated?.65:0);state.vertical-=dt*15;p.y+=state.vertical*dt;if(p.y<=floor){p.y=floor;state.vertical=0;state.grounded=true;}
 }else jumpRequested=false;
 state.speed=lerp(state.speed,moving?1:0,Math.min(1,dt*10));
 if(state.fishing==='off'){const walk=Math.sin(t*(keys.has('shift')?14:10))*state.speed;pip.legs[0].rotation.x=walk*.65;pip.legs[1].rotation.x=-walk*.65;pip.arms[0].rotation.x=-walk*.48;pip.arms[1].rotation.x=walk*.48;pip.body.position.y=Math.abs(walk)*.075+Math.sin(t*2)*.015;pip.body.rotation.z=walk*.025;if(state.seated){pip.body.position.y=-.29;pip.legs.forEach(l=>l.rotation.x=-1.15);pip.arms.forEach(a=>a.rotation.x=-.5);}}
 keeper.body.position.y=Math.sin(t*1.5)*.025;keeper.arms[0].rotation.z=Math.sin(t*.7)*.05;
 if(state.fishing!=='off'){float.position.y=(state.fishing==='bite'?-.04:.13)+Math.sin(t*(state.fishing==='bite'?18:2))*(state.fishing==='bite'?.1:.035);fishRing.scale.setScalar(.8+Math.sin(t*2)*.2);const rodTip=new THREE.Vector3(0,2.6,.8);pip.rod.localToWorld(rodTip);const a=lineGeo.attributes.position;const mid=rodTip.clone().lerp(float.position,.5);mid.y-=.35;[rodTip,mid,float.position].forEach((v,i)=>a.setXYZ(i,v.x,v.y,v.z));a.needsUpdate=true;lineGeo.computeBoundingSphere();
 if(state.fishing==='waiting'&&t>state.biteAt){state.fishing='bite';state.biteEnd=t+3.5;$('fishing-label').textContent='SOMEONE SAYS HELLO';$('fishing-title').textContent='A nibble!';$('fishing-copy').textContent='Press E or tap below to hook gently.';$('fishing-action').textContent='Hook gently!';$('fishing-action').disabled=false;audio.chime();}
 if(state.fishing==='bite'&&t>state.biteEnd){state.fishing='miss';$('fishing-title').textContent='Just passing through.';$('fishing-copy').textContent='It swam on. No hurry — try another cast.';$('fishing-action').textContent='Cast again';}
 if(state.fishing==='reeling'){state.reel=(Math.sin((t-state.fishTime)*2.65)+1)/2;$('reel-marker').style.left=`${state.reel*98}%`;}}
 if(state.playing){lookGoal.copy(p).add(new THREE.Vector3(0,1.5,0));if(state.fishing!=='off')lookGoal.z+=1.8;cameraTarget.lerp(lookGoal,1-Math.exp(-dt*4));const d=state.zoom;cameraGoal.set(cameraTarget.x+Math.sin(state.yaw)*Math.cos(state.pitch)*d,cameraTarget.y+Math.sin(state.pitch)*d,cameraTarget.z+Math.cos(state.yaw)*Math.cos(state.pitch)*d);cameraGoal.y=Math.max(cameraGoal.y,ground(cameraGoal.x,cameraGoal.z)+4);camera.position.lerp(cameraGoal,1-Math.exp(-dt*3));camera.lookAt(cameraTarget);
 }else{const portrait=innerWidth<700;lookGoal.set(portrait?-3:-9,2,portrait?0:0);cameraTarget.lerp(lookGoal,1-Math.exp(-dt*1.5));const a=.65+Math.sin(t*.035)*.08;const d=portrait?83:90;cameraGoal.set(cameraTarget.x+Math.sin(a)*d*.72,cameraTarget.y+d*.66,cameraTarget.z+Math.cos(a)*d*.72);camera.position.lerp(cameraGoal,1-Math.exp(-dt*1.8));camera.lookAt(cameraTarget);}
 if(t-lastUI>.25){lastUI=t;setPrompt();if(state.playing){const r=Math.hypot(p.x,p.z),n=nearby();let loc=n==='dock'?'THE OLD FISHING DOCK':p.y>7?'LIGHTHOUSE HILL':r>24?'THE QUIET SHORE':p.x>4&&p.z<8?'MOSS’S LITTLE CORNER':n==='camp'?'THE WARM LITTLE FIRE':'THE WINDING MEADOW';$('location-name').textContent=loc;if(n==='dock')discover('dock','The old dock. A good place to do very little.');if(p.distanceTo(spots.summit)<4)discover('summit','The view was worth the slow way. Lighthouse Hill discovered.');}}
}
camera.position.set(45,60,65);camera.lookAt(cameraTarget);
let ready=false;
function frame(now){const dt=Math.min((now-lastTime)/1000,.05);lastTime=now;update(dt);renderer.render(scene,camera);if(!ready){ready=true;$('loading').style.opacity='0';setTimeout(()=>$('loading').remove(),650);}requestAnimationFrame(frame);}requestAnimationFrame(frame);
// Compact read-only diagnostics for maintenance and smoke checks.
window.littleTides={get status(){return {playing:state.playing,fishing:state.fishing,location:$('location-name').textContent,position:pip.g.position.toArray(),species:species.filter(f=>saved.fish[f.name]).length,released:saved.released,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles};}};

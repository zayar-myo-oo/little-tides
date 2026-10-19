// Visual polish: gradient sky dome, crisp follow-shadows, drifting light motes.
export function createPolish({THREE,scene,renderer,sun,pip}){
 const coarse=matchMedia('(pointer:coarse)').matches;
 // Gradient sky: the horizon follows scene.background so fog blends seamlessly.
 const sky=new THREE.Mesh(new THREE.SphereGeometry(400,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:{top:{value:new THREE.Color()},horizon:{value:new THREE.Color()},glow:{value:new THREE.Color()},sunDir:{value:new THREE.Vector3()}},
  vertexShader:'varying vec3 vDir;void main(){vDir=normalize(position);vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;gl_Position.z=gl_Position.w;}',
  fragmentShader:'uniform vec3 top,horizon,glow,sunDir;varying vec3 vDir;void main(){float h=clamp(vDir.y,0.,1.);vec3 c=mix(horizon,top,pow(h,.55));float s=max(dot(normalize(vDir),normalize(sunDir)),0.);c+=glow*(pow(s,8.)*.35+pow(s,120.)*.6);gl_FragColor=vec4(c,1.);\n#include <colorspace_fragment>\n}'}));
 sky.renderOrder=-1;sky.frustumCulled=false;scene.add(sky);
 const tmp=new THREE.Color(),deep=new THREE.Color('#7fa3c4');
 // Tighter shadow frustum that follows the traveler: same map, far sharper edges.
 const offset=sun.position.clone();scene.add(sun.target);
 const s=coarse?38:48,cam=sun.shadow.camera;cam.left=-s;cam.right=s;cam.top=s;cam.bottom=-s;cam.near=10;cam.far=260;cam.updateProjectionMatrix();
 if(!coarse)sun.shadow.mapSize.set(3072,3072);sun.shadow.normalBias=.04;sun.shadow.radius=3;
 const texel=2*s/sun.shadow.mapSize.x;
 // Floating motes catch the light and give the air some depth.
 const count=coarse?70:160,pos=new Float32Array(count*3),seeds=new Float32Array(count);
 for(let i=0;i<count;i++){pos[i*3]=(Math.random()-.5)*60;pos[i*3+1]=Math.random()*12+.5;pos[i*3+2]=(Math.random()-.5)*60;seeds[i]=Math.random()*10;}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
 const dot=document.createElement('canvas');dot.width=dot.height=32;const g=dot.getContext('2d'),grad=g.createRadialGradient(16,16,0,16,16,16);grad.addColorStop(0,'rgba(255,248,220,1)');grad.addColorStop(1,'rgba(255,248,220,0)');g.fillStyle=grad;g.fillRect(0,0,32,32);
 const motes=new THREE.Points(geo,new THREE.PointsMaterial({size:.22,map:new THREE.CanvasTexture(dot),transparent:true,depthWrite:false,opacity:.75,blending:THREE.AdditiveBlending,fog:true}));
 motes.frustumCulled=false;scene.add(motes);
 renderer.shadowMap.autoUpdate=true;
 function update(t,night){
  const u=sky.material.uniforms;u.horizon.value.copy(scene.background);
  tmp.copy(scene.background).lerp(night?new THREE.Color('#2c3a5a'):deep,night?.55:.38);u.top.value.copy(tmp);u.glow.value.copy(sun.color).multiplyScalar(night?.25:1);u.sunDir.value.copy(offset).normalize();
  sky.position.copy(pip.g.position);
  // Snap the shadow camera to whole texels so edges don't shimmer while walking.
  const p=pip.g.position,x=Math.round(p.x/texel)*texel,z=Math.round(p.z/texel)*texel;
  sun.target.position.set(x,0,z);sun.position.set(x+offset.x,offset.y,z+offset.z);
  const a=geo.attributes.position.array;for(let i=0;i<count;i++){const k=i*3,sd=seeds[i];a[k+1]+=Math.sin(t*.6+sd)*.004;a[k]+=Math.cos(t*.3+sd)*.006;
   if(Math.abs(a[k]-p.x)>30)a[k]=p.x-Math.sign(a[k]-p.x)*29;if(Math.abs(a[k+2]-p.z)>30)a[k+2]=p.z-Math.sign(a[k+2]-p.z)*29;}
  geo.attributes.position.needsUpdate=true;motes.material.size=night?.3:.2;motes.material.color.set(night?'#cfe0ff':'#fff1cc');
 }
 return{update};
}

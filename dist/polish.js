// Visual polish: gradient sky dome, crisp follow-shadows, drifting light motes.
export function createPolish({THREE,scene,renderer,sun,pip,sea}){
 const waterTime={value:0};
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
 // Water: fresnel sky tint plus glinting sun sparkles, layered on the standard material.
 if(sea){sea.material=sea.material.clone();sea.material.onBeforeCompile=sh=>{sh.uniforms.uTime=waterTime;
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWorld;').replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvWorld=(modelMatrix*vec4(transformed,1.)).xyz;');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform float uTime;varying vec3 vWorld;float h2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h2(i),h2(i+vec2(1,0)),f.x),mix(h2(i+vec2(0,1)),h2(i+1.),f.x),f.y);}')
  .replace('#include <dithering_fragment>','vec3 vd=normalize(cameraPosition-vWorld);float fr=pow(1.-max(vd.y,0.),3.);gl_FragColor.rgb=mix(gl_FragColor.rgb,gl_FragColor.rgb*1.35+vec3(.06,.08,.09),fr*.6);float w=n2(vWorld.xz*.9+vec2(uTime*.35,uTime*.2))*n2(vWorld.xz*1.7-vec2(uTime*.25,-uTime*.3));float sp=smoothstep(.55,.75,w)*(1.-fr*.5);float shore=smoothstep(30.,24.,length(vWorld.xz));gl_FragColor.rgb+=vec3(1.,.97,.88)*sp*.35;gl_FragColor.rgb=mix(gl_FragColor.rgb,gl_FragColor.rgb+vec3(.08,.12,.1),shore*.5);\n#include <dithering_fragment>');};}
 // Post-processing: HDR scene → soft bloom → warm grade → ACES tone map. Skipped on touch devices for speed.
 const post=!coarse&&renderer.capabilities.isWebGL2;let rt,bA,bB,quad,cam2,brightM,blurM,compM;
 if(post){const opt={type:THREE.HalfFloatType};rt=new THREE.WebGLRenderTarget(1,1,{...opt,samples:4});bA=new THREE.WebGLRenderTarget(1,1,opt);bB=new THREE.WebGLRenderTarget(1,1,opt);
  cam2=new THREE.OrthographicCamera(-1,1,1,-1,0,1);const vs='varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}';
  brightM=new THREE.ShaderMaterial({uniforms:{tex:{value:null}},vertexShader:vs,fragmentShader:'uniform sampler2D tex;varying vec2 vUv;void main(){vec3 c=texture2D(tex,vUv).rgb;float l=dot(c,vec3(.2126,.7152,.0722));gl_FragColor=vec4(c*smoothstep(.85,1.6,l),1.);}'});
  blurM=new THREE.ShaderMaterial({uniforms:{tex:{value:null},dir:{value:new THREE.Vector2()}},vertexShader:vs,fragmentShader:'uniform sampler2D tex;uniform vec2 dir;varying vec2 vUv;void main(){vec3 c=texture2D(tex,vUv).rgb*.227;c+=(texture2D(tex,vUv+dir*1.38).rgb+texture2D(tex,vUv-dir*1.38).rgb)*.316;c+=(texture2D(tex,vUv+dir*3.23).rgb+texture2D(tex,vUv-dir*3.23).rgb)*.07;gl_FragColor=vec4(c,1.);}'});
  compM=new THREE.ShaderMaterial({toneMapped:true,uniforms:{tex:{value:rt.texture},bloom:{value:bA.texture},night:{value:0}},vertexShader:vs,fragmentShader:'uniform sampler2D tex,bloom;uniform float night;varying vec2 vUv;void main(){vec3 c=texture2D(tex,vUv).rgb+texture2D(bloom,vUv).rgb*mix(.35,.7,night);float l=dot(c,vec3(.2126,.7152,.0722));c=mix(vec3(l),c,1.08);c*=mix(vec3(1.03,1.,.95),vec3(.92,.97,1.08),night);c=mix(c,c*vec3(.95,1.,1.04),smoothstep(.0,.25,1.-l));gl_FragColor=vec4(c,1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'});
  quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),compM);quad.frustumCulled=false;}
 const size=new THREE.Vector2();let isNight=0;
 function pass(m,target){quad.material=m;renderer.setRenderTarget(target);renderer.render(quad,cam2);}
 function render(camera){if(!post){renderer.render(scene,camera);return;}renderer.getDrawingBufferSize(size);if(rt.width!==size.x||rt.height!==size.y){rt.setSize(size.x,size.y);bA.setSize(size.x>>2,size.y>>2);bB.setSize(size.x>>2,size.y>>2);}
  renderer.setRenderTarget(rt);renderer.render(scene,camera);brightM.uniforms.tex.value=rt.texture;pass(brightM,bA);
  for(let i=0;i<2;i++){blurM.uniforms.tex.value=bA.texture;blurM.uniforms.dir.value.set(1/bA.width,0);pass(blurM,bB);blurM.uniforms.tex.value=bB.texture;blurM.uniforms.dir.value.set(0,1/bA.height);pass(blurM,bA);}
  compM.uniforms.night.value=isNight;pass(compM,null);}
 renderer.shadowMap.autoUpdate=true;
 function update(t,night){waterTime.value=t;isNight+=((night?1:0)-isNight)*.05;
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
 return{update,render};
}

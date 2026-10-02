import{c as B,u as te,r as j,j as s}from"./index-BE5oQEA9.js";import{A as I}from"./corridors-CzFWVkOY.js";import{M as ae}from"./ModelBadge-Beg1lKeZ.js";import{c as ne,a as re,b as ie,r as oe,e as le,E as D}from"./easing-CmAxry58.js";import{p as ce,G as de,q as me,C as M,c as C,n as f,y as he,w as F,F as R,L as ue,d as Y,l as T,A as L,z as pe,b as fe,S as xe,o as ge,V as be}from"./vendor-three-CdbYMsk8.js";import{C as ve}from"./compass-COkZy0mb.js";import{P as we}from"./plane-takeoff-DOyqhNRm.js";import{S as ye}from"./sparkles-B8y3rI3R.js";/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ae=[["path",{d:"M8 2v4",key:"1cmpym"}],["path",{d:"M16 2v4",key:"4m81vk"}],["rect",{width:"18",height:"18",x:"3",y:"4",rx:"2",key:"1hopcy"}],["path",{d:"M3 10h18",key:"8toen8"}]],Me=B("Calendar",Ae);/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const je=[["path",{d:"M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z",key:"edeuup"}]],Ne=B("MousePointer2",je);/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Pe=[["path",{d:"M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z",key:"1a0edw"}],["path",{d:"M12 22V12",key:"d0xqtd"}],["polyline",{points:"3.29 7 12 12 20.71 7",key:"ousv84"}],["path",{d:"m7.5 4.27 9 5.15",key:"1c824w"}]],Ce=B("Package",Pe),Q=Math.PI/180;function w(a,e,t=1,l){const n=a*Q,r=e*Q,i=Math.cos(n),o=t*i*Math.sin(r),d=t*Math.sin(n),c=t*i*Math.cos(r);return l?(l[0]=o,l[1]=d,l[2]=c,l):[o,d,c]}function W(a,e){return a[0]*e[0]+a[1]*e[1]+a[2]*e[2]}function Se(a){return Math.hypot(a[0],a[1],a[2])}function k(a){const e=Se(a)||1;return[a[0]/e,a[1]/e,a[2]/e]}function ke(a,e,t){const l=Math.max(-1,Math.min(1,W(a,e))),n=Math.acos(l);if(n<1e-4)return k([a[0]+(e[0]-a[0])*t,a[1]+(e[1]-a[1])*t,a[2]+(e[2]-a[2])*t]);const r=Math.sin(n),i=Math.sin((1-t)*n)/r,o=Math.sin(t*n)/r;return[a[0]*i+e[0]*o,a[1]*i+e[1]*o,a[2]*i+e[2]*o]}function Ee(a,e,t,l,n,r=[0,0,0]){const i=Math.max(-1,Math.min(1,W(a,e))),o=Math.acos(i);let d,c;if(o<1e-4)d=1-t,c=t;else{const x=Math.sin(o);d=Math.sin((1-t)*o)/x,c=Math.sin(t*o)/x}const m=l+n*Math.sin(Math.PI*t),h=a[0]*d+e[0]*c,p=a[1]*d+e[1]*c,u=a[2]*d+e[2]*c,v=Math.hypot(h,p,u)||1;return r[0]=h/v*m,r[1]=p/v*m,r[2]=u/v*m,r}function Re(a,e){return Math.acos(Math.max(-1,Math.min(1,W(k(a),k(e)))))}function Te(a,e){return Math.min(e*.42,Math.max(e*.06,a*e*.24))}function Le(a,e){const t=ke(k(a),k(e),.5);return-Math.atan2(t[0],t[2])}function Ge(a,e,t=1){const l=Math.PI*(3-Math.sqrt(5)),n=1-a/Math.max(1,e-1)*2,r=Math.sqrt(Math.max(0,1-n*n)),i=l*a;return[t*r*Math.cos(i),t*n,t*r*Math.sin(i)]}const y=1,G=2400,V=72,_=2,_e=.05,J=4.2,Ie=`
  varying vec3 vNormalV;
  void main() {
    vNormalV = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,Oe=`
  precision mediump float;
  varying vec3 vNormalV;
  uniform vec3 uColor;
  void main() {
    float rim = pow(max(0.68 - dot(vNormalV, vec3(0.0, 0.0, 1.0)), 0.0), 3.2);
    gl_FragColor = vec4(uColor, rim * 0.85);
    #include <colorspace_fragment>
  }
`,Fe=`
  attribute float aT;
  attribute float aArc;
  varying float vT;
  varying float vArc;
  void main() {
    vT = aT;
    vArc = aArc;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,Ve=`
  precision mediump float;
  varying float vT;
  varying float vArc;
  uniform float uTime;
  uniform float uActiveArc;
  uniform vec3 uColor;
  uniform vec3 uActiveColor;
  void main() {
    // step() arithmetic keeps the focus test branch-free.
    float noneSelected = step(uActiveArc, -0.5);
    float focus = max(noneSelected, 1.0 - min(abs(vArc - uActiveArc), 1.0));
    float spark = pow(1.0 - fract(vT - uTime * 0.16), 6.0) * focus;
    vec3 color = mix(uColor * 0.22, uActiveColor, focus) * (0.55 + spark * 2.6);
    float alpha = 0.14 + focus * 0.5 + spark * 0.35;
    gl_FragColor = vec4(color, alpha);
    #include <colorspace_fragment>
  }
`,De=`
  attribute float aEminence;
  attribute float aPhase;
  attribute vec3 aColor;
  varying vec3 vColor;
  varying float vPulse;
  uniform float uTime;
  uniform float uPointScale;
  void main() {
    vPulse = 0.7 + 0.3 * sin(uTime * 2.2 + aPhase * 6.2831);
    vColor = aColor;
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aEminence * vPulse * uPointScale / max(0.6, -mvPos.z);
    gl_Position = projectionMatrix * mvPos;
  }
`,ze=`
  precision mediump float;
  varying vec3 vColor;
  varying float vPulse;
  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    float halo = smoothstep(0.5, 0.08, dist) * 0.5;
    float core = smoothstep(0.16, 0.02, dist);
    gl_FragColor = vec4(vColor, (halo * vPulse + core));
    #include <colorspace_fragment>
  }
`,Be=`
  attribute vec3 aOrigin;
  attribute vec3 aDest;
  attribute float aPhase;
  attribute float aSpeed;
  attribute float aLift;
  varying float vEnroute;
  uniform float uTime;
  uniform float uPointScale;

  vec3 greatCirclePos(vec3 a, vec3 b, float t, float lift) {
    float omega = acos(clamp(dot(a, b), -1.0, 1.0));
    float sinOmega = max(sin(omega), 1e-4);
    vec3 dir = normalize((a * sin((1.0 - t) * omega) + b * sin(t * omega)) / sinOmega);
    return dir * (1.0 + lift * sin(3.14159 * t));
  }

  void main() {
    float t = fract(uTime * aSpeed + aPhase);
    vEnroute = sin(3.14159 * t);
    vec3 pos = greatCirclePos(aOrigin, aDest, t, aLift);
    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = (5.0 + 3.0 * vEnroute) * uPointScale / max(0.6, -mvPos.z);
    gl_Position = projectionMatrix * mvPos;
  }
`,We=`
  precision mediump float;
  varying float vEnroute;
  uniform vec3 uColor;
  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    float core = smoothstep(0.42, 0.05, dist);
    float cross = smoothstep(0.06, 0.0, abs(gl_PointCoord.x - 0.5)) + smoothstep(0.06, 0.0, abs(gl_PointCoord.y - 0.5));
    float alpha = core * (0.55 + 0.45 * vEnroute) + cross * 0.18 * vEnroute;
    gl_FragColor = vec4(uColor, alpha);
    #include <colorspace_fragment>
  }
`;class Xe{renderer;camera;scene=new ce;canvas;globeGroup=new de;resizeObserver;arcIds=[];pointScale={value:1};arcMaterial=null;hubMaterial=null;trafficMaterial=null;atmosphereMaterial=null;yaw=-.55;yawGoal=-.55;tilt=.34;tiltGoal=.34;spinVelocity=0;dragging=!1;lastPointerX=0;rafId=0;lastTime=0;elapsed=0;visible=!1;reducedMotion=matchMedia("(prefers-reduced-motion: reduce)").matches;disposed=!1;statsCallback=null;frames=0;statsAccumulator=0;lastStatTime=0;constructor(e,t,l){this.canvas=e,this.renderer=ne(e,{alpha:!0}),this.renderer.setClearColor(0,0),this.camera=new me(34,1,.1,20),this.camera.up.set(0,1,0),this.scene.add(this.globeGroup),this.buildDotShell(),this.buildGraticule(),this.buildAtmosphere(),this.buildHubs(l),this.buildArcsAndTraffic(t),this.attachPointer(e);const n=e.parentElement??e;this.resizeObserver=new ResizeObserver(()=>this.applySize()),this.resizeObserver.observe(n),this.applySize()}buildDotShell(){const e=new Float32Array(G*3),t=new Float32Array(G*3),l=new M(1324620),n=new M(2779786),r=new M;for(let c=0;c<G;c++){const[m,h,p]=Ge(c,G,y);e[c*3]=m,e[c*3+1]=h,e[c*3+2]=p;const u=.5+.5*Math.sin(h*Math.PI*1.6+m*.5);r.copy(l).lerp(n,u*.8),t[c*3]=r.r,t[c*3+1]=r.g,t[c*3+2]=r.b}const i=new C;i.setAttribute("position",new f(e,3)),i.setAttribute("color",new f(t,3));const o=new he({size:.012,vertexColors:!0,transparent:!0,opacity:.85,sizeAttenuation:!0,depthWrite:!1}),d=new F(i,o);this.globeGroup.add(d)}buildGraticule(){const e=[],t=y*.995,l=(i,o)=>e.push(i[0],i[1],i[2],o[0],o[1],o[2]);for(let i=-60;i<=60;i+=20){let o=w(i,-180,t);for(let d=1;d<=120;d++){const c=w(i,-180+d/120*360,t);l(o,c),o=c}}for(let i=-180;i<180;i+=20){let o=w(-85,i,t);for(let d=-83;d<=85;d+=2){const c=w(d,i,t);l(o,c),o=c}}const n=new C;n.setAttribute("position",new R(e,3));const r=new ue({color:928832,transparent:!0,opacity:.5});this.globeGroup.add(new Y(n,r))}buildAtmosphere(){this.atmosphereMaterial=new T({vertexShader:Ie,fragmentShader:Oe,uniforms:{uColor:{value:new M(1941216)}},transparent:!0,side:pe,depthWrite:!1,blending:L}),this.globeGroup.add(new fe(new xe(1.13,48,32),this.atmosphereMaterial))}buildHubs(e){const t=e.length,l=new Float32Array(t*3),n=new Float32Array(t),r=new Float32Array(t),i=new Float32Array(t*3),o=new M;e.forEach((c,m)=>{const[h,p,u]=w(c.lat,c.lon,y*1.002);l.set([h,p,u],m*3),n[m]=14*c.eminence,r[m]=m*.37%1,o.setHex(c.color),i.set([o.r,o.g,o.b],m*3)});const d=new C;d.setAttribute("position",new f(l,3)),d.setAttribute("aEminence",new f(n,1)),d.setAttribute("aPhase",new f(r,1)),d.setAttribute("aColor",new f(i,3)),this.hubMaterial=new T({vertexShader:De,fragmentShader:ze,uniforms:{uTime:{value:0},uPointScale:this.pointScale},transparent:!0,depthWrite:!1,blending:L}),this.globeGroup.add(new F(d,this.hubMaterial))}buildArcsAndTraffic(e){const t=[0,0,0],l=[0,0,0],n=[0,0,0],r=[],i=[],o=[],d=e.length*_,c=new Float32Array(d*3),m=new Float32Array(d*3),h=new Float32Array(d),p=new Float32Array(d),u=new Float32Array(d),v=new Float32Array(d*3);e.forEach((N,E)=>{this.arcIds.push(N.id);const O=w(N.fromLat,N.fromLon,y,t),H=w(N.toLat,N.toLon,y,l),U=Te(Re(O,H),y);let K=0,q=0,$=0;for(let b=0;b<=V;b++){const A=b/V,P=Ee(O,H,A,y,U,n);b>0&&(r.push(K,q,$,P[0],P[1],P[2]),i.push((b-1)/V,A),o.push(E,E)),K=P[0],q=P[1],$=P[2]}for(let b=0;b<_;b++){const A=E*_+b;c.set(O,A*3),m.set(l,A*3),h[A]=b/_+E*.17%1,p[A]=2200/(N.distanceKm*60),u[A]=U}});const x=new C;x.setAttribute("position",new R(r,3)),x.setAttribute("aT",new R(i,1)),x.setAttribute("aArc",new R(o,1)),this.arcMaterial=new T({vertexShader:Fe,fragmentShader:Ve,uniforms:{uTime:{value:0},uActiveArc:{value:-1},uColor:{value:new M(1400437)},uActiveColor:{value:new M(2282478)}},transparent:!0,depthWrite:!1,blending:L}),this.globeGroup.add(new Y(x,this.arcMaterial));const g=new C;g.setAttribute("position",new f(v,3)),g.setAttribute("aOrigin",new f(c,3)),g.setAttribute("aDest",new f(m,3)),g.setAttribute("aPhase",new f(h,1)),g.setAttribute("aSpeed",new f(p,1)),g.setAttribute("aLift",new f(u,1));const se=new ge(new be,3);g.boundingSphere=se,this.trafficMaterial=new T({vertexShader:Be,fragmentShader:We,uniforms:{uTime:{value:0},uPointScale:this.pointScale,uColor:{value:new M(10875900)}},transparent:!0,depthWrite:!1,blending:L});const X=new F(g,this.trafficMaterial);X.frustumCulled=!1,this.globeGroup.add(X)}setActiveCorridor(e,t){const l=e?this.arcIds.indexOf(e):-1;if(this.arcMaterial&&(this.arcMaterial.uniforms.uActiveArc.value=l),l>=0&&t){const n=w(t.fromLat,t.fromLon,y),r=w(t.toLat,t.toLon,y);this.yawGoal=Le(n,r)}this.reducedMotion&&(this.yaw=this.yawGoal,this.renderOnce()),this.wake()}setVisible(e){this.visible=e,e&&this.wake()}setReducedMotion(e){this.reducedMotion=e,e||this.wake(),this.renderOnce()}onStats(e){this.statsCallback=e}wake(){this.disposed||this.reducedMotion||!this.visible||this.rafId===0&&(this.lastTime=performance.now(),this.rafId=requestAnimationFrame(this.tick))}renderOnce(){this.disposed||!this.visible||this.rafId!==0||this.draw(performance.now())}tick=e=>{if(this.rafId=0,this.disposed)return;const t=Math.min(.05,Math.max(.001,(e-this.lastTime)/1e3));this.lastTime=e,this.elapsed+=t,this.dragging||(this.yawGoal+=_e*t+this.spinVelocity),this.spinVelocity*=Math.exp(-4.5*t),this.yaw=re(this.yaw,this.yawGoal,J,t),this.tilt=ie(this.tilt,this.tiltGoal,J,t),this.globeGroup.rotation.set(this.tilt,this.yaw,0),this.arcMaterial&&(this.arcMaterial.uniforms.uTime.value=this.elapsed),this.hubMaterial&&(this.hubMaterial.uniforms.uTime.value=this.elapsed),this.trafficMaterial&&(this.trafficMaterial.uniforms.uTime.value=this.elapsed),this.draw(e),this.rafId=requestAnimationFrame(this.tick)};draw(e){this.camera.position.set(0,.16,3.05),this.camera.lookAt(0,0,0),this.renderer.render(this.scene,this.camera),this.frames+=1,this.statsAccumulator+=e-(this.lastStatTime||e),this.lastStatTime=e,this.statsAccumulator>=500&&this.statsCallback&&(this.statsCallback({fps:Math.round(this.frames*1e3/this.statsAccumulator),draws:this.renderer.info.render.calls,dpr:Math.min(window.devicePixelRatio||1,2)}),this.frames=0,this.statsAccumulator=0)}attachPointer(e){e.addEventListener("pointerdown",this.onPointerDown),window.addEventListener("pointermove",this.onPointerMove),window.addEventListener("pointerup",this.onPointerUp),window.addEventListener("pointercancel",this.onPointerUp)}onPointerDown=e=>{e.button!==0&&e.pointerType==="mouse"||(this.dragging=!0,this.spinVelocity=0,this.lastPointerX=e.clientX,this.canvas.setPointerCapture?.(e.pointerId))};onPointerMove=e=>{if(!this.dragging)return;const t=e.clientX-this.lastPointerX;this.lastPointerX=e.clientX,this.yawGoal+=t*.005,this.spinVelocity=t*.0016,this.wake()};onPointerUp=()=>{this.dragging=!1};applySize(){const t=(this.canvas.parentElement??this.canvas).getBoundingClientRect(),l=Math.max(2,Math.round(t.width)),n=Math.max(2,Math.round(t.height));this.renderer.setSize(l,n,!1),this.camera.aspect=l/n,this.camera.updateProjectionMatrix();const r=n*Math.min(window.devicePixelRatio||1,2);this.pointScale.value=.5*r*this.camera.projectionMatrix.elements[5]/240,this.renderOnce()}dispose(){this.disposed||(this.disposed=!0,this.rafId!==0&&cancelAnimationFrame(this.rafId),this.rafId=0,this.resizeObserver.disconnect(),this.canvas.removeEventListener("pointerdown",this.onPointerDown),window.removeEventListener("pointermove",this.onPointerMove),window.removeEventListener("pointerup",this.onPointerUp),window.removeEventListener("pointercancel",this.onPointerUp),oe(this.renderer,this.scene))}}const Z={CAI:{iata:"CAI",lat:30.1219,lon:31.4056},FRA:{iata:"FRA",lat:50.0379,lon:8.5622},DXB:{iata:"DXB",lat:25.2532,lon:55.3657},AMS:{iata:"AMS",lat:52.3105,lon:4.7683},PVG:{iata:"PVG",lat:31.1443,lon:121.8083}};function z(a){return Z[a]??Z.CAI}const ee=I.map(a=>{const e=z(a.fromIata),t=z(a.toIata);return{id:a.id,fromLat:e.lat,fromLon:e.lon,toLat:t.lat,toLon:t.lon,distanceKm:a.distanceKm}}),He=[{...S("CAI"),eminence:2.6,color:6809849},{...S("FRA"),eminence:1.1,color:3718648},{...S("DXB"),eminence:1.1,color:3718648},{...S("AMS"),eminence:1.1,color:3718648},{...S("PVG"),eminence:1.1,color:3718648}];function S(a){const e=z(a);return{lat:e.lat,lon:e.lon}}const Ue=({activeCorridorId:a})=>{const{isRtl:e}=te(),t=j.useRef(null),l=j.useRef(null),n=j.useRef(null),[r,i]=j.useState(!1),[o,d]=j.useState(null);j.useEffect(()=>{const m=t.current;if(!m)return;if(!le()){i(!0);return}let h=null;try{h=new Xe(m,ee,He)}catch{i(!0);return}n.current=h,h.onStats(d);const p=l.current;let u=null;p&&typeof IntersectionObserver<"u"?(u=new IntersectionObserver(([g])=>h?.setVisible(g.isIntersecting),{rootMargin:"200px"}),u.observe(p)):h.setVisible(!0);const v=window.matchMedia("(prefers-reduced-motion: reduce)"),x=()=>h?.setReducedMotion(v.matches);return v.addEventListener?.("change",x),x(),()=>{u?.disconnect(),v.removeEventListener?.("change",x),h?.dispose(),n.current=null}},[]),j.useEffect(()=>{if(!n.current||!a)return;const m=ee.find(h=>h.id===a)??null;n.current.setActiveCorridor(m?.id??null,m?{fromLat:m.fromLat,fromLon:m.fromLon,toLat:m.toLat,toLon:m.toLon}:void 0)},[a,r]);const c=I.find(m=>m.id===a)??null;return s.jsxs("div",{ref:l,className:"relative aspect-square w-full overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_50%_42%,#081726_0%,#040a13_58%,#02060c_100%)]",children:[s.jsx("canvas",{ref:t,"aria-label":"Interactive 3D globe rendering the scheduled air corridors converging on Cairo International Airport",className:"block h-full w-full cursor-grab touch-none active:cursor-grabbing"}),!r&&s.jsxs(s.Fragment,{children:[s.jsxs("div",{className:"pointer-events-none absolute left-3 top-3 space-y-1 font-mono",dir:"ltr",children:[s.jsxs("span",{className:"inline-flex items-center gap-1.5 rounded-full border border-cyan-300/25 bg-black/45 px-2.5 py-1 text-[9px] font-bold tracking-[.18em] text-cyan-300 backdrop-blur",children:[s.jsx(ve,{className:"h-3 w-3"}),"AIRWAY NETWORK · LIVE ARCS"]}),c&&s.jsxs("span",{className:"block w-fit rounded-full border border-white/10 bg-black/45 px-2.5 py-1 text-[9px] tracking-wider text-slate-300 backdrop-blur",children:["FOCUS ⇢ ",c.code]})]}),s.jsxs("div",{className:"pointer-events-none absolute bottom-3 left-3 flex items-center gap-1.5 font-mono text-[8px] text-slate-400",dir:"ltr",children:[s.jsx(Ne,{className:"h-3 w-3 text-cyan-400/70"}),s.jsx("span",{children:e?"اسحب لتدوير الكوكب":"DRAG TO SPIN"}),o&&s.jsxs("span",{className:"ml-2 rounded-full border border-white/10 bg-black/45 px-2 py-0.5 backdrop-blur",children:[o.fps," FPS · ",o.draws," DRAWS · DPR ×",o.dpr]})]}),s.jsxs("div",{className:"pointer-events-none absolute bottom-3 right-3 flex gap-1 font-mono text-[8px]",dir:"ltr",children:[["FRA","DXB","AMS","PVG"].map(m=>s.jsx("span",{className:"rounded-full border border-white/10 bg-black/45 px-1.5 py-0.5 text-sky-300/80 backdrop-blur",children:m},m)),s.jsx("span",{className:"rounded-full border border-cyan-300/40 bg-cyan-400/15 px-1.5 py-0.5 font-bold text-cyan-200 backdrop-blur",children:"CAI"})]})]}),r&&s.jsx("div",{className:"absolute inset-0 grid place-items-center p-6 text-center",children:s.jsxs("div",{className:"max-w-xs space-y-2",children:[s.jsx(D,{className:"mx-auto h-6 w-6 text-cyan-400"}),s.jsx("p",{className:"font-mono text-xs text-slate-300",children:e?"متصفحك حظر WebGL — الممرات الجوية المجدولة متاحة في البطاقات أدناه.":"WebGL is unavailable — the scheduled corridors remain fully browsable in the cards below."})]})})]})},tt=()=>{const{dict:a,isRtl:e}=te(),[t,l]=j.useState(I[0]);return s.jsxs("section",{id:"corridors",className:"scroll-mt-24 relative py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto",children:[s.jsxs("div",{className:"flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 border-b border-[var(--glass-brd)] pb-6",children:[s.jsxs("div",{children:[s.jsxs("div",{className:"flex items-center gap-2 mb-2",children:[s.jsx("span",{className:"px-2.5 py-0.5 rounded-full text-xs font-mono font-medium tracking-wider bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 uppercase",children:a.corridors.sectionBadge}),s.jsx(ae,{})]}),s.jsx("h2",{className:"text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-title h2-display",children:a.corridors.title}),s.jsx("p",{className:"mt-2 text-sm sm:text-base text-muted max-w-2xl",children:a.corridors.subtitle})]}),s.jsxs("div",{className:"self-start md:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl glass-subcard text-xs font-mono text-muted",children:[s.jsx(D,{className:"w-4 h-4 text-cyan-500"}),s.jsx("span",{dir:"ltr",children:"SCHEDULED AIRWAY NETWORK"})]})]}),s.jsxs("div",{className:"grid grid-cols-1 lg:grid-cols-12 gap-8",children:[s.jsx("div",{className:"lg:col-span-4 space-y-3",children:I.map(n=>{const r=t.id===n.id;return s.jsxs("button",{type:"button",onClick:()=>l(n),"aria-pressed":r,className:`w-full text-left rtl:text-right p-4 rounded-2xl border cursor-pointer transition-all duration-200 glass-panel-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--c-bg)] ${r?"bg-gradient-to-r from-cyan-500/15 via-[var(--glass-bg)] to-[var(--glass-bg)] border-cyan-500 shadow-md":"glass-panel"}`,children:[s.jsxs("div",{className:"flex items-center justify-between mb-2",children:[s.jsxs("div",{className:"flex items-center gap-2",children:[s.jsx(we,{className:`w-4 h-4 ${r?"text-cyan-500":"text-muted"}`}),s.jsx("span",{className:"font-mono font-bold text-base text-title",dir:"ltr",children:n.code})]}),s.jsxs("span",{className:"text-xs font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 border border-cyan-500/20 font-semibold",dir:"ltr",children:[n.weeklyFrequencies," ",e?"رحلة/أسبوعياً":"weekly"]})]}),s.jsxs("div",{className:"text-xs text-muted flex items-center justify-between font-mono",children:[s.jsx("span",{children:e?n.fromCityAr:n.fromCityEn}),s.jsx("span",{className:"text-cyan-500",dir:"ltr",children:"➔"}),s.jsx("span",{children:e?n.toCityAr:n.toCityEn})]}),s.jsxs("div",{className:"mt-2 pt-2 border-t border-[var(--glass-brd)] flex items-center justify-between text-[11px] font-mono text-muted",children:[s.jsxs("span",{dir:"ltr",children:[n.distanceKm.toLocaleString()," KM"]}),s.jsx("span",{children:e?n.flightTimeAr:n.flightTimeEn})]})]},n.id)})}),s.jsxs("div",{className:"lg:col-span-8 space-y-6",children:[s.jsxs("div",{className:"glass-panel rounded-3xl p-3 sm:p-4 shadow-xl",children:[s.jsxs("div",{className:"flex items-center justify-between px-2 pb-3 font-mono text-[10px] tracking-wider text-muted",dir:"ltr",children:[s.jsxs("span",{className:"flex items-center gap-1.5",children:[s.jsx(D,{className:"h-3.5 w-3.5 text-cyan-500"}),e?"شبكة الممرات فوق الكرة — دوائر عظمى فعلية":"GREAT-CIRCLE NETWORK STATE"]}),s.jsx("span",{className:"text-cyan-500/70",children:"WEBGL · 6 DRAWS"})]}),s.jsx(Ue,{activeCorridorId:t.id})]}),s.jsxs("div",{className:"glass-panel rounded-2xl p-6 sm:p-8 shadow-xl space-y-6",children:[s.jsxs("div",{className:"flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--glass-brd)] pb-4 gap-3",children:[s.jsxs("div",{children:[s.jsxs("div",{className:"flex items-center gap-3",children:[s.jsx("span",{className:"text-2xl sm:text-3xl font-black font-mono text-title",dir:"ltr",children:t.code}),s.jsxs("span",{className:"text-xs font-mono px-2.5 py-1 rounded bg-sky-500/15 text-sky-600 dark:text-sky-300 font-bold",dir:"ltr",children:[t.fromIata," ➔ ",t.toIata]})]}),s.jsxs("p",{className:"text-xs sm:text-sm text-muted mt-1",children:[e?t.fromCityAr:t.fromCityEn," ➔ ",e?t.toCityAr:t.toCityEn]})]}),s.jsxs("div",{className:"self-start sm:self-auto px-3 py-1.5 rounded-xl glass-subcard text-xs font-mono text-cyan-600 dark:text-cyan-300 flex items-center gap-1.5",children:[s.jsx(Me,{className:"w-3.5 h-3.5 text-cyan-500"}),s.jsxs("span",{dir:"ltr",children:[t.weeklyFrequencies," ",a.corridors.weeklyFlights]})]})]}),s.jsxs("div",{className:"grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono",children:[s.jsxs("div",{className:"p-3.5 rounded-xl glass-subcard",children:[s.jsx("span",{className:"block text-[10px] text-muted uppercase",children:a.corridors.distance}),s.jsxs("span",{className:"text-lg font-bold text-title tabular block mt-0.5",dir:"ltr",children:[t.distanceKm.toLocaleString()," ",s.jsx("span",{className:"text-xs text-muted font-normal",children:"KM"})]})]}),s.jsxs("div",{className:"p-3.5 rounded-xl glass-subcard",children:[s.jsx("span",{className:"block text-[10px] text-muted uppercase",children:a.corridors.flightDuration}),s.jsx("span",{className:"text-sm font-bold text-cyan-600 dark:text-cyan-300 block mt-0.5",children:e?t.flightTimeAr:t.flightTimeEn})]}),s.jsxs("div",{className:"p-3.5 rounded-xl glass-subcard col-span-2 sm:col-span-1",children:[s.jsx("span",{className:"block text-[10px] text-muted uppercase",children:e?"المشغل والتحالف":"Operating Fleet Alliance"}),s.jsx("span",{className:"text-xs font-bold text-title truncate block mt-0.5",children:e?t.carrierAr:t.carrierEn})]})]}),s.jsxs("div",{className:"p-4 rounded-xl glass-subcard space-y-1.5",children:[s.jsxs("span",{className:"block text-xs font-mono font-bold text-cyan-600 dark:text-cyan-300 uppercase tracking-wider flex items-center gap-1.5",children:[s.jsx(ye,{className:"w-3.5 h-3.5 text-cyan-500"}),s.jsxs("span",{children:[a.corridors.corridorRole,":"]})]}),s.jsx("p",{className:"text-sm text-muted leading-relaxed font-sans",children:e?t.strategicSignificanceAr:t.strategicSignificanceEn})]}),s.jsxs("div",{className:"p-4 rounded-xl glass-subcard space-y-1.5",children:[s.jsxs("span",{className:"block text-xs font-mono font-bold text-title uppercase tracking-wider flex items-center gap-1.5",children:[s.jsx(Ce,{className:"w-3.5 h-3.5 text-cyan-500"}),s.jsxs("span",{children:[a.corridors.primaryCommodities,":"]})]}),s.jsx("p",{className:"text-xs sm:text-sm text-muted leading-relaxed font-sans",children:e?t.primaryCargoAr:t.primaryCargoEn})]})]})]})]})]})};export{tt as CorridorsAir};
//# sourceMappingURL=CorridorsAir-DRW_wxTB.js.map

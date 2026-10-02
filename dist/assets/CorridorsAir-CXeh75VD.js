import{c as X,u as lt,r as N,j as s}from"./index-BQtGLEdm.js";import{A as D}from"./corridors-CzFWVkOY.js";import{M as dt}from"./ModelBadge-BtRLVNkX.js";import{c as ut,a as ht,b as Z,r as mt,e as ft,E as W}from"./easing-DN7Azvr6.js";import{p as pt,G as xt,V as G,Q as vt,q as gt,C as y,c as j,F as C,l as E,x as z,y as b,L as bt,d as tt,A as I,H as wt,b as yt,S as At,n as w,o as Mt}from"./vendor-three-BPMIOOPA.js";import{C as St}from"./compass-DL93vfvp.js";import{P as Ct}from"./plane-takeoff-BULOJWJS.js";import{S as Nt}from"./sparkles-BHHKymsF.js";/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Pt=[["path",{d:"M8 2v4",key:"1cmpym"}],["path",{d:"M16 2v4",key:"4m81vk"}],["rect",{width:"18",height:"18",x:"3",y:"4",rx:"2",key:"1hopcy"}],["path",{d:"M3 10h18",key:"8toen8"}]],Lt=X("Calendar",Pt);/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const jt=[["path",{d:"M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z",key:"edeuup"}]],Et=X("MousePointer2",jt);/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Rt=[["path",{d:"M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z",key:"1a0edw"}],["path",{d:"M12 22V12",key:"d0xqtd"}],["polyline",{points:"3.29 7 12 12 20.71 7",key:"ousv84"}],["path",{d:"m7.5 4.27 9 5.15",key:"1c824w"}]],Tt=X("Package",Rt),et=Math.PI/180;function A(a,t,e=1,o){const n=a*et,i=t*et,r=Math.cos(n),l=e*r*Math.sin(i),c=e*Math.sin(n),u=e*r*Math.cos(i);return o?(o[0]=l,o[1]=c,o[2]=u,o):[l,c,u]}function Y(a,t){return a[0]*t[0]+a[1]*t[1]+a[2]*t[2]}function kt(a){return Math.hypot(a[0],a[1],a[2])}function T(a){const t=kt(a)||1;return[a[0]/t,a[1]/t,a[2]/t]}function _t(a,t,e){const o=Math.max(-1,Math.min(1,Y(a,t))),n=Math.acos(o);if(n<1e-4)return T([a[0]+(t[0]-a[0])*e,a[1]+(t[1]-a[1])*e,a[2]+(t[2]-a[2])*e]);const i=Math.sin(n),r=Math.sin((1-e)*n)/i,l=Math.sin(e*n)/i;return[a[0]*r+t[0]*l,a[1]*r+t[1]*l,a[2]*r+t[2]*l]}function Ot(a,t,e,o,n,i=[0,0,0]){const r=Math.max(-1,Math.min(1,Y(a,t))),l=Math.acos(r);let c,u;if(l<1e-4)c=1-e,u=e;else{const x=Math.sin(l);c=Math.sin((1-e)*l)/x,u=Math.sin(e*l)/x}const d=o+n*Math.sin(Math.PI*e),h=a[0]*c+t[0]*u,f=a[1]*c+t[1]*u,m=a[2]*c+t[2]*u,p=Math.hypot(h,f,m)||1;return i[0]=h/p*d,i[1]=f/p*d,i[2]=m/p*d,i}function Gt(a,t){return Math.acos(Math.max(-1,Math.min(1,Y(T(a),T(t)))))}function It(a,t){return Math.min(t*.42,Math.max(t*.06,a*t*.24))}function Ft(a,t){const e=_t(T(a),T(t),.5);return-Math.atan2(e[0],e[2])}function Dt(a){const t=Date.UTC(a.getUTCFullYear(),0,0),e=(a.getTime()-t)/864e5,o=-23.44*Math.cos(2*Math.PI/365.24*(e+10)),n=2*Math.PI/364*(e-81),i=9.87*Math.sin(2*n)-7.53*Math.cos(n)-1.5*Math.sin(n);let l=-15*(a.getUTCHours()+a.getUTCMinutes()/60+a.getUTCSeconds()/3600+i/60-12);return l=((l+180)%360+360)%360-180,{lat:o,lon:l}}function Vt(a,t,e=1){const o=Math.PI*(3-Math.sqrt(5)),n=1-a/Math.max(1,t-1)*2,i=Math.sqrt(Math.max(0,1-n*n)),r=o*a;return[e*i*Math.cos(r),e*n,e*i*Math.sin(r)]}const zt=`
-168,66 -164,60 -158,58 -152,59 -145,60 -136,58 -130,54 -124,48 -124,43 -124,40 -123,38 -122,37 -121,36 -120,34 -118,34 -117,33 -113,28 -109,23 -105,20 -97,16 -94,18 -91,14 -87,13 -85,11 -83,9 -80,8 -78,8 -81,9 -83,10 -86,12 -88,16 -87,21 -90,21 -91,19 -95,19 -97,21 -97,26 -94,29 -90,29 -84,30 -81,25 -80,27 -81,31 -76,35 -74,40 -70,42 -70,44 -66,45 -65,47 -66,49 -60,50 -58,52 -60,55 -64,60 -70,61 -77,62 -77,58 -79,55 -85,55 -92,57 -94,60 -92,63 -86,66 -95,68 -110,68 -125,70 -140,70 -156,71 -166,69;
-78,8 -75,10 -71,12 -64,10 -60,8 -52,5 -50,0 -44,-3 -38,-5 -35,-8 -39,-13 -39,-18 -41,-22 -48,-25 -53,-33 -57,-38 -62,-40 -65,-45 -68,-50 -68,-55 -74,-52 -75,-46 -73,-40 -71,-33 -70,-25 -70,-18 -76,-14 -81,-6 -80,-2 -78,1 -77,4;
-6,35 0,37 10,37 20,32 30,32 33,29 36,22 37,18 40,15 43,11 48,11 51,12 48,5 44,0 41,-2 40,-10 35,-19 33,-26 28,-33 20,-35 17,-30 12,-18 9,-2 9,4 5,5 -4,5 -8,4 -13,9 -17,14 -17,21 -10,27;
44,-25 50,-16 49,-12 45,-16 43,-22;
-6,36 -2,37 0,39 3,42 5,43 8,44 10,44 12,42 14,41 16,38 17,39 18,40 16,42 13,44 13,45 15,44 17,43 19,42 20,40 21,38 22,36 24,37 26,39 26,40 29,41 32,36 36,36 36,34 35,31 33,28 35,28 39,20 43,12 45,12 52,17 59,22 58,25 56,26 54,25 51,26 50,28 49,30 52,29 56,27 61,25 66,25 68,23 72,21 73,16 76,9 77,8 80,13 84,18 88,22 91,22 94,16 98,10 100,6 103,2 102,5 100,8 100,13 105,9 107,11 109,13 108,16 106,19 108,21 110,21 114,22 117,24 121,28 122,31 120,34 122,37 118,39 121,41 125,39 126,35 129,35 130,38 131,43 135,44 138,48 141,53 139,56 143,59 150,59 156,51 159,54 163,58 170,61 176,65 179,67 176,69 170,70 160,71 150,72 139,73 128,72 113,74 104,77 96,76 86,75 77,73 69,72 67,70 60,70 54,69 48,68 43,67 39,66 37,67 33,69 28,71 25,71 20,70 15,68 12,66 9,64 5,62 5,60 7,58 11,58 13,56 16,56 18,59 19,60 17,62 20,64 24,66 25,65 22,63 21,61 23,60 26,60 28,60 30,60 28,59 24,58 21,56 18,55 14,54 12,54 10,56 10,57 8,57 8,55 5,53 1,51 -2,49 -5,48 -2,47 -1,46 -2,44 -9,43 -9,42 -9,38 -7,37;
-5,50 1,51 2,53 0,54 -2,56 -4,58 -5,57 -3,54 -5,52;
-10,52 -6,52 -6,54 -8,55 -10,54;
-22,64 -16,63 -14,65 -18,66 -22,65;
130,31 131,33 134,34 137,35 140,36 141,39 141,42 145,43 142,45 140,41 139,37 136,36 133,35 130,34 129,32;
95,5 99,3 103,-1 106,-6 103,-6 99,0 95,3;
105,-6 108,-6 110,-7 114,-8 111,-8 107,-7;
109,1 111,3 114,5 117,7 119,4 118,1 116,-2 112,-3 109,-1;
131,-1 135,-2 139,-3 143,-4 147,-6 150,-9 145,-8 141,-8 137,-6 133,-3;
120,14 122,17 121,18 120,16;
122,7 125,9 126,7 124,6;
114,-22 113,-26 115,-33 119,-35 124,-33 129,-32 132,-32 137,-35 140,-38 146,-39 150,-37 153,-32 153,-27 150,-22 146,-19 143,-14 142,-11 141,-15 138,-17 135,-15 132,-11 129,-15 125,-14 121,-18;
145,-41 148,-41 147,-43 145,-43;
173,-35 178,-37 178,-39 175,-41 174,-40 174,-37;
172,-41 174,-42 173,-44 170,-46 168,-46 170,-43;
-45,60 -41,62 -40,65 -33,68 -25,70 -20,70 -22,74 -25,77 -33,80 -45,82 -58,82 -68,80 -72,78 -67,76 -60,75 -55,72 -53,68 -50,64;
-78,68 -72,67 -64,66 -66,70 -74,73 -80,72;
-84,22 -80,23 -75,20 -78,21;
52,71 58,72 62,76 56,76 52,73;
12,77 18,78 22,80 15,80 11,79;
-180,-71 -160,-72 -140,-73 -120,-73 -100,-72 -75,-72 -62,-64 -58,-68 -45,-73 -20,-70 0,-69 20,-70 45,-67 70,-68 100,-66 120,-66 140,-67 160,-70 180,-72 180,-89 -180,-89
`,Ut=`
28,42 33,42 38,41 41,42 40,44 37,45 34,45 31,46 28,45;
48,37 53,37 54,41 52,45 49,46 47,42;
143,54 148,55 152,54 150,58 145,58
`;function ct(a){return a.split(";").map(t=>t.trim()).filter(t=>t.length>0).map(t=>t.split(/\s+/).map(e=>{const[o,n]=e.split(",");return[Number(o),Number(n)]}))}const B=ct(zt),Wt=ct(Ut),Bt=B.map(a=>{let t=180,e=-180,o=90,n=-90;for(const[i,r]of a)i<t&&(t=i),i>e&&(e=i),r<o&&(o=r),r>n&&(n=r);return{minLon:t,maxLon:e,minLat:o,maxLat:n}});function st(a,t,e){let o=!1;for(let n=0,i=a.length-1;n<a.length;i=n++){const[r,l]=a[n],[c,u]=a[i];if(l>t!=u>t){const d=r+(t-l)*(c-r)/(u-l);e<d&&(o=!o)}}return o}function Ht(a,t){let e=!1;for(let o=0;o<B.length;o++){const n=Bt[o];if(!(a<n.minLat||a>n.maxLat)&&!(t<n.minLon||t>n.maxLon)&&st(B[o],a,t)){e=!0;break}}if(!e)return!1;for(const o of Wt)if(st(o,a,t))return!1;return!0}const M=1,at=13e3,Xt=4,Yt=7,U=72,F=2,Kt=.05,nt=4.2,qt=5.5,ot=3.05,Qt=2.25,$t=4.2,Jt=6e4,Zt=`
  varying vec3 vNormalV;
  void main() {
    vNormalV = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,te=`
  precision mediump float;
  varying vec3 vNormalV;
  uniform vec3 uColor;
  void main() {
    float rim = pow(max(0.68 - dot(vNormalV, vec3(0.0, 0.0, 1.0)), 0.0), 3.2);
    gl_FragColor = vec4(uColor, rim * 0.85);
    #include <colorspace_fragment>
  }
`,ee=`
  attribute float aSize;
  attribute float aLand;
  varying vec3 vColor;
  varying float vLand;
  varying float vSun;
  uniform float uPointScale;
  uniform vec3 uSunDir;
  void main() {
    vColor = color;
    vLand = aLand;
    vSun = dot(normalize(position), uSunDir);
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uPointScale / max(0.6, -mvPos.z);
    gl_Position = projectionMatrix * mvPos;
  }
`,se=`
  precision mediump float;
  varying vec3 vColor;
  varying float vLand;
  varying float vSun;
  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    float disc = smoothstep(0.5, 0.14, dist);
    // Soft wrap terminator: dusk spans roughly ±25° of arc.
    float day = clamp(vSun * 1.4 + 0.32, 0.0, 1.0);
    vec3 lit = vColor * (0.34 + 0.82 * day);
    vec3 nightLand = vec3(0.36, 0.27, 0.18) * (0.5 + 0.5 * vColor.g);
    vec3 col = mix(lit, nightLand, (1.0 - day) * vLand * 0.42);
    float alpha = disc * mix(0.5, 0.95, vLand) * (0.42 + 0.58 * day);
    gl_FragColor = vec4(col, alpha);
    #include <colorspace_fragment>
  }
`,ae=`
  attribute float aT;
  attribute float aArc;
  varying float vT;
  varying float vArc;
  void main() {
    vT = aT;
    vArc = aArc;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,ne=`
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
`,oe=`
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
`,ie=`
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
`,re=`
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
`,le=`
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
`;class ce{renderer;camera;scene=new pt;canvas;globeGroup=new xt;resizeObserver;arcIds=[];pointScale={value:1};arcMaterial=null;hubMaterial=null;trafficMaterial=null;atmosphereMaterial=null;shellMaterial=null;yaw=-.55;yawGoal=-.55;tilt=.34;tiltGoal=.34;radius=ot;radiusGoal=ot;spinVelocity=0;dragging=!1;lastPointerX=0;lastPointerY=0;sunWorld=new G(1,0,0);sunLocal=new G(1,0,0);inverseSpin=new vt;sunLastComputed=0;rafId=0;lastTime=0;elapsed=0;visible=!1;reducedMotion=matchMedia("(prefers-reduced-motion: reduce)").matches;disposed=!1;statsCallback=null;frames=0;statsAccumulator=0;lastStatTime=0;constructor(t,e,o){this.canvas=t,this.renderer=ut(t,{alpha:!0}),this.renderer.setClearColor(0,0),this.camera=new gt(34,1,.1,20),this.camera.up.set(0,1,0),this.scene.add(this.globeGroup),this.buildDotShell(),this.buildGraticule(),this.buildAtmosphere(),this.buildHubs(o),this.buildArcsAndTraffic(e),this.refreshSun(!0),this.attachPointer(t);const n=t.parentElement??t;this.resizeObserver=new ResizeObserver(()=>this.applySize()),this.resizeObserver.observe(n),this.applySize()}buildDotShell(){const t=[],e=[],o=[],n=[],i=new y(3525085),r=new y(2861240),l=new y(1459051),c=new y,u=new G;for(let h=0;h<at;h++){const[f,m,p]=Vt(h,at,M);u.set(f,m,p);const x=b.radToDeg(Math.asin(b.clamp(m,-1,1))),v=b.radToDeg(Math.atan2(f,p)),k=Ht(x,v);if(!(!k&&h%Yt>=Xt)){if(t.push(f,m,p),k)c.copy(i).lerp(r,h*.37%1),o.push(1.35),n.push(1);else{const _=.5+.5*Math.sin(m*Math.PI*1.6+f*.5);c.copy(l).multiplyScalar(.72+_*.28),o.push(.85),n.push(0)}e.push(c.r,c.g,c.b)}}const d=new j;d.setAttribute("position",new C(t,3)),d.setAttribute("color",new C(e,3)),d.setAttribute("aSize",new C(o,1)),d.setAttribute("aLand",new C(n,1)),this.shellMaterial=new E({vertexShader:ee,fragmentShader:se,uniforms:{uPointScale:this.pointScale,uSunDir:{value:this.sunLocal}},vertexColors:!0,transparent:!0,depthWrite:!1}),this.globeGroup.add(new z(d,this.shellMaterial))}refreshSun(t=!1){const e=performance.now();if(!t&&e-this.sunLastComputed<Jt)return;this.sunLastComputed=e;const{lat:o,lon:n}=Dt(new Date);this.sunWorld.set(Math.cos(b.degToRad(o))*Math.sin(b.degToRad(n)),Math.sin(b.degToRad(o)),Math.cos(b.degToRad(o))*Math.cos(b.degToRad(n)))}updateSunLocal(){this.inverseSpin.copy(this.globeGroup.quaternion).invert(),this.sunLocal.copy(this.sunWorld).applyQuaternion(this.inverseSpin)}buildGraticule(){const t=[],e=M*.995,o=(r,l)=>t.push(r[0],r[1],r[2],l[0],l[1],l[2]);for(let r=-60;r<=60;r+=20){let l=A(r,-180,e);for(let c=1;c<=120;c++){const u=A(r,-180+c/120*360,e);o(l,u),l=u}}for(let r=-180;r<180;r+=20){let l=A(-85,r,e);for(let c=-83;c<=85;c+=2){const u=A(c,r,e);o(l,u),l=u}}const n=new j;n.setAttribute("position",new C(t,3));const i=new bt({color:928832,transparent:!0,opacity:.5});this.globeGroup.add(new tt(n,i))}buildAtmosphere(){this.atmosphereMaterial=new E({vertexShader:Zt,fragmentShader:te,uniforms:{uColor:{value:new y(1941216)}},transparent:!0,side:wt,depthWrite:!1,blending:I}),this.globeGroup.add(new yt(new At(1.13,48,32),this.atmosphereMaterial))}buildHubs(t){const e=t.length,o=new Float32Array(e*3),n=new Float32Array(e),i=new Float32Array(e),r=new Float32Array(e*3),l=new y;t.forEach((u,d)=>{const[h,f,m]=A(u.lat,u.lon,M*1.002);o.set([h,f,m],d*3),n[d]=14*u.eminence,i[d]=d*.37%1,l.setHex(u.color),r.set([l.r,l.g,l.b],d*3)});const c=new j;c.setAttribute("position",new w(o,3)),c.setAttribute("aEminence",new w(n,1)),c.setAttribute("aPhase",new w(i,1)),c.setAttribute("aColor",new w(r,3)),this.hubMaterial=new E({vertexShader:oe,fragmentShader:ie,uniforms:{uTime:{value:0},uPointScale:this.pointScale},transparent:!0,depthWrite:!1,blending:I}),this.globeGroup.add(new z(c,this.hubMaterial))}buildArcsAndTraffic(t){const e=[0,0,0],o=[0,0,0],n=[0,0,0],i=[],r=[],l=[],c=t.length*F,u=new Float32Array(c*3),d=new Float32Array(c*3),h=new Float32Array(c),f=new Float32Array(c),m=new Float32Array(c),p=new Float32Array(c*3);t.forEach((P,O)=>{this.arcIds.push(P.id);const V=A(P.fromLat,P.fromLon,M,e),K=A(P.toLat,P.toLon,M,o),q=It(Gt(V,K),M);let Q=0,$=0,J=0;for(let g=0;g<=U;g++){const S=g/U,L=Ot(V,K,S,M,q,n);g>0&&(i.push(Q,$,J,L[0],L[1],L[2]),r.push((g-1)/U,S),l.push(O,O)),Q=L[0],$=L[1],J=L[2]}for(let g=0;g<F;g++){const S=O*F+g;u.set(V,S*3),d.set(o,S*3),h[S]=g/F+O*.17%1,f[S]=2200/(P.distanceKm*60),m[S]=q}});const x=new j;x.setAttribute("position",new C(i,3)),x.setAttribute("aT",new C(r,1)),x.setAttribute("aArc",new C(l,1)),this.arcMaterial=new E({vertexShader:ae,fragmentShader:ne,uniforms:{uTime:{value:0},uActiveArc:{value:-1},uColor:{value:new y(1400437)},uActiveColor:{value:new y(2282478)}},transparent:!0,depthWrite:!1,blending:I}),this.globeGroup.add(new tt(x,this.arcMaterial));const v=new j;v.setAttribute("position",new w(p,3)),v.setAttribute("aOrigin",new w(u,3)),v.setAttribute("aDest",new w(d,3)),v.setAttribute("aPhase",new w(h,1)),v.setAttribute("aSpeed",new w(f,1)),v.setAttribute("aLift",new w(m,1));const k=new Mt(new G,3);v.boundingSphere=k,this.trafficMaterial=new E({vertexShader:re,fragmentShader:le,uniforms:{uTime:{value:0},uPointScale:this.pointScale,uColor:{value:new y(10875900)}},transparent:!0,depthWrite:!1,blending:I});const _=new z(v,this.trafficMaterial);_.frustumCulled=!1,this.globeGroup.add(_)}setActiveCorridor(t,e){const o=t?this.arcIds.indexOf(t):-1;if(this.arcMaterial&&(this.arcMaterial.uniforms.uActiveArc.value=o),o>=0&&e){const n=A(e.fromLat,e.fromLon,M),i=A(e.toLat,e.toLon,M);this.yawGoal=Ft(n,i)}this.reducedMotion&&(this.yaw=this.yawGoal,this.renderOnce()),this.wake()}setVisible(t){this.visible=t,t&&this.wake()}setReducedMotion(t){this.reducedMotion=t,t||this.wake(),this.renderOnce()}onStats(t){this.statsCallback=t}wake(){this.disposed||this.reducedMotion||!this.visible||this.rafId===0&&(this.lastTime=performance.now(),this.rafId=requestAnimationFrame(this.tick))}renderOnce(){this.disposed||!this.visible||this.rafId!==0||this.draw(performance.now())}tick=t=>{if(this.rafId=0,this.disposed)return;const e=Math.min(.05,Math.max(.001,(t-this.lastTime)/1e3));this.lastTime=t,this.elapsed+=e,this.dragging||(this.yawGoal+=Kt*e+this.spinVelocity),this.spinVelocity*=Math.exp(-4.5*e),this.yaw=ht(this.yaw,this.yawGoal,nt,e),this.tilt=Z(this.tilt,this.tiltGoal,nt,e),this.radius=Z(this.radius,this.radiusGoal,qt,e),this.globeGroup.rotation.set(this.tilt,this.yaw,0),this.arcMaterial&&(this.arcMaterial.uniforms.uTime.value=this.elapsed),this.hubMaterial&&(this.hubMaterial.uniforms.uTime.value=this.elapsed),this.trafficMaterial&&(this.trafficMaterial.uniforms.uTime.value=this.elapsed),this.draw(t),this.rafId=requestAnimationFrame(this.tick)};draw(t){this.refreshSun(),this.updateSunLocal(),this.camera.position.set(0,.052*this.radius,this.radius),this.camera.lookAt(0,0,0),this.renderer.render(this.scene,this.camera),this.frames+=1,this.statsAccumulator+=Math.min(100,t-(this.lastStatTime||t)),this.lastStatTime=t,this.statsAccumulator>=500&&this.statsCallback&&(this.statsCallback({fps:Math.round(this.frames*1e3/this.statsAccumulator),draws:this.renderer.info.render.calls,dpr:Math.min(window.devicePixelRatio||1,2)}),this.frames=0,this.statsAccumulator=0)}attachPointer(t){t.addEventListener("pointerdown",this.onPointerDown),t.addEventListener("wheel",this.onWheel,{passive:!1}),window.addEventListener("pointermove",this.onPointerMove),window.addEventListener("pointerup",this.onPointerUp),window.addEventListener("pointercancel",this.onPointerUp)}onPointerDown=t=>{t.button!==0&&t.pointerType==="mouse"||(this.dragging=!0,this.spinVelocity=0,this.lastPointerX=t.clientX,this.lastPointerY=t.clientY,this.canvas.setPointerCapture?.(t.pointerId))};onPointerMove=t=>{if(!this.dragging)return;const e=t.clientX-this.lastPointerX,o=t.clientY-this.lastPointerY;this.lastPointerX=t.clientX,this.lastPointerY=t.clientY,this.yawGoal+=e*.005,this.spinVelocity=e*.0016,this.tiltGoal=b.clamp(this.tiltGoal+o*.0035,.06,1.15),this.wake()};onPointerUp=()=>{this.dragging=!1};onWheel=t=>{t.preventDefault(),this.radiusGoal=b.clamp(this.radiusGoal+t.deltaY*.0016,Qt,$t),this.wake()};applySize(){const e=(this.canvas.parentElement??this.canvas).getBoundingClientRect(),o=Math.max(2,Math.round(e.width)),n=Math.max(2,Math.round(e.height));this.renderer.setSize(o,n,!1),this.camera.aspect=o/n,this.camera.updateProjectionMatrix();const i=n*Math.min(window.devicePixelRatio||1,2);this.pointScale.value=.5*i*this.camera.projectionMatrix.elements[5]/240,this.renderOnce()}dispose(){this.disposed||(this.disposed=!0,this.rafId!==0&&cancelAnimationFrame(this.rafId),this.rafId=0,this.resizeObserver.disconnect(),this.canvas.removeEventListener("pointerdown",this.onPointerDown),this.canvas.removeEventListener("wheel",this.onWheel),window.removeEventListener("pointermove",this.onPointerMove),window.removeEventListener("pointerup",this.onPointerUp),window.removeEventListener("pointercancel",this.onPointerUp),mt(this.renderer,this.scene))}}const it={CAI:{iata:"CAI",lat:30.1219,lon:31.4056},FRA:{iata:"FRA",lat:50.0379,lon:8.5622},DXB:{iata:"DXB",lat:25.2532,lon:55.3657},AMS:{iata:"AMS",lat:52.3105,lon:4.7683},PVG:{iata:"PVG",lat:31.1443,lon:121.8083}};function H(a){return it[a]??it.CAI}const rt=D.map(a=>{const t=H(a.fromIata),e=H(a.toIata);return{id:a.id,fromLat:t.lat,fromLon:t.lon,toLat:e.lat,toLon:e.lon,distanceKm:a.distanceKm}}),de=[{...R("CAI"),eminence:2.6,color:6809849},{...R("FRA"),eminence:1.1,color:3718648},{...R("DXB"),eminence:1.1,color:3718648},{...R("AMS"),eminence:1.1,color:3718648},{...R("PVG"),eminence:1.1,color:3718648}];function R(a){const t=H(a);return{lat:t.lat,lon:t.lon}}const ue=({activeCorridorId:a})=>{const{isRtl:t}=lt(),e=N.useRef(null),o=N.useRef(null),n=N.useRef(null),[i,r]=N.useState(!1),[l,c]=N.useState(null);N.useEffect(()=>{const d=e.current;if(!d)return;if(!ft()){r(!0);return}let h=null;try{h=new ce(d,rt,de)}catch{r(!0);return}n.current=h,h.onStats(c);const f=o.current;let m=null;f&&typeof IntersectionObserver<"u"?(m=new IntersectionObserver(([v])=>h?.setVisible(v.isIntersecting),{rootMargin:"200px"}),m.observe(f)):h.setVisible(!0);const p=window.matchMedia("(prefers-reduced-motion: reduce)"),x=()=>h?.setReducedMotion(p.matches);return p.addEventListener?.("change",x),x(),()=>{m?.disconnect(),p.removeEventListener?.("change",x),h?.dispose(),n.current=null}},[]),N.useEffect(()=>{if(!n.current||!a)return;const d=rt.find(h=>h.id===a)??null;n.current.setActiveCorridor(d?.id??null,d?{fromLat:d.fromLat,fromLon:d.fromLon,toLat:d.toLat,toLon:d.toLon}:void 0)},[a,i]);const u=D.find(d=>d.id===a)??null;return s.jsxs("div",{ref:o,className:"relative aspect-square w-full overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_50%_42%,#081726_0%,#040a13_58%,#02060c_100%)]",children:[s.jsx("canvas",{ref:e,"aria-label":"Interactive 3D globe rendering the scheduled air corridors converging on Cairo International Airport",className:"block h-full w-full cursor-grab touch-none active:cursor-grabbing"}),!i&&s.jsxs(s.Fragment,{children:[s.jsxs("div",{className:"pointer-events-none absolute left-3 top-3 space-y-1 font-mono",dir:"ltr",children:[s.jsxs("span",{className:"inline-flex items-center gap-1.5 rounded-full border border-cyan-300/25 bg-black/45 px-2.5 py-1 text-[9px] font-bold tracking-[.18em] text-cyan-300 backdrop-blur",children:[s.jsx(St,{className:"h-3 w-3"}),"AIRWAY NETWORK · LIVE ARCS"]}),s.jsx("span",{className:"block w-fit rounded-full border border-white/10 bg-black/45 px-2.5 py-1 text-[9px] tracking-wider text-slate-400 backdrop-blur",children:"SOLAR TERMINATOR · REAL UTC"}),u&&s.jsxs("span",{className:"block w-fit rounded-full border border-white/10 bg-black/45 px-2.5 py-1 text-[9px] tracking-wider text-slate-300 backdrop-blur",children:["FOCUS ⇢ ",u.code]})]}),s.jsxs("div",{className:"pointer-events-none absolute bottom-3 left-3 flex items-center gap-1.5 font-mono text-[8px] text-slate-400",dir:"ltr",children:[s.jsx(Et,{className:"h-3 w-3 text-cyan-400/70"}),s.jsx("span",{children:t?"اسحب للتدوير · حرّك العجلة للتقريب":"DRAG TO SPIN · SCROLL TO ZOOM"}),l&&s.jsxs("span",{className:"ml-2 rounded-full border border-white/10 bg-black/45 px-2 py-0.5 backdrop-blur",children:[l.fps," FPS · ",l.draws," DRAWS · DPR ×",l.dpr]})]}),s.jsxs("div",{className:"pointer-events-none absolute bottom-3 right-3 flex gap-1 font-mono text-[8px]",dir:"ltr",children:[["FRA","DXB","AMS","PVG"].map(d=>s.jsx("span",{className:"rounded-full border border-white/10 bg-black/45 px-1.5 py-0.5 text-sky-300/80 backdrop-blur",children:d},d)),s.jsx("span",{className:"rounded-full border border-cyan-300/40 bg-cyan-400/15 px-1.5 py-0.5 font-bold text-cyan-200 backdrop-blur",children:"CAI"})]})]}),i&&s.jsx("div",{className:"absolute inset-0 grid place-items-center p-6 text-center",children:s.jsxs("div",{className:"max-w-xs space-y-2",children:[s.jsx(W,{className:"mx-auto h-6 w-6 text-cyan-400"}),s.jsx("p",{className:"font-mono text-xs text-slate-300",children:t?"متصفحك حظر WebGL — الممرات الجوية المجدولة متاحة في البطاقات أدناه.":"WebGL is unavailable — the scheduled corridors remain fully browsable in the cards below."})]})})]})},we=()=>{const{dict:a,isRtl:t}=lt(),[e,o]=N.useState(D[0]);return s.jsxs("section",{id:"corridors",className:"scroll-mt-24 relative py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto",children:[s.jsxs("div",{className:"flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 border-b border-[var(--glass-brd)] pb-6",children:[s.jsxs("div",{children:[s.jsxs("div",{className:"flex items-center gap-2 mb-2",children:[s.jsx("span",{className:"px-2.5 py-0.5 rounded-full text-xs font-mono font-medium tracking-wider bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 uppercase",children:a.corridors.sectionBadge}),s.jsx(dt,{})]}),s.jsx("h2",{className:"text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-title h2-display",children:a.corridors.title}),s.jsx("p",{className:"mt-2 text-sm sm:text-base text-muted max-w-2xl",children:a.corridors.subtitle})]}),s.jsxs("div",{className:"self-start md:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl glass-subcard text-xs font-mono text-muted",children:[s.jsx(W,{className:"w-4 h-4 text-cyan-500"}),s.jsx("span",{dir:"ltr",children:"SCHEDULED AIRWAY NETWORK"})]})]}),s.jsxs("div",{className:"grid grid-cols-1 lg:grid-cols-12 gap-8",children:[s.jsx("div",{className:"lg:col-span-4 space-y-3",children:D.map(n=>{const i=e.id===n.id;return s.jsxs("button",{type:"button",onClick:()=>o(n),"aria-pressed":i,className:`w-full text-left rtl:text-right p-4 rounded-2xl border cursor-pointer transition-all duration-200 glass-panel-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--c-bg)] ${i?"bg-gradient-to-r from-cyan-500/15 via-[var(--glass-bg)] to-[var(--glass-bg)] border-cyan-500 shadow-md":"glass-panel"}`,children:[s.jsxs("div",{className:"flex items-center justify-between mb-2",children:[s.jsxs("div",{className:"flex items-center gap-2",children:[s.jsx(Ct,{className:`w-4 h-4 ${i?"text-cyan-500":"text-muted"}`}),s.jsx("span",{className:"font-mono font-bold text-base text-title",dir:"ltr",children:n.code})]}),s.jsxs("span",{className:"text-xs font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 border border-cyan-500/20 font-semibold",dir:"ltr",children:[n.weeklyFrequencies," ",t?"رحلة/أسبوعياً":"weekly"]})]}),s.jsxs("div",{className:"text-xs text-muted flex items-center justify-between font-mono",children:[s.jsx("span",{children:t?n.fromCityAr:n.fromCityEn}),s.jsx("span",{className:"text-cyan-500",dir:"ltr",children:"➔"}),s.jsx("span",{children:t?n.toCityAr:n.toCityEn})]}),s.jsxs("div",{className:"mt-2 pt-2 border-t border-[var(--glass-brd)] flex items-center justify-between text-[11px] font-mono text-muted",children:[s.jsxs("span",{dir:"ltr",children:[n.distanceKm.toLocaleString()," KM"]}),s.jsx("span",{children:t?n.flightTimeAr:n.flightTimeEn})]})]},n.id)})}),s.jsxs("div",{className:"lg:col-span-8 space-y-6",children:[s.jsxs("div",{className:"glass-panel rounded-3xl p-3 sm:p-4 shadow-xl",children:[s.jsxs("div",{className:"flex items-center justify-between px-2 pb-3 font-mono text-[10px] tracking-wider text-muted",dir:"ltr",children:[s.jsxs("span",{className:"flex items-center gap-1.5",children:[s.jsx(W,{className:"h-3.5 w-3.5 text-cyan-500"}),t?"شبكة الممرات فوق الكرة — دوائر عظمى فعلية":"GREAT-CIRCLE NETWORK STATE"]}),s.jsx("span",{className:"text-cyan-500/70",children:"WEBGL · 6 DRAWS"})]}),s.jsx(ue,{activeCorridorId:e.id})]}),s.jsxs("div",{className:"glass-panel rounded-2xl p-6 sm:p-8 shadow-xl space-y-6",children:[s.jsxs("div",{className:"flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--glass-brd)] pb-4 gap-3",children:[s.jsxs("div",{children:[s.jsxs("div",{className:"flex items-center gap-3",children:[s.jsx("span",{className:"text-2xl sm:text-3xl font-black font-mono text-title",dir:"ltr",children:e.code}),s.jsxs("span",{className:"text-xs font-mono px-2.5 py-1 rounded bg-sky-500/15 text-sky-600 dark:text-sky-300 font-bold",dir:"ltr",children:[e.fromIata," ➔ ",e.toIata]})]}),s.jsxs("p",{className:"text-xs sm:text-sm text-muted mt-1",children:[t?e.fromCityAr:e.fromCityEn," ➔ ",t?e.toCityAr:e.toCityEn]})]}),s.jsxs("div",{className:"self-start sm:self-auto px-3 py-1.5 rounded-xl glass-subcard text-xs font-mono text-cyan-600 dark:text-cyan-300 flex items-center gap-1.5",children:[s.jsx(Lt,{className:"w-3.5 h-3.5 text-cyan-500"}),s.jsxs("span",{dir:"ltr",children:[e.weeklyFrequencies," ",a.corridors.weeklyFlights]})]})]}),s.jsxs("div",{className:"grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono",children:[s.jsxs("div",{className:"p-3.5 rounded-xl glass-subcard",children:[s.jsx("span",{className:"block text-[10px] text-muted uppercase",children:a.corridors.distance}),s.jsxs("span",{className:"text-lg font-bold text-title tabular block mt-0.5",dir:"ltr",children:[e.distanceKm.toLocaleString()," ",s.jsx("span",{className:"text-xs text-muted font-normal",children:"KM"})]})]}),s.jsxs("div",{className:"p-3.5 rounded-xl glass-subcard",children:[s.jsx("span",{className:"block text-[10px] text-muted uppercase",children:a.corridors.flightDuration}),s.jsx("span",{className:"text-sm font-bold text-cyan-600 dark:text-cyan-300 block mt-0.5",children:t?e.flightTimeAr:e.flightTimeEn})]}),s.jsxs("div",{className:"p-3.5 rounded-xl glass-subcard col-span-2 sm:col-span-1",children:[s.jsx("span",{className:"block text-[10px] text-muted uppercase",children:t?"المشغل والتحالف":"Operating Fleet Alliance"}),s.jsx("span",{className:"text-xs font-bold text-title truncate block mt-0.5",children:t?e.carrierAr:e.carrierEn})]})]}),s.jsxs("div",{className:"p-4 rounded-xl glass-subcard space-y-1.5",children:[s.jsxs("span",{className:"block text-xs font-mono font-bold text-cyan-600 dark:text-cyan-300 uppercase tracking-wider flex items-center gap-1.5",children:[s.jsx(Nt,{className:"w-3.5 h-3.5 text-cyan-500"}),s.jsxs("span",{children:[a.corridors.corridorRole,":"]})]}),s.jsx("p",{className:"text-sm text-muted leading-relaxed font-sans",children:t?e.strategicSignificanceAr:e.strategicSignificanceEn})]}),s.jsxs("div",{className:"p-4 rounded-xl glass-subcard space-y-1.5",children:[s.jsxs("span",{className:"block text-xs font-mono font-bold text-title uppercase tracking-wider flex items-center gap-1.5",children:[s.jsx(Tt,{className:"w-3.5 h-3.5 text-cyan-500"}),s.jsxs("span",{children:[a.corridors.primaryCommodities,":"]})]}),s.jsx("p",{className:"text-xs sm:text-sm text-muted leading-relaxed font-sans",children:t?e.primaryCargoAr:e.primaryCargoEn})]})]})]})]})]})};export{we as CorridorsAir};
//# sourceMappingURL=CorridorsAir-CXeh75VD.js.map

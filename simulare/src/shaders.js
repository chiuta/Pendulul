export const NOISE = /* glsl */ `
float hash31(vec3 p){ p = fract(p*0.3183099+.1); p *= 17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float vnoise(vec3 x){
  vec3 i = floor(x); vec3 f = fract(x); f = f*f*(3.0-2.0*f);
  return mix(mix(mix(hash31(i+vec3(0,0,0)),hash31(i+vec3(1,0,0)),f.x),
                 mix(hash31(i+vec3(0,1,0)),hash31(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(hash31(i+vec3(0,0,1)),hash31(i+vec3(1,0,1)),f.x),
                 mix(hash31(i+vec3(0,1,1)),hash31(i+vec3(1,1,1)),f.x),f.y),f.z);
}
float fbm(vec3 p){
  float a = 0.5; float s = 0.0;
  for(int i=0;i<6;i++){ s += a*vnoise(p); p = p*2.03 + vec3(1.7,9.2,3.1); a *= 0.5; }
  return s;
}
`;

export const OBJ_VS = /* glsl */ `
varying vec3 vObj; varying vec3 vWN; varying vec3 vWP;
void main(){
  vObj = position;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWP = wp.xyz;
  vWN = normalize(mat3(transpose(inverse(modelMatrix))) * normal);
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

export const PLANET_FS = /* glsl */ `
uniform vec3 uLDir[3]; uniform vec3 uLCol[3];
uniform float uSea, uMount, uIce, uTide, uLava, uBands, uHemi, uCut, uTemp, uTime;
uniform vec3 uTideObj, uCutN, uCutC;
varying vec3 vObj; varying vec3 vWN; varying vec3 vWP;
${NOISE}
void main(){
  if(uCut > 0.5 && dot(vWP - uCutC, uCutN) > 0.0) discard;
  vec3 N = normalize(vWN);
  vec3 V = normalize(cameraPosition - vWP);
  if(!gl_FrontFacing){ gl_FragColor = vec4(0.05,0.025,0.015,1.0); return; }
  vec3 p = normalize(vObj);
  float h = fbm(p*2.4 + vec3(3.1,1.7,0.4));
  float ridge = 1.0 - abs(2.0*fbm(p*5.2 + vec3(7.0,2.0,5.0)) - 1.0);
  float tc = dot(p, uTideObj);
  float level = uSea + 1.05*uTide*(tc*tc - 0.33) + 0.35*uTide*tc;
  float land = smoothstep(level-0.012, level+0.012, h);
  float mount = smoothstep(0.5, 0.92, ridge) * uMount * land * smoothstep(level+0.02, level+0.2, h);
  float H = h + mount*0.28;
  float depth = clamp((level - h)*4.0, 0.0, 1.0);
  vec3 ocean = mix(vec3(0.05,0.24,0.40), vec3(0.01,0.05,0.15), depth);
  float lat = abs(p.y);
  float warm = smoothstep(200.0, 265.0, uTemp);
  vec3 lowland = mix(vec3(0.55,0.47,0.33), vec3(0.16,0.33,0.12), warm*(1.0-smoothstep(0.55,0.95,lat)));
  vec3 highland = mix(vec3(0.40,0.35,0.30), vec3(0.58,0.55,0.50), smoothstep(0.2,0.5,mount));
  float elev = smoothstep(level, level+0.25, h);
  vec3 landc = mix(lowland, highland, clamp(elev*1.2 + mount*2.0, 0.0, 1.0));
  float dry = smoothstep(0.0, -0.8, tc) * uTide * 1.5;
  landc = mix(landc, vec3(0.62,0.50,0.32), clamp(dry, 0.0, 0.8));
  vec3 base = mix(ocean, landc, land);
  float iceLim = 1.04 - uIce*1.25 + (fbm(p*4.0+9.0)-0.5)*0.25;
  float ice = smoothstep(iceLim-0.04, iceLim+0.04, lat);
  ice = max(ice, smoothstep(0.85, 1.0, uIce));
  base = mix(base, mix(vec3(0.72,0.82,0.92), vec3(0.92,0.95,0.99), land), ice*0.92);
  // normal bump pe uscat
  vec3 dpdx = dFdx(vWP); vec3 dpdy = dFdy(vWP);
  float dHx = dFdx(H); float dHy = dFdy(H);
  vec3 r1 = cross(dpdy, N); vec3 r2 = cross(N, dpdx);
  float det = dot(dpdx, r1);
  vec3 grad = sign(det) * (dHx*r1 + dHy*r2);
  float bump = 0.05 * (land*0.8 + 0.2) * (1.0-ice*0.5);
  vec3 Nb = normalize(abs(det)*N - bump*grad);
  vec3 col = vec3(0.0); vec3 spec = vec3(0.0);
  float oceanMask = (1.0-land)*(1.0-ice*0.8);
  for(int i=0;i<3;i++){
    float ndl = dot(Nb, uLDir[i]);
    float d = smoothstep(-0.06, 0.35, ndl);
    col += base * uLCol[i] * d;
    float sc = smoothstep(-0.12, 0.0, ndl) * (1.0 - smoothstep(0.0, 0.18, ndl));
    col += base * uLCol[i] * vec3(0.9,0.35,0.1) * sc * 0.18;
    vec3 Hh = normalize(uLDir[i] + V);
    spec += uLCol[i] * pow(max(dot(N,Hh),0.0), 260.0) * (oceanMask*0.4 + ice*0.1) * step(0.0, ndl);
  }
  col += base * vec3(0.012,0.016,0.03);
  float cr = abs(fbm(p*8.0 + vec3(1.0,5.0,9.0)) - 0.5);
  float lavaMask = (1.0 - smoothstep(0.0, 0.035, cr)) * uLava * land;
  col += vec3(1.0,0.38,0.06) * lavaMask * 2.4 * (1.0 - ice*0.7);
  if(uBands > 0.5){
    // atlas.md, harta 1: centura luminată 30° S – 45° N; centura de umbră 45°–72° N și 30°–72° S; calotele de la 72° (N și S)
    float ld = degrees(asin(clamp(p.y,-1.0,1.0)));
    bool cap = abs(ld) > 72.0;
    bool litB = ld >= -30.0 && ld <= 45.0;
    vec3 tint = cap ? vec3(0.78,0.58,1.0) : (litB ? vec3(1.0,0.8,0.4) : vec3(0.45,0.6,1.0));
    col = mix(col, col*tint*1.7, 0.6) + tint*0.035;
    float w = 0.55;
    float e1 = (1.0 - smoothstep(0.0, w, abs(ld+30.0))) + (1.0 - smoothstep(0.0, w, abs(ld-45.0)));
    float e2 = (1.0 - smoothstep(0.0, w, abs(ld-72.0))) + (1.0 - smoothstep(0.0, w, abs(ld+72.0)));
    float e3 = (1.0 - smoothstep(0.0, 0.4, abs(abs(ld)-78.0))) + (1.0 - smoothstep(0.0, 0.4, abs(abs(ld)-84.0)));
    col += vec3(1.0,0.9,0.6)*e1*0.9 + vec3(0.8,0.7,1.0)*e2*0.9 + vec3(0.7,0.5,1.0)*e3*0.7;
  }
  if(uHemi > 0.5){
    vec3 tint = tc > 0.0 ? vec3(0.3,0.6,1.0) : vec3(1.0,0.75,0.35);
    col = mix(col, col*tint*1.6, 0.5) + tint*0.045*clamp(abs(tc)*2.0,0.0,1.0);
    col += vec3(1.0)*(1.0 - smoothstep(0.0, 0.015, abs(tc)))*0.6;
  }
  gl_FragColor = vec4(col + spec, 1.0);
}
`;

export const CLOUD_FS = /* glsl */ `
uniform vec3 uLDir[3]; uniform vec3 uLCol[3];
uniform float uCover, uTime, uCut; uniform vec3 uCutN, uCutC;
varying vec3 vObj; varying vec3 vWN; varying vec3 vWP;
${NOISE}
void main(){
  if(uCut > 0.5 && dot(vWP - uCutC, uCutN) > 0.0) discard;
  vec3 N = normalize(vWN);
  float c = fbm(normalize(vObj)*3.2 + vec3(uTime*0.01, 0.0, uTime*0.006));
  float a = smoothstep(1.0-uCover, 1.0-uCover+0.16, c) * 0.85;
  vec3 lit = vec3(0.015,0.02,0.035);
  for(int i=0;i<3;i++){ lit += uLCol[i] * smoothstep(-0.08, 0.5, dot(N, uLDir[i])); }
  gl_FragColor = vec4(vec3(0.95,0.96,1.0)*lit, a);
}
`;

export const ATMO_FS = /* glsl */ `
uniform vec3 uLDir[3]; uniform vec3 uLCol[3];
uniform float uThick, uCut; uniform vec3 uCutN, uCutC;
varying vec3 vObj; varying vec3 vWN; varying vec3 vWP;
void main(){
  if(uCut > 0.5 && dot(vWP - uCutC, uCutN) > 0.0) discard;
  vec3 N = normalize(vWN);
  vec3 V = normalize(cameraPosition - vWP);
  float f = pow(clamp(0.72 + dot(N, V), 0.0, 1.0), 4.0);
  vec3 c = vec3(0.0);
  for(int i=0;i<3;i++){
    float l = smoothstep(-0.45, 0.35, dot(normalize(vWP - (vWP - N)), uLDir[i]));
    vec3 tint = mix(vec3(1.0,0.45,0.2), vec3(0.32,0.58,1.0), smoothstep(-0.1, 0.4, dot(N, uLDir[i])));
    c += uLCol[i] * tint * l;
  }
  gl_FragColor = vec4(c * f * uThick * 1.6, f * uThick);
}
`;

export const STAR_FS = /* glsl */ `
uniform vec3 uCol; uniform float uTime;
varying vec3 vObj; varying vec3 vWN; varying vec3 vWP;
${NOISE}
void main(){
  vec3 p = normalize(vObj);
  float g = fbm(p*9.0 + uTime*0.05);
  float g2 = fbm(p*20.0 - uTime*0.08);
  float v = 0.72 + 0.55*g + 0.25*g2;
  float limb = pow(max(dot(normalize(vWN), normalize(cameraPosition - vWP)), 0.0), 0.45);
  gl_FragColor = vec4(uCol * v * limb * 3.2, 1.0);
}
`;

export const DISK_VS = /* glsl */ `
varying vec3 vPos;
void main(){ vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
`;

export const DISK_FS = /* glsl */ `
uniform float uTime, uInner, uOuter;
varying vec3 vPos;
${NOISE}
void main(){
  float r = length(vPos.xy);
  float a = atan(vPos.y, vPos.x);
  float t = clamp((r - uInner)/(uOuter - uInner), 0.0, 1.0);
  float rot = uTime * 2.2 / pow(max(r,0.5), 1.5);
  float n = fbm(vec3(r*1.6, cos(a+rot)*2.4, sin(a+rot)*2.4));
  float beam = 0.45 + 0.9*(0.5 + 0.5*cos(a + 0.9));
  vec3 hot = vec3(1.0,0.93,0.8) * 3.0;
  vec3 cold = vec3(1.0,0.38,0.08) * 1.3;
  vec3 col = mix(hot, cold, pow(t, 0.55));
  float alpha = smoothstep(0.0, 0.05, t) * (1.0 - smoothstep(0.5, 1.0, t)) * (0.3 + 0.9*n);
  gl_FragColor = vec4(col * beam, alpha);
}
`;

export const RING_FS = /* glsl */ `
varying vec3 vPos;
void main(){
  float r = length(vPos.xy);
  float t = clamp((r - 2.02)/0.3, 0.0, 1.0);
  float a = (1.0 - t) * (1.0 - t);
  gl_FragColor = vec4(vec3(1.0,0.85,0.6) * 3.0, a);
}
`;

export const LENS_VS = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
`;

export const LENS_FS = /* glsl */ `
uniform sampler2D tDiffuse;
uniform vec2 uC; uniform float uR; uniform float uAspect; uniform float uOn;
varying vec2 vUv;
void main(){
  vec2 uv = vUv;
  if(uOn > 0.5){
    vec2 d = vUv - uC; d.x *= uAspect;
    float r = length(d);
    if(r > 1e-5){
      float s = uR*uR*1.8 / max(r, uR*0.85);
      s = min(s, r*0.92);
      s *= 1.0 - smoothstep(uR*2.0, uR*9.0, r);
      vec2 ds = d - normalize(d)*s;
      ds.x /= uAspect;
      uv = uC + ds;
    }
  }
  vec4 col = texture2D(tDiffuse, uv);
  if(uOn > 0.5){ vec2 e = vUv - uC; e.x *= uAspect; col.rgb *= smoothstep(uR*1.95, uR*2.3, length(e)); }
  gl_FragColor = col;
}
`;

export const CUT_FS = /* glsl */ `
uniform float uTime;
varying vec3 vObj; varying vec3 vWN; varying vec3 vWP;
${NOISE}
void main(){
  float rho = length(vObj.xy);
  float n = fbm(vec3(vObj.xy*6.0, 1.0));
  vec3 c;
  if(rho > 0.995){ c = vec3(0.22,0.17,0.12); }
  else if(rho > 0.80){
    float strata = 0.5 + 0.5*sin(rho*140.0 + n*6.0);
    c = vec3(0.17,0.12,0.09) + vec3(0.06,0.04,0.03)*strata + n*0.05;
  }
  else if(rho > 0.52){ c = mix(vec3(0.55,0.12,0.03), vec3(0.95,0.3,0.05), (0.80-rho)/0.28) * (0.8 + n*0.6) * 0.9; }
  else if(rho > 0.30){ c = vec3(1.0,0.55,0.12) * (1.0 + n*0.5) * 0.9; }
  else { c = vec3(1.0,0.9,0.6) * 1.2; }
  float edge = (1.0 - smoothstep(0.0, 0.006, abs(rho-0.80))) + (1.0 - smoothstep(0.0, 0.006, abs(rho-0.52))) + (1.0 - smoothstep(0.0, 0.006, abs(rho-0.30)));
  c *= 1.0 - 0.6*clamp(edge, 0.0, 1.0);
  gl_FragColor = vec4(c, 1.0);
}
`;

export const PART_VS = /* glsl */ `
attribute float aSize; attribute float aA; attribute vec3 aCol;
uniform vec3 uOrigin; uniform float uScale;
varying float vA; varying vec3 vC;
void main(){
  vA = aA; vC = aCol;
  vec4 mv = viewMatrix * vec4(position + uOrigin, 1.0);
  float ps = aSize * uScale / max(-mv.z, 0.05);
  gl_PointSize = min(ps, 22.0);
  vA = aA * min(1.0, (22.0 / max(ps, 0.001)) * (22.0 / max(ps, 0.001)));
  gl_Position = projectionMatrix * mv;
}
`;

export const PART_FS = /* glsl */ `
varying float vA; varying vec3 vC;
void main(){
  vec2 q = gl_PointCoord - 0.5;
  float d = length(q);
  float a = smoothstep(0.5, 0.0, d) * vA;
  if(a < 0.003) discard;
  gl_FragColor = vec4(vC, a);
}
`;

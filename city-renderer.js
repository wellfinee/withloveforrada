import { buildCity, cityCamera, memoryPhotos, rooftopBear, threadPoint, vertexStride, smooth, subtract, cross, unit } from './city-world.js';

const photoSamplers = memoryPhotos.map((_, index) => `Photo${index}`);
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

export function cityView(progress, width, height) {
  const aspect = width / height;
  const field = Math.max(.46, Math.min(.98, .405 / aspect));
  const { position, forward: direction } = cityCamera(progress);
  // Frame the bear and lantern together without losing the avenue on a portrait screen.
  const turn = (1 - smooth(.50, .88, aspect)) * smooth(.88, 1, progress) * .044;
  const cosine = Math.cos(turn), sine = Math.sin(turn);
  const forward = [direction[0] * cosine + direction[2] * sine, direction[1], direction[2] * cosine - direction[0] * sine];
  const right = unit(cross([0, 1, 0], forward));
  return { position, forward, right, up: cross(forward, right), projection: [1 / (field * aspect), 1 / field] };
}

export function entranceThreadPoint(width, height) {
  const view = cityView(0, width, height);
  let start = 0, end = .15;
  let offset, depth;
  for (let step = 0; step < 12; step++) {
    const point = (start + end) / 2;
    offset = subtract(threadPoint(point), view.position);
    depth = dot(view.forward, offset);
    const y = (1 - dot(view.up, offset) * view.projection[1] / depth) / 2;
    if (y > .77) start = point; else end = point;
  }
  return { x: width * (1 + dot(view.right, offset) * view.projection[0] / depth) / 2, y: height * .77 };
}

function drawVisible(gl, batches, { position, forward, right, up, projection }) {
  const side = (vector, scale) => forward.map((value, axis) => value + vector[axis] * scale);
  const planes = [forward, side(right, projection[0]), side(right, -projection[0]),
    side(up, projection[1]), side(up, -projection[1])].map(normal => ({ normal, size: normal.map(Math.abs), offset: dot(normal, position) }));
  let start = -1;
  let end = 0;
  for (const batch of batches) {
    const visible = planes.every(plane => dot(batch.center, plane.normal) + dot(batch.extent, plane.size) >= plane.offset);
    if (visible) {
      if (start < 0) start = batch.first;
      end = batch.end;
    } else if (start >= 0) {
      gl.drawArrays(gl.TRIANGLES, start, end - start);
      start = -1;
    }
  }
  if (start >= 0) gl.drawArrays(gl.TRIANGLES, start, end - start);
}

const vertex = `
  precision highp float;
  attribute vec3 aPosition, aNormal, aColor, aMaterial;
  attribute vec2 aUv;
  uniform vec3 uEye, uRight, uUp, uForward;
  uniform vec2 uProjection;
  uniform float uCurtain, uBearTurn;
  varying vec3 vWorld, vNormal, vColor, vMaterial;
  varying vec2 vUv;

  void main() {
    vec3 p = aPosition;
    float kind = aMaterial.x;
    if (kind == 9.0) {
      p.x += aMaterial.y * (1.0 - aUv.x) * uCurtain *
        (1.53 + .13 * aUv.y + .062 * sin(aUv.y * 12.0));
      p.z += sin(aUv.x * 74.0) * .053 * uCurtain;
    }
    if (kind == 11.0) {
      // Rotate the entire cutout around its seated base to preserve facial proportions.
      float turn = mix(.078, -.022, uBearTurn);
      float c = cos(turn);
      float s = sin(turn);
      vec2 pivot = vec2(${rooftopBear.x}, ${rooftopBear.z});
      p.xz = pivot + mat2(c, -s, s, c) * (p.xz - pivot);
    }
    if (kind == 15.0) {
      vec2 corner = aUv * 2.0 - 1.0;
      p += (uRight * corner.x + uUp * corner.y) * aMaterial.z * .5 - uForward * .27;
    }
    vWorld = p;
    vNormal = aNormal;
    vColor = aColor;
    vMaterial = aMaterial;
    vUv = aUv;
    vec3 offset = p - uEye;
    float depth = dot(uForward, offset);
    gl_Position = vec4(dot(uRight, offset) * uProjection.x, dot(uUp, offset) * uProjection.y,
      depth * 1.00160 - .32026, depth);
  }
`;

const tone = `
  float hash(vec2 p) {
    vec3 q = fract(vec3(p.xyx) * .1031);
    q += dot(q, q.yzx + 33.33);
    return fract((q.x + q.y) * q.z);
  }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i+vec2(1,0)), f.x),
      mix(hash(i+vec2(0,1)), hash(i+1.0), f.x), f.y);
  }
  vec3 skyTone(vec3 direction) {
    float height = max(0.0, direction.y);
    float blue = smoothstep(0.0, .65, height);
    vec3 horizon = mix(vec3(.455,.38,.40), vec3(.26,.31,.415),
      smoothstep(-.48, .65, direction.x));
    return mix(horizon, vec3(.066,.109,.204), blue);
  }
  float sunsetLevel(float progress) { return smoothstep(.78, .985, progress); }
  vec3 sunDirection() { return normalize(vec3(-.373,.105,1.0)); }
  vec3 sunsetTone(vec3 direction) {
    float altitude = max(0.0, direction.y);
    float west = 1.0 - smoothstep(.025, .76, abs(direction.x + .30));
    float glow = west * (1.0 - smoothstep(.045, .23, altitude));
    vec3 horizon = mix(vec3(.735,.203,.398), vec3(.995,.478,.385), glow * .89);
    vec3 raspberry = mix(vec3(.66,.124,.368), vec3(.474,.085,.328), smoothstep(-.29,.78,direction.x));
    vec3 plum = vec3(.172,.091,.247);
    vec3 air = mix(horizon, raspberry, smoothstep(.005,.22,altitude));
    return mix(air, plum, smoothstep(.125,.61,altitude));
  }
`;

const fragment = `
  precision highp float;
  varying vec3 vWorld, vNormal, vColor, vMaterial;
  varying vec2 vUv;
  uniform vec3 uEye;
  uniform float uProgress, uRoom;
  uniform vec4 uRoof;
  uniform vec4 uLights[8];
  uniform float uPower[8];
  uniform sampler2D ${photoSamplers.map(name => 'u' + name).join(', ')}, uTeddy, uSurface;
  ${tone}

  float ignition(float cue) {
    if (cue < 0.0) return uRoom;
    if (cue == 0.0) return 1.0;
    return smoothstep(cue - .013, cue + .013, uProgress);
  }

  float circuit(float cue, float kind) {
    float existing = ignition(cue);
    if (uRoof.y == 0.0 || existing == 0.0) return existing;
    float depth = clamp((vWorld.z - 48.0) / 142.0, 0.0, 1.0);
    float group = hash(floor(vWorld.xz * vec2(.45,.29)) + vec2(11.0, 2.0));
    float street = kind == 21.0 || (kind == 15.0 && vWorld.y < 4.0) ? -.043 : 0.0;
    float offset = .075 + pow(depth, .78) * .79 + group * .078 + street;
    if (vWorld.z < 46.0 && cue > .85) offset = .88;
    float restored = smoothstep(offset, offset + .045, uRoof.z);
    return existing * mix(1.0, restored, uRoof.y);
  }

  vec3 memoryPrint(float index) {
    ${photoSamplers.slice(0, -1).map((name, slot) => `if (index < ${slot + .5}) return texture2D(u${name}, vUv).rgb;`).join('\n    ')}
    return texture2D(u${photoSamplers.at(-1)}, vUv).rgb;
  }

  vec4 sampleSurface(float slot, vec2 uv) {
    // Mirrored repeats keep texture derivatives continuous across tile edges.
    vec2 repeatAt = fract(uv * .5) * 2.0;
    vec2 wrapped = 1.0 - abs(repeatAt - 1.0);
    vec2 cell = vec2(mod(slot, 4.0), floor(slot * .25));
    vec4 data = texture2D(uSurface, (cell * 512.0 + 8.5 + wrapped * 495.0) / vec2(2048.0, 1024.0));
    vec2 slope = (data.ba * 255.0 - 128.0) / 127.0;
    return vec4(data.rg, slope * (1.0 - step(1.0, repeatAt) * 2.0));
  }

  void main() {
    float kind = floor(vMaterial.x + .5);
    float cue = vMaterial.y;
    if (uRoof.x > .5 && (kind == 11.0 || kind == 12.0)) discard;
    vec3 fromEye = vWorld - uEye;
    float depth = length(fromEye);
    vec3 direction = fromEye / max(depth, .0001);
    float sunset = sunsetLevel(uProgress);
    vec3 atmosphere = mix(skyTone(direction), sunsetTone(direction), sunset * .51) * .91;
    float fog = 1.0 - exp(-depth * .007 - depth * depth * .000057);
    fog *= mix(1.0, .80, smoothstep(0.0, 18.0, vWorld.y));
    if (vWorld.z > 47.0) {
      atmosphere = mix(mix(vec3(.233,.276,.363), vec3(.293,.227,.350), sunset), atmosphere, .67);
      fog = (1.0 - exp(-depth * .0043 - depth * depth * .000037))
        * mix(1.04, .78, smoothstep(1.0, 20.0, vWorld.y));
    }
    if (kind == 15.0) {
      float distanceToCore = length(vUv * 2.0 - 1.0);
      float intensity = pow(max(0.0, 1.0 - distanceToCore), 3.3) * .64
        + pow(max(0.0, 1.0 - distanceToCore), 9.0) * .36;
      gl_FragColor = vec4(vColor * intensity * circuit(cue, kind) * (1.0 - fog), 1.0);
      return;
    }

    if (kind == 7.0) {
      vec2 uv = vUv;
      float band = smoothstep(.0, .20, uv.x) * (1.0 - smoothstep(.77, 1.0, uv.x));
      float fabric = sin(uv.x * 61.0 + sin(uv.y * 2.7) * .8) * .047;
      float lowerGlow = .54 + .55 * exp(-abs(uv.y - .25) * 3.1) * (.66 + .34 * band);
      float source = circuit(cue, kind);
      vec3 ink = vec3(.079,.113,.166) * (.83 + fabric + .25 * uv.y);
      vec3 lit = mix(vColor * .52, vColor * (lowerGlow + fabric), band);
      float focus = 1.0 - smoothstep(.02, .39, length((uv - vec2(.58,.35)) * vec2(1.2,.85)));
      lit += vec3(.29,.24,.13) * focus;
      lit = mix(lit, vec3(.97,.90,.73), .16);
      gl_FragColor = vec4(mix(mix(ink, lit * vMaterial.z, source), atmosphere, fog), 1.0);
      return;
    }
    if (kind == 20.0) {
      vec2 uv = vUv;
      float centered = abs(uv.x - .5);
      float jamb = (1.0 - smoothstep(.395,.452,centered))
        * smoothstep(.036,.100,uv.y) * (1.0 - smoothstep(.916,.982,uv.y));
      if (vMaterial.z < 0.0) {
        float arch = .79 + .19 * sqrt(max(0.0, 1.0 - pow(centered * 2.24, 2.0)));
        jamb *= 1.0 - smoothstep(arch - .05, arch, uv.y);
      }
      float mullion = smoothstep(.025,.059,centered);
      float rail = smoothstep(.018,.044,abs(uv.y - .65));
      float frame = jamb * mix(.24,1.0,mullion * rail);
      float drape = .84 + .09 * cos(uv.x * 38.0 + sin(uv.y * 7.0)) - centered * .48;
      float lamp = 1.0 - smoothstep(.03,.72,length((uv-vec2(.58,.36))*vec2(1.08,1.36)));
      vec3 copper = vec3(.129,.098,.093) * (.8 + uv.y * .16);
      vec3 pane = mix(vec3(.064,.085,.122), vColor * (.42 + drape * .58 + lamp * .35),
        clamp(circuit(cue, kind) * abs(vMaterial.z), 0.0, 1.0));
      gl_FragColor = vec4(mix(mix(copper, pane, frame), atmosphere, fog), 1.0);
      return;
    }
    if (kind == 21.0) {
      vec2 uv = vUv * 2.0 - 1.0;
      float radius = length(uv);
      if (radius > .97) discard;
      float pool = pow(1.0 - radius, 1.7) * .54
        + .21 * exp(-uv.y * uv.y * 24.0 - uv.x * uv.x * 3.0) * (1.0 - smoothstep(.62,.96,radius));
      float sheen = .62 + .38 * noise(vWorld.xz * vec2(2.2,8.0));
      vec3 road = vec3(.128,.148,.191) + vColor * pool * sheen * circuit(cue, kind) * vMaterial.z;
      gl_FragColor = vec4(mix(road, atmosphere, fog), 1.0);
      return;
    }
    if (kind == 8.0) {
      vec3 core = mix(vColor, vec3(1.0,.91,.70), .63);
      gl_FragColor = vec4(mix(mix(vec3(.135,.11,.105), core, circuit(cue, kind) * vMaterial.z), atmosphere, fog), 1.0);
      return;
    }
    if (kind == 12.0) {
      gl_FragColor = vec4(mix(vec3(1.0,.732,.365), atmosphere, fog), 1.0);
      return;
    }
    if (kind == 10.0) {
      vec3 print = memoryPrint(vMaterial.z);
      print = print * vec3(1.06,.93,.81) + vec3(.10,.061,.031);
      gl_FragColor = vec4(mix(print * (.25 + .76 * circuit(cue, kind)), atmosphere, fog * .5), 1.0);
      return;
    }
    if (kind == 11.0) {
      vec4 fur = texture2D(uTeddy, vUv);
      if (fur.a < .40) discard;
      float nearLamp = smoothstep(.37,.86,vUv.x) * (1.0 - .61 * smoothstep(.21,.90,vUv.y));
      vec3 light = vec3(.80,.82,.91) + vec3(.25,.15,.036) * nearLamp * ignition(.865);
      gl_FragColor = vec4(mix(fur.rgb * light, atmosphere, fog * .42), 1.0);
      return;
    }

    vec3 n = normalize(vNormal);
    bool horizontal = abs(n.y) > .56 || (kind == 4.0 && abs(n.y) > .25);
    bool edgeOn = abs(n.x) > .5;
    vec2 side = edgeOn ? vWorld.zy : vWorld.xy;
    vec2 floorXY = vWorld.xz;
    float textureTone = 1.0;
    float wet = .12;
    float surface = -1.0;
    vec2 scale = vec2(1.0);
    vec2 coords = horizontal ? floorXY : side;
    vec3 baseColor = vColor;
    if (kind == 1.0) {
      surface = 1.0 - step(vMaterial.z, .5);
      scale = surface == 0.0 ? vec2(3.42, 3.29) : vec2(3.19, 3.20);
    }
    if (kind == 2.0 || kind == 22.0) {
      surface = 2.0;
      scale = horizontal ? vec2(3.35, 3.5) : vec2(4.0, 3.45);
    }
    if (kind == 17.0) { surface = 6.0; scale = vec2(3.32, 3.2); }
    if (kind == 18.0) { surface = 3.0; scale = vec2(2.25, 1.65); }
    if (kind == 19.0) { surface = 5.0; scale = vec2(1.55, 2.12); wet = .22; }
    if (kind == 3.0 || kind == 13.0) {
      surface = 7.0;
      scale = vec2(3.7, 3.21);
      coords.x += sin(coords.y * .83) * .096;
      wet = .27;
      if (kind == 13.0) {
        vec2 p = vUv * 2.0 - 1.0;
        p += (vec2(noise(floorXY * 2.4),noise(floorXY * 2.3+3.8)) - .5) * .31;
        float pool = 1.0 - smoothstep(.72,.98,length(p) + .06 * sin(floorXY.y * 19.0));
        if (pool < .012) discard;
        wet += pool * .72;
      }
    }
    if (kind == 4.0) {
      surface = horizontal ? 4.0 : 3.0;
      scale = vec2(3.88, 2.9);
      if (cue > .85) textureTone *= 1.0 + ignition(cue) * .08;
    }
    if (surface >= 0.0) {
      vec4 sampleAt = sampleSurface(surface, coords / scale);
      float patina = sampleAt.g - .5;
      textureTone *= .19 + sampleAt.r * 1.49;
      baseColor *= vec3(1.0 + patina * .37, 1.0 + patina * .11, 1.0 - patina * .33);
      vec3 across = horizontal || !edgeOn ? vec3(1,0,0) : vec3(0,0,1);
      vec3 along = horizontal ? vec3(0,0,1) : vec3(0,1,0);
      across -= n * dot(n, across);
      along -= n * dot(n, along);
      float relief = kind == 13.0 ? .14 : .79;
      n = normalize(n - relief * (across * sampleAt.b + along * sampleAt.a));
      if (kind == 1.0 || kind == 17.0) {
        float rain = noise(vec2(coords.x * .83, vWorld.y * .14));
        float soil = (1.0 - smoothstep(.15, 2.5, vWorld.y)) * smoothstep(.24,.77,rain);
        textureTone *= .83 + rain * .21 - soil * .12;
      }
      if (kind == 3.0 || kind == 13.0) wet += (1.0 - sampleAt.r) * .23;
    }
    if (kind == 5.0) {
      textureTone = .83 + .17 * noise(vWorld.yx * 31.0);
      wet = .35;
    }
    if (kind == 6.0) {
      textureTone = .72 + .36 * noise(side * 21.0) + .19 * noise(floorXY * 42.0);
    }
    if (kind == 9.0) {
      textureTone = .51 + .39 * (.5 + .5 * sin(vUv.x * 78.5))
        + .075 * hash(floor(vWorld.xy * 158.0));
    }
    if (kind == 16.0) textureTone = .79 + .22 * noise(side * 5.0);
    if (kind == 14.0) {
      float paper = .85 + .09 * sin(vWorld.x * 163.0) + .075 * sin(vWorld.y * 204.0);
      gl_FragColor = vec4(mix(vec3(.17,.12,.11), vec3(1.0,.76,.47) * paper, uRoom), 1.0);
      return;
    }

    vec3 moon = vec3(-.458,.864,-.187);
    vec3 light = vec3(.50,.60,.82) * (.69 + .36 * max(.0,dot(n, moon))) + vec3(.081,.070,.075);
    float westLight = max(0.0, dot(n, sunDirection()));
    light += vec3(.39,.074,.124) * sunset * (.19 + .61 * westLight);
    light *= (kind == 16.0 || kind == 9.0) ? .62 : 1.0;
    vec3 shine = vec3(0.0);
    if (kind == 3.0 || kind == 13.0 || kind == 4.0) {
      shine += vec3(.15,.21,.34) * (.15 + wet * .72) * pow(1.0 - abs(dot(-direction,n)), 2.1);
      shine += vec3(.121,.027,.061) * sunset * (.22 + wet * .62) * pow(1.0 - abs(dot(-direction,n)), 2.6);
    }
    for (int i = 0; i < 8; i++) {
      float power = uPower[i];
      if (power <= .0001) continue;
      vec3 offset = uLights[i].xyz - vWorld;
      float radius = uLights[i].w;
      float distanceSquared = dot(offset, offset);
      if (distanceSquared < radius * radius) {
        float distanceToLight = sqrt(distanceSquared);
        vec3 toLight = offset / max(.01, distanceToLight);
        float soft = (1.0 - smoothstep(radius * .46, radius, distanceToLight));
        float strength = power * soft / (1.0 + distanceSquared * .28);
        float diffuse = max(0.0, dot(n, toLight));
        light += vec3(1.0,.638,.279) * strength * (.21 + .79 * diffuse);
        if (wet > .2) {
          vec3 reflected = reflect(-toLight, n);
          float alignment = max(0.0, dot(reflected,-direction));
          float fine = .55 + .45 * textureTone;
          shine += vec3(1.0,.63,.27) * strength * wet * fine
            * (pow(alignment, 11.0) * .82 + pow(alignment, 36.0) * 1.23);
        }
      }
    }
    light *= mix(vec3(1.0), vec3(.74,.83,1.02), uRoof.y * (1.0 - uRoof.w * .52));
    vec3 above = vec3(18.21,16.20,43.14) - vWorld;
    light += vec3(.86,.48,.17) * uRoof.w / (1.0 + dot(above, above) * .66);
    vec3 color = baseColor * textureTone * light + shine;
    if (kind == 22.0 && vNormal.y > .8) {
      vec2 local = vWorld.xz - vec2(${rooftopBear.x}, ${rooftopBear.z});
      vec2 body = (local - vec2(.03,.14)) / vec2(.72,.30);
      vec2 paws = vec2(abs(local.x - .05) - .44, local.y + .015) / vec2(.27,.17);
      float contact = .46 * exp(-dot(body, body) * 1.6) + .22 * exp(-dot(paws,paws) * 1.8);
      color *= 1.0 - contact;
    }
    if (kind == 4.0 && cue > .85) color += vec3(.035,.024,.016) * ignition(cue);
    float cover = (1.0 - smoothstep(4.3, 7.0, vWorld.z)) * smoothstep(3.8, 4.65, vWorld.z);
    cover *= (1.0 - smoothstep(4.0,4.6,vWorld.y)) * (1.0 - smoothstep(1.4,1.96,abs(vWorld.x)));
    color *= 1.0 - .37 * cover;
    gl_FragColor = vec4(mix(color, atmosphere, fog), 1.0);
  }
`;

const skyVertex = `
  attribute vec2 aCorner;
  varying vec2 vCorner;
  void main() {
    vCorner = aCorner;
    gl_Position = vec4(aCorner, 1.0, 1.0);
  }
`;
const frameFragment = `
  precision mediump float;
  uniform sampler2D uFrame;
  varying vec2 vCorner;
  void main() { gl_FragColor = texture2D(uFrame, (vCorner + 1.0) * .5); }
`;
const skyFragment = `
  precision highp float;
  uniform vec3 uRight, uUp, uForward;
  uniform vec2 uProjection;
  uniform float uProgress;
  varying vec2 vCorner;
  ${tone}
  void main() {
    vec3 dir = normalize(uForward + uRight * vCorner.x / uProjection.x + uUp * vCorner.y / uProjection.y);
    float sunset = sunsetLevel(uProgress);
    vec3 base = mix(skyTone(dir), sunsetTone(dir), sunset);
    vec2 field = dir.xz / (max(dir.y, .06) + .24);
    float wisps = noise(field * vec2(1.96,4.8)) * .62 + noise(field * vec2(4.9,11.8)+5.0) * .28
      + noise(field * vec2(16.0,30.0)) * .10;
    float cloud = smoothstep(.51,.77,wisps) * smoothstep(-.05,.10,dir.y) * (1.0 - smoothstep(.16,.66,dir.y));
    float azimuth = atan(dir.x, dir.z);
    base = mix(base, vec3(.48,.355,.37), cloud * .48 * (1.0 - sunset));
    float cloudShade = 0.0;
    if (sunset > .001) {
      vec2 skyUv = vec2(azimuth, dir.y);
      vec2 streak = vec2(skyUv.x * 5.2 - skyUv.y * 1.8, skyUv.y * 36.0 + skyUv.x * 3.2);
      streak.y += (noise(skyUv * vec2(3.9, 8.0)) - .5) * 2.45;
      float broad = noise(streak + vec2(18.4, 4.3)) * .62
        + noise(streak * vec2(2.11, 1.64) + .7) * .25 + noise(streak * 4.15) * .13;
      float layer = smoothstep(.015,.064,dir.y) * (1.0 - smoothstep(.37,.63,dir.y));
      cloudShade = smoothstep(.43,.73,broad) * layer;
      float litRim = smoothstep(.43,.60,broad) * (1.0 - smoothstep(.60,.74,broad)) * layer;
      float towardSun = 1.0 - smoothstep(.08,1.05,length(dir - sunDirection()));
      vec3 shade = mix(vec3(.243,.114,.272), vec3(.447,.137,.306), towardSun);
      base = mix(base, shade, cloudShade * sunset * .81);
      base += mix(vec3(.36,.16,.27), vec3(.60,.238,.235), towardSun) * litRim * sunset * .54;
      float sun = length(dir - sunDirection());
      vec3 halo = vec3(1.0,.506,.280) * (.40 * exp(-sun * 13.0) + .26 * exp(-sun * 34.0));
      float disk = 1.0 - smoothstep(.0207,.0228,sun);
      base += halo * sunset * (1.0 - cloudShade * .55);
      vec3 sunlight = mix(vec3(1.0,.852,.669), vec3(1.0,.705,.486), smoothstep(.004,.023,sun));
      base = mix(base, sunlight, disk * sunset * (1.0 - .48 * cloudShade));
    }
    vec2 map = vec2(azimuth, asin(dir.y)) * vec2(192.0,128.0);
    vec2 cell = floor(map);
    float id = hash(cell + .13);
    float star = 1.0 - smoothstep(.034,.20,length(fract(map)-vec2(.22 + hash(cell)*.56,.22+hash(cell+13.7)*.56)));
    float stars = mix(smoothstep(.06,.35,dir.y), smoothstep(.26,.72,dir.y) * .41, sunset);
    base += vec3(.71,.79,.96) * star * smoothstep(.979,1.0,id) * stars * (1.0 - max(cloud, cloudShade));
    vec3 moonDir = normalize(mix(vec3(-.23,.265,1.0), vec3(.56,.58,1.0), sunset));
    float moon = length(dir - moonDir);
    base += vec3(.62,.43,.28) * (exp(-moon * 31.0) * .24 + exp(-moon * 9.0) * .12) * mix(1.0,.45,sunset);
    float disc = 1.0 - smoothstep(.0147,.0167,moon);
    float craters = noise(dir.xy * 500.0) * .14;
    base = mix(base, vec3(1.0,.905,.735) * (1.0 - craters), disc * (1.0 - cloud*.18) * (1.0 - sunset));
    base += (hash(gl_FragCoord.xy) - .5) / 255.0;
    gl_FragColor = vec4(base, 1.0);
  }
`;

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(log);
  }
  return shader;
}

function program(gl, vert, frag, attributes, uniforms) {
  const shaders = [compile(gl, gl.VERTEX_SHADER, vert), compile(gl, gl.FRAGMENT_SHADER, frag)];
  const object = gl.createProgram();
  for (const shader of shaders) gl.attachShader(object, shader);
  gl.linkProgram(object);
  for (const shader of shaders) gl.deleteShader(shader);
  if (!gl.getProgramParameter(object, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(object);
    gl.deleteProgram(object);
    throw new Error(log);
  }
  return {
    object,
    a: Object.fromEntries(attributes.map(key => [key, gl.getAttribLocation(object, 'a' + key)])),
    u: Object.fromEntries(uniforms.map(key => [key, gl.getUniformLocation(object, 'u' + key)]))
  };
}

function upload(gl, data) {
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  return buffer;
}

function texture(gl, slot, path, pixel, wake, limit = Infinity) {
  const handle = gl.createTexture();
  const bind = () => {
    gl.activeTexture(gl.TEXTURE0 + slot);
    gl.bindTexture(gl.TEXTURE_2D, handle);
  };
  bind();
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(pixel));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const image = new Image();
  image.addEventListener('load', () => {
    if (gl.isContextLost()) return;
    let source = image;
    const scale = limit / Math.max(image.naturalWidth, image.naturalHeight);
    if (scale < 1) {
      const scaled = document.createElement('canvas');
      scaled.width = Math.round(image.naturalWidth * scale);
      scaled.height = Math.round(image.naturalHeight * scale);
      const context = scaled.getContext('2d');
      if (context) {
        context.drawImage(image, 0, 0, scaled.width, scaled.height);
        source = scaled;
      }
    }
    bind();
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    wake();
  });
  image.src = new URL(path, import.meta.url).href;
}

async function loadSurfaces(gl, slot, anisotropyLimit) {
  const image = new Image();
  image.src = new URL('./assets/city/masonry.webp', import.meta.url).href;
  await image.decode();
  if (gl.isContextLost()) return;
  gl.activeTexture(gl.TEXTURE0 + slot);
  gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.BROWSER_DEFAULT_WEBGL);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.generateMipmap(gl.TEXTURE_2D);
  const anisotropy = gl.getExtension('EXT_texture_filter_anisotropic');
  if (anisotropy && anisotropyLimit > 1) {
    gl.texParameterf(gl.TEXTURE_2D, anisotropy.TEXTURE_MAX_ANISOTROPY_EXT,
      Math.min(anisotropyLimit, gl.getParameter(anisotropy.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
  }
}

function motionSurface(gl, slot) {
  const frame = gl.createFramebuffer();
  const color = gl.createTexture();
  const depth = gl.createRenderbuffer();
  let width = 0, height = 0;
  let ready = false;
  gl.activeTexture(gl.TEXTURE0 + slot);
  gl.bindTexture(gl.TEXTURE_2D, color);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.bindFramebuffer(gl.FRAMEBUFFER, frame);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, color, 0);
  gl.bindRenderbuffer(gl.RENDERBUFFER, depth);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, depth);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return (w, h) => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, frame);
    if (w !== width || h !== height) {
      width = w;
      height = h;
      gl.activeTexture(gl.TEXTURE0 + slot);
      gl.bindTexture(gl.TEXTURE_2D, color);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.bindRenderbuffer(gl.RENDERBUFFER, depth);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_STENCIL, w, h);
      ready = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    }
    return ready;
  };
}

export function createCity(canvas, wake) {
  const compact = matchMedia('(pointer: coarse)').matches || Math.min(screen.width, screen.height) <= 600;
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false, powerPreference: compact ? 'default' : 'high-performance' });
  if (!gl) return null;
  const debugRenderer = gl.getExtension('WEBGL_debug_renderer_info');
  const software = debugRenderer && /swiftshader|llvmpipe|software|basic render/i.test(gl.getParameter(debugRenderer.UNMASKED_RENDERER_WEBGL));
  const { solid, glow, batches, lights } = buildCity(compact);
  const cameraUniforms = ['Right', 'Up', 'Forward', 'Projection'];
  const sky = program(gl, skyVertex, skyFragment, ['Corner'], [...cameraUniforms, 'Progress']);
  const present = program(gl, skyVertex, frameFragment, ['Corner'], ['Frame']);
  const city = program(gl, vertex, fragment, ['Position', 'Normal', 'Color', 'Uv', 'Material'],
    [...cameraUniforms, 'Eye', 'Progress', 'Curtain', 'Room', 'BearTurn', 'Roof', 'Lights[0]', 'Power[0]', ...photoSamplers, 'Teddy', 'Surface']);
  const skyBuffer = upload(gl, new Float32Array([-1, -1, 3, -1, -1, 3]));
  const meshBuffer = upload(gl, solid);
  const glowBuffer = upload(gl, glow);
  const layout = [['Position', 3, 0], ['Normal', 3, 3], ['Color', 3, 6], ['Uv', 2, 9], ['Material', 3, 11]];
  const lampData = new Float32Array(32), lampPower = new Float32Array(8);
  const lightOrder = lights.map(light => ({ ...light, distance: 0 }));
  const glowCount = glow.length / vertexStride;
  memoryPhotos.forEach(([name], slot) => {
    texture(gl, slot, `assets/memories/${name}.webp`, [92, 61, 44, 255], wake, slot === 0 ? 1280 : 768);
  });
  const teddySlot = photoSamplers.length;
  const surfaceSlot = teddySlot + 1;
  const frameSlot = surfaceSlot + 1;
  const bindMotion = motionSurface(gl, frameSlot);
  texture(gl, teddySlot, 'assets/city/rooftop-teddy.png', [0, 0, 0, 0], wake, 1100);
  gl.useProgram(city.object);
  photoSamplers.forEach((name, slot) => gl.uniform1i(city.u[name], slot));
  gl.uniform1i(city.u.Teddy, teddySlot);
  gl.uniform1i(city.u.Surface, surfaceSlot);
  gl.useProgram(present.object);
  gl.uniform1i(present.u.Frame, frameSlot);
  gl.blendFunc(gl.ONE, gl.ONE);

  function bindMesh(buffer) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    for (const [key, size, offset] of layout) {
      const location = city.a[key];
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location, size, gl.FLOAT, false, vertexStride * 4, offset * 4);
    }
  }

  function screenTriangle(renderer) {
    gl.bindBuffer(gl.ARRAY_BUFFER, skyBuffer);
    gl.enableVertexAttribArray(renderer.a.Corner);
    gl.vertexAttribPointer(renderer.a.Corner, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.disableVertexAttribArray(renderer.a.Corner);
  }

  return {
    ready: loadSurfaces(gl, surfaceSlot, software ? 1 : 4),
    draw(progress, width, height, moving = false, roof = null) {
      if (!width || !height || gl.isContextLost()) return;
      const portrait = width / height < .81;
      const mobile = portrait || compact;
      const limit = mobile ? 1000 : 1440;
      const pixels = mobile ? 690000 : 1490000;
      const ratio = Math.min(devicePixelRatio || 1, mobile ? 1.22 : 1.35, limit / Math.max(width, height), Math.sqrt(pixels / (width * height)));
      const w = Math.round(width * ratio), h = Math.round(height * ratio);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      // Move using a lighter, single-sample target while preserving a sharp still at rest.
      const motionPixels = software ? (mobile ? 82000 : 112000) : (mobile ? 470000 : 920000);
      const movingScale = Math.min(1, Math.sqrt(motionPixels / (w * h)));
      const moveWidth = Math.round(w * movingScale), moveHeight = Math.round(h * movingScale);
      const quickFrame = moving && bindMotion(moveWidth, moveHeight);
      if (!quickFrame) gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, quickFrame ? moveWidth : w, quickFrame ? moveHeight : h);
      const view = roof?.view ?? cityView(progress, width, height);
      const { position, right, up, forward, projection } = view;
      const aim = renderer => {
        gl.useProgram(renderer.object);
        gl.uniform3fv(renderer.u.Right, right);
        gl.uniform3fv(renderer.u.Up, up);
        gl.uniform3fv(renderer.u.Forward, forward);
        gl.uniform2fv(renderer.u.Projection, projection);
      };

      gl.clear(gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);
      aim(city);
      gl.uniform3fv(city.u.Eye, position);
      gl.uniform1f(city.u.Progress, progress);
      const room = smooth(.526, .595, progress);
      gl.uniform1f(city.u.Room, room);
      gl.uniform1f(city.u.Curtain, smooth(.541, .613, progress));
      gl.uniform1f(city.u.BearTurn, smooth(.924, .998, progress));
      gl.uniform4f(city.u.Roof, roof?.hasProps ? 1 : 0, roof?.blackout ?? 0, roof?.wave ?? 0, roof?.warmth ?? 0);
      lampData.fill(0);
      lampPower.fill(0);
      for (const light of lightOrder) light.distance = Math.hypot(...subtract(light.position, position)) - light.radius * .35;
      lightOrder.sort((a, b) => a.distance - b.distance);
      const boundary = lightOrder[lampPower.length]?.distance ?? Infinity;
      for (let index = 0; index < Math.min(lampPower.length, lightOrder.length); index++) {
        const light = lightOrder[index];
        let intensity = light.cue < 0 ? room : light.cue === 0 ? 1 : smooth(light.cue - .013, light.cue + .013, progress);
        if (roof?.blackout) intensity *= smooth(.085, .135, roof.wave);
        if (roof?.blackout && light.position[2] > 42 && light.position[2] < 44 && light.cue === .865) {
          intensity = smooth(.88, .94, roof.wave);
        }
        lampData.set([...light.position, light.radius], index * 4);
        lampPower[index] = light.power * intensity * smooth(0, 2.4, boundary - light.distance);
      }
      gl.uniform4fv(city.u['Lights[0]'], lampData);
      gl.uniform1fv(city.u['Power[0]'], lampPower);

      bindMesh(meshBuffer);
      drawVisible(gl, batches, view);

      // Shade the sky only in pixels left uncovered by the city.
      for (const location of Object.values(city.a)) gl.disableVertexAttribArray(location);
      gl.depthMask(false);
      gl.depthFunc(gl.LEQUAL);
      aim(sky);
      gl.uniform1f(sky.u.Progress, progress);
      screenTriangle(sky);
      gl.depthFunc(gl.LESS);

      gl.useProgram(city.object);
      gl.enable(gl.BLEND);
      bindMesh(glowBuffer);
      gl.drawArrays(gl.TRIANGLES, 0, glowCount);
      gl.depthMask(true);
      gl.disable(gl.BLEND);
      for (const location of Object.values(city.a)) gl.disableVertexAttribArray(location);
      if (quickFrame) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, w, h);
        gl.disable(gl.DEPTH_TEST);
        gl.useProgram(present.object);
        screenTriangle(present);
      }
    }
  };
}

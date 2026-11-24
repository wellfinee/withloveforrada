import { buildSkyline } from './city-skyline.js';

export const material = {
  solid: 0, brick: 1, stone: 2, road: 3, tile: 4, metal: 5,
  leaf: 6, window: 7, flame: 8, curtain: 9, photo: 10, bear: 11,
  thread: 12, water: 13, shade: 14, glow: 15, wall: 16,
  plaster: 17, trim: 18, wood: 19, cityWindow: 20, pavementLight: 21, seat: 22
};

// File number and original aspect ratio of each print.
export const memoryPhotos = [['07', 985 / 1750], ['06', 809 / 1750], ['01', 1750 / 809], ['03', 985 / 1750]];
export const vertexStride = 14;
export const rooftopBear = { x: 18.18, z: 42.44, seatY: 14.04 };

export const between = (a, b, t) => a + (b - a) * t;
export const clamp = value => Math.max(0, Math.min(1, value));
export const smooth = (a, b, value) => {
  const t = clamp((value - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const subtract = (a, b) => a.map((value, axis) => value - b[axis]);
export const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const unit = vector => {
  const length = Math.hypot(...vector) || 1;
  return vector.map(value => value / length);
};

const path = [
  [0, -.22, 1.73, -1.34], [.04, -.04, 1.71, 2.65], [.09, .09, 1.58, 6.7],
  [.12, .12, 1.45, 9], [.20, -.25, 1.24, 14.7], [.244, -.05, 1.17, 17.7],
  [.285, .23, 1.16, 20.72], [.328, .66, 1.22, 23.35], [.37, 1.32, 1.42, 25.4],
  [.41, 1.81, 1.63, 27.6], [.46, 4.23, 1.84, 29.45], [.51, 7.9, 2.60, 30.8],
  [.55, 10.25, 4.34, 31.64], [.60, 12.78, 5.35, 31.99], [.65, 14.45, 5.93, 31.94],
  [.69, 15.45, 6.67, 31.75], [.74, 16.17, 8.32, 31.65], [.80, 16.73, 11.06, 31.86],
  [.85, 17, 13.61, 32.69], [.88, 17.12, 14.67, 34.35], [.93, 17.39, 16.17, 36.45],
  [1, 17.68, 16.78, 37.86]
];

// Track yaw and pitch separately from position to avoid whipping past near targets.
const gaze = [
  [0, 2.215, 2.159], [.10, .85, 1.06], [.17, 5, 1.85], [.225, 15, 3.25],
  [.272, 28.8, 4.65], [.315, 14.8, 3.7], [.344, 12, 2.5], [.375, 26, 4.9],
  [.424, 57.5, 8.85], [.459, 68, 10.1], [.493, 64, 16.1], [.529, 54, 19.4],
  [.561, 42, 14.6], [.592, 23, 8.2], [.621, -3, -.8], [.652, -20, -3.25],
  [.676, -20, 2.1], [.706, -5, 10.9], [.74, 14, 15], [.759, 18.7, 10.7],
  [.788, 8.3, 5.1], [.822, 2.25, 2.2], [.852, 1.65, .24],
  [.90, .2, -3.45], [.95, -2.75, -6.40], [1, -3.75, -7.15]
];

// A clamped cubic spline keeps velocity and acceleration continuous at every knot.
function spline(keys, initialVelocity, finalVelocity) {
  const spans = keys.slice(1).map(([time], i) => time - keys[i][0]);
  const end = keys.length - 1;
  const components = keys[0].slice(1).map((_, axis) => {
    const values = keys.map(key => key[axis + 1]);
    const secants = spans.map((span, i) => (values[i + 1] - values[i]) / span);
    const upper = new Float64Array(keys.length);
    const right = new Float64Array(keys.length);
    upper[0] = .5;
    right[0] = 3 * (secants[0] - (initialVelocity?.[axis] ?? secants[0])) / spans[0];
    for (let i = 1; i <= end; i++) {
      const lower = spans[i - 1];
      const span = spans[i] || 0;
      const diagonal = 2 * (lower + span) - lower * upper[i - 1];
      const nextSlope = i === end ? finalVelocity[axis] : secants[i];
      upper[i] = span / diagonal;
      right[i] = (6 * (nextSlope - secants[i - 1]) - lower * right[i - 1]) / diagonal;
    }
    for (let i = end - 1; i >= 0; i--) right[i] -= upper[i] * right[i + 1];
    return spans.map((span, i) => [values[i], secants[i] - span * (2 * right[i] + right[i + 1]) / 6,
      right[i] / 2, (right[i + 1] - right[i]) / (6 * span)]);
  });
  return progress => {
    const time = clamp(progress);
    const next = keys.findIndex(([at]) => at > time);
    const index = next < 0 ? end - 1 : next - 1;
    const t = time - keys[index][0];
    return components.map(component => {
      const [a, b, c, d] = component[index];
      return a + t * (b + t * (c + t * d));
    });
  };
}

const flightPosition = spline(path, [3.8, -.25, 87], [0, 0, 0]);
const flightGaze = spline(gaze, [0, 0], [0, 0]);

function interpolate(points, progress, field) {
  const next = points.findIndex(([time]) => time >= progress);
  const index = Math.max(0, next < 0 ? points.length - 2 : next - 1);
  const a = points[index];
  const b = points[index + 1];
  const previous = points[index - 1] || a;
  const following = points[index + 2] || b;
  const span = b[0] - a[0];
  const t = clamp((progress - a[0]) / span);
  return a[field].map((value, axis) => {
    const endpoint = b[field][axis];
    const startSlope = (endpoint - previous[field][axis]) / (b[0] - previous[0]);
    const endSlope = following === b ? 0 : (following[field][axis] - value) / (following[0] - a[0]);
    return (2 * t ** 3 - 3 * t ** 2 + 1) * value + (t ** 3 - 2 * t ** 2 + t) * startSlope * span
      + (-2 * t ** 3 + 3 * t ** 2) * endpoint + (t ** 3 - t ** 2) * endSlope * span;
  });
}

const threadPath = [
  [0, [-.97, .035, .12]], [.045, [-.33, .037, 2.75]], [.11, [.06, .04, 6.33]],
  [.16, [.39, .04, 10.6]], [.24, [-.17, .039, 16.5]], [.32, [.62, .04, 22.55]],
  [.4, [.8, .039, 26.45]], [.46, [2.61, .04, 29.42]], [.54, [7.0, .04, 30.32]],
  [.61, [10.57, .044, 30.65]], [.65, [12.11, .21, 32.93]], [.70, [12.59, 2.29, 33.70]],
  [.75, [12.17, 4.34, 33.79]], [.79, [12.36, 6.58, 33.81]], [.83, [13.95, 7.87, 33.69]],
  [.88, [14.04, 10.8, 33.82]], [.93, [15.26, 13.26, 33.51]], [.97, [16.81, 13.63, 35.60]],
  [1, [18.06, 13.64, 41.41]]
];

export const threadPoint = progress => interpolate(threadPath, progress, 1);

export function cityCamera(progress) {
  const [yaw, pitch] = flightGaze(progress).map(angle => angle * Math.PI / 180);
  const level = Math.cos(pitch);
  return { position: flightPosition(progress), forward: [Math.sin(yaw) * level, Math.sin(pitch), Math.cos(yaw) * level] };
}

const tint = (color, amount) => color.map(value => value * amount);
const palette = {
  cobble: [.25, .29, .34], curb: [.32, .35, .37], stone: [.46, .43, .41],
  mortar: [.39, .38, .38], iron: [.18, .205, .23], bronze: [.36, .26, .18],
  wood: [.33, .24, .19], slate: [.19, .23, .31], thread: [1, .67, .25]
};

class Mesh {
  constructor() {
    this.vertices = [];
    this.batches = [];
    this.batchStart = 0;
  }

  finishBatch() {
    const end = this.vertices.length;
    if (end === this.batchStart) return;
    const low = [Infinity, Infinity, Infinity], high = [-Infinity, -Infinity, -Infinity];
    for (let index = this.batchStart; index < end; index += vertexStride) {
      for (let axis = 0; axis < 3; axis++) {
        low[axis] = Math.min(low[axis], this.vertices[index + axis]);
        high[axis] = Math.max(high[axis], this.vertices[index + axis]);
      }
    }
    this.batches.push({
      first: this.batchStart / vertexStride,
      end: end / vertexStride,
      center: low.map((value, axis) => (value + high[axis]) / 2),
      extent: low.map((value, axis) => (high[axis] - value) / 2 + .02)
    });
    this.batchStart = end;
  }

  face(points, color, kind = 0, cue = 0, weight = 1, uvs = [[0, 0], [1, 0], [1, 1], [0, 1]], normal) {
    const direction = normal || unit(cross(subtract(points[1], points[0]), subtract(points[2], points[0])));
    for (const index of points.length === 4 ? [0, 1, 2, 0, 2, 3] : [0, 1, 2]) {
      this.vertices.push(...points[index], ...direction, ...color, ...uvs[index], kind, cue, weight);
    }
  }

  box(x, y, z, w, h, d, color, kind = 0, cue = 0, weight = 1) {
    const l = x - w / 2, r = x + w / 2, f = z - d / 2, b = z + d / 2;
    const low = y - h / 2, high = y + h / 2;
    const v = [[l, low, f], [r, low, f], [r, high, f], [l, high, f],
      [l, low, b], [r, low, b], [r, high, b], [l, high, b]];
    for (const indices of [[3, 2, 1, 0], [4, 5, 6, 7], [0, 4, 7, 3], [2, 6, 5, 1], [3, 7, 6, 2], [0, 1, 5, 4]]) {
      this.face(indices.map(index => v[index]), color, kind, cue, weight);
    }
  }

  beam(a, b, radius, color, kind = 0, cue = 0, weight = 1, sides = 5) {
    const axis = unit(subtract(b, a));
    const right = unit(cross(axis, Math.abs(axis[1]) > .92 ? [0, 0, 1] : [0, 1, 0]));
    const up = cross(axis, right);
    const ring = center => Array.from({ length: sides }, (_, i) => {
      const angle = 2 * Math.PI * i / sides;
      return center.map((v, j) => v + radius * (right[j] * Math.cos(angle) + up[j] * Math.sin(angle)));
    });
    const start = ring(a), end = ring(b);
    for (let i = 0; i < sides; i++) {
      const j = (i + 1) % sides;
      this.face([start[i], start[j], end[j], end[i]], color, kind, cue, weight);
    }
  }

  ellipsoid(x, y, z, rx, ry, rz, color, kind = 0, rings = 5, sides = 8) {
    const at = (row, column) => {
      const a = Math.PI * row / rings, b = 2 * Math.PI * column / sides;
      return [x + rx * Math.sin(a) * Math.cos(b), y + ry * Math.cos(a), z + rz * Math.sin(a) * Math.sin(b)];
    };
    for (let row = 0; row < rings; row++) {
      for (let column = 0; column < sides; column++) {
        const a = at(row, column), b = at(row + 1, column);
        const c = at(row + 1, column + 1), d = at(row, column + 1);
        if (row === 0) this.face([a, c, b], color, kind);
        else if (row === rings - 1) this.face([a, d, b], color, kind);
        else this.face([a, d, c, b], color, kind);
      }
    }
  }
}

// Facade coordinates are horizontal, vertical, then distance out from the wall.
function facade(mesh, x, z, orientation) {
  const side = orientation === 'left' || orientation === 'right';
  const sign = orientation === 'left' || orientation === 'back' ? 1 : -1;
  const at = (u, y, o) => side ? [x + o * sign, y, z + u] : [x + u, y, z + o * sign];
  return {
    at,
    box(u, y, o, w, h, d, color, kind, cue, weight) {
      const p = at(u, y, o);
      mesh.box(...p, side ? d : w, h, side ? w : d, color, kind, cue, weight);
    },
    plane(u, y, o, w, h, color, kind, cue, weight) {
      const mirrored = kind === material.photo && (orientation === 'right' || orientation === 'back');
      mesh.face([at(u - w / 2, y - h / 2, o), at(u + w / 2, y - h / 2, o),
        at(u + w / 2, y + h / 2, o), at(u - w / 2, y + h / 2, o)], color, kind, cue, weight,
      mirrored ? [[1, 0], [0, 0], [0, 1], [1, 1]] : undefined, side ? [sign, 0, 0] : [0, 0, sign]);
    }
  };
}

export function buildCity(compact) {
  const solid = new Mesh(), glow = new Mesh(), lights = [];
  let seed = 2879;
  const random = () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const range = (a, b) => between(a, b, random());
  const { brick, stone, road, tile, metal, leaf, window: glass, flame, curtain, photo, bear, thread, water, shade, plaster, trim, wood, seat } = material;
  const amber = [1, .66, .31];

  function light(x, y, z, radius, size, power, cue = 0) {
    lights.push({ position: [x, y, z], radius, power, cue });
    // The vertex shader turns this quad toward the current view.
    glow.face(Array.from({ length: 4 }, () => [x, y, z]), amber, material.glow, cue, size, undefined, [0, 0, 1]);
  }

  function lanternHead(x, y, z, size = 1, cue = 0) {
    const body = size * .47;
    const h = size * .55;
    for (const signX of [-1, 1]) for (const signZ of [-1, 1]) {
      solid.beam([x + signX * body * .37, y - h / 2, z + signZ * body * .37],
        [x + signX * body * .52, y + h / 2, z + signZ * body * .52], size * .024, palette.bronze, metal);
    }
    solid.box(x, y + h / 2, z, body * 1.16, size * .09, body * 1.16, palette.iron, metal);
    solid.box(x, y + h * .68, z, body * .78, size * .13, body * .78, palette.bronze, metal);
    solid.box(x, y + h * .88, z, body * .37, size * .10, body * .37, palette.bronze, metal);
    solid.box(x, y - h / 2, z, body * .9, size * .07, body * .9, palette.bronze, metal);
    solid.box(x, y - h * .61, z, body * .32, size * .10, body * .32, palette.bronze, metal);
    solid.box(x, y, z, body * .64, h * .83, body * .64, amber, flame, cue);
  }

  function postLamp(x, z, base = 0, scale = 1, cue = 0) {
    const height = base + 3.12 * scale;
    solid.box(x, base + .12 * scale, z, .47 * scale, .24 * scale, .47 * scale, palette.mortar, stone);
    solid.beam([x, base, z], [x, base + .66 * scale, z], .105 * scale, palette.bronze, metal, 0, 1, 8);
    solid.beam([x, base, z], [x, height, z], .046 * scale, palette.iron, metal, 0, 1, 8);
    for (const h of [.57, .69, 2.45, 2.57, 2.82]) {
      solid.box(x, base + scale * h, z, .15 * scale, .045 * scale, .15 * scale, palette.bronze, metal);
    }
    lanternHead(x, height, z, scale, cue);
    light(x, height, z, 9.4 * scale, 1.35 * scale, 1.45, cue);
  }

  function railing(from, to, base, height, decorative) {
    const length = Math.hypot(to[0] - from[0], to[1] - from[1]);
    const count = Math.ceil(length / .32);
    const p = (t, y) => [between(from[0], to[0], t), base + y, between(from[1], to[1], t)];
    for (const h of [.14, height * .72, height]) solid.beam(p(0, h), p(1, h), h === height ? .032 : .019, palette.iron, metal);
    for (let i = 0; i <= count; i++) {
      const t = i / count;
      solid.beam(p(t, .03), p(t, height + (i % 4 === 0 ? .13 : .035)), i % 4 === 0 ? .043 : .018, palette.iron, metal);
      if (decorative && i < count && i % 2 === 0) {
        const a = p(t, height * .43), b = p(t + 1 / count, height * .43);
        const mid = (t + .5 / count);
        solid.beam(a, p(mid, height * .61), .014, palette.iron, metal);
        solid.beam(b, p(mid, height * .61), .014, palette.iron, metal);
        solid.beam(a, p(mid, height * .25), .014, palette.iron, metal);
        solid.beam(b, p(mid, height * .25), .014, palette.iron, metal);
      }
    }
  }

  function arch() {
    const inside = 1.92, outside = 2.38, spring = 2.36;
    const front = 4.65, back = 7.04, middle = (front + back) / 2;
    for (const side of [-1, 1]) {
      const x = side * 2.55;
      solid.box(x, spring / 2, middle, 1.25, spring, 2.39, palette.stone, stone);
      solid.box(x, .16, middle, 1.36, .32, 2.51, palette.mortar, stone);
      for (const z of [front - .09, back + .09]) {
        solid.box(side * 2.18, spring, z, .63, .15, .24, palette.mortar, stone);
        solid.box(side * 2.68, 2.56, z, .43, 5.12, .49, tint(palette.stone, .93), stone);
        solid.box(side * 2.68, 5.14, z, .66, .17, .68, palette.mortar, stone);
      }
    }
    const point = (r, a, z) => [Math.cos(a) * r, spring + Math.sin(a) * r, z];
    for (let i = 0; i < 19; i++) {
      const a = Math.PI * i / 19, b = Math.PI * (i + 1) / 19;
      solid.face([point(inside, b, front), point(inside, a, front), point(inside, a, back), point(inside, b, back)],
        tint(palette.stone, i % 3 === 0 ? .78 : .9), trim);
      for (const z of [front - .045, back + .045]) {
        const col = tint(palette.stone, range(.79, 1.15));
        solid.face([point(inside, a + .006, z), point(inside, b - .006, z),
          point(outside, b - .009, z), point(outside, a + .009, z)], col, trim);
        solid.face([point(outside - .025, a, z), point(outside - .025, b, z),
          [Math.cos(b) * 2.96, 5.01, z], [Math.cos(a) * 2.96, 5.01, z]], tint(palette.mortar, .79), stone);
      }
    }
    solid.box(0, 5.05, middle, 6.31, .23, 2.59, palette.mortar, stone);
    solid.box(0, 4.56, front - .104, .35, .48, .2, tint(palette.stone, 1.18), stone);
    solid.box(-5.1, .76, 4.72, 4.0, 1.52, .65, palette.stone, stone);
    solid.box(5.1, 1.12, 4.72, 4.0, 2.24, .65, palette.stone, stone);
  }

  function bushes() {
    for (const [x, z, count] of [[-3.45, 1.35, 22], [-5.0, 3.8, 23], [3.73, 3.29, 18], [-3.67, 6.8, 14]]) {
      for (let i = 0; i < count; i++) {
        const y = range(.27, i % 6 === 0 ? 3.25 : 1.65);
        const size = range(.29, .83);
        solid.ellipsoid(x + range(-.84, .84), y, z + range(-1.55, 1.35), size, size * range(.73, 1.43),
          size * .85, tint([.15, .255, .22], range(.6, 1.29)), leaf, 4, 7);
      }
    }
    const branch = [[-3.5, .1, 2.0], [-3.25, 2.78, 2.8], [-2.52, 4.1, 3.25], [-1.27, 4.66, 3.65]];
    branch.slice(1).forEach((end, index) => solid.beam(branch[index], end, .18 - index * .056, [.24, .2, .18], brick));
    for (let i = 0; i < 37; i++) {
      const x = range(-4.25, -.9), z = range(2.1, 5.28);
      const y = between(3.65, 5.16, random());
      solid.ellipsoid(x, y, z, range(.25, .75), range(.22, .68), range(.28, .75),
        tint([.125, .235, .20], range(.65, 1.27)), leaf, 3, 6);
    }
  }

  function window(f, u, y, w, h, level, decor = true) {
    const rim = decor ? .085 : .065;
    const sill = palette.mortar;
    if (decor) {
      f.box(u, y, .027, w + .27, h + .29, .13, tint(palette.stone, .83), stone);
      f.box(u, y - h / 2 - .077, .14, w + .31, .135, .29, sill, trim);
      f.box(u, y - h / 2 - .034, .18, w + .34, .042, .31, tint(sill, 1.15), trim);
      f.box(u, y + h / 2 + .09, .095, w + .23, .135, .22, sill, trim);
    }
    f.plane(u, y, decor ? .097 : .021, w, h, [1, range(.56, .76), range(.22, .41)], glass, level, range(.65, 1.25));
    const offset = decor ? .13 : .039;
    for (const side of [-1, 1]) {
      f.box(u + side * w * .5, y, offset, rim, h + rim, .095, palette.wood, wood);
      f.box(u, y + side * h * .5, offset, w, rim, .095, palette.wood, wood);
    }
    if (decor) {
      f.box(u, y, offset, rim * .66, h, .095, palette.wood, wood);
      f.box(u, y + h * .18, offset, w, rim * .7, .092, palette.wood, wood);
    }
  }

  function framedPhoto(f, u, y, offset, index, cue, height) {
    const width = height * memoryPhotos[index][1];
    f.box(u, y, offset - .087, width + .26, height + .23, .16, [.42, .23, .12], material.wall);
    f.plane(u, y, offset - .004, width + .12, height + .09, [.86, .68, .43], material.wall);
    f.plane(u, y, offset, width, height, [1, 1, 1], photo, cue, index);
    for (const side of [-1, 1]) {
      f.box(u + side * (width / 2 + .123), y, offset + .005, .049, height + .23, .049, [.65, .44, .21], metal);
      f.box(u, y + side * (height / 2 + .100), offset + .005, width + .26, .042, .046, [.65, .44, .21], metal);
    }
  }

  function photoWindow(f, u, y, index, cue) {
    const landscape = memoryPhotos[index][1] > 1;
    const width = landscape ? 2.44 : 1.94;
    const height = landscape ? 1.75 : 2.09;
    const frameWood = [.36, .235, .18];
    f.plane(u, y, .025, width, height, [1, .61, .31], glass, cue, .73);
    f.box(u, y - height / 2, .22, width + .32, .16, .57, palette.stone, trim);
    f.box(u, y + height / 2, .19, width + .23, .20, .46, palette.stone, trim);
    for (const side of [-1, 1]) {
      f.box(u + side * width / 2, y, .21, .17, height, .46, frameWood, wood);
      f.box(u + side * (width / 2 - .19), y, .27, .12, height - .20, .23, [.32, .19, .21], material.wall);
    }
    const printHeight = landscape ? .81 : 1.61;
    framedPhoto(f, u, y - height / 2 + printHeight / 2 + .19, .26, index, cue, printHeight);
    const [x, lightY, z] = f.at(u + width * .29, y + height * .26, .47);
    f.box(u + width * .29, lightY, .32, .16, .18, .105, amber, flame, cue, .8);
    light(x, lightY, z, 3.5, .43, .61, cue);
  }

  function gable(x, y, z, w, d, rise, color, cue = 0) {
    const a = x - w / 2, b = x + w / 2, f = z - d / 2, r = z + d / 2;
    const ridgeF = [x, y + rise, f], ridgeR = [x, y + rise, r];
    solid.face([[a, y, f], [a, y, r], ridgeR, ridgeF], color, tile, cue);
    solid.face([ridgeF, ridgeR, [b, y, r], [b, y, f]], tint(color, .83), tile, cue);
    solid.face([[a, y, f], ridgeF, [b, y, f]], tint(color, .86), brick);
    solid.face([[b, y, r], ridgeR, [a, y, r]], tint(color, .82), brick);
    return { a, b, f, r, ridgeF, ridgeR };
  }

  function chimney(x, y, z, width = .66, height = 1.36) {
    solid.box(x, y + height / 2, z, width, height, width * .82, [.34, .28, .27], brick);
    solid.box(x, y + height, z, width * 1.21, .155, width, palette.slate, stone);
    solid.box(x - width * .15, y + height + .19, z, width * .32, .31, width * .39, [.29, .23, .21], metal);
  }

  function house(x, z, w, d, h, wall, facing, style = 0, finish = brick, memory) {
    const bond = style === 2 ? 1 : 0;
    solid.box(x, h / 2, z, w, h, d, wall, finish, 0, bond);
    solid.box(x, .38, z, w + .13, .76, d + .13, tint(wall, .81), stone);
    solid.box(x, h - .19, z, w + .27, .19, d + .27, tint(palette.mortar, .85), trim);
    solid.box(x, h + .02, z, w + .57, .26, d + .59, tint(palette.mortar, 1.04), trim);
    solid.box(x, h + .105, z, w + .64, .050, d + .64, tint(palette.mortar, 1.12), trim);
    const roof = gable(x, h + .13, z, w + .75, d + .71, range(1.05, 2.3), tint(palette.slate, range(.82, 1.27)));
    solid.beam(roof.ridgeF, roof.ridgeR, .115, palette.slate, tile);
    chimney(x + .32, h + 1.34, z + d * .23);
    if (style === 2) chimney(x - .25, h + 1.24, z - d * .25, .58, 1.02);

    const fronts = Array.isArray(facing) ? facing : [facing];
    for (const direction of fronts) {
      const side = direction === 'left' || direction === 'right';
      const wallLength = side ? d : w;
      const f = facade(solid, x + (side ? (direction === 'left' ? w / 2 : -w / 2) : 0),
        z + (!side ? (direction === 'front' ? -d / 2 : d / 2) : 0), direction);
      const columns = Math.max(2, Math.round(wallLength / 2.53));
      const floors = Math.max(2, Math.floor(h / 2.42));
      for (let floor = 0; floor < floors; floor++) {
        const y = .26 + (floor + .51) * ((h - .55) / floors);
        if (floor > 0) f.box(0, y - 1.14, .053, wallLength, .085, .105, tint(palette.mortar, .86), stone);
        for (let col = 0; col < columns; col++) {
          const u = ((col + .5) / columns - .5) * (wallLength - .48);
          const level = floor === 0 && style !== 1 ? range(.07, .18) : random() > .25 ? range(.1, .40) : 2;
          if (memory && floor === 0 && memory.direction === direction && memory.column === col) {
            photoWindow(f, u, y, memory.index, memory.cue);
            continue;
          }
          if (floor === 0 && col === 0 && style !== 2) {
            f.box(u, 1.07, .072, 1.03, 2.14, .18, tint(palette.stone, .76), stone);
            f.box(u, 1.02, .171, .81, 1.98, .07, palette.wood, wood);
            f.box(u, 1.55, .226, .57, .51, .037, [.79, .44, .18], glass, level, .74);
            f.box(u + .26, .91, .237, .07, .09, .062, palette.bronze, metal);
            continue;
          }
          const bay = style === 2 && col === columns - 2 && floor > 0 && floor < 3;
          const ew = floor === 0 && style !== 1 ? 1.49 : range(.79, 1.16);
          if (bay) {
            f.box(u, y, .36, ew + .35, 1.85, .73, tint(wall, .9), finish, 0, bond);
            f.box(u, y - .93, .38, ew + .48, .16, .78, palette.mortar, stone);
            f.box(u, y + .96, .40, ew + .48, .17, .81, palette.mortar, stone);
            const point = f.at(u, y, .735);
            window(facade(solid, side ? point[0] : x, side ? z : point[2], direction), u, y, ew, 1.41, level);
          } else {
            window(f, u, y, ew, floor === 0 ? 1.57 : range(1.12, 1.42), level);
          }
          if (floor === 0 && col === 1 && style === 0) {
            f.box(u, y + .91, .24, ew + .32, .11, .52, [.37, .24, .24], metal);
            f.box(u, y + .85, .48, ew + .33, .18, .09, [.30, .22, .23], metal);
            for (let mark = -3; mark <= 3; mark++) {
              f.box(u + mark * .215, y + .845, .531, .105, .012, .012, [.76, .54, .32], flame, .15, .44);
            }
          }
        }
      }
    }
    solid.finishBatch();
  }

  solid.box(3, -.16, 67, 174, .31, 214, palette.cobble, road);
  solid.finishBatch();
  for (const [x, z, w, d] of [[-3.41, 17.1, 2.02, 22.0], [3.73, 17.55, 2.11, 16.1],
    [13.14, 33.97, 25.35, 2.04], [14.08, 25.42, 22.6, .87], [-3.13, 3.63, 2.1, 6.5]]) {
    solid.box(x, .065, z, w, .15, d, palette.curb, stone);
  }
  for (const [x, z, w, d] of [[-.94, 3.2, 1.5, 2.1], [1.04, 10.17, 1.7, 3.9], [-1.41, 14.7, 1.24, 3.0],
    [.71, 19.35, 1.45, 3.24], [1.41, 24.11, 1.39, 2.58], [4.53, 29.15, 3.76, 2.26], [10.4, 29.91, 4.0, 1.9], [17.72, 30, 4.0, 1.8]]) {
    solid.face([[x - w / 2, .001, z - d / 2], [x - w / 2, .001, z + d / 2],
      [x + w / 2, .001, z + d / 2], [x + w / 2, .001, z - d / 2]], [.26, .30, .36], water);
  }

  arch();
  bushes();
  solid.finishBatch();
  railing([-2.21, 8.78], [-2.21, 14.68], .14, .88, true);
  railing([-2.21, 15.7], [-2.21, 19.65], .14, .89, true);
  postLamp(1.91, 9.52, .08);
  postLamp(-1.94, 16.45, .08, 1, .103);
  postLamp(2.17, 22.62, .08, 1, .14);
  postLamp(-1.58, 29.8, .08, 1.10, .21);
  postLamp(18.3, 27.3, .08, 1, .32);
  solid.finishBatch();

  house(-6.03, 12.36, 5.58, 6.84, 7.78, [.40, .295, .29], 'left', 2);
  house(-6.55, 20.05, 6.53, 8.35, 9.54, [.47, .435, .39], 'left', 0, plaster);
  house(-6.85, 29.35, 7.36, 9.64, 8.9, [.39, .282, .29], ['left', 'front'], 1);
  house(6.39, 13.0, 7.19, 7.47, 8.19, [.40, .276, .279], 'right', 0);
  house(7.03, 21.15, 8.76, 8.48, 10.35, [.455, .295, .245], ['right', 'back'], 2, brick,
    { direction: 'right', column: 2, index: 1, cue: .18 });
  house(15.58, 21.05, 7.95, 8.65, 8.85, [.36, .316, .32], 'back', 0);
  house(23.83, 20.94, 8.30, 8.72, 9.97, [.42, .425, .43], 'back', 1, plaster);
  house(1.87, 38.48, 8.4, 8.95, 10.6, [.405, .409, .435], 'front', 2, stone,
    { direction: 'front', column: 1, index: 2, cue: .265 });
  house(25.48, 39.61, 7.97, 11, 10.08, [.38, .268, .288], 'front', 0);
  house(33.7, 39.28, 8.32, 10.32, 9.34, [.45, .425, .391], 'front', 1, plaster);
  house(33.7, 20.79, 10.8, 8.45, 11.12, [.35, .28, .32], 'back', 2);
  house(40.85, 30.07, 7.48, 8.92, 10.63, [.32, .29, .324], 'right', 1);
  postLamp(31.1, 32.41, .08, .95, .32);

  // The wire is anchored to the two faces and the street passes underneath it.
  const garlandPoint = t => [between(7.35, 9.9, t), 6.13 - 1.28 * Math.sin(Math.PI * t), between(25.48, 33.94, t)];
  for (let i = 0; i < 24; i++) {
    solid.beam(garlandPoint(i / 24), garlandPoint((i + 1) / 24), .013, palette.iron, metal);
  }
  for (let i = 1; i < 11; i++) {
    const [x, y, z] = garlandPoint(i / 11);
    solid.beam([x, y, z], [x, y - .22, z], .019, palette.iron, metal);
    solid.box(x, y - .14, z, .092, .076, .095, palette.bronze, metal);
    solid.ellipsoid(x, y - .24, z, .088, .12, .085, amber, flame, 4, 6);
    // Several bulbs share their light over the cobblestones.
    if (i % 3 === 2) light(x, y - .24, z, 7.3, .57, .66);
    else glow.face(Array.from({ length: 4 }, () => [x, y - .24, z]), amber, material.glow, 0, .43, undefined, [0, 0, 1]);
  }
  solid.finishBatch();

  const wall = [.38, .27, .27];
  const roomX = 13.36, roomZ = 34, openingW = 3.75, openingH = 3.12, sillY = 4.29;
  const left = 6.14, right = 21.46, front = 34, back = 45.2, roofY = 13.53;
  const openingL = roomX - openingW / 2, openingR = roomX + openingW / 2;
  const openingTop = sillY + openingH;
  const depth = 2.46;
  const mass = (l, r, bottom, top, f, b) => solid.box((l + r) / 2, (bottom + top) / 2, (f + b) / 2, r - l, top - bottom, b - f, wall, brick);
  mass(left, right, 0, roofY, front + depth, back);
  mass(left, openingL, 0, roofY, front, front + depth);
  mass(openingR, right, 0, roofY, front, front + depth);
  mass(openingL, openingR, 0, sillY, front, front + depth);
  mass(openingL, openingR, openingTop, roofY, front, front + depth);

  const special = facade(solid, 0, roomZ, 'front');
  special.box(roomX, sillY -.055, .145, openingW + .53, .22, .63, palette.stone, stone);
  special.box(roomX, openingTop + .10, .13, openingW + .39, .22, .29, palette.stone, stone);
  special.box(roomX, openingTop + .22, .073, openingW + .09, .086, .161, tint(palette.stone, 1.08), stone);
  special.box(roomX, sillY + .021, -.44, openingW + .11, .080, 1.08, [.46, .33, .23], material.wall);
  for (const side of [-1, 1]) {
    special.box(roomX + side * openingW / 2, sillY + openingH / 2, .055, .125, openingH + .12, .175, [.37, .26, .21], metal);
    special.box(roomX + side * (openingW / 2 - .30), sillY + openingH * .52, -.19, .045, openingH * .94, .09, [.46, .31, .22], metal);
  }
  special.box(roomX, openingTop - .20, -.21, openingW, .065, .063, palette.wood, metal);
  solid.box(roomX, sillY + openingH * .50, front + depth - .015, openingW, openingH, .045, [.66, .385, .24], material.wall);
  solid.box(roomX, openingTop - .015, front + depth / 2, openingW, .055, depth, [.53, .36, .27], material.wall);
  solid.box(roomX, sillY + .042, front + depth / 2, openingW, .055, depth, [.51, .34, .24], material.wall);
  for (const offset of [-1.31, 1.39]) {
    solid.box(roomX + offset, sillY + .30, front + 1.67, .61, .58, .42, [.31, .22, .20], material.wall);
  }
  const lampX = roomX - 1.22, lampZ = roomZ + 1.34;
  solid.box(lampX, sillY + .36, lampZ, .78, .61, .65, [.39, .25, .185], material.wall);
  solid.beam([lampX, sillY + .66, lampZ], [lampX, sillY + 1.37, lampZ], .051, palette.bronze, metal);
  for (let i = 0; i < 18; i++) {
    const a = i * Math.PI / 9, b = (i + 1) * Math.PI / 9;
    const edge = (r, y, theta) => [lampX + r * Math.cos(theta), y, lampZ + r * Math.sin(theta)];
    solid.face([edge(.34, sillY + 1.15, a), edge(.34, sillY + 1.15, b),
      edge(.19, sillY + 1.62, b), edge(.19, sillY + 1.62, a)], amber, shade);
  }
  light(lampX, sillY + 1.36, lampZ, 7.7, .78, 2.9, -1);
  lights.push({ position: [roomX + .15, sillY + 1.66, front -.27], radius: 4.3, power: 1.1, cue: -1 });

  framedPhoto(special, roomX + .025, sillY + 1.22, -.40, 0, -1, 2.052);

  // The two fabric panels move and bunch toward the jambs in the vertex shader.
  for (const side of [-1, 1]) {
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 26; col++) {
        const cloth = (u, v) => {
          const fold = Math.sin(u * Math.PI * 12.5);
          return [roomX + side * (u * 1.89 - .018), sillY + .054 + v * 2.99 + .055 * fold * (1 - v), front + .22 + .056 * fold];
        };
        const u = col / 26, v = row / 6, a = (col + 1) / 26, b = (row + 1) / 6;
        solid.face([cloth(u, v), cloth(a, v), cloth(a, b), cloth(u, b)], [.42, .245, .235], curtain, side, 1,
          [[u, v], [a, v], [a, b], [u, b]], [0, 0, -1]);
      }
    }
  }

  for (const y of [.41, 3.6, 7.75, 10.95, 12.94, 13.29]) {
    const deep = y > 12 ? .54 : .20;
    special.box((left + right) / 2, y, deep * .22, right - left + deep, y > 12 ? .25 : .13, deep, palette.mortar, stone);
  }
  for (let i = 0; i < 25; i++) {
    special.box(left + .33 + i * .611, 12.71, .17, .19, .29, .34, tint(palette.stone, .88), stone);
  }
  for (const [u, y, w, h, cue] of [[7.5, 1.77, 1.35, 1.58, .23], [10.1, 1.77, 1.38, 1.72, .15],
    [13.25, 1.77, 1.38, 1.72, .22], [16.28, 1.77, 1.38, 1.72, .27], [19.22, 1.77, 1.44, 1.72, .25],
    [8.6, 5.85, 1.29, 1.82, .26], [17.73, 5.85, 1.27, 1.91, .35], [19.76, 5.85, .94, 1.90, 2],
    [8.18, 9.35, 1.17, 1.68, .3], [11.14, 9.35, 1.19, 1.71, 2], [14.0, 9.40, 1.27, 1.87, .65],
    [19.81, 9.40, .94, 1.64, 2],
    [8.2, 11.95, 1.07, 1.39, 2], [11.23, 11.95, 1.08, 1.39, .78], [14.19, 11.95, 1.24, 1.39, .73], [17.81, 11.95, 1.12, 1.44, 2]]) {
    window(special, u, y, w, h, cue);
  }
  photoWindow(special, 17.34, 9.80, 3, .714);
  const balcony = [16.0, 18.7];
  special.box(17.35, 8.42, .42, 2.86, .16, .97, palette.stone, stone);
  railing([balcony[0], 33.14], [balcony[1], 33.14], 8.51, .84, true);
  railing([balcony[0], 33.14], [balcony[0], 34], 8.51, .84, false);
  railing([balcony[1], 33.14], [balcony[1], 34], 8.51, .84, false);
  solid.finishBatch();

  solid.box((left + right) / 2, roofY, (front + back) / 2, right - left + .22, .15, back - front + .24, [.249, .286, .35], tile);
  for (const [x, z, w, d, h] of [[left, 39.58, .30, 11.39, .58], [right, 39.58, .30, 11.39, .58],
    [(left + right) / 2, 45.15, 15.57, .35, .56]]) {
    solid.box(x, roofY + h / 2, z, w, h, d, [.32, .33, .40], brick);
    solid.box(x, roofY + h, z, w + .12, .14, d + .12, palette.mortar, stone);
  }
  chimney(9.26, roofY, 37.94, 1.04, 2.35);
  chimney(20.35, roofY, 36.28, .88, 1.75);
  chimney(10.31, roofY, 40.24, .72, 1.74);
  for (const x of [7.2, 11.1, 20.25]) {
    solid.beam([x, roofY, 37.12], [x, roofY + 2.7, 37.12], .035, palette.iron, metal);
    solid.beam([x - .46, roofY + 2.42, 37.12], [x + .46, roofY + 2.42, 37.12], .024, palette.iron, metal);
  }
  const wire = t => [between(7.2, 11.1, t), roofY + 2.62 - .54 * Math.sin(Math.PI * t), 37.12];
  for (let i = 0; i < 12; i++) solid.beam(wire(i / 12), wire((i + 1) / 12), .014, palette.iron, metal);
  const { x: teddyX, z: teddyZ, seatY } = rooftopBear;
  solid.box(18.42, roofY + .195, 42.63, 2.57, .39, 1.02, [.36, .315, .334], stone);
  solid.box(18.42, seatY - .06, 42.63, 2.78, .12, 1.16, [.42, .386, .38], seat);
  const lanternY = seatY + .30;
  lanternHead(19.37, lanternY, 42.87, .85, .865);
  light(19.37, lanternY, 42.87, 6.7, .89, 1.75, .865);

  // Place the lowest opaque pixels of the full-body cutout on the seat.
  const height = 2.13;
  const leftUV = 80 / 1254, rightUV = 1110 / 1254;
  const footUV = (1254 - 1234) / 1254;
  const bottomUV = (1254 - 1243) / 1254, topUV = (1254 - 20) / 1254;
  const unitSize = height * 1254 / (1234 - 29);
  const imageCenter = (leftUV + rightUV) / 2;
  const teddy = (u, v) => [teddyX + (u - imageCenter) * unitSize, seatY + .006 + (v - footUV) * unitSize, teddyZ];
  const uv = [[leftUV, bottomUV], [rightUV, bottomUV], [rightUV, topUV], [leftUV, topUV]];
  solid.face(uv.map(([u, v]) => teddy(u, v)), [1, 1, 1], bear, 0, 1, uv, [0, 0, -1]);
  solid.finishBatch();

  for (let i = 0; i < 330; i++) {
    const a = threadPoint(i / 330), b = threadPoint((i + 1) / 330);
    solid.beam(a, b, .017, palette.thread, thread, 0, 1, 5);
  }
  solid.finishBatch();

  buildSkyline(solid, glow, (x, z, direction) => facade(solid, x, z, direction), material, compact);
  return { solid: new Float32Array(solid.vertices), glow: new Float32Array(glow.vertices), batches: solid.batches, lights };
}


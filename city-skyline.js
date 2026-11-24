const wallPaint = [
  [.51, .395, .30], [.415, .245, .235], [.44, .451, .49], [.43, .306, .26],
  [.54, .474, .39], [.34, .397, .397], [.445, .316, .323], [.32, .34, .392]
];
const roofPaint = [
  [.20, .259, .333], [.30, .223, .23], [.23, .319, .326], [.208, .235, .29],
  [.335, .235, .205], [.25, .287, .38]
];
const limestone = [.47, .443, .399];
const iron = [.15, .171, .214];
const amber = [1, .64, .29];
const tint = (color, strength) => color.map(channel => channel * strength);

// Rows share a gently curving avenue and intersecting side streets.
const avenue = z => 11.2 - (z - 48) * .104 + Math.sin((z - 48) * .061) * 1.18;

export function buildSkyline(mesh, halos, facade, material, compact) {
  const { brick, stone, tile, plaster, trim, metal, solid, cityWindow, pavementLight, flame, glow } = material;
  let seed = 29628183;
  const random = () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const vary = (a, b) => a + (b - a) * random();
  const select = values => values[Math.floor(random() * values.length)];
  const cueAt = (x, z) => Math.min(.983, .876 + Math.hypot((x - 19) * .66, z - 43) / 1330);

  function quad(x, y, z, w, d, color, kind, cue = 0, weight = 1) {
    mesh.face([[x-w/2,y,z-d/2], [x-w/2,y,z+d/2], [x+w/2,y,z+d/2], [x+w/2,y,z-d/2]], color, kind, cue, weight);
  }

  function roofRing(lower, upper, color, cue) {
    for (let i = 0; i < lower.length; i++) {
      const j = (i + 1) % lower.length;
      mesh.face([lower[j], lower[i], upper[i], upper[j]], tint(color, i % 2 ? .88 : 1.07), tile, cue);
    }
  }

  function rectangle(x, y, z, w, d) {
    return [[x-w/2,y,z-d/2], [x+w/2,y,z-d/2], [x+w/2,y,z+d/2], [x-w/2,y,z+d/2]];
  }

  function roof(x, y, z, w, d, rise, type, colors, cue) {
    const [walls, covering] = colors;
    const eaves = rectangle(x, y, z, w, d);
    if (type === 0) {
      const ridge = [[x,y+rise,z-d/2], [x,y+rise,z+d/2]];
      mesh.face([eaves[0], eaves[3], ridge[1], ridge[0]], covering, tile, cue);
      mesh.face([ridge[0], ridge[1], eaves[2], eaves[1]], tint(covering, .85), tile, cue);
      mesh.face([eaves[0], ridge[0], eaves[1]], walls, plaster, cue);
      mesh.face([eaves[2], ridge[1], eaves[3]], tint(walls, .86), plaster, cue);
      return;
    }
    const middle = rectangle(x, y + rise * .72, z, w * .74, d * .79);
    if (type === 1) {
      roofRing(eaves, middle, covering, cue);
      roofRing(middle, rectangle(x, y + rise, z, w * .24, d * .37), tint(covering, 1.05), cue);
      quad(x, y + rise, z, w * .24, d * .37, covering, tile, cue);
      return;
    }
    const peak = rectangle(x, y + rise, z, w * .14, d * .50);
    roofRing(eaves, peak, covering, cue);
    quad(x, y + rise, z, w * .14, d * .50, covering, tile, cue);
  }

  function pane(f, x, y, w, h, cue, strength, detail, arched = false, lit = true) {
    const color = random() < .20 ? [1, .83, .61] : [1, vary(.54, .73), vary(.29, .40)];
    const onset = lit ? cue + vary(-.004, .006) : 1.3;
    f.plane(x, y, .024, w, h, color, cityWindow, onset, strength * (arched ? -1 : 1));
    if (detail) {
      f.box(x, y - h / 2 - .044, .068, w + .16, .085, .16, limestone, trim);
      f.box(x, y + h / 2 + .056, .045, w + .13, .075, .105, tint(limestone, .9), trim);
    }
  }

  function chimney(x, y, z, w, h, color, detail) {
    mesh.box(x, y + h / 2, z, w, h, w * .71, color, brick);
    mesh.box(x, y + h, z, w + .11, .13, w * .71 + .13, tint(limestone, .76), trim);
    if (detail) {
      for (const side of [-1, 1]) mesh.box(x + w * .24 * side, y + h + .16, z, .115, .25, .115, [.39, .26, .24], tile);
    }
  }

  function dormer(x, floor, z, cue, covering, lit) {
    const front = facade(x, z - .35, 'front');
    mesh.box(x, floor + .47, z, .85, .92, .72, limestone, trim);
    pane(front, 0, floor + .46, .52, .65, cue, .84, false, true, lit);
    roof(x, floor + .94, z, 1.00, .89, .33, 0, [limestone, covering], cue);
  }

  function townhouse(x, z, w, d, y, h, type, tier, cue) {
    const detailed = tier === 0 && Math.abs(x - 14) < 24;
    const middle = tier < 2;
    const walls = tint(select(wallPaint), vary(.84, 1.09));
    const covering = tint(select(roofPaint), vary(.86, 1.18));
    const floors = Math.max(2, Math.round(h / 2.54));
    const story = h / floors;
    const finish = middle ? select([brick, plaster, stone]) : solid;
    const rise = type === 0 ? vary(1.85, 3.15) : type === 1 ? vary(1.7, 2.75) : vary(1.25, 2.08);
    mesh.box(x, (y + h) / 2, z, w, y + h, d, walls, finish, cue);
    roof(x, y + h, z, w + .29, d + .29, rise, type, [walls, covering], cue);
    if (middle) mesh.box(x, y + h - .075, z, w + .36, .16, d + .36, tint(limestone, .84), trim);

    if (middle || random() < .44) {
      chimney(x + w * vary(-.23, .23), y + h + rise * .55, z + d * vary(-.13, .30), vary(.34, .61), vary(.67, 1.4), [.37, .256, .226], detailed);
    }
    if (detailed && type === 1) {
      for (const side of [-1, 1]) dormer(x + side * w * .225, y + h + .21, z - d * .41, cue, covering, random() > .27);
    }
    if (detailed && type === 0) {
      const gable = facade(x, z - d / 2 - .145, 'front');
      pane(gable, 0, y + h + .69, .55, .89, cue + .006, .82, true, true, random() > .35);
    }

    const axes = ['front'];
    if (middle || random() > .48) axes.push(x < 13 ? 'left' : 'right');
    for (const direction of axes) {
      const facingFront = direction === 'front';
      const face = facingFront ? facade(x, z - d / 2, direction)
        : facade(x + (direction === 'left' ? w / 2 : -w / 2), z, direction);
      const span = facingFront ? w : d;
      const columns = middle ? Math.max(2, Math.round(span / 1.9)) : 2;
      for (let floor = 0; floor < floors; floor++) {
        if (tier === 2 && floor === 0 && y + story < 3) continue;
        if (detailed && floor === 1) face.box(0, y + story, .024, span, .085, .11, tint(limestone, .86), trim);
        for (let col = 0; col < columns; col++) {
          const u = ((col + .5) / columns - .5) * (span - .23);
          const sill = y + (floor + .52) * story;
          const cornerShop = detailed && facingFront && floor === 0;
          const arches = cornerShop || (floor === floors - 1 && type === 0);
          pane(face, u, sill, cornerShop ? 1.04 : vary(.54, .83), cornerShop ? 1.48 : vary(1.0, 1.33),
            cue, vary(.67, 1.15), detailed, arches, random() > (floor === 0 ? .19 : .33));
        }
      }
    }
  }

  function lantern(x, z, cue, detailed, crossStreet = false) {
    if (detailed) {
      mesh.box(x, 1.37, z, .058, 2.74, .058, iron, metal);
      mesh.box(x, 2.77, z, .29, .08, .29, iron, metal);
      mesh.box(x, 2.52, z, .27, .082, .27, iron, metal);
    }
    mesh.box(x, 2.64, z, detailed ? .23 : .14, .22, .22, amber, flame, cue, .98);
    const radius = detailed ? 1.43 : .91;
    halos.face(Array.from({ length: 4 }, () => [x, 2.65, z]), amber, glow, cue, radius, undefined, [0, 0, 1]);
    const across = crossStreet ? 7.3 : 4.8, along = crossStreet ? 4.3 : 7.3;
    quad(x, .042, z + (crossStreet ? 0 : .8), across, along, amber, pavementLight, cue, detailed ? 1.04 : .67);
  }

  // A recognizable west-side clock tower and a zinc dome break the skyline.
  function octagon(x, y, z, radius) {
    return Array.from({ length: 8 }, (_, i) => {
      const angle = (.5 - i) * Math.PI / 4;
      return [x + Math.sin(angle) * radius, y, z + Math.cos(angle) * radius];
    });
  }

  function clockTower(x, z, y, cue) {
    const walls = [.435, .373, .354], slates = [.18, .25, .315];
    const naveX = x - 2.9, naveZ = z + 4.9;
    mesh.box(naveX, y + 3.63, naveZ, 6.5, 7.26, 11.4, walls, stone);
    roof(naveX, y + 7.26, naveZ, 6.82, 11.72, 2.45, 0, [walls, slates], cue);
    const aisle = facade(naveX, naveZ - 5.7, 'front');
    for (const windowX of [-1.9, -.52, .85, 2.2]) {
      pane(aisle, windowX, y + 4.4, .51, 1.62, cue, .91, true, true);
    }
    mesh.box(x, y + 6.2, z, 4.7, 12.4, 4.2, walls, stone, cue);
    mesh.box(x, y + 13.35, z, 3.85, 3.3, 3.7, tint(walls, .95), plaster, cue);
    const front = facade(x, z - 2.1, 'front');
    for (const stage of [4.2, 8.7, 11.65]) {
      mesh.box(x, y + stage, z, 4.84, .145, 4.36, tint(limestone, .98), trim);
      for (const sign of [-1, 1]) pane(front, sign * .89, y + stage - 1.4, .53, 1.65, cue, 1.0, true, true);
    }
    const upper = facade(x, z - 1.85, 'front');
    const faceY = y + 13.48;
    const rim = (r, angle, depth) => upper.at(r * Math.sin(angle), faceY + r * Math.cos(angle), depth);
    for (let i = 0; i < 24; i++) {
      const a = i * Math.PI / 12, b = a + Math.PI / 12;
      mesh.face([rim(0, 0, .031), rim(.89, b, .031), rim(.89, a, .031)], [.26, .225, .197], metal);
      mesh.face([rim(.88, a, .04), rim(.88, b, .04), rim(.99, b, .04), rim(.99, a, .04)], [.88, .57, .25], flame, cue, .73);
      if (i % 2 === 0) mesh.beam(rim(.70, a, .05), rim(.82, a, .05), .024, limestone, flame, cue, .63, 4);
    }
    mesh.beam(rim(0,0,.048), rim(.63,5.60,.048), .035, amber, flame, cue, .82, 4);
    mesh.beam(rim(0,0,.048), rim(.41,1.19,.048), .043, amber, flame, cue, .82, 4);
    mesh.box(x, y + 14.95, z, 4.15, .22, 3.98, limestone, trim);
    roofRing(octagon(x,y+15.06,z,2.48), octagon(x,y+16.55,z,2.04), slates, cue);
    roofRing(octagon(x,y+16.55,z,2.04), octagon(x,y+20.15,z,.34), tint(slates, .98), cue);
    mesh.beam([x,y+19.6,z], [x,y+21.13,z], .041, iron, metal);
    mesh.beam([x-.29,y+20.83,z], [x+.29,y+20.83,z], .039, iron, metal);
    mesh.finishBatch();
  }

  function observatory(x, z, y, cue) {
    mesh.box(x, y + 5.1, z, 9.25, 10.2, 7.3, [.455, .438, .404], plaster);
    mesh.box(x, y + 9.90, z, 9.55, .18, 7.65, limestone, trim);
    mesh.box(x, y + 11.2, z, 5.0, 2.0, 4.6, [.386, .353, .329], stone);
    const front = facade(x, z - 3.65, 'front');
    for (const xPos of [-3, -1.5, 0, 1.5, 3]) {
      for (const h of [4.1, 7.1, 8.97]) pane(front, xPos, y + h, .71, 1.57, cue, .93, true, true, random() > .18);
    }
    const steps = [[12.2,2.87], [12.63,2.72], [13.43,2.30], [14.25,1.58], [14.81,.76], [15.2,.15]];
    for (let i = 1; i < steps.length; i++) {
      const [lowerY, lowerR] = steps[i - 1], [upperY, upperR] = steps[i];
      roofRing(octagon(x,y+lowerY,z,lowerR), octagon(x,y+upperY,z,upperR), [.245,.350,.357], cue);
    }
    mesh.beam([x,y+14.9,z], [x,y+16.1,z], .051, iron, metal);
    mesh.finishBatch();
  }

  const bands = compact ? [49, 61, 74, 89, 105, 124, 148] : [49, 61, 74, 89, 105, 124, 148, 173];
  const road = [.168, .198, .253];
  quad(5, -.006, 183.9, 147, 27.8, tint(road,.91), solid);
  mesh.finishBatch();
  for (let i = 0; i < bands.length; i++) {
    const front = bands[i], next = bands[i + 1] || front + 19;
    const depth = next - front - 3.25;
    const center = front + depth / 2;
    const axis = avenue(center);
    const tier = i < 2 ? 0 : i < 4 ? 1 : 2;
    const width = i < 3 ? 5.3 : 4.8;
    const ground = i < 4 ? 0 : (i - 4) * 1.22;
    const left = (z, w) => avenue(z) - w / 2;
    const right = (z, w) => avenue(z) + w / 2;
    const a = i ? front : 45.4;
    mesh.face([[left(a,width),.014,a], [left(next,width),.014,next], [right(next,width),.014,next],
      [right(a,width),.014,a]], road, solid);
    quad(axis, .015, next - 1.7, compact ? 99 : 132, 3.15, tint(road,.91), solid);
    for (const side of [-1, 1]) {
      const lightX = avenue(front + 3.4) + side * (width * .31);
      if (side === (i % 2 ? 1 : -1) || i < 2) lantern(lightX, front + 4.2, cueAt(lightX, front), i < 4);
      if (i < 3) lantern(axis + side * 12, next - 2.4, cueAt(axis + side * 12, next), false, true);
    }
    mesh.finishBatch();
    for (const sign of [-1, 1]) {
      let offset = width / 2 + .66;
      const count = compact ? (i < 3 ? 7 : 8) : (i < 3 ? 8 : 10);
      for (let col = 0; col < count; col++) {
        const w = vary(3.85, 6.05);
        const x = axis + sign * (offset + w / 2);
        const z = center + vary(-.58, .58);
        const d = depth - vary(0, 1.45);
        offset += w + (col % 3 === 2 ? vary(2.35, 3.25) : vary(.12, .33));
        const reserved = (x + w / 2 > -4.65 && x - w / 2 < 4.45 && z + d / 2 > 77.1 && z - d / 2 < 90.6)
          || (x + w / 2 > 27.75 && x - w / 2 < 37.85 && z + d / 2 > 92.3 && z - d / 2 < 101.1);
        if (!reserved) {
          const height = i === 0 ? vary(5.4, 10.3) : vary(6.3, i < 4 ? 12.15 : 14.4);
          townhouse(x, z, w, d, ground, height, (col + i + (sign > 0 ? 1 : 0)) % 3, tier, cueAt(x, z));
        }
        if (col % 3 === 2) mesh.finishBatch();
      }
      mesh.finishBatch();
    }
  }

  clockTower(1.85, 79.6, 0, .907);
  observatory(32.8, 96.7, 1.2, .923);
}

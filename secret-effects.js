(() => {
  'use strict';

  const tau = Math.PI * 2;
  const clamp = n => Math.max(0, Math.min(1, n));
  const mix = (a, b, t) => a + (b - a) * t;
  const ease = (a, b, t) => {
    const n = clamp((t - a) / (b - a));
    return n * n * (3 - 2 * n);
  };
  const seed = i => (Math.sin(i * 57.13 + 91.7) * 17021.73 % 1 + 1) % 1;
  const shift = ([x, y, z], dx, dy, dz = 0) => [x + dx, y + dy, z + dz];

  function ellipse(ctx, x, y, rx, ry, color) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, tau);
    ctx.fillStyle = color;
    ctx.fill();
  }

  function halo(ctx, x, y, radius, color) {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, 'transparent');
    ellipse(ctx, x, y, radius, radius, gradient);
  }

  function stroke(ctx, points, color, width) {
    ctx.beginPath();
    let continuous = false;
    for (const point of points) {
      if (point) {
        const [x, y] = point;
        if (continuous) ctx.lineTo(x, y); else ctx.moveTo(x, y);
      }
      continuous = Boolean(point);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
  }

  function light(ctx, at, size, color, strength = 1) {
    if (!at || strength < .02) return;
    const [x, y] = at;
    ctx.save();
    ctx.globalAlpha *= clamp(strength);
    halo(ctx, x, y, size * 5.2, color);
    ctx.beginPath();
    ctx.moveTo(x - size, y);
    ctx.quadraticCurveTo(x - size * .10, y - size * .10, x, y - size * 1.42);
    ctx.quadraticCurveTo(x + size * .10, y - size * .10, x + size, y);
    ctx.quadraticCurveTo(x + size * .10, y + size * .10, x, y + size * 1.42);
    ctx.quadraticCurveTo(x - size * .10, y + size * .10, x - size, y);
    ctx.fillStyle = '#fff7dd';
    ctx.fill();
    ctx.restore();
  }

  function sprite(ctx, project, at, radius, paint) {
    const center = project(at), top = project(shift(at, 0, radius));
    if (!center || !top) return;
    const scale = Math.max(.7, Math.min(180, Math.hypot(top[0] - center[0], top[1] - center[1])));
    ctx.save();
    ctx.translate(center[0], center[1]);
    ctx.scale(scale, scale);
    paint(ctx);
    ctx.restore();
  }

  function fireflies(ctx, { origin, project, time, still }) {
    for (let i = 0; i < 36; i++) {
      const delay = seed(i + 26) * .83;
      const timeLocal = Math.max(0, time - delay);
      const lift = still ? .71 : ease(0, 4.9, timeLocal);
      const angle = i * 2.39996 + timeLocal * (.72 + seed(i + 8) * .54);
      const reach = (.32 + seed(i + 13) * 1.75) * lift;
      const dx = Math.cos(angle) * reach - .92 * lift;
      const dy = lift * (.30 + seed(i + 23) * 2.05) + Math.sin(angle) * reach * .29;
      const at = project(shift(origin, dx, dy, -lift * (.44 + seed(i + 17) * 6.1)));
      const flicker = still ? .86 : .70 + Math.sin(timeLocal * 5 + i) * .29;
      light(ctx, at, 1.15 + seed(i + 9) * 2.7, '#ffd572bb', flicker * (still ? 1 : ease(0, .42, timeLocal)));
    }
    if (still) return;
    const flight = ease(.7, 5.4, time);
    const glow = ease(.7, 1.4, time) * (1 - ease(4.7, 5.75, time));
    if (glow < .01) return;
    const at = shift(origin, -.55 - flight * 1.36, .24 + Math.sin(flight * 2.3) * 1.27, -flight * 4.05);
    sprite(ctx, project, at, .17, art => {
      art.globalAlpha *= glow;
      halo(art, 0, 0, 2.4, '#ffb96d8f');
      for (const side of [-1, 1]) {
        art.save();
        art.scale(side * (.65 + Math.sin(time * 13) * .33), 1);
        art.beginPath();
        art.moveTo(0, .05);
        art.bezierCurveTo(.09, -.12, .38, -.67, .86, -.43);
        art.bezierCurveTo(.99, -.21, .48, .02, .28, .03);
        art.bezierCurveTo(.72, .13, .50, .53, .26, .37);
        art.closePath();
        art.fillStyle = '#ffce7bc9';
        art.fill();
        art.strokeStyle = '#ffedc5';
        art.lineWidth = .045;
        art.stroke();
        art.restore();
      }
      ellipse(art, 0, 0, .06, .24, '#fff3bc');
    });
  }

  function plane(ctx, { origin, project, time, still }) {
    const p = still ? .46 : ease(0, 4.65, time);
    const route = t => shift(origin, -.75 * t - Math.sin(t * Math.PI * 1.4) * 2.8,
      Math.sin(t * Math.PI) * 1.43 - t * .64, -t * 4.1);
    const trail = Array.from({ length: 27 }, (_, i) => project(route(Math.max(0, p - (1 - i / 26) * .40))));
    const tip = trail.at(-1);
    if (!tip) return;
    ctx.save();
    ctx.globalAlpha *= ease(0, .19, time);
    ctx.shadowColor = '#ffd7ac';
    ctx.shadowBlur = 9;
    stroke(ctx, trail, '#ffdab7d1', 1.4);
    ctx.shadowBlur = 0;
    for (let i = 3; i < 27; i += 4) light(ctx, trail[i], .9 + i * .034, '#ffc27e', i / 27);
    const [x, y] = tip, previous = trail.at(-4);
    if (previous) sprite(ctx, project, route(p), .42, art => {
      art.rotate(Math.atan2(y - previous[1], x - previous[0]));
      art.beginPath();
      art.moveTo(-.68, -.35);
      art.lineTo(.69, 0);
      art.lineTo(-.64, .23);
      art.lineTo(-.36, .035);
      art.closePath();
      art.fillStyle = '#ffedc9';
      art.fill();
      stroke(art, [[-.54, -.25], [-.36, .035], [.69, 0]], '#a3727a', .03);
      stroke(art, [[-.36, .035], [-.56, .31], [-.28, .13]], '#e3b198', .036);
    });
    ctx.restore();
  }

  function stars(ctx, { origin, project, time, still }) {
    const coordinates = [[-.89,.10],[-.59,-.39],[-.17,-.57],[.18,-.29],[.55,-.54],[.85,-.18],
      [.67,.22],[.31,.47],[.05,.62],[-.32,.37],[-.71,.24],[-.89,.10]];
    const constellation = coordinates.map(([x, y]) => shift(origin, x * 3.12, .26 - y * 2.75));
    const head = ease(.01, 1.07, time);
    if (!still && head < 1) {
      const comet = Array.from({ length: 26 }, (_, i) => {
        const p = head * (.49 + .51 * i / 25);
        return project(shift(origin, mix(-4, -2.78, p), mix(3.15, -.015, p), Math.sin(Math.PI * p) * 1.8));
      });
      ctx.save();
      ctx.globalAlpha *= Math.sin(head * Math.PI) * .92;
      ctx.shadowBlur = 16;
      ctx.shadowColor = '#b8c5ff';
      stroke(ctx, comet, '#e9d8ff', 2.6);
      light(ctx, comet.at(-1), 6.7, '#d0b8ff', 1);
      ctx.restore();
    }
    const count = (still ? 1 : ease(.67, 3.7, time)) * (constellation.length - 1);
    const complete = Math.floor(count);
    const path = constellation.slice(0, complete + 1);
    if (complete < constellation.length - 1) path.push(constellation[complete].map((n, axis) =>
      mix(n, constellation[complete + 1][axis], count - complete)));
    ctx.save();
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#b2b9ff';
    stroke(ctx, path.map(project), '#fff0ca', 1.3);
    ctx.restore();
    for (let i = 0; i <= complete; i++) {
      const brightness = still ? 1 : (.68 + Math.sin(time * 2 + i) * .22) * ease(.52 + i * .23, 1.2 + i * .23, time);
      light(ctx, project(constellation[i]), 1.9 + seed(i + 69) * 2.8, '#b8bdffbb', brightness);
    }
  }

  function bowRibbons(ctx, { origin, project, time, still }) {
    const launch = still ? 1 : ease(.02, 1.24, time);
    const loop = still ? 1 : ease(.76, 3.34, time);
    const gather = still ? 0 : ease(5.03, 6.74, time);
    const source = project(origin);
    const measure = project(shift(origin, 0, .035));
    if (!source || !measure || launch === 0) return;
    const width = Math.max(2.3, Math.hypot(measure[0] - source[0], measure[1] - source[1]));

    for (const side of [-1, 1]) {
      const path = Array.from({ length: 74 }, (_, i) => {
        const u = mix(gather, loop, i / 73);
        const angle = Math.PI * (u + Number(side < 0));
        const x = Math.sin(angle) * .89;
        const y = Math.sin(angle * 2) * .245;
        const drawn = launch * (1 - gather * gather);
        return project(shift(origin, (.56 + x) * drawn, (1.26 + y) * drawn, (-.30 + Math.cos(angle) * .12) * drawn));
      }).filter(Boolean);
      const tip = path.at(-1);
      if (path.length < 2) continue;
      if (!still) {
        const fade = launch * (1 - ease(1.28, 3.82, time)) + gather * (1 - gather);
        const mid = [mix(source[0], path[0][0], .47) + side * width * 1.9, mix(source[1], path[0][1], .65)];
        ctx.save();
        ctx.globalAlpha *= fade * .68;
        ctx.beginPath();
        ctx.moveTo(source[0], source[1]);
        ctx.quadraticCurveTo(mid[0], mid[1], path[0][0], path[0][1]);
        ctx.strokeStyle = side < 0 ? '#ffdb9a' : '#9ddfbd';
        ctx.lineWidth = width * .24;
        ctx.stroke();
        ctx.restore();
      }

      const edges = [[], []];
      for (let i = 0; i < path.length; i++) {
        const before = path[Math.max(0, i - 1)], after = path[Math.min(path.length - 1, i + 1)];
        const [x, y] = path[i];
        const dx = after[0] - before[0], dy = after[1] - before[1];
        const length = Math.max(.001, Math.hypot(dx, dy));
        const position = i / (path.length - 1);
        const twist = Math.sin(position * tau * 1.6 + time * 1.8 + side);
        const half = width * (.38 + .55 * Math.abs(twist)) * (.42 + .58 * Math.sin(Math.PI * position));
        edges[0].push([x - dy * half / length, y + dx * half / length]);
        edges[1].push([x + dy * half / length, y - dx * half / length]);
      }
      ctx.save();
      ctx.globalAlpha *= launch;
      const satin = ctx.createLinearGradient(path[0][0], tip[1] - width * 5, tip[0] + width * 3, path[0][1] + width * 5);
      satin.addColorStop(0, side < 0 ? '#a3663d' : '#327061');
      satin.addColorStop(.44, side < 0 ? '#fff0b9' : '#d6f8d2');
      satin.addColorStop(.63, side < 0 ? '#e8b56a' : '#82c5a2');
      satin.addColorStop(1, side < 0 ? '#b78356' : '#3d8570');
      ctx.shadowColor = side < 0 ? '#ffce83bd' : '#a8f9c6ad';
      ctx.shadowBlur = width * .88;
      ctx.beginPath();
      ctx.moveTo(...edges[0][0]);
      for (const point of edges[0]) ctx.lineTo(...point);
      for (const point of edges[1].reverse()) ctx.lineTo(...point);
      ctx.closePath();
      ctx.fillStyle = satin;
      ctx.fill();
      ctx.shadowBlur = 0;
      stroke(ctx, edges[0], '#fff4d5ba', Math.max(.6, width * .105));
      ctx.restore();
      if (!still) light(ctx, tip, Math.max(1.1, width * .30), side < 0 ? '#ffcf8ba8' : '#d9ffe6a8', launch * (1 - gather));
    }
  }

  function lanterns(ctx, { origin, project, time, still }) {
    for (let i = 0; i < 11; i++) {
      const age = Math.max(0, time - i * .21);
      const lift = still ? .58 : ease(.04, 6.8, age);
      if (!lift) continue;
      const reach = (seed(i + 11) - .44) * (1.45 + lift * 5.9);
      const rise = lift * (2.4 + seed(i + 23) * 2.43);
      const at = shift(origin, reach * ease(0, .51, lift) + Math.sin(i + age * .88) * lift * .17,
        rise, lift * (.81 + seed(i + 17) * 5.45));
      sprite(ctx, project, at, (.14 + seed(i + 43) * .16) * (.20 + .8 * ease(0, .19, lift)), art => {
        art.rotate(Math.sin(age * 1.3 + i) * .13);
        halo(art, 0, 0, 1.88, '#ffb14e8c');
        const paper = art.createLinearGradient(-.47, 0, .47, .17);
        paper.addColorStop(0, '#d37346');
        paper.addColorStop(.35, '#ffc16e');
        paper.addColorStop(.60, '#fff0b1');
        paper.addColorStop(1, '#de8b53');
        art.beginPath();
        art.moveTo(-.39, -.66);
        art.quadraticCurveTo(0, -.79, .39, -.66);
        art.lineTo(.49, .55);
        art.quadraticCurveTo(0, .72, -.49, .55);
        art.closePath();
        art.fillStyle = paper;
        art.fill();
        art.strokeStyle = '#fff3c6';
        art.lineWidth = .041;
        art.stroke();
        for (const seam of [-.25, .25]) stroke(art, [[seam, -.66], [seam * 1.38, .55]], '#b75f4b86', .027);
        ellipse(art, 0, .56, .43, .096, '#9b5644');
        ellipse(art, 0, .56, .30, .062, '#fff5c2');
      });
    }
  }

  function steam(ctx, { origin, project, time, still }) {
    const progress = still ? 1 : ease(.13, 2.50, time);
    const center = shift(origin, .035, .18 + progress * .46);
    const heart = Array.from({ length: 53 }, (_, i) => {
      const t = tau * i / 52 * progress;
      const x = Math.sin(t) ** 3;
      const y = (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 17;
      return project(shift(center, x * .26, y * .245, Math.sin(t) * .077));
    });
    ctx.save();
    ctx.globalAlpha *= ease(0, .29, progress) * .87;
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#ffd3ab';
    stroke(ctx, heart, '#fff1d2', 2);
    ctx.shadowBlur = 0;
    light(ctx, heart.at(-1), 2.6, '#ffcea9', .83);
    ctx.restore();
  }

  const effects = {
    fireflies: [6.9, fireflies], plane: [5.25, plane], star: [10.6, stars],
    bow: [7.3, bowRibbons], lantern: [9.6, lanterns], coffee: [5.65, steam],
  };

  window.sceneSecretDuration = kind => effects[kind][0];
  window.paintSceneSecret = (ctx, kind, origin, project, time, duration, still) => {
    const [, paint] = effects[kind];
    ctx.save();
    ctx.lineJoin = ctx.lineCap = 'round';
    ctx.globalAlpha = still ? .92 : 1 - ease(duration - 1.13, duration, time);
    paint(ctx, { origin, project, time: still ? 1.88 : time, still });
    ctx.restore();
  };
})();

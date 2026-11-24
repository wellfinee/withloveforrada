(() => {
  'use strict';

  const width = 900;
  const height = 600;
  const smooth = (start, end, t) => {
    const n = Math.max(0, Math.min(1, (t - start) / (end - start)));
    return n * n * (3 - 2 * n);
  };
  const mix = (from, to, progress) => from + (to - from) * progress;
  const polygon = (ctx, points) => {
    ctx.beginPath();
    points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.closePath();
  };
  const ellipse = (ctx, x, y, rx, ry, color) => {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  };
  const glow = (ctx, x, y, radius, color, squash = 1) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, squash);
    const light = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
    light.addColorStop(0, color);
    light.addColorStop(1, 'transparent');
    ctx.fillStyle = light;
    ctx.fillRect(-radius, -radius, radius * 2, radius * 2);
    ctx.restore();
  };

  const scenes = {
    'home-drinks': {
      plate: 'living', camera: [504, 302], sweep: [-12, 5, .025],
      description: 'Мишка устроился на бархатном диване и пододвинул бокал. На деревянном столике стоит второй бокал.',
      lamps: [[835, 64, 164]], beam: [[53, 44], [185, 47], [595, 421], [480, 470]],
      table: new Path2D('M274 473 C274 456 280 449 304 443 C439 418 712 379 900 358 L900 600 H286 V491 Q275 487 274 473 Z')
    },
    'out-drinks': {
      plate: 'terrace', camera: [508, 304], sweep: [18, 4, -.016],
      description: 'На открытой террасе мишка наклонился через столик и поднял бокал на фоне крыш.',
      sky: 310, sun: [445, 259],
      lamps: [[104, 94, 91], [164, 62, 24], [226, 84, 27], [286, 100, 30], [348, 114, 24],
        [427, 125, 24], [514, 131, 25], [615, 135, 25], [703, 132, 25], [785, 121, 26], [849, 108, 26], [807, 248, 88]],
      table: new Path2D('M241 396 C241 380 313 367 429 367 C529 367 617 377 618 393 L618 400 C616 418 537 429 432 429 C326 429 241 420 241 402 Z')
    },
    'home-skate': {
      plate: 'hall', camera: [521, 310], sweep: [-14, -8, .018],
      description: 'В прихожей мишка на скамейке завязал шнурок конька и поправил шарф. Вторая пара ждёт на коврике.',
      lamps: [[625, 214, 245]], beam: [[0, 75], [110, 131], [529, 449], [350, 463]]
    },
    'out-skate': {
      plate: 'rink', camera: [527, 310], sweep: [23, 8, -.022],
      description: 'У борта катка мишка скользнул вперёд, пошатнулся и протянул свободную лапу. На льду остались следы.',
      sky: 252, sun: [137, 211], lamps: [[48, 285, 41], [118, 289, 43], [163, 287, 38],
        [245, 289, 39], [324, 284, 38], [434, 278, 47], [545, 266, 38], [792, 217, 104], [866, 227, 58]]
    }
  };

  const hours = {
    neutral: {
      label: '',
      plate: 'brightness(1.06) saturate(.83)',
      bear: 'brightness(1) saturate(.92)', cast: '#aea5a024',
      sky: ['#8e9ba34f', '#dbc1a336'], lamps: .18, reflect: '#e9e0cb'
    },
    morning: {
      label: 'Низкое солнце, лёгкая дымка и длинная полоса света.',
      plate: 'brightness(1.10) saturate(.83) sepia(.09)',
      bear: 'brightness(1.03) saturate(.89)', cast: '#f9d4aa24',
      sky: ['#a3bcc64d', '#ffdcab38'], lamps: 0, reflect: '#ffdfa9'
    },
    day: {
      label: 'Ясный фон и мягкий боковой свет.',
      plate: 'brightness(1.14) saturate(.76) hue-rotate(6deg)',
      bear: 'brightness(1.05) saturate(.80)', cast: '#d5ebff12',
      sky: ['#89b8d659', '#d5ebf533'], lamps: 0, reflect: '#e5f4ff'
    },
    evening: {
      label: 'Розовый свет снаружи и тёплые огни.',
      plate: 'brightness(.91) saturate(1.03)',
      bear: 'brightness(.94) saturate(.98)', cast: '#a65a7024',
      sky: ['#6555845c', '#efa89163'], lamps: .61, reflect: '#ffc697'
    },
    night: {
      label: 'Глубокая синяя ночь и локальный свет фонарей.',
      plate: 'brightness(.63) saturate(.75) hue-rotate(9deg)',
      bear: 'brightness(.76) saturate(.81)', cast: '#17274452',
      sky: ['#111c46c9', '#20345086'], lamps: 1, reflect: '#ffe0a9'
    }
  };

  function lightPlate(ctx, scene, time, photo) {
    const hour = hours[time];
    ctx.fillStyle = '#39424a';
    ctx.fillRect(0, 0, width, height);
    if (photo?.naturalWidth) {
      ctx.save();
      ctx.filter = hour.plate;
      ctx.drawImage(photo, 0, 0, width, height);
      ctx.restore();
    }
    ctx.fillStyle = hour.cast;
    ctx.fillRect(0, 0, width, height);
    if (scene.sky) {
      const sky = ctx.createLinearGradient(0, 0, 0, scene.sky + 27);
      sky.addColorStop(0, hour.sky[0]);
      sky.addColorStop(.7, hour.sky[1]);
      sky.addColorStop(1, 'transparent');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, width, scene.sky + 27);
      if (time === 'morning') {
        const [x, y] = scene.sun;
        glow(ctx, x, y, 145, '#ffd49b62', .61);
        glow(ctx, x, y, 24, '#fff2c4a8');
        glow(ctx, x + 28, y + 24, 320, '#ffe4bf33', .17);
      }
    } else if (time === 'morning' || time === 'day') {
      glow(ctx, scene.plate === 'living' ? 201 : 80, 131, 330, time === 'morning' ? '#ffe0a65e' : '#cde4ef68');
    }
    if (scene.beam && time === 'morning') {
      const sunbeam = ctx.createLinearGradient(85, 69, 495, 450);
      sunbeam.addColorStop(0, '#ffe0a22c');
      sunbeam.addColorStop(.65, '#ffcf7f1c');
      sunbeam.addColorStop(1, '#ffda9100');
      ctx.save();
      ctx.filter = 'blur(19px)';
      polygon(ctx, scene.beam);
      ctx.fillStyle = sunbeam;
      ctx.fill();
      ctx.restore();
    }
    if (hour.lamps) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = hour.lamps;
      for (const [x, y, radius] of scene.lamps) {
        glow(ctx, x, y, radius, radius > 100 ? '#f5b56a74' : '#fbc56b6c');
        if (radius < 115) ellipse(ctx, x, y, radius > 45 ? 2.6 : 1.6, 2, '#ffdc9a');
      }
      if (scene.plate === 'rink') {
        for (const [x, y] of scene.lamps) glow(ctx, x - 12, y + 101, 51, '#ffc7784d', 2.35);
      }
      if (scene.plate === 'living') glow(ctx, 738, 449, 166, '#ffd28b77', .20);
      if (scene.plate === 'terrace') glow(ctx, 427, 393, 197, '#ffca8256', .16);
      ctx.restore();
    }
  }

  function shadow(ctx, x, y, radius, depth = .32) {
    glow(ctx, x, y, radius, `rgba(17,11,18,${depth})`, .21);
  }

  function contact(ctx, x, y, radius, depth) {
    shadow(ctx, x, y + 3, radius, depth * .55);
    glow(ctx, x, y, radius * .57, `rgba(23,16,22,${depth})`, .16);
  }

  const glassBowl = new Path2D('M-16 -65 C-21 -50 -20 -38 -13 -31 Q-8 -25 0 -23 Q8 -25 13 -31 C20 -38 21 -50 16 -65 Q0 -71 -16 -65 Z');

  function glass(ctx, x, y, size, slant, reflection, onTable = 1) {
    if (onTable) {
      ctx.save();
      ctx.globalAlpha = onTable;
      glow(ctx, x + 1, y + size * .11, size * .18, '#9e4b535a', .72);
      glow(ctx, x, y + 2, size * .17, '#e7dbc377', .17);
      ctx.restore();
    }
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(slant);
    ctx.scale(size / 80, size / 80);
    ctx.lineCap = 'round';

    const stem = ctx.createLinearGradient(-2, 0, 2, 0);
    stem.addColorStop(0, '#f4e4ce83');
    stem.addColorStop(.47, '#deddd451');
    stem.addColorStop(1, '#302a3199');
    ctx.fillStyle = stem;
    ctx.beginPath();
    ctx.moveTo(-2.8, -25);
    ctx.bezierCurveTo(-.8, -21, -1.6, -8, -2.4, -3);
    ctx.quadraticCurveTo(0, -1.2, 2.4, -3);
    ctx.bezierCurveTo(1, -9, 1.1, -21, 2.8, -25);
    ctx.closePath();
    ctx.fill();
    const foot = ctx.createLinearGradient(-11, -3, 9, 0);
    foot.addColorStop(0, '#f2e1cdaa');
    foot.addColorStop(.23, '#d3dbe563');
    foot.addColorStop(.6, '#aab6bf2e');
    foot.addColorStop(1, '#34252e7d');
    ellipse(ctx, 0, -2.5, 11.5, 3.2, foot);
    ctx.beginPath();
    ctx.ellipse(0, -2.5, 11.5, 3.2, 0, .24, Math.PI * .95);
    ctx.strokeStyle = '#f8e6c68a';
    ctx.lineWidth = .68;
    ctx.stroke();

    ctx.save();
    ctx.clip(glassBowl);
    const glassLight = ctx.createLinearGradient(-19, -55, 19, -55);
    glassLight.addColorStop(0, '#201e307d');
    glassLight.addColorStop(.09, '#bccbda64');
    glassLight.addColorStop(.36, '#e3e6e909');
    glassLight.addColorStop(.71, '#fdf1d61d');
    glassLight.addColorStop(.91, '#d0deec49');
    glassLight.addColorStop(1, '#17132588');
    ctx.fillStyle = glassLight;
    ctx.fillRect(-24, -69, 48, 50);
    const wine = ctx.createLinearGradient(0, -47, 2, -23);
    wine.addColorStop(0, '#76232ccb');
    wine.addColorStop(.55, '#55101ded');
    wine.addColorStop(1, '#280b19ee');
    ctx.fillStyle = wine;
    ctx.fillRect(-23, -47, 46, 25);
    const surface = ctx.createLinearGradient(-18, -50, 11, -43);
    surface.addColorStop(0, '#d4897da8');
    surface.addColorStop(.44, '#7c303bbe');
    surface.addColorStop(1, '#310c1bd6');
    ellipse(ctx, 0, -47, 19, 3.35, surface);
    glow(ctx, -13, -37, 10, '#da727c78', 1.36);
    ctx.strokeStyle = reflection;
    ctx.globalAlpha = .34;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(-14, -58);
    ctx.quadraticCurveTo(-18, -47, -14, -39);
    ctx.moveTo(14.5, -56);
    ctx.quadraticCurveTo(16.8, -48, 13.8, -42);
    ctx.stroke();
    ctx.restore();

    ctx.strokeStyle = '#19182361';
    ctx.lineWidth = .85;
    ctx.stroke(glassBowl);
    ctx.beginPath();
    ctx.ellipse(0, -65, 16, 3.9, 0, Math.PI, Math.PI * 2);
    ctx.strokeStyle = '#ddd8ca70';
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(0, -65, 16, 3.9, 0, .22, Math.PI * .94);
    ctx.strokeStyle = '#fdeccea8';
    ctx.stroke();
    ctx.restore();
  }

  function skate(ctx, image, x, y, size, angle, mirrored, time) {
    if (!image?.naturalWidth) return;
    const h = size * image.naturalHeight / image.naturalWidth;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(mirrored ? -1 : 1, 1);
    ctx.filter = hours[time].bear;
    ctx.drawImage(image, -size / 2, -h, size, h);
    ctx.restore();
  }

  function scarf(ctx, x, y, rotation, time, tail = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.filter = hours[time].bear;
    const fold = ctx.createLinearGradient(0, -11, 0, 29);
    fold.addColorStop(0, '#d18d74');
    fold.addColorStop(.28, '#a4534d');
    fold.addColorStop(.67, '#7d363e');
    fold.addColorStop(1, '#4d283b');
    ctx.fillStyle = fold;
    ctx.save();
    ctx.translate(25, 10);
    ctx.rotate(-.16);
    ctx.scale(1, tail);
    ctx.beginPath();
    ctx.moveTo(-9, -4);
    ctx.quadraticCurveTo(1, -9, 12, -4);
    ctx.quadraticCurveTo(9, 19, 15, 58);
    ctx.quadraticCurveTo(4, 65, -9, 60);
    ctx.quadraticCurveTo(-14, 34, -9, -4);
    ctx.closePath();
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = '#deb283a0';
    ctx.fillRect(-12, 48, 30, 2);
    ctx.fillRect(-12, 53, 30, 1.5);
    ctx.restore();
    ctx.lineWidth = 1.1;
    ctx.strokeStyle = '#996477c9';
    for (let n = -7; n < 14; n += 3) {
      ctx.beginPath();
      ctx.moveTo(n, 59);
      ctx.lineTo(n + .8, 66 - Math.abs(n - 2) * .22);
      ctx.stroke();
    }
    ctx.restore();
    ctx.beginPath();
    ctx.moveTo(-42, -8);
    ctx.bezierCurveTo(-27, 5, 17, 7, 42, -10);
    ctx.quadraticCurveTo(51, -2, 43, 13);
    ctx.bezierCurveTo(19, 32, -27, 28, -44, 9);
    ctx.quadraticCurveTo(-48, 1, -42, -8);
    ctx.closePath();
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.lineWidth = 1.1;
    for (let offset = 1; offset < 26; offset += 4) {
      ctx.beginPath();
      ctx.moveTo(-47, offset - 9);
      ctx.bezierCurveTo(-29, offset + 9, 11, offset + 12, 47, offset - 10);
      ctx.strokeStyle = offset % 8 === 1 ? '#ecc29b50' : '#3d1c3740';
      ctx.stroke();
    }
    ctx.restore();
    ctx.restore();
  }

  function letter(ctx, x, y, date, turn, arrival, size = 1, tint = 'neutral') {
    const scale = mix(.76, 1, arrival) * size;
    ctx.save();
    ctx.translate(x, y + 25 * (1 - arrival));
    ctx.rotate(turn - .09 * (1 - arrival));
    ctx.scale(scale * mix(.47, 1, arrival), scale);
    ctx.globalAlpha = arrival;
    ctx.filter = hours[tint].bear;
    ctx.shadowColor = '#231923a8';
    ctx.shadowBlur = 9;
    ctx.shadowOffsetY = 4;
    const paper = ctx.createLinearGradient(-74, -67, 78, 4);
    paper.addColorStop(0, '#fff5e1');
    paper.addColorStop(.63, '#f2dfb9');
    paper.addColorStop(1, '#e5cdab');
    ctx.fillStyle = paper;
    ctx.beginPath();
    ctx.roundRect(-86, -77, 172, 77, 3);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = '#a26f517e';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(-80, -71, 160, 65, 2);
    ctx.stroke();
    ctx.fillStyle = '#763c44';
    ctx.textAlign = 'center';
    ctx.font = '800 14px Manrope, sans-serif';
    ctx.fillText('Приглашение', 0, -54, 147);
    ctx.fillRect(-16, -48, 32, .8);
    const [weekday, day] = date.split(', ');
    ctx.fillStyle = '#3f2929';
    ctx.font = '700 17px Caveat, cursive';
    ctx.fillText(weekday, 0, -34, 147);
    ctx.font = '700 25px Caveat, cursive';
    ctx.fillText(day, 0, -13, 147);
    ctx.restore();
  }

  function foreground(ctx, plate, shape) {
    ctx.save();
    ctx.clip(shape);
    ctx.drawImage(plate, 0, 0);
    ctx.restore();
  }

  function play(ctx, key, pose, plate, skateImage, time, date, progress, arrival, activity) {
    const hour = hours[time];
    const reflection = hour.reflect;
    const presented = Boolean(date);
    const placing = Math.sin(Math.PI * arrival);
    const bear = (x, y, size, lean, stretch, left, right, feet, seated = false) =>
      pose(ctx, { x, y, size, lean, stretch, paws: [left, right], feet, seated, light: hour.bear });

    if (!activity) {
      const home = key === 'home-drinks';
      const [x, y] = home ? [367, 428] : [640, 461];
      contact(ctx, x + 5, y - 4, 125, .58);
      const paw = bear(x, y, home ? 295 : 273, home ? -.084 : .04, .97,
        [x - 64, y - 66], [x + 64, y - 53]);
      paw(0);
      paw(1);
      foreground(ctx, plate, scenes[key].table);
      return;
    }
    if (key === 'home-drinks') {
      const reach = smooth(.20, .72, progress);
      const grip = smooth(.04, .20, progress) * (1 - smooth(.72, .97, progress));
      const glassX = mix(506, 483, reach);
      const glassY = mix(421, 451, reach);
      contact(ctx, 380, 420, 137, .74);
      const paw = bear(374 + 15 * grip + 10 * placing, 430, 294, -.063 + .14 * grip + .06 * placing, .94,
        [mix(349, 338, grip), mix(384, 374, grip)],
        [mix(434 + 6 * placing, glassX - 17, grip), mix(397, glassY - 48, grip)]);
      paw(0);
      paw(1);
      foreground(ctx, plate, scenes[key].table);
      contact(ctx, 586, 415, 37, .41);
      glass(ctx, 586, 415, 80, .025, reflection);
      contact(ctx, glassX, glassY - 2, 41, .49);
      glass(ctx, glassX, glassY, 88, -.022, reflection);
      if (presented) letter(ctx, 664, 479, date, .07, arrival, .88, time);
    } else if (key === 'out-drinks') {
      const toast = smooth(.15, .71, progress);
      const x = mix(550, 548, toast), y = mix(398, 347, toast);
      contact(ctx, 642, 464, 92, .67);
      const paw = bear(643 - toast * 13, 463, 274, -.03 - toast * .10, .99,
        [x + 8, y - 22], [669, 407]);
      paw(1);
      foreground(ctx, plate, scenes[key].table);
      contact(ctx, 358, 407, 41, .53);
      glass(ctx, 358, 407, 80, -.03, reflection);
      if (presented) letter(ctx, 480, 410, date, -.043, arrival, .83, time);
      ctx.save();
      ctx.globalAlpha = 1 - toast;
      contact(ctx, x, 397, 35, .46);
      ctx.restore();
      glass(ctx, x, y, 86, -.11 * toast, reflection, 1 - toast);
      paw(0);
    } else if (key === 'home-skate') {
      const tie = Math.sin(Math.PI * smooth(.06, .58, progress));
      const adjust = smooth(.52, .8, progress);
      contact(ctx, 584, 293, 109, .76);
      const paw = bear(583 - tie * 9, 331, 254, -.06 - tie * .11, .91,
        [mix(528, 556, tie), mix(273, 319, tie)],
        [mix(mix(581, 567, tie), 617, adjust), mix(mix(302, 315, tie), 253, adjust)],
        skateImage?.naturalWidth ? [[558, 312], [613, 315]] : undefined, true);
      scarf(ctx, 575 - tie * 9, 237 + tie * 3, -.05 - tie * .10, time, .79);
      skate(ctx, skateImage, 626, 365, 68, .085, true, time);
      skate(ctx, skateImage, 543, 362, 69, -.08, false, time);
      paw(0);
      paw(1);
      contact(ctx, 428, 509, 78, .66);
      contact(ctx, 510, 542, 90, .64);
      skate(ctx, skateImage, 423, 509, 101, -.10, false, time);
      skate(ctx, skateImage, 506, 542, 114, .08, false, time);
      if (presented) letter(ctx, 735, 291, date, .04, arrival, .81, time);
    } else {
      const slide = smooth(.12, .93, progress);
      const wobble = Math.sin(12 * smooth(.31, .94, progress)) * Math.sin(Math.PI * smooth(.31, .94, progress));
      const travelX = 76 * slide, travelY = slide * (23 + 7 * slide);
      const x = 643 - travelX, y = 441 + travelY;
      const forward = x - 38, rear = x + 32;
      const forwardY = y + 2, rearY = y - 7 + wobble * 1.5;
      if (slide) {
        const trail = ctx.createLinearGradient(x, 0, x + travelX, 0);
        trail.addColorStop(0, time === 'morning' ? '#fff0d17a' : '#dcebf576');
        trail.addColorStop(1, '#dcebf511');
        ctx.lineWidth = .82;
        ctx.strokeStyle = trail;
        for (const [foot, bladeY] of [[forward, forwardY], [rear, rearY]]) {
          const from = foot + 9;
          ctx.beginPath();
          ctx.moveTo(from, bladeY);
          ctx.quadraticCurveTo(from + travelX / 2, bladeY - 15 * slide, from + travelX, bladeY - travelY);
          ctx.stroke();
        }
      }
      shadow(ctx, x + 8, y + 3, 105, .36);
      contact(ctx, forward + 3, forwardY, 46, .58);
      contact(ctx, rear + 3, rearY, 41, .46);
      const paw = bear(x, y - 14, 252, .085 - .18 * slide + wobble * .11, 1.06,
        [x - 53 - 34 * slide, y - 101 - 20 * slide + wobble * 8],
        [mix(706, x + 74, slide), mix(294, y - 103, slide)],
        skateImage?.naturalWidth ? [[forward + 12, forwardY - 54], [rear + 13, rearY - 46]] : undefined);
      scarf(ctx, x - 1, y - 139, .07 + wobble * .12, time, .76);
      paw(1);
      paw(0);
      skate(ctx, skateImage, rear, rearY, 61, .025 + wobble * .065, false, time);
      skate(ctx, skateImage, forward, forwardY, 70, -.06 - wobble * .065, false, time);
      if (presented) letter(ctx, 756, 285, date, -.045, arrival, .80, time);
    }
  }

  window.createDateScenes = (canvas, reduced, pose) => {
    const ctx = canvas.getContext('2d');
    const buffer = document.createElement('canvas');
    buffer.width = width;
    buffer.height = height;
    const base = buffer.getContext('2d');
    const previous = document.createElement('canvas');
    const previousFrame = previous.getContext('2d');
    const photos = new Map();
    let key = '', time = '', date = '', place = '', activity = '';
    let start = 0, turn = 0, invite = 0, frame = 0;
    let plateKey, rendered = '';

    function redraw() {
      if (key && !frame) frame = requestAnimationFrame(draw);
    }

    function preload() {
      if (photos.size) return;
      for (const name of [...Object.values(scenes).map(scene => scene.plate), 'skate']) {
        const image = new Image();
        image.addEventListener('load', () => { plateKey = ''; redraw(); });
        image.src = `assets/date/${name}.webp`;
        photos.set(name, image);
      }
      document.fonts?.load('700 24px Caveat').then(redraw, () => {});
    }

    function draw(now) {
      frame = 0;
      if (!key) return;
      const scene = scenes[key];
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) return;
      const ratio = Math.min(devicePixelRatio || 1, 1.65, 1650 / Math.max(w, h));
      const pixelWidth = Math.round(w * ratio), pixelHeight = Math.round(h * ratio);
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      const variant = `${key}:${time}`;
      if (plateKey !== variant) {
        lightPlate(base, scene, time, photos.get(scene.plate));
        plateKey = variant;
      }
      const motion = !reduced.matches;
      const step = motion ? smooth(0, 1440, now - turn) : 1;
      const movement = motion ? 1 - smooth(0, 630, now - turn) : 0;
      const appearance = date ? (motion ? smooth(0, 470, now - invite) : 1) : 0;
      const blend = smooth(0, motion ? 245 : 140, now - start);
      const scale = Math.min(Math.max(w / width, h / height), w / 610, h / 460) * (1 + movement * scene.sweep[2]);
      const cropX = scene.camera[0] + scene.sweep[0] * movement;
      const cropY = scene.camera[1] + scene.sweep[1] * movement;
      ctx.fillStyle = '#353138';
      ctx.fillRect(0, 0, w, h);
      if (scale * width < w + 2 || scale * height < h + 2) {
        ctx.save();
        ctx.filter = 'blur(19px) brightness(.76)';
        ctx.drawImage(buffer, -24, -24, w + 48, h + 48);
        ctx.restore();
      }
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.scale(scale, scale);
      // Keep the bear and props in view when the stage crops the background.
      const center = (value, extent, viewport) => {
        const radius = viewport / (2 * scale);
        return radius * 2 >= extent ? extent / 2 : Math.max(radius, Math.min(extent - radius, value));
      };
      ctx.translate(-center(cropX, width, w), -center(cropY, height, h));
      ctx.drawImage(buffer, 0, 0);
      play(ctx, key, pose, buffer, photos.get('skate'), time, date, step, appearance, activity);
      ctx.restore();
      if (blend < 1 && previous.width) {
        ctx.globalAlpha = 1 - blend;
        ctx.drawImage(previous, 0, 0, w, h);
        ctx.globalAlpha = 1;
      }
      rendered = key;
      if (step < 1 || blend < 1 || date && appearance < 1) redraw();
    }

    new ResizeObserver(redraw).observe(canvas);
    reduced.addEventListener('change', redraw);
    return {
      preload,
      redraw,
      show(next, daylight, invitation, choice) {
        if (!next) {
          key = rendered = '';
          canvas.hidden = true;
          for (const animation of canvas.getAnimations()) animation.cancel();
          return `Мишка, две кружки и зажжённая гирлянда на крыше.${daylight ? ' ' + hours[daylight].label : ''}`;
        }
        preload();
        const now = performance.now();
        const initial = !key;
        const sceneChanged = key !== next || place !== choice.place || activity !== choice.activity;
        const newTime = daylight || 'neutral';
        if (sceneChanged || time !== newTime) {
          previous.width = rendered ? canvas.width : 0;
          previous.height = canvas.height;
          if (previous.width) previousFrame.drawImage(canvas, 0, 0);
          start = now;
        }
        if (sceneChanged) turn = now;
        if (invitation !== date || sceneChanged) invite = now;
        key = next;
        ({ place, activity } = choice);
        time = newTime;
        date = invitation;
        canvas.hidden = false;
        redraw();
        if (initial) canvas.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: reduced.matches ? 140 : 245, easing: 'ease-out'
        });
        const description = activity ? scenes[key].description :
          place === 'home' ? 'Мишка сидит на диване у окна.' : 'Мишка ждёт на открытой террасе.';
        return [description, hours[time].label, date && `На приглашении ${date}.`].filter(Boolean).join(' ');
      }
    };
  };
})();

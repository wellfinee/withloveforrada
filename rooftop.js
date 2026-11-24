(() => {
  'use strict';

  const clamp = n => Math.max(0, Math.min(1, n));
  const mix = (a, b, t) => a + (b - a) * t;
  const blend = (a, b, t) => a.map((n, i) => mix(n, b[i], t));
  const ease = (a, b, t) => {
    const u = clamp((t - a) / (b - a));
    return u * u * (3 - 2 * u);
  };
  const subtract = (a, b) => a.map((n, i) => n - b[i]);
  const dot = (a, b) => a.reduce((sum, n, i) => sum + n * b[i], 0);
  const unit = a => a.map(n => n / Math.hypot(...a));
  const cross = ([x, y, z], [a, b, c]) => [y * c - z * b, z * a - x * c, x * b - y * a];
  const floor = 13.625;
  const roofEdge = 21.46;
  const table = { x: 19.16, z: 41.54, width: 1.57, depth: .91, top: 14.095 };
  const posts = [[17.22, floor, 43.29], [20.94, floor, 44.02]];
  const spanTop = 17.02;
  const blanket = [[18.27, table.top + .024, 40.94], [20.10, table.top + .024, 40.93],
    [18.26, table.top + .027, 42.06], [20.07, table.top + .028, 42.08]];
  const snag = [[21.13, 14.55, 42.11], [22.23, 14.27, 42.00], [21.40, 14.69, 43.56], [22.48, 13.97, 43.53]];
  const folded = [[18.01, 14.39, 42.05], [18.80, 14.39, 42.05], [18.08, 14.49, 42.20], [18.74, 14.49, 42.20]];
  const lifted = [[17.93, 14.35, 41.03], [19.41, 14.36, 41.02], [18.28, 14.96, 42.09], [19.82, 14.85, 41.99]];
  const cupBases = [[18.79, table.top + .039, 41.76], [19.49, table.top + .039, 41.37]];
  const socket = [20.16, table.top - .069, 41.15];
  const socketAxis = [.96, 0, -.28];
  const plugHome = [18.76, table.top - .075, 42.18];
  const heldPlug = [19.17, table.top + .35, 41.79];
  const restPaws = [[18.03, 14.50, 42.18], [18.48, 14.52, 42.17]];
  const roofEggs = [
    { kind: 'bow', label: 'Тронуть бант мишки', announcement: 'Ленты сплелись в знак бесконечности. Столько ещё всего хочется пережить с тобой.', point: [18.36, 15.01, 42.36] },
    { kind: 'lantern', label: 'Заглянуть в фонарь', announcement: 'От фонаря над крышами поднялись огоньки. Посидим здесь ещё немного?', point: [19.37, 14.41, 42.78] },
    { kind: 'coffee', label: 'Помешать кофе', announcement: 'В твоей чашке появилось сердечко. Кофе для тебя я бы готовил хоть каждое утро.', point: [0, .229, 0] }
  ];

  function course(keys, time) {
    for (let i = 1; i < keys.length; i++) {
      const [end, value] = keys[i];
      if (time <= end) {
        const [start, previous] = keys[i - 1];
        const t = ease(start, end, time);
        return Array.isArray(value) ? blend(previous, value, t) : mix(previous, value, t);
      }
    }
    return keys.at(-1)[1];
  }

  function placeBetween(points, values, t) {
    return points.map((p, i) => blend(p, values[i], t));
  }

  function closeView(width, height, approach = 1, retreat = 0, start, invitation = 0) {
    const aspect = width / height;
    const position = [18.71 - .15 * retreat, 15.55 + .17 * retreat, 38.44 - .50 * retreat];
    const look = [19.36 - .12 * retreat, 14.71, 43.15];
    let forward = unit(subtract(look, position));
    let field = Math.max(.52, mix(.58, .605, ease(.55, .88, aspect)) / aspect);
    const focus = aspect > .86 ? .09 : .055;
    field *= 1 - invitation * focus;
    if (start && approach < 1) {
      const arc = Math.sin(Math.PI * approach);
      position[0] += .39 * arc;
      position[2] += .34 * arc;
      for (let i = 0; i < 3; i++) position[i] = mix(start.position[i], position[i], approach);
      forward = unit(blend(start.forward, forward, approach));
      field = mix(1 / start.projection[1], field, approach);
    }
    const right = unit(cross([0, 1, 0], forward));
    return { position, forward, right, up: cross(forward, right), projection: [1 / (field * aspect), 1 / field] };
  }

  function story(phase, t, clock, still, caught) {
    let cloth = folded;
    let sag = .06, ripple = .008, wind = 0, gust = 0, fold = Number(phase === 'approach'), drape = 0;
    let paws = restPaws, head = [0, 0, 0], breath = 0;
    let cups = [null, null], plug = socket, plugReady = false, pull = 0, seated = 1, plugVisibility = 1;
    let bulbs = Array(7).fill(.65), warmth = .35, wave = 0, retreat = 0, blackout = 0;
    const hold = phase === 'spread' && t >= (still ? 3.33 : 3.93);
    function windCloth(time) {
      const flight = ease(3.41, 4.64, time);
      const billow = Math.sin(Math.PI * flight);
      return placeBetween(blanket, snag, flight).map((point, i) => {
        const delay = [3.56, 3.27, 3.48, 3.13][i];
        const curl = ease(delay, delay + .38, time) * (1 - ease(4.02, 4.64, time));
        return [point[0] + billow * [.12, .20, -.20, -.28][i],
          point[1] + curl * [.44, .93, .76, 1.35][i] + billow * .37,
          point[2] + curl * [-.19, -.09, .28, .32][i]];
      });
    }
    const nearCorner = [18.34, table.top + .095, 41.89];
    const secondCorner = [19.86, table.top + .094, 41.98];
    if (phase === 'spread') {
      const displayTime = still && t >= 3.25 ? 4.66 : t;
      wind = ease(3.13, 3.84, displayTime);
      gust = course([[2.78, 0], [3.21, .26], [3.78, 1], [4.08, .94], [4.69, .32], [5.28, .22]], t);
      fold = 1 - ease(.42, 1.22, t);
      drape = ease(2.14, 2.60, displayTime) * (1 - ease(3.18, 3.70, displayTime));
      sag = course([[0, .05], [.66, .05], [1.31, .32], [1.70, .18], [2.12, .30], [2.61, .042],
        [3.10, .032], [3.76, .32], [4.59, .12]], displayTime);
      ripple = course([[0, .01], [.64, .02], [1.31, .13], [1.66, .25], [2.46, .04], [3.25, .035],
        [3.98, .27], [4.65, .12]], displayTime);
      if (displayTime <= 3.13) {
        cloth = placeBetween(folded, lifted, ease(.43, 1.28, t));
        const shake = still ? 0 : .18 * ease(1.17, 1.33, t) * (1 - ease(1.67, 1.92, t));
        cloth = placeBetween(cloth, blanket, ease(1.73, 2.55, t));
        cloth = cloth.map((p, i) => [p[0], p[1] + shake * Math.sin((t - 1.22 - i * .041) * 18), p[2]]);
      } else {
        cloth = windCloth(displayTime);
      }
      paws = [
        course([[0, restPaws[0]], [.42, [18.0, 14.45, 41.95]], [1.26, [18.25, 14.97, 41.98]],
          [1.72, [18.29, 14.94, 41.97]], [2.48, nearCorner], [2.97, nearCorner], [3.56, nearCorner],
          [3.83, [18.31, 14.28, 41.79]], [4.34, restPaws[0]]], t),
        course([[0, restPaws[1]], [.45, [18.79, 14.47, 41.95]], [1.26, [19.45, 14.89, 41.94]],
          [1.72, [19.59, 14.87, 41.91]], [2.44, secondCorner], [2.84, restPaws[1]], [3.75, restPaws[1]],
          [4.14, [19.96, 14.73, 42.05]], [4.72, restPaws[1]]], t)
      ];
      head = [-.025 + wind * .16, -.06 * ease(.5, 1, t) + .15 * ease(3.56, 4.14, t), .10 * ease(3.63, 4.28, t)];
    } else if (phase !== 'approach') {
      cloth = blanket;
      sag = .034;
      ripple = .028;
      drape = 1;
    }

    if (phase === 'caught') {
      const pullBack = ease(.02, .94, t);
      cloth = caught.cloth.map((point, i) => {
        const delay = still ? 0 : [.02, .105, .16, .24][i];
        const reach = ease(delay, still ? .22 : .81 + delay, t);
        const p = blend(point, blanket[i], reach);
        p[1] += still ? 0 : Math.sin(Math.PI * reach) * (i === 0 ? .12 : .67);
        return p;
      });
      sag = mix(caught.sag, .04, pullBack);
      ripple = mix(caught.ripple, .028, pullBack) * (1 - .45 * ease(1.38, 1.68, t));
      drape = ease(.63, 1.04, t);
      wind = caught.wind * (1 - ease(0, .35, t));
      gust = caught.gust * (1 - ease(0, .75, t));
      paws = [
        course([[0, caught.paws[0]], [.31, restPaws[0]], [.97, nearCorner], [1.22, nearCorner],
          [1.49, [18.91, table.top + .10, 41.43]], [1.74, restPaws[0]]], t),
        course([[0, caught.paws[1]], [.43, [19.38, 14.39, 41.72]], [1.03, secondCorner],
          [1.42, secondCorner], [1.79, restPaws[1]]], t)
      ];
      head = [.11 * (1 - ease(1.25, 1.85, t)), -.18 * ease(.26, .67, t) * (1 - ease(1.48, 1.94, t)), .03];
      breath = Math.sin(ease(1.66, 2.24, t) * Math.PI);
    }

    const carriesCups = ['cups', 'outage', 'offer', 'joined', 'final'].includes(phase);
    if (carriesCups) {
      cups = cupBases.map(base => ({ point: base, landed: true, wobble: 0 }));
      if (phase === 'cups') {
        cups = cupBases.map((base, i) => {
          const time = t - i * 1.13;
          const grip = course([[.22, [18.04 + .5 * i, 14.40, 42.0]], [.67, [base[0] - .14, base[1] + .17, base[2] + .09]],
            [1.11, base], [1.39, base], [1.64, i ? [base[0] - .11, base[1], base[2] + .02] : base],
            [1.89, base]], time);
          if (time >= .22 && time < (i ? 2.08 : 1.44)) {
            const reach = ease(.22, .49, time) * (1 - ease(i ? 1.88 : 1.12, i ? 2.08 : 1.44, time));
            paws = [paws[0], paws[1]];
            paws[i] = blend(restPaws[i], [grip[0] - .115, grip[1] + .22, grip[2] + .022], reach);
          }
          return time < .22 ? null : { point: grip, landed: time > 1.11, wobble: time > 1.11 && !still ?
            Math.sin((time - 1.11) * 24) * Math.max(0, .14 - (time - 1.11) * .38) : 0 };
        });
        head = course([[0, [0, 0, 0]], [.49, [-.04, -.07, .025]], [1.25, [.015, -.10, .045]],
          [2.30, [.067, -.14, .055]], [3.18, [.01, .016, -.045]]], t);
      }
    }

    if (phase === 'outage') {
      gust = .48 * ease(.05, .46, t) * (1 - ease(.58, 1.31, t));
      seated = 1 - ease(.51, .76, t);
      const loose = ease(.51, .81, t);
      const fall = ease(.75, 1.71, t);
      plug = blend(extend(socket, socketAxis, -.26 * loose), plugHome, fall);
      plug[1] -= Math.sin(Math.PI * fall) * .26;
      plugVisibility = 1 - ease(1.11, 1.43, t);
      bulbs = bulbs.map((level, i) => level * (1 - ease(.64 + (6 - i) * .053, .78 + (6 - i) * .053, t)));
      blackout = Number(t >= .84);
      warmth *= 1 - ease(.79, 1.09, t);
      head = course([[0, [.01, .016, -.045]], [1.04, [.01, .016, -.045]], [1.83, [.30, .075, .17]],
        [2.42, [-.07, .25, -.07]], [3.08, [0, 0, .065]]], t);
    }
    if (phase === 'offer' || phase === 'joined' || phase === 'final') {
      blackout = 1;
      warmth = 0;
      bulbs.fill(0);
      seated = 0;
      const reachBack = phase === 'offer' ? ease(.04, .51, t) : 1;
      pull = phase === 'offer' ? ease(.48, 1.55, t) : 1;
      plugReady = phase === 'offer' && t >= 1.57;
      plugVisibility = phase === 'offer' ? ease(.49, .81, t) : 1;
      const arc = Math.sin(Math.PI * pull);
      plug = blend(plugHome, heldPlug, pull);
      plug = [plug[0], plug[1] + arc * .35, plug[2] - arc * .08];
      const release = phase === 'joined' ? ease(.26, .77, t) : Number(phase === 'final');
      paws = [restPaws[0], blend(restPaws[1], [plug[0] - .13, plug[1] + .02, plug[2] + .035],
        reachBack * (1 - release))];
      head = [mix(.15, .015, pull) * reachBack, -.08 * pull, .065 - .055 * pull];
      if (phase !== 'offer') {
        const inserted = phase === 'final' ? 1 : ease(0, .49, t);
        seated = inserted;
        plug = blend(heldPlug, socket, inserted);
        plug[1] += Math.sin(Math.PI * inserted) * .12;
        bulbs = bulbs.map((_, i) => {
          const offset = 6 - i;
          const start = 1.05 + offset * .18;
          return phase === 'final' ? 1 : ease(start, start + .17, t);
        });
        warmth = bulbs[6] * .71 + bulbs[0] * .29;
        wave = phase === 'final' ? 1 : clamp((t - 2.37) / 2.61);
        retreat = !still ? (phase === 'final' ? 1 : ease(2.57, 4.64, t)) : 0;
        head = phase === 'final' ? [-.018, .014, -.03] : course([[0, [.015, -.08, .01]],
          [.93, [.015, -.08, .01]], [1.63, [-.095, .25, -.088]], [2.62, [.22, .16, .08]],
          [3.98, [.19, .11, .05]], [4.90, [-.018, .014, -.03]]], t);
      }
    }
    if (still) {
      if (phase === 'spread' && t < 3.25) {
        const laid = t >= 1.15;
        cloth = laid ? blanket : folded;
        drape = Number(laid);
        fold = Number(!laid);
      } else if (phase === 'caught') {
        cloth = blanket;
        drape = 1;
      } else if (phase === 'cups') {
        cups = cupBases.map((point, i) => t >= .76 + i * 1.1 ? { point, landed: true, wobble: 0 } : null);
      } else if (phase === 'outage') {
        plugVisibility = Number(!blackout);
        plug = socket;
        seated = 1;
      } else if (phase === 'offer') {
        plugVisibility = Number(plugReady);
        plug = heldPlug;
      } else if (phase === 'joined') {
        plug = socket;
        seated = 1;
        wave = Number(t >= 2.37);
      }
      paws = restPaws;
    }
    return { cloth, sag, ripple, wind, gust, fold, drape, paws, head, breath, cups, plug, plugReady, pull,
      seated, plugVisibility, blackout, bulbs, warmth, wave, retreat, hold, time: clock, still, phase, t };
  }

  function offerSecondCup(state, progress) {
    const base = cupBases[1];
    const cup = state.cups[1];
    cup.point = blend(base, [19.46, base[1], 41.11], ease(.15, .72, progress));
    if (state.still) return;
    const reach = ease(0, .27, progress) * (1 - ease(.73, 1, progress));
    state.inviteReach = reach;
    const grip = [cup.point[0] - .14, cup.point[1] + .18, cup.point[2] + .055];
    state.paws = [restPaws[0], blend(restPaws[1], grip, reach)];
    state.head = [.12 * reach, -.13 * reach, .035 * reach];
  }

  function rooftopCaption(state) {
    const { phase, t, hold, plugReady, blackout } = state;
    switch (phase) {
      case 'spread':
        if (hold) return ['Ветер унёс скатерть!', 'Поймай угол, пока он ещё у края крыши.', 'wind'];
        if (t >= 2.88) return ['Поднимается ветер', 'Смотри, как приподнялся край скатерти.', 'wind'];
        break;
      case 'caught': return ['Успели!', 'Теперь можно поставить кофе.', 'gold'];
      case 'cups': return ['Кофе на двоих', 'Твоя чашка справа. Ещё горячая.'];
      case 'outage':
        if (blackout) return ['Ой, свет погас', 'Ещё один порыв выдернул штекер из разъёма.', 'wind'];
        return ['Ветер вернулся', 'Кажется, провод зацепился.', 'wind'];
      case 'offer':
        if (plugReady) return ['Зажжём огни?', 'Нажми на штекер рядом с лапой мишки.', 'gold'];
        return ['Мишка нашёл штекер', 'Он уже тянется за ним.'];
      case 'joined':
        if (t >= 2.14) return ['Смотри, загорается город', 'Огоньки бегут от крыши к окнам.', 'gold'];
        if (t >= 1.09) return ['Огоньки возвращаются', 'Один за другим, до самого края крыши.', 'gold'];
        return ['Сейчас зажжётся', 'Смотри, как огонёк бежит по проводу.', 'gold'];
      case 'final': return ['Теперь всё готово', 'Кофе, огни и весь вечер вдвоём.', 'gold'];
    }
    return ['Мишка всё подготовил. Почти', 'Сейчас накроем стол. Кофе ещё горячий.'];
  }

  function picture(path) {
    const image = new Image();
    image.src = path;
    return image;
  }

  function makeRooftop(section, reduced, callbacks) {
    const canvas = section.querySelector('canvas');
    const art = canvas.getContext('2d');
    const title = section.querySelector('h2');
    const caption = section.querySelector('.roof-caption');
    const cue = caption.querySelector('.roof-cue');
    const catchButton = section.querySelector('#catchBlanket');
    const plugButton = section.querySelector('#connectGarland');
    const nextButton = section.querySelector('#openDatePlan');
    const status = section.querySelector('.roof-status');
    const body = picture('assets/teddy-body.png');
    const sitter = picture('assets/city/rooftop-teddy.png');
    const arm = picture('assets/teddy-forearm.png');
    const images = { body, sitter, arm };
    const photos = new Map();
    const played = new Set();
    let caught, phase, phaseTime, clock, previousTime, lastWorld, audio, running = false;
    let blanketPress;
    let planning = false, planTime = null;
    const cityParent = callbacks.cityCanvas.parentElement;
    const planner = window.createDatePlan(section.querySelector('#datePlan'), reduced, {
      back: () => { closePlan(); nextButton.focus({ preventScroll: true }); },
      paintBear: (ctx, pose) => paintDateBear(ctx, pose, images),
      wakeRoof: callbacks.wake
    });
    for (const image of Object.values(images)) image.addEventListener('load', planner.redraw);
    const roofControls = [caption, section.querySelector('nav'), section.querySelector('.roof-secrets')];
    const secrets = window.createSceneSecrets(section.querySelector('.roof-secrets'), roofEggs, reduced, callbacks.wake);

    function advance(next) {
      phase = next;
      phaseTime = 0;
      if (next === 'final') nextButton.hidden = false;
      if (!catchButton.hidden || !plugButton.hidden) {
        if (document.activeElement === catchButton || document.activeElement === plugButton) title.focus({ preventScroll: true });
        catchButton.hidden = plugButton.hidden = true;
      }
    }

    function narrate(state, animate = true) {
      const [heading, detail, tone = ''] = rooftopCaption(state);
      if (title.textContent === heading && cue.textContent === detail) return;
      title.textContent = heading;
      cue.textContent = detail;
      caption.dataset.tone = tone;
      const punctuation = /[.!?…]$/.test(heading) ? '' : '.';
      status.textContent = `${heading}${punctuation} ${detail}`;
      if (animate && !state.still) {
        for (const effect of caption.getAnimations()) effect.cancel();
        caption.animate([{ opacity: .25, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }],
          { duration: 280, easing: 'ease-out' });
      }
    }

    function unlockSound() {
      if (!window.AudioContext || !navigator.userActivation?.isActive) return;
      try {
        audio ??= new AudioContext();
        audio.resume().catch(() => {});
      } catch {
        // The animation also works with audio unavailable.
      }
    }

    function windSound(name, seconds, volume) {
      if (played.has(name) || audio?.state !== 'running') return;
      played.add(name);
      const noise = audio.createBuffer(1, Math.round(audio.sampleRate * seconds), audio.sampleRate);
      const data = noise.getChannelData(0);
      let smooth = 0;
      for (let i = 0; i < data.length; i++) {
        const t = i / data.length;
        smooth = .92 * smooth + .08 * (Math.random() * 2 - 1);
        data[i] = smooth * Math.sin(Math.PI * t) ** 1.4;
      }
      const source = audio.createBufferSource();
      source.buffer = noise;
      const gain = audio.createGain();
      gain.gain.value = volume;
      source.connect(gain).connect(audio.destination);
      source.start();
    }

    function latchSound() {
      if (played.has('latch') || audio?.state !== 'running') return;
      played.add('latch');
      const sound = audio.createBuffer(1, Math.round(audio.sampleRate * .064), audio.sampleRate);
      const signal = sound.getChannelData(0);
      for (let i = 0; i < signal.length; i++) {
        const t = i / audio.sampleRate;
        signal[i] = (Math.sin(t * 13200) * Math.sin(t * 7970) * .63 + Math.sin(t * 3300) * .37) * Math.exp(-t * 96);
      }
      const snap = audio.createBufferSource();
      const volume = audio.createGain();
      volume.gain.value = .10;
      snap.buffer = sound;
      snap.connect(volume).connect(audio.destination);
      snap.start();
    }

    catchButton.addEventListener('click', () => {
      if (!running || phase !== 'spread' || catchButton.hidden) return;
      unlockSound();
      caught = story(phase, phaseTime, clock, reduced.matches);
      advance('caught');
      callbacks.wake();
    });
    catchButton.addEventListener('pointerdown', event => {
      if (!event.isPrimary || event.button !== 0) return;
      blanketPress = { id: event.pointerId, x: event.clientX, y: event.clientY };
      // Keep the release on the moving target if the cloth travels under the pointer.
      catchButton.setPointerCapture(event.pointerId);
    });
    catchButton.addEventListener('pointerup', event => {
      if (blanketPress?.id !== event.pointerId) return;
      const tracked = blanketPress;
      blanketPress = null;
      if (Math.hypot(event.clientX - tracked.x, event.clientY - tracked.y) < 36) catchButton.click();
    });
    catchButton.addEventListener('lostpointercapture', () => { blanketPress = null; });
    plugButton.addEventListener('click', () => {
      if (!running || phase !== 'offer' || plugButton.hidden) return;
      unlockSound();
      planner.preload();
      advance('joined');
      callbacks.wake();
    });
    section.querySelector('.roof-return').addEventListener('click', callbacks.exit);

    nextButton.addEventListener('click', () => {
      if (!running || phase !== 'final' || planTime !== null || planning) return;
      nextButton.hidden = true;
      title.focus({ preventScroll: true });
      planTime = 0;
      previousTime = 0;
      callbacks.wake();
    });

    function openPlan() {
      planning = true;
      nextButton.hidden = true;
      secrets.hide();
      for (const control of roofControls) control.hidden = control.inert = true;
      planner.stage.prepend(callbacks.cityCanvas, canvas);
      section.classList.add('is-planning');
      planner.open();
      lastWorld = null;
    }

    function closePlan() {
      if (!planning) return;
      planning = false;
      planTime = null;
      planner.close();
      cityParent.prepend(callbacks.cityCanvas);
      section.prepend(canvas);
      section.classList.remove('is-planning');
      for (const control of roofControls) control.hidden = control.inert = false;
      nextButton.hidden = false;
      lastWorld = null;
      previousTime = 0;
      callbacks.wake();
    }

    function photo(variant) {
      if (!photos.has(variant)) {
        const image = picture(`assets/city/roof-close-${variant}.webp`);
        image.addEventListener('load', callbacks.wake);
        photos.set(variant, image);
      }
      return photos.get(variant);
    }

    return {
      start(showPlanner = false) {
        running = true;
        phaseTime = clock = previousTime = 0;
        lastWorld = null;
        played.clear();
        unlockSound();
        caught = null;
        planTime = null;
        if (location.protocol === 'file:') {
          const variant = section.parentElement.clientWidth / section.parentElement.clientHeight < .86 ? 'portrait' : 'wide';
          photo(variant);
          photo(`${variant}-dark`);
        }
        advance(showPlanner ? 'final' : 'approach');
        section.hidden = section.inert = false;
        narrate(story(phase, 0, 0, reduced.matches), false);
        if (showPlanner) openPlan();
        else title.focus({ preventScroll: true });
        callbacks.wake();
      },
      stop() {
        running = false;
        closePlan();
        planTime = null;
        blanketPress = null;
        section.hidden = section.inert = true;
        secrets.hide();
        catchButton.hidden = plugButton.hidden = nextButton.hidden = true;
        status.textContent = '';
        art.clearRect(0, 0, canvas.width, canvas.height);
      },
      pause() {
        previousTime = 0;
      },
      get running() { return running; },
      render(now, renderer, flightView, mode) {
        if (planning && !planner.showsRoof) return;
        const width = canvas.clientWidth, height = canvas.clientHeight;
        if (!width || !height) return;
        const still = reduced.matches;
        const step = previousTime ? Math.min(.32, (now - previousTime) / 1000) : 0;
        previousTime = now;
        clock += step;
        phaseTime += step;
        if (planTime !== null && !planning) planTime += step;
        const duration = { approach: still || !renderer ? .32 : 1.12, caught: 2.30, cups: 3.56, outage: 3.16, joined: 5.03 };
        const next = { approach: 'spread', caught: 'cups', cups: 'outage', outage: 'offer', joined: 'final' };
        if (phase === 'joined' && phaseTime >= .49) latchSound();
        if (!still && phase === 'spread' && phaseTime >= 2.90 && phaseTime < 4.1) windSound('gust', 1.57, .18);
        if (!still && phase === 'caught' && phaseTime >= .24 && phaseTime < .70) windSound('cloth', .45, .085);
        if (!still && phase === 'outage' && phaseTime >= .10 && phaseTime < .75) windSound('second gust', 1.12, .10);
        if (next[phase] && phaseTime >= duration[phase]) advance(next[phase]);
        const state = story(phase, phaseTime, clock, still, caught);
        const invite = planning ? 1 : planTime === null ? 0 : still ? 1 : clamp(planTime / .84);
        if (invite) offerSecondCup(state, invite);
        state.bowAge = Math.min(2, secrets.age('bow', now));
        state.lanternAge = secrets.age('lantern', now);
        state.coffeeAge = still ? Infinity : secrets.age('coffee', now);
        state.coffeeFound = secrets.found('coffee');
        narrate(state);
        const approaching = phase === 'approach';
        const approach = ease(0, duration.approach, phaseTime);
        const crossfade = approaching && (still || !renderer || mode !== 'flight');
        const showWorld = Boolean(renderer && (!crossfade || approach >= .54));
        const view = closeView(width, height, approaching && !crossfade ? approach : 1,
          renderer ? state.retreat : 0, flightView?.(1, width, height), ease(0, 1, invite));
        const hasProps = !approaching || crossfade;
        const world = { view, hasProps, blackout: state.blackout,
          warmth: Math.round(state.blackout * state.warmth * 10) / 10, wave: state.wave };
        const movingWorld = (!still && approaching) || phase === 'joined' && (state.wave < 1 || state.retreat < 1);
        const dirty = !lastWorld || lastWorld.renderer !== renderer || lastWorld.width !== width || lastWorld.height !== height ||
          lastWorld.approaching || approaching || lastWorld.blackout !== world.blackout ||
          lastWorld.wave !== world.wave || lastWorld.warmth !== world.warmth || lastWorld.retreat !== state.retreat ||
          lastWorld.movingWorld !== movingWorld || lastWorld.invite !== invite;
        callbacks.background(showWorld);
        if (showWorld && dirty) {
          renderer.draw(1, width, height, movingWorld, world);
          lastWorld = { ...world, renderer, width, height, approaching, retreat: state.retreat, movingWorld, invite };
        }

        const ratio = Math.min(devicePixelRatio || 1, 1.5, 1500 / Math.max(width, height));
        const w = Math.round(width * ratio), h = Math.round(height * ratio);
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
        }
        art.setTransform(ratio, 0, 0, ratio, 0, 0);
        art.clearRect(0, 0, width, height);
        if (!renderer && (!approaching || approach >= .54)) {
          drawRoofFallback(art, photo, width, height, view, state);
        }
        const project = point => {
          const offset = subtract(point, view.position);
          const depth = dot(view.forward, offset);
          return [width / 2 * (1 + dot(view.right, offset) * view.projection[0] / depth),
            height / 2 * (1 - dot(view.up, offset) * view.projection[1] / depth), depth];
        };
        if (!approaching || (crossfade && approach >= .54)) {
          paintRoof(art, project, state, images, Boolean(renderer && mode === 'flight' && !still), width, height);
          placeButton(catchButton, !approaching && state.hold, project(state.cloth[0]), width, height, !still && phaseTime < 4.64);
          placeButton(plugButton, !approaching && state.plugReady, project(state.plug), width, height);
        } else if (!crossfade && approach > .40) {
          art.save();
          art.globalAlpha = ease(.40, .96, approach);
          roofAtmosphere(art, project, state, width, height);
          const cord = garland(art, project, state);
          connector(art, project, state, cord, false);
          teaTable(art, project, state);
          art.restore();
        }
        let secretRunning = false;
        if (!approaching && !planning) {
          const [bow, lantern, coffee] = roofEggs;
          const cup = state.cups[1];
          const effectProject = point => {
            const location = project(point);
            return location[2] > .35 ? location : null;
          };
          secretRunning = secrets.render([
            { point: bow.point, show: true, project: effectProject },
            { point: lantern.point, show: !state.blackout || state.warmth > .55, project: effectProject },
            { point: cup?.point.map((value, axis) => value + coffee.point[axis]), show: cup?.landed, project: effectProject },
          ], width, height, now);
        }
        if (crossfade) {
          art.fillStyle = `rgba(14,19,33,${Math.sin(approach * Math.PI) * .96})`;
          art.fillRect(0, 0, width, height);
        }
        const waiting = (phase === 'spread' && phaseTime >= 4.72) || (phase === 'offer' && phaseTime >= 1.65) || phase === 'final';
        if (!planning && planTime !== null && invite === 1) {
          openPlan();
          callbacks.wake();
        } else if (!still || !waiting || secretRunning || (planTime !== null && invite < 1)) callbacks.wake();
        else previousTime = 0;
      }
    };
  }

  function placeButton(button, visible, point, width, height, moving = false) {
    if (visible) {
      const size = moving ? 112 : width < 600 ? 84 : 94;
      const x = Math.max(size / 2, Math.min(width - size / 2, point[0]));
      const y = Math.max(size / 2, Math.min(height - size / 2, point[1]));
      button.style.setProperty('--target-size', `${size}px`);
      button.style.setProperty('--target-x', `${x}px`);
      button.style.setProperty('--target-y', `${y}px`);
      button.style.setProperty('--hint-shift', x > width - 100 ? '-90%' : x < 100 ? '-16%' : '-50%');
      button.toggleAttribute('data-label-below', y < 105);
    }
    button.hidden = !visible;
  }

  function path(ctx, points) {
    ctx.beginPath();
    points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  }

  function cubic(a, b, c, d, steps = 18) {
    return Array.from({ length: steps + 1 }, (_, i) => {
      const t = i / steps, u = 1 - t;
      return a.map((value, axis) => u ** 3 * value + 3 * u ** 2 * t * b[axis] +
        3 * u * t ** 2 * c[axis] + t ** 3 * d[axis]);
    });
  }

  function fill(ctx, points, color) {
    if (points.length < 3) return;
    path(ctx, points);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  function stroke(ctx, points, color, width) {
    path(ctx, points);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
  }

  function oval(ctx, x, y, rx, ry, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x, y, Math.max(.25, rx), Math.max(.25, ry), 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function glow(ctx, x, y, radius, color) {
    if (radius < 1) return;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  function cut(points, axis, threshold, inside) {
    const result = [];
    points.forEach((point, i) => {
      const next = points[(i + 1) % points.length];
      const a = inside * (point[axis] - threshold);
      const b = inside * (next[axis] - threshold);
      if (a >= 0) result.push(point);
      if ((a < 0) !== (b < 0)) result.push(blend(point, next, a / (a - b)));
    });
    return result;
  }

  function lampTint(state, opacity) {
    return state.blackout && state.warmth < .45
      ? `rgba(110,141,193,${opacity})`
      : `rgba(255,183,119,${opacity})`;
  }

  function timber(ctx, project, x, bottom, z, w, h, d, shades) {
    const left = x - w / 2, right = x + w / 2;
    const front = z - d / 2, back = z + d / 2, top = bottom + h;
    const [a, b, c, e] = [[left, top, front], [right, top, front], [right, top, back], [left, top, back]].map(project);
    const [f, g, i] = [[left, bottom, front], [right, bottom, front], [left, bottom, back]].map(project);
    fill(ctx, [a, e, i, f], shades[0]);
    fill(ctx, [a, b, g, f], shades[1]);
    fill(ctx, [a, b, c, e], shades[2]);
    stroke(ctx, [e, a, b], shades[3], .85);
  }

  function teaTable(ctx, project, state) {
    const { x, z, width: w, depth: d, top } = table;
    const light = .37 * (1 - state.blackout) + state.warmth * .63;
    const shades = light > .52 ? ['#342222', '#503129', '#734a39', '#d0975e9c']
      : ['#29222d', '#402a2c', '#5b3a35', '#a0745a82'];
    const corners = [[-1, 1], [1, 1], [-1, -1], [1, -1]];
    const floorShadow = corners.map(([side, end]) => project([x + side * w * .49 + .12, floor, z + end * d * .55 + .10]));
    ctx.save();
    ctx.shadowBlur = 19;
    ctx.shadowColor = '#0d0a19';
    fill(ctx, [floorShadow[0], floorShadow[1], floorShadow[3], floorShadow[2]], '#17122280');
    ctx.restore();
    for (const [side, end] of corners) {
      timber(ctx, project, x + side * w * .42, floor, z + end * d * .39, .079, top - floor - .07, .077, shades);
    }
    timber(ctx, project, x, top - .18, z, w - .08, .127, d - .084, shades);
    timber(ctx, project, x, top - .068, z, w, .068, d, shades);
    for (let i = 0; i < 16; i++) {
      const across = mix(-d / 2 + .022, d / 2 - .025, i / 15);
      const points = [0, 1, 2, 3].map(j => project([
        x - w / 2 + .028 + j * (w - .05) / 3,
        top + .001, z + across + Math.sin(i * 2.3 + j * 1.7) * .008
      ]));
      stroke(ctx, points, i % 4 === 0 ? '#c490653d' : '#28172645', i % 4 === 0 ? .9 : .55);
    }
  }

  let wovenTexture;
  function wool() {
    if (wovenTexture) return wovenTexture;
    const surface = document.createElement('canvas');
    surface.width = 640;
    surface.height = 480;
    const ctx = surface.getContext('2d');
    const image = ctx.createImageData(surface.width, surface.height);
    const wine = [112, 54, 66], mauve = [122, 62, 74], rust = [155, 74, 64];
    const burgundy = [76, 34, 48], brass = [187, 135, 87], flax = [216, 167, 120];
    let seed = 36917;
    for (let y = 0; y < surface.height; y++) {
      for (let x = 0; x < surface.width; x++) {
        const u = x / (surface.width - 1), v = y / (surface.height - 1);
        const hem = (1 - v) * .75;
        let color = (Math.floor(u * 12) + Math.floor(v * 8) % 2) % 3 === 1 ? mauve : wine;
        if (hem < .012) color = burgundy;
        else if (hem < .018) color = brass;
        else if (hem < .032) color = rust;
        else if (hem < .038) color = flax;
        else if (hem < .087) {
          const diamond = Math.abs(u * 15 % 1 - .5) + Math.abs(hem - .062) * 13.6;
          color = diamond < .23 ? flax : diamond < .395 ? brass : burgundy;
        } else if (hem < .092) color = brass;
        else if (hem < .100) color = rust;
        const direction = Math.floor(x / 19) % 2 ? -1 : 1;
        const twill = ((x + y * direction) & 7) < 4 ? 1 : -1;
        const weave = x % 4 === 0 || y % 4 === 0 ? -11 : x % 4 === 1 && y % 4 === 1 ? 10 : 0;
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        const fiber = (seed >>> 28) - 7 + twill * 4 + weave;
        const row = (y * surface.width + x) * 4;
        image.data[row] = color[0] + fiber;
        image.data[row + 1] = color[1] + fiber;
        image.data[row + 2] = color[2] + fiber;
        image.data[row + 3] = 255;
      }
    }
    ctx.putImageData(image, 0, 0);
    wovenTexture = surface;
    return surface;
  }

  function textilePatch(ctx, texture, tile, polygon, basis, shade) {
    const [origin, width, height] = basis;
    ctx.save();
    const middle = polygon.reduce(([x, y], p) => [x + p[0] / polygon.length, y + p[1] / polygon.length], [0, 0]);
    path(ctx, polygon.map(([x, y]) => {
      const length = Math.hypot(x - middle[0], y - middle[1]) || 1;
      return [x + (x - middle[0]) * .55 / length, y + (y - middle[1]) * .55 / length];
    }));
    ctx.closePath();
    ctx.clip();
    ctx.transform(width[0], width[1], height[0], height[1], origin[0], origin[1]);
    const [x, y, w, h] = tile;
    const left = Math.max(0, x - 4), top = Math.max(0, y - 4);
    const right = Math.min(texture.width, x + w + 4), bottom = Math.min(texture.height, y + h + 4);
    ctx.fillStyle = '#65303f';
    ctx.fillRect(-.35, -.35, 1.7, 1.7);
    ctx.drawImage(texture, left, top, right - left, bottom - top,
      (left - x) / w, (top - y) / h, (right - left) / w, (bottom - top) / h);
    if (shade > 0) {
      ctx.fillStyle = `rgba(31,16,40,${shade})`;
    } else {
      ctx.fillStyle = `rgba(255,203,146,${-shade})`;
    }
    ctx.fillRect(-.35, -.35, 1.7, 1.7);
    ctx.restore();
  }

  const clothAcross = [0, .05, .11, .24, .37, .50, .63, .76, .89, .95, 1];
  const clothAlong = [0, .07, .16, .30, .44, .58, .72, .84, .93, 1];

  function laidClothPoint(u, v) {
    const insetX = clothAcross[2], insetZ = clothAlong[2];
    const across = (u - insetX) / (1 - 2 * insetX);
    const along = (v - insetZ) / (1 - 2 * insetZ);
    const spillX = (u - clamp(across) * (1 - 2 * insetX) - insetX) / insetX;
    const spillZ = (v - clamp(along) * (1 - 2 * insetZ) - insetZ) / insetZ;
    const drop = Math.min(1, Math.hypot(spillX, spillZ));
    const pleat = Math.sin(u * 47 + v * 4) * Math.sin(v * 33 + u * 3);
    const x = table.x + (clamp(across) - .5) * (table.width + .073)
      + spillX * (.043 + pleat * .013);
    const z = table.z + (clamp(along) - .5) * (table.depth + .026)
      + spillZ * (.047 + pleat * .012);
    const y = table.top + .019 + .005 * pleat - drop * (.185 + pleat * .027);
    return [x, y, z];
  }

  function fabric(ctx, project, state) {
    const { cloth, wind, fold, drape, ripple, sag, time, still, warmth, blackout } = state;
    const live = still ? 0 : time;
    const light = (1 - blackout) * .48 + warmth * .52;
    const texture = wool();
    const columns = clothAcross.length - 1, rows = clothAlong.length - 1;
    const sample = (u, v) => {
      const p = blend(blend(cloth[0], cloth[1], u), blend(cloth[2], cloth[3], u), v);
      const belly = Math.sin(Math.PI * u) * Math.sin(Math.PI * v);
      const wave = Math.sin(19 * u + 8 * v - live * (wind > .15 ? 7 : 2.5));
      const creases = Math.sin(28 * u + v * 4) * (.014 + wind * .023);
      const tug = wind * Math.sin(v * 7 - live * 5) * (.013 + .056 * u);
      const loose = -sag * belly + (wave * ripple + creases) * (.26 + .74 * belly) + tug;
      p[1] += loose;
      if (p[0] <= roofEdge - .24) p[1] = Math.max(floor + .004, p[1]);
      p[0] += Math.sin(v * 13 + u * 6) * .017 * (1 - fold);
      p[2] += Math.sin(u * 12 + v * 5) * .024 * (1 - fold) + .021 * Math.sin(u * 10 + v * 13 - live * 2) * wind;
      return blend(p, laidClothPoint(u, v), drape);
    };
    if (fold > .78) {
      for (let layer = 2; layer > 0; layer--) {
        const points = [cloth[0], cloth[1], cloth[3], cloth[2]]
          .map(([x, y, z]) => project([x, y - layer * .039, z - layer * .016]));
        fill(ctx, points, layer === 1 ? '#985f65' : '#643645');
        stroke(ctx, points.slice(0, 2), '#e9aa8e85', 1.1);
      }
    }
    const grid = clothAlong.map(v => clothAcross.map(u => sample(u, v)));
    const patches = [];
    const visiblePieces = points => points.some(p => p[0] > roofEdge - .24)
      ? [cut(points, 0, roofEdge - .17, -1), cut(cut(points, 0, roofEdge - .17, 1), 1, 14.15, 1)] : [points];
    for (let j = rows - 1; j >= 0; j--) {
      for (let i = 0; i < columns; i++) {
        const a = grid[j][i], b = grid[j][i + 1], c = grid[j + 1][i + 1], d = grid[j + 1][i];
        const screen = [a, b, c, d].map(project);
        const [A, B, C, D] = screen;
        const tile = [clothAcross[i] * texture.width, (1 - clothAlong[j + 1]) * texture.height,
          (clothAcross[i + 1] - clothAcross[i]) * texture.width, (clothAlong[j + 1] - clothAlong[j]) * texture.height];
        const slope = Math.max(-1, Math.min(1, (b[1] - a[1] + d[1] - a[1]) * 3.2));
        const shade = .23 - .37 * light + mix(.25, .15, wind) * slope + .034 * Math.sin(i * 3 + j);
        const offset = (p, q) => [p[0] - q[0], p[1] - q[1]];
        const first = [D, offset(B,A), offset(A,D)];
        const second = [D, offset(C,D), offset(B,C)];
        for (const [triangle, basis] of [[[a, b, d], first], [[b, c, d], second]]) {
          for (const polygon of visiblePieces(triangle)) {
            if (polygon.length < 3) continue;
            const points = polygon.map(project);
            const [p, q, r] = points;
            const facing = (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
            if (drape > .98 && facing >= 0) continue;
            patches.push({ points, basis, tile, shade, depth: (p[2] + q[2] + r[2]) / 3 });
          }
        }
      }
    }
    if (drape > .98) {
      // Fill the union of the visible faces so antialiased mesh edges never expose the wood.
      ctx.beginPath();
      for (const { points } of patches) {
        ctx.moveTo(points[0][0], points[0][1]);
        for (const [x, y] of points.slice(1)) ctx.lineTo(x, y);
        ctx.closePath();
      }
      ctx.fillStyle = '#703642';
      ctx.fill();
    }
    patches.sort((a, b) => b.depth - a.depth);
    for (const { points, basis, tile, shade } of patches) textilePatch(ctx, texture, tile, points, basis, shade);
    const fringedSides = drape > .98 ? [0] : [0, 1];
    for (const side of fringedSides) {
      const count = side ? 33 : 47;
      for (let i = 0; i <= count; i++) {
        const u = i / count, p = side ? sample(1, u) : sample(u, 0);
        if (p[0] > roofEdge - .17 && p[1] < 14.15) continue;
        const length = .031 + .018 * Math.sin(13 * i + 4 * side) ** 2;
        const end = [p[0] + (side ? length * .82 : .009 * Math.sin(i * 8)), p[1] - length * mix(.16, .73, drape),
          p[2] - (side ? .006 * Math.sin(i * 17) : length)];
        stroke(ctx, [project(p), project(end)], i % 3 ? '#e7b584c4' : '#b77a64cf', i % 5 === 0 ? 1.35 : .81);
      }
    }
  }

  const bearParts = new WeakMap();
  function sprites(images) {
    const { sitter, body, arm } = images;
    if (![sitter, body, arm].every(image => image.naturalWidth)) return null;
    if (!bearParts.has(body)) {
      const draw = (bounds, paint, color) => {
        const surface = document.createElement('canvas');
        const [x, y, w, h] = bounds;
        surface.width = w * 2;
        surface.height = h * 2;
        const ctx = surface.getContext('2d');
        ctx.scale(2, 2);
        ctx.translate(-x, -y);
        paint(ctx);
        if (color) {
          ctx.globalCompositeOperation = 'source-atop';
          ctx.fillStyle = color;
          ctx.fillRect(x, y, w, h);
        }
        return surface;
      };
      const texture = (ctx, image) => ctx.drawImage(image, 0, 0, 420, 420);
      const torso = [54, 204, 330, 216];
      const face = [59, 0, 341, 234];
      const paw = [40, 232, 137, 106];
      const lowerBody = draw(torso, ctx => {
        ctx.beginPath();
        ctx.moveTo(53, 272);
        ctx.lineTo(288, 272);
        ctx.bezierCurveTo(305, 291, 308, 313, 325, 319);
        ctx.bezierCurveTo(359, 321, 378, 358, 380, 421);
        ctx.lineTo(53, 421);
        ctx.closePath();
        ctx.clip();
        texture(ctx, sitter);
        const blendMask = ctx.createLinearGradient(0, 279, 0, 315);
        blendMask.addColorStop(0, 'transparent');
        blendMask.addColorStop(1, '#fff');
        ctx.globalCompositeOperation = 'destination-in';
        ctx.fillStyle = blendMask;
        ctx.fillRect(...torso);
        ctx.globalCompositeOperation = 'source-over';
      });
      const upperBody = draw(torso, ctx => {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(147, 204);
        ctx.quadraticCurveTo(200, 183, 271, 203);
        ctx.bezierCurveTo(292, 219, 301, 263, 309, 319);
        ctx.quadraticCurveTo(205, 368, 102, 323);
        ctx.bezierCurveTo(110, 273, 119, 237, 147, 204);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(body, -6, -10, 406, 420);
        ctx.restore();
        ctx.drawImage(lowerBody, ...torso);
      });
      const head = draw(face, ctx => {
        ctx.beginPath();
        ctx.moveTo(54, 0);
        ctx.lineTo(401, 0);
        ctx.lineTo(401, 174);
        ctx.bezierCurveTo(346, 204, 323, 205, 303, 211);
        ctx.bezierCurveTo(260, 229, 199, 229, 157, 217);
        ctx.bezierCurveTo(113, 203, 63, 178, 54, 176);
        ctx.closePath();
        ctx.clip();
        texture(ctx, body);
      });
      // Join the head and neck to the torso once, before any motion is applied.
      const whole = [0, 0, 420, 420];
      bearParts.set(body, [null, 'rgba(24,43,83,.59)', 'rgba(249,166,69,.18)'].map(color => ({
        body: draw(whole, ctx => {
          ctx.drawImage(upperBody, ...torso);
          ctx.drawImage(head, ...face);
        }, color),
        paw: draw(paw, ctx => texture(ctx, arm), color)
      })));
    }
    return bearParts.get(body);
  }

  function bearRig(ctx, project, state, images, continuousArrival) {
    const reach = state.inviteReach || 0;
    const feet = project([18.18 + .19 * reach, 14.04, 42.44]);
    const crown = project([18.18 + .34 * reach, 16.17 - .10 * reach, 42.44 - .15 * reach]);
    const height = feet[1] - crown[1];
    const scale = height / 414;
    const x = feet[0] - 199 * scale;
    const y = crown[1];
    const layers = sprites(images);
    const warm = state.blackout ? state.warmth : .31;
    const pose = continuousArrival && state.phase === 'spread' ? ease(0, .24, state.t) : 1;
    if (pose < 1 && images.sitter.naturalWidth) {
      ctx.globalAlpha = 1 - pose;
      ctx.drawImage(images.sitter, x, y - 7 * scale, 420 * scale, 420 * scale);
      ctx.globalAlpha = 1;
    }
    function composite(layer, dx, dy, w, h) {
      if (!layers || !pose) return;
      ctx.globalAlpha = pose;
      ctx.drawImage(layers[0][layer], dx, dy, w, h);
      if (state.blackout) {
        ctx.globalAlpha = pose * (1 - warm * .75);
        ctx.drawImage(layers[1][layer], dx, dy, w, h);
      }
      if (warm) {
        ctx.globalAlpha = pose * warm;
        ctx.drawImage(layers[2][layer], dx, dy, w, h);
      }
      ctx.globalAlpha = 1;
    }
    const surprise = state.bowAge;
    const tilt = state.still ? 0 : pose * (state.head[0] * .095 - state.head[1] * .042 + state.head[2] * .15
      + .15 * reach + .044 * Math.sin(surprise * 10) * (1 - ease(.14, .86, surprise)));
    const cosine = Math.cos(tilt), sine = Math.sin(tilt);
    function pawAt(index) {
      const [px, py] = project(state.paws[index]);
      const [shoulderX, shoulderY] = project([(index ? 18.64 : 17.81) + .21 * reach, 14.90, 42.40]);
      const dx = shoulderX - feet[0], dy = shoulderY - feet[1];
      const sx = feet[0] + dx * cosine - dy * sine;
      const sy = feet[1] + dx * sine + dy * cosine;
      const length = Math.hypot(px - sx, py - sy);
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(Math.atan2(py - sy, px - sx));
      const thickness = height * (index ? .173 : .178);
      composite('paw', -thickness * .42, -thickness / 2,
        Math.min(length, height * (.31 + index * .15 * reach)) + thickness * .70, thickness);
      ctx.restore();
    }
    ctx.save();
    ctx.translate(feet[0], feet[1]);
    ctx.rotate(tilt);
    composite('body', -199 * scale, -height, 420 * scale, 420 * scale);
    ctx.restore();
    return pawAt;
  }

  const seatedDateBody = new Path2D(
    'M-210 -426 H225 V-161 H141 C130 -161 129 -139 114 -121 C91 -91 49 -77 0 -78 ' +
    'C-47 -77 -88 -91 -114 -121 C-129 -139 -132 -161 -145 -161 H-210 Z'
  );
  const skatingDateBody = new Path2D(
    'M-210 -426 H225 V-161 H129 C118 -159 111 -132 99 -120 C76 -93 37 -85 0 -88 ' +
    'C-40 -85 -80 -94 -104 -122 C-117 -137 -122 -159 -134 -161 H-210 Z'
  );

  function paintDateBear(ctx, { x, y, size, lean, stretch, paws, feet, seated, light }, images) {
    const parts = sprites(images)?.[0];
    const width = size / 420;
    const height = width * stretch;
    const cosine = Math.cos(lean);
    const sine = Math.sin(lean);

    function limb([px, py], offset, rise, thickness) {
      const sx = x + offset * width * cosine - rise * height * sine;
      const sy = y + offset * width * sine + rise * height * cosine;
      const length = Math.hypot(px - sx, py - sy);
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(Math.atan2(py - sy, px - sx));
      ctx.filter = light;
      ctx.drawImage(parts.paw, -thickness * .43, -thickness / 2, length + thickness * .62, thickness);
      ctx.restore();
    }

    if (feet && parts) {
      const hip = seated ? -103 : -117;
      limb(feet[0], seated ? -70 : -45, hip, size * .145);
      limb(feet[1], seated ? 68 : 43, hip, size * .145);
    }
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(lean);
    ctx.filter = light;
    const body = parts?.body || (images.sitter.naturalWidth ? images.sitter : null);
    if (body) {
      ctx.scale(width, height);
      if (feet && parts) ctx.clip(seated ? seatedDateBody : skatingDateBody);
      ctx.drawImage(body, -199, -404, 420, 420);
    }
    ctx.restore();
    return index => {
      if (parts) limb(paws[index], index ? 61 : -57, -170, size * .167);
    };
  }

  function cup(ctx, project, cup, index, state) {
    const [x, y, z] = cup.point;
    const light = .42 * (1 - state.blackout) + .58 * state.warmth;
    const radius = index ? .146 : .139, height = index ? .228 : .243;
    const point = (dx, dy, dz) => [x + dx + dy * cup.wobble * .43, y + dy, z + dz];
    const ring = (r, level, from = 0, span = 2 * Math.PI) => Array.from({ length: 37 }, (_, step) => {
      const angle = from + span * step / 36;
      return project(point(Math.cos(angle) * r, level, Math.sin(angle) * r));
    });
    const base = project(point(0, 0, 0)), lip = project(point(0, height, 0));
    const w = Math.abs(project(point(radius, height, 0))[0] - lip[0]);
    const h = Math.max(2, base[1] - lip[1]);
    const dark = index ? '#324c56' : '#66586a';
    const middle = index ? '#647e76' : '#b19ba0';
    const rim = index ? '#d8d6ae' : '#f1d8b8';

    if (cup.landed) {
      const under = project(point(.025, -.012, -.012));
      ctx.save();
      ctx.shadowColor = '#160e20a8';
      ctx.shadowBlur = w * .33;
      oval(ctx, under[0] + w * .14, under[1] + h * .04, w * 1.48, h * .185, '#2a1928a0');
      ctx.restore();
      fill(ctx, ring(radius * 1.33, -.008), dark);
      fill(ctx, ring(radius * 1.33, .003), middle);
      fill(ctx, ring(radius * 1.20, .004), index ? '#3b5659' : '#856a70');
      fill(ctx, ring(radius * .77, .005), '#301e258a');
      stroke(ctx, ring(radius * 1.29, .004, Math.PI * 1.04, Math.PI * .78), '#f1c99c72', Math.max(.65, w * .051));
    }

    const direction = index ? -.43 : .58;
    const handlePoint = (offset, level) => point(offset * Math.sqrt(1 - direction ** 2), level, offset * direction);
    const handle = cubic(handlePoint(radius * .89, height * .77), handlePoint(radius * 1.92, height * 1.04),
      handlePoint(radius * 1.93, height * .20), handlePoint(radius * .75, height * .23)).map(project);
    stroke(ctx, handle, dark, Math.max(1.8, w * .26));
    stroke(ctx, handle, middle, Math.max(1, w * .16));
    stroke(ctx, handle.slice(3, 13).map(([px, py]) => [px, py - w * .045]), '#eed0a675', Math.max(.55, w * .052));

    const upper = ring(radius, height);
    const front = upper.slice(18);
    const bottom = ring(radius * .66, .013, Math.PI, Math.PI);
    const curve = cubic(front.at(-1).slice(0, 2), [front.at(-1)[0], lip[1] + h * .47],
      [bottom.at(-1)[0] + w * .17, base[1] - h * .12], bottom.at(-1).slice(0, 2), 8);
    const other = cubic(bottom[0].slice(0, 2), [bottom[0][0] - w * .16, base[1] - h * .10],
      [front[0][0], lip[1] + h * .48], front[0].slice(0, 2), 8);
    const glaze = ctx.createLinearGradient(lip[0] - w, lip[1], lip[0] + w, lip[1] + h * .23);
    glaze.addColorStop(0, dark);
    glaze.addColorStop(.28, middle);
    glaze.addColorStop(.56, index ? '#9ca993' : '#e0c9b7');
    glaze.addColorStop(.64, index ? '#acaa87' : '#e9ccb0');
    glaze.addColorStop(1, middle);
    fill(ctx, [...front, ...curve, ...bottom.toReversed(), ...other], glaze);
    stroke(ctx, bottom.slice(4, -5), '#35232c5c', Math.max(.6, w * .054));

    fill(ctx, upper, rim);
    fill(ctx, ring(radius * .91, height - .002), dark);
    const coffee = ctx.createLinearGradient(lip[0] - w, lip[1] - h * .08, lip[0] + w, lip[1] + h * .13);
    coffee.addColorStop(0, '#49281f');
    coffee.addColorStop(.36, light > .5 ? '#986040' : '#674033');
    coffee.addColorStop(.78, '#512c25');
    coffee.addColorStop(1, '#352127');
    const surface = ring(radius * .87, height - .014);
    ctx.save();
    path(ctx, ring(radius * .91, height - .002));
    ctx.clip();
    fill(ctx, surface, coffee);
    stroke(ctx, surface.slice(19, -1), '#e2ab70ad', Math.max(.75, w * .071));
    if (index) {
      ctx.save();
      ctx.translate(lip[0], lip[1] + h * .055);
      const stir = state.coffeeAge;
      if (stir < 2.15) {
        const phase = ease(0, 1.72, stir);
        for (let ring = 0; ring < 3; ring++) {
          const ripple = (phase + ring * .27) % 1;
          ctx.beginPath();
          ctx.ellipse(0, 0, Math.max(.25, w * .72 * ripple), Math.max(.22, h * .17 * ripple), 0, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(245,199,152,${Math.sin(ripple * Math.PI) * (1 - ease(1.37, 2.15, stir)) * .59})`;
          ctx.lineWidth = Math.max(.7, w * .027);
          ctx.stroke();
        }
      }
      const foam = state.coffeeFound ? Math.max(.06, ease(.17, 1.85, stir)) : .16;
      ctx.scale(w * .36 * foam, h * .13 * foam);
      ctx.rotate(ease(0, 1.56, stir) * Math.PI * 2);
      ctx.beginPath();
      ctx.moveTo(0, -.28);
      ctx.bezierCurveTo(-.76, -1.48, -1.64, -.09, 0, .76);
      ctx.bezierCurveTo(1.64, -.09, .76, -1.48, 0, -.28);
      ctx.fillStyle = '#f1cda1bd';
      ctx.fill();
      ctx.restore();
    } else {
      stroke(ctx, surface.slice(7, 15).map(([px, py]) => [mix(px, lip[0], .24), mix(py, lip[1], .29)]),
        '#f9d9a27a', Math.max(.55, w * .054));
    }
    ctx.restore();

    if (!cup.landed) return;
    for (let i = 0; i < 3; i++) {
      const drift = state.still ? 0 : state.time * (1.11 + i * .25);
      const start = lip[0] + (i - 1) * w * .31;
      const rise = h * (1.55 + i * .31);
      const plume = ctx.createLinearGradient(start, lip[1], start, lip[1] - rise);
      plume.addColorStop(0, 'transparent');
      plume.addColorStop(.29, `rgba(${light > .3 ? '247,225,197' : '195,215,245'},${.14 + light * .22})`);
      plume.addColorStop(1, 'transparent');
      ctx.strokeStyle = plume;
      ctx.lineWidth = Math.max(.7, w * (.10 + light * .024));
      ctx.beginPath();
      ctx.moveTo(start, lip[1] - h * .09);
      ctx.bezierCurveTo(start + w * Math.sin(drift + i), lip[1] - rise * .37,
        start + w * (Math.sin(drift + i + 2) + .48), lip[1] - rise * .66,
        start + w * (.75 + Math.sin(drift + i + 3)), lip[1] - rise);
      ctx.save();
      ctx.lineWidth *= 2.8;
      ctx.globalAlpha = .24;
      ctx.stroke();
      ctx.restore();
      ctx.stroke();
    }
  }

  function roofAtmosphere(ctx, project, state, width, height) {
    const power = state.blackout ? state.warmth : .49;
    const edge = ctx.createRadialGradient(width * .55, height * .55, height * .12,
      width * .54, height * .52, Math.hypot(width, height) * .57);
    edge.addColorStop(0, 'transparent');
    edge.addColorStop(.58, 'rgba(13,17,34,.09)');
    edge.addColorStop(1, 'rgba(7,11,31,.56)');
    ctx.fillStyle = edge;
    ctx.fillRect(0, 0, width, height);
    if (!state.still && state.gust > .08) {
      const haze = ctx.createLinearGradient(0, 0, width * .71, height * .54);
      haze.addColorStop(0, `rgba(155,173,225,${.17 * state.gust})`);
      haze.addColorStop(1, 'transparent');
      ctx.fillStyle = haze;
      ctx.fillRect(0, 0, width, height);
    }
    const [lampX, lampY] = project([19.31, 14.54, 42.78]);
    glow(ctx, lampX, lampY, Math.min(width, height) * (.23 + power * .085), lampTint(state, .038 + power * .15));
    if (state.lanternAge < 2.25) {
      const life = ease(0, .24, state.lanternAge) * (1 - ease(.42, 2.25, state.lanternAge));
      glow(ctx, lampX, lampY, Math.min(width, height) * (.16 + life * .09), `rgba(255,166,76,${life * .58})`);
    }

    if (!state.still && (state.phase === 'joined' || state.phase === 'final')) {
      const burst = state.phase === 'joined' ? ease(.94, 1.67, state.t) * (1 - ease(2.86, 4.74, state.t)) : 0;
      for (let i = 0; i < 24; i++) {
        const v = (i * .618 + state.time * (.085 + i % 4 * .022)) % 1;
        const drift = Math.sin(i * 2.03) * (.22 + v * 1.95) + Math.sin(state.time * .93 + i) * .13;
        const [x, y] = project([19.2 + drift, 14.19 + v * 2.62, 42.65 + Math.cos(i * 3.2) * .82]);
        const alpha = Math.sin(v * Math.PI) * (burst * .68 + (i % 4 === 0 ? .26 * state.warmth : 0));
        if (alpha <= .03) continue;
        glow(ctx, x, y, 6 + i % 4 * 2.7, `rgba(255,181,83,${alpha})`);
        oval(ctx, x, y, 1.05 + (i % 3) * .38, 1.12 + (i % 3) * .38, `rgba(255,237,186,${alpha * 1.28})`);
      }
    }
  }

  function windSweep(ctx, width, height, state, foreground) {
    const strength = state.still ? (state.hold ? .53 : 0) : state.gust;
    if (strength < .025) return;
    const time = state.still ? 3.93 : state.time;
    const scale = Math.min(width, height);
    const noise = n => ((Math.sin(n * 82.17 + 23.8) * 9371.72) % 1 + 1) % 1;

    for (let i = 0; i < (foreground ? 6 : 7); i++) {
      const seed = foreground ? i + 18 : i + 2;
      const v = (time * (.46 + noise(seed) * .20) + noise(seed + 8)) % 1;
      const x = width * (-.30 + v * 1.60);
      const y = height * (.34 + noise(seed + 12) * .48) - scale * .085 * Math.sin(v * Math.PI * 2 + seed);
      const length = scale * (.16 + strength * .33) * (.63 + noise(seed + 16) * .55);
      const curve = scale * (.025 + strength * .054) * (.43 + noise(seed + 3));
      const fade = Math.sin(v * Math.PI) * strength * (foreground ? .65 : .38);
      const stream = ctx.createLinearGradient(x - length, y, x, y - curve);
      stream.addColorStop(0, 'transparent');
      stream.addColorStop(.44, `rgba(191,216,255,${fade * .36})`);
      stream.addColorStop(.82, `rgba(222,235,253,${fade})`);
      stream.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.moveTo(x - length, y + curve * .5);
      ctx.bezierCurveTo(x - length * .69, y + curve * .79, x - length * .43, y - curve * 1.25, x, y - curve);
      ctx.strokeStyle = stream;
      ctx.lineWidth = foreground ? Math.max(1.35, scale * .0032) : Math.max(.8, scale * .0015);
      ctx.stroke();
    }

    const leaves = state.still ? 4 : foreground ? 15 : 20;
    for (let i = 0; i < leaves; i++) {
      const seed = i + (foreground ? 54 : 23);
      const v = (noise(seed) + time * (.28 + noise(seed + 9) * .24)) % 1;
      const x = width * (-.13 + v * 1.26);
      const y = height * (.32 + noise(seed + 10) * .48)
        + scale * (.09 * Math.sin(v * Math.PI * 2 + seed) - v * .085);
      const size = Math.max(3.2, scale * (.0054 + noise(seed + 19) * .014) * (foreground ? 1 : .57));
      const turn = time * (5 + noise(seed + 12) * 5) + seed;
      ctx.save();
      ctx.globalAlpha = Math.sin(v * Math.PI) * strength * (foreground ? .92 : .54);
      ctx.translate(x, y);
      ctx.rotate(-.32 + Math.sin(turn * .76) * 1.66);
      ctx.scale(size, size * (.33 + .67 * Math.abs(Math.cos(turn))));
      ctx.beginPath();
      ctx.moveTo(-.72, .02);
      ctx.bezierCurveTo(-.26, -.68, .25, -.59, .77, -.30);
      ctx.bezierCurveTo(.51, .40, -.08, .62, -.72, .02);
      ctx.fillStyle = ['#cb8c4d', '#d9ab69', '#a85d51', '#dfb984', '#ad9e69'][seed % 5];
      ctx.fill();
      stroke(ctx, [[-.91, .17], [-.4, .045], [.28, -.12]], '#523943ad', .072);
      ctx.restore();
    }
  }

  function post(ctx, project, base, state) {
    const [x, y, z] = base;
    const palette = state.warmth > .55 ? ['#2b2732', '#4e3430', '#76543f', '#d29b5a98']
      : ['#222634', '#332d3c', '#594341', '#a277627d'];
    const iron = ['#1e2435', '#2e3444', '#4c4a50', '#817470aa'];
    timber(ctx, project, x, y, z, .27, .055, .24, iron);
    timber(ctx, project, x, y + .052, z, .177, .26, .15, iron);
    timber(ctx, project, x, y + .052, z, .112, spanTop - y - .003, .112, palette);
    timber(ctx, project, x, spanTop - .21, z, .14, .076, .14, iron);
    timber(ctx, project, x, spanTop + .02, z, .175, .055, .17, palette);
    const [anchorX, anchorY] = project([x, spanTop, z]);
    const radius = Math.max(2.1, Math.abs(project([x + .068, spanTop, z])[0] - anchorX));
    oval(ctx, anchorX, anchorY, radius, radius * .92, '#c29864');
    oval(ctx, anchorX, anchorY, radius * .54, radius * .51, '#272536');
    for (const delta of [-.086, .086]) {
      const [boltX, boltY] = project([x + delta, y + .059, z - .08]);
      oval(ctx, boltX, boltY, 1.6, 1.1, '#d3ac77af');
    }
  }

  function garland(ctx, project, state) {
    const sway = state.still ? 0 : Math.sin(state.time * 1.58) * (.14 + .86 * state.gust);
    const swing = state.still ? 0 : state.gust * Math.sin(state.time * 8.1);
    const tug = state.phase === 'offer' ? Math.sin(state.pull * Math.PI) : 0;
    const wire = t => [
      mix(posts[0][0], posts[1][0], t),
      spanTop - Math.sin(Math.PI * t) * (.51 + sway * .061 + tug * .064 + swing * .045),
      mix(posts[0][2], posts[1][2], t) + Math.sin(Math.PI * t) * sway * .082
    ];
    for (const base of posts) post(ctx, project, base, state);
    const points = Array.from({ length: 38 }, (_, i) => project(wire(i / 37)));
    stroke(ctx, points, '#151723', 2.1);
    stroke(ctx, points.map(([x, y]) => [x, y - .46]), '#b0978366', .7);
    for (let i = 0; i < 7; i++) {
      const t = .078 + i * .139;
      const point = wire(t);
      const top = project(point);
      const swingAngle = swing * (.33 + .22 * Math.sin(i)) + sway * .25;
      const [x, y] = project([point[0] + .135 * Math.sin(swingAngle), point[1] - .135 * Math.cos(swingAngle), point[2]]);
      const r = Math.max(2.15, Math.abs(top[1] - y) * .31);
      const light = state.bulbs[i];
      if (light > .005) {
        glow(ctx, x, y + r * .9, r * 13, `rgba(255,159,64,${light * .28})`);
        glow(ctx, x, y + r * .8, r * 4.3, `rgba(255,203,111,${light * .45})`);
      }
      stroke(ctx, [top, [x, y]], '#24232d', Math.max(1.45, r * .62));
      oval(ctx, x, y + r * .68, r, r * 1.47, light > 0 ? `rgb(${117 + light * 138},${122 + light * 103},${140 + light * 25})` : '#5f6275');
      oval(ctx, x - .25 * r, y + r * .56, r * .35, r * .91, light > 0 ? `rgba(255,249,206,${light})` : '#a2a4ae79');
      if (light > .62) oval(ctx, x, y + r * 1.15, r * .32, r * .29, '#fff4d1');
    }
    if (!state.still && state.phase === 'joined') {
      traceLight(ctx, points.toReversed(), (state.t - 1.02) / 1.13);
    }
    return wire(1);
  }

  const cordFoot = [20.25, floor + .016, 41.51];
  const powerFoot = [20.045, floor + .018, 41.07];

  function extend(point, direction, distance) {
    return point.map((value, axis) => value + distance * direction[axis]);
  }

  function traceLight(ctx, points, progress) {
    if (progress < 0 || progress > 1) return;
    const distances = [0];
    for (let i = 1; i < points.length; i++) {
      distances.push(distances[i - 1] + Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]));
    }
    const total = distances.at(-1);
    const at = total * progress;
    const i = Math.max(1, distances.findIndex(value => value >= at));
    const point = blend(points[i - 1], points[i], (at - distances[i - 1]) / Math.max(.001, distances[i] - distances[i - 1]));
    const [x, y] = point;
    const radius = Math.max(13, Math.min(total * .12, 30));
    glow(ctx, x, y, radius, 'rgba(255,180,67,.69)');
    oval(ctx, x, y, 2.4, 2.4, '#fff0bf');
  }

  function cable(ctx, project, points, gauge, pulse) {
    const shadow = points.map(([x, y, z]) => [x + (y - floor) * .13, floor + .003, z - (y - floor) * .075]);
    if (points.every(point => point[1] < floor + .67)) {
      stroke(ctx, shadow.map(project), '#140f22a0', gauge * 1.27);
    }
    const line = points.map(project);
    path(ctx, line);
    braid(ctx, gauge);
    if (pulse !== undefined) traceLight(ctx, line.toReversed(), pulse);
  }

  function braid(ctx, radius) {
    ctx.strokeStyle = '#241a26';
    ctx.lineWidth = radius;
    ctx.stroke();
    ctx.strokeStyle = '#85594e';
    ctx.lineWidth = radius * .47;
    ctx.stroke();
    ctx.save();
    ctx.setLineDash([radius * .51, radius * .66]);
    ctx.strokeStyle = '#d29d78bd';
    ctx.lineWidth = radius * .26;
    ctx.stroke();
    ctx.restore();
  }

  function metalSleeve(ctx, x, y, w, h) {
    const sheen = ctx.createLinearGradient(0, y, 0, y + h);
    sheen.addColorStop(0, '#f5ca8d');
    sheen.addColorStop(.28, '#bb8a59');
    sheen.addColorStop(.49, '#795344');
    sheen.addColorStop(.78, '#d8a376');
    sheen.addColorStop(1, '#493341');
    ctx.fillStyle = sheen;
    ctx.strokeStyle = '#352332';
    ctx.lineWidth = Math.max(.8, h * .12);
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, h * .29);
    ctx.fill();
    ctx.stroke();
  }

  function connector(ctx, project, state, cordStart, front) {
    const ready = state.plugVisibility > .01;
    const lighting = !state.still && state.phase === 'joined';
    const end = project(socket);
    const direction = project(extend(socket, socketAxis, .14));
    const socketAngle = Math.atan2(direction[1] - end[1], direction[0] - end[0]);
    const size = Math.max(2, Math.hypot(direction[0] - end[0], direction[1] - end[1]));
    const sleeve = size * .65;
    const gauge = Math.max(1.8, size * .185);
    if (!front) {
      const [x, , z] = posts[1];
      const foot = [x - .072, floor + .20, z - .018];
      const bend = [x - .24, floor + .016, z - .26];
      const down = cubic(cordStart, [x - .080, spanTop - .10, z - .012],
        [x - .074, spanTop - .20, z - .014], [x - .074, spanTop - .30, z - .017]);
      const turn = cubic(foot, [foot[0], floor + .041, foot[2]], [x - .149, bend[1], z - .106], bend);
      const slack = cubic(bend, [x - .46, floor + .016, z - .66], [20.74, floor + .016, 41.72], cordFoot);
      cable(ctx, project, [...down, foot, ...turn.slice(1), ...slack.slice(1)], gauge * .91,
        lighting ? (state.t - .61) / .43 : undefined);
      if (ready) {
        const feed = cubic([19.83, floor + .10, 41.23], [19.83, floor + .014, 41.08],
          [19.94, floor + .018, mix(41.00, 41.10, state.seated)], powerFoot);
        ctx.save();
        ctx.globalAlpha *= state.plugVisibility;
        cable(ctx, project, feed, gauge);
        ctx.restore();
      }
      for (const clip of [16.77, 15.72, 14.53]) {
        stroke(ctx, [[x - .107, clip, z - .023], [x - .043, clip, z - .023]].map(project), '#b1956e', 1.35);
      }
      timber(ctx, project, 20.06, socket[1] - .058, 41.155, .34, .025, .092,
        ['#2d2331', '#4f3d38', '#745d49', '#ae866c8f']);
      return;
    }
    const inserted = state.seated;
    const closed = inserted >= .98;
    const socketBack = extend(socket, socketAxis, .151);
    const wall = cubic(socketBack, extend(socketBack, socketAxis, .19), [20.40, floor + .016, 41.49], cordFoot);
    cable(ctx, project, wall, gauge * .91, lighting ? (state.t - .47) / .15 : undefined);
    ctx.save();
    ctx.translate(end[0], end[1]);
    ctx.rotate(socketAngle);
    metalSleeve(ctx, 0, -sleeve * .54, size * 1.08, sleeve * 1.08);
    oval(ctx, .015 * size, 0, size * .13, sleeve * .45, '#c5976f');
    oval(ctx, .005 * size, 0, size * .077, sleeve * .32, closed ? '#fed69d' : '#392a39');
    const pulse = state.still ? 1 : .72 + .28 * Math.sin(state.time * 3.9);
    const indicator = closed ? .96 : pulse * .65;
    glow(ctx, size * .67, -size * .021, size * .58, `rgba(253,169,79,${indicator * .40})`);
    oval(ctx, size * .67, -size * .021, size * .084, size * .086, `rgba(255,218,160,${indicator})`);
    ctx.restore();

    if (!ready) return;

    const tip = project(state.plug);
    const axis = closed ? socketAxis : unit(blend(unit(subtract(socket, state.plug)), socketAxis, inserted));
    const forward = project(extend(state.plug, axis, .14));
    const plugAngle = Math.atan2(forward[1] - tip[1], forward[0] - tip[0]);
    const plugSize = Math.max(size * .48, Math.hypot(forward[0] - tip[0], forward[1] - tip[1]));
    const tail = extend(state.plug, axis, -.153);
    const lateral = ease(0, .85, inserted);
    const crossing = blend([20.07, table.top + .047, 41.69], [20.17, floor + .053, 40.98], lateral);
    const tangent = blend([-.14, .026, .15], [.025, .032, .085], lateral);
    const slack = [20.22, floor + .018, mix(41.24, 41.02, lateral)];
    const lift = cubic(powerFoot, slack, extend(crossing, tangent, -1), crossing);
    const drop = cubic(crossing, extend(crossing, tangent, 1), extend(tail, axis, -.18), tail);
    ctx.save();
    ctx.globalAlpha *= state.plugVisibility;
    cable(ctx, project, [...lift, ...drop.slice(1)], gauge);
    ctx.translate(tip[0], tip[1]);
    ctx.rotate(plugAngle);
    ctx.scale(plugSize / size, 1);
    if (!closed) {
      for (const offset of [-.11, .11]) stroke(ctx, [[-.15 * size, offset * size], [.20 * size, offset * size]], '#f3c894', gauge * .58);
    }
    metalSleeve(ctx, -size * 1.11, -sleeve * .48, size * 1.08, sleeve * .96);
    for (const position of [-.83, -.67, -.51]) stroke(ctx, [[size * position, -sleeve * .29],
      [size * position, sleeve * .29]], '#634133', Math.max(.65, gauge * .4));
    stroke(ctx, [[-.22 * size, -.38 * sleeve], [-.22 * size, .38 * sleeve]], '#eec393', gauge * .54);
    ctx.restore();

    if (state.phase === 'joined' && !state.still && state.t > .45 && state.t < .80) {
      const flare = (1 - ease(.47, .80, state.t)) * ease(.45, .52, state.t);
      glow(ctx, end[0], end[1], size * (1.3 + (1 - flare) * 1.5), `rgba(255,171,76,${flare * .68})`);
    }
  }

  function paintRoof(ctx, project, state, images, continuousArrival, width, height) {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    roofAtmosphere(ctx, project, state, width, height);
    windSweep(ctx, width, height, state, false);
    const cord = garland(ctx, project, state);
    connector(ctx, project, state, cord, false);
    const paw = bearRig(ctx, project, state, images, continuousArrival);
    teaTable(ctx, project, state);
    fabric(ctx, project, state);
    connector(ctx, project, state, cord, true);
    state.cups.forEach((item, index) => { if (item) cup(ctx, project, item, index, state); });
    paw(0);
    paw(1);
    windSweep(ctx, width, height, state, true);
    if (state.breath > .1 && !state.still) {
      const [x, y] = project([18.31, 15.35, 42.38]);
      glow(ctx, x + 17 * (1 - state.breath), y + 8, 10 + 15 * (1 - state.breath), `rgba(217,222,237,${state.breath * .19})`);
    }
  }

  function drawRoofFallback(ctx, photo, width, height, view, state) {
    const portrait = width / height < .86;
    const variant = portrait ? 'portrait' : 'wide';
    const light = photo(variant), dark = photo(`${variant}-dark`);
    const field = portrait ? 1.86 : .83;
    const draw = image => {
      if (!image.naturalWidth) return false;
      const h = height * view.projection[1] * field;
      const w = h * image.naturalWidth / image.naturalHeight;
      ctx.drawImage(image, (width - w) / 2, (height - h) / 2, w, h);
      return true;
    };
    ctx.fillStyle = '#342943';
    ctx.fillRect(0, 0, width, height);
    if (!draw(light)) return;
    if (state.blackout && state.wave < 1 && draw(dark) && state.wave > 0) {
      ctx.save();
      ctx.beginPath();
      const bands = [.34, .20, .08, 0, .065, .22, .27];
      bands.forEach((delay, i) => {
        const front = ease(delay * .6, .96 + delay * .12, state.wave);
        const y = height * (.71 - .71 * front);
        ctx.rect(width * i / bands.length, y, width / bands.length + 1, height - y);
      });
      ctx.clip();
      ctx.globalAlpha = ease(0, .18, state.wave);
      draw(light);
      ctx.restore();
    }
    const horizon = height * (portrait ? .46 : .36);
    const wash = ctx.createLinearGradient(0, 0, 0, horizon * 1.48);
    wash.addColorStop(0, '#63306162');
    wash.addColorStop(.53, '#a72e646f');
    wash.addColorStop(.69, '#d13d718f');
    wash.addColorStop(.82, '#ee6b6673');
    wash.addColorStop(1, 'transparent');
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, width, horizon * 1.48);
    ctx.restore();
  }

  window.createRooftop = makeRooftop;
})();





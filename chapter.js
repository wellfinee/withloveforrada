(() => {
  'use strict';

  const scene = document.querySelector('#scene');
  const garden = document.querySelector('#transition');
  const gardenContent = garden.querySelector('.gift-room');
  const gate = document.querySelector('#chapterGate');
  const chapter = document.querySelector('#lastChapter');
  const bridge = document.querySelector('#chapterBridge');
  const scroller = chapter.querySelector('.city-scroll');
  const intro = chapter.querySelector('.city-intro');
  const navigation = chapter.querySelector('.last-navigation');
  const stage = chapter.querySelector('.city-stage');
  const canvas = chapter.querySelector('.city-canvas');
  const stills = chapter.querySelector('.city-stills');
  const approach = chapter.querySelector('#cityApproach');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const progress = { gifts: 0, memories: 0 };
  const flightEggs = [
    { kind: 'fireflies', label: 'Коснуться фонаря', announcement: 'Светлячки вылетели из фонаря и осветили нам дорогу.',
      point: [2.17, 3.2, 22.55], range: [.065, .275], frame: 1, still: [.69, .36] },
    { kind: 'plane', label: 'Пустить бумажный самолётик', announcement: 'Из окна вылетел бумажный самолётик. Я бы написал на нём «Люблю возвращаться домой вместе с тобой».',
      point: [13.10, 5.15, 33.78], range: [.412, .667], frame: 5, still: [.50, .42] },
    { kind: 'star', label: 'Загадать желание', announcement: 'Над городом зажглось сердце. Я бы загадал ещё один вечер с тобой.',
      point: [20.3, 19.4, 59], range: [.81, 1], frame: 8, still: [.71, .24] }
  ];
  const flightSecrets = window.createSceneSecrets(chapter.querySelector('.city-secrets'), flightEggs, reduced, requestDraw);
  const descriptions = [
    ['arch', 'Золотая нить ведёт из сада через каменную арку к тёплому фонарю.'],
    ['street', 'В окнах жилых домов горит свет, а фонари отражаются в мокрой брусчатке.'],
    ['street-photo', 'В окне над мостовой стоит фотография, где вы сидите вдвоём у кирпичной стены.'],
    ['corner-photo', 'У поворота в широком окне — ваш снимок за столом.'],
    ['garland', 'За кирпичным углом над улицей горит гирлянда.'],
    ['window', 'За открытыми шторами на подоконнике стоит снимок, на котором вы вдвоём.'],
    ['ascent', 'Золотая нить поднимается мимо окон и карниза к крышам.'],
    ['upper-photo', 'В верхнем окне за балконом — фотография с поцелуем в щёку.'],
    ['roof', 'На крыше рядом с фонарём сидит мишка. За ним до горизонта светятся вечерние кварталы.']
  ];
  let frame = 0;
  let visit = 0;
  let renderer;
  let cityModule;
  let crossing;
  let gardenTop, windowTop;
  let viewportHeight = 0;
  let previousTravel = 0;
  let currentPosition = 0;
  let displayedPosition = 0;
  let motionTarget = 0;
  let motionElapsed = 0;
  let lastPaint = 0;
  let lastCityPosition, lastCityWidth, lastCityHeight, lastCityMoving;
  let contextLost = false;
  let rendererReady = false;
  let flightView;
  const rooftop = window.createRooftop(chapter.querySelector('#rooftop'), reduced, {
    cityCanvas: canvas,
    wake: requestDraw,
    exit: returnToFlight,
    background: visible => chapter.classList.toggle('has-roof-world', visible)
  });

  const clamp = value => Math.max(0, Math.min(1, value));
  function ease(start, end, value) {
    const t = clamp((value - start) / (end - start));
    return t * t * (3 - 2 * t);
  }

  function loadCity() {
    cityModule ??= import('./city-renderer.js?v=raspberry-2').catch(error => {
      cityModule = null;
      throw error;
    });
    return cityModule;
  }

  function showGate() {
    if (!gate.hidden || progress.gifts !== 3 || progress.memories !== 3 || document.querySelector('dialog[open]')) return;
    const poster = picture('arch');
    poster.className = 'city-poster';
    stage.prepend(poster);
    if (!reduced.matches && location.protocol !== 'file:') loadCity().catch(() => {});
    gate.hidden = false;
    document.querySelector('#announcement').textContent = 'Все коробки и воспоминания открыты. В саду появилась золотая нить.';
    gate.scrollIntoView({ block: 'nearest', behavior: reduced.matches ? 'instant' : 'smooth' });
  }

  window.addEventListener('anniversary:progress', ({ detail }) => {
    if (!Object.hasOwn(progress, detail.group)) return;
    progress[detail.group] = detail.count;
    showGate();
  });
  for (const dialog of document.querySelectorAll('dialog')) dialog.addEventListener('close', showGate);

  function picture(name, description = '') {
    const element = document.createElement('picture');
    const phone = document.createElement('source');
    phone.media = '(max-aspect-ratio: 4/5)';
    phone.srcset = `assets/city/${name}-portrait.webp`;
    const image = new Image();
    image.alt = description;
    image.decoding = 'async';
    image.src = `assets/city/${name}.webp`;
    element.append(phone, image);
    return element;
  }

  function routeProgress() {
    const travel = scroller.scrollHeight - scroller.clientHeight;
    if (previousTravel && travel && travel !== previousTravel) scroller.scrollTop = currentPosition * travel;
    previousTravel = travel;
    currentPosition = travel > 0 ? Math.max(0, Math.min(1, scroller.scrollTop / travel)) : 0;
    return currentPosition;
  }

  function setMode(mode) {
    if (chapter.dataset.mode === mode) return;
    lastCityPosition = undefined;
    const position = routeProgress();
    if (mode === 'stills' && !stills.childElementCount) {
      for (const [name, description] of descriptions) {
        const figure = document.createElement('figure');
        figure.className = 'city-still';
        if (name === 'roof') figure.classList.add('city-still-sunset');
        figure.append(picture(name, description));
        stills.append(figure);
      }
    }
    chapter.dataset.mode = mode;
    stills.hidden = mode !== 'stills';
    previousTravel = scroller.scrollHeight - scroller.clientHeight;
    scroller.scrollTop = position * previousTravel;
  }

  function followScroll(target, time) {
    const changed = target !== motionTarget;
    motionTarget = target;
    const gap = target - displayedPosition;
    const elapsed = time - lastPaint;
    lastPaint = time;
    const step = changed && elapsed > 65 ? 14 : Math.min(43, Math.max(4, elapsed));
    // A late frame must not skip the easing and teleport straight to the target.
    motionElapsed = (changed ? 0 : motionElapsed) + step;
    const remaining = 158 - motionElapsed;
    if (remaining <= 0 || Math.abs(gap) * previousTravel < .14) {
      displayedPosition = target;
    } else {
      const blend = Math.max(-Math.expm1(-step / 43), 1 - (remaining / (remaining + step)) ** 2);
      displayedPosition += gap * blend;
      requestDraw();
    }
    return displayedPosition;
  }

  function draw(time = performance.now()) {
    frame = 0;
    if (chapter.hidden || document.hidden) return;
    if (rooftop.running) {
      flightSecrets.hide();
      rooftop.render(time, rendererReady ? renderer : null, flightView, chapter.dataset.mode);
      return;
    }
    const target = routeProgress();
    const flying = renderer && chapter.dataset.mode === 'flight';
    const position = flying ? followScroll(target, time) : target;
    const width = stage.clientWidth || scroller.clientWidth;
    const height = scroller.clientHeight;
    intro.style.opacity = 1 - clamp(position / .047);
    if (flying && (position !== lastCityPosition || width !== lastCityWidth || height !== lastCityHeight || lastCityMoving)) {
      renderer.draw(position, width, height, position !== target);
      lastCityPosition = position;
      lastCityWidth = width;
      lastCityHeight = height;
      lastCityMoving = position !== target;
    }
    if (chapter.inert || chapter.dataset.mode === 'poster') {
      flightSecrets.hide();
    } else {
      const view = flying ? flightView(position, width, height) : null;
      const stillAt = position * (descriptions.length - 1);
      const projectWorld = view && (point => window.projectCityAnchor(view, point, width, height));
      const locations = flightEggs.map(item => {
        if (view) {
          return { point: item.point, show: position >= item.range[0] && position <= item.range[1], project: projectWorld };
        }
        const show = Math.abs(stillAt - item.frame) < .46;
        const pixelsPerUnit = Math.min(width, height) * (item.kind === 'star' ? .078 : .12);
        const x = item.still[0] * width;
        const y = (item.still[1] - stillAt + item.frame) * height;
        return { point: item.point, show, project: show ? ([px, py]) => [
          x + (px - item.point[0]) * pixelsPerUnit, y - (py - item.point[1]) * pixelsPerUnit,
        ] : null };
      });
      if (flightSecrets.render(locations, width, height, time)) requestDraw();
    }
    approach.hidden = chapter.inert || target < .997 || position < .997 || chapter.dataset.mode === 'poster';
  }

  function requestDraw() {
    if (!chapter.hidden && !document.hidden && !frame) frame = requestAnimationFrame(draw);
  }

  function resize() {
    if (chapter.hidden) return;
    const height = scroller.clientHeight;
    if (height !== viewportHeight) {
      viewportHeight = height;
      chapter.style.setProperty('--city-height', `${height}px`);
    }
    if (!rooftop.running) routeProgress();
    requestDraw();
  }

  async function prepareRenderer() {
    if (contextLost || location.protocol === 'file:') return;
    const module = await loadCity();
    if (contextLost) return;
    flightView = module.cityView;
    renderer ??= module.createCity(canvas, requestDraw);
    const currentRenderer = renderer;
    await currentRenderer?.ready;
    if (currentRenderer && renderer === currentRenderer) rendererReady = true;
  }

  async function choosePresentation() {
    const current = ++visit;
    if (reduced.matches || contextLost || location.protocol === 'file:') {
      setMode('stills');
      draw();
      if (reduced.matches && !contextLost && location.protocol !== 'file:') prepareRenderer().then(requestDraw, () => {});
      return;
    }
    try {
      await prepareRenderer();
    } catch (error) {
      if (current !== visit || chapter.hidden) return;
      renderer = null;
      rendererReady = false;
      console.warn('Не удалось запустить трёхмерный город.', error);
    }
    if (current !== visit || chapter.hidden) return;
    if (rendererReady) {
      // Draw before removing the entrance still, including on repeat visits.
      displayedPosition = motionTarget = routeProgress();
      if (!document.hidden) renderer.draw(displayedPosition, stage.clientWidth || scroller.clientWidth, scroller.clientHeight);
      setMode('flight');
    } else {
      setMode('stills');
    }
    requestDraw();
  }

  function paintThread(context, time, opening, projectEntrance) {
    const width = bridge.clientWidth;
    const height = bridge.clientHeight;
    if (!width || !height) return;
    const ratio = Math.min(devicePixelRatio || 1, 1.3, 1120 / Math.max(width, height));
    const w = Math.round(width * ratio), h = Math.round(height * ratio);
    if (bridge.width !== w || bridge.height !== h) {
      bridge.width = w;
      bridge.height = h;
    }
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);
    const button = gate.getBoundingClientRect();
    const start = { x: button.left + 25, y: height * clamp((button.top + button.height / 2) / height) };
    const end = projectEntrance?.(width, height) || { x: width * (width / height < .8 ? .43 : .50), y: height * .77 };
    const rise = Math.min(width * .28, height * .22);
    const controlA = { x: start.x + Math.min(width * .30, 190), y: start.y - rise * 1.34 };
    const controlB = { x: end.x - Math.min(width * .42, 300), y: end.y - rise * .93 };
    const point = t => {
      const u = 1 - t;
      return {
        x: u ** 3 * start.x + 3 * u ** 2 * t * controlA.x + 3 * u * t ** 2 * controlB.x + t ** 3 * end.x,
        y: u ** 3 * start.y + 3 * u ** 2 * t * controlA.y + 3 * u * t ** 2 * controlB.y + t ** 3 * end.y
      };
    };
    const reach = ease(.055, .865, time);
    const head = point(opening ? reach : 1 - reach);
    const tail = Math.max(0, reach - .42);
    const alpha = ease(.015, .155, time) * (1 - ease(.79, 1, time));
    const haloSize = Math.min(width * .33, 144);
    const halo = context.createRadialGradient(head.x, head.y, 0, head.x, head.y, haloSize);
    halo.addColorStop(0, `rgba(255,177,72,${alpha * .20})`);
    halo.addColorStop(.2, `rgba(255,156,59,${alpha * .095})`);
    halo.addColorStop(1, 'rgba(255,156,59,0)');
    context.fillStyle = halo;
    context.fillRect(head.x - haloSize, head.y - haloSize, haloSize * 2, haloSize * 2);

    context.lineCap = 'round';
    const count = 33;
    for (let i = 0; i < count; i++) {
      const a = tail + (reach - tail) * i / count;
      const b = tail + (reach - tail) * (i + 1) / count;
      const p = point(opening ? a : 1 - a);
      const q = point(opening ? b : 1 - b);
      const strength = ((i + 1) / count) ** 1.7 * alpha;
      context.beginPath();
      context.moveTo(p.x, p.y);
      context.lineTo(q.x, q.y);
      context.strokeStyle = `rgba(246,157,60,${strength * .16})`;
      context.lineWidth = 8;
      context.stroke();
      context.strokeStyle = `rgba(255,226,158,${strength * .94})`;
      context.lineWidth = 1.5 + strength * .65;
      context.stroke();
    }
    for (let i = 1; i <= 24; i++) {
      const drift = ((i * .618) % 1) * .38;
      if (drift >= reach) continue;
      const p = point(opening ? reach - drift : 1 - reach + drift);
      const spread = drift * Math.min(width * .20, 91);
      const opacity = alpha * (1 - drift / .39) * (.36 + (i % 5) * .13);
      context.fillStyle = `rgba(255,211,135,${opacity})`;
      context.beginPath();
      context.arc(p.x + Math.sin(i * 3.44) * spread, p.y + Math.cos(i * 5.55) * spread - drift * 28, .5 + (i % 4) * .31, 0, Math.PI * 2);
      context.fill();
    }
    context.fillStyle = `rgba(255,238,193,${alpha})`;
    context.beginPath();
    context.arc(head.x, head.y, 2.2, 0, Math.PI * 2);
    context.fill();
  }

  async function crossScenes(opening, finish) {
    const motion = !reduced.matches;
    const duration = motion ? (opening ? 1540 : 940) : 220;
    const timing = { duration, fill: 'both' };
    const stops = opening ? [0, 1] : [1, 0];
    const crossfade = motion ? (opening ? [
      { opacity: 0, offset: 0 }, { opacity: 0, offset: .17, easing: 'cubic-bezier(.38,.05,.24,1)' },
      { opacity: 1, offset: .89 }, { opacity: 1, offset: 1 }
    ] : [
      { opacity: 1, offset: 0, easing: 'cubic-bezier(.33,.03,.27,1)' },
      { opacity: 0, offset: .89 }, { opacity: 0, offset: 1 }
    ]) : stops.map(opacity => ({ opacity }));
    crossing = chapter.animate(crossfade, timing);
    const effects = [crossing];
    let threadFrame = 0;
    if (motion) {
      const push = { transform: 'scale(1.045)' };
      const rest = { transform: 'none' };
      const drift = { transform: 'scale(1.065)' };
      effects.push(scene.animate(opening ? [rest, push] : [push, rest], { ...timing, easing: 'ease-in-out' }));
      effects.push(stage.animate(opening ? [drift, rest] : [rest, drift], { ...timing, easing: 'ease-out' }));
      effects.push(gardenContent.animate(opening ? [
        { opacity: 1 }, { opacity: .95, offset: .15 }, { opacity: 0, offset: .59 }, { opacity: 0 }
      ] : [
        { opacity: 0 }, { opacity: 0, offset: .31 }, { opacity: 1 }
      ], timing));
      const enterChrome = [{ opacity: 0, offset: 0 }, { opacity: 0, offset: .69 }, { opacity: 1, offset: 1 }];
      effects.push(navigation.animate(opening ? enterChrome : [{ opacity: 1 }, { opacity: 0, offset: .33 }, { opacity: 0 }], timing));
      if (opening) effects.push(intro.animate(enterChrome, timing));
      const context = bridge.getContext('2d');
      if (context) {
        bridge.hidden = false;
        let projectEntrance;
        cityModule?.then(module => { projectEntrance = module.entranceThreadPoint; }).catch(() => {});
        const timeline = crossing;
        const trace = () => {
          paintThread(context, clamp((timeline.currentTime || 0) / duration), opening, projectEntrance);
          threadFrame = requestAnimationFrame(trace);
        };
        threadFrame = requestAnimationFrame(trace);
      }
    }
    await crossing.finished;
    cancelAnimationFrame(threadFrame);
    bridge.hidden = true;
    finish();
    for (const effect of effects) effect.cancel();
    crossing = null;
  }

  gate.addEventListener('click', () => {
    if (crossing || gate.hidden || !chapter.hidden || document.querySelector('dialog[open]')) return;
    windowTop = window.scrollY;
    gardenTop = garden.scrollTop;
    scene.inert = true;
    chapter.hidden = false;
    approach.hidden = true;
    setMode('poster');
    chapter.classList.add('is-crossing');
    scroller.scrollTop = previousTravel = currentPosition = displayedPosition = motionTarget = motionElapsed = lastPaint = 0;
    intro.style.opacity = 1;
    resize();
    if (!reduced.matches && location.protocol !== 'file:') loadCity().catch(() => {});
    crossScenes(true, () => {
      scene.hidden = true;
      chapter.classList.remove('is-crossing');
      chapter.inert = false;
      scroller.focus({ preventScroll: true });
      // Keep the verified entrance still on screen while WebGL starts.
      requestAnimationFrame(() => {
        if (!chapter.hidden && !chapter.inert) choosePresentation();
      });
    });
  });

  document.querySelector('#chapterReturn').addEventListener('click', () => {
    if (crossing || chapter.hidden) return;
    ++visit;
    approach.hidden = true;
    chapter.inert = true;
    chapter.classList.add('is-crossing');
    scene.hidden = false;
    garden.scrollTop = gardenTop;
    window.scrollTo({ top: windowTop, behavior: 'instant' });
    crossScenes(false, () => {
      cancelAnimationFrame(frame);
      frame = 0;
      chapter.hidden = true;
      chapter.classList.remove('is-crossing');
      scene.inert = false;
      window.dispatchEvent(new CustomEvent('anniversary:garden-return'));
      gate.focus({ preventScroll: true });
    });
  });

  function openRooftop(showPlanner = false) {
    displayedPosition = motionTarget = currentPosition = 1;
    scroller.scrollTop = scroller.scrollHeight - scroller.clientHeight;
    if (rendererReady && chapter.dataset.mode === 'flight') renderer.draw(1, stage.clientWidth, stage.clientHeight);
    chapter.classList.add('is-rooftop');
    approach.hidden = true;
    flightSecrets.hide();
    scroller.inert = true;
    rooftop.start(showPlanner);
  }

  approach.addEventListener('click', () => {
    if (approach.hidden || chapter.inert || rooftop.running) return;
    openRooftop();
  });

  function returnToFlight() {
    rooftop.stop();
    cancelAnimationFrame(frame);
    frame = 0;
    lastCityPosition = undefined;
    chapter.classList.remove('is-rooftop', 'has-roof-world');
    scroller.inert = false;
    previousTravel = scroller.scrollHeight - scroller.clientHeight;
    scroller.scrollTop = previousTravel;
    displayedPosition = motionTarget = currentPosition = 1;
    const needsStills = reduced.matches || contextLost || location.protocol === 'file:';
    if (needsStills !== (chapter.dataset.mode === 'stills')) choosePresentation();
    draw();
    if (approach.hidden) scroller.focus({ preventScroll: true }); else approach.focus({ preventScroll: true });
  }

  scroller.addEventListener('scroll', requestDraw, { passive: true });
  new ResizeObserver(resize).observe(scroller);
  reduced.addEventListener('change', () => {
    if (reduced.matches) crossing?.finish();
    if (rooftop.running) requestDraw();
    else if (!chapter.hidden && !chapter.inert) choosePresentation();
  });
  document.addEventListener('visibilitychange', () => {
    cancelAnimationFrame(frame);
    frame = 0;
    rooftop.pause();
    requestDraw();
  });
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    contextLost = true;
    renderer = null;
    rendererReady = false;
    if (rooftop.running) requestDraw();
    else if (!chapter.hidden && !chapter.inert) choosePresentation();
  });
  canvas.addEventListener('webglcontextrestored', () => {
    contextLost = false;
    if (rooftop.running) prepareRenderer().then(requestDraw, requestDraw);
    else if (!chapter.hidden && !chapter.inert) choosePresentation();
  });

  const localPreview = ['127.0.0.1', 'localhost', '[::1]'].includes(location.hostname);
  const previewScreen = new URLSearchParams(location.search).get('screen');
  if (localPreview && ['3', '4', '5'].includes(previewScreen)) {
    windowTop = window.scrollY;
    gardenTop = garden.scrollTop;
    scene.hidden = scene.inert = true;
    chapter.hidden = chapter.inert = false;
    setMode('stills');
    resize();
    if (previewScreen === '4' || previewScreen === '5') {
      openRooftop(previewScreen === '5');
      prepareRenderer().then(requestDraw, requestDraw);
    } else {
      scroller.focus({ preventScroll: true });
      choosePresentation();
    }
  }
})();

(() => {
  'use strict';

  const scene = document.querySelector('#scene');
  const panel = document.querySelector('#transition');
  const effects = panel.querySelector('.garden-fx');
  const counter = panel.querySelector('#gardenCount');
  const discoveries = panel.querySelector('.garden-discoveries');
  const lantern = discoveries.querySelector('.garden-lantern');
  const moth = discoveries.querySelector('.garden-moth');
  const join = panel.querySelector('.garden-join');
  const memory = document.querySelector('#gardenMemory');
  const episode = memory.querySelector('.memory-episode');
  const finale = memory.querySelector('.memory-finale');
  const title = memory.querySelector('#memoryTitle');
  const source = memory.querySelector('.memory-source');
  const hint = memory.querySelector('.memory-hint');
  const caption = memory.querySelector('.memory-caption');
  const photo = memory.querySelector('.memory-photo');
  const scenery = memory.querySelector('.memory-scenery img');
  const litPhoto = memory.querySelector('.memory-lit-photo');
  const prop = memory.querySelector('.memory-side-prop');
  const spots = memory.querySelector('.memory-spots');
  const spotButtons = [...spots.querySelectorAll('button')];
  const focusControls = memory.querySelector('.memory-focus');
  const focus = memory.querySelector('#memoryFocus');
  const develop = memory.querySelector('.memory-develop');
  const unfold = memory.querySelector('.memory-unfold');
  const close = memory.querySelector('.memory-close');
  const chapterJoin = memory.querySelector('.memory-finale-button');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const chapters = {
    lantern: {
      source: 'Кадр из коробки «На колёсах»', title: 'Свет в парке', photo: '29', alt: 'Со скейтом в солнечном парке',
      hint: 'Посвети на три огонька, чтобы вернуть снимку цвет.',
      caption: 'На фото ты держишь скейт и подставляешь лицо солнцу. Я бы сейчас с удовольствием вернулся в тот парк, сел рядом с тобой на траву и остался до вечера.'
    },
    moth: {
      source: 'Кадр из коробки «Ты и я»', title: 'Смех в кадре', photo: '03', alt: 'Улыбка и поцелуй в щёку',
      hint: 'Подвинь ползунок к светлой полосе, чтобы проявить снимок.',
      caption: 'Мы так близко, что оба едва влезли в кадр. Когда я на него смотрю, мне хочется снова обнять тебя и услышать, как ты смеёшься.'
    },
    letter: {
      source: 'Кадр из коробки «Цветы и огни»', title: 'Письмо из того вечера', photo: '20', alt: 'С букетом на вечерней улице',
      hint: 'Под сургучом лежит один снимок и несколько слов о нём.',
      caption: 'Я до сих пор любуюсь тем, как ты держишь букет. И всякий раз, проходя мимо цветочного, думаю о том, какие цветы подарить тебе в следующий раз.'
    }
  };
  const found = new Set();
  const lit = new Set();
  let flight, current, originButton, finishedHere, sealOpen = false;

  const fireflies = panel.querySelector('.garden-fireflies');
  const fireflyPositions = [[6, 24], [12, 57], [18, 78], [31, 37], [37, 84], [57, 48], [65, 86], [76, 69], [84, 39], [89, 57], [94, 82], [97, 21]];
  fireflies.append(...fireflyPositions.map(([x, y], index) => {
    const fly = document.createElement('i');
    fly.className = 'firefly';
    fly.style.cssText = `left:${x}%;top:${y}%;--duration:${5 + (index % 5) * .9}s;--delay:${index * -.63}s`;
    return fly;
  }));

  function center(element) {
    const box = element.getBoundingClientRect();
    const surface = effects.getBoundingClientRect();
    return { x: box.left - surface.left + box.width / 2, y: box.top - surface.top + box.height / 2 };
  }

  function mote(start, end, delay, duration) {
    const particle = document.createElement('i');
    particle.className = 'garden-mote';
    particle.style.cssText = `--start-x:${start.x}px;--start-y:${start.y}px;--end-x:${end.x}px;--end-y:${end.y}px;--mote-size:${2 + Math.random() * 3}px;--mote-time:${duration}ms;--mote-delay:${delay}ms`;
    particle.addEventListener('animationend', () => particle.remove(), { once: true });
    effects.append(particle);
  }

  function releaseLights(point, amount) {
    if (reduced.matches) return;
    const { clientWidth: width, clientHeight: height } = effects;
    for (let index = 0; index < amount; index++) {
      const target = {
        x: width * (.06 + Math.random() * .88),
        y: Math.max(height * .1, point.y - (index % 6 + 1) * height * .085)
      };
      mote(point, target, index * 73, 1200 + Math.random() * 2100);
    }
  }

  function flyMoth() {
    if (reduced.matches || flight) return;
    const start = center(moth);
    const { clientWidth: width, clientHeight: height } = effects;
    const steps = [
      { ...start, angle: 0, at: 0 },
      { x: width * .73, y: height * .23, angle: -42, at: .19 },
      { x: width * .43, y: height * .41, angle: -64, at: .42 },
      { x: width * .22, y: height * .25, angle: -4, at: .64 },
      { x: width * .56, y: height * .13, angle: 26, at: .82 },
      { ...start, angle: 37, at: 1 }
    ];
    const duration = 3150;
    const sprite = document.createElement('span');
    sprite.className = 'garden-flight';
    sprite.append(moth.querySelector('.garden-token').cloneNode(true));
    effects.append(sprite);
    moth.classList.add('is-flying');
    const movement = sprite.animate(steps.map(({ x, y, angle, at }) => ({
      offset: at,
      transform: `translate(${x - 24}px, ${y - 17}px) rotate(${angle}deg)`,
      easing: 'cubic-bezier(.32,.15,.62,.93)'
    })), { duration });
    flight = movement;

    steps.slice(1).forEach((end, index) => {
      const from = steps[index];
      for (let part = 1; part <= 4; part++) {
        const fraction = part / 5;
        const point = { x: from.x + (end.x - from.x) * fraction, y: from.y + (end.y - from.y) * fraction };
        mote(point, { x: point.x + 13, y: point.y + 22 }, (from.at + (end.at - from.at) * fraction) * duration, 1250);
      }
    });

    movement.finished.catch(() => {}).then(() => {
      sprite.remove();
      moth.classList.remove('is-flying');
      flight = null;
    });
  }

  function complete() {
    if (found.has(current)) return;
    found.add(current);
    finishedHere = current;
    originButton.classList.add('is-found');
    counter.querySelector('b').textContent = `${found.size} / 3`;
    if (current === 'lantern') scene.classList.add('garden-lit');
    if (found.size === 3) {
      scene.classList.add('garden-complete');
      join.hidden = false;
    }
    window.dispatchEvent(new CustomEvent('anniversary:progress', { detail: { group: 'memories', count: found.size } }));
    renderEpisode();
    caption.tabIndex = -1;
    caption.focus();
  }

  function updateFocus() {
    const distance = Math.abs(Number(focus.value) - 68);
    const ready = distance <= 9;
    memory.style.setProperty('--defocus', `${Math.max(0, distance - 8) * .28}px`);
    memory.classList.toggle('is-focused', ready);
    develop.disabled = !ready;
    const message = ready ? 'Кадр в фокусе. Можно проявлять.' : chapters.moth.hint;
    if (hint.textContent !== message) hint.textContent = message;
  }

  function renderEpisode() {
    const restored = found.has(current);
    memory.classList.toggle('is-restored', restored);
    memory.classList.toggle('seal-open', current === 'letter' && sealOpen);
    memory.classList.remove('is-focused');
    spots.hidden = restored || current !== 'lantern';
    focusControls.hidden = restored || current !== 'moth';
    unfold.hidden = restored || current !== 'letter';
    caption.hidden = !restored;
    chapterJoin.hidden = found.size < 3;
    hint.textContent = restored ? '' : chapters[current].hint;
    if (current === 'lantern' && lit.size && !restored) hint.textContent = `Подсвечено ${lit.size} из 3 деталей.`;
    if (!focusControls.hidden) updateFocus();
    if (current === 'letter' && sealOpen && !restored) hint.textContent = 'Внутри — кадр с букетом. Вместе с ним сохранились эти слова.';
    unfold.textContent = sealOpen ? 'Развернуть письмо' : 'Снять печать';
  }

  function showEpisode(button) {
    current = button.dataset.secret;
    originButton = button;
    const chapter = chapters[current];
    memory.dataset.memory = current;
    memory.setAttribute('aria-labelledby', 'memoryTitle');
    title.textContent = chapter.title;
    source.textContent = chapter.source;
    caption.textContent = chapter.caption;
    photo.src = `assets/memories/${chapter.photo}.webp`;
    scenery.src = photo.src;
    photo.alt = chapter.alt;
    litPhoto.src = photo.src;
    prop.src = `assets/gifts/${current}.webp`;
    episode.hidden = false;
    finale.hidden = true;
    renderEpisode();
    memory.showModal();
    memory.scrollTop = 0;
  }

  function showFinale() {
    if (found.size !== 3) return;
    memory.dataset.memory = 'finale';
    memory.classList.remove('is-restored', 'seal-open', 'is-focused');
    memory.setAttribute('aria-labelledby', 'memoryFinaleTitle');
    episode.hidden = true;
    finale.hidden = false;
    if (!memory.open) {
      originButton = join;
      memory.showModal();
    }
    memory.scrollTop = 0;
    close.focus({ preventScroll: true });
  }

  for (const button of discoveries.querySelectorAll('button')) {
    button.addEventListener('click', () => showEpisode(button));
  }
  spotButtons.forEach((button, index) => {
    button.addEventListener('click', () => {
      if (lit.has(index)) return;
      lit.add(index);
      button.classList.add('is-lit');
      const x = button.style.getPropertyValue('--spot-x');
      const y = button.style.getPropertyValue('--spot-y');
      litPhoto.style.setProperty(`--light-${index + 1}`, `radial-gradient(ellipse 42% 29% at ${x} ${y}, #000 24%, transparent 100%)`);
      if (lit.size === spotButtons.length) complete();
      else renderEpisode();
    });
  });
  focus.addEventListener('input', updateFocus);
  develop.addEventListener('click', complete);
  unfold.addEventListener('click', () => {
    if (sealOpen) complete();
    else {
      sealOpen = true;
      renderEpisode();
    }
  });
  join.addEventListener('click', showFinale);
  chapterJoin.addEventListener('click', showFinale);
  close.addEventListener('click', () => memory.close());
  memory.addEventListener('click', event => {
    if (event.target === memory) memory.close();
  });
  memory.addEventListener('close', () => {
    originButton.focus({ preventScroll: true });
    if (finishedHere === 'lantern') releaseLights(center(lantern), 21);
    if (finishedHere === 'moth') flyMoth();
    if (finishedHere && found.size === 3) releaseLights(center(originButton), 22);
    finishedHere = null;
  });

  function clearEffects() {
    flight?.cancel();
    effects.replaceChildren();
  }
  document.querySelector('#journeyBack').addEventListener('click', clearEffects);
  reduced.addEventListener('change', clearEffects);
})();

(() => {
  'use strict';

  const gifts = [
    {
      id: 'skate', title: 'На колёсах', prop: 'Скейт',
      note: 'С тобой всегда хочется пройти ещё один квартал.',
      letter: 'Люблю наши прогулки без маршрута. Потом мы возвращаемся домой, разуваемся в прихожей и всё ещё никак не можем наговориться.',
      photos: [
        [29, 'Со скейтом в солнечном парке', 'Как красиво ты подставила лицо солнцу.', 'contain'],
        [37, 'На прогулке среди заснеженных деревьев', 'Твоя улыбка посреди зимы.', 'contain'],
        [13, 'В вагоне метро', 'Даже в метро мне хорошо рядом с тобой.'],
        [39, 'Смех на солнечном склоне', 'Пересматриваю и снова смеюсь вместе с тобой.'],
        [16, 'На дорожке в парке', 'Вот бы снова весь день кататься вдвоём.'],
        [31, 'Вдвоём у стены из светлой плитки', 'Люблю, когда ты вот так рядом.'],
        [6, 'Вместе на ступеньках у кирпичной стены', 'Мне и на ступеньках с тобой уютно.'],
        [38, 'Зимний портрет в очках', 'Посмотри, как тебе идёт снег.'],
        [9, 'У эскалатора', 'Люблю ловить твой взгляд в толпе.'],
        [23, 'На станции', 'Ещё одна станция, ещё минута вдвоём.']
      ]
    },
    {
      id: 'camera', title: 'Ты и я', prop: 'Фотоаппарат',
      note: 'Люблю, как мы смеёмся даже посреди поцелуя.',
      letter: 'Люблю пересматривать наши смешные селфи, когда мы оба дома. Иногда одного взгляда друг на друга хватает, чтобы снова рассмеяться. С тобой мне так легко быть собой.',
      photos: [
        [3, 'Улыбка и поцелуй в щёку', 'До сих пор слышу твой смех на этом фото.'],
        [30, 'Вдвоём под осенними деревьями', 'Люблю, как ты на меня здесь смотришь.'],
        [1, 'Поцелуй за столом', 'Хочется снова сесть рядом и поцеловать тебя.'],
        [44, 'Шуточная поза с реквизитом у двери', 'Обожаю, когда ты так дурачишься.'],
        [7, 'Селфи вдвоём под деревьями', 'Так близко, что едва помещаемся в кадр.'],
        [40, 'Поцелуй в висок', 'Мой любимый способ сказать, что я рядом.'],
        [2, 'Вместе на прогулке', 'Самое любимое в прогулках — что мы вдвоём.'],
        [36, 'Поцелуй на солнце', 'Солнечный поцелуй, который хочется повторить.'],
        [10, 'Смешное селфи вдвоём', 'С тобой я и сам улыбаюсь во весь рот.'],
        [35, 'Гримасы на солнечном селфи', 'Я люблю нас и на самых смешных фото.']
      ]
    },
    {
      id: 'flowers', title: 'Цветы и огни', prop: 'Букет',
      note: 'Я бы с радостью прожил этот вечер с тобой ещё раз.',
      letter: 'Иногда по дороге домой хочется просто зайти за цветами для тебя. Я уже представляю, как ты улыбнёшься, увидев букет, а потом мы вместе найдём ему место.',
      photos: [
        [20, 'С букетом на вечерней улице', 'Мне всегда хочется подарить тебе ещё цветы.'],
        [34, 'Смеёмся вдвоём на вечерней улице', 'Вот бы снова так смеяться посреди улицы.'],
        [5, 'Объятия у светящейся набережной', 'Хочется подольше постоять вот так, обнявшись.'],
        [32, 'Ночной портрет крупным планом', 'Один из тех кадров, на которых я замираю.'],
        [8, 'Селфи на фоне городских огней', 'Весь город светится, а я смотрю на тебя.'],
        [41, 'Вместе за столиком в кафе', 'Люблю наши вечера за одним столиком.'],
        [43, 'Улыбка на фоне ночного неба', 'Мне хочется улыбнуться тебе даже через экран.'],
        [14, 'В магазине игрушек', 'Устроим ещё одну прогулку за мишкой?'],
        [33, 'Портрет с прядями на лице', 'Я бы убрал прядь с твоего лица и поцеловал тебя.'],
        [42, 'Поцелуй под вечерними огнями', 'Ещё один поцелуй, который я хочу запомнить.']
      ]
    }
  ];

  // Narrow overlapping faces let the hatbox keep its curved silhouette as it tips.
  const roundPanels = Array.from({ length: 28 }, (_, index) => {
    const angle = index * 360 / 28;
    const shade = .28 * (1 - Math.cos((angle + 44) * Math.PI / 180));
    return `<i class="round-panel" style="--angle:${angle}deg;--shade:${shade.toFixed(3)}"></i>`;
  }).join('');
  const shelf = document.querySelector('#giftShelf');
  const progress = document.querySelector('#giftProgress');
  const dialog = document.querySelector('#giftDialog');
  const theatre = dialog.querySelector('.gift-theatre');
  const sparks = theatre.querySelector('.gift-sparks');
  const scroller = dialog.querySelector('.board-scroll');
  const board = document.querySelector('#giftBoard');
  const boardTitle = document.querySelector('#boardTitle');
  const boardNote = document.querySelector('#boardNote');
  const boardClose = board.querySelector('.board-close');
  const boardLetter = board.querySelector('.board-letter');
  const letterCopy = boardLetter.querySelector('.board-letter-copy');
  const threads = board.querySelector('.photo-threads');
  const deck = board.querySelector('.photo-deck');
  const viewer = document.querySelector('#photoDialog');
  const fullPhoto = document.querySelector('#fullPhoto');
  const fullPhotoCaption = document.querySelector('#fullPhotoCaption');
  const photoCount = document.querySelector('#photoCount');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const opened = new Set();
  const tilts = [-5, 3, -3, 5, 4, -4, 3, -4];
  let activeGift, activeButton, activeCard, photoIndex, shot, sequence;

  function makeGift(gift) {
    const round = gift.id === 'flowers';
    const button = document.createElement('button');
    button.className = `gift-choice gift-${gift.id}`;
    button.type = 'button';
    button.setAttribute('aria-haspopup', 'dialog');
    button.innerHTML = `
      <span class="gift-art" aria-hidden="true">
        <span class="gift-aura"></span><span class="gift-plinth"></span>
        <span class="gift-model">
          <span class="gift-rig">
            <span class="gift-plane gift-floor"></span>
            <span class="gift-plane gift-inner-rim"></span>
            ${round ? roundPanels : '<span class="gift-plane gift-wall gift-wall-back"></span><span class="gift-plane gift-wall gift-wall-left"></span>'}
            <span class="gift-interior-light"></span>
            <span class="gift-lid"><span class="lid-top"></span>${round ? roundPanels : '<span class="lid-front"></span><span class="lid-side"></span>'}<span class="gift-bow"><i></i><i></i><i></i><i></i></span></span>
            <span class="gift-prop"><img src="assets/gifts/${gift.id}.webp" alt="" draggable="false"></span>
            ${round ? '<span class="hatbox-seal"><i></i></span>' : '<span class="gift-plane gift-wall gift-wall-right"></span><span class="gift-plane gift-wall gift-wall-front"><i class="gift-trim"></i><i class="gift-clasp"></i></span>'}
          </span>
        </span>
      </span>
      <span class="gift-label">${gift.title}</span>
      <span class="gift-instruction">Открыть <span class="sr-only">· ${gift.prop}</span></span>`;
    button.addEventListener('click', () => openGift(gift, button));
    return button;
  }

  function photoPath(number) {
    return `assets/memories/${String(number).padStart(2, '0')}.webp`;
  }

  function pinPhotos(gift) {
    deck.replaceChildren(...gift.photos.map(([number, description, , fit], index) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'photo-card';
      card.style.setProperty('--tilt', `${tilts[index % tilts.length]}deg`);
      card.style.setProperty('--pin-order', index);
      card.setAttribute('aria-label', `Увеличить фото. ${description}`);
      card.setAttribute('aria-haspopup', 'dialog');
      const photo = new Image();
      photo.src = photoPath(number);
      photo.alt = '';
      photo.decoding = 'async';
      if (fit) photo.dataset.fit = fit;
      card.append(photo);
      card.addEventListener('click', () => {
        activeCard = card;
        showPhoto(index);
        viewer.showModal();
      });
      return card;
    }));
  }

  function drawThreads() {
    if (!dialog.open || !deck.clientWidth) return;
    const pins = Array.from(deck.children, (card, index) => {
      const angle = tilts[index % tilts.length] * Math.PI / 180;
      const fromCenter = card.offsetHeight / 2 - 3;
      return {
        x: card.offsetLeft + card.offsetWidth / 2 + fromCenter * Math.sin(angle),
        y: card.offsetTop + card.offsetHeight / 2 - fromCenter * Math.cos(angle)
      };
    });
    const columns = getComputedStyle(deck).gridTemplateColumns.split(' ').length;
    const connections = [];
    for (let index = 1; index < pins.length; index++) {
      if (index % columns) connections.push([index - 1, index]);
      if (index >= columns) connections.push([index - columns, index]);
    }
    threads.replaceChildren(...connections.map(([a, b], index) => {
      const start = pins[a], end = pins[b];
      const dx = end.x - start.x, dy = end.y - start.y;
      const thread = document.createElement('i');
      thread.style.cssText = `left:${start.x}px;top:${start.y}px;width:${Math.hypot(dx, dy)}px;rotate:${Math.atan2(dy, dx)}rad;--thread-order:${index}`;
      return thread;
    }));
  }

  function burst() {
    const count = innerWidth < 700 ? 42 : 68;
    sparks.replaceChildren(...Array.from({ length: count }, (_, index) => {
      const mote = document.createElement('i');
      const direction = index / count * 2 * Math.PI;
      const spread = 38 + Math.random() * Math.min(innerWidth * .45, 400);
      mote.style.cssText = `--x:${Math.cos(direction) * spread}px;--y:${Math.sin(direction) * spread * .68 - 46}px;--spin:${index * 47}deg;--wait:${180 + Math.random() * 170}ms;--size:${2 + Math.random() * 6}px`;
      return mote;
    }));
  }

  function openGift(gift, button) {
    if (dialog.open) return;
    activeGift = gift;
    activeButton = button;

    boardTitle.textContent = gift.title;
    boardNote.textContent = gift.note;
    boardLetter.open = false;
    letterCopy.textContent = gift.letter;
    pinPhotos(gift);
    const source = button.querySelector('.gift-model');
    const origin = source.getBoundingClientRect();
    const pose = getComputedStyle(source.querySelector('.gift-rig')).transform;
    dialog.className = `gift-dialog gift-${gift.id}`;
    dialog.showModal();
    scroller.scrollTop = 0;
    drawThreads();

    if (reduced.matches) {
      revealBoard();
      return;
    }

    const target = board.getBoundingClientRect();
    const originX = origin.left + origin.width / 2;
    const originY = origin.top + origin.height * .65;
    const targetX = target.left + target.width / 2;
    const targetY = Math.min(target.top + target.height * .48, innerHeight * .58);
    dialog.style.setProperty('--origin-x', `${originX}px`);
    dialog.style.setProperty('--origin-y', `${originY}px`);
    shot = source.cloneNode(true);
    shot.classList.add('gift-shot');
    shot.style.cssText = `--box:${origin.width}px;--rig-start:${pose};left:${origin.left}px;top:${origin.top}px`;
    theatre.append(shot);
    button.classList.add('is-performing');
    burst();
    dialog.classList.add('is-opening');
    sequence = shot.animate([
      { offset: 0, transform: 'none', opacity: 1, easing: 'cubic-bezier(.4,0,.2,1)' },
      { offset: .32, transform: 'translateY(-8px) scale(1.07)', opacity: 1, easing: 'cubic-bezier(.5,0,.19,1)' },
      { offset: .75, transform: `translate(${targetX - originX}px,${targetY - originY}px) scale(${Math.min(target.width / origin.width, 5) * .88})`, opacity: 1 },
      { offset: 1, transform: `translate(${targetX - originX}px,${targetY - originY}px) scale(${Math.min(target.width / origin.width, 5)})`, opacity: 0 }
    ], { duration: 1560, fill: 'both' });
    const current = sequence;
    current.finished.then(() => {
      if (sequence !== current || !dialog.open) return;
      revealBoard();
      shot.remove();
      shot = null;
      sequence = null;
      sparks.replaceChildren();
      dialog.classList.remove('is-opening');
      button.classList.remove('is-performing');
    }).catch(() => {});
    setTimeout(() => {
      if (sequence === current && dialog.open) revealBoard();
    }, 1100);
  }

  function revealBoard() {
    if (!board.inert) return;
    dialog.classList.add('board-visible');
    board.inert = false;
    if (!opened.has(activeGift.id)) {
      opened.add(activeGift.id);
      progress.querySelector('b').textContent = `Открыто ${opened.size} из 3`;
      progress.querySelectorAll('i').forEach((dot, index) => {
        dot.classList.toggle('is-filled', index < opened.size);
      });
      activeButton.classList.add('was-opened');
      activeButton.querySelector('.gift-instruction').firstChild.textContent = 'Снова открыть ';
      window.dispatchEvent(new CustomEvent('anniversary:progress', { detail: { group: 'gifts', count: opened.size } }));
    }
    drawThreads();
    boardClose.focus({ preventScroll: true });
  }

  function showPhoto(index) {
    const photos = activeGift.photos;
    photoIndex = (index + photos.length) % photos.length;
    const [number, description, caption] = photos[photoIndex];
    fullPhoto.src = photoPath(number);
    fullPhoto.alt = description;
    fullPhotoCaption.textContent = caption;
    photoCount.textContent = `${photoIndex + 1} / ${photos.length}`;
  }

  boardClose.addEventListener('click', () => dialog.close());
  boardLetter.addEventListener('toggle', () => {
    if (boardLetter.open && dialog.open) letterCopy.scrollIntoView({ block: 'nearest', behavior: 'instant' });
  });
  dialog.addEventListener('click', event => {
    if (event.target === scroller || event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => {
    sequence?.cancel();
    shot?.remove();
    sparks.replaceChildren();
    shot = null;
    sequence = null;
    board.inert = true;
    dialog.classList.remove('is-opening', 'board-visible');
    activeButton.classList.remove('is-performing');
    activeButton.focus({ preventScroll: true });
  });

  viewer.querySelector('.photo-close').addEventListener('click', () => viewer.close());
  viewer.querySelector('.photo-prev').addEventListener('click', () => showPhoto(photoIndex - 1));
  viewer.querySelector('.photo-next').addEventListener('click', () => showPhoto(photoIndex + 1));
  viewer.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    showPhoto(photoIndex + (event.key === 'ArrowRight' ? 1 : -1));
  });
  viewer.addEventListener('click', event => {
    if (event.target === viewer || event.target.classList.contains('photo-viewer')) viewer.close();
  });
  viewer.addEventListener('close', () => activeCard?.focus({ preventScroll: true }));
  new ResizeObserver(drawThreads).observe(deck);
  shelf.append(...gifts.map(makeGift));
})();

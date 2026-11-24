(() => {
  'use strict';

  const storageKey = 'anniversary-date-plan';
  const keys = ['place', 'activity', 'time', 'date'];
  const shortDate = new Intl.DateTimeFormat('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
  const fullDate = new Intl.DateTimeFormat('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  function today() {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${now.getFullYear()}-${month}-${day}`;
  }

  function readDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value < today()) return null;
    const date = new Date(`${value}T12:00:00`);
    const [year, month, day] = value.split('-').map(Number);
    return date.getFullYear() === year && date.getMonth() + 1 === month && date.getDate() === day ? date : null;
  }

  window.createDatePlan = (section, reduced, { back, paintBear, wakeRoof }) => {
    const title = section.querySelector('h2');
    const stage = section.querySelector('.date-stage');
    const form = section.querySelector('form');
    const dateInput = form.elements.date;
    const dateChosen = section.querySelector('.date-chosen');
    const confirm = section.querySelector('.date-confirm');
    const summary = section.querySelector('.date-summary');
    const summaryTitle = summary.querySelector('h3');
    const actions = section.querySelector('.date-actions');
    const share = actions.querySelector('.date-share');
    const copy = section.querySelector('.date-copy');
    const copyText = copy.querySelector('textarea');
    const status = section.querySelector('.date-status');
    const description = section.querySelector('figcaption');
    const answers = Array.from(summary.querySelectorAll('dd'), output => ({
      output, key: output.dataset.answer, label: output.previousElementSibling.textContent
    }));
    const radios = Array.from(form.querySelectorAll('input[type=radio]'));
    const art = window.createDateScenes(stage.querySelector('.date-art'), reduced, paintBear);
    let confirmed = false;
    let opening = 0;
    let sharing = false;
    let shareRevision = 0;
    let sceneKey;

    function selected() {
      return Object.fromEntries(keys.map(key => [key, form.elements[key].value]));
    }

    function restore() {
      try {
        const saved = JSON.parse(localStorage.getItem(storageKey));
        if (!saved) return;
        for (const radio of radios) radio.checked = radio.value === saved[radio.name];
        dateInput.value = readDate(saved.date) ? saved.date : '';
        const choice = selected();
        confirmed = keys.every(key => Boolean(choice[key]));
      } catch {
        // The form remains usable with storage disabled or old data removed.
      }
    }

    function update(showRoof = false) {
      const choice = selected();
      dateInput.min = today();
      const date = readDate(choice.date);
      const complete = Boolean(date && choice.place && choice.activity && choice.time);
      const short = date ? shortDate.format(date) : '';
      dateChosen.textContent = short || 'Выбери сегодня или более позднюю дату.';
      dateChosen.hidden = !choice.date;
      confirm.disabled = !complete;
      summary.hidden = !complete;
      if (!complete) confirmed = false;
      form.hidden = confirmed;
      actions.hidden = !confirmed;
      if (complete) {
        for (const { key, output } of answers) {
          output.textContent = key === 'date' ? fullDate.format(date) :
            radios.find(radio => radio.name === key && radio.checked).nextElementSibling.textContent;
        }
      }
      const scene = !showRoof && (choice.place || choice.activity) ?
        `${choice.place || 'out'}-${choice.activity || 'drinks'}` : '';
      const time = showRoof ? '' : choice.time;
      stage.dataset.roofTime = scene ? '' : time;
      const text = art.show(scene, time, !showRoof && complete ? short : '', choice);
      if (description.textContent !== text) description.textContent = text;
      if (!scene && sceneKey) wakeRoof();
      sceneKey = scene;
    }

    function resetShare() {
      shareRevision++;
      sharing = false;
      copy.hidden = true;
      status.textContent = '';
    }

    form.addEventListener('input', () => {
      cancelAnimationFrame(opening);
      resetShare();
      update();
    });
    form.addEventListener('submit', event => {
      event.preventDefault();
      update();
      if (confirm.disabled) return;
      confirmed = true;
      let saved = true;
      try {
        localStorage.setItem(storageKey, JSON.stringify(selected()));
      } catch {
        saved = false;
      }
      update();
      if (!saved) status.textContent = 'Хранилище браузера недоступно. План можно отправить.';
      summaryTitle.focus();
    });

    actions.querySelector('.date-edit').addEventListener('click', () => {
      confirmed = false;
      resetShare();
      update();
      (radios.find(radio => radio.name === 'place' && radio.checked) || radios[0]).focus();
    });

    share.addEventListener('click', async () => {
      if (!confirmed || sharing) return;
      sharing = true;
      const revision = ++shareRevision;
      const text = [summaryTitle.textContent, ...answers.map(({ label, output }) => `${label}: ${output.textContent}`)].join('\n');
      const payload = { title: summaryTitle.textContent, text };
      copy.hidden = true;
      status.textContent = '';
      try {
        if (navigator.share && (!navigator.canShare || navigator.canShare(payload))) {
          await navigator.share(payload);
          return;
        }
      } catch (error) {
        if (error.name === 'AbortError') return;
      } finally {
        if (revision === shareRevision) sharing = false;
      }
      if (revision !== shareRevision) return;
      sharing = true;
      try {
        await navigator.clipboard.writeText(text);
        if (revision === shareRevision) status.textContent = 'План скопирован.';
      } catch {
        if (revision !== shareRevision) return;
        copyText.value = text;
        copy.hidden = false;
        copyText.focus();
        copyText.select();
      } finally {
        if (revision === shareRevision) sharing = false;
      }
    });

    stage.querySelector('.date-back').addEventListener('click', back);
    restore();
    return {
      stage,
      get showsRoof() { return !sceneKey; },
      open() {
        section.hidden = section.inert = false;
        section.scrollTop = 0;
        update(true);
        title.focus({ preventScroll: true });
        opening = requestAnimationFrame(() => { opening = requestAnimationFrame(() => update()); });
      },
      close() {
        cancelAnimationFrame(opening);
        resetShare();
        art.show('', '', '');
        sceneKey = '';
        section.hidden = section.inert = true;
      },
      preload: art.preload,
      redraw: art.redraw
    };
  };
})();

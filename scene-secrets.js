(() => {
  'use strict';

  window.projectCityAnchor = (view, point, width, height) => {
    const offset = point.map((value, i) => value - view.position[i]);
    const dot = vector => offset.reduce((sum, value, i) => sum + value * vector[i], 0);
    const depth = dot(view.forward);
    if (depth < .35) return null;
    return [width * .5 * (1 + dot(view.right) * view.projection[0] / depth),
      height * .5 * (1 - dot(view.up) * view.projection[1] / depth)];
  };

  window.createSceneSecrets = (layer, items, reduced, wake) => {
    const canvas = layer.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const tally = layer.querySelector('.secret-tally span');
    const status = layer.querySelector('[role="status"]');
    const found = new Set();
    const active = new Map();
    let painted = false;

    const markers = items.map(item => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'secret-marker';
      button.dataset.kind = item.kind;
      button.hidden = true;
      button.setAttribute('aria-label', item.label);
      layer.append(button);

      let heldPointer;
      let origin;
      const capture = event => {
        if (!event.isPrimary || event.button !== 0) return;
        heldPointer = event.pointerId;
        button.setPointerCapture(event.pointerId);
      };
      button.addEventListener('pointerdown', capture);
      button.addEventListener('lostpointercapture', () => { heldPointer = undefined; });

      button.addEventListener('click', () => {
        if (button.hidden || !origin) return;
        active.set(item.kind, { origin, started: performance.now() });
        found.add(item.kind);
        button.dataset.found = '';
        tally.textContent = `Секреты ${found.size}/${items.length}`;
        status.textContent = `${item.announcement} ${tally.textContent}.`;
        wake();
      });

      return (location, width, height) => {
        if (heldPointer !== undefined) return;
        origin = location?.point;
        const point = location?.show && location.project(origin);
        const visible = point && point[0] > 9 && point[0] < width - 9 && point[1] > 14 && point[1] < height - 26;
        button.hidden = !visible;
        if (!visible) return;
        const x = Math.max(27, Math.min(width - 27, Math.round(point[0])));
        const y = Math.round(point[1]);
        const transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
        if (button.style.transform !== transform) button.style.transform = transform;
      };
    });

    return {
      age(kind, time) {
        const effect = active.get(kind);
        return effect ? Math.max(0, (time - effect.started) / 1000) : Infinity;
      },
      found(kind) { return found.has(kind); },
      render(locations, width, height, time) {
        layer.hidden = false;
        markers.forEach((place, i) => place(locations[i], width, height));
        if (!active.size && !painted) return false;
        const ratio = Math.min(devicePixelRatio || 1, 1.5, 1500 / Math.max(width, height));
        const w = Math.round(width * ratio), h = Math.round(height * ratio);
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
        }
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        ctx.clearRect(0, 0, width, height);
        painted = false;
        items.forEach(({ kind }, i) => {
          const current = active.get(kind);
          if (!current) return;
          const age = Math.max(0, (time - current.started) / 1000);
          const duration = reduced.matches ? 2.6 : window.sceneSecretDuration(kind);
          if (age >= duration) {
            active.delete(kind);
            return;
          }
          const project = locations[i]?.project;
          if (project) {
            window.paintSceneSecret(ctx, kind, current.origin, project, age, duration, reduced.matches);
            painted = true;
          }
        });
        return active.size > 0;
      },
      hide() {
        if (layer.hidden) return;
        layer.hidden = true;
        active.clear();
        status.textContent = '';
      },
    };
  };
})();

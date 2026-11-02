(() => {
  const fields = [...document.querySelectorAll('input[type="date"]')];
  if (!fields.length) return;

  const lang = () => document.documentElement.lang === 'en' ? 'en' : 'es';
  const t = (es, en) => lang() === 'en' ? en : es;
  const keyOf = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = keyOf(today);
  const monthStart = date => new Date(date.getFullYear(), date.getMonth(), 1);
  const dateOf = key => {
    const [year, month, day] = key.split('-').map(Number);
    return new Date(year, month - 1, day);
  };
  const blocks = [];
  let openField = null;
  let openButton = null;
  let shownMonth = monthStart(today);
  let focusKey = '';

  fields.forEach((field, index) => {
    const hidden = document.createElement('input');
    hidden.type = 'hidden';
    hidden.name = field.name;
    hidden.value = field.value;
    hidden.min = field.min;
    hidden.dataset.dateValue = 'true';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'date-display';
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-required', 'true');
    button.setAttribute('aria-label', field.getAttribute('aria-label') || field.closest('label')?.innerText.trim() || t('Elegir fecha', 'Choose a date'));
    button.dataset.dateRole = field.name;
    button.innerHTML = `<span class="date-display-value">${field.value ? labelOf(field.value) : t('Seleccionar fecha', 'Select a date')}</span><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M7.5 3.5v3M16.5 3.5v3M4 9.5h16"/></svg>`;

    const wrapper = document.createElement('span');
    wrapper.className = 'date-field';
    wrapper.append(button, hidden);
    field.replaceWith(wrapper);
    button.addEventListener('click', () => open(hidden, button));
    hidden.addEventListener('change', () => {
      syncDisplays();
      hidden.dispatchEvent(new Event('input', { bubbles: true }));
    });
  });

  const panel = document.createElement('div');
  panel.className = 'date-picker-popover';
  panel.id = 'date-picker-popover';
  panel.hidden = true;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'false');
  panel.setAttribute('aria-label', t('Selecciona las fechas de tu estadía', 'Choose your stay dates'));
  document.querySelectorAll('.date-display').forEach(button => button.setAttribute('aria-controls', panel.id));
  document.body.append(panel);

  function labelOf(key) {
    return new Intl.DateTimeFormat(lang() === 'en' ? 'en-US' : 'es-CO', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${key}T00:00:00Z`));
  }
  function syncDisplays() {
    document.querySelectorAll('input[data-date-value="true"]').forEach(value => {
      const display = value.closest('.date-field')?.querySelector('.date-display-value');
      if (display) display.textContent = value.value ? labelOf(value.value) : t('Seleccionar fecha', 'Select a date');
    });
  }
  function monthLabel(date) {
    const value = new Intl.DateTimeFormat(lang() === 'en' ? 'en-US' : 'es-CO', { month: 'long', year: 'numeric' }).format(date);
    return value.charAt(0).toLocaleUpperCase(lang() === 'en' ? 'en-US' : 'es-CO') + value.slice(1);
  }
  function sameMonth(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth(); }
  function isBlocked(key) { return blocks.some(block => key >= block.arrival && key < block.departure); }
  function rangeBlocked(start, end) { return blocks.some(block => start < block.departure && end > block.arrival); }
  function canChoose(key) {
    if (key < todayKey || isBlocked(key)) return false;
    if (openField.name === 'departure') {
      const arrival = openField.form.elements.arrival.value;
      if (arrival && (key <= arrival || rangeBlocked(arrival, key))) return false;
    }
    return true;
  }
  function getOtherValue(name) { return openField?.form.elements[name]?.value || ''; }
  function render() {
    if (!openField) return;
    const arrival = getOtherValue('arrival');
    const departure = getOtherValue('departure');
    const month = shownMonth;
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const offset = (first.getDay() + 6) % 7;
    const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const weekdays = lang() === 'es' ? ['L', 'M', 'X', 'J', 'V', 'S', 'D'] : ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const activeArrival = openField.name === 'arrival';
    const stepText = activeArrival ? t('Elige tu llegada', 'Choose check-in') : t('Elige tu salida', 'Choose check-out');
    panel.innerHTML = `<div class="date-picker-top"><div class="date-picker-steps"><span class="${arrival ? 'is-done' : activeArrival ? 'is-active' : ''}">${t('Llegada', 'Check-in')}</span><i aria-hidden="true"></i><span class="${departure ? 'is-done' : !activeArrival ? 'is-active' : ''}">${t('Salida', 'Check-out')}</span></div><button type="button" class="date-picker-close" aria-label="${t('Cerrar calendario', 'Close calendar')}">×</button></div><div class="date-picker-month"><button type="button" data-month="-1" aria-label="${t('Mes anterior', 'Previous month')}">‹</button><strong>${monthLabel(month)}</strong><button type="button" data-month="1" aria-label="${t('Mes siguiente', 'Next month')}">›</button></div><div class="date-picker-weekdays" aria-hidden="true">${weekdays.map(day => `<span>${day}</span>`).join('')}</div><div class="date-picker-grid" role="grid" aria-label="${monthLabel(month)}">${Array.from({ length: offset }, () => '<span class="date-picker-blank" aria-hidden="true"></span>').join('')}${Array.from({ length: count }, (_, index) => {
      const date = new Date(month.getFullYear(), month.getMonth(), index + 1);
      const key = keyOf(date);
      const selected = key === arrival || key === departure;
      const between = arrival && departure && key > arrival && key < departure;
      const unavailable = isBlocked(key) || (openField.name === 'departure' && arrival && (key <= arrival || rangeBlocked(arrival, key)));
      const disabled = key < todayKey || unavailable;
      const classes = ['date-picker-day', selected && 'is-selected', between && 'is-between', disabled && 'is-unavailable', key === todayKey && 'is-today'].filter(Boolean).join(' ');
      return `<button type="button" role="gridcell" class="${classes}" data-day="${key}" aria-label="${new Intl.DateTimeFormat(lang() === 'en' ? 'en-US' : 'es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${key}T00:00:00Z`))}" aria-pressed="${Boolean(selected || between)}" ${disabled ? 'disabled' : ''}>${index + 1}</button>`;
    }).join('')}</div><div class="date-picker-hint"><span class="date-picker-hint-dot"></span>${stepText}</div>`;
    panel.querySelector('.date-picker-close').addEventListener('click', close);
    panel.querySelectorAll('[data-month]').forEach(button => button.addEventListener('click', () => {
      shownMonth = new Date(shownMonth.getFullYear(), shownMonth.getMonth() + Number(button.dataset.month), 1);
      render(); position();
    }));
    panel.querySelectorAll('[data-day]').forEach(button => {
      button.addEventListener('click', () => choose(button.dataset.day));
      button.addEventListener('keydown', moveFocus);
    });
    const previous = panel.querySelector('[data-month="-1"]');
    const next = panel.querySelector('[data-month="1"]');
    previous.disabled = shownMonth <= monthStart(today);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() + 10, 1);
    next.disabled = shownMonth >= lastMonth;
    const firstDay = panel.querySelector('[data-day]:not(:disabled)');
    const preferred = panel.querySelector(`[data-day="${focusKey || (activeArrival ? arrival : departure) || todayKey}"]`);
    (preferred && !preferred.disabled ? preferred : firstDay)?.setAttribute('tabindex', '0');
    panel.querySelectorAll('[data-day]:not([tabindex])').forEach(button => button.tabIndex = -1);
  }
  function position() {
    if (!openButton || panel.hidden) return;
    const rect = openButton.getBoundingClientRect();
    const width = Math.min(360, window.innerWidth - 24);
    panel.style.width = `${width}px`;
    panel.style.left = `${Math.max(12, Math.min(rect.left, window.innerWidth - width - 12))}px`;
    const height = panel.offsetHeight;
    const top = rect.bottom + 10 + height <= window.innerHeight - 12 ? rect.bottom + 10 : Math.max(12, rect.top - height - 10);
    panel.style.top = `${top}px`;
  }
  function open(field, button) {
    openField = field;
    openButton = button;
    const initial = field.value || (field.name === 'departure' ? field.form.elements.arrival.value : '');
    shownMonth = initial ? monthStart(dateOf(initial)) : monthStart(today);
    focusKey = initial;
    panel.hidden = false;
    button.setAttribute('aria-expanded', 'true');
    render();
    position();
    requestAnimationFrame(() => panel.querySelector('[tabindex="0"]')?.focus({ preventScroll: true }));
  }
  function close(restoreFocus = false) {
    if (!openField) return;
    const button = openButton;
    panel.hidden = true;
    button?.setAttribute('aria-expanded', 'false');
    openField = null;
    openButton = null;
    focusKey = '';
    if (restoreFocus) button?.focus({ preventScroll: true });
  }
  function choose(key) {
    if (!canChoose(key)) return;
    const form = openField.form;
    const name = openField.name;
    const value = openField;
    value.value = key;
    value.dispatchEvent(new Event('change', { bubbles: true }));
    if (name === 'arrival') {
      const departure = form.elements.departure;
      departure.min = key;
      if (departure.value && departure.value <= key) {
        departure.value = '';
        departure.dispatchEvent(new Event('change', { bubbles: true }));
      }
      const nextButton = departure.closest('.date-field').querySelector('.date-display');
      open(departure, nextButton);
    } else close(true);
  }
  function moveFocus(event) {
    const movement = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[event.key];
    if (movement === undefined) return;
    event.preventDefault();
    const nextKey = keyOf(new Date(dateOf(event.currentTarget.dataset.day).getFullYear(), dateOf(event.currentTarget.dataset.day).getMonth(), dateOf(event.currentTarget.dataset.day).getDate() + movement));
    let target = panel.querySelector(`[data-day="${nextKey}"]`);
    if (!target) {
      shownMonth = monthStart(dateOf(nextKey));
      focusKey = nextKey;
      render(); position();
      target = panel.querySelector(`[data-day="${nextKey}"]`);
    }
    if (target && !target.disabled) {
      panel.querySelectorAll('[data-day]').forEach(button => button.tabIndex = -1);
      target.tabIndex = 0;
      target.focus();
    }
  }
  document.addEventListener('pointerdown', event => {
    if (openField && !panel.contains(event.target) && !event.target.closest('.date-display')) close();
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && openField) close(true); });
  window.addEventListener('resize', position);
  window.addEventListener('scroll', position, true);
  document.querySelector('#quick-form')?.addEventListener('submit', () => setTimeout(syncDisplays, 0));
  new MutationObserver(() => {
    syncDisplays();
    if (!openField) return;
    render(); position();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

  const nowMonth = monthStart(today);
  const endMonth = new Date(nowMonth.getFullYear(), nowMonth.getMonth() + 11, 1);
  const iso = date => keyOf(date);
  fetch(`/api/availability?from=${iso(nowMonth)}&to=${iso(endMonth)}`, { cache: 'no-store' })
    .then(response => response.ok ? response.json() : null)
    .then(data => { if (data?.blocks) { blocks.push(...data.blocks); if (openField) render(); } })
    .catch(() => {});
})();

(() => {
  const form = document.querySelector('#reservation-form');
  if (!form) return;
  const stay = document.querySelector('#stay-fields');
  const contact = document.querySelector('#contact-step');
  const continueButton = document.querySelector('#continue-booking');
  const quote = document.querySelector('#quote');
  const t = (es, en) => document.documentElement.lang === 'en' ? en : es;
  const ready = () => Boolean(form.elements.arrival.value && form.elements.departure.value > form.elements.arrival.value && quote.querySelector('strong'));
  const dateLabel = value => new Intl.DateTimeFormat(document.documentElement.lang === 'en' ? 'en-US' : 'es-CO', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`));
  function sync() { continueButton.disabled = !ready(); }
  function updateSummary() {
    const a = form.elements.arrival.value, d = form.elements.departure.value, guests = form.elements.guests.value;
    if (!a || !d) return;
    const nights = (Date.parse(d) - Date.parse(a)) / 86400000;
    const summary = document.querySelector('#contact-summary');
    const dates = document.createElement('strong');
    dates.className = 'contact-summary-dates';
    dates.textContent = `${dateLabel(a)} \u2192 ${dateLabel(d)}`;
    const guestsChip = document.createElement('span');
    guestsChip.className = 'contact-summary-chip';
    guestsChip.textContent = `${guests} ${t('hu\u00e9spedes', 'guests')}`;
    const nightsChip = document.createElement('span');
    nightsChip.className = 'contact-summary-chip';
    nightsChip.textContent = `${nights} ${t(nights === 1 ? 'noche' : 'noches', nights === 1 ? 'night' : 'nights')}`;
    summary.replaceChildren(dates, guestsChip, nightsChip);
  }
  form.elements.arrival.addEventListener('change', sync);
  form.elements.departure.addEventListener('change', sync);
  form.elements.guests.addEventListener('change', sync);
  new MutationObserver(sync).observe(quote, { childList: true, subtree: true, characterData: true });
  continueButton.addEventListener('click', () => {
    if (!ready()) return;
    updateSummary(); stay.hidden = true; contact.hidden = false; form.classList.add('is-contact-step');
    contact.classList.remove('is-entering');
    requestAnimationFrame(() => {
      contact.classList.add('is-entering');
      window.setTimeout(() => contact.classList.remove('is-entering'), 520);
    });
    document.querySelector('.booking-progress').classList.add('is-contact');
    document.querySelector('#progress-stay').classList.remove('is-active');
    document.querySelector('#progress-stay').classList.add('is-complete');
    document.querySelector('#progress-contact').classList.add('is-active');
    document.querySelector('.contact-summary').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    form.elements.name.focus({ preventScroll: true });
  });
  document.querySelector('#edit-stay').addEventListener('click', () => {
    contact.hidden = true; stay.hidden = false; form.classList.remove('is-contact-step');
    document.querySelector('.booking-progress').classList.remove('is-contact');
    document.querySelector('#progress-contact').classList.remove('is-active');
    document.querySelector('#progress-stay').classList.add('is-active');
    document.querySelector('#progress-stay').classList.remove('is-complete');
    document.querySelector('#availability-calendar').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  });
  new MutationObserver(updateSummary).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  sync();
})();

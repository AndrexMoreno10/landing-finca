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
    document.querySelector('#contact-summary').textContent = `${dateLabel(a)} \u2192 ${dateLabel(d)} \u00b7 ${guests} ${t('hu\u00e9spedes', 'guests')} \u00b7 ${nights} ${t(nights === 1 ? 'noche' : 'noches', nights === 1 ? 'night' : 'nights')}`;
  }
  form.elements.arrival.addEventListener('change', sync);
  form.elements.departure.addEventListener('change', sync);
  form.elements.guests.addEventListener('change', sync);
  new MutationObserver(sync).observe(quote, { childList: true, subtree: true, characterData: true });
  continueButton.addEventListener('click', () => {
    if (!ready()) return;
    updateSummary(); stay.hidden = true; contact.hidden = false;
    document.querySelector('#progress-stay').classList.remove('is-active');
    document.querySelector('#progress-stay').classList.add('is-complete');
    document.querySelector('#progress-contact').classList.add('is-active');
    contact.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
    form.elements.name.focus({ preventScroll: true });
  });
  document.querySelector('#edit-stay').addEventListener('click', () => {
    contact.hidden = true; stay.hidden = false;
    document.querySelector('#progress-contact').classList.remove('is-active');
    document.querySelector('#progress-stay').classList.add('is-active');
    document.querySelector('#progress-stay').classList.remove('is-complete');
    stay.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
    form.elements.arrival.focus({ preventScroll: true });
  });
  new MutationObserver(updateSummary).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  sync();
})();

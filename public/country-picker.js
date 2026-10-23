(() => {
  const form = document.querySelector('#reservation-form');
  if (!form) return;
  const toggle = document.querySelector('#country-toggle');
  const list = document.querySelector('#country-options');
  const dial = document.querySelector('#country-dial');
  const prefix = form.elements.countryCode;
  const options = [...list.querySelectorAll('[role="option"]')];
  const name = option => option.querySelector('span').textContent;
  function close(restoreFocus = false) {
    list.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    if (restoreFocus) toggle.focus();
  }
  function open() {
    list.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    (options.find(option => option.getAttribute('aria-selected') === 'true') || options[0]).focus();
  }
  toggle.addEventListener('click', () => list.hidden ? open() : close());
  options.forEach(option => option.addEventListener('click', () => {
    options.forEach(item => item.setAttribute('aria-selected', String(item === option)));
    dial.textContent = option.dataset.dial;
    prefix.value = option.dataset.dial;
    toggle.querySelector('use').setAttribute('href', `#flag-${option.dataset.iso.toLowerCase()}`);
    toggle.setAttribute('aria-label', `${name(option)} ${option.dataset.dial}`);
    close(true);
  }));
  list.addEventListener('keydown', event => {
    const index = options.indexOf(document.activeElement);
    let next = index;
    if (event.key === 'ArrowDown') next = (index + 1) % options.length;
    else if (event.key === 'ArrowUp') next = (index - 1 + options.length) % options.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = options.length - 1;
    else if (event.key === 'Escape') { event.preventDefault(); close(true); return; }
    else return;
    event.preventDefault(); options[next].focus();
  });
  document.addEventListener('pointerdown', event => {
    if (!list.hidden && !list.contains(event.target) && !toggle.contains(event.target)) close();
  });
  new MutationObserver(() => {
    const selected = options.find(option => option.getAttribute('aria-selected') === 'true');
    if (selected) toggle.setAttribute('aria-label', `${name(selected)} ${selected.dataset.dial}`);
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
})();

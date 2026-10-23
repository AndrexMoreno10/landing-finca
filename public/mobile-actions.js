// Show the mobile shortcut only between sections that already offer booking actions.
(() => {
  const shortcut = document.querySelector('.mobile-book');
  if (!shortcut) return;
  const targets = [...document.querySelectorAll('.hero, .booking-strip, .availability-section, #reservar')];
  const visible = new Set(targets);
  const update = () => {
    const editing = /^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement?.tagName || '');
    const show = visible.size === 0 && !editing && !document.querySelector('dialog[open]');
    shortcut.classList.toggle('is-visible', show);
    shortcut.inert = !show;
    shortcut.setAttribute('aria-hidden', String(!show));
  };
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) entry.isIntersecting ? visible.add(entry.target) : visible.delete(entry.target);
    update();
  });
  targets.forEach(target => observer.observe(target));
  document.addEventListener('focusin', update);
  document.addEventListener('focusout', () => requestAnimationFrame(update));
  const dialog = document.querySelector('dialog');
  if (dialog) new MutationObserver(update).observe(dialog, {attributes:true, attributeFilter:['open']});
  update();
})();

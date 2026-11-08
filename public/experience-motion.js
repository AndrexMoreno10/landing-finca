(() => {
  const section = document.querySelector('.amenities');
  if (!section) return;

  const counters = [...section.querySelectorAll('[data-count]')];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  section.classList.add('motion-ready');

  const reveal = () => {
    section.classList.add('motion-visible');
    counters.forEach(counter => {
      const target = Number(counter.dataset.count);
      const digits = Number(counter.dataset.digits || 1);
      if (reducedMotion.matches) {
        counter.textContent = String(target).padStart(digits, '0');
        return;
      }
      const start = performance.now();
      const duration = 760;
      const tick = now => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        counter.textContent = String(Math.round(target * eased)).padStart(digits, '0');
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  };

  const observer = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    reveal();
    observer.disconnect();
  }, { threshold: 0.18 });
  observer.observe(section);
})();

(() => {
  const story = document.querySelector('.story-section');
  if (!story) return;

  const chapters = [...story.querySelectorAll('[data-story-chapter]')];
  const desktopVideos = [...story.querySelectorAll('[data-story-video]')];
  const ambient = story.querySelector('.story-ambient');
  const toggles = [...story.querySelectorAll('.story-motion-toggle')];
  const status = story.querySelector('.story-status');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  if (!chapters.length || desktopVideos.length !== chapters.length) return;

  const syncStickyOffset = () => {
    const headerHeight = document.querySelector('.header')?.getBoundingClientRect().height || 76;
    story.style.setProperty('--story-sticky-top', `${Math.round(headerHeight)}px`);
  };
  syncStickyOffset();

  let activeIndex = 0;
  let inView = false;
  let manuallyPaused = reducedMotion.matches;
  desktopVideos.forEach(video => {
    const stopAt = Number(video.dataset.stopAt);
    if (!Number.isFinite(stopAt) || stopAt <= 0) return;
    video.addEventListener('timeupdate', () => {
      if (video.currentTime < stopAt) return;
      video.pause();
      video.currentTime = stopAt;
    });
  });

  const updateMotion = () => {
    desktopVideos.forEach(video => {
      if (video !== desktopVideos[activeIndex] || !inView || manuallyPaused || document.hidden) {
        video.pause();
      } else {
        video.play().catch(() => {});
      }
    });
    toggles.forEach(toggle => {
      toggle.setAttribute('aria-pressed', String(manuallyPaused));
      const isEnglish = document.documentElement.lang === 'en';
      const copy = manuallyPaused
        ? (isEnglish ? 'Resume scenes' : 'Reanudar escenas')
        : (isEnglish ? 'Pause scenes' : 'Pausar escenas');
      toggle.querySelector('span').textContent = copy;
      toggle.setAttribute('aria-label', copy);
      toggle.querySelector('[data-play]').hidden = !manuallyPaused;
      toggle.querySelector('[data-pause]').hidden = manuallyPaused;
      toggle.hidden = reducedMotion.matches;
    });
  };

  const setActive = index => {
    if (!Number.isInteger(index) || index < 0 || index >= chapters.length || index === activeIndex) return;
    chapters[activeIndex].classList.remove('is-active');
    desktopVideos[activeIndex].classList.remove('is-active');
    activeIndex = index;
    chapters[activeIndex].classList.add('is-active');
    desktopVideos[activeIndex].classList.add('is-active');
    const poster = desktopVideos[activeIndex].getAttribute('poster');
    if (ambient && poster) ambient.style.setProperty('--story-poster', `url("${poster}")`);
    story.style.setProperty('--story-progress', `${((activeIndex + 1) / chapters.length) * 100}%`);
    const current = String(activeIndex + 1).padStart(2, '0');
    const total = String(chapters.length).padStart(2, '0');
    if (status) status.textContent = document.documentElement.lang === 'en'
      ? `Scene ${current} of ${total}`
      : `Escena ${current} de ${total}`;
    updateMotion();
  };

  toggles.forEach(toggle => toggle.addEventListener('click', () => {
    if (reducedMotion.matches) return;
    manuallyPaused = !manuallyPaused;
    updateMotion();
  }));

  const chapterObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) setActive(Number(entry.target.dataset.storyChapter));
    });
  }, { rootMargin: '-38% 0px -38% 0px', threshold: 0 });
  chapters.forEach(chapter => chapterObserver.observe(chapter));

  const visibilityObserver = new IntersectionObserver(entries => {
    inView = entries[0].isIntersecting;
    story.classList.toggle('is-in-view', inView);
    updateMotion();
  }, { threshold: 0.08 });
  visibilityObserver.observe(story);

  document.addEventListener('visibilitychange', updateMotion);
  window.addEventListener('resize', syncStickyOffset, { passive: true });
  reducedMotion.addEventListener('change', event => {
    manuallyPaused = event.matches;
    updateMotion();
  });
  new MutationObserver(updateMotion).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

  story.dataset.storyReady = 'true';
  story.style.setProperty('--story-progress', `${100 / chapters.length}%`);
  updateMotion();
})();

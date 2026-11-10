(() => {
  const reel = document.querySelector("[data-reel-observer]");
  const video = reel?.querySelector("[data-spaces-reel-video]");
  const playButton = reel?.querySelector("[data-reel-toggle]");
  const audioButton = reel?.querySelector("[data-reel-audio]");
  if (!reel || !video || !playButton || !audioButton) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let loaded = false;
  let userPaused = reduceMotion.matches;
  let onScreen = false;

  const isEnglish = () => document.documentElement.lang.toLowerCase().startsWith("en");
  const updateControls = () => {
    const paused = video.paused;
    reel.classList.toggle("is-paused", paused);
    reel.classList.toggle("is-audible", !video.muted);
    playButton.setAttribute("aria-pressed", String(!paused));
    playButton.setAttribute("aria-label", paused
      ? (isEnglish() ? "Play video" : "Reproducir video")
      : (isEnglish() ? "Pause video" : "Pausar video"));
    audioButton.setAttribute("aria-pressed", String(!video.muted));
    audioButton.setAttribute("aria-label", video.muted
      ? (isEnglish() ? "Turn sound on" : "Activar sonido")
      : (isEnglish() ? "Mute video" : "Silenciar video"));
  };

  const loadVideo = () => {
    if (loaded) return;
    const source = video.dataset.src;
    if (!source) return;
    video.src = source;
    video.load();
    loaded = true;
  };

  const play = async () => {
    loadVideo();
    try { await video.play(); } catch { /* Keep the poster and controls available if playback is blocked. */ }
    updateControls();
  };

  video.addEventListener("play", updateControls);
  video.addEventListener("pause", updateControls);
  playButton.addEventListener("click", () => {
    if (video.paused) {
      userPaused = false;
      play();
    } else {
      userPaused = true;
      video.pause();
    }
  });
  audioButton.addEventListener("click", () => {
    video.muted = !video.muted;
    if (!loaded) loadVideo();
    if (video.paused) {
      userPaused = false;
      play();
    }
    updateControls();
  });

  const observer = new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    if (onScreen) {
      if (!reduceMotion.matches && !userPaused) play();
      return;
    }
    video.pause();
  }, { rootMargin: "120px 0px", threshold: 0.1 });
  observer.observe(reel);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) video.pause();
    else if (onScreen && !reduceMotion.matches && !userPaused) play();
  });
  reduceMotion.addEventListener?.("change", (event) => {
    if (event.matches) video.pause();
    else if (onScreen && !userPaused) play();
  });
  document.addEventListener("click", (event) => {
    if (event.target.closest("#language")) window.setTimeout(updateControls, 0);
  });

  updateControls();
})();

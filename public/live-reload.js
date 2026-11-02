(() => {
  if (!['localhost', '127.0.0.1'].includes(location.hostname)) return;

  const stamp = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const localStyles = [...document.querySelectorAll('link[rel="stylesheet"]')]
    .filter(link => new URL(link.href).origin === location.origin);

  // The local server gives stylesheets a one-hour cache lifetime; bust it on preview.
  for (const link of localStyles) {
    const url = new URL(link.href);
    url.searchParams.set('live-preview', stamp());
    link.href = url.href;
  }

  const paths = [...new Set(['/', ...localStyles.map(link => new URL(link.href).pathname)])];
  const load = async path => {
    const response = await fetch(`${path}?live-preview=${stamp()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Preview check failed: ${path}`);
    return response.text();
  };

  let baseline;
  let checking = false;
  load('/').then(async html => {
    baseline = new Map([['/', html]]);
    await Promise.all(paths.slice(1).map(async path => baseline.set(path, await load(path))));
  }).catch(() => {});

  window.setInterval(async () => {
    if (!baseline || checking) return;
    checking = true;
    try {
      for (const path of paths) {
        if (await load(path) !== baseline.get(path)) {
          location.reload();
          return;
        }
      }
    } catch {
      // Keep the preview open during brief local server interruptions.
    } finally {
      checking = false;
    }
  }, 2000);
})();

(() => {
  const dialog = document.querySelector('#space-dialog');
  const cards = [...document.querySelectorAll('[data-space-id]')];
  if (!dialog || !cards.length || typeof dialog.showModal !== 'function') return;

  const dialogVideo = dialog.querySelector('[data-space-dialog-video]');
  const title = dialog.querySelector('[data-space-dialog-title]');
  const description = dialog.querySelector('[data-space-dialog-description]');
  const kicker = dialog.querySelector('[data-space-dialog-kicker]');
  const closeButton = dialog.querySelector('[data-space-close]');
  const visual = dialog.querySelector('.space-dialog__visual');
  let activeSpace = null;

  const spaces = {
    pool: {
      number: '01',
      image: '/assets/spaces/covers/pool.webp',
      video: '/assets/spaces/videos/pool.mp4',
      tone: 'exterior',
      title: { es: 'Piscina y terraza', en: 'Pool and terrace' },
      description: {
        es: 'Disfruta la piscina junto a la terraza y las vistas verdes del Quindío.',
        en: 'Enjoy the pool, terrace and green views across the Quindío region.',
      },
      alt: { es: 'Piscina del chalet con vista al paisaje', en: 'Chalet pool overlooking the landscape' },
    },
    living: {
      number: '02',
      image: '/assets/spaces/living.jpg',
      video: '/assets/spaces/videos/living.mp4?v=2',
      title: { es: 'Sala de estar', en: 'Living room' },
      description: {
        es: 'Un espacio amplio y familiar para reunirse, conversar y descansar.',
        en: 'A spacious, welcoming room to gather, talk and unwind.',
      },
      alt: { es: 'Sala de estar del chalet con sillas y mesa de centro', en: 'Chalet living room with chairs and coffee table' },
    },
    bedrooms: {
      number: '03',
      image: '/assets/spaces/bedrooms.jpg',
      video: '/assets/spaces/videos/bedrooms.mp4?v=2',
      title: { es: 'Habitaciones', en: 'Bedrooms' },
      description: {
        es: 'La finca cuenta con cinco habitaciones para descansar en grupo.',
        en: 'The finca has five bedrooms for your group to rest.',
      },
      alt: { es: 'Habitación del chalet con cama y ventana al exterior', en: 'Chalet bedroom with a bed and a window' },
    },
    games: {
      number: '04',
      image: '/assets/spaces/covers/games.webp',
      video: '/assets/spaces/videos/games.mp4',
      title: { es: 'Zona de juegos', en: 'Games area' },
      description: {
        es: 'Ping pong, bolirana y juegos de mesa para compartir en familia o con amigos.',
        en: 'Table tennis, bolirana and board games to enjoy with family or friends.',
      },
      alt: { es: 'Mesa de ping pong en el balcón del chalet', en: 'Table tennis on the chalet balcony' },
    },
    parking: {
      number: '05',
      image: '/assets/spaces/parking.jpg',
      video: '/assets/spaces/videos/parking.mp4',
      title: { es: 'Parqueadero', en: 'Parking' },
      description: {
        es: 'Espacio de parqueadero junto al chalet, con una llegada directa a la casa.',
        en: 'Parking space beside the chalet, with direct arrival at the house.',
      },
      alt: { es: 'Entrada y zona de parqueadero frente al chalet', en: 'Driveway and parking area in front of the chalet' },
    },
    barbecue: {
      number: '06',
      image: '/assets/spaces/covers/barbecue.webp',
      video: '/assets/spaces/videos/barbecue.mp4?v=2',
      title: { es: 'Asador de barril', en: 'Barrel barbecue' },
      description: {
        es: 'El asador está en la terraza, junto a la piscina y al paisaje.',
        en: 'The barbecue sits on the terrace beside the pool and the view.',
      },
      alt: { es: 'Asador de barril en la terraza junto a la piscina', en: 'Barrel barbecue on the terrace beside the pool' },
    },
  };

  const renderSpace = space => {
    const lang = document.documentElement.lang === 'en' ? 'en' : 'es';
    dialogVideo.poster = space.image;
    dialogVideo.setAttribute('aria-label', (lang === 'en' ? 'Video: ' : 'Video: ') + space.title[lang]);
    if (dialogVideo.getAttribute('src') !== space.video) {
      dialogVideo.src = space.video;
      dialogVideo.load();
    }
    visual.style.setProperty('--space-dialog-image', 'url("' + space.image + '")');
    title.textContent = space.title[lang];
    description.textContent = space.description[lang];
    kicker.textContent = (lang === 'en' ? 'SPACE ' : 'ESPACIO ') + space.number;
    closeButton.setAttribute('aria-label', lang === 'en' ? 'Close window' : 'Cerrar ventana');
  };

  cards.forEach(card => {
    card.addEventListener('click', () => {
      activeSpace = spaces[card.dataset.spaceId];
      if (!activeSpace) return;
      renderSpace(activeSpace);
      dialog.showModal();
      dialogVideo.play().catch(() => {});
    });
  });

  closeButton.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });
  dialog.querySelector('.space-dialog__cta')?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    dialogVideo.pause();
    dialogVideo.currentTime = 0;
    activeSpace = null;
  });
  new MutationObserver(() => {
    if (dialog.open && activeSpace) renderSpace(activeSpace);
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

  const section = document.querySelector('.spaces-tour');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  if (section && !reducedMotion.matches && 'IntersectionObserver' in window) {
    section.dataset.reveal = 'on';
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12 });
    cards.forEach(card => revealObserver.observe(card));
  } else {
    cards.forEach(card => card.classList.add('is-visible'));
  }
})();

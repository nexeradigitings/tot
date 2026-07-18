document.addEventListener('DOMContentLoaded', () => {

  /* ============ NAV: scroll state + mobile menu ============ */
  const nav = document.getElementById('siteNav');
  const burgerBtn = document.getElementById('burgerBtn');
  const mobileMenu = document.getElementById('mobileMenu');

  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  burgerBtn.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('open');
    burgerBtn.classList.toggle('active', isOpen);
    burgerBtn.setAttribute('aria-expanded', isOpen);
  });

  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      burgerBtn.classList.remove('active');
      burgerBtn.setAttribute('aria-expanded', 'false');
    });
  });

  /* ============ OPEN / CLOSED STATUS (6PM – 2AM) ============ */
  function updateStatus() {
    const now = new Date();
    const hour = now.getHours();
    const isOpen = hour >= 18 || hour < 2; // 6PM -> 2AM

    const badges = [
      { badge: document.getElementById('statusBadge'), text: document.getElementById('statusText') },
      { badge: document.getElementById('statusBadgeMobile'), text: document.getElementById('statusTextMobile') }
    ];

    badges.forEach(({ badge, text }) => {
      if (!badge || !text) return;
      badge.classList.remove('is-open', 'is-closed');
      if (isOpen) {
        badge.classList.add('is-open');
        text.textContent = 'Open Now · Till 2AM';
      } else {
        badge.classList.add('is-closed');
        text.textContent = 'Opens 6PM';
      }
    });
  }
  updateStatus();
  setInterval(updateStatus, 60000);

  /* ============ HERO VIDEO: continuous loop, resilient autoplay ============ */
  const heroVideo = document.getElementById('heroVideo');

  function tryPlay(video) {
    if (!video) return;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay blocked (rare with muted+playsinline) — resume on first interaction
        const resume = () => {
          video.play().catch(() => {});
          window.removeEventListener('touchstart', resume);
          window.removeEventListener('click', resume);
        };
        window.addEventListener('touchstart', resume, { once: true });
        window.addEventListener('click', resume, { once: true });
      });
    }
  }
  tryPlay(heroVideo);

  // Pause the hero video when the tab is hidden, resume when it's visible again
  // — keeps the loop continuous without wasting battery/CPU in the background.
  document.addEventListener('visibilitychange', () => {
    if (!heroVideo) return;
    if (document.hidden) {
      heroVideo.pause();
    } else {
      tryPlay(heroVideo);
    }
  });

  /* ============ VIBE TILE VIDEO: load + play only when in view ============ */
  const tileVideo = document.getElementById('tileVideo');
  if (tileVideo && 'IntersectionObserver' in window) {
    const tileObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if (!tileVideo.src && !tileVideo.currentSrc) {
            tileVideo.load();
          }
          tryPlay(tileVideo);
        } else {
          tileVideo.pause();
        }
      });
    }, { threshold: 0.35 });
    tileObserver.observe(tileVideo);
  } else if (tileVideo) {
    tryPlay(tileVideo);
  }

  /* ============ SCROLL REVEAL ============ */
  const revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

    revealEls.forEach(el => observer.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in-view'));
  }

  /* ============ HERO PARALLAX GLOWS (desktop only) ============ */
  const isTouch = window.matchMedia('(pointer: coarse)').matches;
  const glows = document.querySelectorAll('.hero-glow');
  const hero = document.querySelector('.hero');

  if (!isTouch && hero) {
    hero.addEventListener('mousemove', (e) => {
      const { innerWidth: w, innerHeight: h } = window;
      const x = (e.clientX / w - 0.5) * 2;
      const y = (e.clientY / h - 0.5) * 2;

      glows.forEach((glow, i) => {
        const strength = (i + 1) * 12;
        glow.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
      });
    });
  }

  /* ============ CURSOR GLOW FOLLOW (desktop only) ============ */
  const cursorGlow = document.getElementById('cursorGlow');
  if (!isTouch && cursorGlow) {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let curX = mouseX;
    let curY = mouseY;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    function animateCursor() {
      curX += (mouseX - curX) * 0.12;
      curY += (mouseY - curY) * 0.12;
      cursorGlow.style.transform = `translate(${curX}px, ${curY}px)`;
      requestAnimationFrame(animateCursor);
    }
    animateCursor();
  } else if (cursorGlow) {
    cursorGlow.style.display = 'none';
  }

  /* ============ MENU CAROUSEL: buttons + drag + autoplay ============ */
  const track = document.getElementById('menuTrack');
  const carousel = document.getElementById('menuCarousel');
  const prevBtn = document.getElementById('menuPrev');
  const nextBtn = document.getElementById('menuNext');

  if (track) {
    const getCardStep = () => {
      const card = track.querySelector('.menu-card');
      return card ? card.getBoundingClientRect().width + 22 : 300;
    };

    nextBtn.addEventListener('click', () => {
      track.scrollBy({ left: getCardStep(), behavior: 'smooth' });
    });
    prevBtn.addEventListener('click', () => {
      track.scrollBy({ left: -getCardStep(), behavior: 'smooth' });
    });

    // Drag to scroll
    let isDown = false;
    let startX = 0;
    let scrollStart = 0;

    const startDrag = (x) => {
      isDown = true;
      startX = x;
      scrollStart = track.scrollLeft;
      carousel.classList.add('dragging');
    };
    const moveDrag = (x) => {
      if (!isDown) return;
      track.scrollLeft = scrollStart - (x - startX);
    };
    const endDrag = () => {
      isDown = false;
      carousel.classList.remove('dragging');
    };

    track.addEventListener('mousedown', (e) => startDrag(e.pageX));
    window.addEventListener('mousemove', (e) => moveDrag(e.pageX));
    window.addEventListener('mouseup', endDrag);

    track.addEventListener('touchstart', (e) => startDrag(e.touches[0].pageX), { passive: true });
    track.addEventListener('touchmove', (e) => moveDrag(e.touches[0].pageX), { passive: true });
    track.addEventListener('touchend', endDrag);

    // Gentle continuous autoplay, pauses on interaction
    let autoplayTimer = null;
    let autoplayPaused = false;

    function startAutoplay() {
      stopAutoplay();
      autoplayTimer = setInterval(() => {
        if (autoplayPaused) return;
        const maxScroll = track.scrollWidth - track.clientWidth;
        if (track.scrollLeft >= maxScroll - 4) {
          track.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          track.scrollBy({ left: 1.2, behavior: 'auto' });
        }
      }, 30);
    }
    function stopAutoplay() {
      if (autoplayTimer) clearInterval(autoplayTimer);
    }

    carousel.addEventListener('mouseenter', () => { autoplayPaused = true; });
    carousel.addEventListener('mouseleave', () => { autoplayPaused = false; });
    carousel.addEventListener('touchstart', () => { autoplayPaused = true; }, { passive: true });

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    //if (!prefersReducedMotion) startAutoplay();
  }

  /* ============ FOOTER YEAR ============ */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

});

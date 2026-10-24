/**
 * Manggoes Interactive Behavior
 * Scoped to .mg namespace, zero globals, resilient to partial rendering & double initialization
 */
(function () {
  'use strict';

  if (window.__mgInitialized) {
    return;
  }
  window.__mgInitialized = true;

  function initManggoes() {
    var mgRoots = document.querySelectorAll('.mg');
    if (!mgRoots.length) {
      return;
    }

    // Helper functions strictly scoped to any .mg container
    function query(selector) {
      return document.querySelector('.mg ' + selector) || document.querySelector('.mg' + selector);
    }

    function queryAll(selector) {
      return document.querySelectorAll('.mg ' + selector + ', .mg' + selector);
    }

    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 1. Mobile Navigation Drawer
    var hamburger = query('.mg-hamburger');
    var drawer = query('.mg-drawer');
    var drawerClose = query('.mg-drawer-close');
    var drawerLinks = queryAll('.mg-drawer__link, .mg-drawer .mg-btn');

    function openDrawer() {
      if (!drawer) return;
      drawer.classList.add('is-open');
      drawer.setAttribute('aria-hidden', 'false');
      if (hamburger) {
        hamburger.setAttribute('aria-expanded', 'true');
      }
      document.body.style.overflow = 'hidden';
      if (drawerClose) {
        drawerClose.focus();
      }
    }

    function closeDrawer(restoreFocus) {
      if (!drawer) return;
      drawer.classList.remove('is-open');
      drawer.setAttribute('aria-hidden', 'true');
      if (hamburger) {
        hamburger.setAttribute('aria-expanded', 'false');
        if (restoreFocus && window.innerWidth < 1024) {
          hamburger.focus();
        }
      }
      document.body.style.overflow = '';
    }

    if (hamburger && drawer) {
      hamburger.addEventListener('click', function () {
        var isOpen = drawer.classList.contains('is-open');
        if (isOpen) {
          closeDrawer(true);
        } else {
          openDrawer();
        }
      });
    }

    if (drawerClose) {
      drawerClose.addEventListener('click', function () {
        closeDrawer(true);
      });
    }

    drawerLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        closeDrawer(false);
      });
    });

    // Close mobile drawer automatically if window is resized to desktop breakpoint
    window.addEventListener('resize', function () {
      if (window.innerWidth >= 1024 && drawer && drawer.classList.contains('is-open')) {
        closeDrawer(false);
      }
    });

    // 2. Video Modal Dialog
    var playTriggers = queryAll('.mg-play-trigger, [data-mg-modal="video"]');
    var videoModal = query('#mg-video-modal');
    var modalClose = query('.mg-modal-close');
    var lastFocusedElement = null;

    function openModal() {
      if (!videoModal) return;
      lastFocusedElement = document.activeElement;
      videoModal.classList.add('is-active');
      videoModal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      if (modalClose) {
        modalClose.focus();
      }
    }

    function closeModal() {
      if (!videoModal) return;
      videoModal.classList.remove('is-active');
      videoModal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
        lastFocusedElement.focus();
      }
    }

    playTriggers.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        openModal();
      });
    });

    if (modalClose) {
      modalClose.addEventListener('click', closeModal);
    }

    if (videoModal) {
      videoModal.addEventListener('click', function (e) {
        if (e.target === videoModal) {
          closeModal();
        }
      });
    }

    // Shared Escape Key Listener for Overlays
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' || e.key === 'Esc') {
        if (videoModal && videoModal.classList.contains('is-active')) {
          closeModal();
        } else if (drawer && drawer.classList.contains('is-open')) {
          closeDrawer();
        }
      }
    });

    // 3. Varieties Carousel (Scroll-Snap, Drag, Buttons & Keyboard)
    var track = query('.mg-carousel__track');
    var prevBtn = query('.mg-carousel__prev');
    var nextBtn = query('.mg-carousel__next');

    if (track) {
      function getScrollStep() {
        var firstCard = track.querySelector('.mg-variety-card');
        if (!firstCard) return 300;
        var style = window.getComputedStyle(track);
        var gap = parseFloat(style.gap) || 16;
        return firstCard.offsetWidth + gap;
      }

      if (prevBtn) {
        prevBtn.addEventListener('click', function () {
          track.scrollBy({ left: -getScrollStep(), behavior: prefersReducedMotion ? 'auto' : 'smooth' });
        });
      }

      if (nextBtn) {
        nextBtn.addEventListener('click', function () {
          track.scrollBy({ left: getScrollStep(), behavior: prefersReducedMotion ? 'auto' : 'smooth' });
        });
      }

      // Keyboard arrow navigation on carousel
      track.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          track.scrollBy({ left: -getScrollStep(), behavior: 'smooth' });
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          track.scrollBy({ left: getScrollStep(), behavior: 'smooth' });
        }
      });

      // Mouse drag to scroll
      var isDown = false;
      var startX = 0;
      var scrollLeft = 0;
      var moved = 0;

      track.addEventListener('mousedown', function (e) {
        isDown = true;
        moved = 0;
        track.classList.add('is-dragging');
        startX = e.pageX - track.offsetLeft;
        scrollLeft = track.scrollLeft;
      });

      track.addEventListener('mouseleave', function () {
        isDown = false;
        track.classList.remove('is-dragging');
      });

      track.addEventListener('mouseup', function (e) {
        isDown = false;
        track.classList.remove('is-dragging');
      });

      track.addEventListener('mousemove', function (e) {
        if (!isDown) return;
        e.preventDefault();
        var x = e.pageX - track.offsetLeft;
        var walk = (x - startX) * 1.4;
        moved += Math.abs(walk);
        track.scrollLeft = scrollLeft - walk;
      });

      // Prevent accidental link or button click if user was dragging
      track.addEventListener('click', function (e) {
        if (moved > 10) {
          e.preventDefault();
          e.stopPropagation();
        }
      }, true);
    }

    // 4. Stats Counter Animation
    var statNumbers = queryAll('.mg-stat-count');
    if (statNumbers.length > 0) {
      function animateCounter(el) {
        var target = parseInt(el.getAttribute('data-target'), 10) || 0;
        if (prefersReducedMotion || target === 0) {
          el.textContent = target.toLocaleString('id-ID');
          return;
        }

        var duration = 1500;
        var startTime = null;

        function step(timestamp) {
          if (!startTime) startTime = timestamp;
          var progress = Math.min((timestamp - startTime) / duration, 1);
          // Ease-out cubic curve
          var easeProgress = 1 - Math.pow(1 - progress, 3);
          var current = Math.floor(easeProgress * target);
          el.textContent = current.toLocaleString('id-ID');
          if (progress < 1) {
            window.requestAnimationFrame(step);
          } else {
            el.textContent = target.toLocaleString('id-ID');
          }
        }
        window.requestAnimationFrame(step);
      }

      if ('IntersectionObserver' in window) {
        var statsObserver = new IntersectionObserver(function (entries, observer) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              animateCounter(entry.target);
              observer.unobserve(entry.target);
            }
          });
        }, { threshold: 0.3 });

        statNumbers.forEach(function (num) {
          statsObserver.observe(num);
        });
      } else {
        statNumbers.forEach(function (num) {
          animateCounter(num);
        });
      }
    }

    // 5. Scroll Reveal Intersection Observer
    var revealElements = queryAll('.mg-reveal');
    if (revealElements.length > 0) {
      if (prefersReducedMotion || !('IntersectionObserver' in window)) {
        revealElements.forEach(function (el) {
          el.classList.add('is-revealed');
        });
      } else {
        var revealObserver = new IntersectionObserver(function (entries, observer) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-revealed');
              observer.unobserve(entry.target);
            }
          });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

        revealElements.forEach(function (el) {
          revealObserver.observe(el);
        });
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initManggoes);
  } else {
    initManggoes();
  }
})();

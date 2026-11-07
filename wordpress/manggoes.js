/**
 * Manggoes Interactive Behavior
 * Scoped to .mg namespace, zero dependencies, resilient to partial rendering & double initialization
 * Aligned with FreshSeal Editorial Orchard specification & MANGGOES Brand Guidelines
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

    function query(selector) {
      return document.querySelector('.mg ' + selector) || document.querySelector('.mg' + selector);
    }

    function queryAll(selector) {
      return document.querySelectorAll('.mg ' + selector + ', .mg' + selector);
    }

    // 1. Mobile Navigation Drawer
    var drawer = query('.mg-drawer');
    var drawerClose = query('.mg-drawer-close');
    var drawerLinks = queryAll('.mg-drawer__link, .mg-drawer .mg-btn, .mg-drawer .mg-btn-pill');
    var hamburgers = queryAll('#mg-drawer-open, #mg-sticky-drawer-open, .mg-hamburger');

    function openDrawer() {
      if (!drawer) return;
      drawer.classList.add('is-open');
      drawer.setAttribute('aria-hidden', 'false');
      hamburgers.forEach(function (btn) {
        btn.setAttribute('aria-expanded', 'true');
      });
      document.body.style.overflow = 'hidden';
      if (drawerClose) {
        drawerClose.focus();
      }
    }

    function closeDrawer(restoreFocus) {
      if (!drawer) return;
      drawer.classList.remove('is-open');
      drawer.setAttribute('aria-hidden', 'true');
      hamburgers.forEach(function (btn) {
        btn.setAttribute('aria-expanded', 'false');
      });
      document.body.style.overflow = '';
      if (restoreFocus && window.innerWidth < 1024 && hamburgers.length) {
        hamburgers[0].focus();
      }
    }

    hamburgers.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var isOpen = drawer && drawer.classList.contains('is-open');
        if (isOpen) {
          closeDrawer(true);
        } else {
          openDrawer();
        }
      });
    });

    if (drawerClose) {
      drawerClose.addEventListener('click', function () {
        closeDrawer(true);
      });
    }

    if (drawer) {
      drawer.addEventListener('click', function (e) {
        if (e.target === drawer) {
          closeDrawer(true);
        }
      });
    }

    drawerLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        closeDrawer(false);
      });
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth >= 1024 && drawer && drawer.classList.contains('is-open')) {
        closeDrawer(false);
      }
    });

    // 2. FAQ Accordion Interaction
    var accordionItems = queryAll('.mg-accordion__item');
    accordionItems.forEach(function (item) {
      var trigger = item.querySelector('.mg-accordion__trigger');
      if (!trigger) return;

      trigger.addEventListener('click', function () {
        var isOpen = item.classList.contains('is-open');

        accordionItems.forEach(function (other) {
          if (other !== item && other.classList.contains('is-open')) {
            other.classList.remove('is-open');
            var otherTrigger = other.querySelector('.mg-accordion__trigger');
            if (otherTrigger) {
              otherTrigger.setAttribute('aria-expanded', 'false');
            }
          }
        });

        if (isOpen) {
          item.classList.remove('is-open');
          trigger.setAttribute('aria-expanded', 'false');
        } else {
          item.classList.add('is-open');
          trigger.setAttribute('aria-expanded', 'true');
        }
      });
    });

    // 3. Hero Side-Card Slider & Dash Pagination
    var heroSlides = [
      { name: 'Gedong Gincu', img: 'assets/images/variety-gedong-gincu.webp' },
      { name: 'Golek Madu', img: 'assets/images/variety-golek-madu.webp' },
      { name: 'Harum Manis', img: 'assets/images/variety-harum-manis.webp' }
    ];
    var currentSlideIdx = 0;
    var heroSlideImg = document.getElementById('mg-hero-slide-img');
    var heroSlideTitle = document.getElementById('mg-hero-slide-title');
    var heroNextBtn = document.getElementById('mg-hero-slide-next');
    var heroDashes = queryAll('.mg-pager__dash');
    var heroSliderWrap = query('.mg-hero__side-card');
    var slideInterval = null;

    function setSlide(idx) {
      if (idx < 0) idx = heroSlides.length - 1;
      if (idx >= heroSlides.length) idx = 0;
      currentSlideIdx = idx;

      if (heroSlideImg && heroSlideTitle) {
        heroSlideImg.style.opacity = '0';
        heroSlideTitle.style.opacity = '0';

        setTimeout(function () {
          heroSlideImg.src = heroSlides[currentSlideIdx].img;
          heroSlideImg.alt = heroSlides[currentSlideIdx].name;
          heroSlideTitle.textContent = heroSlides[currentSlideIdx].name;
          heroSlideImg.style.opacity = '1';
          heroSlideTitle.style.opacity = '1';
        }, 150);
      }

      heroDashes.forEach(function (dash, i) {
        if (i === currentSlideIdx) {
          dash.classList.add('is-active');
        } else {
          dash.classList.remove('is-active');
        }
      });
    }

    function startAutoSlide() {
      if (slideInterval) clearInterval(slideInterval);
      slideInterval = setInterval(function () {
        setSlide(currentSlideIdx + 1);
      }, 5000);
    }

    function stopAutoSlide() {
      if (slideInterval) {
        clearInterval(slideInterval);
        slideInterval = null;
      }
    }

    if (heroNextBtn) {
      heroNextBtn.addEventListener('click', function () {
        setSlide(currentSlideIdx + 1);
      });
    }

    heroDashes.forEach(function (dash, i) {
      dash.addEventListener('click', function () {
        setSlide(i);
      });
    });

    if (heroSliderWrap) {
      heroSliderWrap.addEventListener('mouseenter', stopAutoSlide);
      heroSliderWrap.addEventListener('mouseleave', startAutoSlide);
      heroSliderWrap.addEventListener('focusin', stopAutoSlide);
      heroSliderWrap.addEventListener('focusout', startAutoSlide);
    }

    startAutoSlide();

    // 4. Sticky Compact Bar & FAB Visibility (IntersectionObserver)
    var heroFrame = query('.mg-frame') || query('.mg-hero-wrap');
    var stickyBar = document.getElementById('mg-sticky-bar');
    var fab = query('.mg-floating-wa');

    if ('IntersectionObserver' in window && heroFrame) {
      var heroObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var isHeroVisible = entry.isIntersecting;
          if (!isHeroVisible) {
            if (stickyBar) {
              stickyBar.classList.add('is-visible');
              stickyBar.setAttribute('aria-hidden', 'false');
            }
            if (fab) {
              fab.style.display = 'inline-flex';
              fab.style.opacity = '1';
              fab.style.pointerEvents = 'auto';
            }
          } else {
            if (stickyBar) {
              stickyBar.classList.remove('is-visible');
              stickyBar.setAttribute('aria-hidden', 'true');
            }
            if (fab) {
              fab.style.opacity = '0';
              fab.style.pointerEvents = 'none';
            }
          }
        });
      }, { threshold: 0.1 });

      heroObserver.observe(heroFrame);
    }

    // 5. Active Link Spy (IntersectionObserver)
    var spySections = [
      { id: 'atas', links: queryAll('a[href="#atas"]') },
      { id: 'harga', links: queryAll('a[href="#harga"]') },
      { id: 'cerita', links: queryAll('a[href="#cerita"]') },
      { id: 'faq', links: queryAll('a[href="#faq"]') }
    ];

    if ('IntersectionObserver' in window) {
      var navObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var targetId = entry.target.id;
            spySections.forEach(function (s) {
              if (s.id === targetId) {
                s.links.forEach(function (l) { l.classList.add('is-active'); });
              } else {
                s.links.forEach(function (l) { l.classList.remove('is-active'); });
              }
            });
          }
        });
      }, { rootMargin: '-20% 0px -60% 0px' });

      spySections.forEach(function (s) {
        var el = document.getElementById(s.id);
        if (el) navObserver.observe(el);
      });
    }

    // 6. Smooth Scrolling for Anchor Links
    var allAnchorLinks = queryAll('a[href^="#"]');
    allAnchorLinks.forEach(function (anchor) {
      anchor.addEventListener('click', function (e) {
        var targetId = this.getAttribute('href');
        if (!targetId || targetId === '#' || targetId.length < 2) return;

        var targetEl = document.querySelector(targetId);
        if (targetEl) {
          e.preventDefault();
          var offset = 80;
          var bodyRect = document.body.getBoundingClientRect().top;
          var elementRect = targetEl.getBoundingClientRect().top;
          var elementPosition = elementRect - bodyRect;
          var offsetPosition = elementPosition - offset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });

          if (history.pushState) {
            history.pushState(null, null, targetId);
          }
        }
      });
    });

    // 7. Desktop Subtle Mouse Parallax (Props)
    var heroEl = query('.mg-hero');
    var parallaxProps = queryAll('.mg-prop, .mg-stage__product');
    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (heroEl && !prefersReducedMotion && window.innerWidth >= 1024) {
      heroEl.addEventListener('mousemove', function (e) {
        var rect = heroEl.getBoundingClientRect();
        var relX = (e.clientX - rect.left) / rect.width - 0.5;
        var relY = (e.clientY - rect.top) / rect.height - 0.5;

        parallaxProps.forEach(function (prop, idx) {
          var factor = (idx % 3 + 1) * 3; // Max ~12px
          var moveX = relX * factor;
          var moveY = relY * factor;
          prop.style.transform = 'translate(' + moveX + 'px, ' + moveY + 'px)';
        });
      });

      heroEl.addEventListener('mouseleave', function () {
        parallaxProps.forEach(function (prop) {
          prop.style.transform = '';
        });
      });
    }

    // 8. Global Escape Key Listener for Overlays
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' || e.key === 'Esc') {
        if (drawer && drawer.classList.contains('is-open')) {
          closeDrawer(true);
        }
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initManggoes);
  } else {
    initManggoes();
  }
})();

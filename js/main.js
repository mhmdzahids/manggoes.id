/**
 * Manggoes Interactive Behavior
 * Scoped to .mg namespace, zero dependencies, resilient to partial rendering & double initialization
 * Aligned with MANGGOES Official Website Brief & Brand Guidelines
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

        // Optional: close other accordion items for clean single expansion
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

    // 3. ScrollSpy & Sticky Header Styling
    var header = query('.mg-header');
    var navLinks = queryAll('.mg-nav__link');
    var sections = [];

    navLinks.forEach(function (link) {
      var href = link.getAttribute('href');
      if (href && href.startsWith('#') && href.length > 1) {
        var secEl = query(href) || document.querySelector(href);
        if (secEl) {
          sections.push({ id: href.substring(1), link: link, element: secEl });
        }
      }
    });

    function onScroll() {
      var scrollY = window.pageYOffset || document.documentElement.scrollTop;

      // Header shadow elevation
      if (header) {
        if (scrollY > 40) {
          header.classList.add('is-scrolled');
        } else {
          header.classList.remove('is-scrolled');
        }
      }

      // ScrollSpy active link detection
      var scrollPos = scrollY + 160;
      var activeFound = false;

      for (var i = sections.length - 1; i >= 0; i--) {
        var sec = sections[i];
        var top = sec.element.offsetTop;
        var height = sec.element.offsetHeight;

        if (scrollPos >= top && scrollPos < top + height) {
          navLinks.forEach(function (l) { l.classList.remove('is-active'); });
          sec.link.classList.add('is-active');
          activeFound = true;
          break;
        }
      }

      if (!activeFound && scrollY < 200) {
        navLinks.forEach(function (l) { l.classList.remove('is-active'); });
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // 4. Smooth Anchor Scrolling with Header Offset
    var allAnchorLinks = queryAll('a[href^="#"]');
    allAnchorLinks.forEach(function (anchor) {
      anchor.addEventListener('click', function (e) {
        var targetId = this.getAttribute('href');
        if (!targetId || targetId === '#' || targetId.length < 2) return;

        var targetEl = query(targetId) || document.querySelector(targetId);
        if (targetEl) {
          e.preventDefault();
          var offset = 90; // Approximate height of floating sticky navbar
          var bodyRect = document.body.getBoundingClientRect().top;
          var elementRect = targetEl.getBoundingClientRect().top;
          var elementPosition = elementRect - bodyRect;
          var offsetPosition = elementPosition - offset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });

          // Update URL hash without jump
          if (history.pushState) {
            history.pushState(null, null, targetId);
          }
        }
      });
    });

    // 5. Global Escape Key Listener for Overlays
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

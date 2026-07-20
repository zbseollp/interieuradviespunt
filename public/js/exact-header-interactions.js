/**
 * Exact Elementor header interactions: mobile nav + full-screen search.
 * Search opens/closes like Elementor Pro full_screen skin; click outside or Esc closes.
 */
(function () {
  if (window.__exactHeaderReady) return;
  window.__exactHeaderReady = true;

  function initMenus() {
    document.querySelectorAll('.elementor-menu-toggle').forEach((btn) => {
      if (btn.dataset.menuReady) return;
      btn.dataset.menuReady = '1';

      btn.addEventListener('click', () => {
        const wrapper = btn.closest('.elementor-widget-nav-menu');
        btn.classList.toggle('elementor-active');
        btn.setAttribute('aria-expanded', String(btn.classList.contains('elementor-active')));
        wrapper?.classList.toggle('elementor-nav-menu--stretch-yes');
        const dropdown = wrapper?.querySelector('nav.elementor-nav-menu--dropdown');
        dropdown?.classList.toggle('elementor-menu-open');
        if (dropdown) {
          const open = btn.classList.contains('elementor-active');
          dropdown.style.maxHeight = open ? '100vh' : '';
          dropdown.style.visibility = open ? 'visible' : '';
          dropdown.style.opacity = open ? '1' : '';
          dropdown.style.display = open ? 'block' : '';
        }
      });
    });

    // Desktop hover highlight + mobile nested submenu toggle
    document
      .querySelectorAll('.elementor-nav-menu--main > .elementor-nav-menu > .menu-item-has-children')
      .forEach((item) => {
        if (item.dataset.submenuReady) return;
        item.dataset.submenuReady = '1';
        item.addEventListener('mouseenter', () => item.classList.add('highlighted'));
        item.addEventListener('mouseleave', () => item.classList.remove('highlighted'));
      });

    document
      .querySelectorAll(
        'nav.elementor-nav-menu--dropdown .menu-item-has-children > a'
      )
      .forEach((link) => {
        if (link.dataset.submenuToggleReady) return;
        link.dataset.submenuToggleReady = '1';
        link.addEventListener('click', (e) => {
          // Only intercept when burger panel is in use (narrow screens)
          if (window.matchMedia('(min-width: 1025px)').matches) return;
          const item = link.parentElement;
          if (!item?.querySelector(':scope > .sub-menu')) return;
          e.preventDefault();
          item.classList.toggle('is-open');
        });
      });
  }

  function initSearch() {
    document.querySelectorAll('.elementor-search-form').forEach((form) => {
      if (form.dataset.searchReady) return;
      form.dataset.searchReady = '1';

      const toggle = form.querySelector('.elementor-search-form__toggle');
      const container = form.querySelector('.elementor-search-form__container');
      const input = form.querySelector('.elementor-search-form__input');
      const closeBtn = form.querySelector(
        '.dialog-lightbox-close-button, .dialog-close-button'
      );

      if (!toggle || !container) return;

      // Point search at local site root (static export).
      if (form.getAttribute('action')?.includes('interieuradviespunt.nl')) {
        form.setAttribute('action', '/');
      }

      const isOpen = () =>
        container.classList.contains('elementor-search-form--full-screen');

      const open = () => {
        container.classList.add('elementor-search-form--full-screen');
        form.classList.add('elementor-active');
        document.documentElement.classList.add('elementor-search-open');
        document.body.style.overflow = 'hidden';
        window.setTimeout(() => input?.focus(), 40);
      };

      const close = () => {
        if (!isOpen()) return;
        container.classList.remove('elementor-search-form--full-screen');
        form.classList.remove('elementor-active');
        document.documentElement.classList.remove('elementor-search-open');
        document.body.style.overflow = '';
        input?.blur();
      };

      const toggleOpen = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isOpen()) close();
        else open();
      };

      toggle.addEventListener('click', toggleOpen);
      toggle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') toggleOpen(e);
      });

      closeBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        close();
      });

      // Click anywhere on the dark overlay (except the input) closes search.
      container.addEventListener('click', (e) => {
        if (!isOpen()) return;
        const target = e.target;
        if (target instanceof Element && target.closest('input, textarea, label')) {
          return;
        }
        close();
      });

      // Stop input clicks from bubbling to container close (safety).
      input?.addEventListener('click', (e) => e.stopPropagation());

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') close();
      });
    });
  }

  function init() {
    initMenus();
    initSearch();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

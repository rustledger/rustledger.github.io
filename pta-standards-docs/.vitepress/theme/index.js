import DefaultTheme from 'vitepress/theme';
import './custom.css';

export default {
  extends: DefaultTheme,
  enhanceApp({ app, router, siteData }) {
    if (typeof window !== 'undefined') {
      const setupTheme = () => {
        document.documentElement.classList.add('dark');

        const titleLink = document.querySelector('.VPNavBarTitle .title');
        if (titleLink && !titleLink.dataset.customized) {
          titleLink.dataset.customized = 'true';

          const logoSvg = `<svg width="24" height="24" viewBox="0 0 24 24" style="margin-right: 8px; vertical-align: middle;">
            <text x="2" y="18" font-family="monospace" font-size="16" font-weight="bold">
              <tspan fill="#f97316">P</tspan><tspan fill="white">S</tspan>
            </text>
          </svg>`;

          titleLink.innerHTML =
            logoSvg +
            '<span><span style="color:#f97316;">PTA</span> Standards</span>';
        }

        const navBar = document.querySelector('.VPNav');
        if (navBar && !document.querySelector('.secondary-nav')) {
          const secondaryNav = document.createElement('div');
          secondaryNav.className = 'secondary-nav';
          secondaryNav.innerHTML = `
            <div class="secondary-nav-content">
              <a href="https://rustledger.github.io/" class="secondary-nav-link">rustledger</a>
              <span class="secondary-nav-separator">/</span>
              <a href="https://rustledger.github.io/rustfava/" class="secondary-nav-link">rustfava</a>
              <span class="secondary-nav-separator">/</span>
              <span class="secondary-nav-current">pta-standards</span>
            </div>
          `;
          navBar.parentNode.insertBefore(secondaryNav, navBar);
        }
      };

      setupTheme();
      router.onAfterRouteChanged = () => {
        setTimeout(setupTheme, 50);
      };
      setTimeout(setupTheme, 100);
    }
  },
};

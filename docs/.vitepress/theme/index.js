import DefaultTheme from 'vitepress/theme';
import GitHubStars from './GitHubStars.vue';
import InstallTabs from './InstallTabs.vue';
import BenchmarkTable from './BenchmarkTable.vue';
import FeatureGrid from './FeatureGrid.vue';
import './custom.css';

export default {
    extends: DefaultTheme,
    enhanceApp({ app, router }) {
        app.component('GitHubStars', GitHubStars);
        app.component('InstallTabs', InstallTabs);
        app.component('BenchmarkTable', BenchmarkTable);
        app.component('FeatureGrid', FeatureGrid);

        // Add styled title, logo, and secondary nav after navigation
        if (typeof window !== 'undefined') {
            const updateUI = () => {
                setTimeout(() => {
                    // Update title with logo
                    const titleLink = document.querySelector('.VPNavBarTitle a.title');
                    if (titleLink && !titleLink.dataset.styled) {
                        const logoSvg = `<svg style="width:24px;height:24px;border-radius:4px;margin-right:8px;flex-shrink:0;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="#0a0a0a"/><text x="50" y="68" font-size="50" font-family="system-ui" font-weight="bold" text-anchor="middle"><tspan fill="#f97316">r</tspan><tspan fill="white">l</tspan></text></svg>`;
                        titleLink.style.display = 'flex';
                        titleLink.style.alignItems = 'center';
                        titleLink.innerHTML =
                            logoSvg + '<span><span style="color:#f97316;">rust</span>ledger</span>';
                        titleLink.dataset.styled = 'true';
                    }

                    // Add secondary nav bar
                    if (!document.querySelector('.secondary-nav')) {
                        const nav = document.querySelector('.VPNav');
                        if (nav) {
                            const secondaryNav = document.createElement('div');
                            secondaryNav.className = 'secondary-nav';
                            secondaryNav.innerHTML = `
                                <div class="secondary-nav-content">
                                    <div class="secondary-nav-links">
                                        <a href="https://rustledger.github.io/" class="secondary-link"><span style="color:#f97316;">rust</span>ledger</a>
                                        <a href="https://rustledger.github.io/rustfava" class="secondary-link"><span style="color:#f97316;">rust</span>fava</a>
                                        <a href="https://rustledger.github.io/pta-standards/" class="secondary-link"><span style="color:#f97316;">PTA</span> Standards</a>
                                    </div>
                                </div>
                            `;
                            nav.parentNode.insertBefore(secondaryNav, nav);
                        }
                    }
                }, 0);
            };

            router.onAfterRouteChanged = updateUI;
            updateUI();
        }
    },
};

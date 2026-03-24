import DefaultTheme from 'vitepress/theme';
import Layout from './Layout.vue';
import GitHubStars from './GitHubStars.vue';
import FeatureGrid from './FeatureGrid.vue';
import InstallTabs from './InstallTabs.vue';
import './custom.css';

export default {
    extends: DefaultTheme,
    Layout,
    enhanceApp({ app }) {
        app.component('GitHubStars', GitHubStars);
        app.component('FeatureGrid', FeatureGrid);
        app.component('InstallTabs', InstallTabs);
    },
};

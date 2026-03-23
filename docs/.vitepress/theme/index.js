import DefaultTheme from 'vitepress/theme';
import Layout from './Layout.vue';
import GitHubStars from './GitHubStars.vue';
import InstallTabs from './InstallTabs.vue';
import BenchmarkTable from './BenchmarkTable.vue';
import FeatureGrid from './FeatureGrid.vue';
import './custom.css';

export default {
    extends: DefaultTheme,
    Layout,
    enhanceApp({ app }) {
        app.component('GitHubStars', GitHubStars);
        app.component('InstallTabs', InstallTabs);
        app.component('BenchmarkTable', BenchmarkTable);
        app.component('FeatureGrid', FeatureGrid);
    },
};

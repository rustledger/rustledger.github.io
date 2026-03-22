import DefaultTheme from 'vitepress/theme';
import GitHubStars from './GitHubStars.vue';
import './custom.css';

export default {
    extends: DefaultTheme,
    enhanceApp({ app }) {
        app.component('GitHubStars', GitHubStars);
    },
};

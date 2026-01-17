import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',
    use: {
        baseURL: 'http://localhost:8080',
        trace: 'on-first-retry',
    },
    webServer: {
        command: 'bun run preview',
        url: 'http://localhost:8080',
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
    },
    projects: [
        {
            name: 'chromium',
            use: { browserName: 'chromium' },
        },
        {
            name: 'firefox',
            use: { browserName: 'firefox' },
        },
        {
            name: 'webkit',
            use: { browserName: 'webkit' },
        },
        {
            name: 'mobile-chrome',
            use: {
                browserName: 'chromium',
                viewport: { width: 375, height: 667 },
                isMobile: true,
            },
        },
    ],
});

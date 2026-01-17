// @ts-check
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Playground', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('loads the page with correct title', async ({ page }) => {
        await expect(page).toHaveTitle(/rustledger/);
    });

    test('displays the editor panel', async ({ page }) => {
        const editor = page.locator('#editor-panel');
        await expect(editor).toBeVisible();
    });

    test('shows example tabs', async ({ page }) => {
        const tabs = page.locator('.example-tab');
        await expect(tabs).toHaveCount(7);

        // Check tab labels
        await expect(tabs.nth(0)).toContainText('Budget');
        await expect(tabs.nth(1)).toContainText('Stocks');
        await expect(tabs.nth(2)).toContainText('Crypto');
    });

    test('switches between examples', async ({ page }) => {
        // Click on Stocks tab
        await page.click('.example-tab[data-example="stocks"]');

        // Wait for editor content to update
        await page.waitForTimeout(500);

        // Check that stocks tab is active
        const stocksTab = page.locator('.example-tab[data-example="stocks"]');
        await expect(stocksTab).toHaveClass(/active/);

        // Editor should contain stocks-related content
        const editorContent = page.locator('.cm-content');
        await expect(editorContent).toContainText('Brokerage');
    });

    test('displays output tabs', async ({ page }) => {
        const queryTab = page.locator('.output-tab[data-tab="query"]');
        const pluginTab = page.locator('.output-tab[data-tab="plugin"]');
        const statusTab = page.locator('#status-tab');

        await expect(queryTab).toBeVisible();
        await expect(pluginTab).toBeVisible();
        await expect(statusTab).toBeVisible();
    });

    test('shows validation status', async ({ page }) => {
        // Wait for WASM to load and validate
        const statusTab = page.locator('#status-tab');

        // Should eventually show valid or error status
        await expect(statusTab).toContainText(/Valid|error/i, { timeout: 10000 });
    });

    test('query presets are clickable', async ({ page }) => {
        // Click on Balances query preset
        const balancesBtn = page.locator('.query-btn[data-query="BALANCES"]');
        await expect(balancesBtn).toBeVisible();

        await balancesBtn.click();

        // Query input should be updated
        const queryInput = page.locator('#query-text');
        await expect(queryInput).toHaveValue('BALANCES');
    });

    test('can type in query input', async ({ page }) => {
        const queryInput = page.locator('#query-text');

        await queryInput.fill('SELECT account, balance');
        await expect(queryInput).toHaveValue('SELECT account, balance');
    });

    test('format button exists and is clickable', async ({ page }) => {
        const formatBtn = page.getByRole('button', { name: /format/i });
        await expect(formatBtn).toBeVisible();
    });

    test('share button copies URL', async ({ page, context }) => {
        // Grant clipboard permissions
        await context.grantPermissions(['clipboard-read', 'clipboard-write']);

        const shareBtn = page.locator('button[onclick="shareUrl()"]');
        await expect(shareBtn).toBeVisible();

        await shareBtn.click();

        // Should show toast
        const toast = page.locator('#toast');
        await expect(toast).toBeVisible({ timeout: 2000 });
        await expect(toast).toContainText(/copied/i);
    });

    test('download button triggers download', async ({ page }) => {
        const downloadPromise = page.waitForEvent('download');
        const downloadBtn = page.locator('button[onclick="downloadLedger()"]');

        await downloadBtn.click();
        const download = await downloadPromise;

        expect(download.suggestedFilename()).toBe('ledger.beancount');
    });

    test('plugin toggles work', async ({ page }) => {
        // Switch to plugins tab
        await page.click('.output-tab[data-tab="plugin"]');

        // Wait for plugin options to appear
        const pluginOptions = page.locator('#plugin-options');
        await expect(pluginOptions).toBeVisible();

        // Find a plugin button
        const pluginBtn = page.locator('.plugin-btn[data-plugin="noduplicates"]');
        await expect(pluginBtn).toBeVisible();

        // Click to toggle
        await pluginBtn.click();

        // Button should change state (class changes)
        await page.waitForTimeout(300);
    });

    test('keyboard navigation works', async ({ page }) => {
        // Tab to first interactive element
        await page.keyboard.press('Tab');

        // Should focus skip link first
        const skipLink = page.locator('a[href="#playground"]');
        await expect(skipLink).toBeFocused();
    });

    test('skip link navigates to playground', async ({ page }) => {
        // Focus and activate skip link
        await page.keyboard.press('Tab');
        await page.keyboard.press('Enter');

        // Should scroll to playground section
        const playground = page.locator('#playground');
        await expect(playground).toBeInViewport();
    });

    test('error example shows errors', async ({ page }) => {
        // Click on errors tab
        await page.click('.example-tab[data-example="errors"]');

        // Wait for validation
        await page.waitForTimeout(1000);

        // Status should show errors
        const statusTab = page.locator('#status-tab');
        await expect(statusTab).toContainText(/error/i, { timeout: 10000 });
    });

    test('resizer can be dragged', async ({ page }) => {
        const resizer = page.locator('#resizer');
        const editorPanel = page.locator('#editor-panel');

        await expect(resizer).toBeVisible();

        // Get initial height
        const initialHeight = await editorPanel.evaluate((el) => el.offsetHeight);

        // Drag resizer down
        const resizerBox = await resizer.boundingBox();
        if (resizerBox) {
            await page.mouse.move(resizerBox.x + resizerBox.width / 2, resizerBox.y);
            await page.mouse.down();
            await page.mouse.move(resizerBox.x + resizerBox.width / 2, resizerBox.y + 50);
            await page.mouse.up();
        }

        // Height should have changed
        const newHeight = await editorPanel.evaluate((el) => el.offsetHeight);
        expect(newHeight).toBeGreaterThan(initialHeight);
    });
});

test.describe('Accessibility', () => {
    test('has no automatically detectable a11y issues on load', async ({ page }) => {
        await page.goto('/');

        // Wait for page to be fully loaded
        await page.waitForLoadState('networkidle');

        // Run axe accessibility scan
        const accessibilityScanResults = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
            .exclude('.cm-editor') // Exclude CodeMirror (has its own a11y)
            .analyze();

        expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('playground section passes a11y checks', async ({ page }) => {
        await page.goto('/#playground');
        await page.waitForLoadState('networkidle');

        const accessibilityScanResults = await new AxeBuilder({ page })
            .include('#playground')
            .exclude('.cm-editor')
            .analyze();

        expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('all images have alt text', async ({ page }) => {
        await page.goto('/');

        const images = page.locator('img');
        const count = await images.count();

        for (let i = 0; i < count; i++) {
            const img = images.nth(i);
            const alt = await img.getAttribute('alt');
            expect(alt).toBeTruthy();
        }
    });

    test('interactive elements are focusable', async ({ page }) => {
        await page.goto('/');

        // Check that buttons are focusable
        const buttons = page.locator('button:visible').first();
        await buttons.focus();
        await expect(buttons).toBeFocused();
    });

    test('skip link exists and works', async ({ page }) => {
        await page.goto('/');

        const skipLink = page.locator('a[href="#playground"]');
        await expect(skipLink).toBeAttached();

        // Focus and use skip link
        await page.keyboard.press('Tab');
        await expect(skipLink).toBeFocused();
    });
});

test.describe('Mobile', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('renders correctly on mobile', async ({ page }) => {
        await page.goto('/');

        // Page should load
        await expect(page).toHaveTitle(/rustledger/);

        // Editor should be visible
        const editor = page.locator('#editor-panel');
        await expect(editor).toBeVisible();

        // Example tabs should wrap
        const tabs = page.locator('.example-tabs');
        await expect(tabs).toBeVisible();
    });

    test('nav is usable on mobile', async ({ page }) => {
        await page.goto('/');

        const nav = page.locator('nav');
        await expect(nav).toBeVisible();

        // Logo should be visible
        const logo = page.locator('nav a[href="/"]');
        await expect(logo).toBeVisible();
    });
});

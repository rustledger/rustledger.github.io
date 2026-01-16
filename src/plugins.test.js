import { describe, it, expect } from 'vitest';
import { getEnabledPlugins, togglePlugin, availablePlugins } from './plugins.js';

describe('getEnabledPlugins', () => {
    it('extracts single plugin', () => {
        const content = 'plugin "noduplicates"';
        const plugins = getEnabledPlugins(content);
        expect(plugins.has('noduplicates')).toBe(true);
        expect(plugins.size).toBe(1);
    });

    it('extracts multiple plugins', () => {
        const content = `
            option "title" "Test"
            plugin "noduplicates"
            plugin "implicit_prices"
            plugin "leafonly"
        `;
        const plugins = getEnabledPlugins(content);
        expect(plugins.has('noduplicates')).toBe(true);
        expect(plugins.has('implicit_prices')).toBe(true);
        expect(plugins.has('leafonly')).toBe(true);
        expect(plugins.size).toBe(3);
    });

    it('ignores commented plugins', () => {
        const content = `
            plugin "active"
            ; plugin "commented"
            ;plugin "also-commented"
        `;
        const plugins = getEnabledPlugins(content);
        expect(plugins.has('active')).toBe(true);
        expect(plugins.has('commented')).toBe(false);
        expect(plugins.has('also-commented')).toBe(false);
        expect(plugins.size).toBe(1);
    });

    it('returns empty set for no plugins', () => {
        const content = `
            option "title" "Test"
            2024-01-01 open Assets:Bank USD
        `;
        const plugins = getEnabledPlugins(content);
        expect(plugins.size).toBe(0);
    });

    it('handles plugins with config arguments', () => {
        const content = 'plugin "unrealized" "Income:Gains"';
        const plugins = getEnabledPlugins(content);
        expect(plugins.has('unrealized')).toBe(true);
    });

    it('handles leading whitespace', () => {
        const content = '    plugin "indented"';
        const plugins = getEnabledPlugins(content);
        expect(plugins.has('indented')).toBe(true);
    });
});

describe('togglePlugin', () => {
    it('adds plugin when not present', () => {
        const content = 'option "title" "Test"';
        const result = togglePlugin('noduplicates', content);
        expect(result).toContain('plugin "noduplicates"');
    });

    it('removes plugin when present', () => {
        const content = `
option "title" "Test"
plugin "noduplicates"

2024-01-01 open Assets:Bank USD`;
        const result = togglePlugin('noduplicates', content);
        expect(result).not.toContain('plugin "noduplicates"');
    });

    it('inserts plugin after existing options and plugins', () => {
        const content = `option "title" "Test"
option "operating_currency" "USD"
plugin "existing"

2024-01-01 open Assets:Bank USD`;
        const result = togglePlugin('new_plugin', content);
        const lines = result.split('\n');
        const pluginIndex = lines.findIndex((l) => l.includes('plugin "new_plugin"'));
        const existingIndex = lines.findIndex((l) => l.includes('plugin "existing"'));
        expect(pluginIndex).toBeGreaterThan(existingIndex);
    });

    it('does not leave triple newlines after removal', () => {
        const content = `option "title" "Test"
plugin "toremove"

2024-01-01 open Assets:Bank USD`;
        const result = togglePlugin('toremove', content);
        expect(result).not.toContain('\n\n\n');
    });

    it('preserves other content when toggling', () => {
        const content = `option "title" "Test"
plugin "keep_me"

2024-01-01 open Assets:Bank USD`;
        const result = togglePlugin('new_plugin', content);
        expect(result).toContain('plugin "keep_me"');
        expect(result).toContain('2024-01-01 open Assets:Bank USD');
    });
});

describe('availablePlugins', () => {
    it('contains expected plugins', () => {
        expect(availablePlugins).toContain('noduplicates');
        expect(availablePlugins).toContain('implicit_prices');
        expect(availablePlugins).toContain('leafonly');
        expect(availablePlugins).toContain('pedantic');
    });

    it('has no duplicates', () => {
        const uniquePlugins = new Set(availablePlugins);
        expect(uniquePlugins.size).toBe(availablePlugins.length);
    });
});

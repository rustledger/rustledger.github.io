// Plugin management functionality

/**
 * Get enabled plugins from beancount content
 * @param {string} content
 * @returns {Set<string>}
 */
export function getEnabledPlugins(content) {
    const plugins = new Set();
    // Match plugin directives, allowing leading whitespace but not comments
    const regex = /^\s*plugin\s+"([^"]+)"/gm;
    let match;
    while ((match = regex.exec(content)) !== null) {
        plugins.add(match[1]);
    }
    return plugins;
}

/**
 * Update plugin button styling based on enabled state
 * @param {string} content - Current editor content
 */
export function updatePluginButtons(content) {
    const enabled = getEnabledPlugins(content);

    document.querySelectorAll('.plugin-btn').forEach((btn) => {
        const htmlBtn = /** @type {HTMLElement} */ (btn);
        const plugin = htmlBtn.dataset.plugin;
        if (plugin && enabled.has(plugin)) {
            htmlBtn.className =
                'plugin-btn px-3 py-1 text-xs rounded transition bg-green-900/50 text-green-300 hover:bg-green-800/50';
            htmlBtn.setAttribute('aria-pressed', 'true');
        } else {
            htmlBtn.className =
                'plugin-btn px-3 py-1 text-xs rounded transition bg-red-900/30 text-red-300/70 hover:bg-red-800/40';
            htmlBtn.setAttribute('aria-pressed', 'false');
        }
    });
}

/**
 * Toggle a plugin on or off in the editor content
 * @param {string} pluginName - Name of the plugin to toggle
 * @param {string} content - Current editor content
 * @returns {string} - Updated content
 */
export function togglePlugin(pluginName, content) {
    const pluginLine = `plugin "${pluginName}"`;
    const regex = new RegExp(`^plugin\\s+"${pluginName}".*$`, 'm');

    if (regex.test(content)) {
        // Remove the plugin line
        return content
            .replace(regex, '')
            .replace(/\n\n\n+/g, '\n\n')
            .trim();
    } else {
        // Add plugin after options/at the start
        const lines = content.split('\n');
        let insertIndex = 0;

        // Find where to insert (after options and other plugins)
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith('option ') || lines[i].startsWith('plugin ')) {
                insertIndex = i + 1;
            } else if (lines[i].trim() && !lines[i].startsWith(';')) {
                break;
            }
        }

        lines.splice(insertIndex, 0, pluginLine);
        return lines.join('\n');
    }
}

/** List of available plugins */
export const availablePlugins = [
    'implicit_prices',
    'auto_accounts',
    'check_commodity',
    'auto_tag',
    'leafonly',
    'noduplicates',
    'onecommodity',
    'unique_prices',
    'check_closing',
    'close_tree',
    'coherent_cost',
    'sellgains',
    'pedantic',
    'unrealized',
];

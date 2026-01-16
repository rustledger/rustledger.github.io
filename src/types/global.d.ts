// Global type declarations

type ExampleName = 'simple' | 'stocks' | 'crypto' | 'travel' | 'business' | 'errors';

// Extend Window with our global functions
interface Window {
    loadExample: (name: ExampleName) => void;
    switchTab: (tabName: string) => void;
    runFormat: () => void;
    runQueryPreset: (queryStr: string) => void;
    runQueryFromInput: () => void;
    togglePlugin: (pluginName: string) => void;
    copyOutput: () => void;
    shareUrl: () => void;
    downloadLedger: () => void;
    uploadLedger: (event: Event) => void;
    showShortcutsModal: () => void;
    hideShortcutsModal: () => void;
    copyInstallCommand: (command: string, button: HTMLElement) => void;
    goToQueryPage: (page: number) => void;
    showToast: (message: string, duration?: number) => void;
}

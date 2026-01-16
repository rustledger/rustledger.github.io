import { describe, it, expect, afterEach } from 'vitest';
import { detectOS } from './install.js';

describe('detectOS', () => {
    const originalNavigator = globalThis.navigator;

    afterEach(() => {
        // Restore original navigator
        Object.defineProperty(globalThis, 'navigator', {
            value: originalNavigator,
            writable: true,
        });
    });

    /**
     * Helper to mock navigator properties
     * @param {{ userAgent?: string, platform?: string }} props
     */
    function mockNavigator(props) {
        Object.defineProperty(globalThis, 'navigator', {
            value: {
                userAgent: props.userAgent || '',
                platform: props.platform || '',
            },
            writable: true,
        });
    }

    it('detects macOS and recommends homebrew', () => {
        mockNavigator({ platform: 'MacIntel', userAgent: 'Mozilla/5.0 (Macintosh)' });
        const result = detectOS();
        expect(result.os).toBe('macos');
        expect(result.recommendedTab).toBe('homebrew');
    });

    it('detects macOS from userAgent alone', () => {
        mockNavigator({ platform: '', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X)' });
        const result = detectOS();
        expect(result.os).toBe('macos');
        expect(result.recommendedTab).toBe('homebrew');
    });

    it('detects Windows and recommends binary', () => {
        mockNavigator({ platform: 'Win32', userAgent: 'Mozilla/5.0 (Windows NT 10.0)' });
        const result = detectOS();
        expect(result.os).toBe('windows');
        expect(result.recommendedTab).toBe('binary');
    });

    it('detects Linux and recommends binary', () => {
        mockNavigator({ platform: 'Linux x86_64', userAgent: 'Mozilla/5.0 (X11; Linux)' });
        const result = detectOS();
        expect(result.os).toBe('linux');
        expect(result.recommendedTab).toBe('binary');
    });

    it('detects Arch Linux and recommends aur', () => {
        mockNavigator({ platform: 'Linux', userAgent: 'Mozilla/5.0 (X11; Linux; arch)' });
        const result = detectOS();
        expect(result.os).toBe('linux-arch');
        expect(result.recommendedTab).toBe('aur');
    });

    it('detects Manjaro as Arch-based', () => {
        mockNavigator({ platform: 'Linux', userAgent: 'Mozilla/5.0 (X11; Linux; manjaro)' });
        const result = detectOS();
        expect(result.os).toBe('linux-arch');
        expect(result.recommendedTab).toBe('aur');
    });

    it('detects NixOS and recommends nix', () => {
        mockNavigator({ platform: 'Linux', userAgent: 'Mozilla/5.0 (X11; Linux; nixos)' });
        const result = detectOS();
        expect(result.os).toBe('linux-nix');
        expect(result.recommendedTab).toBe('nix');
    });

    it('returns unknown with cargo for unrecognized OS', () => {
        mockNavigator({ platform: 'Unknown', userAgent: 'SomeOtherBrowser' });
        const result = detectOS();
        expect(result.os).toBe('unknown');
        expect(result.recommendedTab).toBe('cargo');
    });

    it('handles missing platform gracefully', () => {
        mockNavigator({ userAgent: 'Mozilla/5.0' });
        const result = detectOS();
        // Should not throw and return some result
        expect(result).toHaveProperty('os');
        expect(result).toHaveProperty('recommendedTab');
    });
});

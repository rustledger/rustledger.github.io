<script setup>
import { ref, onMounted } from 'vue';

const activeTab = ref('binary');
const recommendedTab = ref('binary');

const tabs = [
    { id: 'binary', name: 'Download', icon: 'binary' },
    { id: 'homebrew', name: 'Homebrew', icon: 'homebrew' },
    { id: 'aur', name: 'AUR', icon: 'aur' },
    { id: 'nix', name: 'Nix', icon: 'nix' },
];

function detectOS() {
    if (typeof navigator === 'undefined') return { os: 'unknown', recommendedTab: 'binary' };

    const userAgent = navigator.userAgent.toLowerCase();
    const platform = navigator.platform?.toLowerCase() || '';

    if (
        platform.includes('mac') ||
        userAgent.includes('macintosh') ||
        userAgent.includes('mac os')
    ) {
        return { os: 'macos', recommendedTab: 'homebrew' };
    }
    if (platform.includes('win') || userAgent.includes('windows')) {
        return { os: 'windows', recommendedTab: 'binary' };
    }
    if (platform.includes('linux') || userAgent.includes('linux')) {
        if (userAgent.includes('arch') || userAgent.includes('manjaro')) {
            return { os: 'linux-arch', recommendedTab: 'aur' };
        }
        if (userAgent.includes('nixos')) {
            return { os: 'linux-nix', recommendedTab: 'nix' };
        }
        return { os: 'linux', recommendedTab: 'binary' };
    }
    return { os: 'unknown', recommendedTab: 'binary' };
}

onMounted(() => {
    const { recommendedTab: recommended } = detectOS();
    recommendedTab.value = recommended;
    activeTab.value = recommended;
});

function selectTab(tabId) {
    activeTab.value = tabId;
}

async function copyCommand(command) {
    try {
        await navigator.clipboard.writeText(command);
    } catch (e) {
        console.error('Failed to copy:', e);
    }
}
</script>

<template>
    <div class="install-section">
        <div class="install-tabs">
            <button
                v-for="tab in tabs"
                :key="tab.id"
                :class="['install-tab', { active: activeTab === tab.id }]"
                @click="selectTab(tab.id)"
            >
                <!-- Binary (download) icon -->
                <svg
                    v-if="tab.icon === 'binary'"
                    class="tab-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                </svg>
                <!-- Homebrew icon -->
                <svg
                    v-else-if="tab.icon === 'homebrew'"
                    class="tab-icon"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                >
                    <path
                        d="M7.938 0a.214.214 0 0 0-.206.156c-.316 1.104.179 2.15.838 2.935.153.181.313.347.476.501a2.039 2.039 0 0 0-.665.02c-1.184.233-2.193.985-2.74 2.532a3.893 3.893 0 0 0-.2 1.466 1.565 1.565 0 0 0-1.156 1.504 1.59 1.59 0 0 0 1.227 1.541l.026 12.046c0 .195.1.377.264.482a.214.214 0 0 0 .008.005c.537.31 2.047.812 5.21.812 3.238 0 4.7-.678 5.181-1.04a.214.214 0 0 0 .008-.007.571.571 0 0 0 .206-.439c.002-.344.002-1.136.002-1.604a.143.143 0 0 1 .147-.144c.397.006.869.006 1.318.005a1.826 1.826 0 0 0 1.832-1.825v-5.804a1.826 1.826 0 0 0-1.825-1.826H16.56a.14.14 0 0 1-.143-.144V10.6h.007v-.001a1.573 1.573 0 0 0 1.356-1.556c0-.816-.627-1.489-1.424-1.563-.025-1.438-.437-2.126-.736-2.58a.214.214 0 0 0-.005-.007c-.364-.51-1.193-1.282-2.275-1.316-.503-.016-.842.124-1.125.254-.217.1-.42.177-.67.22.002-1.286.945-1.981.945-1.981a.214.214 0 0 0 .05-.298s-.087-.122-.21-.26c-.121-.136-.269-.294-.47-.378a.214.214 0 0 0-.079-.017.214.214 0 0 0-.145.055 4.308 4.308 0 0 0-.875 1.101 3.42 3.42 0 0 0-.133.273 3.497 3.497 0 0 0-.381-.846C9.794.978 9.063.436 8.017.016A.214.214 0 0 0 7.939 0z"
                    />
                </svg>
                <!-- AUR icon -->
                <svg
                    v-else-if="tab.icon === 'aur'"
                    class="tab-icon"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                >
                    <path d="M12 2L2 22h5l5-10 5 10h5L12 2z" />
                </svg>
                <!-- Nix icon -->
                <svg
                    v-else-if="tab.icon === 'nix'"
                    class="tab-icon"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                >
                    <path
                        d="M7.352 1.592l-1.364.002L5.32 2.75l1.557 2.713-3.137-.008-1.32 2.34H14.11l-1.353-2.332-3.192-.006-2.214-3.865zm6.175 0l-2.687.025 5.846 10.127 1.341-2.34-1.59-2.765 2.24-3.85-.683-1.182h-1.336l-1.57 2.705-1.56-2.72zm6.887 4.195l-5.846 10.125 2.696-.008 1.601-2.76 4.453.016.682-1.183-.666-1.157-3.13-.008L21.778 8.1l-1.365-2.313zM9.432 8.086l-2.696.008-1.601 2.76-4.453-.016L0 12.02l.666 1.157 3.13.008-1.575 2.71 1.365 2.315L9.432 8.086zM7.33 12.25l-.006.01-.002-.004-1.342 2.34 1.59 2.765-2.24 3.85.684 1.182H7.35l.004-.006h.001l1.567-2.698 1.558 2.72 2.688-.026-.004-.006h.01L7.33 12.25zm2.55 3.93l1.354 2.332 3.192.006 2.215 3.865 1.363-.002.668-1.156-1.557-2.713 3.137.008 1.32-2.34H9.881z"
                    />
                </svg>
                <span>{{ tab.name }}</span>
                <span v-if="recommendedTab === tab.id" class="recommended-badge">Best</span>
            </button>
        </div>

        <div class="install-content">
            <!-- Binary Panel -->
            <div v-show="activeTab === 'binary'" class="install-panel active">
                <div class="binary-options">
                    <a
                        href="https://github.com/rustledger/rustfava/releases/latest"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="binary-option"
                    >
                        <svg class="platform-icon" viewBox="0 0 24 24" fill="currentColor">
                            <path
                                d="M12.504 0c-.155 0-.315.008-.48.021-4.226.333-3.105 4.807-3.17 6.298-.076 1.092-.3 1.953-1.05 3.02-.885 1.051-2.127 2.75-2.716 4.521-.278.832-.41 1.684-.287 2.489a.424.424 0 00-.11.135c-.26.268-.45.6-.663.839-.199.199-.485.267-.797.4-.313.136-.658.269-.864.68-.09.189-.136.394-.132.602 0 .199.027.4.055.536.058.399.116.728.04.97-.249.68-.28 1.145-.106 1.484.174.334.535.47.94.601.81.2 1.91.135 2.774.6.926.466 1.866.67 2.616.47.526-.116.97-.464 1.208-.946.587-.003 1.23-.269 2.26-.334.699-.058 1.574.267 2.577.2.025.134.063.198.114.333l.003.003c.391.778 1.113 1.132 1.884 1.071.771-.06 1.592-.536 2.257-1.306.631-.765 1.683-1.084 2.378-1.503.348-.199.629-.469.649-.853.023-.4-.2-.811-.714-1.376v-.097l-.003-.003c-.17-.2-.25-.535-.338-.926-.085-.401-.182-.786-.492-1.046h-.003c-.059-.054-.123-.067-.188-.135a.357.357 0 00-.19-.064c.431-1.278.264-2.55-.173-3.694-.533-1.41-1.465-2.638-2.175-3.483-.796-1.005-1.576-1.957-1.56-3.368.026-2.152.236-6.133-3.544-6.139z"
                            />
                        </svg>
                        <div class="platform-name">Linux</div>
                        <div class="platform-arch">.AppImage / .deb</div>
                    </a>
                    <a
                        href="https://github.com/rustledger/rustfava/releases/latest"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="binary-option"
                    >
                        <svg class="platform-icon" viewBox="0 0 24 24" fill="currentColor">
                            <path
                                d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
                            />
                        </svg>
                        <div class="platform-name">macOS</div>
                        <div class="platform-arch">.dmg</div>
                    </a>
                    <a
                        href="https://github.com/rustledger/rustfava/releases/latest"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="binary-option"
                    >
                        <svg class="platform-icon" viewBox="0 0 24 24" fill="currentColor">
                            <path
                                d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"
                            />
                        </svg>
                        <div class="platform-name">Windows</div>
                        <div class="platform-arch">.msi / .exe</div>
                    </a>
                </div>
                <p class="install-note">
                    <svg class="note-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    See all releases on
                    <a
                        href="https://github.com/rustledger/rustfava/releases"
                        target="_blank"
                        rel="noopener noreferrer"
                        >GitHub Releases</a
                    >.
                </p>
            </div>

            <!-- Homebrew Panel -->
            <div v-show="activeTab === 'homebrew'" class="install-panel active">
                <div class="install-command">
                    <span class="prompt">$</span>
                    <span class="cmd"
                        ><span class="keyword">brew</span> <span class="flag">install --cask</span>
                        <span class="package">rustfava</span></span
                    >
                    <button
                        class="install-copy-btn"
                        @click="copyCommand('brew install --cask rustfava')"
                        title="Copy"
                    >
                        <svg
                            class="copy-icon"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                        </svg>
                    </button>
                </div>
                <p class="install-note">
                    <svg class="note-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    Recommended for macOS users.
                </p>
            </div>

            <!-- AUR Panel -->
            <div v-show="activeTab === 'aur'" class="install-panel active">
                <div class="install-command">
                    <span class="prompt">$</span>
                    <span class="cmd"
                        ><span class="keyword">yay</span> <span class="flag">-S</span>
                        <span class="package">rustfava-bin</span></span
                    >
                    <button
                        class="install-copy-btn"
                        @click="copyCommand('yay -S rustfava-bin')"
                        title="Copy"
                    >
                        <svg
                            class="copy-icon"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                        </svg>
                    </button>
                </div>
                <div class="install-command">
                    <span class="prompt">$</span>
                    <span class="cmd"
                        ><span class="keyword">paru</span> <span class="flag">-S</span>
                        <span class="package">rustfava-bin</span></span
                    >
                    <button
                        class="install-copy-btn"
                        @click="copyCommand('paru -S rustfava-bin')"
                        title="Copy"
                    >
                        <svg
                            class="copy-icon"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                        </svg>
                    </button>
                </div>
                <p class="install-note">
                    <svg class="note-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    For Arch Linux and derivatives.
                </p>
            </div>

            <!-- Nix Panel -->
            <div v-show="activeTab === 'nix'" class="install-panel active">
                <div class="install-command">
                    <span class="prompt">$</span>
                    <span class="cmd"
                        ><span class="keyword">nix</span> <span class="flag">run</span>
                        <span class="package">github:rustledger/rustfava</span></span
                    >
                    <button
                        class="install-copy-btn"
                        @click="copyCommand('nix run github:rustledger/rustfava')"
                        title="Copy"
                    >
                        <svg
                            class="copy-icon"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                        </svg>
                    </button>
                </div>
                <p class="install-note">
                    <svg class="note-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    Requires
                    <a
                        href="https://nixos.org/download.html"
                        target="_blank"
                        rel="noopener noreferrer"
                        >Nix with flakes</a
                    >.
                </p>
            </div>
        </div>
    </div>
</template>

<style scoped>
.install-section {
    width: 100%;
    max-width: 600px;
    margin: 0 auto;
}

.install-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    padding: 0.5rem;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-bottom: none;
    border-radius: 0.75rem 0.75rem 0 0;
    justify-content: center;
}

.install-tab {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 1rem;
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.5);
    cursor: pointer;
    border: 1px solid transparent;
    border-radius: 0.5rem;
    transition: all 0.2s;
    position: relative;
    background: transparent;
    white-space: nowrap;
}

.install-tab:hover {
    color: rgba(255, 255, 255, 0.8);
    background: rgba(255, 255, 255, 0.05);
}

.install-tab.active {
    color: white;
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.1);
}

.tab-icon {
    width: 16px;
    height: 16px;
    opacity: 0.7;
    flex-shrink: 0;
}

.install-tab.active .tab-icon {
    opacity: 1;
}

.recommended-badge {
    position: absolute;
    top: -5px;
    right: -5px;
    background: #f97316;
    color: white;
    font-size: 8px;
    padding: 0 4px;
    border-radius: 2px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.2px;
    line-height: 14px;
    box-shadow: 0 2px 6px rgba(249, 115, 22, 0.4);
}

.install-content {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0 0 0.75rem 0.75rem;
    overflow: hidden;
}

.install-panel {
    padding: 1.25rem;
    animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

.install-command {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 1rem 1.25rem;
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 0.5rem;
    font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Monaco, Consolas, monospace;
    font-size: 0.85rem;
    margin-bottom: 0.5rem;
}

.prompt {
    color: rgba(255, 255, 255, 0.4);
    user-select: none;
}

.cmd {
    flex: 1;
    display: flex;
    flex-wrap: wrap;
    gap: 0 0.4ch;
    color: rgba(255, 255, 255, 0.9);
    word-break: break-all;
}

.keyword {
    color: #c792ea;
}

.flag {
    color: #89ddff;
}

.package {
    color: #f97316;
}

.install-copy-btn {
    padding: 0.375rem;
    background: transparent;
    border: none;
    border-radius: 0.25rem;
    cursor: pointer;
    transition: all 0.2s;
    color: rgba(255, 255, 255, 0.5);
}

.install-copy-btn:hover {
    color: white;
    background: rgba(255, 255, 255, 0.1);
}

.copy-icon {
    width: 1.25rem;
    height: 1.25rem;
}

.install-note {
    margin-top: 0.375rem;
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.5);
    text-align: center;
}

.install-note a {
    color: #f97316;
    text-decoration: none;
    transition: color 0.2s;
}

.install-note a:hover {
    color: white;
}

.note-icon {
    width: 14px;
    height: 14px;
    opacity: 0.6;
    display: inline-block;
    vertical-align: middle;
    margin-right: 0.25rem;
}

.binary-options {
    display: flex;
    justify-content: center;
    gap: 1rem;
}

.binary-option {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem 1.5rem;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.5rem;
    transition: all 0.2s;
    text-decoration: none;
    min-width: 100px;
    color: inherit;
}

.binary-option:hover {
    background: rgba(0, 0, 0, 0.5);
    border-color: #f97316;
}

.platform-icon {
    width: 28px;
    height: 28px;
    opacity: 0.8;
}

.binary-option:hover .platform-icon {
    opacity: 1;
}

.platform-name {
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.9);
}

.platform-arch {
    font-size: 0.65rem;
    color: rgba(255, 255, 255, 0.5);
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}
</style>

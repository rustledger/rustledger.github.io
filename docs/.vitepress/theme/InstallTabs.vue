<script setup>
import { ref, onMounted } from 'vue';

const activeTab = ref('binary');
const recommendedTab = ref('binary');

const tabs = [
    { id: 'cargo', name: 'Cargo', icon: 'cargo' },
    { id: 'homebrew', name: 'Homebrew', icon: 'homebrew' },
    { id: 'nix', name: 'Nix Flake', icon: 'nix' },
    { id: 'copr', name: 'COPR', icon: 'copr' },
    { id: 'aur', name: 'AUR', icon: 'aur' },
    { id: 'scoop', name: 'Scoop', icon: 'scoop' },
    { id: 'docker', name: 'Docker', icon: 'docker' },
    { id: 'npm', name: 'npm', icon: 'npm' },
    { id: 'binary', name: 'Binary', icon: 'binary' },
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
        if (
            userAgent.includes('arch') ||
            userAgent.includes('manjaro') ||
            userAgent.includes('endeavour')
        ) {
            return { os: 'linux-arch', recommendedTab: 'aur' };
        }
        if (userAgent.includes('nixos')) {
            return { os: 'linux-nix', recommendedTab: 'nix' };
        }
        return { os: 'linux', recommendedTab: 'binary' };
    }
    return { os: 'unknown', recommendedTab: 'cargo' };
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
                <!-- Cargo icon -->
                <svg
                    v-if="tab.icon === 'cargo'"
                    class="tab-icon"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                >
                    <path
                        d="M23.8346 11.7033l-1.0073-.6236a13.7268 13.7268 0 00-.0283-.2936l.8656-.8069a.3483.3483 0 00-.1154-.578l-1.1066-.414a8.4958 8.4958 0 00-.087-.2856l.6904-.9587a.3462.3462 0 00-.2257-.5446l-1.1663-.1894a9.3574 9.3574 0 00-.1407-.2622l.49-1.0761a.3437.3437 0 00-.0274-.3361.3486.3486 0 00-.3006-.154l-1.1845.0416a6.7444 6.7444 0 00-.1873-.2268l.2723-1.153a.3472.3472 0 00-.417-.4172l-1.1532.2724a14.0183 14.0183 0 00-.2278-.1873l.0415-1.1845a.3442.3442 0 00-.49-.328l-1.076.491c-.0872-.0476-.1742-.0952-.2623-.1407l-.1903-1.1673A.3483.3483 0 0016.256.955l-.9597.6905a8.4867 8.4867 0 00-.2855-.086l-.414-1.1066a.3483.3483 0 00-.5781-.1154l-.8069.8666a9.2936 9.2936 0 00-.2936-.0284L12.2946.1683a.3462.3462 0 00-.5892 0l-.6236 1.0073a13.7383 13.7383 0 00-.2936.0284L9.9803.3374a.3462.3462 0 00-.578.1154l-.4141 1.1065c-.0962.0274-.1903.0567-.2855.086L7.744.955a.3483.3483 0 00-.5447.2258L7.009 2.348a9.3574 9.3574 0 00-.2622.1407l-1.0762-.491a.3462.3462 0 00-.49.328l.0416 1.1845a7.9826 7.9826 0 00-.2278.1873L3.8413 3.425a.3472.3472 0 00-.4171.4171l.2713 1.1531c-.0628.075-.1255.1509-.1863.2268l-1.1845-.0415a.3462.3462 0 00-.328.49l.491 1.0761a9.167 9.167 0 00-.1407.2622l-1.1662.1894a.3483.3483 0 00-.2258.5446l.6904.9587a13.303 13.303 0 00-.087.2855l-1.1065.414a.3483.3483 0 00-.1155.5781l.8656.807a9.2936 9.2936 0 00-.0283.2935l-1.0073.6236a.3442.3442 0 000 .5892l1.0073.6236c.008.0982.0182.1964.0283.2936l-.8656.8079a.3462.3462 0 00.1155.578l1.1065.4141c.0273.0962.0567.1914.087.2855l-.6904.9587a.3452.3452 0 00.2268.5447l1.1662.1893c.0456.088.0922.1751.1408.2622l-.491 1.0762a.3462.3462 0 00.328.49l1.1834-.0415c.0618.0769.1235.1528.1873.2277l-.2713 1.1541a.3462.3462 0 00.4171.4161l1.153-.2713c.075.0638.151.1255.2279.1863l-.0415 1.1845a.3442.3442 0 00.49.327l1.0761-.49c.087.0486.1741.0951.2622.1407l.1903 1.1662a.3483.3483 0 00.5447.2268l.9587-.6904a9.299 9.299 0 00.2855.087l.414 1.1066a.3452.3452 0 00.5781.1154l.8079-.8656c.0972.0111.1954.0203.2936.0294l.6236 1.0073a.3472.3472 0 00.5892 0l.6236-1.0073c.0982-.0091.1964-.0183.2936-.0294l.8069.8656a.3483.3483 0 00.578-.1154l.4141-1.1066a8.4626 8.4626 0 00.2855-.087l.9587.6904a.3452.3452 0 00.5447-.2268l.1903-1.1662c.088-.0456.1751-.0931.2622-.1407l1.0762.49a.3472.3472 0 00.49-.327l-.0415-1.1845a6.7267 6.7267 0 00.2267-.1863l1.1531.2713a.3472.3472 0 00.4171-.416l-.2713-1.1542c.0628-.0749.1255-.1508.1863-.2278l1.1845.0415a.3442.3442 0 00.328-.49l-.49-1.076c.0475-.0872.0951-.1742.1407-.2623l1.1662-.1893a.3483.3483 0 00.2258-.5447l-.6904-.9587.087-.2855 1.1066-.414a.3462.3462 0 00.1154-.5781l-.8656-.8079c.0101-.0972.0202-.1954.0283-.2936l1.0073-.6236a.3442.3442 0 000-.5892zm-6.7413 8.3551a.7138.7138 0 01.2986-1.396.714.714 0 11-.2997 1.396zm-.3422-2.3142a.649.649 0 00-.7715.5l-.3573 1.6685c-1.1035.501-2.3285.7795-3.6193.7795a8.7368 8.7368 0 01-3.6951-.814l-.3574-1.6684a.648.648 0 00-.7714-.499l-1.473.3158a8.7216 8.7216 0 01-.7613-.898h7.1676c.081 0 .1356-.0141.1356-.088v-2.536c0-.074-.0536-.0881-.1356-.0881h-2.0966v-1.6077h2.2677c.2065 0 1.1065.0587 1.394 1.2088.0901.3533.2875 1.5044.4232 1.8729.1346.413.6833 1.2381 1.2685 1.2381h3.5716a.7492.7492 0 00.1296-.0131 8.7874 8.7874 0 01-.8119.9526zM6.8369 20.024a.714.714 0 11-.2997-1.396.714.714 0 01.2997 1.396zM4.1177 8.9972a.7137.7137 0 11-1.304.5791.7137.7137 0 011.304-.579zm-.8352 1.9813l1.5347-.6824a.65.65 0 00.33-.8585l-.3158-.7147h1.2432v5.6025H3.5669a8.7753 8.7753 0 01-.2834-3.348zm6.7343-.5437V8.7836h2.9601c.153 0 1.0792.1772 1.0792.8697 0 .575-.7107.7815-1.2948.7815zm10.7574 1.4862c0 .2187-.008.4363-.0243.651h-.9c-.09 0-.1265.0586-.1265.1477v.413c0 .973-.5487 1.1846-1.0296 1.2382-.4576.0517-.9648-.1913-1.0275-.4717-.2704-1.5186-.7198-1.8436-1.4305-2.4034.8817-.5599 1.799-1.386 1.799-2.4915 0-1.1936-.819-1.9458-1.3769-2.3153-.7825-.5163-1.6491-.6195-1.883-.6195H5.4682a8.7651 8.7651 0 014.907-2.7699l1.0974 1.151a.648.648 0 00.9182.0213l1.227-1.1743a8.7753 8.7753 0 016.0044 4.2762l-.8403 1.8982a.652.652 0 00.33.8585l1.6178.7188c.0283.2875.0425.577.0425.8717zm-9.3006-9.5993a.7128.7128 0 11.984 1.0316.7137.7137 0 01-.984-1.0316zm8.3389 6.71a.7107.7107 0 01.9395-.3625.7137.7137 0 11-.9405.3635z"
                    />
                </svg>
                <!-- Homebrew icon -->
                <svg
                    v-else-if="tab.icon === 'homebrew'"
                    class="tab-icon"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                >
                    <path
                        d="M7.938 0a.214.214 0 0 0-.206.156c-.316 1.104.179 2.15.838 2.935.153.181.313.347.476.501a2.039 2.039 0 0 0-.665.02c-1.184.233-2.193.985-2.74 2.532a3.893 3.893 0 0 0-.2 1.466 1.565 1.565 0 0 0-1.156 1.504 1.59 1.59 0 0 0 1.227 1.541l.026 12.046c0 .195.1.377.264.482a.214.214 0 0 0 .008.005c.537.31 2.047.812 5.21.812 3.238 0 4.7-.678 5.181-1.04a.214.214 0 0 0 .008-.007.571.571 0 0 0 .206-.439c.002-.344.002-1.136.002-1.604a.143.143 0 0 1 .147-.144c.397.006.869.006 1.318.005a1.826 1.826 0 0 0 1.832-1.825v-5.804a1.826 1.826 0 0 0-1.825-1.826H16.56a.14.14 0 0 1-.143-.144V10.6h.007v-.001a1.573 1.573 0 0 0 1.356-1.556c0-.816-.627-1.489-1.424-1.563-.025-1.438-.437-2.126-.736-2.58a.214.214 0 0 0-.005-.007c-.364-.51-1.193-1.282-2.275-1.316-.503-.016-.842.124-1.125.254-.217.1-.42.177-.67.22.002-1.286.945-1.981.945-1.981a.214.214 0 0 0 .05-.298s-.087-.122-.21-.26c-.121-.136-.269-.294-.47-.378a.214.214 0 0 0-.079-.017.214.214 0 0 0-.145.055 4.308 4.308 0 0 0-.875 1.101 3.42 3.42 0 0 0-.133.273 3.497 3.497 0 0 0-.381-.846C9.794.978 9.063.436 8.017.016A.214.214 0 0 0 7.939 0zm.156.524c.85.378 1.43.83 1.79 1.403.274.438.426.962.484 1.584a3.07 3.07 0 0 0-.012.462 6.897 6.897 0 0 1-.168-.052 5.487 5.487 0 0 1-1.29-1.106c-.551-.657-.935-1.46-.804-2.291zM11.8 1.618c.07.054.141.101.212.18.034.039.032.04.058.073-.332.308-1.07 1.144-.952 2.453a.214.214 0 0 0 .222.195c.469-.017.782-.172 1.056-.299.273-.126.508-.228.931-.214.875.027 1.639.715 1.939 1.134.295.449.65 1 .663 2.36a1.66 1.66 0 0 0-.41.142 1.938 1.938 0 0 0-1.77-1.16 1.94 1.94 0 0 0-1.87 1.448 1.783 1.783 0 0 0-1.356-.64c-.484 0-.91.205-1.233.517a1.873 1.873 0 0 0-1.85-1.625c-.649 0-1.218.335-1.552.84a3.1 3.1 0 0 1 .157-.735c.51-1.437 1.355-2.045 2.42-2.254.367-.073.664-.011.99.095.325.106.671.262 1.094.342a.214.214 0 0 0 .252-.245c-.112-.67.073-1.266.336-1.744a3.71 3.71 0 0 1 .663-.863zM7.44 6.611a1.442 1.442 0 0 1 1.363 1.925.214.214 0 0 0 .168.283h.005a.214.214 0 0 0 .238-.146 1.373 1.373 0 0 1 2.613-.01.214.214 0 0 0 .417-.09 1.509 1.509 0 0 1 1.504-1.664c.678 0 1.249.445 1.442 1.056a.214.214 0 0 0 .259.143l.15-.04a.214.214 0 0 0 .051-.02 1.139 1.139 0 0 1 1.702.995 1.14 1.14 0 0 1-.985 1.131a.214.214 0 0 0-.001 0 2.215 2.215 0 0 0-.485.126 10.65 10.65 0 0 1-1.176.365.214.214 0 0 0-.162.186 1.276 1.276 0 0 1-.146.478 2.07 2.07 0 0 0-.239 1.111l.001.151a.438.438 0 0 1-.16.36.665.665 0 0 1-.43.14.586.586 0 0 1-.588-.59.803.803 0 0 0-.38-.681.214.214 0 0 0-.002-.002c-.24-.145-.43-.37-.532-.636a.214.214 0 0 0-.207-.138 19.469 19.469 0 0 1-5.37-.6l-.003-.002a9.007 9.007 0 0 0-.838-.194h.003a1.16 1.16 0 0 1-.937-1.134c0-.619.488-1.118 1.101-1.14a.214.214 0 0 0 .204-.176 1.443 1.443 0 0 1 1.42-1.187zm8.549 4.106v.455c0 .314.259.573.572.573h1.329a1.397 1.397 0 0 1 1.397 1.397v5.804a1.396 1.396 0 0 1-1.402 1.396a.214.214 0 0 0-.002 0c-.448.002-.918 0-1.31-.005a.573.573 0 0 0-.584.573c0 .468 0 1.262-.002 1.603a.214.214 0 0 0 0 .001c0 .042-.019.08-.05.107c-.346.26-1.75.95-4.915.95-3.107 0-4.587-.52-4.99-.752a.143.143 0 0 1-.065-.118l-.025-11.955c.145.033.288.07.431.11a.214.214 0 0 0 .003 0c.115.031.246.064.383.097v10.37c0 .129.069.247.18.31.453.217 1.767.732 4.071.732 2.32 0 3.595-.626 4.022-.884a.357.357 0 0 0 .164-.3l.001-10.21c.267-.075.531-.158.792-.254zm-7.99.894a.493.493 0 0 1 .494.493v8.578a.493.493 0 0 1-.493.493a.493.493 0 0 1-.494-.493v-8.578A.493.493 0 0 1 8 11.611zm8.652 1.14a.663.663 0 0 0-.662.662v5.208a.663.663 0 0 0 .662.662h1.14a.663.663 0 0 0 .662-.662v-5.209a.663.663 0 0 0-.662-.662zm0 .428h1.14a.233.233 0 0 1 .233.233v5.21a.233.233 0 0 1-.233.232h-1.14a.233.233 0 0 1-.233-.233v-5.209a.233.233 0 0 1 .233-.233z"
                    />
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
                <!-- COPR icon -->
                <svg
                    v-else-if="tab.icon === 'copr'"
                    class="tab-icon"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                >
                    <path
                        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5.5-2.5l7.51-3.49L17.5 6.5 9.99 9.99 6.5 17.5zm5.5-6.6c.61 0 1.1.49 1.1 1.1s-.49 1.1-1.1 1.1-1.1-.49-1.1-1.1.49-1.1 1.1-1.1z"
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
                <!-- Scoop (Windows) icon -->
                <svg
                    v-else-if="tab.icon === 'scoop'"
                    class="tab-icon"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                >
                    <path
                        d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"
                    />
                </svg>
                <!-- Docker icon -->
                <svg
                    v-else-if="tab.icon === 'docker'"
                    class="tab-icon"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                >
                    <path
                        d="M13.983 11.078h2.119a.186.186 0 0 0 .186-.185V9.006a.186.186 0 0 0-.186-.186h-2.119a.185.185 0 0 0-.185.185v1.888c0 .102.083.185.185.185m-2.954-5.43h2.118a.186.186 0 0 0 .186-.186V3.574a.186.186 0 0 0-.186-.185h-2.118a.185.185 0 0 0-.185.185v1.888c0 .102.082.185.185.186m0 2.716h2.118a.187.187 0 0 0 .186-.186V6.29a.186.186 0 0 0-.186-.185h-2.118a.185.185 0 0 0-.185.185v1.887c0 .102.082.185.185.186m-2.93 0h2.12a.186.186 0 0 0 .184-.186V6.29a.185.185 0 0 0-.185-.185H8.1a.185.185 0 0 0-.185.185v1.887c0 .102.083.185.185.186m-2.964 0h2.119a.186.186 0 0 0 .185-.186V6.29a.185.185 0 0 0-.185-.185H5.136a.186.186 0 0 0-.186.185v1.887c0 .102.084.185.186.186m5.893 2.715h2.118a.186.186 0 0 0 .186-.185V9.006a.186.186 0 0 0-.186-.186h-2.118a.185.185 0 0 0-.185.185v1.888c0 .102.082.185.185.185m-2.93 0h2.12a.185.185 0 0 0 .184-.185V9.006a.185.185 0 0 0-.184-.186h-2.12a.185.185 0 0 0-.184.185v1.888c0 .102.083.185.185.185m-2.964 0h2.119a.185.185 0 0 0 .185-.185V9.006a.185.185 0 0 0-.185-.186h-2.119a.185.185 0 0 0-.185.185v1.888c0 .102.084.185.185.185m-2.92 0h2.12a.185.185 0 0 0 .184-.185V9.006a.185.185 0 0 0-.184-.186h-2.12a.186.186 0 0 0-.185.185v1.888c0 .102.084.185.185.185M23.763 9.89c-.065-.051-.672-.51-1.954-.51-.338.001-.676.03-1.01.087-.248-1.7-1.653-2.53-1.716-2.566l-.344-.199-.226.327c-.284.438-.49.922-.612 1.43-.23.97-.09 1.882.403 2.661-.595.332-1.55.413-1.744.42H.751a.751.751 0 0 0-.75.748 11.376 11.376 0 0 0 .692 4.062c.545 1.428 1.355 2.48 2.41 3.124 1.18.723 3.1 1.137 5.275 1.137.983.003 1.963-.086 2.93-.266a12.248 12.248 0 0 0 3.823-1.389c.98-.567 1.86-1.288 2.61-2.136 1.252-1.418 1.998-2.997 2.553-4.4h.221c1.372 0 2.215-.549 2.68-1.009.309-.293.55-.65.707-1.046l.098-.288z"
                    />
                </svg>
                <!-- npm icon -->
                <svg
                    v-else-if="tab.icon === 'npm'"
                    class="tab-icon"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                >
                    <path
                        d="M0 7.334v8h6.666v1.332H12v-1.332h12v-8H0zm6.666 6.664H5.334v-4H3.999v4H1.335V8.667h5.331v5.331zm4 0v1.336H8.001V8.667h5.334v5.332h-2.669v-.001zm12.001 0h-1.33v-4h-1.336v4h-1.335v-4h-1.33v4h-2.671V8.667h8.002v5.331z"
                    />
                </svg>
                <!-- Binary (download) icon -->
                <svg
                    v-else-if="tab.icon === 'binary'"
                    class="tab-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                </svg>
                <span>{{ tab.name }}</span>
                <span v-if="recommendedTab === tab.id" class="recommended-badge">Best</span>
            </button>
        </div>

        <div class="install-content">
            <!-- Cargo Panel -->
            <div v-show="activeTab === 'cargo'" class="install-panel active">
                <div class="install-command">
                    <span class="prompt">$</span>
                    <span class="cmd"
                        ><span class="keyword">cargo</span> <span class="flag">install</span>
                        <span class="package">rustledger</span></span
                    >
                    <button
                        class="install-copy-btn"
                        @click="copyCommand('cargo install rustledger')"
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
                        ><span class="keyword">cargo</span> <span class="flag">binstall</span>
                        <span class="package">rustledger</span></span
                    >
                    <button
                        class="install-copy-btn"
                        @click="copyCommand('cargo binstall rustledger')"
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
                    <a href="https://rustup.rs" target="_blank" rel="noopener noreferrer"
                        >Rust toolchain</a
                    >.
                </p>
            </div>

            <!-- Homebrew Panel -->
            <div v-show="activeTab === 'homebrew'" class="install-panel active">
                <div class="install-command">
                    <span class="prompt">$</span>
                    <span class="cmd"
                        ><span class="keyword">brew</span> <span class="flag">install</span>
                        <span class="package">rustledger</span></span
                    >
                    <button
                        class="install-copy-btn"
                        @click="copyCommand('brew install rustledger')"
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
                    Works on macOS and Linux.
                </p>
            </div>

            <!-- Nix Panel -->
            <div v-show="activeTab === 'nix'" class="install-panel active">
                <div class="install-command">
                    <span class="prompt">$</span>
                    <span class="cmd"
                        ><span class="keyword">nix</span> <span class="flag">run</span>
                        <span class="package">github:rustledger/rustledger</span></span
                    >
                    <button
                        class="install-copy-btn"
                        @click="copyCommand('nix run github:rustledger/rustledger')"
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
                        ><span class="keyword">nix</span> <span class="flag">profile install</span>
                        <span class="package">github:rustledger/rustledger</span></span
                    >
                    <button
                        class="install-copy-btn"
                        @click="copyCommand('nix profile install github:rustledger/rustledger')"
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

            <!-- COPR Panel -->
            <div v-show="activeTab === 'copr'" class="install-panel active">
                <div class="install-command">
                    <span class="prompt">$</span>
                    <span class="cmd"
                        ><span class="keyword">sudo dnf</span> <span class="flag">copr enable</span>
                        <span class="package">atim/rustledger</span></span
                    >
                    <button
                        class="install-copy-btn"
                        @click="copyCommand('sudo dnf copr enable atim/rustledger')"
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
                        ><span class="keyword">sudo dnf</span> <span class="flag">install</span>
                        <span class="package">rustledger</span></span
                    >
                    <button
                        class="install-copy-btn"
                        @click="copyCommand('sudo dnf install rustledger')"
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
                    For Fedora, RHEL, and CentOS.
                </p>
            </div>

            <!-- AUR Panel -->
            <div v-show="activeTab === 'aur'" class="install-panel active">
                <div class="install-command">
                    <span class="prompt">$</span>
                    <span class="cmd"
                        ><span class="keyword">yay</span> <span class="flag">-S</span>
                        <span class="package">rustledger</span></span
                    >
                    <button
                        class="install-copy-btn"
                        @click="copyCommand('yay -S rustledger')"
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
                        <span class="package">rustledger</span></span
                    >
                    <button
                        class="install-copy-btn"
                        @click="copyCommand('paru -S rustledger')"
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

            <!-- Scoop Panel -->
            <div v-show="activeTab === 'scoop'" class="install-panel active">
                <div class="install-command">
                    <span class="prompt">&gt;</span>
                    <span class="cmd"
                        ><span class="keyword">scoop</span> <span class="flag">bucket add</span>
                        <span class="package"
                            >rustledger https://github.com/rustledger/scoop-bucket</span
                        ></span
                    >
                    <button
                        class="install-copy-btn"
                        @click="
                            copyCommand(
                                'scoop bucket add rustledger https://github.com/rustledger/scoop-bucket'
                            )
                        "
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
                    <span class="prompt">&gt;</span>
                    <span class="cmd"
                        ><span class="keyword">scoop</span> <span class="flag">install</span>
                        <span class="package">rustledger</span></span
                    >
                    <button
                        class="install-copy-btn"
                        @click="copyCommand('scoop install rustledger')"
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
                    For Windows with
                    <a href="https://scoop.sh" target="_blank" rel="noopener noreferrer">Scoop</a>.
                </p>
            </div>

            <!-- Docker Panel -->
            <div v-show="activeTab === 'docker'" class="install-panel active">
                <div class="install-command">
                    <span class="prompt">$</span>
                    <span class="cmd"
                        ><span class="keyword">docker</span>
                        <span class="flag">run --rm -v $(pwd):/data</span>
                        <span class="package"
                            >ghcr.io/rustledger/rustledger check /data/ledger.beancount</span
                        ></span
                    >
                    <button
                        class="install-copy-btn"
                        @click="
                            copyCommand(
                                'docker run --rm -v $(pwd):/data ghcr.io/rustledger/rustledger check /data/ledger.beancount'
                            )
                        "
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
                    No installation required. Just run with Docker.
                </p>
            </div>

            <!-- npm Panel -->
            <div v-show="activeTab === 'npm'" class="install-panel active">
                <div class="install-command">
                    <span class="prompt">$</span>
                    <span class="cmd"
                        ><span class="keyword">npm</span> <span class="flag">install</span>
                        <span class="package">@rustledger/wasm</span></span
                    >
                    <button
                        class="install-copy-btn"
                        @click="copyCommand('npm install @rustledger/wasm')"
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
                    WASM bindings for Node.js and browser usage.
                </p>
            </div>

            <!-- Binary Panel -->
            <div v-show="activeTab === 'binary'" class="install-panel active">
                <div class="binary-options">
                    <a
                        href="https://github.com/rustledger/rustledger/releases/latest"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="binary-option"
                    >
                        <!-- Linux (Tux) icon -->
                        <svg class="platform-icon" viewBox="0 0 24 24" fill="currentColor">
                            <path
                                d="M12.504 0c-.155 0-.315.008-.48.021-4.226.333-3.105 4.807-3.17 6.298-.076 1.092-.3 1.953-1.05 3.02-.885 1.051-2.127 2.75-2.716 4.521-.278.832-.41 1.684-.287 2.489a.424.424 0 00-.11.135c-.26.268-.45.6-.663.839-.199.199-.485.267-.797.4-.313.136-.658.269-.864.68-.09.189-.136.394-.132.602 0 .199.027.4.055.536.058.399.116.728.04.97-.249.68-.28 1.145-.106 1.484.174.334.535.47.94.601.81.2 1.91.135 2.774.6.926.466 1.866.67 2.616.47.526-.116.97-.464 1.208-.946.587-.003 1.23-.269 2.26-.334.699-.058 1.574.267 2.577.2.025.134.063.198.114.333l.003.003c.391.778 1.113 1.132 1.884 1.071.771-.06 1.592-.536 2.257-1.306.631-.765 1.683-1.084 2.378-1.503.348-.199.629-.469.649-.853.023-.4-.2-.811-.714-1.376v-.097l-.003-.003c-.17-.2-.25-.535-.338-.926-.085-.401-.182-.786-.492-1.046h-.003c-.059-.054-.123-.067-.188-.135a.357.357 0 00-.19-.064c.431-1.278.264-2.55-.173-3.694-.533-1.41-1.465-2.638-2.175-3.483-.796-1.005-1.576-1.957-1.56-3.368.026-2.152.236-6.133-3.544-6.139z"
                            />
                        </svg>
                        <div class="platform-name">Linux</div>
                        <div class="platform-arch">.tar.gz</div>
                    </a>
                    <a
                        href="https://github.com/rustledger/rustledger/releases/latest"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="binary-option"
                    >
                        <!-- macOS (Apple) icon -->
                        <svg class="platform-icon" viewBox="0 0 24 24" fill="currentColor">
                            <path
                                d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
                            />
                        </svg>
                        <div class="platform-name">macOS</div>
                        <div class="platform-arch">.tar.gz</div>
                    </a>
                    <a
                        href="https://github.com/rustledger/rustledger/releases/latest"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="binary-option"
                    >
                        <!-- Windows icon -->
                        <svg class="platform-icon" viewBox="0 0 24 24" fill="currentColor">
                            <path
                                d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"
                            />
                        </svg>
                        <div class="platform-name">Windows</div>
                        <div class="platform-arch">.zip</div>
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
                    See all binaries on
                    <a
                        href="https://github.com/rustledger/rustledger/releases"
                        target="_blank"
                        rel="noopener noreferrer"
                        >GitHub Releases</a
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

@media (min-width: 640px) {
    .install-tabs {
        gap: 0.125rem;
        padding: 0.25rem;
    }
}

.install-tab {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 0.75rem;
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.5);
    cursor: pointer;
    border: 1px solid transparent;
    border-radius: 0.5rem;
    transition: all 0.2s;
    position: relative;
    background: transparent;
    white-space: nowrap;
}

@media (min-width: 640px) {
    .install-tab {
        padding: 0.5rem 0.9rem;
        font-size: 0.75rem;
    }
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
    width: 14px;
    height: 14px;
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
    padding: 0 3px;
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

/* Syntax highlighting - matching original */
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

/* Binary download specific styles */
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

export interface UpdateInfo {
    description: string;
    forceUpdate: boolean | null;
    url: string;
    versionName: string;
}

export interface UpdateCheckResult {
    updateRequired: boolean;
    updateInfo?: UpdateInfo;
}

const VERSION_URL = `${process.env.EXPO_PUBLIC_API_URL}/mobile-actual-app-version`;
const LOCAL_VERSION = process.env.EXPO_PUBLIC_LOCAL_VERSION || '0.0.1';

let lastCheckTime = 0;
let cachedResult: UpdateCheckResult | null = null;
const CHECK_INTERVAL = 5 * 60 * 1000;

export async function checkForUpdate() {
    try {
        const now = Date.now();
        if (cachedResult && (now - lastCheckTime) < CHECK_INTERVAL) {
            return cachedResult;
        }

        const response = await fetch(VERSION_URL, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            console.warn('Failed to check for updates:', response.status);
            return { updateRequired: false };
        }

        const remote: UpdateInfo = await response.json();

        lastCheckTime = now;

        if (remote.forceUpdate && remote.versionName !== LOCAL_VERSION) {
            cachedResult = {
                updateRequired: true,
                updateInfo: remote,
            };
            return cachedResult;
        }

        cachedResult = { updateRequired: false };
        return cachedResult;
    } catch (err) {
        console.error('Error checking for updates:', err);
        return { updateRequired: false };
    }
}

export function resetUpdateCheckCache(): void {
    lastCheckTime = 0;
    cachedResult = null;
}
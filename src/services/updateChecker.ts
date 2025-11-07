export interface UpdateInfo {
    description: string;
    forceUpdate: boolean | null;
    url: string;
    versionName: string;
    localVersion?: string;
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

function isVersionLower(localVersion: string, remoteVersion: string): boolean {
    const parseVersion = (version: string): number[] => {
        return version.split('.').map(part => parseInt(part, 10) || 0);
    };

    const local = parseVersion(localVersion);
    const remote = parseVersion(remoteVersion);
    console.log(local, remote);


    for (let i = 0; i < Math.max(local.length, remote.length); i++) {
        const localPart = local[i] || 0;
        const remotePart = remote[i] || 0;

        if (localPart < remotePart) {
            return true;
        }
        if (localPart > remotePart) {
            return false;
        }
    }

    return false;
}

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
        if (remote.forceUpdate && isVersionLower(LOCAL_VERSION, remote.versionName)) {
            cachedResult = {
                updateRequired: true,
                updateInfo: {
                    ...remote,
                    localVersion: LOCAL_VERSION,
                },
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
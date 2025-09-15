import { Alert, Linking } from 'react-native';

interface UpdateInfo {
    description: string;
    forceUpdate: boolean | null;
    url: string;
    versionName: string;
}

const VERSION_URL = 'https://geseg2.dinamo.srv.br/api/mobile-actual-app-version';
const LOCAL_VERSION = '0.0.1';

export async function checkForUpdate(): Promise<void> {
    try {
        const response = await fetch(VERSION_URL);

        if (!response.ok) {
            throw new Error(`Update check failed: HTTP ${response.status}`);
        }

        const remote: UpdateInfo = await response.json();

        if (remote.forceUpdate && remote.versionName !== LOCAL_VERSION) {
            Alert.alert(
                "Atualização obrigatória",
                "Baixe e instale a nova versão para continuar.",
                [
                    {
                        text: "Atualizar",
                        onPress: () => Linking.openURL(remote.url)
                    }
                ],
                { cancelable: false }
            );
        }
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        Alert.alert("Erro ao verificar atualização", message);
    }
}

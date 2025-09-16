import { Alert, Linking } from 'react-native';

interface UpdateInfo {
    description: string;
    forceUpdate: boolean | null;
    url: string;
    versionName: string;
}

const VERSION_URL = 'https://geseg2.dinamo.srv.br/api/mobile-actual-app-version';
const LOCAL_VERSION = '0.0.4';

export async function checkForUpdate(): Promise<boolean> {
    try {
        const response = await fetch(VERSION_URL);
        const remote: UpdateInfo = await response.json();

        if (remote.forceUpdate && remote.versionName !== LOCAL_VERSION) {
            Alert.alert(
                "Atualização obrigatória",
                "Baixe e instale a nova versão para continuar.",
                [
                    {
                        text: "Atualizar",
                        onPress: () => Linking.openURL(remote.url),
                    },
                ],
                { cancelable: false }
            );

            return true;
        }
        return false;
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        Alert.alert("Erro ao verificar atualização", message);
        return false;
    }
}

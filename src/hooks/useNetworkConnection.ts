import NetInfo from '@react-native-community/netinfo';

export interface NetworkInfo {
    isConnected: boolean;
    connectionType?: string;
    connectionDetails?: string;
}

export async function checkNetworkConnection(): Promise<NetworkInfo> {
    const netInfoState = await NetInfo.fetch();

    if (!netInfoState.isConnected) {
        throw new Error('❌ Dispositivo sem conexão de rede. Verifique se está conectado ao Wi-Fi ou dados móveis.');
    }

    if (!netInfoState.isInternetReachable) {
        throw new Error('❌ Sem acesso à internet. Verifique sua conexão e tente novamente.');
    }

    const connectionType = netInfoState.type;
    const connectionDetails = netInfoState.details;

    let details = '';
    if (connectionType === 'wifi' && connectionDetails) {
        details = `📶 Wi-Fi: ${(connectionDetails as any).ssid || 'Rede conectada'}`;
    } else if (connectionType === 'cellular' && connectionDetails) {
        details = `📱 Dados móveis: ${(connectionDetails as any).cellularGeneration || 'Conectado'}`;
    }

    return {
        isConnected: true,
        connectionType: `🌐 Conectado via ${connectionType.toUpperCase()}`,
        connectionDetails: details,
    };
}

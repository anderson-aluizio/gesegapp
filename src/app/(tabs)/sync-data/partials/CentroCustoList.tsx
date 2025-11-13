import { Animated, View, StyleSheet } from 'react-native';
import { ProgressBar, Surface, Text } from 'react-native-paper';
import { CentroCustoDatabase } from '@/database/Models/useCentroCustoDatabase';
import CentroCustoCard from './CentroCustoCard';

interface CentroCustoListProps {
    centroCustos: CentroCustoDatabase[];
    isLoading: boolean;
    isSyncing: boolean;
    onSync: (id: string) => void;
    fadeAnim: Animated.Value;
    slideAnim: Animated.Value;
}

export default function CentroCustoList({
    centroCustos,
    isLoading,
    isSyncing,
    onSync,
    fadeAnim,
    slideAnim
}: CentroCustoListProps) {
    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ProgressBar indeterminate color="#0439c9" style={styles.loadingBar} />
                <Text variant="bodyMedium" style={styles.loadingText}>
                    Carregando centros de custo...
                </Text>
            </View>
        );
    }

    if (centroCustos.length === 0) {
        return (
            <Surface style={styles.emptyState} elevation={2}>
                <View style={styles.infoHeader}>
                    <Text variant="titleMedium" style={styles.infoTitle}>
                        Nenhum centro de custo encontrado
                    </Text>
                </View>
                <Text variant="bodyMedium" style={styles.emptyStateText}>
                    Verifique sua configuração ou tente novamente mais tarde.
                </Text>
            </Surface>
        );
    }

    return (
        <Animated.View style={[
            styles.contentContainer,
            {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
            }
        ]}>
            <Surface style={styles.infoCard} elevation={2}>
                <View style={styles.infoHeader}>
                    <Text variant="titleMedium" style={styles.infoTitle}>
                        Centros de Custo Disponíveis
                    </Text>
                </View>
                <Text variant="bodySmall" style={styles.infoDescription}>
                    Selecione um centro de custo para sincronizar seus dados
                </Text>
            </Surface>

            <View style={styles.cardsContainer}>
                {centroCustos.map((cc, index) => (
                    <CentroCustoCard
                        key={cc.id}
                        centroCusto={cc}
                        onSync={onSync}
                        disabled={isSyncing}
                        index={index}
                        slideAnim={slideAnim}
                    />
                ))}
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    contentContainer: {
        flex: 1,
    },
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    loadingBar: {
        width: '80%',
        height: 6,
        borderRadius: 3,
        marginBottom: 16,
    },
    loadingText: {
        color: '#666',
        textAlign: 'center',
    },
    emptyState: {
        padding: 22,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        backgroundColor: '#ffffff',
        marginVertical: 10,
    },
    emptyStateText: {
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    infoCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 10,
        marginBottom: 14,
    },
    infoHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    infoTitle: {
        color: '#333',
        fontWeight: 'bold',
    },
    infoDescription: {
        color: '#666',
        lineHeight: 18,
    },
    cardsContainer: {
        gap: 8,
    },
});

import { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { ProgressBar, Text } from 'react-native-paper';
import { CentroCustoDatabase } from '@/database/models/useCentroCustoDatabase';
import { useTheme, ThemeColors } from '@/contexts/ThemeContext';
import CentroCustoCard from './CentroCustoCard';

interface CentroCustoListProps {
    centroCustos: CentroCustoDatabase[];
    isLoading: boolean;
    isSyncing: boolean;
    onSync: (id: string) => void;
}

export default function CentroCustoList({
    centroCustos,
    isLoading,
    isSyncing,
    onSync,
}: CentroCustoListProps) {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ProgressBar indeterminate color={colors.buttonPrimary} style={styles.loadingBar} />
                <Text variant="bodyMedium" style={styles.loadingText}>
                    Carregando centros de custo...
                </Text>
            </View>
        );
    }

    if (centroCustos.length === 0) {
        return (
            <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                    Nenhum centro de custo encontrado.
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.cardsContainer}>
                {centroCustos.map((cc) => (
                    <CentroCustoCard
                        key={cc.id}
                        centroCusto={cc}
                        onSync={onSync}
                        disabled={isSyncing}
                    />
                ))}
            </View>
        </View>
    );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
    container: {
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
        color: colors.textSecondary,
        textAlign: 'center',
    },
    emptyState: {
        padding: 22,
        alignItems: 'center',
    },
    emptyText: {
        color: colors.textSecondary,
        textAlign: 'center',
    },
    cardsContainer: {
        gap: 8,
    },
});

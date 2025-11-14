import { Animated, StyleSheet } from 'react-native';
import { Card, Text, IconButton } from 'react-native-paper';
import { View } from 'react-native';
import { CentroCustoDatabase } from '@/database/models/useCentroCustoDatabase';

interface CentroCustoCardProps {
    centroCusto: CentroCustoDatabase;
    onSync: (id: string) => void;
    disabled?: boolean;
    index: number;
    slideAnim: Animated.Value;
}

export default function CentroCustoCard({
    centroCusto,
    onSync,
    disabled = false,
    index,
    slideAnim
}: CentroCustoCardProps) {
    const formatSyncDate = (date: string | null | undefined) => {
        if (!date) {
            return 'Não sincronizado';
        }

        return `Atualizado em ${new Date(date).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        })}`;
    };

    return (
        <Animated.View
            style={[
                styles.cardWrapper,
                {
                    transform: [{
                        translateY: slideAnim.interpolate({
                            inputRange: [0, 50],
                            outputRange: [0, 50 + (index * 20)],
                            extrapolate: 'clamp',
                        })
                    }]
                }
            ]}
        >
            <Card style={styles.card} elevation={2}>
                <Card.Content style={styles.cardContent}>
                    <View style={styles.cardRow}>
                        <View style={styles.cardInfo}>
                            <Text variant="titleSmall" style={styles.cardTitle} numberOfLines={1}>
                                {centroCusto.nome}
                            </Text>
                            <Text variant="bodySmall" style={styles.cardSubtitle}>
                                <Text style={styles.syncDate}>
                                    {formatSyncDate(centroCusto.synced_at)}
                                </Text>
                            </Text>
                        </View>
                        <IconButton
                            icon="sync"
                            size={20}
                            onPress={() => onSync(centroCusto.id)}
                            disabled={disabled}
                            style={[
                                styles.syncButton,
                                disabled && styles.syncButtonDisabled
                            ]}
                            iconColor={disabled ? "#cccccc" : "#ffffff"}
                        />
                    </View>
                </Card.Content>
            </Card>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    cardWrapper: {
        marginBottom: 4,
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        overflow: 'hidden',
    },
    cardContent: {
        paddingVertical: 10,
        paddingHorizontal: 10,
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    cardInfo: {
        flex: 1,
        marginRight: 12,
    },
    cardTitle: {
        color: '#333',
        fontWeight: 'bold',
        marginBottom: 2,
    },
    cardSubtitle: {
        color: '#666',
        fontSize: 12,
        lineHeight: 16,
    },
    syncDate: {
        color: '#999',
        fontSize: 12,
    },
    syncButton: {
        borderRadius: 8,
        elevation: 2,
        backgroundColor: '#0439c9',
        color: '#ffffff',
    },
    syncButtonDisabled: {
        backgroundColor: '#cccccc',
        elevation: 0,
        opacity: 0.6,
    },
});

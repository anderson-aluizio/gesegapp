import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text, IconButton } from 'react-native-paper';
import { CentroCustoDatabase } from '@/database/models/useCentroCustoDatabase';
import { useTheme, ThemeColors } from '@/contexts/ThemeContext';

interface CentroCustoCardProps {
    centroCusto: CentroCustoDatabase;
    onSync: (id: string) => void;
    disabled?: boolean;
}

export default function CentroCustoCard({
    centroCusto,
    onSync,
    disabled = false,
}: CentroCustoCardProps) {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

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
        <View style={styles.cardWrapper}>
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
                            iconColor={disabled ? colors.border : colors.buttonText}
                        />
                    </View>
                </Card.Content>
            </Card>
        </View>
    );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
    cardWrapper: {
        marginBottom: 4,
    },
    card: {
        backgroundColor: colors.surface,
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
        color: colors.text,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    cardSubtitle: {
        color: colors.textSecondary,
        fontSize: 12,
        lineHeight: 16,
    },
    syncDate: {
        color: colors.textTertiary,
        fontSize: 12,
    },
    syncButton: {
        borderRadius: 8,
        elevation: 2,
        backgroundColor: colors.buttonPrimary,
    },
    syncButtonDisabled: {
        backgroundColor: colors.border,
        elevation: 0,
        opacity: 0.6,
    },
});

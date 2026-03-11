import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Surface, Text } from "react-native-paper";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme, ThemeColors } from "@/contexts/ThemeContext";
import { useBackgroundSync } from "@/contexts/BackgroundSyncContext";

const SendAllData = () => {
    const { colors } = useTheme();
    const { syncStatus, lastSyncAt, pendingCount, syncNow } = useBackgroundSync();
    const styles = useMemo(() => createStyles(colors), [colors]);

    const isSyncing = syncStatus === 'syncing';

    const statusConfig = {
        syncing: { color: colors.warning, icon: 'sync' as const, label: 'Sincronizando...' },
        success: { color: colors.success, icon: 'check-circle-outline' as const, label: 'Sincronizado' },
        error: { color: colors.error, icon: 'alert-circle-outline' as const, label: 'Erro na sincronização' },
        idle: { color: colors.textMuted, icon: 'clock-outline' as const, label: 'Aguardando' },
    }[syncStatus];

    return (
        <Surface style={styles.card} elevation={1}>
            <View style={styles.row}>
                <MaterialCommunityIcons name={statusConfig.icon} size={20} color={statusConfig.color} />
                <View style={styles.info}>
                    <Text style={[styles.statusLabel, { color: statusConfig.color }]}>
                        {statusConfig.label}
                    </Text>
                    {lastSyncAt && (
                        <Text style={styles.lastSync}>
                            Última: {lastSyncAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    )}
                </View>
                {pendingCount > 0 && (
                    <View style={[styles.badge, { backgroundColor: colors.warning + '22' }]}>
                        <Text style={[styles.badgeText, { color: colors.warning }]}>
                            {pendingCount}
                        </Text>
                    </View>
                )}
                <Button
                    mode="contained"
                    icon="sync"
                    onPress={syncNow}
                    buttonColor={colors.buttonPrimary}
                    textColor={colors.buttonText}
                    disabled={isSyncing}
                    loading={isSyncing}
                    compact
                    style={styles.button}
                    labelStyle={styles.buttonLabel}
                >
                    Enviar
                </Button>
            </View>
        </Surface>
    );
};

export default SendAllData;

const createStyles = (colors: ThemeColors) => StyleSheet.create({
    card: {
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 14,
        marginBottom: 14,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    info: {
        flex: 1,
    },
    statusLabel: {
        fontSize: 14,
        fontWeight: '600',
    },
    lastSync: {
        fontSize: 11,
        color: colors.textMuted,
        marginTop: 1,
    },
    badge: {
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 2,
        minWidth: 28,
        alignItems: 'center',
    },
    badgeText: {
        fontSize: 13,
        fontWeight: '700',
    },
    button: {
        borderRadius: 8,
    },
    buttonLabel: {
        fontSize: 13,
    },
});

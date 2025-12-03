import { useMemo } from 'react';
import { Animated, ScrollView, StyleSheet, View } from 'react-native';
import { Dialog, Portal, Text, ProgressBar, Surface } from 'react-native-paper';
import { useTheme, ThemeColors } from '@/contexts/ThemeContext';

interface SyncProgressDialogProps {
    visible: boolean;
    progress: string[];
    percentage: number;
    currentStep: string;
    fadeAnim: Animated.Value;
}

export default function SyncProgressDialog({
    visible,
    progress,
    percentage,
    currentStep,
    fadeAnim
}: SyncProgressDialogProps) {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    return (
        <Portal>
            <Dialog visible={visible} dismissable={false} style={styles.syncDialog}>
                <Dialog.Title style={styles.syncDialogTitle}>
                    Sincronizando Dados
                </Dialog.Title>
                <Dialog.Content>
                    {percentage > 0 && (
                        <View style={styles.progressContainer}>
                            <View style={styles.progressHeader}>
                                <Text variant="labelMedium" style={styles.progressStep}>
                                    {currentStep}
                                </Text>
                                <Text variant="labelMedium" style={styles.progressPercent}>
                                    {percentage}%
                                </Text>
                            </View>
                            <Animated.View style={styles.progressBarContainer}>
                                <ProgressBar
                                    progress={percentage / 100}
                                    color={colors.buttonPrimary}
                                    style={styles.progressBar}
                                />
                            </Animated.View>
                        </View>
                    )}

                    <Surface style={styles.logContainer} elevation={1}>
                        <Text variant="labelSmall" style={styles.logHeader}>
                            Log de Sincronização
                        </Text>
                        <ScrollView style={styles.logScroll} showsVerticalScrollIndicator={false}>
                            {[...progress].reverse().map((item, index) => (
                                <Animated.View
                                    key={index}
                                    style={[
                                        styles.logItem,
                                        { opacity: fadeAnim }
                                    ]}
                                >
                                    <Text variant="bodySmall" style={styles.logText}>
                                        {item}
                                    </Text>
                                </Animated.View>
                            ))}
                        </ScrollView>
                    </Surface>
                </Dialog.Content>
            </Dialog>
        </Portal>
    );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
    syncDialog: {
        borderRadius: 16,
        maxHeight: '80%',
        backgroundColor: colors.surface,
    },
    syncDialogTitle: {
        color: colors.text,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    progressContainer: {
        marginBottom: 24,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    progressStep: {
        color: colors.text,
        flex: 1,
        marginRight: 16,
    },
    progressPercent: {
        color: colors.buttonPrimary,
        fontWeight: 'bold',
    },
    progressBarContainer: {
        backgroundColor: colors.border,
        borderRadius: 6,
        overflow: 'hidden',
    },
    progressBar: {
        height: 12,
        borderRadius: 6,
    },
    logContainer: {
        backgroundColor: colors.surfaceVariant,
        borderRadius: 12,
        padding: 16,
        maxHeight: 200,
    },
    logHeader: {
        color: colors.textSecondary,
        fontWeight: 'bold',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    logScroll: {
        maxHeight: 150,
    },
    logItem: {
        paddingVertical: 4,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    logText: {
        color: colors.textSecondary,
        lineHeight: 16,
        fontFamily: 'monospace',
    },
});

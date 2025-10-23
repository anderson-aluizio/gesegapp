import { Animated, ScrollView, StyleSheet } from 'react-native';
import { Dialog, Portal, Text, ProgressBar, Surface } from 'react-native-paper';
import { View } from 'react-native';

interface SyncProgressDialogProps {
    visible: boolean;
    progress: string[];
    percentage: number;
    currentStep: string;
    fadeAnim: Animated.Value;
}

export function SyncProgressDialog({
    visible,
    progress,
    percentage,
    currentStep,
    fadeAnim
}: SyncProgressDialogProps) {
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
                                    color="#0439c9"
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

const styles = StyleSheet.create({
    syncDialog: {
        borderRadius: 16,
        maxHeight: '80%',
    },
    syncDialogTitle: {
        color: '#333',
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
        color: '#333',
        flex: 1,
        marginRight: 16,
    },
    progressPercent: {
        color: '#0439c9',
        fontWeight: 'bold',
    },
    progressBarContainer: {
        backgroundColor: '#f0f0f0',
        borderRadius: 6,
        overflow: 'hidden',
    },
    progressBar: {
        height: 12,
        borderRadius: 6,
    },
    logContainer: {
        backgroundColor: '#fafafa',
        borderRadius: 12,
        padding: 16,
        maxHeight: 200,
    },
    logHeader: {
        color: '#666',
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
        borderBottomColor: '#f0f0f0',
    },
    logText: {
        color: '#555',
        lineHeight: 16,
        fontFamily: 'monospace',
    },
});

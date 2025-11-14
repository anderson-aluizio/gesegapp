import React from 'react';
import { StyleSheet, Linking, View, Modal } from 'react-native';
import { Button, Text } from 'react-native-paper';
import type { UpdateInfo } from '@/services/updateChecker';

interface UpdateModalProps {
    visible: boolean;
    updateInfo?: UpdateInfo;
}

/**
 * Modal component that displays when a forced app update is required.
 * This modal is non-dismissible and forces the user to update.
 */
export const UpdateModal: React.FC<UpdateModalProps> = ({ visible, updateInfo }) => {
    const handleUpdate = () => {
        if (updateInfo?.url) {
            Linking.openURL(updateInfo.url);
        }
    };

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={() => {}}
        >
            <View style={styles.overlay}>
                <View style={styles.dialog}>
                    <View style={styles.iconContainer}>
                        <Text style={styles.iconText}>⚠️</Text>
                    </View>

                    <Text style={styles.title}>Atualização Obrigatória</Text>

                    <View style={styles.content}>
                        <Text style={styles.description}>
                            Uma nova versão do aplicativo está disponível e é necessária para continuar.
                        </Text>

                        {updateInfo?.description && (
                            <View style={styles.detailsContainer}>
                                <Text style={styles.detailsLabel}>
                                    Detalhes da atualização:
                                </Text>
                                <Text style={styles.detailsText}>
                                    {updateInfo.description}
                                </Text>
                            </View>
                        )}

                        {updateInfo?.versionName && (
                            <Text style={styles.versionText}>
                                Versão necessária: {updateInfo.versionName}
                            </Text>
                        )}
                    </View>

                    <View style={styles.actions}>
                        <Button
                            mode="contained"
                            onPress={handleUpdate}
                            style={styles.button}
                            buttonColor="#f44336"
                            icon="download"
                        >
                            Atualizar Agora
                        </Button>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    dialog: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    iconContainer: {
        alignItems: 'center',
        marginBottom: 16,
    },
    iconText: {
        fontSize: 48,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#333',
        marginBottom: 16,
    },
    content: {
        marginBottom: 24,
        gap: 16,
    },
    description: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
    },
    detailsContainer: {
        backgroundColor: '#f5f5f5',
        padding: 12,
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#f44336',
    },
    detailsLabel: {
        fontSize: 14,
        color: '#333',
        fontWeight: '600',
        marginBottom: 6,
    },
    detailsText: {
        fontSize: 14,
        color: '#666',
        lineHeight: 18,
    },
    versionText: {
        fontSize: 12,
        color: '#999',
        textAlign: 'center',
        fontStyle: 'italic',
    },
    actions: {
        width: '100%',
    },
    button: {
        width: '100%',
    },
});

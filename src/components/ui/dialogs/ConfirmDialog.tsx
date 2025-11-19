import { StyleSheet, View } from 'react-native';
import { Dialog, Portal, Text, Button } from 'react-native-paper';

interface ConfirmDialogProps {
    visible: boolean;
    title: string;
    description: string;
    onDismiss: () => void;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    confirmColor?: string;
    cancelColor?: string;
}

export default function ConfirmDialog({
    visible,
    title,
    description,
    onDismiss,
    onConfirm,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    confirmColor = '#0439c9',
    cancelColor = '#666',
}: ConfirmDialogProps) {
    return (
        <Portal>
            <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
                <Dialog.Title style={styles.dialogTitle}>{title}</Dialog.Title>
                <Dialog.Content>
                    <Text variant="bodyMedium" style={styles.dialogText}>
                        {description}
                    </Text>
                </Dialog.Content>
                <Dialog.Actions>
                    <View style={styles.buttonContainer}>
                        <Button
                            mode="outlined"
                            onPress={onDismiss}
                            style={styles.button}
                            textColor={cancelColor}
                        >
                            {cancelText}
                        </Button>
                        <Button
                            mode="contained"
                            onPress={onConfirm}
                            style={styles.button}
                            buttonColor={confirmColor}
                        >
                            {confirmText}
                        </Button>
                    </View>
                </Dialog.Actions>
            </Dialog>
        </Portal>
    );
}

const styles = StyleSheet.create({
    dialog: {
        borderRadius: 16,
    },
    dialogTitle: {
        color: '#333',
        fontWeight: 'bold',
    },
    dialogText: {
        color: '#666',
        lineHeight: 20,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 4,
    },
    button: {
        flex: 1,
        borderRadius: 25,
        marginHorizontal: 2,
    },
});

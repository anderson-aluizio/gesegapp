import { StyleSheet } from 'react-native';
import { Dialog, Portal, Text, Button } from 'react-native-paper';

interface InfoDialogProps {
    visible: boolean;
    description: string;
    onDismiss: () => void;
}

export function InfoDialog({ visible, description, onDismiss }: InfoDialogProps) {
    return (
        <Portal>
            <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
                <Dialog.Title style={styles.dialogTitle}>Informação</Dialog.Title>
                <Dialog.Content>
                    <Text variant="bodyMedium" style={styles.dialogText}>
                        {description}
                    </Text>
                </Dialog.Content>
                <Dialog.Actions>
                    <Button onPress={onDismiss} mode="contained">
                        Fechar
                    </Button>
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
});

import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Dialog, Portal, Text, Button } from 'react-native-paper';
import { useTheme, ThemeColors } from '@/contexts/ThemeContext';

interface InfoDialogProps {
    visible: boolean;
    title: string;
    description: string;
    onDismiss: () => void;
}

export default function InfoDialog({ visible, title, description, onDismiss }: InfoDialogProps) {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

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
                    <Button onPress={onDismiss} mode="contained" buttonColor={colors.buttonPrimary}>
                        Fechar
                    </Button>
                </Dialog.Actions>
            </Dialog>
        </Portal>
    );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
    dialog: {
        borderRadius: 16,
        backgroundColor: colors.surface,
    },
    dialogTitle: {
        color: colors.text,
        fontWeight: 'bold',
    },
    dialogText: {
        color: colors.textSecondary,
        lineHeight: 20,
    },
});

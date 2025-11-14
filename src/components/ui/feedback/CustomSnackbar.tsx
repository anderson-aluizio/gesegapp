import { StyleSheet } from 'react-native';
import { Snackbar } from 'react-native-paper';
import { SnackbarType } from '@/hooks/useSnackbar';

interface CustomSnackbarProps {
    visible: boolean;
    message: string;
    type: SnackbarType;
    onDismiss: () => void;
}

export default function CustomSnackbar({ visible, message, type, onDismiss }: CustomSnackbarProps) {
    const getBackgroundColor = () => {
        switch (type) {
            case 'success':
                return '#4caf50';
            case 'error':
                return '#f44336';
            case 'info':
            default:
                return '#2196f3';
        }
    };

    return (
        <Snackbar
            visible={visible}
            onDismiss={onDismiss}
            duration={4000}
            style={[
                styles.snackbar,
                { backgroundColor: getBackgroundColor() }
            ]}
        >
            {message}
        </Snackbar>
    );
}

const styles = StyleSheet.create({
    snackbar: {
        marginBottom: 16,
        borderRadius: 8,
    },
});

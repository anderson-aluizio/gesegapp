import { useMemo, useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { Dialog, Portal, Text, Button, IconButton } from 'react-native-paper';
import * as Clipboard from 'expo-clipboard';
import { useTheme, ThemeColors } from '@/contexts/ThemeContext';

export interface ErrorDetails {
    message: string;
    stack?: string;
    code?: string;
    context?: Record<string, unknown>;
    timestamp?: string;
}

interface ErrorDetailsDialogProps {
    visible: boolean;
    title: string;
    description: string;
    errorDetails?: ErrorDetails | null;
    onDismiss: () => void;
}

export default function ErrorDetailsDialog({
    visible,
    title,
    description,
    errorDetails,
    onDismiss
}: ErrorDetailsDialogProps) {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const [expanded, setExpanded] = useState(false);
    const [copied, setCopied] = useState(false);

    const formatErrorDetails = (): string => {
        if (!errorDetails) return '';

        const lines: string[] = [
            `=== Detalhes do Erro ===`,
            `Data/Hora: ${errorDetails.timestamp || new Date().toISOString()}`,
            ``,
            `Mensagem: ${errorDetails.message}`,
        ];

        if (errorDetails.code) {
            lines.push(`Código: ${errorDetails.code}`);
        }

        if (errorDetails.context) {
            lines.push(``, `Contexto:`);
            Object.entries(errorDetails.context).forEach(([key, value]) => {
                lines.push(`  ${key}: ${JSON.stringify(value)}`);
            });
        }

        if (errorDetails.stack) {
            lines.push(``, `Stack Trace:`, errorDetails.stack);
        }

        return lines.join('\n');
    };

    const handleCopy = async () => {
        const details = formatErrorDetails();
        await Clipboard.setStringAsync(details);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDismiss = () => {
        setExpanded(false);
        setCopied(false);
        onDismiss();
    };

    return (
        <Portal>
            <Dialog visible={visible} onDismiss={handleDismiss} style={styles.dialog}>
                <Dialog.Title style={styles.dialogTitle}>{title}</Dialog.Title>
                <Dialog.Content>
                    <Text variant="bodyMedium" style={styles.dialogText}>
                        {description}
                    </Text>

                    {errorDetails && (
                        <View style={styles.detailsContainer}>
                            <TouchableOpacity
                                onPress={() => setExpanded(!expanded)}
                                style={styles.expandHeader}
                                activeOpacity={0.7}
                            >
                                <IconButton
                                    icon={expanded ? 'chevron-up' : 'chevron-down'}
                                    size={20}
                                    iconColor={colors.primary}
                                    style={styles.expandIcon}
                                />
                                <Text style={styles.expandText}>
                                    {expanded ? 'Ocultar detalhes técnicos' : 'Ver detalhes técnicos'}
                                </Text>
                            </TouchableOpacity>

                            {expanded && (
                                <View style={styles.expandedContent}>
                                    <View style={styles.copyHeader}>
                                        <Text style={styles.detailsLabel}>Informações para suporte:</Text>
                                        <Button
                                            mode="outlined"
                                            onPress={handleCopy}
                                            compact
                                            style={styles.copyButton}
                                            labelStyle={styles.copyButtonLabel}
                                            icon={copied ? 'check' : 'content-copy'}
                                        >
                                            {copied ? 'Copiado!' : 'Copiar'}
                                        </Button>
                                    </View>
                                    <ScrollView style={styles.detailsScroll} nestedScrollEnabled>
                                        <Text style={styles.detailsText} selectable>
                                            {formatErrorDetails()}
                                        </Text>
                                    </ScrollView>
                                </View>
                            )}
                        </View>
                    )}
                </Dialog.Content>
                <Dialog.Actions>
                    <Button onPress={handleDismiss} mode="contained" buttonColor={colors.buttonPrimary}>
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
        maxHeight: '80%',
    },
    dialogTitle: {
        color: colors.text,
        fontWeight: 'bold',
    },
    dialogText: {
        color: colors.textSecondary,
        lineHeight: 20,
    },
    detailsContainer: {
        marginTop: 16,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingTop: 12,
    },
    expandHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    expandIcon: {
        margin: 0,
        marginLeft: -8,
    },
    expandText: {
        color: colors.primary,
        fontSize: 14,
        fontWeight: '500',
    },
    expandedContent: {
        marginTop: 8,
    },
    copyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    detailsLabel: {
        fontSize: 12,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    copyButton: {
        borderColor: colors.primary,
        height: 32,
    },
    copyButtonLabel: {
        fontSize: 12,
        marginVertical: 0,
    },
    detailsScroll: {
        maxHeight: 200,
        backgroundColor: colors.cardBackground,
        borderRadius: 8,
        padding: 12,
    },
    detailsText: {
        fontSize: 11,
        fontFamily: 'monospace',
        color: colors.text,
        lineHeight: 16,
    },
});

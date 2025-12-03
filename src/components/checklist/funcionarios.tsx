import { useEffect, useState, useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Dialog, IconButton, Portal, Text } from 'react-native-paper';
import { ChecklistRealizadoDatabase } from '@/database/models/useChecklisRealizadoDatabase';
import AutocompleteSearchDropdown, { AutocompleteDropdownOption } from '@/components/ui/inputs/AutocompleteSearchDropdown';
import { ChecklistRealizadoFuncionarioDatabase, useChecklistRealizadoFuncionarioDatabase } from '@/database/models/useChecklistRealizadoFuncionarioDatabase';
import { useSQLiteContext } from 'expo-sqlite';
import { useChecklisRealizadoItemsDatabase } from '@/database/models/useChecklisRealizadoItemsDatabase';
import SignatureCapture from '@/components/ui/inputs/SignatureCapture';
import { useTheme, ThemeColors } from '@/contexts/ThemeContext';

export default function FuncionariosScreen(props: {
    checklistRealizado: ChecklistRealizadoDatabase;
    formUpdated: () => void;
    setReloadList: (reload: boolean) => void;
}) {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    const database = useSQLiteContext();
    const [checklistRealizado, setChecklistRealizado] = useState<ChecklistRealizadoDatabase>(props.checklistRealizado);
    const checklistRealizadoItemsDb = useChecklisRealizadoItemsDatabase();

    useEffect(() => {
        setChecklistRealizado(props.checklistRealizado);
    }, [props.checklistRealizado]);

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [funcionarios, setFuncionarios] = useState<ChecklistRealizadoFuncionarioDatabase[]>([]);
    const [dialogDesc, setDialogDesc] = useState<string>('');
    const [isSignatureDialogVisible, setIsSignatureDialogVisible] = useState<boolean>(false);
    const [funcionarioToSign, setFuncionarioToSign] = useState<ChecklistRealizadoFuncionarioDatabase | null>(null);

    const checklistRealizadoFuncionarioDb = useChecklistRealizadoFuncionarioDatabase();
    const list = async () => {
        try {
            const response = await checklistRealizadoFuncionarioDb.getByChecklistRealizadoId(checklistRealizado.id);
            setFuncionarios(response);
            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching checklist realizado funcionarios:', error);
        }
    }

    useEffect(() => {
        if (checklistRealizado.id) {
            list();
        }
    }, [checklistRealizado.id]);

    const [isDialogConfirmDeleteShow, setIsDialogConfirmDeleteShow] = useState<boolean>(false);
    const [funcionarioToDelete, setFuncionarioToDelete] = useState<number | null>(null);

    const handleChangeFuncionario = async (value: string | object | null) => {
        setIsLoading(true);
        props.setReloadList(true);
        if (value && typeof value === 'object') {
            const cpf = (value as AutocompleteDropdownOption).id;
            const existingFuncionario = funcionarios.find(colaborador => colaborador.funcionario_cpf === cpf);
            if (!existingFuncionario) {
                await checklistRealizadoFuncionarioDb.create(checklistRealizado.id, cpf);
                await list();
            } else {
                setDialogDesc('Colaborador já adicionado.');
                setIsLoading(false);
            }
        } else {
            setDialogDesc('Selecione um colaborador válido.');
            setIsLoading(false);
        }
        setIsLoading(false);
    }

    const handleRemoveFuncionario = async () => {
        setIsDialogConfirmDeleteShow(false);
        props.setReloadList(true);
        if (!funcionarioToDelete) {
            setDialogDesc('Nenhum funcionário selecionado para remoção.');
            return;
        }
        setIsLoading(true);
        await database.withTransactionAsync(async () => {
            await checklistRealizadoItemsDb.clearByChecklistRealizadoId(checklistRealizado.id);
            await checklistRealizadoFuncionarioDb.remove(funcionarioToDelete);
        });
        await list();
        setIsLoading(false);
    }

    const handleSignFuncionario = (funcionario: ChecklistRealizadoFuncionarioDatabase) => {
        setFuncionarioToSign(funcionario);
        setIsSignatureDialogVisible(true);
    }

    const handleSignatureConfirm = async (signatureData: string) => {
        if (!funcionarioToSign) return;

        setIsLoading(true);
        try {
            await checklistRealizadoFuncionarioDb.updateSignature(funcionarioToSign.id, signatureData);
            await list();
        } catch (error) {
            console.error('Erro ao salvar assinatura:', error);
            setDialogDesc('Erro ao salvar assinatura. Tente novamente.');
        } finally {
            setIsLoading(false);
            setIsSignatureDialogVisible(false);
            setFuncionarioToSign(null);
        }
    }

    const handleSignatureDismiss = () => {
        setIsSignatureDialogVisible(false);
        setFuncionarioToSign(null);
    }
    return (
        <View style={styles.container}>
            <ScrollView>
                {isLoading ? (
                    <View style={[styles.inner, { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 300 }]}>
                        <ActivityIndicator size="large" />
                    </View>
                ) : (
                    <View style={styles.inner}>
                        {checklistRealizado.checklist_grupo_nome_interno !== 'checklist_apr' &&
                            checklistRealizado.checklist_grupo_nome_interno !== 'checklist_auto_checklist' && (
                                <AutocompleteSearchDropdown
                                    listName="funcionarios"
                                    label="Colaborador"
                                    placeholder="Digite o nome do colaborador"
                                    returnObject={true}
                                    disable={isLoading}
                                    onValueChange={handleChangeFuncionario} />
                            )}
                        <View>
                            {funcionarios.length === 0 ? (
                                <Text>Nenhum colaborador adicionado.</Text>
                            ) : (
                                <View style={{ gap: 12 }}>
                                    {funcionarios.map((colaborador) => (
                                        <View
                                            key={colaborador.id != null ? colaborador.id : colaborador.funcionario_cpf}
                                            style={styles.cardView}
                                        >
                                            <View
                                                style={styles.cardTitle}
                                            >
                                                <Text style={styles.cardTitleText}>
                                                    {colaborador.funcionario_nome ? colaborador.funcionario_nome.charAt(0).toUpperCase() : ''}
                                                </Text>
                                            </View>
                                            <View style={styles.cardSubtitle}>
                                                <Text style={styles.cardSubtitleText}>
                                                    {colaborador.funcionario_nome}
                                                </Text>
                                                <Text style={styles.cardDescriptionText}>
                                                    Cargo: {colaborador.funcionario_cargo_nome}
                                                </Text>
                                                <Text style={styles.cardDescriptionText}>
                                                    Matricula: {colaborador.funcionario_matricula}
                                                </Text>
                                                {colaborador.assinatura && (
                                                    <View style={styles.signedBadge}>
                                                        <IconButton
                                                            icon="check-circle"
                                                            iconColor={colors.success}
                                                            size={16}
                                                            style={{ margin: 0 }}
                                                        />
                                                        <Text style={styles.signedText}>Assinado</Text>
                                                    </View>
                                                )}
                                            </View>
                                            <IconButton
                                                icon={colaborador.assinatura ? "pen" : "draw"}
                                                iconColor={colaborador.assinatura ? colors.info : colors.success}
                                                size={26}
                                                onPress={() => handleSignFuncionario(colaborador)}
                                                style={{ marginLeft: 4 }}
                                                accessibilityLabel={colaborador.assinatura ? `Re-assinar ${colaborador.funcionario_nome}` : `Assinar ${colaborador.funcionario_nome}`}
                                                disabled={isLoading}
                                            />
                                            {checklistRealizado.checklist_grupo_nome_interno !== 'checklist_apr' &&
                                                checklistRealizado.checklist_grupo_nome_interno !== 'checklist_auto_checklist' && (
                                                    <IconButton
                                                        icon="trash-can-outline"
                                                        iconColor={colors.error}
                                                        size={26}
                                                        onPress={() => { setFuncionarioToDelete(colaborador.id); setIsDialogConfirmDeleteShow(true); }}
                                                        style={{ marginLeft: 4 }}
                                                        accessibilityLabel={`Remover ${colaborador.funcionario_nome}`}
                                                        disabled={isLoading}
                                                    />
                                                )}
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    </View>
                )}
                <Portal>
                    <Dialog visible={Boolean(dialogDesc.length)} onDismiss={() => setDialogDesc('')} style={styles.dialog}>
                        <Dialog.Title style={styles.dialogTitle}>Atenção</Dialog.Title>
                        <Dialog.Content>
                            <Text variant="bodyMedium" style={styles.dialogText}>
                                {dialogDesc}
                            </Text>
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button onPress={() => setDialogDesc('')} textColor={colors.buttonPrimary}>Fechar</Button>
                        </Dialog.Actions>
                    </Dialog>
                </Portal>
                <Portal>
                    <Dialog visible={isDialogConfirmDeleteShow} onDismiss={() => setIsDialogConfirmDeleteShow(false)} style={styles.dialog}>
                        <Dialog.Title style={styles.dialogTitle}>Atenção</Dialog.Title>
                        <Dialog.Content>
                            <Text variant="bodyMedium" style={styles.dialogText}>
                                Deseja realmente remover este funcionário da lista?
                            </Text>
                            <Text variant="bodySmall" style={{ color: colors.error, marginTop: 8 }}>
                                Caso haja itens respondidos, eles serão removidos.
                            </Text>
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button onPress={() => setIsDialogConfirmDeleteShow(false)} textColor={colors.textSecondary}>Fechar</Button>
                            <Button onPress={handleRemoveFuncionario} textColor={colors.error}>Remover</Button>
                        </Dialog.Actions>
                    </Dialog>
                </Portal>

                <SignatureCapture
                    visible={isSignatureDialogVisible}
                    onConfirm={handleSignatureConfirm}
                    onDismiss={handleSignatureDismiss}
                    title={`Assinatura - ${funcionarioToSign?.funcionario_nome || ''}`}
                />
            </ScrollView>
        </View >
    );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
    container: {
        flex: 1,
    },
    inner: {
        gap: 10,
        padding: 16,
    },
    btnNext: {
        margin: 16,
    },
    cardView: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.cardBackground,
        borderRadius: 12,
        padding: 4,
        marginBottom: 4,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1
    },
    cardTitle: {
        backgroundColor: colors.surfaceVariant,
        borderRadius: 24,
        width: 48,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    cardTitleText: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.textSecondary,
    },
    cardSubtitle: {
        flex: 1,
        justifyContent: 'center',
    },
    cardSubtitleText: {
        fontWeight: '700',
        fontSize: 17,
        color: colors.text,
    },
    cardDescriptionText: {
        fontSize: 14,
        color: colors.textTertiary,
    },
    signedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    signedText: {
        fontSize: 13,
        color: colors.success,
        fontWeight: '600',
        marginLeft: -8,
    },
    dialog: {
        backgroundColor: colors.surface,
        borderRadius: 16,
    },
    dialogTitle: {
        color: colors.text,
        fontWeight: 'bold',
    },
    dialogText: {
        color: colors.textSecondary,
    },
});

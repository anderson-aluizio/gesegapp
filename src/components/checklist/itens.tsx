import { useCallback, useEffect, useState, useRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Dialog, MD2Colors, Portal, Text } from 'react-native-paper';
import { ChecklistRealizadoDatabase } from '@/database/models/useChecklisRealizadoDatabase';
import { ChecklistRealizadoItemsDatabaseWithItem, useChecklisRealizadoItemsDatabase } from '@/database/models/useChecklisRealizadoItemsDatabase';
import { ChecklistRealizadoFuncionarioDatabase, useChecklistRealizadoFuncionarioDatabase } from '@/database/models/useChecklistRealizadoFuncionarioDatabase';
import ChecklistItem from './ChecklistItem';
import validateItemIsRespondido from './utils';

export default function ItensScreen(props: {
    checklistRealizado: ChecklistRealizadoDatabase;
    formUpdated: () => void;
    isActive?: boolean;
    reloadList: boolean;
    setReloadList: (reload: boolean) => void;
}) {
    const { checklistRealizado } = props;
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isFormDirty, setIsFormDirty] = useState<boolean>(false);
    const [checklistEstruturaItems, setChecklistEstruturaItems] = useState<ChecklistRealizadoItemsDatabaseWithItem[]>([]);
    const [funcionarios, setFuncionarios] = useState<ChecklistRealizadoFuncionarioDatabase[]>([]);
    const [dialogDesc, setDialogDesc] = useState<string>('');
    const [modifiedItemIds, setModifiedItemIds] = useState<Set<number>>(new Set());

    const isMountedRef = useRef(true);
    const lastChecklistIdRef = useRef<number | null>(null);

    const useChecklisRealizadoItemsDb = useChecklisRealizadoItemsDatabase();
    const checklistRealizadoFuncionarioDb = useChecklistRealizadoFuncionarioDatabase();

    const list = useCallback(async () => {
        setIsLoading(true);
        setFuncionarios([]);
        setChecklistEstruturaItems([]);
        setModifiedItemIds(new Set());
        props.setReloadList(false);

        if (!checklistRealizado.id) {
            setIsLoading(false);
            return;
        }

        try {
            const responseFuncionarios = await checklistRealizadoFuncionarioDb.getByChecklistRealizadoId(checklistRealizado.id);
            setFuncionarios(responseFuncionarios);

            if (responseFuncionarios.length === 0) {
                setDialogDesc('Nenhum colaborador encontrado. Por favor, adicione colaboradores antes de responder os itens.');
                setIsLoading(false);
                return;
            }

            const response = await useChecklisRealizadoItemsDb.getByChecklistRealizadoId(checklistRealizado.id);
            setChecklistEstruturaItems(response);
        } catch (error) {
            console.error('Error fetching checklist estrutura items:', error);
        }
        setIsLoading(false);
    }, [checklistRealizado.id]);

    useEffect(() => {
        if (props.reloadList || (props.isActive && checklistRealizado.id &&
            isMountedRef.current &&
            lastChecklistIdRef.current !== checklistRealizado.id)) {
            lastChecklistIdRef.current = checklistRealizado.id;
            list();
        }
    }, [props.isActive, checklistRealizado.id, list]);

    useEffect(() => {
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const handleAlternativaSelect = useCallback((itemId: number, resposta: string) => {
        setIsFormDirty(true);
        setModifiedItemIds(prev => new Set(prev).add(itemId));

        setChecklistEstruturaItems(prevItems => {
            return prevItems.map(item => {
                if (item.id !== itemId) return item;

                const isInconforme = Boolean(
                    item.is_gera_nao_conformidade &&
                    item.alternativa_inconformidades_array?.length &&
                    item.alternativa_inconformidades_array.includes(resposta)
                );

                const updatedItem = {
                    ...item,
                    resposta,
                    is_inconforme: isInconforme,
                    ...(isInconforme && funcionarios.length === 1 && {
                        inconformidade_funcionarios_array: [funcionarios[0].funcionario_cpf]
                    }),
                    ...(!isInconforme && {
                        descricao: '',
                        inconformidade_funcionarios_array: undefined
                    })
                };

                const funcionariosFilled = Boolean(updatedItem.inconformidade_funcionarios_array?.length);
                const isDescricaoFilled = Boolean(updatedItem.descricao?.trim());

                updatedItem.is_respondido = validateItemIsRespondido(
                    isInconforme,
                    funcionariosFilled,
                    Boolean(updatedItem.is_desc_nconf_required),
                    isDescricaoFilled,
                    Boolean(updatedItem.is_foto_obrigatoria),
                    updatedItem.foto_path
                );

                return updatedItem;
            });
        });
    }, [funcionarios]);

    const handleFuncionarioSelection = useCallback((itemId: number, selectedFuncionarios: string[]) => {
        setIsFormDirty(true);
        setModifiedItemIds(prev => new Set(prev).add(itemId));

        setChecklistEstruturaItems(prevItems => {
            return prevItems.map(item => {
                if (item.id !== itemId) return item;

                const isInconforme = Boolean(
                    item.is_gera_nao_conformidade &&
                    item.alternativa_inconformidades_array?.length &&
                    item.alternativa_inconformidades_array.includes(item.resposta || '')
                );

                const updatedItem = {
                    ...item,
                    inconformidade_funcionarios_array: selectedFuncionarios.length ? selectedFuncionarios : undefined,
                    is_inconforme: isInconforme
                };

                const funcionariosFilled = Boolean(selectedFuncionarios.length);
                const isDescricaoFilled = Boolean(updatedItem.descricao?.trim());

                updatedItem.is_respondido = validateItemIsRespondido(
                    isInconforme,
                    funcionariosFilled,
                    Boolean(updatedItem.is_desc_nconf_required),
                    isDescricaoFilled,
                    Boolean(updatedItem.is_foto_obrigatoria),
                    updatedItem.foto_path
                );

                return updatedItem;
            });
        });
    }, []);

    const handleDescricaoInput = useCallback((itemId: number, value: string) => {
        setIsFormDirty(true);
        setModifiedItemIds(prev => new Set(prev).add(itemId));

        setChecklistEstruturaItems(prevItems => {
            return prevItems.map(item => {
                if (item.id !== itemId) return item;

                const isInconforme = Boolean(
                    item.is_gera_nao_conformidade &&
                    item.alternativa_inconformidades_array?.length &&
                    item.alternativa_inconformidades_array.includes(item.resposta || '')
                );

                const updatedItem = {
                    ...item,
                    descricao: value,
                    is_inconforme: isInconforme
                };

                const funcionariosFilled = Boolean(updatedItem.inconformidade_funcionarios_array?.length);
                const isDescricaoFilled = Boolean(value?.trim());

                updatedItem.is_respondido = validateItemIsRespondido(
                    isInconforme,
                    funcionariosFilled,
                    Boolean(updatedItem.is_desc_nconf_required),
                    isDescricaoFilled,
                    Boolean(updatedItem.is_foto_obrigatoria),
                    updatedItem.foto_path
                );

                return updatedItem;
            });
        });
    }, []);

    const handleClearResponse = useCallback((itemId: number) => {
        setIsFormDirty(true);
        setModifiedItemIds(prev => new Set(prev).add(itemId));

        setChecklistEstruturaItems(prevItems => {
            return prevItems.map(item => {
                if (item.id !== itemId) return item;

                return {
                    ...item,
                    resposta: '',
                    descricao: '',
                    foto_path: undefined,
                    inconformidade_funcionarios_array: undefined,
                    is_respondido: false,
                    is_inconforme: false
                };
            });
        });
    }, []);

    const handlePhotoSelect = useCallback((itemId: number, fotoPath: string) => {
        setIsFormDirty(true);
        setModifiedItemIds(prev => new Set(prev).add(itemId));

        setChecklistEstruturaItems(prevItems => {
            return prevItems.map(item => {
                if (item.id !== itemId) return item;

                const isInconforme = Boolean(
                    item.is_gera_nao_conformidade &&
                    item.alternativa_inconformidades_array?.length &&
                    item.alternativa_inconformidades_array.includes(item.resposta || '')
                );

                const updatedItem = {
                    ...item,
                    foto_path: fotoPath,
                    is_inconforme: isInconforme
                };

                const funcionariosFilled = Boolean(updatedItem.inconformidade_funcionarios_array?.length);
                const isDescricaoFilled = Boolean(updatedItem.descricao?.trim());

                updatedItem.is_respondido = validateItemIsRespondido(
                    isInconforme,
                    funcionariosFilled,
                    Boolean(updatedItem.is_desc_nconf_required),
                    isDescricaoFilled,
                    Boolean(updatedItem.is_foto_obrigatoria),
                    fotoPath
                );

                return updatedItem;
            });
        });
    }, []);

    const handlePhotoRemove = useCallback((itemId: number) => {
        setIsFormDirty(true);
        setModifiedItemIds(prev => new Set(prev).add(itemId));

        setChecklistEstruturaItems(prevItems => {
            return prevItems.map(item => {
                if (item.id !== itemId) return item;

                const isInconforme = Boolean(
                    item.is_gera_nao_conformidade &&
                    item.alternativa_inconformidades_array?.length &&
                    item.alternativa_inconformidades_array.includes(item.resposta || '')
                );

                const updatedItem = {
                    ...item,
                    foto_path: undefined,
                    is_inconforme: isInconforme
                };

                const funcionariosFilled = Boolean(updatedItem.inconformidade_funcionarios_array?.length);
                const isDescricaoFilled = Boolean(updatedItem.descricao?.trim());

                updatedItem.is_respondido = validateItemIsRespondido(
                    isInconforme,
                    funcionariosFilled,
                    Boolean(updatedItem.is_desc_nconf_required),
                    isDescricaoFilled,
                    Boolean(updatedItem.is_foto_obrigatoria),
                    undefined
                );

                return updatedItem;
            });
        });
    }, []);

    const handleUpdate = useCallback(async () => {
        if (checklistEstruturaItems.length === 0) {
            setDialogDesc('Nenhum item encontrado para atualizar.');
            return;
        }

        setIsLoading(true);

        const checklistEstruturaItemsToUpdate = checklistEstruturaItems.filter(item =>
            modifiedItemIds.has(item.id)
        );

        if (checklistEstruturaItemsToUpdate.length === 0) {
            setIsLoading(false);
            setIsFormDirty(false);
            return;
        }

        try {
            for (const item of checklistEstruturaItemsToUpdate) {
                const itemToUpdate = { ...item };
                itemToUpdate.inconformidade_funcionarios = item.inconformidade_funcionarios_array?.length ?
                    item.inconformidade_funcionarios_array.join(',') : '';
                await useChecklisRealizadoItemsDb.update(itemToUpdate);
            }
            setIsFormDirty(false);
            setModifiedItemIds(new Set());
            props.formUpdated();
            setDialogDesc('Respostas atualizadas com sucesso!');
        } catch (error) {
            console.error('Error updating checklist items:', error);
            setDialogDesc('Erro ao atualizar as respostas. Tente novamente.');
        }
        setIsLoading(false);
    }, [checklistEstruturaItems, modifiedItemIds, useChecklisRealizadoItemsDb, checklistRealizado.id, props.formUpdated]);

    return (
        <>
            {isLoading ? (
                <View style={styles.loading}>
                    <ActivityIndicator animating={true} color={MD2Colors.blue500} size="large" />
                </View>
            ) : (
                <View style={styles.container}>
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View style={styles.inner}>
                            {checklistEstruturaItems.length === 0 ? (
                                <Text style={styles.emptyText}>
                                    Nenhum item encontrado.
                                </Text>
                            ) : (
                                checklistEstruturaItems.map((item) => (
                                    <ChecklistItem
                                        key={item.id}
                                        item={item}
                                        funcionarios={funcionarios}
                                        onAlternativaSelect={handleAlternativaSelect}
                                        onFuncionarioSelection={handleFuncionarioSelection}
                                        onDescricaoInput={handleDescricaoInput}
                                        onClearResponse={handleClearResponse}
                                        onPhotoSelect={handlePhotoSelect}
                                        onPhotoRemove={handlePhotoRemove}
                                    />
                                ))
                            )}
                        </View>
                    </ScrollView>
                    {isFormDirty && (
                        <Button
                            mode="contained"
                            onPress={handleUpdate}
                            buttonColor="#0439c9"
                            style={styles.btnNext}
                        >
                            ATUALIZAR
                        </Button>
                    )}
                </View>
            )}
            <Portal>
                <Dialog visible={Boolean(dialogDesc.length)} onDismiss={() => setDialogDesc('')}>
                    <Dialog.Title>Atenção</Dialog.Title>
                    <Dialog.Content>
                        <Text variant="bodyMedium">
                            {dialogDesc}
                        </Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setDialogDesc('')}>Fechar</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </>
    );
}

const styles = StyleSheet.create({
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        zIndex: 10,
        width: '100%',
        height: '100%'
    },
    container: {
        flex: 1,
    },
    inner: {
        gap: 10,
        padding: 16,
    },
    emptyText: {
        textAlign: 'center',
        color: '#888',
        marginVertical: 24,
        fontSize: 16
    },
    btnNext: {
        margin: 16,
    },
});

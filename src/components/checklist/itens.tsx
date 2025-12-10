import { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Dialog, Portal, Text, Searchbar, Chip } from 'react-native-paper';
import { ChecklistRealizadoDatabase } from '@/database/models/useChecklisRealizadoDatabase';
import { ChecklistRealizadoItemsDatabaseWithItem, useChecklisRealizadoItemsDatabase } from '@/database/models/useChecklisRealizadoItemsDatabase';
import { ChecklistRealizadoFuncionarioDatabase, useChecklistRealizadoFuncionarioDatabase } from '@/database/models/useChecklistRealizadoFuncionarioDatabase';
import ChecklistItem from './ChecklistItem';
import CollapsibleSection from './CollapsibleSection';
import validateItemIsRespondido from './utils';
import { useTheme, ThemeColors } from '@/contexts/ThemeContext';

export default function ItensScreen(props: {
    checklistRealizado: ChecklistRealizadoDatabase;
    formUpdated: () => void;
    isActive?: boolean;
    reloadList: boolean;
    setReloadList: (reload: boolean) => void;
}) {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    const { checklistRealizado } = props;
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isFormDirty, setIsFormDirty] = useState<boolean>(false);
    const [checklistEstruturaItems, setChecklistEstruturaItems] = useState<ChecklistRealizadoItemsDatabaseWithItem[]>([]);
    const [funcionarios, setFuncionarios] = useState<ChecklistRealizadoFuncionarioDatabase[]>([]);
    const [dialogDesc, setDialogDesc] = useState<string>('');
    const [modifiedItemIds, setModifiedItemIds] = useState<Set<number>>(new Set());
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedSubGrupo, setSelectedSubGrupo] = useState<string | null>(null);
    const [expandedSection, setExpandedSection] = useState<string | null>(null);

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
                    Boolean(isInconforme && updatedItem.is_foto_obrigatoria),
                    updatedItem.foto_path,
                    updatedItem.resposta
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
                    Boolean(isInconforme && updatedItem.is_foto_obrigatoria),
                    updatedItem.foto_path,
                    updatedItem.resposta
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
                    Boolean(isInconforme && updatedItem.is_foto_obrigatoria),
                    updatedItem.foto_path,
                    updatedItem.resposta
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
                    Boolean(isInconforme && updatedItem.is_foto_obrigatoria),
                    fotoPath,
                    updatedItem.resposta
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
                    Boolean(isInconforme && updatedItem.is_foto_obrigatoria),
                    undefined,
                    updatedItem.resposta
                );

                return updatedItem;
            });
        });
    }, []);

    // Group items by sub_grupo
    const groupedItems = useMemo(() => {
        const groups: { [key: string]: ChecklistRealizadoItemsDatabaseWithItem[] } = {};
        const noGroupKey = 'Sem Grupo';

        checklistEstruturaItems.forEach(item => {
            const groupKey = item.checklist_sub_grupo?.trim() || noGroupKey;
            if (!groups[groupKey]) {
                groups[groupKey] = [];
            }
            groups[groupKey].push(item);
        });

        // Sort groups: "Sem Grupo" goes last
        const sortedKeys = Object.keys(groups).sort((a, b) => {
            if (a === noGroupKey) return 1;
            if (b === noGroupKey) return -1;
            return a.localeCompare(b);
        });

        return sortedKeys.map(key => ({
            name: key,
            items: groups[key],
            answeredCount: groups[key].filter(item => item.is_respondido).length,
            totalCount: groups[key].length
        }));
    }, [checklistEstruturaItems]);

    // Get unique sub_grupos for filter chips
    const subGrupos = useMemo(() => {
        const grupos = new Set<string>();
        checklistEstruturaItems.forEach(item => {
            if (item.checklist_sub_grupo?.trim()) {
                grupos.add(item.checklist_sub_grupo.trim());
            }
        });
        return Array.from(grupos).sort();
    }, [checklistEstruturaItems]);

    // Filter groups based on search and selected sub_grupo
    const filteredGroupedItems = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();

        return groupedItems.map(group => {
            // Filter by selected sub_grupo chip
            if (selectedSubGrupo && group.name !== selectedSubGrupo) {
                return { ...group, items: [] };
            }

            // Filter by search query
            if (!query) {
                return group;
            }

            const filteredItems = group.items.filter(item =>
                item.checklist_item_nome?.toLowerCase().includes(query) ||
                item.checklist_sub_grupo?.toLowerCase().includes(query)
            );

            return { ...group, items: filteredItems };
        }).filter(group => group.items.length > 0);
    }, [groupedItems, searchQuery, selectedSubGrupo]);

    // Calculate overall progress
    const overallProgress = useMemo(() => {
        const answered = checklistEstruturaItems.filter(item => item.is_respondido).length;
        const total = checklistEstruturaItems.length;
        return { answered, total };
    }, [checklistEstruturaItems]);

    // Handle section toggle - only one can be expanded at a time
    const handleSectionToggle = useCallback((sectionName: string) => {
        setExpandedSection(prev => prev === sectionName ? null : sectionName);
    }, []);

    // Reset filters and collapse all sections
    const resetFiltersAndSections = useCallback(() => {
        setSearchQuery('');
        setSelectedSubGrupo(null);
        setExpandedSection(null);
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
            resetFiltersAndSections();
            props.formUpdated();
            setDialogDesc('Respostas atualizadas com sucesso!');
        } catch (error) {
            console.error('Error updating checklist items:', error);
            setDialogDesc('Erro ao atualizar as respostas. Tente novamente.');
        }
        setIsLoading(false);
    }, [checklistEstruturaItems, modifiedItemIds, useChecklisRealizadoItemsDb, checklistRealizado.id, props.formUpdated, resetFiltersAndSections]);

    return (
        <>
            {isLoading ? (
                <View style={styles.loading}>
                    <ActivityIndicator animating={true} color={colors.primary} size="large" />
                </View>
            ) : (
                <View style={styles.container}>
                    {checklistEstruturaItems.length > 0 && (
                        <View style={styles.searchContainer}>
                            <Searchbar
                                placeholder="Buscar por item ou grupo..."
                                onChangeText={setSearchQuery}
                                value={searchQuery}
                                style={styles.searchBar}
                                inputStyle={styles.searchInput}
                                iconColor={colors.textSecondary}
                                placeholderTextColor={colors.textMuted}
                            />
                            <View style={styles.progressOverview}>
                                <Text style={styles.progressOverviewText}>
                                    Progresso: {overallProgress.answered}/{overallProgress.total} itens respondidos
                                </Text>
                            </View>
                            {subGrupos.length > 1 && (
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    style={styles.chipsContainer}
                                    contentContainerStyle={styles.chipsContent}
                                >
                                    <Chip
                                        selected={selectedSubGrupo === null}
                                        onPress={() => setSelectedSubGrupo(null)}
                                        style={styles.chip}
                                        textStyle={styles.chipText}
                                        mode="outlined"
                                    >
                                        Todos
                                    </Chip>
                                    {subGrupos.map(grupo => (
                                        <Chip
                                            key={grupo}
                                            selected={selectedSubGrupo === grupo}
                                            onPress={() => setSelectedSubGrupo(selectedSubGrupo === grupo ? null : grupo)}
                                            style={styles.chip}
                                            textStyle={styles.chipText}
                                            mode="outlined"
                                        >
                                            {grupo}
                                        </Chip>
                                    ))}
                                </ScrollView>
                            )}
                        </View>
                    )}
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View style={styles.inner}>
                            {checklistEstruturaItems.length === 0 ? (
                                <Text style={styles.emptyText}>
                                    Nenhum item encontrado.
                                </Text>
                            ) : filteredGroupedItems.length === 0 ? (
                                <Text style={styles.emptyText}>
                                    Nenhum item encontrado para &quot;{searchQuery}&quot;.
                                </Text>
                            ) : (
                                filteredGroupedItems.map((group) => (
                                    <CollapsibleSection
                                        key={group.name}
                                        title={group.name}
                                        answeredCount={group.answeredCount}
                                        totalCount={group.totalCount}
                                        isExpanded={expandedSection === group.name}
                                        onToggle={() => handleSectionToggle(group.name)}
                                    >
                                        {group.items.map((item) => (
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
                                        ))}
                                    </CollapsibleSection>
                                ))
                            )}
                        </View>
                    </ScrollView>
                    {isFormDirty && (
                        <Button
                            mode="contained"
                            onPress={handleUpdate}
                            buttonColor={colors.buttonPrimary}
                            style={styles.btnNext}
                        >
                            ATUALIZAR
                        </Button>
                    )}
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
        </>
    );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        zIndex: 10,
        width: '100%',
        height: '100%',
        backgroundColor: colors.background,
    },
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    searchContainer: {
        backgroundColor: colors.surface,
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    searchBar: {
        backgroundColor: colors.surfaceVariant,
        borderRadius: 10,
        elevation: 0,
    },
    searchInput: {
        fontSize: 14,
        color: colors.text,
    },
    progressOverview: {
        marginTop: 8,
        alignItems: 'center',
    },
    progressOverviewText: {
        fontSize: 13,
        color: colors.textSecondary,
        fontWeight: '500',
    },
    chipsContainer: {
        marginTop: 10,
    },
    chipsContent: {
        paddingRight: 16,
        gap: 8,
    },
    chip: {
        backgroundColor: colors.surfaceVariant,
        borderColor: colors.border,
    },
    chipText: {
        fontSize: 12,
        color: colors.text,
    },
    inner: {
        gap: 10,
        padding: 16,
    },
    emptyText: {
        textAlign: 'center',
        color: colors.textSecondary,
        marginVertical: 24,
        fontSize: 16
    },
    btnNext: {
        margin: 16,
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

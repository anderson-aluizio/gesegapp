import { useEffect, useState, useMemo, useCallback } from 'react';
import { ScrollView, StyleSheet, View, Pressable } from 'react-native';
import { Button, Text, ActivityIndicator, IconButton, Searchbar, TextInput, Chip } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ChecklistRealizadoDatabase } from '@/database/models/useChecklisRealizadoDatabase';
import { useAcaoCampoDatabase, AcaoCampoDatabase } from '@/database/models/useAcaoCampoDatabase';
import {
    useChecklistRealizadoAcaoCampoDatabase,
    ChecklistRealizadoAcaoCampoDatabaseWithRelations
} from '@/database/models/useChecklistRealizadoAcaoCampoDatabase';
import { useDialog } from '@/hooks/useDialog';
import InfoDialog from '@/components/ui/dialogs/InfoDialog';
import { useTheme, ThemeColors } from '@/contexts/ThemeContext';

export default function AcaoCamposScreen(props: {
    checklistRealizado: ChecklistRealizadoDatabase;
    formUpdated: () => void;
}) {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    const { checklistRealizado } = props;
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [tipoServicos, setTipoAcoes] = useState<string[]>([]);
    const [selectedTipoServico, setSelectedTipoServico] = useState<string | null>(null);
    const [availableAcoes, setAvailableAcoes] = useState<AcaoCampoDatabase[]>([]);
    const [selectedAcoes, setSelectedAcoes] = useState<ChecklistRealizadoAcaoCampoDatabaseWithRelations[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isQuantidadeDirty, setIsQuantidadeDirty] = useState(false);
    const [quantidadeInputs, setQuantidadeInputs] = useState<Record<number, string>>({});
    const [showPicker, setShowPicker] = useState(false);

    const dialog = useDialog();
    const acaoCampoDb = useAcaoCampoDatabase();
    const checklistAcaoCampoDb = useChecklistRealizadoAcaoCampoDatabase();

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const tipos = await acaoCampoDb.getTipoServicosByCentroCustoId(checklistRealizado.centro_custo_id);
            setTipoAcoes(tipos);

            const selected = await checklistAcaoCampoDb.getByChecklistRealizadoId(checklistRealizado.id);
            setSelectedAcoes(selected);
        } catch (error) {
            console.error('Erro ao carregar ações de campo:', error);
        } finally {
            setIsLoading(false);
        }
    }, [checklistRealizado.id, checklistRealizado.centro_custo_id]);

    useEffect(() => {
        if (checklistRealizado.id) {
            loadData();
        }
    }, [checklistRealizado.id]);

    const loadAcoesByTipoServico = useCallback(async (tipoServico: string) => {
        try {
            const acoes = await acaoCampoDb.getByCentroCustoIdAndTipoServico(
                checklistRealizado.centro_custo_id,
                tipoServico
            );
            setAvailableAcoes(acoes);
        } catch (error) {
            console.error('Erro ao carregar ações por tipo:', error);
        }
    }, [checklistRealizado.centro_custo_id]);

    const handleTipoServicoSelect = useCallback((tipoServico: string) => {
        setSelectedTipoServico(tipoServico);
        setSearchQuery('');
        loadAcoesByTipoServico(tipoServico);
    }, [loadAcoesByTipoServico]);

    const filteredAcoes = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        const selectedIds = new Set(selectedAcoes.map(a => a.acao_campo_id));

        return availableAcoes
            .filter(a => !selectedIds.has(a.id))
            .filter(a => {
                if (!query) return true;
                return a.nome?.toLowerCase().includes(query) ||
                    a.codigo_descricao?.toLowerCase().includes(query);
            });
    }, [availableAcoes, selectedAcoes, searchQuery]);

    const handleAdd = async (acaoCampo: AcaoCampoDatabase) => {
        try {
            await checklistAcaoCampoDb.create({
                acao_campo_id: acaoCampo.id,
                checklist_realizado_id: checklistRealizado.id,
                quantidade: 1,
            });
            setShowPicker(false);
            setSearchQuery('');
            setSelectedTipoServico(null);
            setAvailableAcoes([]);
            await loadData();
            props.formUpdated();
        } catch (error) {
            console.error('Erro ao adicionar ação de campo:', error);
            dialog.show('Erro', 'Erro ao adicionar ação de campo.');
        }
    };

    const handleRemove = async (id: number) => {
        try {
            await checklistAcaoCampoDb.remove(id);
            await loadData();
            props.formUpdated();
        } catch (error) {
            console.error('Erro ao remover ação de campo:', error);
            dialog.show('Erro', 'Erro ao remover ação de campo.');
        }
    };

    const handleQuantidadeChange = (id: number, value: string) => {
        setQuantidadeInputs(prev => ({ ...prev, [id]: value }));
        setIsQuantidadeDirty(true);
    };

    const handleSaveQuantidades = async () => {
        const parsedAcoes = selectedAcoes.map(acao => {
            const raw = quantidadeInputs[acao.id];
            const quantidade = raw !== undefined ? parseFloat(raw.replace(',', '.')) : acao.quantidade;
            return { ...acao, quantidade };
        });

        const invalid = parsedAcoes.find(a => isNaN(a.quantidade) || a.quantidade <= 0);
        if (invalid) {
            dialog.show('Atenção', `A quantidade deve ser maior que 0.\nVerifique: "${invalid.nome}"`);
            return;
        }

        setIsSaving(true);
        try {
            for (const acao of parsedAcoes) {
                await checklistAcaoCampoDb.update(acao.id, acao.quantidade);
            }
            setIsQuantidadeDirty(false);
            setQuantidadeInputs({});
            props.formUpdated();
            dialog.show('Sucesso', 'Quantidades atualizadas com sucesso.');
        } catch (error) {
            console.error('Erro ao salvar quantidades:', error);
            dialog.show('Erro', 'Erro ao salvar quantidades.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleClosePicker = () => {
        setShowPicker(false);
        setSelectedTipoServico(null);
        setAvailableAcoes([]);
        setSearchQuery('');
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Carregando ações de campo...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView}>
                <View style={styles.inner}>
                    <View style={styles.headerRow}>
                        <Text style={styles.headerText}>Ações de Campo</Text>
                        <Button
                            mode="contained"
                            icon={showPicker ? 'close' : 'plus'}
                            onPress={() => showPicker ? handleClosePicker() : setShowPicker(true)}
                            buttonColor={showPicker ? colors.textSecondary : colors.buttonPrimary}
                            compact
                        >
                            {showPicker ? 'Fechar' : 'Adicionar'}
                        </Button>
                    </View>

                    {showPicker && (
                        <View style={styles.pickerContainer}>
                            {!selectedTipoServico ? (
                                <View style={styles.tipoServicoSection}>
                                    <Text style={styles.tipoServicoLabel}>Selecione o tipo de serviço:</Text>
                                    <View style={styles.tipoServicoList}>
                                        {tipoServicos.map(tipo => (
                                            <Chip
                                                key={tipo}
                                                onPress={() => handleTipoServicoSelect(tipo)}
                                                style={styles.tipoServicoChip}
                                                textStyle={styles.tipoServicoChipText}
                                                mode="outlined"
                                                icon="chevron-right"
                                            >
                                                {tipo}
                                            </Chip>
                                        ))}
                                        {tipoServicos.length === 0 && (
                                            <Text style={styles.emptyPickerText}>
                                                Nenhum tipo de serviço disponível. Sincronize os dados primeiro.
                                            </Text>
                                        )}
                                    </View>
                                </View>
                            ) : (
                                <>
                                    <Pressable
                                        style={styles.tipoServicoSelectedHeader}
                                        onPress={() => {
                                            setSelectedTipoServico(null);
                                            setAvailableAcoes([]);
                                            setSearchQuery('');
                                        }}
                                    >
                                        <IconButton icon="arrow-left" size={18} iconColor={colors.primary} style={{ margin: 0 }} />
                                        <Text style={styles.tipoServicoSelectedText}>{selectedTipoServico}</Text>
                                    </Pressable>
                                    <Searchbar
                                        placeholder="Buscar ação por nome ou código..."
                                        onChangeText={setSearchQuery}
                                        value={searchQuery}
                                        style={styles.searchBar}
                                        inputStyle={styles.searchInput}
                                        iconColor={colors.textSecondary}
                                        placeholderTextColor={colors.textMuted}
                                    />
                                    <ScrollView
                                        style={styles.pickerList}
                                        nestedScrollEnabled
                                    >
                                        {filteredAcoes.length === 0 ? (
                                            <Text style={styles.emptyPickerText}>
                                                {searchQuery ? 'Nenhuma ação encontrada.' : 'Todas as ações já foram adicionadas.'}
                                            </Text>
                                        ) : (
                                            filteredAcoes.map(acao => (
                                                <Pressable
                                                    key={acao.id}
                                                    style={({ pressed }) => [
                                                        styles.pickerItem,
                                                        pressed && styles.pickerItemPressed,
                                                    ]}
                                                    onPress={() => handleAdd(acao)}
                                                >
                                                    <View style={styles.pickerItemContent}>
                                                        <Text style={styles.pickerItemCode}>{acao.codigo_descricao}</Text>
                                                        <Text style={styles.pickerItemName} numberOfLines={2}>{acao.nome}</Text>
                                                    </View>
                                                    <IconButton icon="plus-circle" size={20} iconColor={colors.success} />
                                                </Pressable>
                                            ))
                                        )}
                                    </ScrollView>
                                </>
                            )}
                        </View>
                    )}

                    {selectedAcoes.length === 0 ? (
                        <Text style={styles.emptyText}>
                            Nenhuma ação de campo adicionada.
                        </Text>
                    ) : (
                        selectedAcoes.map(acao => (
                            <View key={acao.id} style={styles.selectedCard}>
                                <View style={styles.selectedCardHeader}>
                                    <View style={styles.selectedCardInfo}>
                                        <Text style={styles.selectedCardCode}>{acao.codigo_descricao}</Text>
                                        <Text style={styles.selectedCardName} numberOfLines={2}>{acao.nome}</Text>
                                    </View>
                                    <IconButton
                                        icon="trash-can-outline"
                                        size={20}
                                        iconColor={colors.buttonDanger}
                                        onPress={() => handleRemove(acao.id)}
                                    />
                                </View>
                                <View style={styles.quantidadeRow}>
                                    <Text style={styles.quantidadeLabel}>Quantidade:</Text>
                                    <TextInput
                                        style={styles.quantidadeInput}
                                        value={quantidadeInputs[acao.id] !== undefined ? quantidadeInputs[acao.id] : String(acao.quantidade)}
                                        onChangeText={(value) => handleQuantidadeChange(acao.id, value)}
                                        keyboardType="decimal-pad"
                                        mode="outlined"
                                        dense
                                        outlineColor={colors.border}
                                        activeOutlineColor={colors.primary}
                                    />
                                </View>
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>

            <InfoDialog
                visible={dialog.visible}
                description={dialog.description}
                title={dialog.title}
                onDismiss={dialog.hide}
            />

            {isQuantidadeDirty && (
                <View style={styles.saveBarContainer}>
                    <View style={styles.saveBarWarning}>
                        <MaterialCommunityIcons name="alert-circle-outline" size={16} color={colors.warning} />
                        <Text style={styles.saveBarWarningText}>Alterações não salvas</Text>
                    </View>
                    <Button
                        mode="contained"
                        icon="content-save"
                        onPress={handleSaveQuantidades}
                        loading={isSaving}
                        disabled={isSaving}
                        buttonColor={colors.success}
                        textColor={colors.textOnPrimary}
                        style={styles.btnSave}
                        labelStyle={styles.btnSaveLabel}
                    >
                        {isSaving ? 'SALVANDO...' : 'SALVAR AÇÕES'}
                    </Button>
                </View>
            )}
        </View>
    );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    inner: {
        gap: 12,
        padding: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: colors.textSecondary,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
    },
    pickerContainer: {
        backgroundColor: colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    tipoServicoSection: {
        padding: 16,
    },
    tipoServicoLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textSecondary,
        marginBottom: 12,
    },
    tipoServicoList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tipoServicoChip: {
        backgroundColor: colors.surfaceVariant,
        borderColor: colors.border,
    },
    tipoServicoChipText: {
        fontSize: 13,
        color: colors.text,
    },
    tipoServicoSelectedHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 6,
        backgroundColor: colors.surfaceVariant,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    tipoServicoSelectedText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.primary,
    },
    searchBar: {
        backgroundColor: colors.surfaceVariant,
        borderRadius: 0,
        elevation: 0,
    },
    searchInput: {
        fontSize: 14,
        color: colors.text,
    },
    pickerList: {
        maxHeight: 250,
    },
    pickerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    pickerItemPressed: {
        backgroundColor: colors.surfaceVariant,
    },
    pickerItemContent: {
        flex: 1,
    },
    pickerItemCode: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.primary,
    },
    pickerItemName: {
        fontSize: 14,
        color: colors.text,
    },
    emptyPickerText: {
        padding: 16,
        textAlign: 'center',
        color: colors.textMuted,
        fontSize: 14,
    },
    emptyText: {
        textAlign: 'center',
        color: colors.textSecondary,
        marginVertical: 24,
        fontSize: 16,
    },
    selectedCard: {
        backgroundColor: colors.cardBackground,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        padding: 12,
        elevation: 1,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    selectedCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    selectedCardInfo: {
        flex: 1,
    },
    selectedCardCode: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.primary,
        marginBottom: 2,
    },
    selectedCardName: {
        fontSize: 14,
        color: colors.text,
    },
    quantidadeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        gap: 12,
    },
    quantidadeLabel: {
        fontSize: 14,
        color: colors.textSecondary,
        fontWeight: '500',
    },
    quantidadeInput: {
        flex: 1,
        backgroundColor: colors.inputBackground,
        maxWidth: 120,
        height: 36,
        fontSize: 14,
    },
    saveBarContainer: {
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.warning,
        paddingHorizontal: 16,
        paddingVertical: 10,
        gap: 8,
    },
    saveBarWarning: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    saveBarWarningText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.warning,
    },
    btnSave: {
        borderRadius: 8,
    },
    btnSaveLabel: {
        fontSize: 15,
        fontWeight: '700',
        paddingVertical: 2,
    },
});

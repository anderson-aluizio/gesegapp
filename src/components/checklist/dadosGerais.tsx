import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { ScrollView, StyleSheet, View, Text as RNText } from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import { ChecklistRealizadoDatabase, useChecklisRealizadoDatabase } from '@/database/models/useChecklisRealizadoDatabase';
import { useEquipeDatabase } from '@/database/models/useEquipeDatabase';
import { useCentroCustoDatabase } from '@/database/models/useCentroCustoDatabase';
import ModalSearchSelect, { SearchSelectOption } from '@/components/ui/inputs/ModalSearchSelect';
import { useTheme, ThemeColors } from '@/contexts/ThemeContext';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export default function DadosGeraisScreen(props: { checklistRealizado: ChecklistRealizadoDatabase; formUpdated: () => void; isUserOperacao: boolean }) {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    const [checklistRealizado, setChecklistRealizado] = useState<ChecklistRealizadoDatabase>(props.checklistRealizado);
    const checklistRealizadoDb = useChecklisRealizadoDatabase();
    const equipeDb = useEquipeDatabase();
    const centroCustoDb = useCentroCustoDatabase();
    const isUserOperacao = props.isUserOperacao;
    const isAprChecklist = checklistRealizado?.checklist_grupo_nome_interno === 'checklist_apr';

    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const latestDataRef = useRef(checklistRealizado);

    useEffect(() => {
        setChecklistRealizado(props.checklistRealizado);
        latestDataRef.current = props.checklistRealizado;
    }, [props.checklistRealizado]);

    const [selectedMunicipio, setSelectedMunicipio] = useState<string | null>();
    const [selectedEquipe, setSelectedEquipe] = useState<string | null>();
    const [selectedVeiculo, setSelectedVeiculo] = useState<string | null>();
    const [selectedArea, setSelectedArea] = useState<string | null>(null);
    const [observacao, setObservacao] = useState<string>('');
    const [ordemServico, setOrdemServico] = useState<string>('');
    const [localidadeEstadoId, setLocalidadeEstadoId] = useState<number | undefined>();

    useEffect(() => {
        const loadLocalidadeEstadoId = async () => {
            if (checklistRealizado?.centro_custo_id) {
                const allCentros = await centroCustoDb.getAll();
                const centro = allCentros.find(c => String(c.id) === String(checklistRealizado.centro_custo_id));
                setLocalidadeEstadoId(centro?.localidade_estado_id);
            }
        };
        loadLocalidadeEstadoId();
    }, [checklistRealizado?.centro_custo_id]);

    const areas: SearchSelectOption[] = [
        { id: 'URBANA', title: 'URBANA' },
        { id: 'RURAL', title: 'RURAL' },
    ];
    useEffect(() => {
        setSelectedMunicipio(
            checklistRealizado?.localidade_cidade_id !== undefined
                ? String(checklistRealizado.localidade_cidade_id)
                : null
        );
        setSelectedEquipe(
            checklistRealizado?.equipe_id !== undefined
                ? String(checklistRealizado.equipe_id)
                : null
        );
        setSelectedVeiculo(
            checklistRealizado?.veiculo_id !== undefined
                ? String(checklistRealizado.veiculo_id)
                : null
        );
        setSelectedArea(
            checklistRealizado?.area !== undefined
                ? String(checklistRealizado.area)
                : null
        );
        setObservacao(checklistRealizado?.observacao || '');
        setOrdemServico(checklistRealizado?.ordem_servico || '');
    }, [checklistRealizado]);

    const showSaveStatus = useCallback((status: 'saved' | 'error') => {
        setSaveStatus(status);
        setTimeout(() => setSaveStatus('idle'), 2000);
    }, []);

    const saveToDb = useCallback(async (updatedData: ChecklistRealizadoDatabase) => {
        setSaveStatus('saving');
        try {
            const equipe = updatedData.equipe_id ? await equipeDb.show(Number(updatedData.equipe_id)) : null;
            const dataToSave = {
                ...updatedData,
                encarregado_cpf: isUserOperacao ? updatedData.encarregado_cpf : (equipe?.encarregado_cpf || updatedData.encarregado_cpf),
                supervisor_cpf: isUserOperacao ? updatedData.supervisor_cpf : (equipe?.supervisor_cpf || updatedData.supervisor_cpf),
                coordenador_cpf: isUserOperacao ? updatedData.coordenador_cpf : (equipe?.coordenador_cpf || updatedData.coordenador_cpf),
            };
            await checklistRealizadoDb.updateDadosGerais(dataToSave);
            latestDataRef.current = dataToSave;
            setChecklistRealizado(dataToSave);
            showSaveStatus('saved');
            props.formUpdated();
        } catch (error) {
            console.error('Erro ao salvar dados gerais:', error);
            showSaveStatus('error');
        }
    }, [isUserOperacao]);

    const debouncedSave = useCallback((updatedData: ChecklistRealizadoDatabase) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            saveToDb(updatedData);
        }, 800);
    }, [saveToDb]);

    // Cleanup debounce on unmount
    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, []);

    const municipioInitialItem = checklistRealizado?.localidade_cidade_id ? [{
        id: String(checklistRealizado?.localidade_cidade_id),
        title: String(checklistRealizado?.localidade_cidade_nome)
    }] : [];
    const handleChangeMunicipio = (value: string | object | null) => {
        const newValue = typeof value === 'string' || value === null ? value : String(value);
        setSelectedMunicipio(newValue);
        const updated = { ...latestDataRef.current, localidade_cidade_id: Number(newValue) };
        latestDataRef.current = updated;
        saveToDb(updated);
    }
    const equipeInitialItem = checklistRealizado?.equipe_id ? [{
        id: String(checklistRealizado.equipe_id),
        title: String(checklistRealizado.equipe_nome)
    }] : [];
    const handleChangeEquipe = (value: string | object | null) => {
        const newValue = typeof value === 'string' || value === null ? value : String(value);
        setSelectedEquipe(newValue);
        const updated = { ...latestDataRef.current, equipe_id: Number(newValue) };
        latestDataRef.current = updated;
        saveToDb(updated);
    }
    const veiculoInitialItem = checklistRealizado?.veiculo_id ? [{
        id: String(checklistRealizado.veiculo_id),
        title: checklistRealizado.veiculo_id
    }] : [];
    const handleChangeVeiculo = (value: string | object | null) => {
        const newValue = typeof value === 'string' || value === null ? value : String(value);
        setSelectedVeiculo(newValue);
        const updated = { ...latestDataRef.current, veiculo_id: newValue || '' };
        latestDataRef.current = updated;
        saveToDb(updated);
    }
    const handleChangeArea = (value: string | object | null) => {
        const newValue = typeof value === 'string' || value === null ? value : String(value);
        setSelectedArea(newValue);
        const updated = { ...latestDataRef.current, area: newValue || '' };
        latestDataRef.current = updated;
        saveToDb(updated);
    };

    const handleChangeObservacao = (value: string) => {
        setObservacao(value);
        const updated = { ...latestDataRef.current, observacao: value };
        latestDataRef.current = updated;
        debouncedSave(updated);
    };

    const handleChangeOrdemServico = (value: string) => {
        setOrdemServico(value);
        const updated = { ...latestDataRef.current, ordem_servico: value };
        latestDataRef.current = updated;
        debouncedSave(updated);
    };

    return (
        <View style={styles.container}>
            <ScrollView>
                <View style={styles.inner}>
                    {saveStatus !== 'idle' && (
                        <View style={[
                            styles.saveIndicator,
                            saveStatus === 'error' && styles.saveIndicatorError,
                        ]}>
                            <MaterialCommunityIcons
                                name={saveStatus === 'saving' ? 'loading' : saveStatus === 'saved' ? 'check-circle' : 'alert-circle'}
                                size={16}
                                color={saveStatus === 'error' ? colors.error : colors.success}
                            />
                            <Text style={[
                                styles.saveIndicatorText,
                                saveStatus === 'error' && { color: colors.error },
                            ]}>
                                {saveStatus === 'saving' ? 'Salvando...' : saveStatus === 'saved' ? 'Salvo' : 'Erro ao salvar'}
                            </Text>
                        </View>
                    )}
                    <View style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <View style={styles.infoItem}>
                                <Text style={styles.infoLabel}>Grupo</Text>
                                <Text style={styles.infoValue}>{checklistRealizado?.checklist_grupo_nome || '-'}</Text>
                            </View>
                        </View>
                        <View style={styles.infoRow}>
                            <View style={styles.infoItem}>
                                <Text style={styles.infoLabel}>Centro de Custo</Text>
                                <Text style={styles.infoValue}>{checklistRealizado?.centro_custo_nome || '-'}</Text>
                            </View>
                        </View>
                        <View style={styles.infoRow}>
                            <View style={styles.infoItem}>
                                <Text style={styles.infoLabel}>Estrutura Modelo</Text>
                                <Text style={styles.infoValue}>{checklistRealizado?.checklist_estrutura_nome || '-'}</Text>
                            </View>
                        </View>
                        {isUserOperacao && (
                            <>
                                <View style={styles.infoRow}>
                                    <View style={styles.infoItem}>
                                        <Text style={styles.infoLabel}>Equipe</Text>
                                        <Text style={styles.infoValue}>{checklistRealizado?.equipe_nome || '-'}</Text>
                                    </View>
                                </View>
                                <View style={styles.infoRow}>
                                    <View style={styles.infoItem}>
                                        <Text style={styles.infoLabel}>Veículo</Text>
                                        <Text style={styles.infoValue}>{checklistRealizado?.veiculo_id || '-'}</Text>
                                    </View>
                                </View>
                            </>
                        )}
                        <View style={styles.lockNotice}>
                            <Text style={styles.lockNoticeText}>
                                Campos bloqueados para edição. Caso precise alterar, exclua o registro e crie um novo.
                            </Text>
                        </View>
                    </View>
                    <ModalSearchSelect
                        listName="cidades"
                        label="Município"
                        placeholder="Digite o nome do município"
                        extraParam={{ localidade_estado_id: localidadeEstadoId }}
                        value={selectedMunicipio}
                        onValueChange={handleChangeMunicipio}
                        initialItems={municipioInitialItem} />
                    {!isUserOperacao && (
                        <>
                            <ModalSearchSelect
                                listName="equipes"
                                label="Equipe"
                                placeholder="Digite o nome da equipe"
                                extraParam={{ centro_custo_id: checklistRealizado.centro_custo_id || '' }}
                                value={selectedEquipe}
                                onValueChange={handleChangeEquipe}
                                initialItems={equipeInitialItem} />
                            <ModalSearchSelect
                                listName="veiculos"
                                initialSearch={checklistRealizado?.veiculo_id || ''}
                                label="Veiculo"
                                placeholder="Digite o ID do veículo"
                                value={selectedVeiculo}
                                onValueChange={handleChangeVeiculo}
                                initialItems={veiculoInitialItem} />
                        </>
                    )}
                    <ModalSearchSelect
                        label="Area"
                        placeholder="Digite o nome do município"
                        value={selectedArea}
                        onValueChange={handleChangeArea}
                        initialItems={areas} />
                    {isAprChecklist && (
                        <View style={styles.container}>
                            <RNText style={styles.label}>
                                Ordem de Serviço *
                            </RNText>
                            <TextInput
                                placeholder="Digite a ordem de serviço (obrigatório)"
                                value={ordemServico}
                                onChangeText={handleChangeOrdemServico}
                                mode="outlined"
                                style={styles.textInput}
                                theme={{ roundness: 8 }}
                                outlineColor={colors.border}
                                activeOutlineColor={colors.primary}
                                textColor={colors.text}
                            />
                        </View>
                    )}
                    <View style={styles.container}>
                        <RNText style={styles.label}>Observação</RNText>
                        <TextInput
                            placeholder="Digite uma observação (opcional)"
                            value={observacao}
                            onChangeText={handleChangeObservacao}
                            multiline
                            mode="outlined"
                            style={styles.textInput}
                            theme={{ roundness: 8 }}
                            outlineColor={colors.border}
                            activeOutlineColor={colors.primary}
                            textColor={colors.text}
                            numberOfLines={3}
                        />
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    inner: {
        gap: 10,
        padding: 16,
    },
    saveIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-end',
        gap: 6,
        backgroundColor: colors.successLight,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    saveIndicatorError: {
        backgroundColor: colors.error + '18',
    },
    saveIndicatorText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.success,
    },
    infoCard: {
        backgroundColor: colors.surfaceVariant,
        borderRadius: 12,
        padding: 16,
        borderLeftWidth: 4,
        borderLeftColor: colors.primary,
        shadowColor: colors.shadow,
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    infoRow: {
        marginBottom: 12,
    },
    infoItem: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textTertiary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 16,
        fontWeight: '500',
        color: colors.text,
        lineHeight: 22,
    },
    lockNotice: {
        backgroundColor: colors.warning + '22',
        borderRadius: 8,
        padding: 6,
        borderWidth: 1,
        borderColor: colors.warning,
    },
    lockNoticeText: {
        fontSize: 13,
        color: colors.warning,
        textAlign: 'center',
        fontWeight: '500',
    },
    textInput: {
        backgroundColor: colors.cardBackground,
    },
    label: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.textSecondary,
        marginBottom: 0,
        paddingHorizontal: 4,
    }
});

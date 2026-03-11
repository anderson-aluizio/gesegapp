import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { ChecklistRealizadoDatabase, useChecklisRealizadoDatabase } from '@/database/models/useChecklisRealizadoDatabase';
import { useEquipeDatabase } from '@/database/models/useEquipeDatabase';
import ModalSearchSelect from '@/components/ui/inputs/ModalSearchSelect';
import { useTheme, ThemeColors } from '@/contexts/ThemeContext';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export default function LiderancaScreen(props: { checklistRealizado: ChecklistRealizadoDatabase; formUpdated: () => void; isUserOperacao: boolean }) {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    const [checklistRealizado, setChecklistRealizado] = useState<ChecklistRealizadoDatabase>(props.checklistRealizado);
    const checklistRealizadoDb = useChecklisRealizadoDatabase();
    const equipeDb = useEquipeDatabase();
    const isUserOperacao = props.isUserOperacao;

    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const latestDataRef = useRef(checklistRealizado);

    useEffect(() => {
        setChecklistRealizado(props.checklistRealizado);
        latestDataRef.current = props.checklistRealizado;
    }, [props.checklistRealizado]);

    const [selectedEncarregado, setSelectedEncarregado] = useState<string | null>();
    const [selectedSupervisor, setSelectedSupervisor] = useState<string | null>();
    const [selectedCoordenador, setSelectedCoordenador] = useState<string | null>();

    useEffect(() => {
        setSelectedEncarregado(
            checklistRealizado?.encarregado_cpf !== undefined
                ? String(checklistRealizado.encarregado_cpf)
                : null
        );
        setSelectedSupervisor(
            checklistRealizado?.supervisor_cpf !== undefined
                ? String(checklistRealizado.supervisor_cpf)
                : null
        );
        setSelectedCoordenador(
            checklistRealizado?.coordenador_cpf !== undefined
                ? String(checklistRealizado.coordenador_cpf)
                : null
        );
    }, [checklistRealizado]);

    const showSaveStatus = useCallback((status: 'saved' | 'error') => {
        setSaveStatus(status);
        setTimeout(() => setSaveStatus('idle'), 2000);
    }, []);

    const saveToDb = useCallback(async (updatedData: ChecklistRealizadoDatabase) => {
        setSaveStatus('saving');
        try {
            await checklistRealizadoDb.updateLideranca(updatedData);

            if (updatedData.equipe_id) {
                await equipeDb.updateLideranca(
                    updatedData.equipe_id,
                    updatedData.encarregado_cpf,
                    updatedData.supervisor_cpf,
                    updatedData.coordenador_cpf
                );
            }

            latestDataRef.current = updatedData;
            setChecklistRealizado(updatedData);
            showSaveStatus('saved');
            props.formUpdated();
        } catch (error) {
            console.error('Erro ao salvar liderança:', error);
            showSaveStatus('error');
        }
    }, []);

    const encarregadoInitialItem = checklistRealizado?.encarregado_nome ? [{
        id: String(checklistRealizado.encarregado_cpf),
        title: checklistRealizado.encarregado_nome
    }] : [];
    const handleChangeEncarregado = (value: string | object | null) => {
        const newValue = typeof value === 'string' || value === null ? value : String(value);
        setSelectedEncarregado(newValue);
        const updated = { ...latestDataRef.current, encarregado_cpf: newValue || '' };
        latestDataRef.current = updated;
        saveToDb(updated);
    }
    const supervisorInitialItem = checklistRealizado?.supervisor_nome ? [{
        id: String(checklistRealizado.supervisor_cpf),
        title: checklistRealizado.supervisor_nome
    }] : [];
    const handleChangeSupervisor = (value: string | object | null) => {
        const newValue = typeof value === 'string' || value === null ? value : String(value);
        setSelectedSupervisor(newValue);
        const updated = { ...latestDataRef.current, supervisor_cpf: newValue || '' };
        latestDataRef.current = updated;
        saveToDb(updated);
    }
    const coordenadorInitialItem = checklistRealizado?.coordenador_nome ? [{
        id: String(checklistRealizado.coordenador_cpf),
        title: checklistRealizado.coordenador_nome
    }] : [];
    const handleChangeCoordenador = (value: string | object | null) => {
        const newValue = typeof value === 'string' || value === null ? value : String(value);
        setSelectedCoordenador(newValue);
        const updated = { ...latestDataRef.current, coordenador_cpf: newValue || '' };
        latestDataRef.current = updated;
        saveToDb(updated);
    }

    if (isUserOperacao) {
        return (
            <View style={styles.container}>
                <ScrollView>
                    <View style={styles.inner}>
                        <View style={styles.infoCard}>
                            <View style={styles.infoRow}>
                                <View style={styles.infoItem}>
                                    <Text style={styles.infoLabel}>Encarregado</Text>
                                    <Text style={styles.infoValue}>{checklistRealizado?.encarregado_nome || '-'}</Text>
                                </View>
                            </View>
                            <View style={styles.infoRow}>
                                <View style={styles.infoItem}>
                                    <Text style={styles.infoLabel}>Supervisor</Text>
                                    <Text style={styles.infoValue}>{checklistRealizado?.supervisor_nome || '-'}</Text>
                                </View>
                            </View>
                            <View style={[styles.infoRow, { marginBottom: 0 }]}>
                                <View style={styles.infoItem}>
                                    <Text style={styles.infoLabel}>Coordenador</Text>
                                    <Text style={styles.infoValue}>{checklistRealizado?.coordenador_nome || '-'}</Text>
                                </View>
                            </View>
                            <View style={styles.lockNotice}>
                                <Text style={styles.lockNoticeText}>
                                    Dados preenchidos na abertura do turno. Para alterar, edite o turno.
                                </Text>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </View>
        );
    }

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
                    <ModalSearchSelect
                        listName="funcionarios"
                        label="Encarregado"
                        placeholder="Digite o nome do encarregado"
                        value={selectedEncarregado}
                        onValueChange={handleChangeEncarregado}
                        initialItems={encarregadoInitialItem} />
                    <ModalSearchSelect
                        listName="funcionarios"
                        label="Supervisor"
                        placeholder="Digite o nome do supervisor"
                        value={selectedSupervisor}
                        onValueChange={handleChangeSupervisor}
                        initialItems={supervisorInitialItem} />
                    <ModalSearchSelect
                        listName="funcionarios"
                        label="Coordenador"
                        placeholder="Digite o nome do coordenador"
                        value={selectedCoordenador}
                        onValueChange={handleChangeCoordenador}
                        initialItems={coordenadorInitialItem} />
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
        marginTop: 12,
        borderWidth: 1,
        borderColor: colors.warning,
    },
    lockNoticeText: {
        fontSize: 13,
        color: colors.warning,
        textAlign: 'center',
        fontWeight: '500',
    },
});

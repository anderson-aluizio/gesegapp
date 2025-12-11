import { useEffect, useState, useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { ChecklistRealizadoDatabase, useChecklisRealizadoDatabase } from '@/database/models/useChecklisRealizadoDatabase';
import { useEquipeDatabase } from '@/database/models/useEquipeDatabase';
import AutocompleteSearchDropdown from '@/components/ui/inputs/AutocompleteSearchDropdown';
import { useDialog } from '@/hooks/useDialog';
import InfoDialog from '@/components/ui/dialogs/InfoDialog';
import { useTheme, ThemeColors } from '@/contexts/ThemeContext';

export default function LiderancaScreen(props: { checklistRealizado: ChecklistRealizadoDatabase; formUpdated: () => void; isUserOperacao: boolean }) {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    const [checklistRealizado, setChecklistRealizado] = useState<ChecklistRealizadoDatabase>(props.checklistRealizado);
    const checklistRealizadoDb = useChecklisRealizadoDatabase();
    const equipeDb = useEquipeDatabase();
    const dialog = useDialog();
    const isUserOperacao = props.isUserOperacao;

    useEffect(() => {
        setChecklistRealizado(props.checklistRealizado);
    }, [props.checklistRealizado]);

    const [isFormDirty, setIsFormDirty] = useState<boolean>(false);
    const [selectedEncarregado, setSelectedEncarregado] = useState<string | null>();
    const [selectedSupervisor, setSelectedSupervisor] = useState<string | null>();
    const [selectedCoordenador, setSelectedCoordenador] = useState<string | null>();
    const [selectedGerente, setSelectedGerente] = useState<string | null>();

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
        setSelectedGerente(
            checklistRealizado?.gerente_cpf !== undefined
                ? String(checklistRealizado.gerente_cpf)
                : null
        );
    }, [checklistRealizado]);

    const encarregadoInitialItem = checklistRealizado?.encarregado_nome ? [{
        id: String(checklistRealizado.encarregado_cpf),
        title: checklistRealizado.encarregado_nome
    }] : [];
    const handleChangeEncarregado = (value: string | object | null) => {
        if (typeof value === 'string' || value === null) {
            setSelectedEncarregado(value);
        } else {
            setSelectedEncarregado(String(value));
        }
        setIsFormDirty(true);
    }
    const supervisorInitialItem = checklistRealizado?.supervisor_nome ? [{
        id: String(checklistRealizado.supervisor_cpf),
        title: checklistRealizado.supervisor_nome
    }] : [];
    const handleChangeSupervisor = (value: string | object | null) => {
        if (typeof value === 'string' || value === null) {
            setSelectedSupervisor(value);
        } else {
            setSelectedSupervisor(String(value));
        }
        setIsFormDirty(true);
    }
    const coordenadorInitialItem = checklistRealizado?.coordenador_nome ? [{
        id: String(checklistRealizado.coordenador_cpf),
        title: checklistRealizado.coordenador_nome
    }] : [];
    const handleChangeCoordenador = (value: string | object | null) => {
        if (typeof value === 'string' || value === null) {
            setSelectedCoordenador(value);
        } else {
            setSelectedCoordenador(String(value));
        }
        setIsFormDirty(true);
    }
    const gerenteInitialItem = checklistRealizado?.gerente_nome ? [{
        id: String(checklistRealizado.gerente_cpf),
        title: checklistRealizado.gerente_nome
    }] : [];
    const handleChangeGerente = (value: string | object | null) => {
        if (typeof value === 'string' || value === null) {
            setSelectedGerente(value);
        } else {
            setSelectedGerente(String(value));
        }
        setIsFormDirty(true);
    }

    const handleNext = async () => {
        if (!selectedEncarregado || !selectedSupervisor || !selectedCoordenador || !selectedGerente) {
            dialog.show('Atenção', 'Preencha todos os campos obrigatórios.');
            return;
        }
        const updatedChecklist = {
            ...checklistRealizado,
            encarregado_cpf: selectedEncarregado,
            supervisor_cpf: selectedSupervisor,
            coordenador_cpf: selectedCoordenador,
            gerente_cpf: selectedGerente
        };

        try {
            await checklistRealizadoDb.updateLideranca(updatedChecklist);

            if (checklistRealizado.equipe_id) {
                await equipeDb.updateLideranca(
                    checklistRealizado.equipe_id,
                    selectedEncarregado,
                    selectedSupervisor,
                    selectedCoordenador,
                    selectedGerente
                );
            }

            dialog.show('Sucesso', 'Dados atualizados com sucesso.');
            setIsFormDirty(false);
            props.formUpdated();
        } catch (error) {
            console.error('Erro ao atualizar liderança:', error);
            dialog.show('Atenção', 'Erro ao atualizar os dados. Tente novamente.');
        }
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
                            <View style={styles.infoRow}>
                                <View style={styles.infoItem}>
                                    <Text style={styles.infoLabel}>Coordenador</Text>
                                    <Text style={styles.infoValue}>{checklistRealizado?.coordenador_nome || '-'}</Text>
                                </View>
                            </View>
                            <View style={[styles.infoRow, { marginBottom: 0 }]}>
                                <View style={styles.infoItem}>
                                    <Text style={styles.infoLabel}>Gerente</Text>
                                    <Text style={styles.infoValue}>{checklistRealizado?.gerente_nome || '-'}</Text>
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
                    <AutocompleteSearchDropdown
                        listName="funcionarios"
                        label="Encarregado"
                        placeholder="Digite o nome do encarregado"
                        value={selectedEncarregado}
                        onValueChange={handleChangeEncarregado}
                        initialItems={encarregadoInitialItem} />
                    <AutocompleteSearchDropdown
                        listName="funcionarios"
                        label="Supervisor"
                        placeholder="Digite o nome do supervisor"
                        value={selectedSupervisor}
                        onValueChange={handleChangeSupervisor}
                        initialItems={supervisorInitialItem} />
                    <AutocompleteSearchDropdown
                        listName="funcionarios"
                        label="Coordenador"
                        placeholder="Digite o nome do coordenador"
                        value={selectedCoordenador}
                        onValueChange={handleChangeCoordenador}
                        initialItems={coordenadorInitialItem} />
                    <AutocompleteSearchDropdown
                        listName="funcionarios"
                        label="Gerente"
                        placeholder="Digite o nome do gerente"
                        value={selectedGerente}
                        onValueChange={handleChangeGerente}
                        initialItems={gerenteInitialItem} />
                </View>
            </ScrollView>

            <InfoDialog
                visible={dialog.visible}
                description={dialog.description}
                title={dialog.title}
                onDismiss={dialog.hide}
            />

            {isFormDirty ? (
                <Button mode="contained" onPress={handleNext} buttonColor={colors.buttonPrimary} style={styles.btnNext}>
                    ATUALIZAR
                </Button>
            ) : null}
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
    btnNext: {
        margin: 16,
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

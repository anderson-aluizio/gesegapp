import { useState, useEffect, useRef, useMemo } from 'react';
import { ScrollView, StyleSheet, View, Modal, ActivityIndicator, Text as RNText } from 'react-native';
import AutocompleteSearchDropdown, { AutocompleteDropdownOption, AutocompleteSearchDropdownRef } from '@/components/ui/inputs/AutocompleteSearchDropdown';
import { router, Stack } from 'expo-router';
import { Button, IconButton, Text, TextInput } from 'react-native-paper';
import { ChecklistGrupoDatabase, useChecklistGrupoDatabase } from '@/database/models/useChecklistGrupoDatabase';
import { CentroCustoDatabase, useCentroCustoDatabase } from '@/database/models/useCentroCustoDatabase';
import { useEquipeDatabase } from '@/database/models/useEquipeDatabase';
import { useChecklisRealizadoDatabase } from '@/database/models/useChecklisRealizadoDatabase';
import { EquipeTurnoDatabase, useEquipeTurnoDatabase } from '@/database/models/useEquipeTurnoDatabase';
import { EquipeTurnoFuncionarioDatabaseWithRelations, useEquipeTurnoFuncionarioDatabase } from '@/database/models/useEquipeTurnoFuncionarioDatabase';
import { useChecklistRealizadoFuncionarioDatabase } from '@/database/models/useChecklistRealizadoFuncionarioDatabase';
import ProtectedRoute from '@/components/guards/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useDialog } from '@/hooks/useDialog';
import { useErrorDialog } from '@/hooks/useErrorDialog';
import InfoDialog from '@/components/ui/dialogs/InfoDialog';
import ErrorDetailsDialog from '@/components/ui/dialogs/ErrorDetailsDialog';
import ConfirmDialog from '@/components/ui/dialogs/ConfirmDialog';
import { useLocation } from '@/hooks/useLocation';
import { useTheme, ThemeColors } from '@/contexts/ThemeContext';

export default function CreateChecklistRealizadoScreen() {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    const [grupos, setGrupos] = useState<AutocompleteDropdownOption[]>([]);
    const [allGrupos, setAllGrupos] = useState<ChecklistGrupoDatabase[]>([]);
    const [selectedGrupo, setSelectedGrupo] = useState<string | null>(null);
    const [centroCustos, setCentroCustos] = useState<AutocompleteDropdownOption[]>([]);
    const [selectedCentroCusto, setSelectedCentroCusto] = useState<string | null>(null);
    const [selectedEstrutura, setSelectedEstrutura] = useState<string | null>(null);
    const [selectedMunicipio, setSelectedMunicipio] = useState<string | null>(null);
    const [selectedEquipe, setSelectedEquipe] = useState<string | null>(null);
    const [selectedVeiculo, setSelectedVeiculo] = useState<string | null>(null);
    const [selectedArea, setSelectedArea] = useState<string | null>(null);
    const [ordemServico, setOrdemServico] = useState<string>('');
    const [isFromTurno, setIsFromTurno] = useState(false);
    const [todayTurno, setTodayTurno] = useState<EquipeTurnoDatabase | null>(null);
    const [todayEquipeTurnoFuncionarios, setTodayEquipeTurnoFuncionarios] = useState<EquipeTurnoFuncionarioDatabaseWithRelations[] | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showLocationFailedDialog, setShowLocationFailedDialog] = useState(false);
    const [pendingEquipe, setPendingEquipe] = useState<any>(null);

    const centroCustoRef = useRef<AutocompleteSearchDropdownRef>(null);
    const estruturaRef = useRef<AutocompleteSearchDropdownRef>(null);
    const municipioRef = useRef<AutocompleteSearchDropdownRef>(null);
    const dialog = useDialog();
    const errorDialog = useErrorDialog();
    const grupoDb = useChecklistGrupoDatabase();
    const centroCustoDb = useCentroCustoDatabase();
    const equipeDb = useEquipeDatabase();
    const checklistRealizadoDb = useChecklisRealizadoDatabase();
    const equipeTurnoDb = useEquipeTurnoDatabase();
    const equipeTurnoFuncionarioDb = useEquipeTurnoFuncionarioDatabase();
    const checklistRealizadoFuncionarioDb = useChecklistRealizadoFuncionarioDatabase();
    const { user } = useAuth();
    const isUserOperacao = user?.is_operacao;
    const { getCurrentLocation } = useLocation();

    const selectedGrupoData = allGrupos.find(g => String(g.id) === selectedGrupo);
    const isAprChecklist = selectedGrupoData?.nome_interno === 'checklist_apr';

    const areas: AutocompleteDropdownOption[] = [
        { id: 'URBANA', title: 'URBANA' },
        { id: 'RURAL', title: 'RURAL' },
    ];

    const loadGrupos = async () => {
        const res = await grupoDb.getAll();
        if (!res || res.length === 0) {
            return [];
        }
        setAllGrupos(res);
        let formatted = res.map((item: ChecklistGrupoDatabase) => ({
            id: String(item.id),
            title: String(item.nome),
        }));
        setGrupos(formatted);

        if (isUserOperacao) {
            const todayAutoChecklist = await checklistRealizadoDb.hasAutoChecklistToday();
            if (!todayAutoChecklist) {
                const autoChecklistGrupo = res.find(g => g.nome_interno === 'checklist_auto_checklist');
                if (autoChecklistGrupo) {
                    setSelectedGrupo(String(autoChecklistGrupo.id));
                }
            } else {
                const aprGrupo = res.find(g => g.nome_interno === 'checklist_apr');
                if (aprGrupo) {
                    setSelectedGrupo(String(aprGrupo.id));
                }
            }
        }
    }
    const loadCentroCustos = async () => {
        const res = await centroCustoDb.getWithChecklistEstrutura();
        if (!res || res.length === 0) {
            return [];
        }
        let formatted = res.map((item: CentroCustoDatabase) => ({
            id: String(item.id),
            title: String(item.nome),
        }));
        if (formatted.length == 1) {
            setSelectedCentroCusto(formatted[0].id)
        }
        setCentroCustos(formatted);
    }

    const loadTurnoData = async () => {
        if (isUserOperacao) {
            try {
                const todayTurno = await equipeTurnoDb.getTodayTurno();
                if (todayTurno) {
                    const turnoFuncionarios = await equipeTurnoFuncionarioDb.getByEquipeTurnoId(todayTurno.id);
                    setSelectedEquipe(String(todayTurno.equipe_id));
                    setSelectedVeiculo(String(todayTurno.veiculo_id));
                    setTodayTurno(todayTurno);
                    setTodayEquipeTurnoFuncionarios(turnoFuncionarios);
                    setIsFromTurno(true);
                } else {
                    dialog.show('Atenção', 'Você precisa criar um turno antes de prosseguir.');
                    setTimeout(() => {
                        router.replace('/(tabs)/turno-equipe/create');
                    }, 4000);
                }
            } catch (error) {
                errorDialog.show(
                    'Erro',
                    'Falha ao carregar dados do turno. Tente novamente.',
                    error,
                    { location: 'loadTurnoData', userId: user?.id }
                );
                console.error('Error loading turno data:', error);
            }
        }
    }

    useEffect(() => {
        loadGrupos();
        loadCentroCustos();
        loadTurnoData();
    }, []);

    const handleChangeGrupo = (value: string | object | null) => {
        if (typeof value === 'string' || value === null) {
            setSelectedGrupo(value);
        } else {
            setSelectedGrupo(String(value));
        }
        setSelectedEstrutura(null);
        setSelectedMunicipio(null);

        centroCustoRef.current?.clear();
        estruturaRef.current?.clear();
        municipioRef.current?.clear();
    };

    const handleChangeCentroCusto = (value: string | object | null) => {
        if (typeof value === 'string' || value === null) {
            setSelectedCentroCusto(value);
        } else {
            setSelectedCentroCusto(String(value));
        }
        setSelectedEstrutura(null);
        setSelectedMunicipio(null);

        estruturaRef.current?.clear();
        municipioRef.current?.clear();
    };
    const changeEstrutura = (value: string | object | null) => {
        setSelectedEstrutura(String(value));
    }
    const handleChangeMunicipio = (value: string | object | null) => {
        setSelectedMunicipio(String(value));
    }
    const handleChangeEquipe = (value: string | object | null) => {
        setSelectedEquipe(String(value));
    }
    const handleChangeVeiculo = (value: string | object | null) => {
        if (typeof value === 'string' || value === null) {
            setSelectedVeiculo(value);
        } else {
            setSelectedVeiculo(String(value));
        }
    }
    const handleChangeArea = (value: string | object | null) => {
        if (typeof value === 'string' || value === null) {
            setSelectedArea(value);
        } else {
            setSelectedArea(String(value));
        }
    };

    const handleChangeOrdemServico = (value: string) => {
        setOrdemServico(value);
    };

    const createChecklistWithCoordinates = async (equipe: any, coords: { latitude: number; longitude: number } | null) => {
        try {
            const liderancaSource = isUserOperacao && todayTurno ? todayTurno : equipe;

            const createdChecklist = {
                checklist_grupo_id: Number(selectedGrupo),
                checklist_estrutura_id: Number(selectedEstrutura),
                centro_custo_id: String(selectedCentroCusto),
                localidade_cidade_id: Number(selectedMunicipio),
                equipe_id: Number(selectedEquipe),
                veiculo_id: String(selectedVeiculo),
                area: selectedArea!,
                date: new Date(),
                observacao: "",
                ordem_servico: ordemServico,
                encarregado_cpf: liderancaSource.encarregado_cpf || '',
                supervisor_cpf: liderancaSource.supervisor_cpf || '',
                coordenador_cpf: liderancaSource.coordenador_cpf || '',
                is_finalizado: false,
                is_user_declarou_conformidade: false,
                latitude: coords?.latitude,
                longitude: coords?.longitude,
            }
            const lastChecklistRealizado = await checklistRealizadoDb.create(createdChecklist);
            if (!lastChecklistRealizado) {
                errorDialog.show(
                    'Erro',
                    'Erro ao criar registro. Tente novamente.',
                    new Error('checklistRealizadoDb.create retornou null'),
                    {
                        location: 'createChecklistWithCoordinates',
                        checklistData: {
                            checklist_grupo_id: selectedGrupo,
                            checklist_estrutura_id: selectedEstrutura,
                            centro_custo_id: selectedCentroCusto,
                            equipe_id: selectedEquipe,
                            veiculo_id: selectedVeiculo,
                            hasCoords: !!coords,
                        }
                    }
                );
                setIsSubmitting(false);
                return;
            }

            if (isUserOperacao && todayTurno && lastChecklistRealizado.insertedRowId) {
                try {
                    if (todayEquipeTurnoFuncionarios && todayEquipeTurnoFuncionarios.length > 0) {
                        for (const funcionario of todayEquipeTurnoFuncionarios) {
                            await checklistRealizadoFuncionarioDb.create(
                                Number(lastChecklistRealizado.insertedRowId),
                                funcionario.funcionario_cpf
                            );
                        }
                    }
                } catch (funcionarioError) {
                    console.error('Error creating checklist funcionarios:', funcionarioError);
                    await checklistRealizadoDb.remove(Number(lastChecklistRealizado.insertedRowId));
                    errorDialog.show(
                        'Erro',
                        'Erro ao associar funcionários ao checklist. Tente novamente.',
                        funcionarioError,
                        {
                            location: 'createChecklistWithCoordinates.funcionarios',
                            checklistId: lastChecklistRealizado.insertedRowId,
                            turnoId: todayTurno?.id,
                            funcionariosCount: todayEquipeTurnoFuncionarios?.length,
                        }
                    );
                    setIsSubmitting(false);
                    return;
                }
            }

            setIsSubmitting(false);
            router.replace(`/checklist/${lastChecklistRealizado.insertedRowId}`)
        } catch (error) {
            errorDialog.show(
                'Erro',
                'Falha ao criar registro. Tente novamente.',
                error,
                {
                    location: 'createChecklistWithCoordinates',
                    hasCoords: !!coords,
                    selectedGrupo,
                    selectedEstrutura,
                    selectedCentroCusto,
                    selectedEquipe,
                    selectedVeiculo,
                    isFromTurno,
                }
            );
            setIsSubmitting(false);
        }
    };

    const handleNext = async () => {
        if (isSubmitting) return;

        if (!selectedGrupo || !selectedCentroCusto || !selectedEstrutura || !selectedMunicipio || !selectedEquipe || !selectedVeiculo || !selectedArea) {
            dialog.show('Atenção', 'Preencha todos os campos.');
            return;
        }

        if (isAprChecklist && !ordemServico.trim()) {
            dialog.show('Atenção', 'Ordem de Serviço é obrigatória para APR.');
            return;
        }

        if (isUserOperacao) {
            const selectedGrupoData = allGrupos.find(g => String(g.id) === selectedGrupo);
            const isAutoChecklistGroup = selectedGrupoData?.nome_interno === 'checklist_auto_checklist';
            const hasAutoChecklist = await checklistRealizadoDb.hasAutoChecklistToday();

            if (!isAutoChecklistGroup && !hasAutoChecklist) {
                dialog.show('Atenção', 'Você deve criar e finalizar um Auto Checklist primeiro antes de criar outros tipos de checklist.');
                return;
            }
        }

        const equipe = await equipeDb.show(Number(selectedEquipe));
        if (!equipe) {
            dialog.show('Atenção', 'Equipe não encontrada.');
            return;
        }

        setIsSubmitting(true);

        try {
            const locationResult = await getCurrentLocation();

            if (locationResult.error) {
                setPendingEquipe(equipe);
                setShowLocationFailedDialog(true);
                setIsSubmitting(false);
                return;
            }

            await createChecklistWithCoordinates(equipe, locationResult.coords);
        } catch (error) {
            errorDialog.show(
                'Erro',
                'Falha ao criar registro. Tente novamente.',
                error,
                {
                    location: 'handleNext',
                    selectedGrupo,
                    selectedCentroCusto,
                    selectedEstrutura,
                    selectedMunicipio,
                    selectedEquipe,
                    selectedVeiculo,
                    selectedArea,
                }
            );
            setIsSubmitting(false);
        }
    };

    const handleContinueWithoutLocation = async () => {
        setShowLocationFailedDialog(false);
        setIsSubmitting(true);
        await createChecklistWithCoordinates(pendingEquipe, null);
    };

    const handleLocationDialogDismiss = () => {
        setShowLocationFailedDialog(false);
        setPendingEquipe(null);
    }

    return (
        <ProtectedRoute>
            <View style={styles.container}>
                <Stack.Screen
                    options={{
                        title: 'Adicionar',
                        headerLeft: () => (
                            <IconButton
                                icon="arrow-left"
                                size={24}
                                onPress={() => {
                                    if (router.canGoBack()) {
                                        router.back();
                                    } else {
                                        router.replace('/checklist-list');
                                    }
                                }}
                            />
                        ),
                    }}
                />
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.formCard}>
                        <View style={styles.inner}>
                            <AutocompleteSearchDropdown
                                label="Grupo"
                                placeholder="Digite o nome do grupo"
                                value={selectedGrupo}
                                onValueChange={handleChangeGrupo}
                                initialItems={grupos} />
                            <AutocompleteSearchDropdown
                                label="Centro de Custo"
                                placeholder="Digite o centro de custo"
                                value={selectedCentroCusto}
                                onValueChange={handleChangeCentroCusto}
                                initialItems={centroCustos} />
                            <AutocompleteSearchDropdown
                                ref={estruturaRef}
                                label="Estrutura Modelo"
                                listName="estruturas"
                                extraParam={{ centro_custo_id: selectedCentroCusto || '', grupo_id: selectedGrupo || '' }}
                                value={selectedEstrutura}
                                placeholder={(!selectedCentroCusto) ? 'Selecione um centro de custo primeiro' : 'Digite para pesquisar'}
                                disable={!selectedGrupo || !selectedCentroCusto}
                                onValueChange={changeEstrutura}
                            />
                            <AutocompleteSearchDropdown
                                ref={municipioRef}
                                listName="cidades"
                                extraParam={{ centro_custo_id: selectedCentroCusto || '' }}
                                label="Município"
                                value={selectedMunicipio}
                                placeholder={!selectedCentroCusto ? 'Selecione uma estrutura modelo primeiro' : 'Digite para pesquisar'}
                                disable={!selectedCentroCusto}
                                onValueChange={handleChangeMunicipio}
                            />
                            {!isFromTurno ? <AutocompleteSearchDropdown
                                listName="equipes"
                                label="Equipe"
                                extraParam={{ centro_custo_id: selectedCentroCusto || '' }}
                                value={selectedEquipe}
                                placeholder="Digite para pesquisar equipe"
                                onValueChange={handleChangeEquipe}
                            /> : null}
                            {!isFromTurno ? <AutocompleteSearchDropdown
                                listName="veiculos"
                                label="Veiculo"
                                value={selectedVeiculo}
                                placeholder="Digite para pesquisar veículo"
                                onValueChange={handleChangeVeiculo}
                            /> : null}
                            <AutocompleteSearchDropdown
                                label="Area"
                                placeholder="Digite a área"
                                value={selectedArea}
                                onValueChange={handleChangeArea}
                                initialItems={areas} />
                            <View>
                                <RNText style={styles.label}>
                                    Ordem de Serviço{isAprChecklist ? ' *' : ''}
                                </RNText>
                                <TextInput
                                    placeholder={isAprChecklist ? "Digite a ordem de serviço (obrigatório)" : "Digite a ordem de serviço (opcional)"}
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
                        </View>
                    </View>
                </ScrollView>

                <InfoDialog
                    visible={dialog.visible}
                    description={dialog.description}
                    title={dialog.title}
                    onDismiss={dialog.hide}
                />

                <ErrorDetailsDialog
                    visible={errorDialog.visible}
                    title={errorDialog.title}
                    description={errorDialog.description}
                    errorDetails={errorDialog.errorDetails}
                    onDismiss={errorDialog.hide}
                />

                <ConfirmDialog
                    visible={showLocationFailedDialog}
                    title="Localização não disponível"
                    description="Não foi possível obter sua localização. O checklist será criado sem as coordenadas. Deseja continuar?"
                    onConfirm={handleContinueWithoutLocation}
                    onDismiss={handleLocationDialogDismiss}
                    confirmText="Continuar"
                    cancelText="Cancelar"
                />

                <View style={styles.stickyButtonContainer}>
                    <Button
                        mode="contained"
                        onPress={handleNext}
                        buttonColor={colors.buttonPrimary}
                        style={styles.btnNext}
                        disabled={isSubmitting}
                    >
                        CADASTRAR
                    </Button>
                </View>

                <Modal
                    visible={isSubmitting}
                    transparent={true}
                    animationType="fade"
                    statusBarTranslucent={true}
                >
                    <View style={styles.loadingOverlay}>
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={colors.primary} />
                            <Text style={styles.loadingText}>Cadastrando checklist...</Text>
                            <Text style={styles.loadingSubtext}>Obtendo localização</Text>
                        </View>
                    </View>
                </Modal>
            </View>
        </ProtectedRoute>
    );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: "flex-start",
        paddingTop: 8,
    },
    formCard: {
        backgroundColor: colors.surface,
        padding: 12,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.10,
        shadowRadius: 10,
        elevation: 4,
    },
    formTitle: {
        fontSize: 22,
        fontWeight: "700",
        color: colors.text,
        marginBottom: 18,
        textAlign: "center",
        letterSpacing: 0.2,
    },
    inner: {
        gap: 10,
    },
    stickyButtonContainer: {
        backgroundColor: colors.background,
        paddingHorizontal: 16,
        paddingBottom: 16,
        paddingTop: 6,
    },
    btnNext: {
        borderRadius: 12,
        elevation: 2,
    },
    btnNextContent: {
        paddingVertical: 4,
    },
    btnNextLabel: {
        fontWeight: "700",
        fontSize: 16,
        letterSpacing: 0.5,
    },
    loadingOverlay: {
        flex: 1,
        backgroundColor: colors.overlay,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingContainer: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 32,
        alignItems: 'center',
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        minWidth: 200,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
        textAlign: 'center',
    },
    loadingSubtext: {
        marginTop: 8,
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    label: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.textSecondary,
        marginBottom: 0,
        paddingHorizontal: 4,
    },
    textInput: {
        backgroundColor: colors.cardBackground,
    },
});

import { useState, useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import AutocompleteSearchDropdown, { AutocompleteDropdownOption, AutocompleteSearchDropdownRef } from '@/components/ui/inputs/AutocompleteSearchDropdown';
import { router, Stack } from 'expo-router';
import { Button, IconButton } from 'react-native-paper';
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
import InfoDialog from '@/components/ui/dialogs/InfoDialog';
import { useLocation } from '@/hooks/useLocation';

export default function CreateChecklistRealizadoScreen() {
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
    const [isFromTurno, setIsFromTurno] = useState(false);
    const [todayTurno, setTodayTurno] = useState<EquipeTurnoDatabase | null>(null);
    const [todayEquipeTurnoFuncionarios, setTodayEquipeTurnoFuncionarios] = useState<EquipeTurnoFuncionarioDatabaseWithRelations[] | null>(null);

    const centroCustoRef = useRef<AutocompleteSearchDropdownRef>(null);
    const estruturaRef = useRef<AutocompleteSearchDropdownRef>(null);
    const municipioRef = useRef<AutocompleteSearchDropdownRef>(null);
    const dialog = useDialog();
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
                    dialog.show('Você precisa criar um turno antes de prosseguir.');
                    setTimeout(() => {
                        router.replace('/(tabs)/turno-equipe/create');
                    }, 4000);
                }
            } catch (error) {
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

    const handleNext = async () => {
        if (!selectedGrupo || !selectedCentroCusto || !selectedEstrutura || !selectedMunicipio || !selectedEquipe || !selectedVeiculo || !selectedArea) {
            dialog.show('Preencha todos os campos.');
            return;
        }

        if (isUserOperacao) {
            const selectedGrupoData = allGrupos.find(g => String(g.id) === selectedGrupo);
            const isAutoChecklistGroup = selectedGrupoData?.nome_interno === 'checklist_auto_checklist';
            const hasAutoChecklist = await checklistRealizadoDb.hasAutoChecklistToday();

            if (!isAutoChecklistGroup && !hasAutoChecklist) {
                dialog.show('Você deve criar e finalizar um Auto Checklist primeiro antes de criar outros tipos de checklist.');
                return;
            }
        }

        const equipe = await equipeDb.show(Number(selectedEquipe));
        if (!equipe) {
            dialog.show('Equipe não encontrada.');
            return;
        }

        try {
            const coords = await getCurrentLocation();
            const createdChecklist = {
                checklist_grupo_id: Number(selectedGrupo),
                checklist_estrutura_id: Number(selectedEstrutura),
                centro_custo_id: String(selectedCentroCusto),
                localidade_cidade_id: Number(selectedMunicipio),
                equipe_id: Number(selectedEquipe),
                veiculo_id: String(selectedVeiculo),
                area: selectedArea,
                date: new Date(),
                observacao: "",
                encarregado_cpf: equipe.encarregado_cpf,
                supervisor_cpf: equipe.supervisor_cpf || '',
                coordenador_cpf: equipe.coordenador_cpf || '',
                gerente_cpf: equipe.gerente_cpf || '',
                is_finalizado: false,
                is_user_declarou_conformidade: false,
                latitude: coords?.latitude,
                longitude: coords?.longitude,
            }
            const lastChecklistRealizado = await checklistRealizadoDb.create(createdChecklist);
            if (!lastChecklistRealizado) {
                dialog.show('Erro ao criar registro. Tente novamente.');
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
                    dialog.show('Erro ao associar funcionários ao checklist. Tente novamente.');
                    return;
                }
            }

            router.replace(`/checklist/${lastChecklistRealizado.insertedRowId}`)
        } catch (error) {
            console.error('Error creating checklist:', error);
            dialog.show('Erro ao criar o registro. Tente novamente.');
        }
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
                        </View>
                    </View>
                </ScrollView>

                <InfoDialog
                    visible={dialog.visible}
                    description={dialog.description}
                    onDismiss={dialog.hide}
                />

                <View style={styles.stickyButtonContainer}>
                    <Button mode="contained" onPress={handleNext} buttonColor="#0439c9" style={styles.btnNext}>
                        CADASTRAR
                    </Button>
                </View>
            </View>
        </ProtectedRoute>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f4f6fb",
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: "flex-start",
        paddingTop: 8,
    },
    formCard: {
        backgroundColor: "#fff",
        padding: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.10,
        shadowRadius: 10,
        elevation: 4,
    },
    formTitle: {
        fontSize: 22,
        fontWeight: "700",
        color: "#222",
        marginBottom: 18,
        textAlign: "center",
        letterSpacing: 0.2,
    },
    inner: {
        gap: 10,
    },
    stickyButtonContainer: {
        backgroundColor: "#f4f6fb",
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
});

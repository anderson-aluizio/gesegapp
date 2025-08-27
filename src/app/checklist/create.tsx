import { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import AutocompleteSearchDropdown, { AutocompleteDropdownOption } from '@/components/AutocompleteSearchDropdown';
import { router, Stack } from 'expo-router';
import { Button, Dialog, Portal, Text } from 'react-native-paper';
import { ChecklistGrupoDatabase, useChecklistGrupoDatabase } from '@/database/Models/useChecklistGrupoDatabase';
import { CentroCustoDatabase, useCentroCustoDatabase } from '@/database/Models/useCentroCustoDatabase';
import { useEquipeDatabase } from '@/database/Models/useEquipeDatabase';
import { useChecklisRealizadoDatabase } from '@/database/Models/useChecklisRealizadoDatabase';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function CreateChecklistRealizadoScreen() {
    const [grupos, setGrupos] = useState<AutocompleteDropdownOption[]>([]);
    const [selectedGrupo, setSelectedGrupo] = useState<string | null>(null);
    const [centroCustos, setCentroCustos] = useState<AutocompleteDropdownOption[]>([]);
    const [selectedCentroCusto, setSelectedCentroCusto] = useState<string | null>(null);
    const [selectedEstrutura, setSelectedEstrutura] = useState<string | null>(null);
    const [selectedMunicipio, setSelectedMunicipio] = useState<string | null>(null);
    const [selectedEquipe, setSelectedEquipe] = useState<string | null>(null);
    const [selectedVeiculo, setSelectedVeiculo] = useState<string | null>(null);
    const [selectedArea, setSelectedArea] = useState<string | null>(null);
    const [dialogDesc, setDialogDesc] = useState('');
    const grupoDb = useChecklistGrupoDatabase();
    const centroCustoDb = useCentroCustoDatabase();
    const equipeDb = useEquipeDatabase();
    const checklistRealizadoDb = useChecklisRealizadoDatabase();

    const areas: AutocompleteDropdownOption[] = [
        { id: 'URBANA', title: 'URBANA' },
        { id: 'RURAL', title: 'RURAL' },
    ];

    const loadGrupos = async () => {
        const res = await grupoDb.getAll();
        if (!res || res.length === 0) {
            return [];
        }
        let formatted = res.map((item: ChecklistGrupoDatabase) => ({
            id: String(item.id),
            title: String(item.nome),
        }));
        setGrupos(formatted);
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
        setCentroCustos(formatted);
    }
    useEffect(() => {
        loadGrupos();
        loadCentroCustos();
    }, []);

    const handleChangeGrupo = (value: string | object | null) => {
        if (typeof value === 'string' || value === null) {
            setSelectedGrupo(value);
        } else {
            setSelectedGrupo(String(value));
        }
        setSelectedCentroCusto(null);
        setSelectedEstrutura(null);
        setSelectedMunicipio(null);
    };

    const handleChangeCentroCusto = (value: string | object | null) => {
        if (typeof value === 'string' || value === null) {
            setSelectedCentroCusto(value);
        } else {
            setSelectedCentroCusto(String(value));
        }
        setSelectedEstrutura(null);
        setSelectedMunicipio(null);
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
            setDialogDesc('Preencha todos os campos.');
            return;
        }
        const equipe = await equipeDb.show(Number(selectedEquipe));
        if (!equipe) {
            setDialogDesc('Equipe não encontrada.');
            return;
        }
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
        }
        try {
            const lastChecklistRealizado = await checklistRealizadoDb.create(createdChecklist);
            if (!lastChecklistRealizado) {
                setDialogDesc('Erro ao criar registro. Tente novamente.');
                return;
            }
            router.replace(`/checklist/${lastChecklistRealizado.insertedRowId}`)
        } catch (error) {
            console.error('Error creating checklist:', error);
            setDialogDesc('Erro ao criar o registro. Tente novamente.');
        }
    }

    return (
        <ProtectedRoute>
            <View style={styles.container}>
                <Stack.Screen options={{ title: 'Adicionar' }} />
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
                                value={selectedCentroCusto}
                                onValueChange={handleChangeCentroCusto}
                                placeholder={!selectedGrupo ? 'Selecione um grupo primeiro' : 'Digite para pesquisar'}
                                disable={!selectedGrupo}
                                initialItems={centroCustos} />
                            <AutocompleteSearchDropdown
                                label="Estrutura Modelo"
                                listName="estruturas"
                                extraParam={{ centro_custo_id: selectedCentroCusto || '', grupo_id: selectedGrupo || '' }}
                                value={selectedEstrutura}
                                placeholder={!selectedCentroCusto ? 'Selecione uma estrutura modelo primeiro' : 'Digite para pesquisar'}
                                disable={!selectedCentroCusto}
                                onValueChange={changeEstrutura}
                            />
                            <AutocompleteSearchDropdown
                                listName="cidades"
                                extraParam={{ centro_custo_id: selectedCentroCusto || '' }}
                                label="Município"
                                value={selectedMunicipio}
                                placeholder={!selectedEstrutura ? 'Selecione uma estrutura modelo primeiro' : 'Digite para pesquisar'}
                                disable={!selectedEstrutura}
                                onValueChange={handleChangeMunicipio}
                            />
                            <AutocompleteSearchDropdown
                                listName="equipes"
                                label="Equipe"
                                extraParam={{ centro_custo_id: selectedCentroCusto || '' }}
                                value={selectedEquipe}
                                placeholder="Digite para pesquisar equipe"
                                onValueChange={handleChangeEquipe}
                            />
                            <AutocompleteSearchDropdown
                                listName="veiculos"
                                label="Veiculo"
                                value={selectedVeiculo}
                                placeholder="Digite para pesquisar veículo"
                                onValueChange={handleChangeVeiculo}
                            />
                            <AutocompleteSearchDropdown
                                label="Area"
                                placeholder="Digite o nome do município"
                                value={selectedArea}
                                onValueChange={handleChangeArea}
                                initialItems={areas} />
                        </View>
                    </View>
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
                </ScrollView>
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

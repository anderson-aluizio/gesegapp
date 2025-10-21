import { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import AutocompleteSearchDropdown, { AutocompleteDropdownOption } from '@/components/AutocompleteSearchDropdown';
import { router, Stack } from 'expo-router';
import { Button, Dialog, Portal, Text, Chip, Surface, IconButton } from 'react-native-paper';
import { useEquipeDatabase, EquipeDatabase } from '@/database/Models/useEquipeDatabase';
import { useVeiculoDatabase } from '@/database/Models/useVeiculoDatabase';
import { useFuncionarioDatabase } from '@/database/Models/useFuncionarioDatabase';
import { useEquipeTurnoDatabase } from '@/database/Models/useEquipeTurnoDatabase';
import { useEquipeTurnoFuncionarioDatabase } from '@/database/Models/useEquipeTurnoFuncionarioDatabase';
import ProtectedRoute from '@/components/ProtectedRoute';

type FuncionarioSelected = {
    cpf: string;
    nome: string;
    is_lider: boolean;
};

export default function CreateTurnoEquipeScreen() {
    const [equipes, setEquipes] = useState<AutocompleteDropdownOption[]>([]);
    const [selectedEquipe, setSelectedEquipe] = useState<string | null>(null);
    const [selectedVeiculo, setSelectedVeiculo] = useState<string | null>(null);
    const [selectedDate] = useState<Date>(new Date());
    const [selectedFuncionarios, setSelectedFuncionarios] = useState<FuncionarioSelected[]>([]);
    const [searchFuncionario, setSearchFuncionario] = useState<string>('');
    const [dialogDesc, setDialogDesc] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const equipeDb = useEquipeDatabase();
    const veiculoDb = useVeiculoDatabase();
    const funcionarioDb = useFuncionarioDatabase();
    const equipeTurnoDb = useEquipeTurnoDatabase();
    const equipeTurnoFuncionarioDb = useEquipeTurnoFuncionarioDatabase();

    const loadEquipes = async () => {
        const res = await equipeDb.getAll();
        if (!res || res.length === 0) {
            return [];
        }
        const formatted = res.map((item: EquipeDatabase) => ({
            id: String(item.id),
            title: String(item.nome),
        }));
        setEquipes(formatted);
    }

    useEffect(() => {
        loadEquipes();
    }, []);

    const handleChangeEquipe = (value: string | object | null) => {
        if (typeof value === 'string' || value === null) {
            setSelectedEquipe(value);
        } else {
            setSelectedEquipe(String(value));
        }
        setSelectedVeiculo(null);
    };

    const handleChangeVeiculo = (value: string | object | null) => {
        if (typeof value === 'string' || value === null) {
            setSelectedVeiculo(value);
        } else {
            setSelectedVeiculo(String(value));
        }
    };

    const handleAddFuncionario = async (value: string | object | null) => {

        if (value && typeof value === 'object') {
            const cpf = (value as AutocompleteDropdownOption).id;
            const existingFuncionario = selectedFuncionarios.find(colaborador => colaborador.cpf === cpf);
            if (existingFuncionario) {
                setDialogDesc('Este funcionário já foi adicionado.');
                return;
            }
            const funcionario = {
                cpf: cpf,
                nome: (value as AutocompleteDropdownOption).title,
                is_lider: false
            } as FuncionarioSelected;

            setSelectedFuncionarios([...selectedFuncionarios, funcionario]);
            setSearchFuncionario('');
        } else {
            setSearchFuncionario('');
        }

    };

    const handleRemoveFuncionario = (cpf: string) => {
        setSelectedFuncionarios(selectedFuncionarios.filter(f => f.cpf !== cpf));
    };

    const handleToggleLider = (cpf: string) => {
        setSelectedFuncionarios(selectedFuncionarios.map(f => ({
            ...f,
            // Only the selected funcionario can be lider
            is_lider: f.cpf === cpf ? !f.is_lider : false
        })));
    };

    const handleSubmit = async () => {
        // Validations
        if (!selectedEquipe) {
            setDialogDesc('Selecione uma equipe.');
            return;
        }

        if (!selectedVeiculo) {
            setDialogDesc('Selecione um veículo.');
            return;
        }

        if (selectedFuncionarios.length === 0) {
            setDialogDesc('Adicione pelo menos um funcionário ao turno.');
            return;
        }

        const hasLider = selectedFuncionarios.some(f => f.is_lider);
        if (!hasLider) {
            setDialogDesc('Selecione um líder para o turno.');
            return;
        }

        setIsSubmitting(true);

        try {
            const dateStr = selectedDate.toISOString().split('T')[0];
            const existingTurno = await equipeTurnoDb.checkExistingTurnoToday(dateStr);

            if (existingTurno) {
                setDialogDesc('Já existe um turno criado para hoje.');
                setIsSubmitting(false);
                return;
            }

            const turnoResult = await equipeTurnoDb.create({
                equipe_id: Number(selectedEquipe),
                date: selectedDate,
                veiculo_id: selectedVeiculo
            });

            if (!turnoResult.lastInsertRowId) {
                setDialogDesc('Erro ao criar turno. Tente novamente.');
                setIsSubmitting(false);
                return;
            }

            for (const funcionario of selectedFuncionarios) {
                await equipeTurnoFuncionarioDb.create({
                    equipe_turno_id: Number(turnoResult.lastInsertRowId),
                    funcionario_cpf: funcionario.cpf,
                    is_lider: funcionario.is_lider
                });
            }

            router.replace('/turno-equipe');
        } catch (error) {
            console.error('Erro ao criar turno:', error);
            setDialogDesc('Erro ao criar turno. Tente novamente.');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <ProtectedRoute>
            <View style={styles.container}>
                <Stack.Screen
                    options={{
                        title: 'Abertura de Turno',
                        headerLeft: () => (
                            <IconButton
                                icon="arrow-left"
                                size={24}
                                onPress={() => router.push('/home')}
                            />
                        ),
                    }}
                />
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <Surface style={styles.formCard} elevation={2}>
                        <View style={styles.inner}>
                            <Text variant="labelLarge" style={styles.sectionTitle}>
                                Informações do Turno
                            </Text>

                            <View style={styles.dateContainer}>
                                <Text variant="labelMedium" style={styles.label}>Data do Turno</Text>
                                <Text variant="bodyLarge" style={styles.dateText}>
                                    {selectedDate.toLocaleDateString('pt-BR', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </Text>
                            </View>

                            <AutocompleteSearchDropdown
                                listName="equipes"
                                label="Equipe"
                                value={selectedEquipe}
                                placeholder="Digite para pesquisar equipe"
                                onValueChange={handleChangeEquipe}
                            />

                            <AutocompleteSearchDropdown
                                listName="veiculos"
                                label="Veículo"
                                value={selectedVeiculo}
                                placeholder="Digite para pesquisar veículo"
                                onValueChange={handleChangeVeiculo}
                            />

                            <Text variant="labelLarge" style={[styles.sectionTitle, { marginTop: 24 }]}>
                                Colaboradores do Turno
                            </Text>

                            <AutocompleteSearchDropdown
                                label="Adicionar Colaborador"
                                placeholder="Digite o nome do colaborador"
                                value={searchFuncionario}
                                listName="funcionarios"
                                returnObject={true}
                                onValueChange={handleAddFuncionario}
                            />

                            {selectedFuncionarios.length > 0 ? (
                                <Surface style={styles.funcionariosContainer} elevation={1}>
                                    {selectedFuncionarios.map((funcionario) => (
                                        <View key={funcionario.cpf} style={styles.funcionarioCard}>
                                            <View style={styles.funcionarioHeader}>
                                                <View style={styles.funcionarioInfo}>
                                                    <Text variant="bodyMedium" style={styles.funcionarioNome}>
                                                        {funcionario.nome}
                                                    </Text>
                                                </View>
                                                <Button
                                                    mode="text"
                                                    onPress={() => handleRemoveFuncionario(funcionario.cpf)}
                                                    textColor="#e74c3c"
                                                    compact
                                                >
                                                    Remover
                                                </Button>
                                            </View>

                                            <View style={styles.funcionarioChips}>
                                                <Chip
                                                    selected={funcionario.is_lider}
                                                    onPress={() => handleToggleLider(funcionario.cpf)}
                                                    style={styles.chip}
                                                    icon={funcionario.is_lider ? 'check' : undefined}
                                                >
                                                    Líder
                                                </Chip>
                                            </View>
                                        </View>
                                    ))}
                                </Surface>
                            ) : null}

                            {selectedFuncionarios.length === 0 ? (
                                <Surface style={styles.emptyFuncionarios} elevation={1}>
                                    <Text variant="bodySmall" style={styles.emptyText}>
                                        Nenhum funcionário adicionado. Use o campo acima para adicionar.
                                    </Text>
                                </Surface>
                            ) : null}
                        </View>
                    </Surface>

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
                    <Button
                        mode="contained"
                        onPress={handleSubmit}
                        buttonColor="#0439c9"
                        style={styles.btnSubmit}
                        loading={isSubmitting}
                        disabled={isSubmitting}
                    >
                        ABRIR TURNO
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
        paddingTop: 8,
        paddingBottom: 80,
    },
    formCard: {
        backgroundColor: "#fff",
        margin: 12,
        borderRadius: 12,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.10,
        shadowRadius: 8,
        elevation: 3,
    },
    inner: {
        gap: 16,
    },
    sectionTitle: {
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    dateContainer: {
        padding: 12,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
    },
    label: {
        color: '#666',
        marginBottom: 4,
    },
    dateText: {
        color: '#333',
        textTransform: 'capitalize',
    },
    funcionariosContainer: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 12,
        gap: 12,
    },
    funcionarioCard: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12,
        gap: 8,
    },
    funcionarioHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    funcionarioInfo: {
        flex: 1,
    },
    funcionarioNome: {
        fontWeight: 'bold',
        color: '#333',
    },
    funcionarioDetails: {
        color: '#666',
        marginTop: 2,
    },
    funcionarioChips: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
    },
    chip: {
        height: 32,
    },
    emptyFuncionarios: {
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 20,
        alignItems: 'center',
    },
    emptyText: {
        color: '#999',
        textAlign: 'center',
    },
    stickyButtonContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "#fff",
        paddingHorizontal: 16,
        paddingBottom: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        elevation: 8,
    },
    btnSubmit: {
        borderRadius: 12,
        elevation: 2,
    },
});

import { useState, useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import AutocompleteSearchDropdown, { AutocompleteDropdownOption } from '@/components/ui/inputs/AutocompleteSearchDropdown';
import { router, Stack } from 'expo-router';
import { Button, Dialog, Portal, Text, Chip, Surface, IconButton } from 'react-native-paper';
import { useEquipeTurnoDatabase } from '@/database/models/useEquipeTurnoDatabase';
import { useEquipeTurnoFuncionarioDatabase } from '@/database/models/useEquipeTurnoFuncionarioDatabase';
import ProtectedRoute from '@/components/guards/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme, ThemeColors } from '@/contexts/ThemeContext';

type FuncionarioSelected = {
    cpf: string;
    nome: string;
    is_lider: boolean;
    is_blocked?: boolean;
};

type LiderancaSelected = {
    cpf: string;
    nome: string;
};

export default function CreateTurnoEquipeScreen() {
    const { user } = useAuth();
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    const userFuncionarioSelected = {
        cpf: user?.cpf || '',
        nome: user?.name || '',
        is_lider: true,
        is_blocked: true
    }
    const [selectedEquipe, setSelectedEquipe] = useState<string | null>(null);
    const [selectedVeiculo, setSelectedVeiculo] = useState<string | null>(null);
    const [selectedDate] = useState<Date>(new Date());
    const [selectedFuncionarios, setSelectedFuncionarios] = useState<FuncionarioSelected[]>([userFuncionarioSelected]);
    const [searchFuncionario, setSearchFuncionario] = useState<string>('');
    const [dialogDesc, setDialogDesc] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Liderança fields
    const [selectedEncarregado, setSelectedEncarregado] = useState<LiderancaSelected | null>(null);
    const [selectedSupervisor, setSelectedSupervisor] = useState<LiderancaSelected | null>(null);
    const [selectedCoordenador, setSelectedCoordenador] = useState<LiderancaSelected | null>(null);

    const equipeTurnoDb = useEquipeTurnoDatabase();
    const equipeTurnoFuncionarioDb = useEquipeTurnoFuncionarioDatabase();

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
            is_lider: f.cpf === cpf ? !f.is_lider : false
        })));
    };

    const handleChangeEncarregado = (value: string | object | null) => {
        if (value && typeof value === 'object') {
            const option = value as AutocompleteDropdownOption;
            if (option.id && option.title) {
                setSelectedEncarregado({ cpf: option.id, nome: option.title });
            }
        } else {
            setSelectedEncarregado(null);
        }
    };

    const handleChangeSupervisor = (value: string | object | null) => {
        if (value && typeof value === 'object') {
            const option = value as AutocompleteDropdownOption;
            if (option.id && option.title) {
                setSelectedSupervisor({ cpf: option.id, nome: option.title });
            }
        } else {
            setSelectedSupervisor(null);
        }
    };

    const handleChangeCoordenador = (value: string | object | null) => {
        if (value && typeof value === 'object') {
            const option = value as AutocompleteDropdownOption;
            if (option.id && option.title) {
                setSelectedCoordenador({ cpf: option.id, nome: option.title });
            }
        } else {
            setSelectedCoordenador(null);
        }
    };

    const handleSubmit = async () => {
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

        if (!selectedEncarregado) {
            setDialogDesc('Selecione um encarregado.');
            return;
        }

        if (!selectedSupervisor) {
            setDialogDesc('Selecione um supervisor.');
            return;
        }

        if (!selectedCoordenador) {
            setDialogDesc('Selecione um coordenador.');
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
                veiculo_id: selectedVeiculo,
                encarregado_cpf: selectedEncarregado?.cpf || '',
                supervisor_cpf: selectedSupervisor?.cpf || '',
                coordenador_cpf: selectedCoordenador?.cpf || ''
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

            // Check if selected date is today
            const today = new Date();
            const isToday = selectedDate.toDateString() === today.toDateString();

            if (isToday) {
                router.replace('/checklist/create');
            } else {
                router.replace('/turno-equipe');
            }
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
                                                    disabled={funcionario.is_blocked}
                                                    mode="text"
                                                    onPress={() => handleRemoveFuncionario(funcionario.cpf)}
                                                    textColor={colors.buttonDanger}
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

                            <Text variant="labelLarge" style={[styles.sectionTitle, { marginTop: 24 }]}>
                                Liderança
                            </Text>

                            <AutocompleteSearchDropdown
                                label="Encarregado *"
                                placeholder="Digite o nome do encarregado"
                                value={selectedEncarregado?.cpf || null}
                                listName="funcionarios"
                                returnObject={true}
                                onValueChange={handleChangeEncarregado}
                            />

                            <AutocompleteSearchDropdown
                                label="Supervisor *"
                                placeholder="Digite o nome do supervisor"
                                value={selectedSupervisor?.cpf || null}
                                listName="funcionarios"
                                returnObject={true}
                                onValueChange={handleChangeSupervisor}
                            />

                            <AutocompleteSearchDropdown
                                label="Coordenador *"
                                placeholder="Digite o nome do coordenador"
                                value={selectedCoordenador?.cpf || null}
                                listName="funcionarios"
                                returnObject={true}
                                onValueChange={handleChangeCoordenador}
                            />

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
                        buttonColor={colors.buttonPrimary}
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

const createStyles = (colors: ThemeColors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContent: {
        flexGrow: 1,
        paddingTop: 8,
        paddingBottom: 80,
    },
    formCard: {
        backgroundColor: colors.surface,
        margin: 12,
        borderRadius: 12,
        padding: 16,
        shadowColor: colors.shadow,
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
        color: colors.text,
        marginBottom: 4,
    },
    dateContainer: {
        padding: 12,
        backgroundColor: colors.surfaceVariant,
        borderRadius: 8,
    },
    label: {
        color: colors.textSecondary,
        marginBottom: 4,
    },
    dateText: {
        color: colors.text,
        textTransform: 'capitalize',
    },
    funcionariosContainer: {
        backgroundColor: colors.surfaceVariant,
        borderRadius: 12,
        padding: 12,
        gap: 12,
    },
    funcionarioCard: {
        backgroundColor: colors.surface,
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
        color: colors.text,
    },
    funcionarioDetails: {
        color: colors.textSecondary,
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
        backgroundColor: colors.surfaceVariant,
        borderRadius: 8,
        padding: 20,
        alignItems: 'center',
    },
    emptyText: {
        color: colors.textTertiary,
        textAlign: 'center',
    },
    stickyButtonContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: colors.surface,
        paddingHorizontal: 16,
        paddingBottom: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        elevation: 8,
    },
    btnSubmit: {
        borderRadius: 12,
        elevation: 2,
    },
});

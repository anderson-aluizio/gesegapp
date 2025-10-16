import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, Alert } from 'react-native';
import { Button, Text, Surface, List, Divider, Chip, IconButton } from 'react-native-paper';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { EquipeTurnoDatabaseWithRelations, useEquipeTurnoDatabase } from '@/database/Models/useEquipeTurnoDatabase';
import { EquipeTurnoFuncionarioDatabaseWithRelations, useEquipeTurnoFuncionarioDatabase } from '@/database/Models/useEquipeTurnoFuncionarioDatabase';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

export default function TurnoEquipeDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [turno, setTurno] = useState<EquipeTurnoDatabaseWithRelations | null>(null);
    const [funcionarios, setFuncionarios] = useState<EquipeTurnoFuncionarioDatabaseWithRelations[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const turnoDb = useEquipeTurnoDatabase();
    const turnoFuncionarioDb = useEquipeTurnoFuncionarioDatabase();
    const { user } = useAuth();

    const loadData = async () => {
        if (!id) return;

        try {
            const turnoData = await turnoDb.show(Number(id));
            const funcionariosData = await turnoFuncionarioDb.getByEquipeTurnoId(Number(id));

            setTurno(turnoData);
            setFuncionarios(funcionariosData);
        } catch (error) {
            console.error('Erro ao carregar turno:', error);
            Alert.alert('Erro', 'Erro ao carregar os dados do turno.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [id]);

    const handleEncerrar = () => {
        if (!turno || !user) return;

        Alert.alert(
            'Encerrar Turno',
            'Tem certeza que deseja encerrar este turno?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Encerrar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await turnoDb.updateEncerrado(turno.id, user.id);
                            Alert.alert('Sucesso', 'Turno encerrado com sucesso!', [
                                { text: 'OK', onPress: () => router.back() }
                            ]);
                        } catch (error) {
                            console.error('Erro ao encerrar turno:', error);
                            Alert.alert('Erro', 'Erro ao encerrar turno. Tente novamente.');
                        }
                    }
                }
            ]
        );
    };

    if (isLoading) {
        return (
            <ProtectedRoute>
                <View style={styles.loadingContainer}>
                    <Text>Carregando...</Text>
                </View>
            </ProtectedRoute>
        );
    }

    if (!turno) {
        return (
            <ProtectedRoute>
                <View style={styles.loadingContainer}>
                    <Text>Turno não encontrado.</Text>
                </View>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute>
            <View style={styles.container}>
                <Stack.Screen
                    options={{
                        title: 'Detalhes do Turno',
                        headerRight: () => (
                            !turno.is_encerrado ? (
                                <Button
                                    icon="check-circle"
                                    onPress={handleEncerrar}
                                    textColor="#4caf50"
                                >
                                    Encerrar
                                </Button>
                            ) : null
                        ),
                    }}
                />

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <Surface style={styles.statusCard} elevation={2}>
                        <View style={styles.statusBadgeContainer}>
                            <Chip
                                icon={turno.is_encerrado ? 'check-circle' : 'clock-outline'}
                                style={[
                                    styles.statusChip,
                                    turno.is_encerrado ? styles.statusChipEncerrado : styles.statusChipAberto
                                ]}
                                textStyle={styles.statusChipText}
                            >
                                {turno.is_encerrado ? 'Encerrado' : 'Aberto'}
                            </Chip>
                        </View>
                    </Surface>

                    <Surface style={styles.card} elevation={2}>
                        <Text variant="titleMedium" style={styles.cardTitle}>
                            Informações do Turno
                        </Text>
                        <Divider style={styles.divider} />

                        <List.Item
                            title="Equipe"
                            description={turno.equipe_nome}
                            left={props => <List.Icon {...props} icon="account-group" />}
                            titleStyle={styles.listItemTitle}
                        />
                        <List.Item
                            title="Data"
                            description={new Date(turno.date).toLocaleDateString('pt-BR', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                            left={props => <List.Icon {...props} icon="calendar" />}
                            titleStyle={styles.listItemTitle}
                        />
                        <List.Item
                            title="Veículo"
                            description={turno.veiculo_nome}
                            left={props => <List.Icon {...props} icon="car" />}
                            titleStyle={styles.listItemTitle}
                        />
                        <List.Item
                            title="Abertura"
                            description={new Date(turno.created_at).toLocaleString('pt-BR')}
                            left={props => <List.Icon {...props} icon="clock-start" />}
                            titleStyle={styles.listItemTitle}
                        />
                        {turno.is_encerrado && turno.encerrado_at ? (
                            <List.Item
                                title="Encerramento"
                                description={new Date(turno.encerrado_at).toLocaleString('pt-BR')}
                                left={props => <List.Icon {...props} icon="clock-end" />}
                                titleStyle={styles.listItemTitle}
                            />
                        ) : null}
                    </Surface>

                    <Surface style={styles.card} elevation={2}>
                        <View style={styles.cardHeader}>
                            <Text variant="titleMedium" style={styles.cardTitle}>
                                Funcionários
                            </Text>
                            <Chip compact>
                                {funcionarios.length} {funcionarios.length === 1 ? 'funcionário' : 'funcionários'}
                            </Chip>
                        </View>
                        <Divider style={styles.divider} />

                        {funcionarios.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>Nenhum funcionário adicionado.</Text>
                            </View>
                        ) : (
                            funcionarios.map((funcionario, index) => (
                                <View key={funcionario.id}>
                                    <View style={styles.funcionarioItem}>
                                        <View style={styles.funcionarioInfo}>
                                            <Text variant="bodyLarge" style={styles.funcionarioNome}>
                                                {funcionario.funcionario_nome}
                                            </Text>
                                            <Text variant="bodySmall" style={styles.funcionarioDetails}>
                                                {funcionario.funcionario_cargo_nome} • Mat: {funcionario.funcionario_matricula}
                                            </Text>
                                            <View style={styles.funcionarioChips}>
                                                {funcionario.is_lider === 1 ? (
                                                    <Chip
                                                        compact
                                                        icon="account-star"
                                                        style={styles.roleChip}
                                                        textStyle={styles.roleChipText}
                                                    >
                                                        Líder
                                                    </Chip>
                                                ) : null}
                                            </View>
                                        </View>
                                        <IconButton
                                            icon="account-circle"
                                            size={24}
                                            iconColor="#667eea"
                                        />
                                    </View>
                                    {index < funcionarios.length - 1 ? <Divider style={styles.itemDivider} /> : null}
                                </View>
                            ))
                        )}
                    </Surface>
                </ScrollView>
            </View>
        </ProtectedRoute>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f4f6fb',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 32,
    },
    statusCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        alignItems: 'center',
    },
    statusBadgeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusChip: {
        paddingHorizontal: 8,
    },
    statusChipAberto: {
        backgroundColor: '#e8f5e9',
    },
    statusChipEncerrado: {
        backgroundColor: '#f5f5f5',
    },
    statusChipText: {
        fontWeight: 'bold',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    cardTitle: {
        fontWeight: 'bold',
        color: '#333',
    },
    divider: {
        marginBottom: 12,
    },
    listItemTitle: {
        fontSize: 14,
        color: '#666',
    },
    funcionarioItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    funcionarioInfo: {
        flex: 1,
    },
    funcionarioNome: {
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    funcionarioDetails: {
        color: '#666',
        marginBottom: 8,
    },
    funcionarioChips: {
        flexDirection: 'row',
        gap: 6,
        flexWrap: 'wrap',
    },
    roleChip: {
        height: 28,
        backgroundColor: '#e3f2fd',
    },
    roleChipText: {
        fontSize: 11,
        color: '#1976d2',
    },
    itemDivider: {
        marginVertical: 4,
    },
    emptyContainer: {
        padding: 24,
        alignItems: 'center',
    },
    emptyText: {
        color: '#999',
        textAlign: 'center',
    },
});

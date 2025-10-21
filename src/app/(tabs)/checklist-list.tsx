import { FlatList, StyleSheet, View, StatusBar, Animated, Platform, Image, Alert } from 'react-native';
import { Button, Dialog, Portal, Text, Surface, FAB, Searchbar, IconButton, ActivityIndicator } from 'react-native-paper';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChecklistRealizadoDatabase, useChecklisRealizadoDatabase } from '@/database/Models/useChecklisRealizadoDatabase';
import { ChecklistRealizado } from '@/components/ChecklistRealizado';
import { useAuth } from '@/contexts/AuthContext';
import { useChecklisEstruturaItemsDatabase } from '@/database/Models/useChecklisEstruturaItemsDatabase';
import { useCentroCustosRefresh } from '@/hooks/useCentroCustosRefresh';
import { useCentroCustoDatabase } from '@/database/Models/useCentroCustoDatabase';
import { useEquipeTurnoDatabase } from '@/database/Models/useEquipeTurnoDatabase';

export default function ChecklistListScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [checklistRealizados, setChecklistRealizados] = useState<ChecklistRealizadoDatabase[]>([]);
    const [filteredChecklists, setFilteredChecklists] = useState<ChecklistRealizadoDatabase[]>([]);
    const [selectedChecklist, setSelectedChecklist] = useState<ChecklistRealizadoDatabase | null>(null);
    const [isShowEditDialog, setIsShowEditDialog] = useState<boolean>(false);
    const [isShowDeleteDialog, setIsShowDeleteDialog] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const checklistDb = useChecklisRealizadoDatabase();
    const checklistEstruturaItemsDb = useChecklisEstruturaItemsDatabase();
    const centroCustoDb = useCentroCustoDatabase();
    const turnoDb = useEquipeTurnoDatabase();
    const { user } = useAuth();

    // useCentroCustosRefresh();

    const list = async () => {
        try {
            const response = await checklistDb.getAll();
            setChecklistRealizados(response);
            setFilteredChecklists(response);

            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }).start();
        } catch (error) {
            console.error('Error fetching checklist realizados:', error);
        }
    }

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        if (query.trim() === '') {
            setFilteredChecklists(checklistRealizados);
        } else {
            const filtered = checklistRealizados.filter(checklist =>
                checklist.checklist_grupo_nome?.toLowerCase().includes(query.toLowerCase()) ||
                checklist.equipe_nome?.toLowerCase().includes(query.toLowerCase())
            );
            setFilteredChecklists(filtered);
        }
    };

    useFocusEffect(
        useCallback(() => {
            list();
            setIsLoading(false);
            if (Platform.OS === 'android') {
                StatusBar.setBarStyle('light-content');
                StatusBar.setBackgroundColor('#667eea', true);
            }
        }, [])
    );

    const handleAddButton = async () => {
        try {
            // 1. Check if data is synced
            const hasChecklistEstruturaItem = await checklistEstruturaItemsDb.getOneRow();
            const hasCentroCustoSynced = await centroCustoDb.getWithChecklistEstrutura();
            const dataSynced = !!(hasChecklistEstruturaItem && hasCentroCustoSynced && hasCentroCustoSynced.length > 0);

            if (!dataSynced) {
                Alert.alert(
                    'Dados não sincronizados',
                    'É necessário sincronizar os dados antes de criar um checklist. Deseja ir para a tela de sincronização?',
                    [
                        { text: 'Cancelar', style: 'cancel' },
                        { text: 'Sincronizar', onPress: () => router.push('/sync-data') }
                    ]
                );
                return;
            }

            // 2. Check if user is operational and if today's turno exists
            if (user?.is_operacao) {
                const hasTurno = await turnoDb.hasTodayTurno();

                if (!hasTurno) {
                    Alert.alert(
                        'Turno não iniciado',
                        'É necessário abrir o turno do dia antes de criar um checklist. Deseja abrir o turno agora?',
                        [
                            { text: 'Cancelar', style: 'cancel' },
                            { text: 'Abrir Turno', onPress: () => router.push('/turno-equipe/create') }
                        ]
                    );
                    return;
                }
            }

            // 3. All validations passed, proceed to create checklist
            router.push('/checklist/create');
        } catch (error) {
            console.error('Erro ao validar requisitos:', error);
            Alert.alert('Erro', 'Ocorreu um erro ao validar os requisitos. Tente novamente.');
        }
    };

    const handleClickChecklist = (checklist: ChecklistRealizadoDatabase) => {
        if (!checklist) return;
        if (checklist.is_finalizado) {
            setIsShowEditDialog(true);
            setSelectedChecklist(checklist);
            return;
        }
        router.push(`/checklist/${checklist.id}`);
    };

    const handleEditChecklist = async () => {
        if (!selectedChecklist) return;
        setSelectedChecklist(null);
        setIsShowEditDialog(false);
        try {
            await checklistDb.updatedUnfinished(selectedChecklist.id);
        } catch (error) {
            console.error('Error updating checklist:', error);
        }
        router.push(`/checklist/${selectedChecklist.id}`);
    };

    const handleDeleteChecklist = async () => {
        if (!selectedChecklist) return;
        try {
            setSelectedChecklist(null);
            setIsShowDeleteDialog(false);
            await checklistDb.remove(selectedChecklist.id);

            await list();
        } catch (error) {
            console.error('Error deleting checklist:', error);
        }
    }

    const handleLongPressChecklist = (checklist: ChecklistRealizadoDatabase) => {
        setSelectedChecklist(checklist);
        setIsShowDeleteDialog(true);
    };
    return (
        <View style={[styles.container]}>
            <StatusBar barStyle="light-content" backgroundColor="#667eea" translucent={false} />
            <View style={styles.headerContainer}>
                <View style={styles.headerTop}>
                    <IconButton
                        icon="arrow-left"
                        iconColor="#fff"
                        size={24}
                        onPress={() => router.back()}
                        style={styles.backButton}
                    />
                    <Text style={styles.headerTitle}>Checklists</Text>
                    <View style={styles.headerSpacer} />
                </View>
            </View>

            {isLoading ? (
                <View style={[styles.inner, { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 300 }]}>
                    <ActivityIndicator size="large" />
                </View>
            ) : (
                <>
                    <Surface style={styles.contentContainer} elevation={1}>
                        <View style={styles.searchContainer}>
                            <Searchbar
                                placeholder="Buscar..."
                                onChangeText={handleSearch}
                                value={searchQuery}
                                style={styles.searchBar}
                                inputStyle={styles.searchInput}
                                iconColor="#667eea"
                            />
                        </View>

                        <View style={styles.resultsContainer}>
                            <Text style={styles.resultsText}>
                                {searchQuery
                                    ? `${filteredChecklists.length} resultado${filteredChecklists.length !== 1 ? 's' : ''} encontrado${filteredChecklists.length !== 1 ? 's' : ''}`
                                    : `${filteredChecklists.length} registro${filteredChecklists.length !== 1 ? 's' : ''} ${filteredChecklists.length !== 1 ? 'disponíveis' : 'disponível'}`
                                }
                            </Text>
                        </View>

                        {filteredChecklists.length > 0 ? (
                            <Animated.View style={[styles.listWrapper, { opacity: fadeAnim }]}>
                                <FlatList
                                    data={filteredChecklists}
                                    keyExtractor={(item) => String(item.id)}
                                    renderItem={({ item }) => (
                                        <ChecklistRealizado
                                            data={item}
                                            onOpen={() => handleClickChecklist(item)}
                                            onLongPress={() => handleLongPressChecklist(item)}
                                        />
                                    )}
                                    contentContainerStyle={styles.listContainer}
                                    showsVerticalScrollIndicator={false}
                                />
                            </Animated.View>
                        ) : (
                            <Animated.View style={[styles.emptyState, { opacity: fadeAnim }]}>
                                <Text variant="bodyMedium" style={styles.emptyTitle}>
                                    {searchQuery ? 'Nenhum resultado encontrado' : 'Nenhum registro encontrado'}
                                </Text>
                                <Text variant="bodySmall" style={styles.emptySubtitle}>
                                    {searchQuery ? 'Tente ajustar sua busca' : 'Clique no botão abaixo para criar um novo registro.'}
                                </Text>
                            </Animated.View>
                        )}
                    </Surface>
                    <IconButton
                        icon="plus"
                        iconColor="#fff"
                        mode="contained"
                        style={styles.buttonAdd}
                        size={40}
                        onPress={handleAddButton}
                    />
                </>
            )}


            <Portal>
                <Dialog visible={isShowEditDialog} onDismiss={() => setIsShowEditDialog(false)} style={styles.dialog}>
                    <Dialog.Title style={styles.dialogTitle}>⚠️ Atenção</Dialog.Title>
                    <Dialog.Content>
                        <Text variant="bodyLarge" style={styles.dialogContent}>
                            Este registro já foi finalizado. Para editar, clique em "Editar".
                        </Text>
                        <Text variant="bodySmall" style={styles.dialogContentDescprition}>
                            Para excluir, toque e segure o registro na lista.
                        </Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <View style={styles.containerButtons}>
                            <Button
                                mode="outlined"
                                onPress={() => setIsShowEditDialog(false)}
                                style={styles.dialogButton}
                                textColor="#666"
                            >
                                Cancelar
                            </Button>
                            <Button
                                mode="contained"
                                buttonColor="#667eea"
                                onPress={handleEditChecklist}
                                style={styles.dialogButton}
                            >
                                Editar
                            </Button>
                        </View>
                    </Dialog.Actions>
                </Dialog>
                <Dialog visible={isShowDeleteDialog} onDismiss={() => setIsShowDeleteDialog(false)} style={styles.dialog}>
                    <Dialog.Title style={styles.dialogTitle}>🗑️ Confirmar Exclusão</Dialog.Title>
                    <Dialog.Content>
                        <Text variant="bodyLarge" style={styles.dialogContent}>
                            Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.
                        </Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <View style={styles.containerButtons}>
                            <Button
                                mode="outlined"
                                onPress={() => setIsShowDeleteDialog(false)}
                                style={styles.dialogButton}
                                textColor="#666"
                            >
                                Cancelar
                            </Button>
                            <Button
                                mode="contained"
                                buttonColor="#e74c3c"
                                onPress={handleDeleteChecklist}
                                style={styles.dialogButton}
                            >
                                Excluir
                            </Button>
                        </View>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    inner: {
        gap: 10,
        padding: 16,
    },

    contentContainer: {
        flex: 1,
        margin: 16,
        marginBottom: 0,
        marginTop: -10,
        borderRadius: 20,
        borderBottomEndRadius: 0,
        borderBottomStartRadius: 0,
        backgroundColor: '#ffffff',
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    searchContainer: {
        padding: 16,
        paddingBottom: 8,
    },
    searchBar: {
        elevation: 2,
        backgroundColor: '#f8f9fa',
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    searchInput: {
        color: '#333',
    },
    resultsContainer: {
        paddingHorizontal: 16,
        paddingBottom: 8,
    },
    resultsText: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },
    listWrapper: {
        flex: 1,
    },
    listContainer: {
        paddingTop: 8,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyTitle: {
        color: '#6c757d',
        textAlign: 'center',
        marginBottom: 8,
    },
    emptySubtitle: {
        color: '#9ca3af',
        textAlign: 'center',
        opacity: 0.8,
    },
    dialog: {
        borderRadius: 20,
        backgroundColor: '#ffffff',
        elevation: 24,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 12,
        },
        shadowOpacity: 0.15,
        shadowRadius: 16,
    },
    dialogTitle: {
        textAlign: 'center',
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    dialogContent: {
        textAlign: 'center',
        lineHeight: 24,
        color: '#666',
    },
    dialogContentDescprition: {
        textAlign: 'center',
        lineHeight: 20,
        color: 'red',
    },
    dialogButton: {
        flex: 1,
        borderRadius: 25,
        marginHorizontal: 4,
    },

    containerButtons: {
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: 8,
    },
    buttonAdd: {
        position: 'absolute',
        right: 16,
        bottom: 40,
        borderRadius: 30,
        backgroundColor: '#0439c9',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    headerContainer: {
        backgroundColor: '#667eea',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    backButton: {
        margin: 0,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        flex: 1,
        textAlign: 'center',
    },
    headerSpacer: {
        width: 40,
    },
});

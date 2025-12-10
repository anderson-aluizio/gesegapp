import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Surface, Card, IconButton, ActivityIndicator, Searchbar, Button } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useMemo } from 'react';
import { useChecklistEstruturaDatabase, ChecklistEstruturaDatabase } from '@/database/models/useChecklistEstruturaDatabase';
import { useChecklisRealizadoDatabase } from '@/database/models/useChecklisRealizadoDatabase';
import { useDialog } from '@/hooks/useDialog';
import InfoDialog from '@/components/ui/dialogs/InfoDialog';
import { useTheme, ThemeColors } from '@/contexts/ThemeContext';

export default function DuplicateChecklistScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    const [isLoading, setIsLoading] = useState(true);
    const [isDuplicating, setIsDuplicating] = useState(false);
    const [estruturas, setEstruturas] = useState<ChecklistEstruturaDatabase[]>([]);
    const [filteredEstruturas, setFilteredEstruturas] = useState<ChecklistEstruturaDatabase[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedEstrutura, setSelectedEstrutura] = useState<ChecklistEstruturaDatabase | null>(null);

    const dialog = useDialog();
    const estruturaDb = useChecklistEstruturaDatabase();
    const checklistDb = useChecklisRealizadoDatabase();

    useEffect(() => {
        loadEstruturas();
    }, []);

    const loadEstruturas = async () => {
        try {
            setIsLoading(true);

            const originalChecklist = await checklistDb.show(parseInt(id as string));

            if (!originalChecklist) {
                dialog.show('❌ Erro', 'Checklist original não encontrado.');
                setIsLoading(false);
                return;
            }

            const allEstruturas = await estruturaDb.getByCentroCustoId({ centro_custo_id: originalChecklist.centro_custo_id });

            const filteredData = allEstruturas.filter(
                estrutura => estrutura.centro_custo_id === originalChecklist.centro_custo_id
            );

            setEstruturas(filteredData);
            setFilteredEstruturas(filteredData);
        } catch (error) {
            console.error('Error loading estruturas:', error);
            dialog.show('❌ Erro', 'Não foi possível carregar as estruturas de checklist.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        if (query.trim() === '') {
            setFilteredEstruturas(estruturas);
        } else {
            const filtered = estruturas.filter(estrutura =>
                estrutura.modelo.toLowerCase().includes(query.toLowerCase())
            );
            setFilteredEstruturas(filtered);
        }
    };

    const handleSelectEstrutura = (estrutura: ChecklistEstruturaDatabase) => {
        setSelectedEstrutura(estrutura);
    };

    const handleDuplicate = async () => {
        if (!selectedEstrutura) {
            dialog.show('⚠️ Atenção', 'Selecione uma estrutura de checklist para continuar.');
            return;
        }

        try {
            setIsDuplicating(true);
            const result = await checklistDb.duplicate(parseInt(id as string), selectedEstrutura);

            if (result.success) {
                dialog.show('✅ Sucesso', 'Checklist duplicado com sucesso!');
                setTimeout(() => {
                    router.replace(`/checklist/${result.newChecklistId}`);
                }, 1500);
            }
        } catch (error) {
            console.error('Error duplicating checklist:', error);
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            dialog.show('❌ Erro', `Não foi possível duplicar o checklist.\n\n${errorMessage}`);
        } finally {
            setIsDuplicating(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <View style={styles.headerTop}>
                    <IconButton
                        icon="arrow-left"
                        iconColor={colors.textOnPrimary}
                        size={24}
                        onPress={() => router.back()}
                        style={styles.backButton}
                    />
                    <Text style={styles.headerTitle}>Duplicar Checklist</Text>
                    <View style={styles.headerSpacer} />
                </View>
            </View>

            <Surface style={styles.contentContainer} elevation={1}>
                <View style={styles.infoCard}>
                    <Text variant="bodySmall" style={styles.infoDescription}>
                        Escolha a estrutura que deseja usar. Os dados serão copiados, mas os itens serão criados de acordo com a nova estrutura.
                    </Text>
                </View>

                <View style={styles.searchContainer}>
                    <Searchbar
                        placeholder="Buscar estrutura..."
                        onChangeText={handleSearch}
                        value={searchQuery}
                        style={styles.searchBar}
                        inputStyle={styles.searchInput}
                        iconColor={colors.primaryDark}
                    />
                </View>

                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={colors.primaryDark} />
                        <Text style={styles.loadingText}>Carregando estruturas...</Text>
                    </View>
                ) : filteredEstruturas.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text variant="bodyMedium" style={styles.emptyTitle}>
                            {searchQuery ? 'Nenhum resultado encontrado' : 'Nenhuma estrutura disponível'}
                        </Text>
                        <Text variant="bodySmall" style={styles.emptySubtitle}>
                            {searchQuery ? 'Tente ajustar sua busca' : 'Sincronize os dados para ver as estruturas disponíveis'}
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={filteredEstruturas}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item }) => (
                            <Card
                                style={[
                                    styles.estruturaCard,
                                    selectedEstrutura?.id === item.id && styles.selectedCard
                                ]}
                                onPress={() => handleSelectEstrutura(item)}
                            >
                                <Card.Content style={styles.cardContent}>
                                    <View style={styles.cardRow}>
                                        <View style={styles.cardInfo}>
                                            <Text variant="titleSmall" style={styles.cardTitle}>
                                                {item.modelo}
                                            </Text>
                                        </View>
                                        {selectedEstrutura?.id === item.id && (
                                            <IconButton
                                                icon="check-circle"
                                                size={24}
                                                iconColor={colors.success}
                                                style={styles.checkIcon}
                                            />
                                        )}
                                    </View>
                                </Card.Content>
                            </Card>
                        )}
                        contentContainerStyle={styles.listContainer}
                        showsVerticalScrollIndicator={false}
                    />
                )}

                <View style={styles.footerButtons}>
                    <Button
                        mode="outlined"
                        onPress={() => router.back()}
                        style={styles.cancelButton}
                        disabled={isDuplicating}
                    >
                        Cancelar
                    </Button>
                    <Button
                        mode="contained"
                        onPress={handleDuplicate}
                        style={styles.duplicateButton}
                        buttonColor={colors.warning}
                        loading={isDuplicating}
                        disabled={isDuplicating || !selectedEstrutura}
                    >
                        {isDuplicating ? 'Duplicando...' : 'Duplicar'}
                    </Button>
                </View>
            </Surface>

            <InfoDialog
                visible={dialog.visible}
                description={dialog.description}
                title={dialog.title}
                onDismiss={dialog.hide}
            />
        </View>
    );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    headerContainer: {
        backgroundColor: colors.primaryDark,
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        elevation: 4,
        shadowColor: colors.shadow,
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
        color: colors.textOnPrimary,
        fontSize: 20,
        fontWeight: 'bold',
        flex: 1,
        textAlign: 'center',
    },
    headerSpacer: {
        width: 40,
    },
    contentContainer: {
        flex: 1,
        margin: 16,
        marginTop: -10,
        borderRadius: 20,
        backgroundColor: colors.surface,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: colors.shadow,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    infoCard: {
        padding: 12,
        backgroundColor: colors.surfaceVariant,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    infoDescription: {
        color: colors.textSecondary,
        lineHeight: 18,
        fontSize: 13,
    },
    searchContainer: {
        padding: 16,
        paddingBottom: 8,
    },
    searchBar: {
        elevation: 2,
        backgroundColor: colors.surfaceVariant,
        borderRadius: 15,
    },
    searchInput: {
        color: colors.text,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    loadingText: {
        marginTop: 16,
        color: colors.textSecondary,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyTitle: {
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: 8,
    },
    emptySubtitle: {
        color: colors.textMuted,
        textAlign: 'center',
        opacity: 0.8,
    },
    listContainer: {
        padding: 16,
        paddingTop: 8,
    },
    estruturaCard: {
        marginBottom: 12,
        backgroundColor: colors.surface,
        borderRadius: 12,
        elevation: 2,
    },
    selectedCard: {
        backgroundColor: colors.success,
        borderWidth: 2,
        borderColor: colors.success,
    },
    cardContent: {
        paddingVertical: 12,
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    cardInfo: {
        flex: 1,
    },
    cardTitle: {
        color: colors.text,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    checkIcon: {
        margin: 0,
    },
    footerButtons: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: colors.surfaceVariant,
    },
    cancelButton: {
        flex: 1,
    },
    duplicateButton: {
        flex: 1,
    },
});

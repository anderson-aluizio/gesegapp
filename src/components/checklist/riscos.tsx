import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Checkbox, Text, ActivityIndicator } from 'react-native-paper';
import { ChecklistRealizadoDatabase } from '@/database/models/useChecklisRealizadoDatabase';
import { useChecklisEstruturaRiscosDatabase, ChecklistEstruturaRiscosDatabase } from '@/database/models/useChecklisEstruturaRiscosDatabase';
import { useChecklisEstruturaControleRiscosDatabase, ChecklistEstruturaControleRiscosDatabase } from '@/database/models/useChecklisEstruturaControleRiscosDatabase';
import { useChecklisRealizadoRiscosDatabase } from '@/database/models/useChecklisRealizadoRiscosDatabase';
import { useChecklisRealizadoControleRiscosDatabase } from '@/database/models/useChecklisRealizadoControleRiscosDatabase';
import { useDialog } from '@/hooks/useDialog';
import InfoDialog from '@/components/ui/dialogs/InfoDialog';

type RiscoWithControles = {
    risco: ChecklistEstruturaRiscosDatabase;
    isSelected: boolean;
    checklistRealizadoRiscoId?: number;
    controles: Array<{
        controle: ChecklistEstruturaControleRiscosDatabase;
        isSelected: boolean;
    }>;
};

export default function RiscosScreen(props: { checklistRealizado: ChecklistRealizadoDatabase; formUpdated: () => void }) {
    const [checklistRealizado, setChecklistRealizado] = useState<ChecklistRealizadoDatabase>(props.checklistRealizado);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isFormDirty, setIsFormDirty] = useState<boolean>(false);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [riscos, setRiscos] = useState<RiscoWithControles[]>([]);
    const [expandedRiscos, setExpandedRiscos] = useState<Set<number>>(new Set());

    const dialog = useDialog();
    const estruturaRiscosDb = useChecklisEstruturaRiscosDatabase();
    const estruturaControlesDb = useChecklisEstruturaControleRiscosDatabase();
    const realizadoRiscosDb = useChecklisRealizadoRiscosDatabase();
    const realizadoControlesDb = useChecklisRealizadoControleRiscosDatabase();

    useEffect(() => {
        setChecklistRealizado(props.checklistRealizado);
    }, [props.checklistRealizado]);

    useEffect(() => {
        if (checklistRealizado.id) {
            loadRiscos();
        }
    }, [checklistRealizado.id]);

    const loadRiscos = async () => {
        setIsLoading(true);
        try {
            const estruturaRiscos = await estruturaRiscosDb.getRiscosByEstruturaId(checklistRealizado.checklist_estrutura_id);
            const selectedRiscos = await realizadoRiscosDb.getByChecklistRealizadoId(checklistRealizado.id);
            const selectedControles = await realizadoControlesDb.getByChecklistRealizadoId(checklistRealizado.id);

            const riscosWithControles: RiscoWithControles[] = await Promise.all(
                estruturaRiscos.map(async (risco) => {
                    const selectedRisco = selectedRiscos.find(sr => sr.checklist_estrutura_risco_id === risco.id);
                    const isRiscoSelected = !!selectedRisco;

                    const estruturaControles = await estruturaControlesDb.getControlesByRiscoId(risco.id);

                    const controles = estruturaControles.map(controle => {
                        const isSelected = selectedControles.some(
                            sc => sc.checklist_realizado_apr_risco_id === selectedRisco?.id &&
                                sc.checklist_estrutura_controle_risco_id === controle.id
                        );
                        return { controle, isSelected };
                    });

                    return {
                        risco,
                        isSelected: isRiscoSelected,
                        checklistRealizadoRiscoId: selectedRisco?.id,
                        controles
                    };
                })
            );

            setRiscos(riscosWithControles);
        } catch (error) {
            console.error('Erro ao carregar riscos:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleRisco = (riscoId: number) => {
        setRiscos(prev => prev.map(item => {
            if (item.risco.id === riscoId) {
                const newIsSelected = !item.isSelected;
                return {
                    ...item,
                    isSelected: newIsSelected,
                    controles: newIsSelected ? item.controles : item.controles.map(c => ({ ...c, isSelected: false }))
                };
            }
            return item;
        }));
        setIsFormDirty(true);
    };

    const toggleControle = (riscoId: number, controleId: number) => {
        setRiscos(prev => prev.map(item => {
            if (item.risco.id === riscoId) {
                return {
                    ...item,
                    controles: item.controles.map(c => {
                        if (c.controle.id === controleId) {
                            return { ...c, isSelected: !c.isSelected };
                        }
                        return c;
                    })
                };
            }
            return item;
        }));
        setIsFormDirty(true);
    };

    const toggleExpanded = (riscoId: number) => {
        setExpandedRiscos(prev => {
            const newSet = new Set(prev);
            if (newSet.has(riscoId)) {
                newSet.delete(riscoId);
            } else {
                newSet.add(riscoId);
            }
            return newSet;
        });
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await realizadoControlesDb.removeByChecklistRealizadoId(checklistRealizado.id);
            await realizadoRiscosDb.removeByChecklistRealizadoId(checklistRealizado.id);

            for (const riscoItem of riscos) {
                if (riscoItem.isSelected) {
                    const riscoRealizadoId = await realizadoRiscosDb.create({
                        checklist_realizado_id: checklistRealizado.id,
                        checklist_estrutura_risco_id: riscoItem.risco.id
                    });

                    const selectedControles = riscoItem.controles.filter(c => c.isSelected);
                    for (const controleItem of selectedControles) {
                        await realizadoControlesDb.create({
                            checklist_realizado_id: checklistRealizado.id,
                            checklist_realizado_apr_risco_id: riscoRealizadoId,
                            checklist_estrutura_controle_risco_id: controleItem.controle.id
                        });
                    }
                }
            }

            setIsFormDirty(false);
            props.formUpdated();
            await loadRiscos();
            dialog.show('Sucesso', 'Dados atualizados com sucesso.');
        } catch (error) {
            console.error('Erro ao salvar riscos:', error);
            dialog.show('Atenção', 'Erro ao atualizar os dados. Tente novamente.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0439c9" />
                <Text style={styles.loadingText}>Carregando riscos...</Text>
            </View>
        );
    }

    if (riscos.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Nenhum risco disponível para esta estrutura.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView}>
                <View style={styles.inner}>
                    <Text style={styles.headerText}>
                        Selecione os riscos aplicáveis e seus controles:
                    </Text>

                    {riscos.map((riscoItem) => {
                        const isExpanded = expandedRiscos.has(riscoItem.risco.id) || riscoItem.isSelected;
                        return (
                            <Card key={riscoItem.risco.id} style={styles.card}>
                                <View style={styles.riscoHeader}>
                                    <View style={styles.checkboxContainer}>
                                        <Checkbox
                                            status={riscoItem.isSelected ? 'checked' : 'unchecked'}
                                            onPress={() => toggleRisco(riscoItem.risco.id)}
                                        />
                                    </View>
                                    <View style={styles.titleContainer}>
                                        <Text
                                            style={styles.riscoTitle}
                                            onPress={() => toggleExpanded(riscoItem.risco.id)}
                                        >
                                            {riscoItem.risco.nome}
                                        </Text>
                                    </View>
                                    {riscoItem.controles.length > 0 && (
                                        <View style={styles.expandIconContainer}>
                                            <Text
                                                style={styles.expandIcon}
                                                onPress={() => toggleExpanded(riscoItem.risco.id)}
                                            >
                                                {isExpanded ? '▼' : '▶'}
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                {isExpanded && riscoItem.isSelected && riscoItem.controles.length > 0 && (
                                    <View style={styles.controlesContainer}>
                                        <Text style={styles.controlesHeader}>
                                            Controles disponíveis:
                                        </Text>
                                        {riscoItem.controles.map((controleItem) => (
                                            <View key={controleItem.controle.id} style={styles.controleItem}>
                                                <Checkbox
                                                    status={controleItem.isSelected ? 'checked' : 'unchecked'}
                                                    onPress={() => toggleControle(riscoItem.risco.id, controleItem.controle.id)}
                                                />
                                                <Text style={styles.controleText}>
                                                    {controleItem.controle.nome}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                )}

                                {isExpanded && riscoItem.isSelected && riscoItem.controles.length === 0 && (
                                    <Text style={styles.noControlesText}>
                                        Nenhum controle disponível para este risco.
                                    </Text>
                                )}
                            </Card>
                        );
                    })}
                </View>
            </ScrollView>

            <InfoDialog
                visible={dialog.visible}
                description={dialog.description}
                title={dialog.title}
                onDismiss={dialog.hide}
            />

            {isFormDirty && (
                <Button
                    mode="contained"
                    onPress={handleSave}
                    loading={isSaving}
                    disabled={isSaving}
                    buttonColor="#0439c9"
                    style={styles.btnSave}
                >
                    {isSaving ? 'SALVANDO...' : 'SALVAR RISCOS'}
                </Button>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    inner: {
        gap: 12,
        padding: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#666',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    headerText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    card: {
        backgroundColor: '#fff',
        elevation: 2,
        marginBottom: 8,
    },
    riscoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#fff',
    },
    checkboxContainer: {
        marginRight: 8,
    },
    titleContainer: {
        flex: 1,
    },
    riscoTitle: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    expandIconContainer: {
        paddingLeft: 8,
    },
    expandIcon: {
        fontSize: 16,
        color: '#666',
    },
    controlesContainer: {
        padding: 16,
        paddingTop: 0,
        backgroundColor: '#f8f9fa',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    controlesHeader: {
        fontSize: 14,
        fontWeight: '600',
        color: '#555',
        marginBottom: 12,
    },
    controleItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    controleText: {
        fontSize: 14,
        color: '#333',
        flex: 1,
        marginLeft: 8,
    },
    noControlesText: {
        padding: 16,
        fontSize: 14,
        color: '#999',
        fontStyle: 'italic',
        textAlign: 'center',
    },
    btnSave: {
        margin: 16,
    },
});

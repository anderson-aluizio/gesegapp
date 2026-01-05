import { useEffect, useState, useMemo, useCallback } from 'react';
import { ScrollView, StyleSheet, View, Image } from 'react-native';
import { Text, Surface, IconButton, Divider, ActivityIndicator, Chip } from 'react-native-paper';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ChecklistRealizadoDatabaseWithRelations, useChecklisRealizadoDatabase } from '@/database/models/useChecklisRealizadoDatabase';
import { ChecklistRealizadoItemsDatabaseWithItem, useChecklisRealizadoItemsDatabase } from '@/database/models/useChecklisRealizadoItemsDatabase';
import { ChecklistRealizadoFuncionarioDatabase, useChecklistRealizadoFuncionarioDatabase } from '@/database/models/useChecklistRealizadoFuncionarioDatabase';
import { ChecklistRealizadoRiscosDatabaseWithRelations, useChecklisRealizadoRiscosDatabase } from '@/database/models/useChecklisRealizadoRiscosDatabase';
import { ChecklistRealizadoControleRiscosDatabaseWithRelations, useChecklisRealizadoControleRiscosDatabase } from '@/database/models/useChecklisRealizadoControleRiscosDatabase';
import { useTheme, ThemeColors } from '@/contexts/ThemeContext';
import ProtectedRoute from '@/components/guards/ProtectedRoute';

type GroupedItems = {
    [key: string]: ChecklistRealizadoItemsDatabaseWithItem[];
};

export default function ChecklistViewScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    const [isLoading, setIsLoading] = useState(true);
    const [checklist, setChecklist] = useState<ChecklistRealizadoDatabaseWithRelations | null>(null);
    const [items, setItems] = useState<ChecklistRealizadoItemsDatabaseWithItem[]>([]);
    const [funcionarios, setFuncionarios] = useState<ChecklistRealizadoFuncionarioDatabase[]>([]);
    const [riscos, setRiscos] = useState<ChecklistRealizadoRiscosDatabaseWithRelations[]>([]);
    const [controles, setControles] = useState<ChecklistRealizadoControleRiscosDatabaseWithRelations[]>([]);

    const checklistDb = useChecklisRealizadoDatabase();
    const itemsDb = useChecklisRealizadoItemsDatabase();
    const funcionariosDb = useChecklistRealizadoFuncionarioDatabase();
    const riscosDb = useChecklisRealizadoRiscosDatabase();
    const controlesDb = useChecklisRealizadoControleRiscosDatabase();

    const loadData = useCallback(async () => {
        if (!id) return;
        try {
            setIsLoading(true);
            const checklistData = await checklistDb.show(Number(id));
            if (checklistData) {
                setChecklist(checklistData);
                const itemsData = await itemsDb.getByChecklistRealizadoId(Number(id));
                setItems(itemsData);
                const funcionariosData = await funcionariosDb.getByChecklistRealizadoId(Number(id));
                setFuncionarios(funcionariosData);
                const riscosData = await riscosDb.getByChecklistRealizadoId(Number(id));
                setRiscos(riscosData);
                const controlesData = await controlesDb.getByChecklistRealizadoId(Number(id));
                setControles(controlesData);
            }
        } catch (error) {
            console.error('Error loading checklist:', error);
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const formatDate = (date: Date | undefined) => {
        if (!date) return '-';
        const d = new Date(date);
        return d.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const groupedItems = useMemo(() => {
        return items.reduce<GroupedItems>((acc, item) => {
            const group = item.checklist_sub_grupo || 'Geral';
            if (!acc[group]) {
                acc[group] = [];
            }
            acc[group].push(item);
            return acc;
        }, {});
    }, [items]);

    const itemStats = useMemo(() => {
        const total = items.length;
        const respondidos = items.filter(i => i.is_respondido).length;
        const inconformes = items.filter(i => i.is_inconforme).length;
        return { total, respondidos, inconformes };
    }, [items]);

    const getControlesByRiscoId = useCallback((riscoRealizadoId: number) => {
        return controles.filter(c => c.checklist_realizado_apr_risco_id === riscoRealizadoId);
    }, [controles]);

    if (isLoading) {
        return (
            <ProtectedRoute>
                <View style={[styles.container, styles.centerContent]}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Carregando...</Text>
                </View>
            </ProtectedRoute>
        );
    }

    if (!checklist) {
        return (
            <ProtectedRoute>
                <View style={[styles.container, styles.centerContent]}>
                    <Text style={styles.errorText}>Checklist não encontrado</Text>
                </View>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute>
            <View style={styles.container}>
                <Stack.Screen
                    options={{
                        title: 'Visualizar Checklist',
                        headerLeft: () => (
                            <IconButton
                                icon="arrow-left"
                                size={24}
                                onPress={() => router.back()}
                            />
                        ),
                    }}
                />
                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    {/* Status Header */}
                    <Surface style={styles.statusHeader} elevation={2}>
                        <Text style={styles.checklistTitle}>{checklist.checklist_grupo_nome}</Text>
                        <Text style={styles.checklistSubtitle}>{checklist.checklist_estrutura_nome}</Text>
                    </Surface>

                    {/* Stats Summary */}
                    <Surface style={styles.statsContainer} elevation={1}>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{itemStats.total}</Text>
                            <Text style={styles.statLabel}>Total</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={[styles.statNumber, { color: colors.success }]}>{itemStats.respondidos}</Text>
                            <Text style={styles.statLabel}>Respondidos</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={[styles.statNumber, { color: colors.error }]}>{itemStats.inconformes}</Text>
                            <Text style={styles.statLabel}>Inconformes</Text>
                        </View>
                    </Surface>

                    {/* General Info Section */}
                    <Surface style={styles.section} elevation={1}>
                        <View style={styles.sectionHeader}>
                            <IconButton icon="information-outline" size={20} iconColor={colors.primary} style={styles.sectionIcon} />
                            <Text style={styles.sectionTitle}>Dados Gerais</Text>
                        </View>
                        <Divider style={styles.divider} />

                        <InfoRow label="Centro de Custo" value={checklist.centro_custo_nome} colors={colors} />
                        <InfoRow label="Município" value={checklist.localidade_cidade_nome} colors={colors} />
                        <InfoRow label="Equipe" value={checklist.equipe_nome} colors={colors} />
                        <InfoRow label="Veículo" value={checklist.veiculo_id} colors={colors} />
                        <InfoRow label="Área" value={checklist.area} colors={colors} />
                        <InfoRow label="Ordem de Serviço" value={checklist.ordem_servico || '-'} colors={colors} />
                        <InfoRow label="Data Início" value={formatDate(checklist.date)} colors={colors} />
                        <InfoRow label="Data Fim" value={formatDate(checklist.date_fim)} colors={colors} />
                        {checklist.observacao && (
                            <View style={styles.observacaoContainer}>
                                <Text style={styles.observacaoLabel}>Observação:</Text>
                                <Text style={styles.observacaoText}>{checklist.observacao}</Text>
                            </View>
                        )}
                        {(checklist.latitude && checklist.longitude) && (
                            <View style={styles.coordsContainer}>
                                <Text style={styles.coordsLabel}>Coordenadas:</Text>
                                <Text style={styles.coordsText}>
                                    {checklist.latitude?.toFixed(6)}, {checklist.longitude?.toFixed(6)}
                                </Text>
                            </View>
                        )}
                    </Surface>

                    {/* Leadership Section */}
                    <Surface style={styles.section} elevation={1}>
                        <View style={styles.sectionHeader}>
                            <IconButton icon="account-tie" size={20} iconColor={colors.primary} style={styles.sectionIcon} />
                            <Text style={styles.sectionTitle}>Liderança</Text>
                        </View>
                        <Divider style={styles.divider} />

                        <InfoRow
                            label="Encarregado"
                            value={checklist.encarregado_nome || checklist.encarregado_cpf || '-'}
                            colors={colors}
                        />
                        <InfoRow
                            label="Supervisor"
                            value={checklist.supervisor_nome || checklist.supervisor_cpf || '-'}
                            colors={colors}
                        />
                        <InfoRow
                            label="Coordenador"
                            value={checklist.coordenador_nome || checklist.coordenador_cpf || '-'}
                            colors={colors}
                        />
                    </Surface>

                    {/* Employees Section */}
                    {funcionarios.length > 0 && (
                        <Surface style={styles.section} elevation={1}>
                            <View style={styles.sectionHeader}>
                                <IconButton icon="account-group" size={20} iconColor={colors.primary} style={styles.sectionIcon} />
                                <Text style={styles.sectionTitle}>Colaboradores ({funcionarios.length})</Text>
                            </View>
                            <Divider style={styles.divider} />

                            {funcionarios.map((func, index) => (
                                <View key={func.id} style={styles.funcionarioItem}>
                                    <View style={styles.funcionarioInfo}>
                                        <Text style={styles.funcionarioNome}>{func.funcionario_nome}</Text>
                                        <Text style={styles.funcionarioDetails}>
                                            {func.funcionario_cargo_nome} • Mat: {func.funcionario_matricula}
                                        </Text>
                                    </View>
                                    {func.assinatura ? (
                                        <View style={styles.signatureWrapper}>
                                            <Text style={styles.signatureLabel}>Assinatura:</Text>
                                            <View style={styles.signatureContainer}>
                                                <Image
                                                    source={{ uri: func.assinatura }}
                                                    style={styles.signatureImage}
                                                    resizeMode="contain"
                                                />
                                            </View>
                                        </View>
                                    ) : (
                                        <View style={styles.pendingSignature}>
                                            <Chip icon="clock-outline" style={styles.pendingChip} textStyle={styles.chipTextSmall}>
                                                Assinatura não coletada
                                            </Chip>
                                        </View>
                                    )}
                                    {index < funcionarios.length - 1 && <Divider style={styles.itemDivider} />}
                                </View>
                            ))}
                        </Surface>
                    )}

                    {/* Riscos Section */}
                    {riscos.length > 0 && (
                        <Surface style={styles.section} elevation={1}>
                            <View style={styles.sectionHeader}>
                                <IconButton icon="alert-circle-outline" size={20} iconColor={colors.primary} style={styles.sectionIcon} />
                                <Text style={styles.sectionTitle}>Riscos Identificados ({riscos.length})</Text>
                            </View>
                            <Divider style={styles.divider} />

                            {riscos.map((risco, index) => {
                                const riscoControles = getControlesByRiscoId(risco.id);
                                return (
                                    <View key={risco.id} style={styles.riscoItem}>
                                        <View style={styles.riscoHeader}>
                                            <View style={styles.riscoIndicator} />
                                            <Text style={styles.riscoNome}>{risco.nome}</Text>
                                        </View>

                                        {riscoControles.length > 0 && (
                                            <View style={styles.controlesContainer}>
                                                <Text style={styles.controlesLabel}>Medidas de controle:</Text>
                                                {riscoControles.map((controle) => (
                                                    <View key={controle.id} style={styles.controleItem}>
                                                        <Text style={styles.controleBullet}>•</Text>
                                                        <Text style={styles.controleNome}>{controle.nome}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        )}

                                        {index < riscos.length - 1 && <Divider style={styles.itemDivider} />}
                                    </View>
                                );
                            })}
                        </Surface>
                    )}

                    {/* Checklist Items Section */}
                    <Surface style={styles.section} elevation={1}>
                        <View style={styles.sectionHeader}>
                            <IconButton icon="clipboard-list" size={20} iconColor={colors.primary} style={styles.sectionIcon} />
                            <Text style={styles.sectionTitle}>Itens do Checklist</Text>
                        </View>
                        <Divider style={styles.divider} />

                        {Object.entries(groupedItems).map(([groupName, groupItems]) => (
                            <View key={groupName} style={styles.itemGroup}>
                                <View style={styles.groupHeader}>
                                    <Text style={styles.groupTitle}>{groupName}</Text>
                                    <Chip style={styles.groupCountChip} textStyle={styles.groupCountText}>
                                        {groupItems.length}
                                    </Chip>
                                </View>

                                {groupItems.map((item, index) => (
                                    <View key={item.id} style={styles.checklistItem}>
                                        <View style={styles.itemHeader}>
                                            <View style={[
                                                styles.itemStatusIndicator,
                                                { backgroundColor: item.is_inconforme ? colors.error : (item.is_respondido ? colors.success : colors.textMuted) }
                                            ]} />
                                            <Text style={styles.itemName}>{item.checklist_item_nome}</Text>
                                        </View>

                                        <View style={styles.itemContent}>
                                            {item.resposta ? (
                                                <View style={styles.respostaContainer}>
                                                    <Text style={styles.respostaLabel}>Resposta:</Text>
                                                    <Text style={[
                                                        styles.respostaValue,
                                                        item.is_inconforme && styles.respostaInconforme
                                                    ]}>
                                                        {item.resposta}
                                                    </Text>
                                                </View>
                                            ) : (
                                                <Text style={styles.semResposta}>Sem resposta</Text>
                                            )}

                                            {item.descricao && (
                                                <View style={styles.descricaoContainer}>
                                                    <Text style={styles.descricaoLabel}>Descrição:</Text>
                                                    <Text style={styles.descricaoText}>{item.descricao}</Text>
                                                </View>
                                            )}

                                            {item.inconformidade_funcionarios_array && item.inconformidade_funcionarios_array.length > 0 && (
                                                <View style={styles.funcionariosInconformeContainer}>
                                                    <Text style={styles.funcionariosInconformeLabel}>
                                                        Colaboradores envolvidos:
                                                    </Text>
                                                    <Text style={styles.funcionariosInconformeText}>
                                                        {item.inconformidade_funcionarios_array
                                                            .map(cpf => {
                                                                const func = funcionarios.find(f => f.funcionario_cpf === cpf);
                                                                return func?.funcionario_nome || cpf;
                                                            })
                                                            .join(', ')}
                                                    </Text>
                                                </View>
                                            )}

                                            {item.foto_path && (
                                                <View style={styles.fotoContainer}>
                                                    <Text style={styles.fotoLabel}>Foto anexada:</Text>
                                                    <Image
                                                        source={{ uri: item.foto_path }}
                                                        style={styles.fotoPreview}
                                                        resizeMode="cover"
                                                    />
                                                </View>
                                            )}
                                        </View>

                                        {index < groupItems.length - 1 && <Divider style={styles.itemDivider} />}
                                    </View>
                                ))}
                            </View>
                        ))}
                    </Surface>

                    <View style={styles.bottomSpacer} />
                </ScrollView>
            </View>
        </ProtectedRoute>
    );
}

const InfoRow = ({ label, value, colors }: { label: string; value?: string; colors: ThemeColors }) => (
    <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 4,
    }}>
        <Text style={{ fontSize: 14, color: colors.textSecondary, flex: 1 }}>{label}</Text>
        <Text style={{ fontSize: 14, fontWeight: '500', color: colors.text, flex: 1.5, textAlign: 'right' }}>
            {value || '-'}
        </Text>
    </View>
);

const createStyles = (colors: ThemeColors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    centerContent: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        color: colors.textSecondary,
    },
    errorText: {
        color: colors.error,
        fontSize: 16,
    },
    scrollView: {
        flex: 1,
    },
    statusHeader: {
        margin: 16,
        marginBottom: 8,
        padding: 16,
        borderRadius: 16,
        backgroundColor: colors.surface,
    },
    statusRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    statusChip: {
        height: 28,
    },
    statusChipText: {
        color: colors.textOnPrimary,
        fontSize: 12,
        fontWeight: '600',
    },
    checklistTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 4,
    },
    checklistSubtitle: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    statsContainer: {
        flexDirection: 'row',
        marginHorizontal: 16,
        marginBottom: 8,
        padding: 16,
        borderRadius: 12,
        backgroundColor: colors.surface,
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text,
    },
    statLabel: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 4,
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: colors.border,
    },
    section: {
        margin: 16,
        marginTop: 8,
        marginBottom: 8,
        borderRadius: 16,
        backgroundColor: colors.surface,
        overflow: 'hidden',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingTop: 8,
        paddingBottom: 4,
    },
    sectionIcon: {
        margin: 0,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
    },
    divider: {
        marginHorizontal: 16,
        marginBottom: 8,
    },
    observacaoContainer: {
        marginTop: 8,
        padding: 12,
        backgroundColor: colors.surfaceVariant,
        borderRadius: 8,
        marginHorizontal: 4,
    },
    observacaoLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textSecondary,
        marginBottom: 4,
    },
    observacaoText: {
        fontSize: 14,
        color: colors.text,
        lineHeight: 20,
    },
    coordsContainer: {
        marginTop: 8,
        padding: 12,
        backgroundColor: colors.surfaceVariant,
        borderRadius: 8,
        marginHorizontal: 4,
        flexDirection: 'row',
        alignItems: 'center',
    },
    coordsLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textSecondary,
        marginRight: 8,
    },
    coordsText: {
        fontSize: 12,
        color: colors.text,
        fontFamily: 'monospace',
    },
    funcionarioItem: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    funcionarioInfo: {
        marginBottom: 8,
    },
    funcionarioNome: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
    },
    funcionarioDetails: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 2,
    },
    signatureWrapper: {
        marginTop: 4,
    },
    signatureLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: colors.textSecondary,
        marginBottom: 6,
    },
    signatureContainer: {
        width: '100%',
        height: 60,
        backgroundColor: colors.surfaceVariant,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    signatureImage: {
        width: '100%',
        height: '100%',
    },
    pendingSignature: {
        marginTop: 8,
        alignItems: 'flex-start',
    },
    pendingChip: {
        backgroundColor: colors.warning,
        height: 34,
    },
    chipTextSmall: {
        fontSize: 11,
        color: colors.textOnPrimary,
    },
    itemDivider: {
        marginTop: 8,
    },
    itemGroup: {
        marginBottom: 8,
    },
    groupHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: colors.surfaceVariant,
    },
    groupTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.primary,
    },
    groupCountChip: {
        backgroundColor: colors.primary,
        height: 34,
    },
    groupCountText: {
        fontSize: 11,
        color: colors.textOnPrimary,
    },
    checklistItem: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    itemHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    itemStatusIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginTop: 6,
        marginRight: 10,
    },
    itemName: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
        color: colors.text,
        lineHeight: 20,
    },
    itemContent: {
        marginLeft: 18,
        marginTop: 8,
    },
    respostaContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    respostaLabel: {
        fontSize: 12,
        color: colors.textSecondary,
        marginRight: 8,
    },
    respostaValue: {
        fontSize: 14,
        color: colors.text,
        fontWeight: '500',
        flex: 1,
    },
    respostaInconforme: {
        color: colors.error,
    },
    semResposta: {
        fontSize: 12,
        color: colors.textMuted,
        fontStyle: 'italic',
    },
    descricaoContainer: {
        marginTop: 8,
        padding: 8,
        backgroundColor: colors.surfaceVariant,
        borderRadius: 6,
    },
    descricaoLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: colors.textSecondary,
        marginBottom: 4,
    },
    descricaoText: {
        fontSize: 13,
        color: colors.text,
        lineHeight: 18,
    },
    funcionariosInconformeContainer: {
        marginTop: 8,
        padding: 8,
        backgroundColor: '#FFEBEE',
        borderRadius: 6,
        borderLeftWidth: 3,
        borderLeftColor: colors.error,
    },
    funcionariosInconformeLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: colors.error,
        marginBottom: 4,
    },
    funcionariosInconformeText: {
        fontSize: 12,
        color: colors.text,
    },
    fotoContainer: {
        marginTop: 8,
    },
    fotoLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: colors.textSecondary,
        marginBottom: 8,
    },
    fotoPreview: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        backgroundColor: colors.surfaceVariant,
    },
    riscoItem: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    riscoHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    riscoIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginTop: 6,
        marginRight: 10,
        backgroundColor: colors.warning,
    },
    riscoNome: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
        color: colors.text,
        lineHeight: 20,
    },
    controlesContainer: {
        marginLeft: 18,
        marginTop: 8,
        padding: 10,
        backgroundColor: colors.surfaceVariant,
        borderRadius: 6,
    },
    controlesLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textSecondary,
        marginBottom: 6,
    },
    controleItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 4,
    },
    controleBullet: {
        fontSize: 14,
        color: colors.primary,
        marginRight: 6,
        lineHeight: 18,
    },
    controleNome: {
        flex: 1,
        fontSize: 13,
        color: colors.text,
        lineHeight: 18,
    },
    bottomSpacer: {
        height: 32,
    },
});

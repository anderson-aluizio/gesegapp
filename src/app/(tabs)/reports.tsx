import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import { Text, Card, IconButton, SegmentedButtons } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
    fetchReportsData,
    TimeFilter,
    ReportsData,
} from '@/services/api/reportsService';
import { useDialog } from '@/hooks/useDialog';
import InfoDialog from '@/components/ui/dialogs/InfoDialog';
import { useTheme, ThemeColors } from '@/contexts/ThemeContext';

const { width } = Dimensions.get('window');

type StatCardData = {
    title: string;
    value: string;
    subtitle: string;
    icon: string;
    colors: [string, string];
    top?: {
        value: string;
        isPositive: boolean;
    };
};

export default function ReportsScreen() {
    const router = useRouter();
    const dialog = useDialog();
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    const [timeFilter, setTimeFilter] = useState<TimeFilter>('week');
    const [reportsData, setReportsData] = useState<ReportsData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        loadReportsData();
    }, [timeFilter]);

    const loadReportsData = async () => {
        setLoading(true);
        try {
            const response = await fetchReportsData(timeFilter);
            setReportsData(response);
        } catch (error) {
            console.error('Error loading reports:', error);
            dialog.show('❌ Erro', 'Ocorreu um erro ao carregar os relatórios. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const getStatsData = (): StatCardData[] => {
        if (!reportsData) return [];

        const { summary } = reportsData;
        const periodLabels = {
            week: 'Esta semana',
            month: 'Este mês'
        };

        return [
            {
                title: 'Checklists Finalizados',
                value: summary.total_checklists.toLocaleString('pt-BR'),
                subtitle: periodLabels[timeFilter],
                icon: 'clipboard-check',
                colors: ['#667eea', '#764ba2'] as [string, string],
                top: {
                    value: summary.top.total_checklists_value,
                    isPositive: summary.top.total_checklists_percentage > 0
                }
            },
            {
                title: 'Média Diária',
                value: summary.daily_average.toFixed(1),
                subtitle: 'Checklists/dia',
                icon: 'calendar-today',
                colors: ['#4facfe', '#00f2fe'] as [string, string],
                top: {
                    value: summary.top.daily_average_value,
                    isPositive: summary.top.daily_average_percentage > 0
                }
            },
        ];
    };

    const weeklyTopData = reportsData?.weekly_top.map(item => {
        // Extract day number from date (e.g., "2025-11-13" -> "13")
        const dayNumber = item.date.split('-')[2];

        // For month view, show "day + weekday" (e.g., "13 Seg")
        // For week view, show just weekday (e.g., "Seg")
        const label = timeFilter === 'month'
            ? `${dayNumber} ${item.day_of_week}`
            : item.day_of_week;

        return {
            day: label,
            count: item.count
        };
    }) || [];

    const categoryData = reportsData?.categories.map(cat => ({
        name: cat.name,
        count: cat.count,
        percentage: Math.round(cat.percentage),
        color: cat.color
    })) || [];

    const maxCount = weeklyTopData.length > 0 ? Math.max(...weeklyTopData.map(d => d.count)) : 1;

    const statsData = getStatsData();

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.headerContainer}>
                <View style={styles.headerTop}>
                    <IconButton
                        icon="arrow-left"
                        iconColor={colors.textOnPrimary}
                        size={24}
                        onPress={() => router.back()}
                        style={styles.backButton}
                    />
                    <Text style={styles.headerTitle}>Relatórios e Análises</Text>
                    <View style={styles.headerSpacer} />
                </View>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primaryDark} />
                    <Text style={styles.loadingText}>Carregando relatórios...</Text>
                </View>
            ) : (
                <ScrollView
                    style={styles.scrollContainer}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <Card style={styles.filterCard}>
                        <Card.Content>
                            <SegmentedButtons
                                value={timeFilter}
                                onValueChange={(value) => setTimeFilter(value as TimeFilter)}
                                buttons={[
                                    { value: 'week', label: 'Semana' },
                                    { value: 'month', label: 'Mês' },
                                ]}
                            />
                        </Card.Content>
                    </Card>

                    <View style={styles.statsGrid}>
                        {statsData.map((stat, index) => (
                            <View key={index} style={styles.statCardWrapper}>
                                <LinearGradient
                                    colors={stat.colors}
                                    style={styles.statCard}
                                >
                                    <View style={styles.statCardHeader}>
                                        <IconButton
                                            icon={stat.icon}
                                            iconColor="#fff"
                                            size={24}
                                            style={styles.statIcon}
                                        />
                                        {stat.top && (
                                            <View style={styles.topBadge}>
                                                <Text style={styles.topText}>
                                                    {stat.top.value}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text style={styles.statValue}>{stat.value}</Text>
                                    <Text style={styles.statTitle}>{stat.title}</Text>
                                    <Text style={styles.statSubtitle}>{stat.subtitle}</Text>
                                </LinearGradient>
                            </View>
                        ))}
                    </View>

                    <Card style={styles.card}>
                        <Card.Content>
                            <View style={styles.cardHeader}>
                                <IconButton icon="chart-bar" size={24} iconColor={colors.primaryDark} />
                                <Text style={styles.cardTitle}>Por dias</Text>
                            </View>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={true}
                                contentContainerStyle={styles.chartScrollContent}
                            >
                                <View style={styles.chartContainer}>
                                    {weeklyTopData.map((item, index) => (
                                        <View key={index} style={styles.barWrapper}>
                                            <View style={styles.barContainer}>
                                                <View
                                                    style={[
                                                        styles.bar,
                                                        {
                                                            height: `${(item.count / maxCount) * 100}%`,
                                                        }
                                                    ]}
                                                >
                                                    <Text style={styles.barValue}>{item.count}</Text>
                                                </View>
                                            </View>
                                            <Text style={styles.barLabel}>{item.day}</Text>
                                        </View>
                                    ))}
                                </View>
                            </ScrollView>
                        </Card.Content>
                    </Card>

                    <Card style={styles.card}>
                        <Card.Title
                            title="Por Grupo"
                            left={() => <IconButton icon="shape" iconColor={colors.primaryDark} />}
                        />
                        <Card.Content>
                            {categoryData.map((category, index) => (
                                <View key={index} style={styles.categoryItem}>
                                    <View style={styles.categoryInfo}>
                                        <View
                                            style={[
                                                styles.categoryDot,
                                                { backgroundColor: category.color }
                                            ]}
                                        />
                                        <Text style={styles.categoryName}>{category.name}</Text>
                                    </View>
                                    <View style={styles.categoryStats}>
                                        <Text style={styles.categoryCount}>{category.count}</Text>
                                        <Text style={styles.categoryPercentage}>
                                            ({category.percentage}%)
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </Card.Content>
                    </Card>

                    <View style={styles.footerSpacer} />
                </ScrollView>
            )}

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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: colors.textSecondary,
    },
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 24,
    },
    filterCard: {
        marginBottom: 16,
        elevation: 2,
        backgroundColor: colors.surface,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 16,
    },
    statCardWrapper: {
        width: (width - 44) / 2,
    },
    statCard: {
        borderRadius: 16,
        padding: 16,
        minHeight: 140,
        elevation: 3,
    },
    statCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    statIcon: {
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        margin: 0,
    },
    topBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    topText: {
        color: colors.textOnPrimary,
        fontSize: 11,
        fontWeight: '600',
    },
    statValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: colors.textOnPrimary,
        marginBottom: 4,
    },
    statTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textOnPrimary,
        marginBottom: 2,
    },
    statSubtitle: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    card: {
        marginBottom: 16,
        elevation: 2,
        backgroundColor: colors.surface,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text,
        marginLeft: 8,
    },
    chartScrollContent: {
        paddingRight: 16,
    },
    chartContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        height: 180,
        paddingVertical: 16,
        minWidth: '100%',
    },
    barWrapper: {
        width: 30,
        alignItems: 'center',
        marginHorizontal: 4,
    },
    barContainer: {
        flex: 1,
        width: '100%',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    bar: {
        width: '100%',
        backgroundColor: colors.primaryDark,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingTop: 4,
        minHeight: 30,
    },
    barValue: {
        color: colors.textOnPrimary,
        fontSize: 12,
        fontWeight: '600',
    },
    barLabel: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 8,
        fontWeight: '500',
    },
    categoryItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    categoryInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    categoryDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 12,
    },
    categoryName: {
        fontSize: 14,
        color: colors.text,
        flex: 1,
    },
    categoryStats: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    categoryCount: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
    },
    categoryPercentage: {
        fontSize: 13,
        color: colors.textSecondary,
    },
    performerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    performerRank: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.primaryDark,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    rankNumber: {
        color: colors.textOnPrimary,
        fontSize: 14,
        fontWeight: 'bold',
    },
    performerInfo: {
        flex: 1,
    },
    performerName: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 4,
    },
    performerStats: {
        flexDirection: 'row',
        gap: 4,
    },
    performerCount: {
        fontSize: 13,
        color: colors.textSecondary,
    },
    performerCompletion: {
        fontSize: 13,
        color: colors.success,
        fontWeight: '500',
    },
    infoCard: {
        backgroundColor: colors.surfaceVariant,
        elevation: 1,
    },
    infoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.primaryDark,
        marginLeft: 4,
    },
    infoText: {
        fontSize: 14,
        color: colors.textSecondary,
        lineHeight: 20,
    },
    footerSpacer: {
        height: 20,
    },
});

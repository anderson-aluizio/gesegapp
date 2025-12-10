import { memo, useMemo } from 'react';
import { StyleSheet, View, Pressable, LayoutAnimation } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme, ThemeColors } from '@/contexts/ThemeContext';

interface CollapsibleSectionProps {
    title: string;
    answeredCount: number;
    totalCount: number;
    children: React.ReactNode;
    isExpanded: boolean;
    onToggle: () => void;
}

const CollapsibleSection = memo(({
    title,
    answeredCount,
    totalCount,
    children,
    isExpanded,
    onToggle
}: CollapsibleSectionProps) => {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    const isComplete = answeredCount === totalCount && totalCount > 0;
    const progressPercentage = totalCount > 0 ? (answeredCount / totalCount) * 100 : 0;

    const toggleExpanded = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        onToggle();
    };

    return (
        <View style={styles.container}>
            <Pressable
                onPress={toggleExpanded}
                style={({ pressed }) => [
                    styles.header,
                    isComplete && styles.headerComplete,
                    pressed && styles.headerPressed
                ]}
            >
                <View style={styles.headerLeft}>
                    <MaterialIcons
                        name={isExpanded ? 'keyboard-arrow-down' : 'keyboard-arrow-right'}
                        size={24}
                        color={isComplete ? colors.success : colors.text}
                    />
                    <View style={styles.titleContainer}>
                        <Text style={[styles.title, isComplete && styles.titleComplete]} numberOfLines={2}>
                            {title}
                        </Text>
                        <View style={styles.progressContainer}>
                            <View style={styles.progressBarBackground}>
                                <View
                                    style={[
                                        styles.progressBarFill,
                                        {
                                            width: `${progressPercentage}%`,
                                            backgroundColor: isComplete ? colors.success : colors.primary
                                        }
                                    ]}
                                />
                            </View>
                            <Text style={[styles.progressText, isComplete && styles.progressTextComplete]}>
                                {answeredCount}/{totalCount}
                            </Text>
                        </View>
                    </View>
                </View>
                {isComplete && (
                    <MaterialIcons name="check-circle" size={20} color={colors.success} />
                )}
            </Pressable>
            {isExpanded && (
                <View style={styles.content}>
                    {children}
                </View>
            )}
        </View>
    );
});

CollapsibleSection.displayName = 'CollapsibleSection';

const createStyles = (colors: ThemeColors) => StyleSheet.create({
    container: {
        marginBottom: 12,
        borderRadius: 12,
        backgroundColor: colors.cardBackground,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        overflow: 'hidden',
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        backgroundColor: colors.surfaceVariant,
    },
    headerComplete: {
        backgroundColor: colors.successLight,
    },
    headerPressed: {
        opacity: 0.8,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    titleContainer: {
        flex: 1,
        marginLeft: 8,
    },
    title: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.text,
    },
    titleComplete: {
        color: colors.success,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
        gap: 8,
    },
    progressBarBackground: {
        flex: 1,
        height: 6,
        backgroundColor: colors.border,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    progressText: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textSecondary,
        minWidth: 40,
        textAlign: 'right',
    },
    progressTextComplete: {
        color: colors.success,
    },
    content: {
        padding: 12,
        paddingTop: 8,
    },
});

export default CollapsibleSection;

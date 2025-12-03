import { useMemo } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { useTheme, ThemeColors } from '@/contexts/ThemeContext';

interface SyncHeaderProps {
    onBack: () => void;
}

export default function SyncHeader({ onBack }: SyncHeaderProps) {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    return (
        <>
            <StatusBar barStyle="light-content" backgroundColor={colors.primaryDark} translucent={false} />
            <View style={styles.headerContainer}>
                <View style={styles.headerTop}>
                    <IconButton
                        icon="arrow-left"
                        iconColor={colors.textOnPrimary}
                        size={24}
                        onPress={onBack}
                        style={styles.backButton}
                    />
                    <Text style={styles.headerTitle}>Sincronização</Text>
                    <View style={styles.headerSpacer} />
                </View>
            </View>
        </>
    );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
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
});

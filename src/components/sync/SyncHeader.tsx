import { View, StyleSheet, StatusBar } from 'react-native';
import { Text, IconButton } from 'react-native-paper';

interface SyncHeaderProps {
    onBack: () => void;
}

export default function SyncHeader({ onBack }: SyncHeaderProps) {
    return (
        <>
            <StatusBar barStyle="light-content" backgroundColor="#667eea" translucent={false} />
            <View style={styles.headerContainer}>
                <View style={styles.headerTop}>
                    <IconButton
                        icon="arrow-left"
                        iconColor="#fff"
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

const styles = StyleSheet.create({
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

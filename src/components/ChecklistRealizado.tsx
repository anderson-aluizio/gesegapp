import { Pressable, PressableProps, StyleSheet, Text, View } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { ChecklistRealizadoDatabase } from "@/database/Models/useChecklisRealizadoDatabase"

type Props = PressableProps & {
    data: ChecklistRealizadoDatabase
    onOpen: () => void
    onLongPress?: () => void
}

export function ChecklistRealizado({ data, onOpen, onLongPress, ...rest }: Props) {
    const isFinalizado = data.is_finalizado
    const statusColor = isFinalizado ? "#27ae60" : "#2980ef"
    const statusText = isFinalizado ? "Finalizado" : "Em andamento"

    return (
        <Pressable
            style={({ pressed }) => [
                styles.card,
                { borderLeftColor: statusColor, opacity: pressed ? 0.92 : 1 }
            ]}
            onPress={onOpen}
            onLongPress={onLongPress}
            android_ripple={{ color: "#e0e7ef" }}
            {...rest}
        >
            <View style={styles.headerRow}>
                <Text style={styles.titleCard}>
                    {String(data.checklist_grupo_nome)}
                </Text>
                <MaterialIcons name="chevron-right" size={28} color="#b0b0b0" />
            </View>
            <View style={styles.cardContainer}>
                <View style={styles.cardRow}>
                    <MaterialIcons name="group" size={18} color="#7f8c8d" style={{ marginRight: 4 }} />
                    <Text style={styles.cardLabel}>Equipe:</Text>
                    <Text style={styles.cardValue} numberOfLines={1} ellipsizeMode="tail">
                        {String(data.equipe_nome)}
                    </Text>
                </View>
                <View style={styles.cardRow}>
                    <MaterialIcons name="directions-car" size={18} color="#7f8c8d" style={{ marginRight: 4 }} />
                    <Text style={styles.cardLabel}>Veículo:</Text>
                    <Text style={styles.cardValue} numberOfLines={1} ellipsizeMode="tail">
                        {String(data.veiculo_id)}
                    </Text>
                </View>
            </View>
            <View style={styles.cardFooter}>
                <View style={[styles.statusBadge, { backgroundColor: statusColor + "22", borderColor: statusColor }]}>
                    <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.dateText}>
                        {new Date(data.date).toLocaleDateString('pt-BR', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </Text>
                </View>
            </View>
        </Pressable>
    )
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'column',
        borderWidth: 1,
        borderLeftWidth: 5,
        borderTopColor: '#e6e8ec',
        borderBottomColor: '#e6e8ec',
        borderRightColor: '#e6e8ec',
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 10,
        marginBottom: 14,
        marginHorizontal: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 2,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    titleCard: {
        fontWeight: '700',
        fontSize: 18,
        color: "#222",
        flex: 1,
        flexWrap: "wrap",
    },
    cardContainer: {
        flexDirection: 'column',
        gap: 6,
        marginBottom: 2,
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        minHeight: 20,
    },
    cardLabel: {
        fontSize: 14,
        color: '#6c7a89',
        marginRight: 2,
    },
    cardValue: {
        fontWeight: '600',
        fontSize: 15,
        color: '#222',
        marginLeft: 2,
        flex: 1,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 6,
    },
    statusBadge: {
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 10,
        paddingVertical: 2,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 90,
    },
    statusText: {
        fontWeight: '600',
        fontSize: 13,
        letterSpacing: 0.2,
    },
    dateText: {
        fontSize: 13,
        color: "#7f8c8d",
        fontWeight: "500",
    },
    timeAgoText: {
        fontSize: 12,
        color: "#b0b0b0",
        fontStyle: "italic",
        marginTop: 2,
    },
})
import { useEquipeTurnoDatabase } from "@/database/Models/useEquipeTurnoDatabase";
import { useEquipeTurnoFuncionarioDatabase } from "@/database/Models/useEquipeTurnoFuncionarioDatabase";
import { apiClientWrapper } from "@/services";
import { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { Button, Surface, Text } from "react-native-paper";

const SendEquipeTurno = () => {
    const turnoDb = useEquipeTurnoDatabase();
    const turnoFuncionarioDb = useEquipeTurnoFuncionarioDatabase();
    const [loading, setLoading] = useState(false);

    const handleSendTurnos = async () => {
        setLoading(true);
        try {
            const turnos = await turnoDb.getFinalizados();
            if (turnos.length === 0) {
                Alert.alert(
                    "Nenhum Registro",
                    "Não há turnos finalizados para enviar.",
                    [{ text: "OK" }]
                );
                return;
            }

            let successCount = 0;
            let errorCount = 0;

            for (const turno of turnos) {
                try {
                    const funcionarios = await turnoFuncionarioDb.getByEquipeTurnoId(turno.id);
                    const turnoData = { ...turno, funcionarios };

                    await apiClientWrapper.post('/store-equipe-turno', turnoData);
                    await turnoDb.remove(turno.id);
                    successCount++;
                } catch (error) {
                    console.error(`Erro ao enviar turno ${turno.id}:`, error);
                    errorCount++;
                }
            }

            if (errorCount === 0) {
                Alert.alert(
                    "Turnos Enviados",
                    `${successCount} turno(s) enviado(s) com sucesso!`,
                    [{ text: "OK" }]
                );
            } else {
                Alert.alert(
                    "Envio Parcial",
                    `${successCount} turno(s) enviado(s) com sucesso.\n${errorCount} turno(s) com erro.`,
                    [{ text: "OK" }]
                );
            }
        } catch (error) {
            Alert.alert(
                "Erro ao enviar",
                "Ocorreu um erro ao enviar os turnos finalizados. Por favor, tente novamente.",
                [{ text: "OK" }]
            );
            console.error("Erro ao enviar turnos:", error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Surface style={styles.infoCard} elevation={2}>
            <View style={styles.infoHeader}>
                <Text variant="titleMedium" style={styles.infoTitle}>
                    Enviar Turnos Finalizados
                </Text>
            </View>
            <Text variant="bodySmall" style={styles.infoDescription}>
                Envie os turnos de equipe finalizados para o servidor.
            </Text>
            <Button
                mode="contained"
                icon="send"
                onPress={handleSendTurnos}
                style={{ marginTop: 10 }}
                buttonColor="#0439c9"
                disabled={loading}
                loading={loading}
            >
                Enviar Turnos
            </Button>
        </Surface>
    );
}
export default SendEquipeTurno;

const styles = StyleSheet.create({
    infoCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 10,
        marginBottom: 14,
    },
    infoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    infoTitle: {
        fontWeight: '700',
        color: "#222",
        flex: 1,
        flexWrap: "wrap",
    },
    infoDescription: {
        color: '#6c7a89',
        marginRight: 2,
        flex: 1,
        flexWrap: "wrap",
    },
});

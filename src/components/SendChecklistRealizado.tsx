import { useChecklisRealizadoDatabase } from "@/database/Models/useChecklisRealizadoDatabase";
import { useChecklisRealizadoItemsDatabase } from "@/database/Models/useChecklisRealizadoItemsDatabase";
import { useChecklistRealizadoFuncionarioDatabase } from "@/database/Models/useChecklistRealizadoFuncionarioDatabase";
import { apiClientWrapper } from "@/services";
import { getErrorMessage } from "@/services/api/apiErrors";
import { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { Button, Surface, Text } from "react-native-paper";

const SendChecklistRealizado = () => {
    const checklistDb = useChecklisRealizadoDatabase();
    const checklistFuncionarios = useChecklistRealizadoFuncionarioDatabase();
    const checklistItemsDb = useChecklisRealizadoItemsDatabase();
    const [loading, setLoading] = useState(false);

    const handleSendChecklist = async () => {
        setLoading(true);
        try {
            const checklists = await checklistDb.getFinalizados();
            if (checklists.length === 0) {
                Alert.alert(
                    "Nenhum Registro",
                    "Não há registros finalizados para enviar.",
                    [{ text: "OK" }]
                );
                return;
            }

            let successCount = 0;
            let errorCount = 0;
            const errorDetails: string[] = [];

            for (const checklist of checklists) {
                try {
                    const funcionarios = await checklistFuncionarios.getByChecklistRealizadoId(checklist.id);
                    const items = await checklistItemsDb.getByChecklistRealizadoId(checklist.id);
                    const checklistData = { ...checklist, funcionarios, items };

                    await apiClientWrapper.post('/store-checklist-realizado', checklistData);
                    await checklistDb.remove(checklist.id);
                    successCount++;
                } catch (error) {
                    errorCount++;
                    const errorMessage = getErrorMessage(error);
                    errorDetails.push(`Checklist ID ${checklist.id}: ${errorMessage}`);
                }
            }

            if (errorCount === 0) {
                Alert.alert(
                    "Registros Enviados",
                    `${successCount} registro(s) enviado(s) com sucesso!`,
                    [{ text: "OK" }]
                );
            } else {
                const errorList = errorDetails.join('\n\n');
                Alert.alert(
                    "Envio Parcial",
                    `${successCount} registro(s) enviado(s) com sucesso.\n${errorCount} registro(s) com erro.\n\nDetalhes dos erros:\n${errorList}`,
                    [{ text: "OK" }]
                );
            }
        } catch (error) {
            Alert.alert(
                "Erro ao enviar",
                "Ocorreu um erro ao enviar os registros finalizados. Por favor, tente novamente.",
                [{ text: "OK" }]
            );
            console.error("Erro ao enviar checklists:", error);
        } finally {
            setLoading(false);
        }
    }
    return (
        <Surface style={styles.infoCard} elevation={2}>
            <View style={styles.infoHeader}>
                <Text variant="titleMedium" style={styles.infoTitle}>
                    Enviar Registros Finalizados
                </Text>
            </View>
            <Text variant="bodySmall" style={styles.infoDescription}>
                Envie os registros realizados finalizados para o servidor.
            </Text>
            <Button
                mode="contained"
                icon="send"
                onPress={handleSendChecklist}
                style={{ marginTop: 10 }}
                buttonColor="#0439c9"
                disabled={loading}
                loading={loading}
            >
                Enviar
            </Button>
        </Surface>
    );
}
export default SendChecklistRealizado;

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
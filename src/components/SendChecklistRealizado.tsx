import { useChecklisRealizadoDatabase } from "@/database/Models/useChecklisRealizadoDatabase";
import { useChecklisRealizadoItemsDatabase } from "@/database/Models/useChecklisRealizadoItemsDatabase";
import { useChecklistRealizadoFuncionarioDatabase } from "@/database/Models/useChecklistRealizadoFuncionarioDatabase";
import { apiClientWrapper } from "@/services";
import { getErrorMessage } from "@/services/api/apiErrors";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Surface, Text } from "react-native-paper";
import InfoDialog from "@/components/InfoDialog";
import { checkNetworkConnection } from "@/hooks";

const SendChecklistRealizado = () => {
    const checklistDb = useChecklisRealizadoDatabase();
    const checklistFuncionarios = useChecklistRealizadoFuncionarioDatabase();
    const checklistItemsDb = useChecklisRealizadoItemsDatabase();
    const [loading, setLoading] = useState(false);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [dialogMessage, setDialogMessage] = useState('');

    const showDialog = (message: string) => {
        setDialogMessage(message);
        setDialogVisible(true);
    };

    const hideDialog = () => {
        setDialogVisible(false);
    };

    const handleSendChecklist = async () => {
        setLoading(true);
        try {
            try {
                await checkNetworkConnection();
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Erro ao verificar conexão';
                showDialog(errorMessage);
                setLoading(false);
                return;
            }

            const checklists = await checklistDb.getFinalizados();
            if (checklists.length === 0) {
                showDialog("Não há registros finalizados para enviar.");
                setLoading(false);
                return;
            }

            let successCount = 0;
            let errorCount = 0;
            const errorDetails: string[] = [];

            for (const checklist of checklists) {
                try {
                    const funcionarios = await checklistFuncionarios.getByChecklistRealizadoId(checklist.id);
                    const items = await checklistItemsDb.getByChecklistRealizadoId(checklist.id);
                    const hasPhotos = items.some(item => item.foto_path);

                    const checklistData: any = { ...checklist, funcionarios, items: [] };

                    const itemsWithPhotos = items.map(item => {
                        if (item.foto_path && item.foto_path.startsWith('file://')) {
                            return {
                                ...item,
                                foto: { uri: item.foto_path }
                            };
                        }
                        return item;
                    });

                    checklistData.items = itemsWithPhotos;

                    if (hasPhotos) {
                        await apiClientWrapper.postWithFiles('/store-checklist-realizado', checklistData);
                    } else {
                        await apiClientWrapper.post('/store-checklist-realizado', checklistData);
                    }

                    await checklistDb.remove(checklist.id);
                    successCount++;
                } catch (error) {
                    errorCount++;
                    const errorMessage = getErrorMessage(error);
                    errorDetails.push(`Checklist ID ${checklist.id}: ${errorMessage}`);
                }
            }

            if (errorCount === 0) {
                showDialog(`✅ Sucesso!\n\n${successCount} registro(s) enviado(s) com sucesso!`);
            } else {
                const errorList = errorDetails.join('\n\n');
                showDialog(
                    `⚠️ Envio Parcial\n\n` +
                    `${successCount} registro(s) enviado(s) com sucesso.\n` +
                    `${errorCount} registro(s) com erro.\n\n` +
                    `Detalhes dos erros:\n${errorList}`
                );
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            showDialog(
                `❌ Erro ao enviar\n\n` +
                `Ocorreu um erro ao enviar os registros finalizados.\n\n` +
                `Detalhes: ${errorMessage}\n\n` +
                `Por favor, tente novamente.`
            );
            console.error("Erro ao enviar checklists:", error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
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

            <InfoDialog
                visible={dialogVisible}
                description={dialogMessage}
                onDismiss={hideDialog}
            />
        </>
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

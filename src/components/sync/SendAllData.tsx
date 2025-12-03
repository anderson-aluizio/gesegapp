import { useEquipeTurnoDatabase } from "@/database/models/useEquipeTurnoDatabase";
import { useEquipeTurnoFuncionarioDatabase } from "@/database/models/useEquipeTurnoFuncionarioDatabase";
import { useChecklisRealizadoDatabase, ChecklistRealizadoDatabase } from "@/database/models/useChecklisRealizadoDatabase";
import { useChecklisRealizadoItemsDatabase, ChecklistRealizadoItemsDatabaseWithItem } from "@/database/models/useChecklisRealizadoItemsDatabase";
import { useChecklistRealizadoFuncionarioDatabase, ChecklistRealizadoFuncionarioDatabase } from "@/database/models/useChecklistRealizadoFuncionarioDatabase";
import { useChecklisRealizadoControleRiscosDatabase, ChecklistRealizadoControleRiscosDatabaseWithRelations } from '@/database/models/useChecklisRealizadoControleRiscosDatabase';
import { apiClientWrapper } from "@/services";
import { getErrorMessage } from "@/services/api/apiErrors";
import { useState, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Surface, Text } from "react-native-paper";
import InfoDialog from "@/components/ui/dialogs/InfoDialog";
import { checkNetworkConnection, useDialog } from "@/hooks";
import { useTheme, ThemeColors } from "@/contexts/ThemeContext";

type EquipeTurnoFormatted = {
    equipe_id: number;
    date: string;
    veiculo_id: string;
    funcionarios: {
        funcionario_cpf: string;
        is_lider: number;
    }[];
}

type ChecklistRealizadoItemWithPhoto = ChecklistRealizadoItemsDatabaseWithItem & {
    foto?: { uri: string };
}

type ChecklistRealizadoPayload = ChecklistRealizadoDatabase & {
    funcionarios: ChecklistRealizadoFuncionarioDatabase[];
    items: ChecklistRealizadoItemWithPhoto[];
    controle_riscos: ChecklistRealizadoControleRiscosDatabaseWithRelations[];
}

const SendAllData = () => {
    const turnoDb = useEquipeTurnoDatabase();
    const turnoFuncionarioDb = useEquipeTurnoFuncionarioDatabase();
    const checklistDb = useChecklisRealizadoDatabase();
    const checklistFuncionarios = useChecklistRealizadoFuncionarioDatabase();
    const checklistItemsDb = useChecklisRealizadoItemsDatabase();
    const realizadoControlesDb = useChecklisRealizadoControleRiscosDatabase();

    const [loading, setLoading] = useState(false);
    const dialog = useDialog();
    const { colors } = useTheme();

    const styles = useMemo(() => createStyles(colors), [colors]);

    const handleSendTurnos = async () => {
        const turnos = await turnoDb.getAll();
        if (turnos.length === 0) {
            return { success: 0, error: 0, errorDetails: [] };
        }

        let successCount = 0;
        let errorCount = 0;
        const errorDetails: string[] = [];

        for (const turno of turnos) {
            try {
                const funcionarios = await turnoFuncionarioDb.getByEquipeTurnoId(turno.id);
                const turnoData: EquipeTurnoFormatted = {
                    equipe_id: turno.equipe_id,
                    date: turno.date,
                    veiculo_id: turno.veiculo_id,
                    funcionarios: funcionarios.map(func => ({
                        funcionario_cpf: func.funcionario_cpf,
                        is_lider: func.is_lider,
                    })),
                };

                await apiClientWrapper.post('/store-equipe-turno', turnoData);
                await turnoDb.remove(turno.id);
                successCount++;
            } catch (error) {
                errorCount++;
                const errorMessage = getErrorMessage(error);
                errorDetails.push(`Turno ID ${turno.id}: ${errorMessage}`);
            }
        }

        return { success: successCount, error: errorCount, errorDetails };
    };

    const handleSendChecklists = async () => {
        const checklists = await checklistDb.getFinalizados();
        if (checklists.length === 0) {
            return { success: 0, error: 0, errorDetails: [] };
        }

        let successCount = 0;
        let errorCount = 0;
        const errorDetails: string[] = [];

        for (const checklist of checklists) {
            try {
                const funcionarios = await checklistFuncionarios.getByChecklistRealizadoId(checklist.id);
                const items = await checklistItemsDb.getByChecklistRealizadoId(checklist.id);
                const hasPhotos = items.some(item => item.foto_path);
                const controle_riscos = await realizadoControlesDb.getByChecklistRealizadoId(checklist.id);

                const itemsWithPhotos: ChecklistRealizadoItemWithPhoto[] = items.map(item => {
                    if (item.foto_path && item.foto_path.startsWith('file://')) {
                        return {
                            ...item,
                            foto: { uri: item.foto_path }
                        };
                    }
                    return item;
                });

                const checklistData: ChecklistRealizadoPayload = {
                    ...checklist,
                    funcionarios,
                    items: itemsWithPhotos,
                    controle_riscos
                };

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

        return { success: successCount, error: errorCount, errorDetails };
    };

    const handleSendAllData = async () => {
        setLoading(true);
        try {
            try {
                await checkNetworkConnection();
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Erro ao verificar conexão';
                dialog.show('❌ Erro', errorMessage);
                setLoading(false);
                return;
            }

            const turnoResults = await handleSendTurnos();

            const checklistResults = await handleSendChecklists();

            const totalSuccess = turnoResults.success + checklistResults.success;
            const totalErrors = turnoResults.error + checklistResults.error;
            const allErrorDetails = [
                ...turnoResults.errorDetails.map(e => `[Turno] ${e}`),
                ...checklistResults.errorDetails.map(e => `[Checklist] ${e}`)
            ];

            if (totalSuccess === 0 && totalErrors === 0) {
                dialog.show('ℹ️ Informação', "Não há dados finalizados para enviar.");
                setLoading(false);
                return;
            }

            if (totalErrors === 0) {
                const turnoMsg = turnoResults.success > 0 ? `${turnoResults.success} turno(s)` : '';
                const checklistMsg = checklistResults.success > 0 ? `${checklistResults.success} checklist(s)` : '';
                const items = [turnoMsg, checklistMsg].filter(Boolean).join(' e ');
                dialog.show('✅ Sucesso', `${items} enviado(s) com sucesso!`);
            } else {
                const errorList = allErrorDetails.join('\n\n');
                const messageParts = [`⚠️ Envio ${totalSuccess > 0 ? 'Parcial' : 'com Erros'}\n`];

                if (totalSuccess > 0) {
                    messageParts.push(`✅ ${totalSuccess} registro(s) enviado(s) com sucesso.\n`);
                }

                if (totalErrors > 0) {
                    messageParts.push(`❌ ${totalErrors} registro(s) com erro.\n`);
                }

                messageParts.push(`\nDetalhes dos erros:\n${errorList}`);

                dialog.show('⚠️ Envio Parcial', messageParts.join(''));
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            dialog.show(
                '❌ Erro ao enviar',
                `Ocorreu um erro ao enviar os dados finalizados.\n\n` +
                `Detalhes: ${errorMessage}\n\n` +
                `Por favor, tente novamente.`
            );
            console.error("Erro ao enviar dados:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Surface style={styles.infoCard} elevation={2}>
                <View style={styles.infoHeader}>
                    <Text variant="titleMedium" style={styles.infoTitle}>
                        Enviar Dados Finalizados
                    </Text>
                </View>
                <Text variant="bodySmall" style={styles.infoDescription}>
                    Envie todos os turnos e checklists finalizados para o servidor.
                </Text>
                <Button
                    mode="contained"
                    icon="send"
                    onPress={handleSendAllData}
                    style={styles.sendButton}
                    buttonColor={colors.buttonPrimary}
                    textColor={colors.buttonText}
                    disabled={loading}
                    loading={loading}
                >
                    Enviar Dados
                </Button>
            </Surface>

            <InfoDialog
                visible={dialog.visible}
                description={dialog.description}
                title={dialog.title}
                onDismiss={dialog.hide}
            />
        </>
    );
};

export default SendAllData;

const createStyles = (colors: ThemeColors) => StyleSheet.create({
    infoCard: {
        backgroundColor: colors.surface,
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
        color: colors.text,
        flex: 1,
        flexWrap: "wrap",
    },
    infoDescription: {
        color: colors.textSecondary,
        marginRight: 2,
        flex: 1,
        flexWrap: "wrap",
    },
    sendButton: {
        marginTop: 10,
    },
});

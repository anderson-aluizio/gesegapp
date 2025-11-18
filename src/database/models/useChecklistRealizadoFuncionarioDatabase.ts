import { useSQLiteContext } from "expo-sqlite"

export type ChecklistRealizadoFuncionarioDatabase = {
    id: number
    checklist_realizado_id: number
    funcionario_cpf: string
    assinatura?: string
    funcionario_nome?: string
    funcionario_matricula?: string
    funcionario_cargo_nome?: string
}

export const useChecklistRealizadoFuncionarioDatabase = () => {
    const database = useSQLiteContext();
    const getByChecklistRealizadoId = async (checklistRealizadoId: number): Promise<ChecklistRealizadoFuncionarioDatabase[]> => {
        const query =
            `SELECT crf.*, f.nome AS funcionario_nome, f.matricula AS funcionario_matricula, f.cargo_nome AS funcionario_cargo_nome
            FROM checklist_realizado_funcionarios crf
            JOIN funcionarios f ON f.cpf = crf.funcionario_cpf
            WHERE crf.checklist_realizado_id = $checklistRealizadoId`;

        return await database.getAllAsync<ChecklistRealizadoFuncionarioDatabase>(query, [checklistRealizadoId]);
    }

    const create = async (checklistRealizadoId: number, funcionarioCpf: string): Promise<void> => {
        const statement = await database.prepareAsync(
            `INSERT INTO checklist_realizado_funcionarios (checklist_realizado_id, funcionario_cpf)
             VALUES ($checklistRealizadoId, $funcionarioCpf)`
        );

        try {
            await statement.executeAsync({
                $checklistRealizadoId: checklistRealizadoId,
                $funcionarioCpf: funcionarioCpf
            });
        } catch (error) {
            throw error
        } finally {
            await statement.finalizeAsync()
        }
    }

    const remove = async (id: number): Promise<void> => {
        const statement = await database.prepareAsync(
            `DELETE FROM checklist_realizado_funcionarios WHERE id = $id`
        );

        try {
            await statement.executeAsync({ $id: id });
        } catch (error) {
            throw error
        } finally {
            await statement.finalizeAsync()
        }
    }

    const removeByChecklistRealizadoId = async (checklistRealizadoId: number): Promise<void> => {
        const statement = await database.prepareAsync(
            `DELETE FROM checklist_realizado_funcionarios WHERE checklist_realizado_id = $checklistRealizadoId`
        );

        try {
            await statement.executeAsync({ $checklistRealizadoId: checklistRealizadoId });
        } catch (error) {
            throw error
        } finally {
            await statement.finalizeAsync()
        }
    }

    const updateSignature = async (id: number, assinatura: string): Promise<void> => {
        const statement = await database.prepareAsync(
            `UPDATE checklist_realizado_funcionarios
             SET assinatura = $assinatura
             WHERE id = $id`
        );

        try {
            await statement.executeAsync({
                $id: id,
                $assinatura: assinatura
            });
        } catch (error) {
            throw error
        } finally {
            await statement.finalizeAsync()
        }
    }

    return { getByChecklistRealizadoId, create, remove, removeByChecklistRealizadoId, updateSignature }
}
import { useSQLiteContext } from "expo-sqlite"

export type ChecklistRealizadoAcaoCampoDatabase = {
    id: number;
    acao_campo_id: number;
    checklist_realizado_id: number;
    quantidade: number;
}

export type ChecklistRealizadoAcaoCampoDatabaseWithRelations = ChecklistRealizadoAcaoCampoDatabase & {
    nome: string;
    codigo_descricao: string;
    valor: number;
    tipo_acao: string;
    tipo_servico_id: number;
    tipo_servico_nome?: string;
    grupo_caderno_preco_id: string;
    caderno_preco_id: string;
    centro_custo_id: string;
    processo_id: string;
}

export const useChecklistRealizadoAcaoCampoDatabase = () => {
    const database = useSQLiteContext();

    const getByChecklistRealizadoId = async (checklistRealizadoId: number) => {
        const query = `
            SELECT
                crac.*,
                ac.nome,
                ac.codigo_descricao,
                ac.valor,
                ac.tipo_acao,
                ac.tipo_servico_id,
                ac.tipo_servico_nome,
                ac.grupo_caderno_preco_id,
                ac.caderno_preco_id,
                ac.centro_custo_id,
                ac.processo_id
            FROM checklist_realizado_acao_campos AS crac
            INNER JOIN acao_campos AS ac ON crac.acao_campo_id = ac.id
            WHERE crac.checklist_realizado_id = $checklistRealizadoId
            ORDER BY ac.nome
        `;
        return await database.getAllAsync<ChecklistRealizadoAcaoCampoDatabaseWithRelations>(query, [checklistRealizadoId]);
    }

    const create = async (data: Omit<ChecklistRealizadoAcaoCampoDatabase, "id">) => {
        const statement = await database.prepareAsync(
            `INSERT INTO checklist_realizado_acao_campos
                (acao_campo_id, checklist_realizado_id, quantidade)
                VALUES ($acao_campo_id, $checklist_realizado_id, $quantidade)`
        );
        try {
            const result = await statement.executeAsync({
                $acao_campo_id: data.acao_campo_id,
                $checklist_realizado_id: data.checklist_realizado_id,
                $quantidade: data.quantidade
            });
            return result.lastInsertRowId;
        } finally {
            await statement.finalizeAsync();
        }
    }

    const update = async (id: number, quantidade: number) => {
        const statement = await database.prepareAsync(
            `UPDATE checklist_realizado_acao_campos SET quantidade = $quantidade WHERE id = $id`
        );
        try {
            await statement.executeAsync({ $id: id, $quantidade: quantidade });
        } finally {
            await statement.finalizeAsync();
        }
    }

    const remove = async (id: number) => {
        const statement = await database.prepareAsync(
            `DELETE FROM checklist_realizado_acao_campos WHERE id = $id`
        );
        try {
            await statement.executeAsync({ $id: id });
        } finally {
            await statement.finalizeAsync();
        }
    }

    const removeByChecklistRealizadoId = async (checklistRealizadoId: number) => {
        const statement = await database.prepareAsync(
            `DELETE FROM checklist_realizado_acao_campos WHERE checklist_realizado_id = $checklist_realizado_id`
        );
        try {
            await statement.executeAsync({ $checklist_realizado_id: checklistRealizadoId });
        } finally {
            await statement.finalizeAsync();
        }
    }

    return {
        getByChecklistRealizadoId,
        create,
        update,
        remove,
        removeByChecklistRealizadoId,
    }
}

import { useSQLiteContext } from "expo-sqlite"

export type ChecklistRealizadoRiscosDatabase = {
  id: number
  checklist_realizado_id: number
  checklist_estrutura_risco_id: number
}

export type ChecklistRealizadoRiscosDatabaseWithRelations = ChecklistRealizadoRiscosDatabase & {
  nome: string
}

export const useChecklisRealizadoRiscosDatabase = () => {
  const database = useSQLiteContext();

  const getAll = async (): Promise<ChecklistRealizadoRiscosDatabase[]> => {
    const query = `SELECT * FROM checklist_realizado_apr_riscos`;
    return await database.getAllAsync<ChecklistRealizadoRiscosDatabase>(query);
  }

  const getByChecklistRealizadoId = async (checklistRealizadoId: number) => {
    const query = `
      SELECT
        crr.*,
        cer.nome
      FROM checklist_realizado_apr_riscos as crr
      INNER JOIN checklist_estrutura_riscos as cer ON crr.checklist_estrutura_risco_id = cer.id
      WHERE crr.checklist_realizado_id = $checklistRealizadoId
      ORDER BY cer.nome
    `;
    try {
      const response = await database.getAllAsync<ChecklistRealizadoRiscosDatabaseWithRelations>(query, [checklistRealizadoId]);
      return response;
    } catch (error) {
      throw error;
    }
  }

  const create = async (data: Omit<ChecklistRealizadoRiscosDatabase, "id">) => {
    const statement = await database.prepareAsync(
      `INSERT INTO checklist_realizado_apr_riscos
        (checklist_realizado_id, checklist_estrutura_risco_id)
        VALUES ($checklist_realizado_id, $checklist_estrutura_risco_id)`
    );
    try {
      const result = await statement.executeAsync({
        $checklist_realizado_id: data.checklist_realizado_id,
        $checklist_estrutura_risco_id: data.checklist_estrutura_risco_id
      });
      return result.lastInsertRowId;
    } catch (error) {
      throw error;
    } finally {
      await statement.finalizeAsync();
    }
  }

  const remove = async (id: number) => {
    const statement = await database.prepareAsync(
      `DELETE FROM checklist_realizado_apr_riscos WHERE id = $id`
    );
    try {
      await statement.executeAsync({ $id: id });
    } catch (error) {
      throw error;
    } finally {
      await statement.finalizeAsync();
    }
  }

  const removeByChecklistRealizadoId = async (checklistRealizadoId: number) => {
    const statement = await database.prepareAsync(
      `DELETE FROM checklist_realizado_apr_riscos WHERE checklist_realizado_id = $checklist_realizado_id`
    );
    try {
      await statement.executeAsync({
        $checklist_realizado_id: checklistRealizadoId
      });
    } catch (error) {
      throw error;
    } finally {
      await statement.finalizeAsync();
    }
  }

  return {
    getAll,
    getByChecklistRealizadoId,
    create,
    remove,
    removeByChecklistRealizadoId
  }
}

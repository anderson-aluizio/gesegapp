import { useSQLiteContext } from "expo-sqlite"

export type ChecklistRealizadoControleRiscosDatabase = {
  id: number
  checklist_realizado_id: number
  checklist_realizado_apr_risco_id: number
  checklist_estrutura_controle_risco_id: number
}

export type ChecklistRealizadoControleRiscosDatabaseWithRelations = ChecklistRealizadoControleRiscosDatabase & {
  checklist_estrutura_risco_id: number
  nome: string
}

export const useChecklisRealizadoControleRiscosDatabase = () => {
  const database = useSQLiteContext();

  const getAll = async (): Promise<ChecklistRealizadoControleRiscosDatabase[]> => {
    const query = `SELECT * FROM checklist_realizado_apr_controle_riscos`;
    return await database.getAllAsync<ChecklistRealizadoControleRiscosDatabase>(query);
  }

  const getByChecklistRealizadoId = async (checklistRealizadoId: number) => {
    const query = `
      SELECT
        crcr.*,
        crar.checklist_estrutura_risco_id,
        cecr.nome
      FROM checklist_realizado_apr_controle_riscos as crcr
        INNER JOIN checklist_estrutura_controle_riscos as cecr ON crcr.checklist_estrutura_controle_risco_id = cecr.id
        INNER JOIN checklist_realizado_apr_riscos as crar ON crcr.checklist_realizado_apr_risco_id = crar.id
      WHERE crcr.checklist_realizado_id = $checklistRealizadoId
      ORDER BY cecr.nome
    `;
    try {
      const response = await database.getAllAsync<ChecklistRealizadoControleRiscosDatabaseWithRelations>(query, [checklistRealizadoId]);
      return response;
    } catch (error) {
      throw error;
    }
  }

  const getByRiscoRealizadoId = async (checklistRealizadoAprRiscoId: number) => {
    const query = `
      SELECT
        crcr.*,
        cecr.nome
      FROM checklist_realizado_apr_controle_riscos as crcr
      INNER JOIN checklist_estrutura_controle_riscos as cecr ON crcr.checklist_estrutura_controle_risco_id = cecr.id
      WHERE crcr.checklist_realizado_apr_risco_id = $checklistRealizadoAprRiscoId
      ORDER BY cecr.nome
    `;
    try {
      const response = await database.getAllAsync<ChecklistRealizadoControleRiscosDatabaseWithRelations>(query, [checklistRealizadoAprRiscoId]);
      return response;
    } catch (error) {
      throw error;
    }
  }

  const create = async (data: Omit<ChecklistRealizadoControleRiscosDatabase, "id">) => {
    const statement = await database.prepareAsync(
      `INSERT INTO checklist_realizado_apr_controle_riscos
        (checklist_realizado_id, checklist_realizado_apr_risco_id, checklist_estrutura_controle_risco_id)
        VALUES ($checklist_realizado_id, $checklist_realizado_apr_risco_id, $checklist_estrutura_controle_risco_id)`
    );
    try {
      const result = await statement.executeAsync({
        $checklist_realizado_id: data.checklist_realizado_id,
        $checklist_realizado_apr_risco_id: data.checklist_realizado_apr_risco_id,
        $checklist_estrutura_controle_risco_id: data.checklist_estrutura_controle_risco_id
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
      `DELETE FROM checklist_realizado_apr_controle_riscos WHERE id = $id`
    );
    try {
      await statement.executeAsync({ $id: id });
    } catch (error) {
      throw error;
    } finally {
      await statement.finalizeAsync();
    }
  }

  const removeByRiscoRealizadoId = async (checklistRealizadoAprRiscoId: number) => {
    const statement = await database.prepareAsync(
      `DELETE FROM checklist_realizado_apr_controle_riscos WHERE checklist_realizado_apr_risco_id = $checklist_realizado_apr_risco_id`
    );
    try {
      await statement.executeAsync({
        $checklist_realizado_apr_risco_id: checklistRealizadoAprRiscoId
      });
    } catch (error) {
      throw error;
    } finally {
      await statement.finalizeAsync();
    }
  }

  const removeByChecklistRealizadoId = async (checklistRealizadoId: number) => {
    const statement = await database.prepareAsync(
      `DELETE FROM checklist_realizado_apr_controle_riscos WHERE checklist_realizado_id = $checklist_realizado_id`
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
    getByRiscoRealizadoId,
    create,
    remove,
    removeByRiscoRealizadoId,
    removeByChecklistRealizadoId
  }
}

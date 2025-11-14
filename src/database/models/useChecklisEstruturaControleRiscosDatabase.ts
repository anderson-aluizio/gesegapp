import { useSQLiteContext } from "expo-sqlite"

export type ChecklistEstruturaControleRiscosDatabase = {
  id: number
  checklist_estrutura_id: number
  checklist_estrutura_risco_id: number
  nome: string
}

export const useChecklisEstruturaControleRiscosDatabase = () => {
  const database = useSQLiteContext();

  const getControlesByRiscoId = async (checklistEstruturaRiscoId: number) => {
    const query = `
      SELECT * FROM checklist_estrutura_controle_riscos
      WHERE checklist_estrutura_risco_id = $checklistEstruturaRiscoId
      ORDER BY nome
    `;
    try {
      const response = await database.getAllAsync<ChecklistEstruturaControleRiscosDatabase>(query, [checklistEstruturaRiscoId]);
      return response;
    } catch (error) {
      throw error;
    }
  }

  return { getControlesByRiscoId };
}

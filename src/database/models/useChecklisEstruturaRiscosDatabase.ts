import { useSQLiteContext } from "expo-sqlite"

export type ChecklistEstruturaRiscosDatabase = {
  id: number
  checklist_estrutura_id: number
  nome: string
}

export const useChecklisEstruturaRiscosDatabase = () => {
  const database = useSQLiteContext();

  const getRiscosByEstruturaId = async (checklistEstruturaId: number) => {
    const query = `SELECT * FROM checklist_estrutura_riscos WHERE checklist_estrutura_id = $checklistEstruturaId ORDER BY nome`;
    try {
      const response = await database.getAllAsync<ChecklistEstruturaRiscosDatabase>(query, [checklistEstruturaId]);
      return response;
    } catch (error) {
      throw error;
    }
  }

  return { getRiscosByEstruturaId };
}

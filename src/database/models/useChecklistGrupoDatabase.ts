import { useSQLiteContext } from "expo-sqlite"

export type ChecklistGrupoDatabase = {
  id: number;
  nome: string;
  nome_interno: string;
}

export const useChecklistGrupoDatabase = () => {
  const database = useSQLiteContext();

  const getAll = async () => {
    try {
      const query = `SELECT * FROM checklist_grupos`;

      const response = await database.getAllAsync<ChecklistGrupoDatabase>(query, []);

      return response
    } catch (error) {
      throw error
    }
  }

  return { getAll }
}

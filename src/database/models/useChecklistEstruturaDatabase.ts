import { useSQLiteContext } from "expo-sqlite"

export type ChecklistEstruturaDatabase = {
  id: number;
  modelo: string;
  checklist_grupo_id: number;
  centro_custo_id: string;
  is_gera_nao_conformidade: boolean;
  is_respostas_obrigatoria: boolean;
}

export const useChecklistEstruturaDatabase = () => {
  const database = useSQLiteContext();

  const getAll = async () => {
    try {
      const query = `SELECT * FROM checklist_estruturas`;

      const response = await database.getAllAsync<ChecklistEstruturaDatabase>(query, []);

      return response
    } catch (error) {
      throw error
    }
  }

  const getByCentroCustoId = async (params: { centro_custo_id: string }) => {
    try {
      const query = `SELECT * FROM checklist_estruturas WHERE centro_custo_id = ? ORDER BY modelo ASC`;

      const response = await database.getAllAsync<ChecklistEstruturaDatabase>(query, [
        params.centro_custo_id
      ]);

      return response
    } catch (error) {
      throw error
    }
  }

  const getByParams = async (params: { centro_custo_id: string, grupo_id: number, query: string }) => {
    try {
      const query = `SELECT * FROM checklist_estruturas WHERE centro_custo_id = ? AND checklist_grupo_id = ? AND modelo LIKE ? ORDER BY modelo LIMIT 10`;

      const response = await database.getAllAsync<ChecklistEstruturaDatabase>(query, [
        params.centro_custo_id,
        params.grupo_id,
        `%${params.query}%`
      ]);

      return response
    } catch (error) {
      throw error
    }
  }

  return { getAll, getByCentroCustoId, getByParams }
}

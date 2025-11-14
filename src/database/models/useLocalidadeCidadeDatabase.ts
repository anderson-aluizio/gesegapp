import { useSQLiteContext } from "expo-sqlite"

export type LocalidadeCidadeDatabase = {
  id: number;
  nome: string;
  centro_custo_id: string;
}

export const useLocalidadeCidadeDatabase = () => {
  const database = useSQLiteContext();

  const getAll = async () => {
    try {
      const query = `SELECT * FROM localidade_cidades`;

      const response = await database.getAllAsync<LocalidadeCidadeDatabase>(query, []);

      return response
    } catch (error) {
      throw error
    }
  }

  const getByParams = async (params: { centro_custo_id: string, query: string }) => {
    try {
      const query = `SELECT * FROM localidade_cidades WHERE centro_custo_id = ? AND nome LIKE ? ORDER BY nome LIMIT 10`;

      const response = await database.getAllAsync<LocalidadeCidadeDatabase>(query, [
        params.centro_custo_id,
        `%${params.query}%`
      ]);

      return response
    } catch (error) {
      throw error
    }
  }

  return { getAll, getByParams }
}

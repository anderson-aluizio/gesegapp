import { useSQLiteContext } from "expo-sqlite"

export type VeiculoDatabase = {
  id: string;
  nome: string;
  centro_custo_id: string;
}

export const useVeiculoDatabase = () => {
  const database = useSQLiteContext();

  const getAll = async () => {
    try {
      const query = `SELECT * FROM veiculos`;

      const response = await database.getAllAsync<VeiculoDatabase>(query, []);

      return response
    } catch (error) {
      throw error
    }
  }

  const getByParams = async (paramQuery: string) => {
    try {
      const query = `SELECT * FROM veiculos WHERE id LIKE ? ORDER BY id LIMIT 10`;

      const response = await database.getAllAsync<VeiculoDatabase>(query, [
        `%${paramQuery}%`
      ]);

      return response
    } catch (error) {
      throw error
    }
  }

  return { getAll, getByParams }
}

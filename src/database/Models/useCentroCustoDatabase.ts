import { useSQLiteContext } from "expo-sqlite"

export type CentroCustoDatabase = {
  id: string;
  nome: string;
  synced_at?: string;
}

export const useCentroCustoDatabase = () => {
  const database = useSQLiteContext();

  const getAll = async () => {
    try {
      const query = `SELECT * FROM centro_custos ORDER BY nome`;

      const response = await database.getAllAsync<CentroCustoDatabase>(query, []);

      return response
    } catch (error) {
      throw error
    }
  }
  const getWithChecklistEstrutura = async () => {
    try {
      const query =
        `SELECT *
        FROM centro_custos
        WHERE synced_at IS NOT NULL
        ORDER BY nome`;

      const response = await database.getAllAsync<CentroCustoDatabase>(query, []);

      return response
    } catch (error) {
      throw error
    }
  }

  const deleteAndInsert = async (centroCustos: CentroCustoDatabase[]) => {
    try {
      const deleteQuery = `DELETE FROM centro_custos`;
      const query = `INSERT OR REPLACE INTO centro_custos (id, nome) VALUES (?, ?)`;

      await database.runAsync(deleteQuery);
      for (const centroCusto of centroCustos) {
        await database.runAsync(query, [centroCusto.id, centroCusto.nome]);
      }
    } catch (error) {
      throw error;
    }
  }

  return { getAll, getWithChecklistEstrutura, deleteAndInsert }
}

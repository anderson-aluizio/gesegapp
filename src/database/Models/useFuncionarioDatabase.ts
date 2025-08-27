import { useSQLiteContext } from "expo-sqlite"

export type FuncionarioDatabase = {
  cpf: string;
  nome: string;
  matricula: string;
  cargo_nome: string;
  centro_custo_id: string;
}

export const useFuncionarioDatabase = () => {
  const database = useSQLiteContext();

  const getAll = async () => {
    try {
      const query = `SELECT * FROM funcionarios`;

      const response = await database.getAllAsync<FuncionarioDatabase>(query, []);

      return response
    } catch (error) {
      throw error
    }
  }

  const getByParams = async (paramQuery: string) => {
    try {
      const query = `SELECT * FROM funcionarios WHERE nome LIKE ? ORDER BY nome LIMIT 10`;

      const response = await database.getAllAsync<FuncionarioDatabase>(query, [
        `%${paramQuery}%`
      ]);

      return response
    } catch (error) {
      throw error
    }
  }

  return { getAll, getByParams }
}

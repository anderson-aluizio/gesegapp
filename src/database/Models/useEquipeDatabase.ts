import { useSQLiteContext } from "expo-sqlite"

export type EquipeDatabase = {
  id: number;
  nome: string;
  centro_custo_id: string;
  encarregado_cpf: string;
  encarregado_nome: string;
  supervisor_cpf: string;
  supervisor_nome: string;
  coordenador_cpf: string;
  coordenador_nome: string;
  gerente_cpf: string;
  gerente_nome: string;
}

export const useEquipeDatabase = () => {
  const database = useSQLiteContext();

  const getAll = async () => {
    try {
      const query = `SELECT * FROM equipes`;

      const response = await database.getAllAsync<EquipeDatabase>(query, []);

      return response
    } catch (error) {
      throw error
    }
  }

  const show = async (id: number) => {
    try {
      const query = "SELECT * FROM equipes WHERE id = ?";

      const response = await database.getFirstAsync<EquipeDatabase>(query, [
        id,
      ])

      return response
    } catch (error) {
      throw error
    }
  }

  const getByParams = async (centroCustoId = '', paramQuery: string) => {
    try {
      let query: string
      let params: Array<string | number>

      if (centroCustoId === '') {
        query = `SELECT * FROM equipes WHERE nome LIKE ? ORDER BY nome LIMIT 10`;
        params = [`%${paramQuery}%`];
      } else {
        query = `SELECT * FROM equipes WHERE centro_custo_id = ? AND nome LIKE ? ORDER BY nome LIMIT 10`;
        params = [centroCustoId, `%${paramQuery}%`];
      }

      const response = await database.getAllAsync<EquipeDatabase>(query, params);

      return response
    } catch (error) {
      throw error
    }
  }

  return { getAll, show, getByParams }
}

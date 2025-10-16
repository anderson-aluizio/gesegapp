import { useSQLiteContext } from "expo-sqlite"

export type EquipeTurnoFuncionarioDatabase = {
  id: number;
  equipe_turno_id: number;
  funcionario_cpf: string;
  is_lider: number;
}

export type EquipeTurnoFuncionarioDatabaseWithRelations = EquipeTurnoFuncionarioDatabase & {
  funcionario_nome?: string;
  funcionario_matricula?: string;
  funcionario_cargo_nome?: string;
}

export type CreateEquipeTurnoFuncionarioInput = {
  equipe_turno_id: number;
  funcionario_cpf: string;
  is_lider: boolean;
}

export const useEquipeTurnoFuncionarioDatabase = () => {
  const database = useSQLiteContext();

  const getByEquipeTurnoId = async (equipeTurnoId: number) => {
    try {
      const query = `
        SELECT
          etf.*,
          f.nome as funcionario_nome,
          f.matricula as funcionario_matricula,
          f.cargo_nome as funcionario_cargo_nome
        FROM equipe_turno_funcionarios etf
        LEFT JOIN funcionarios f ON etf.funcionario_cpf = f.cpf
        WHERE etf.equipe_turno_id = ?
        ORDER BY etf.is_lider DESC, f.nome ASC
      `;

      const response = await database.getAllAsync<EquipeTurnoFuncionarioDatabaseWithRelations>(query, [equipeTurnoId]);
      return response;
    } catch (error) {
      throw error;
    }
  }

  const create = async (data: CreateEquipeTurnoFuncionarioInput) => {
    try {
      const statement = await database.prepareAsync(
        `INSERT INTO equipe_turno_funcionarios (equipe_turno_id, funcionario_cpf, is_lider)
         VALUES (?, ?, ?)`
      );

      const result = await statement.executeAsync([
        data.equipe_turno_id,
        data.funcionario_cpf,
        data.is_lider ? 1 : 0
      ]);

      await statement.finalizeAsync();
      return result;
    } catch (error) {
      throw error;
    }
  }

  const update = async (id: number, data: { is_lider: boolean }) => {
    try {
      const statement = await database.prepareAsync(
        `UPDATE equipe_turno_funcionarios
         SET is_lider = ?
         WHERE id = ?`
      );

      const result = await statement.executeAsync([
        data.is_lider ? 1 : 0,
        id
      ]);

      await statement.finalizeAsync();
      return result;
    } catch (error) {
      throw error;
    }
  }

  const remove = async (id: number) => {
    try {
      const statement = await database.prepareAsync(
        `DELETE FROM equipe_turno_funcionarios WHERE id = ?`
      );

      const result = await statement.executeAsync([id]);
      await statement.finalizeAsync();
      return result;
    } catch (error) {
      throw error;
    }
  }

  const removeByEquipeTurnoId = async (equipeTurnoId: number) => {
    try {
      const statement = await database.prepareAsync(
        `DELETE FROM equipe_turno_funcionarios WHERE equipe_turno_id = ?`
      );

      const result = await statement.executeAsync([equipeTurnoId]);
      await statement.finalizeAsync();
      return result;
    } catch (error) {
      throw error;
    }
  }

  return {
    getByEquipeTurnoId,
    create,
    update,
    remove,
    removeByEquipeTurnoId
  }
}

import { useSQLiteContext } from "expo-sqlite"

export type EquipeTurnoDatabase = {
  id: number;
  equipe_id: number;
  date: string;
  veiculo_id: string;
  created_at: string;
}

export type EquipeTurnoDatabaseWithRelations = EquipeTurnoDatabase & {
  equipe_nome?: string;
  veiculo_nome?: string;
  total_funcionarios?: number;
}

export type CreateEquipeTurnoInput = {
  equipe_id: number;
  date: Date;
  veiculo_id: string;
}

export const useEquipeTurnoDatabase = () => {
  const database = useSQLiteContext();

  const getAll = async () => {
    try {
      const query = `
        SELECT
          et.*,
          e.nome as equipe_nome,
          v.nome as veiculo_nome,
          (SELECT COUNT(*) FROM equipe_turno_funcionarios WHERE equipe_turno_id = et.id) as total_funcionarios
        FROM equipe_turnos et
        LEFT JOIN equipes e ON et.equipe_id = e.id
        LEFT JOIN veiculos v ON et.veiculo_id = v.id
        ORDER BY et.date DESC, et.created_at DESC
      `;

      const response = await database.getAllAsync<EquipeTurnoDatabaseWithRelations>(query, []);
      return response;
    } catch (error) {
      throw error;
    }
  }

  const show = async (id: number) => {
    try {
      const query = `
        SELECT
          et.*,
          e.nome as equipe_nome,
          v.nome as veiculo_nome,
          (SELECT COUNT(*) FROM equipe_turno_funcionarios WHERE equipe_turno_id = et.id) as total_funcionarios
        FROM equipe_turnos et
        LEFT JOIN equipes e ON et.equipe_id = e.id
        LEFT JOIN veiculos v ON et.veiculo_id = v.id
        WHERE et.id = ?
      `;

      const response = await database.getFirstAsync<EquipeTurnoDatabaseWithRelations>(query, [id]);
      return response;
    } catch (error) {
      throw error;
    }
  }

  const getByDate = async (date: string) => {
    try {
      const query = `
        SELECT
          et.*,
          e.nome as equipe_nome,
          v.nome as veiculo_nome,
          (SELECT COUNT(*) FROM equipe_turno_funcionarios WHERE equipe_turno_id = et.id) as total_funcionarios
        FROM equipe_turnos et
        LEFT JOIN equipes e ON et.equipe_id = e.id
        LEFT JOIN veiculos v ON et.veiculo_id = v.id
        WHERE DATE(et.date) = DATE(?)
        ORDER BY et.created_at DESC
      `;

      const response = await database.getAllAsync<EquipeTurnoDatabaseWithRelations>(query, [date]);
      return response;
    } catch (error) {
      throw error;
    }
  }

  const checkExistingTurnoToday = async (date: string) => {
    try {
      const query = `
        SELECT * FROM equipe_turnos
        WHERE DATE(date) = DATE(?)
        LIMIT 1
      `;

      const response = await database.getFirstAsync<EquipeTurnoDatabase>(query, [date]);
      return response;
    } catch (error) {
      throw error;
    }
  }

  const getTodayTurno = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const query = `
        SELECT
          et.*,
          e.nome as equipe_nome,
          v.nome as veiculo_nome,
          (SELECT COUNT(*) FROM equipe_turno_funcionarios WHERE equipe_turno_id = et.id) as total_funcionarios
        FROM equipe_turnos et
        LEFT JOIN equipes e ON et.equipe_id = e.id
        LEFT JOIN veiculos v ON et.veiculo_id = v.id
        WHERE DATE(et.date) = DATE(?)
        ORDER BY et.created_at DESC
        LIMIT 1
      `;

      const response = await database.getFirstAsync<EquipeTurnoDatabaseWithRelations>(query, [today]);
      return response;
    } catch (error) {
      throw error;
    }
  }

  const hasTodayTurno = async (): Promise<boolean> => {
    try {
      const turno = await getTodayTurno();
      return !!turno;
    } catch (error) {
      throw error;
    }
  }

  const create = async (data: CreateEquipeTurnoInput) => {
    try {
      const statement = await database.prepareAsync(
        `INSERT INTO equipe_turnos (equipe_id, date, veiculo_id, created_at)
         VALUES (?, ?, ?, ?)`
      );

      const result = await statement.executeAsync([
        data.equipe_id,
        data.date.toISOString(),
        data.veiculo_id,
        new Date().toISOString()
      ]);

      await statement.finalizeAsync();
      return result;
    } catch (error) {
      throw error;
    }
  }

  const remove = async (id: number) => {
    try {
      await database.execAsync(`DELETE FROM equipe_turno_funcionarios WHERE equipe_turno_id = ${id}`);

      const statement = await database.prepareAsync(
        `DELETE FROM equipe_turnos WHERE id = ?`
      );

      const result = await statement.executeAsync([id]);
      await statement.finalizeAsync();
      return result;
    } catch (error) {
      throw error;
    }
  }

  return {
    getAll,
    show,
    getByDate,
    checkExistingTurnoToday,
    getTodayTurno,
    hasTodayTurno,
    create,
    remove
  }
}

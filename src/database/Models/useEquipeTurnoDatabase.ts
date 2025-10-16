import { useSQLiteContext } from "expo-sqlite"

export type EquipeTurnoDatabase = {
  id: number;
  equipe_id: number;
  date: string;
  veiculo_id: string;
  is_encerrado: number;
  created_at: string;
  encerrado_at: string | null;
  is_finalizado: number;
  finalizado_at: string | null;
  finalizado_by: number | null;
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
  is_encerrado?: boolean;
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

  const checkExistingTurnoAberto = async (equipeId: number, date: string) => {
    try {
      const query = `
        SELECT * FROM equipe_turnos
        WHERE equipe_id = ?
        AND DATE(date) = DATE(?)
        AND is_encerrado = 0
        LIMIT 1
      `;

      const response = await database.getFirstAsync<EquipeTurnoDatabase>(query, [equipeId, date]);
      return response;
    } catch (error) {
      throw error;
    }
  }

  const getTurnosAbertos = async () => {
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
        WHERE et.is_encerrado = 0
        ORDER BY et.date DESC, et.created_at DESC
      `;

      const response = await database.getAllAsync<EquipeTurnoDatabaseWithRelations>(query, []);
      return response;
    } catch (error) {
      throw error;
    }
  }

  const getFinalizados = async () => {
    try {
      const query = `
        SELECT * FROM equipe_turnos
        WHERE is_finalizado = 1
        ORDER BY finalizado_at DESC
      `;

      const response = await database.getAllAsync<EquipeTurnoDatabase>(query, []);
      return response;
    } catch (error) {
      throw error;
    }
  }

  const create = async (data: CreateEquipeTurnoInput) => {
    try {
      const statement = await database.prepareAsync(
        `INSERT INTO equipe_turnos (equipe_id, date, veiculo_id, is_encerrado, created_at)
         VALUES (?, ?, ?, ?, ?)`
      );

      const result = await statement.executeAsync([
        data.equipe_id,
        data.date.toISOString(),
        data.veiculo_id,
        data.is_encerrado ? 1 : 0,
        new Date().toISOString()
      ]);

      await statement.finalizeAsync();
      return result;
    } catch (error) {
      throw error;
    }
  }

  const updateEncerrado = async (id: number, userId: number) => {
    try {
      const statement = await database.prepareAsync(
        `UPDATE equipe_turnos
         SET is_encerrado = 1, encerrado_at = ?
         WHERE id = ?`
      );

      const result = await statement.executeAsync([
        new Date().toISOString(),
        id
      ]);

      await statement.finalizeAsync();
      return result;
    } catch (error) {
      throw error;
    }
  }

  const updateFinalizado = async (id: number, userId: number) => {
    try {
      const statement = await database.prepareAsync(
        `UPDATE equipe_turnos
         SET is_finalizado = 1, finalizado_at = ?, finalizado_by = ?
         WHERE id = ?`
      );

      const result = await statement.executeAsync([
        new Date().toISOString(),
        userId,
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
      // First delete related funcionarios
      await database.execAsync(`DELETE FROM equipe_turno_funcionarios WHERE equipe_turno_id = ${id}`);

      // Then delete the turno
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
    checkExistingTurnoAberto,
    getTurnosAbertos,
    getFinalizados,
    create,
    updateEncerrado,
    updateFinalizado,
    remove
  }
}

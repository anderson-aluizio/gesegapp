import { useSQLiteContext } from "expo-sqlite"
import { useChecklisRealizadoItemsDatabase } from "./useChecklisRealizadoItemsDatabase"
import { useChecklisEstruturaItemsDatabase } from "./useChecklisEstruturaItemsDatabase"
import { useChecklistRealizadoFuncionarioDatabase } from "./useChecklistRealizadoFuncionarioDatabase"
import { ChecklistEstruturaDatabase } from "./useChecklistEstruturaDatabase"
import { toLocalISOString, getLocalDateString, toLocalDateTimeString } from "@/utils/dateUtils"

export type ChecklistRealizadoDatabase = {
  id: number
  checklist_grupo_id: number
  checklist_estrutura_id: number
  centro_custo_id: string
  localidade_cidade_id: number
  equipe_id: number
  veiculo_id: string
  area: string
  is_user_declarou_conformidade: boolean
  date: Date
  date_fim?: Date
  observacao: string
  ordem_servico: string
  encarregado_cpf: string
  encarregado_nome?: string
  supervisor_cpf: string
  supervisor_nome?: string
  coordenador_cpf: string
  coordenador_nome?: string
  is_finalizado: boolean
  is_synced?: number
  checklist_grupo_nome?: string
  checklist_grupo_nome_interno?: string
  checklist_estrutura_nome?: string
  equipe_nome?: string
  veiculo_nome?: string
  localidade_cidade_nome?: string
  centro_custo_nome?: string
  created_at?: Date
  finalizado_at?: Date
  finalizado_by?: number
  latitude?: number
  longitude?: number
}

export type ChecklistRealizadoDatabaseWithRelations = ChecklistRealizadoDatabase & {
  is_respostas_obrigatoria: boolean
  is_gera_nao_conformidade: boolean
}

export const useChecklisRealizadoDatabase = () => {
  const database = useSQLiteContext()
  const checklisEstruturaItemsDb = useChecklisEstruturaItemsDatabase();
  const checklistRealizadoItemsDb = useChecklisRealizadoItemsDatabase();
  const checklistFuncionarioDb = useChecklistRealizadoFuncionarioDatabase();

  const create = async (data: Omit<ChecklistRealizadoDatabase, "id">) => {
    const statement = await database.prepareAsync(
      `INSERT INTO checklist_realizados
      (checklist_grupo_id, checklist_estrutura_id, centro_custo_id,
      localidade_cidade_id, equipe_id, veiculo_id, area, date, ordem_servico,
      encarregado_cpf, supervisor_cpf, coordenador_cpf, created_at, latitude, longitude)
      VALUES ($checklist_grupo_id, $checklist_estrutura_id, $centro_custo_id,
              $localidade_cidade_id, $equipe_id, $veiculo_id, $area, $date, NULLIF($ordem_servico, '')
              NULLIF($encarregado_cpf, ''), NULLIF($supervisor_cpf, ''), NULLIF($coordenador_cpf, ''),
              $created_at, $latitude, $longitude)`
    );

    try {
      let insertedRowId: string | undefined;
      await database.withTransactionAsync(async () => {
        const result = await statement.executeAsync({
          $checklist_grupo_id: data.checklist_grupo_id,
          $checklist_estrutura_id: data.checklist_estrutura_id,
          $centro_custo_id: data.centro_custo_id,
          $localidade_cidade_id: data.localidade_cidade_id,
          $equipe_id: data.equipe_id,
          $veiculo_id: data.veiculo_id,
          $area: data.area,
          $date: toLocalISOString(data.date),
          $date_fim: data.date_fim ? toLocalISOString(data.date_fim) : null,
          $observacao: data.observacao || "",
          $ordem_servico: data.ordem_servico || "",
          $encarregado_cpf: data.encarregado_cpf,
          $supervisor_cpf: data.supervisor_cpf,
          $coordenador_cpf: data.coordenador_cpf,
          $is_finalizado: data.is_finalizado ? 1 : 0,
          $created_at: toLocalISOString(new Date()),
          $latitude: data.latitude || null,
          $longitude: data.longitude || null,
        });
        insertedRowId = result.lastInsertRowId.toLocaleString();
        const items = await checklisEstruturaItemsDb.getItemsByEstruturaId(data.checklist_estrutura_id);
        for (const item of items) {
          await checklistRealizadoItemsDb.create({
            checklist_estrutura_item_id: item.id,
            checklist_realizado_id: parseInt(insertedRowId),
            checklist_item_id: item.checklist_item_id,
            is_respondido: false,
            is_inconforme: false,
          });
        }
      });
      return { insertedRowId }

    } catch (error) {
      throw error
    } finally {
      await statement.finalizeAsync()
    }
  }

  const getAll = async () => {
    try {
      const query =
        `SELECT 
          checklist_realizados.*,
          equipes.nome AS equipe_nome,
          veiculos.nome AS veiculo_nome,
          localidade_cidades.nome AS localidade_cidade_nome,
          centro_custos.nome AS centro_custo_nome,
          checklist_grupos.nome AS checklist_grupo_nome,
          checklist_estruturas.modelo AS checklist_estrutura_nome
        FROM checklist_realizados
          INNER JOIN equipes ON checklist_realizados.equipe_id = equipes.id
          INNER JOIN veiculos ON checklist_realizados.veiculo_id = veiculos.id
          INNER JOIN localidade_cidades ON checklist_realizados.localidade_cidade_id = localidade_cidades.id
          INNER JOIN centro_custos ON checklist_realizados.centro_custo_id = centro_custos.id
          INNER JOIN checklist_grupos ON checklist_realizados.checklist_grupo_id = checklist_grupos.id
          INNER JOIN checklist_estruturas ON checklist_realizados.checklist_estrutura_id = checklist_estruturas.id
        ORDER BY checklist_realizados.date DESC`;

      const response = await database.getAllAsync<ChecklistRealizadoDatabase>(query, []);
      const transformedResponse: ChecklistRealizadoDatabase[] = response.map(item => ({
        ...item,
        is_finalizado: Boolean(item.is_finalizado),
        date: new Date(item.date),
        date_fim: item.date_fim ? new Date(item.date_fim) : undefined
      }));

      return transformedResponse;
    } catch (error) {
      throw error
    }
  }

  const getFinalizados = async () => {
    try {
      const query = `SELECT * FROM checklist_realizados WHERE is_finalizado = 1`;

      const response = await database.getAllAsync<ChecklistRealizadoDatabase>(query, []);

      return response;
    } catch (error) {
      throw error
    }
  }

  const getFinalizadosNotSynced = async () => {
    try {
      const query = `SELECT * FROM checklist_realizados WHERE is_finalizado = 1 AND is_synced = 0`;

      const response = await database.getAllAsync<ChecklistRealizadoDatabase>(query, []);

      return response;
    } catch (error) {
      throw error
    }
  }

  const getAllNotSynced = async () => {
    try {
      const query =
        `SELECT
          checklist_realizados.*,
          equipes.nome AS equipe_nome,
          veiculos.nome AS veiculo_nome,
          localidade_cidades.nome AS localidade_cidade_nome,
          centro_custos.nome AS centro_custo_nome,
          checklist_grupos.nome AS checklist_grupo_nome,
          checklist_estruturas.modelo AS checklist_estrutura_nome
        FROM checklist_realizados
          INNER JOIN equipes ON checklist_realizados.equipe_id = equipes.id
          INNER JOIN veiculos ON checklist_realizados.veiculo_id = veiculos.id
          INNER JOIN localidade_cidades ON checklist_realizados.localidade_cidade_id = localidade_cidades.id
          INNER JOIN centro_custos ON checklist_realizados.centro_custo_id = centro_custos.id
          INNER JOIN checklist_grupos ON checklist_realizados.checklist_grupo_id = checklist_grupos.id
          INNER JOIN checklist_estruturas ON checklist_realizados.checklist_estrutura_id = checklist_estruturas.id
        WHERE checklist_realizados.is_synced = 0
        ORDER BY checklist_realizados.date DESC`;

      const response = await database.getAllAsync<ChecklistRealizadoDatabase>(query, []);
      const transformedResponse: ChecklistRealizadoDatabase[] = response.map(item => ({
        ...item,
        is_finalizado: Boolean(item.is_finalizado),
        date: new Date(item.date),
        date_fim: item.date_fim ? new Date(item.date_fim) : undefined
      }));

      return transformedResponse;
    } catch (error) {
      throw error
    }
  }

  const markAsSynced = async (id: number) => {
    const statement = await database.prepareAsync(
      `UPDATE checklist_realizados SET is_synced = 1 WHERE id = $id`
    )

    try {
      await statement.executeAsync({ $id: id })
    } catch (error) {
      throw error
    } finally {
      await statement.finalizeAsync()
    }
  }

  const show = async (id: number) => {
    try {
      const query =
        `SELECT 
          checklist_realizados.*,
          equipes.nome AS equipe_nome,
          veiculos.nome AS veiculo_nome,
          localidade_cidades.nome AS localidade_cidade_nome,
          centro_custos.nome AS centro_custo_nome,
          checklist_grupos.nome AS checklist_grupo_nome,
          checklist_grupos.nome_interno AS checklist_grupo_nome_interno,
          checklist_estruturas.modelo AS checklist_estrutura_nome,
          checklist_estruturas.is_respostas_obrigatoria,
          checklist_estruturas.is_gera_nao_conformidade,
          encarregados.nome AS encarregado_nome,
          supervisores.nome AS supervisor_nome,
          coordenadores.nome AS coordenador_nome
        FROM checklist_realizados
          INNER JOIN equipes ON checklist_realizados.equipe_id = equipes.id
          INNER JOIN veiculos ON checklist_realizados.veiculo_id = veiculos.id
          INNER JOIN localidade_cidades ON checklist_realizados.localidade_cidade_id = localidade_cidades.id
          INNER JOIN centro_custos ON checklist_realizados.centro_custo_id = centro_custos.id
          INNER JOIN checklist_grupos ON checklist_realizados.checklist_grupo_id = checklist_grupos.id
          INNER JOIN checklist_estruturas ON checklist_realizados.checklist_estrutura_id = checklist_estruturas.id
          LEFT JOIN funcionarios as encarregados ON checklist_realizados.encarregado_cpf = encarregados.cpf
          LEFT JOIN funcionarios as supervisores ON checklist_realizados.supervisor_cpf = supervisores.cpf
          LEFT JOIN funcionarios as coordenadores ON checklist_realizados.coordenador_cpf = coordenadores.cpf
          WHERE checklist_realizados.id = $id`;

      const response = await database.getFirstAsync<ChecklistRealizadoDatabaseWithRelations>(query, [id]);
      if (!response) {
        return null;
      }
      const transformedResponse: ChecklistRealizadoDatabaseWithRelations = {
        ...response,
        is_finalizado: Boolean(response.is_finalizado),
        date: new Date(response.date),
        date_fim: response.date_fim ? new Date(response.date_fim) : undefined,
        is_respostas_obrigatoria: Boolean(response.is_respostas_obrigatoria),
        is_gera_nao_conformidade: Boolean(response.is_gera_nao_conformidade),
      }

      return transformedResponse;
    } catch (error) {
      throw error
    }
  }

  const updateDadosGerais = async (data: ChecklistRealizadoDatabase) => {
    const statement = await database.prepareAsync(
      `UPDATE checklist_realizados
        SET
          localidade_cidade_id = $localidade_cidade_id,
          equipe_id = $equipe_id,
          veiculo_id = $veiculo_id,
          area = $area,
          observacao = $observacao,
          ordem_servico = $ordem_servico,
          encarregado_cpf = $encarregado_cpf,
          supervisor_cpf = $supervisor_cpf,
          coordenador_cpf = $coordenador_cpf
        WHERE id = $id`
    )

    try {
      await statement.executeAsync({
        $localidade_cidade_id: data.localidade_cidade_id,
        $equipe_id: data.equipe_id,
        $veiculo_id: data.veiculo_id,
        $area: data.area,
        $observacao: data.observacao || '',
        $ordem_servico: data.ordem_servico || '',
        $encarregado_cpf: data.encarregado_cpf,
        $supervisor_cpf: data.supervisor_cpf,
        $coordenador_cpf: data.coordenador_cpf,
        $id: data.id
      })
    } catch (error) {
      throw error
    } finally {
      await statement.finalizeAsync()
    }
  }

  const updateLideranca = async (data: ChecklistRealizadoDatabase) => {
    const statement = await database.prepareAsync(
      `UPDATE checklist_realizados
        SET
          encarregado_cpf = $encarregado_cpf,
          supervisor_cpf = $supervisor_cpf,
          coordenador_cpf = $coordenador_cpf
        WHERE id = $id`
    )

    try {
      await statement.executeAsync({
        $encarregado_cpf: data.encarregado_cpf,
        $supervisor_cpf: data.supervisor_cpf,
        $coordenador_cpf: data.coordenador_cpf,
        $id: data.id
      })
    } catch (error) {
      throw error
    } finally {
      await statement.finalizeAsync()
    }
  }

  const updateFinished = async (id: number, user_id: number, is_user_declarou_conformidade: boolean) => {
    const statement = await database.prepareAsync(
      `UPDATE checklist_realizados
        SET
          is_user_declarou_conformidade = $is_user_declarou_conformidade,
          is_finalizado = 1,
          date_fim = $date_fim,
          finalizado_at = $finalizado_at,
          finalizado_by = $user_id
        WHERE id = $id`
    )

    try {
      const now = new Date();
      await statement.executeAsync({
        $is_user_declarou_conformidade: is_user_declarou_conformidade ? 1 : 0,
        $date_fim: toLocalISOString(now),
        $finalizado_at: toLocalDateTimeString(now),
        $user_id: user_id,
        $id: id
      })
    } catch (error) {
      throw error
    } finally {
      await statement.finalizeAsync()
    }
  }

  const updatedUnfinished = async (id: number) => {
    const statement = await database.prepareAsync(
      `UPDATE checklist_realizados 
        SET 
          is_user_declarou_conformidade = 0,
          is_finalizado = 0,
          date_fim = NULL,
          finalizado_at = NULL
        WHERE id = $id`
    )

    try {
      await statement.executeAsync({
        $id: id
      })
    } catch (error) {
      throw error
    } finally {
      await statement.finalizeAsync()
    }
  }

  const remove = async (id: number) => {
    try {
      await database.withTransactionAsync(async () => {
        await database.execAsync("DELETE FROM checklist_realizados WHERE id = " + id);
        await checklistRealizadoItemsDb.removeByChecklistRealizadoId(id);
        await checklistFuncionarioDb.removeByChecklistRealizadoId(id);
      });
    } catch (error) {
      throw error
    }
  }

  const hasAutoChecklistToday = async () => {
    try {
      const today = getLocalDateString();
      const query = `
        SELECT cr.*
        FROM checklist_realizados cr
        INNER JOIN checklist_grupos cg ON cr.checklist_grupo_id = cg.id
        WHERE cg.nome_interno = 'checklist_auto_checklist'
        AND DATE(cr.date) = DATE(?)
        AND cr.is_finalizado = 1
        LIMIT 1
      `;

      const response = await database.getFirstAsync<ChecklistRealizadoDatabase>(query, [today]);
      return !!response;
    } catch (error) {
      throw error;
    }
  }

  const hasChecklistsByDate = async (date: string) => {
    try {
      const query = `
        SELECT COUNT(*) as count
        FROM checklist_realizados
        WHERE DATE(date) = DATE(?)
      `;

      const response = await database.getFirstAsync<{ count: number }>(query, [date]);
      return response ? response.count > 0 : false;
    } catch (error) {
      throw error;
    }
  }

  const duplicate = async (originalChecklistId: number, newChecklistEstrutura: ChecklistEstruturaDatabase, latitude?: number, longitude?: number) => {
    try {
      const originalChecklist = await show(originalChecklistId);
      if (!originalChecklist) {
        throw new Error('Checklist original não encontrado');
      }

      let newChecklistId: string | undefined;
      await database.withTransactionAsync(async () => {
        const statement = await database.prepareAsync(
          `INSERT INTO checklist_realizados
          (checklist_grupo_id, checklist_estrutura_id, centro_custo_id,
          localidade_cidade_id, equipe_id, veiculo_id, area, date,
          encarregado_cpf, supervisor_cpf, coordenador_cpf, created_at, latitude, longitude, ordem_servico)
          VALUES ($checklist_grupo_id, $checklist_estrutura_id, $centro_custo_id,
                  $localidade_cidade_id, $equipe_id, $veiculo_id, $area, $date,
                  NULLIF($encarregado_cpf, ''), NULLIF($supervisor_cpf, ''), NULLIF($coordenador_cpf, ''),
                  $created_at, $latitude, $longitude, $ordem_servico)`
        );

        try {
          const now = new Date();
          const result = await statement.executeAsync({
            $checklist_grupo_id: newChecklistEstrutura.checklist_grupo_id,
            $checklist_estrutura_id: newChecklistEstrutura.id,
            $centro_custo_id: originalChecklist.centro_custo_id,
            $localidade_cidade_id: originalChecklist.localidade_cidade_id,
            $equipe_id: originalChecklist.equipe_id,
            $veiculo_id: originalChecklist.veiculo_id,
            $area: originalChecklist.area,
            $date: toLocalISOString(now),
            $created_at: toLocalISOString(now),
            $encarregado_cpf: originalChecklist.encarregado_cpf,
            $supervisor_cpf: originalChecklist.supervisor_cpf,
            $coordenador_cpf: originalChecklist.coordenador_cpf,
            $latitude: latitude || null,
            $longitude: longitude || null,
            $ordem_servico: originalChecklist.ordem_servico || '',
          });

          newChecklistId = result.lastInsertRowId.toLocaleString();

          const newEstruturaItems = await checklisEstruturaItemsDb.getItemsByEstruturaId(newChecklistEstrutura.id);

          for (const item of newEstruturaItems) {
            await checklistRealizadoItemsDb.create({
              checklist_estrutura_item_id: item.id,
              checklist_realizado_id: parseInt(newChecklistId),
              checklist_item_id: item.checklist_item_id,
              is_respondido: false,
              is_inconforme: false,
            });
          }

          const funcionariosQuery = `
            SELECT funcionario_cpf
            FROM checklist_realizado_funcionarios
            WHERE checklist_realizado_id = ?
          `;
          const funcionarios = await database.getAllAsync<{ funcionario_cpf: string }>(funcionariosQuery, [originalChecklistId]);

          for (const func of funcionarios) {
            await checklistFuncionarioDb.create(
              parseInt(newChecklistId),
              func.funcionario_cpf
            );
          }
        } finally {
          await statement.finalizeAsync();
        }
      });

      return { success: true, newChecklistId: parseInt(newChecklistId!) };
    } catch (error) {
      console.error('Error duplicating checklist:', error);
      throw error;
    }
  }

  const cleanOldSyncedData = async (daysToKeep: number = 7) => {
    try {
      const idsToDeleteQuery = `
        SELECT id FROM checklist_realizados
        WHERE is_synced = 1
        AND DATE(date) < DATE('now', '-' || ? || ' days')
      `;
      const idsToDelete = await database.getAllAsync<{ id: number }>(idsToDeleteQuery, [daysToKeep]);

      if (idsToDelete.length === 0) {
        return 0;
      }

      const ids = idsToDelete.map(r => r.id);
      const placeholders = ids.map(() => '?').join(',');

      await database.runAsync(
        `DELETE FROM checklist_realizado_apr_controle_riscos WHERE checklist_realizado_id IN (${placeholders})`,
        ids
      );

      await database.runAsync(
        `DELETE FROM checklist_realizado_apr_riscos WHERE checklist_realizado_id IN (${placeholders})`,
        ids
      );

      await database.runAsync(
        `DELETE FROM checklist_realizado_items WHERE checklist_realizado_id IN (${placeholders})`,
        ids
      );

      await database.runAsync(
        `DELETE FROM checklist_realizado_funcionarios WHERE checklist_realizado_id IN (${placeholders})`,
        ids
      );

      const result = await database.runAsync(
        `DELETE FROM checklist_realizados WHERE id IN (${placeholders})`,
        ids
      );

      return result.changes;
    } catch (error) {
      throw error;
    }
  }

  return {
    create,
    getAll,
    getAllNotSynced,
    getFinalizados,
    getFinalizadosNotSynced,
    markAsSynced,
    show,
    updateDadosGerais,
    updateLideranca,
    updateFinished,
    updatedUnfinished,
    remove,
    hasAutoChecklistToday,
    hasChecklistsByDate,
    duplicate,
    cleanOldSyncedData
  }
}

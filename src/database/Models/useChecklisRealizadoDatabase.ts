import { useSQLiteContext } from "expo-sqlite"
import { useChecklisRealizadoItemsDatabase } from "./useChecklisRealizadoItemsDatabase"
import { useChecklisEstruturaItemsDatabase } from "./useChecklisEstruturaItemsDatabase"
import { useChecklistRealizadoFuncionarioDatabase } from "./useChecklistRealizadoFuncionarioDatabase"

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
  encarregado_cpf: string
  encarregado_nome?: string
  supervisor_cpf: string
  supervisor_nome?: string
  coordenador_cpf: string
  coordenador_nome?: string
  gerente_cpf: string
  gerente_nome?: string
  is_finalizado: boolean
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
      localidade_cidade_id, equipe_id, veiculo_id, area, date,
      encarregado_cpf, supervisor_cpf, coordenador_cpf, gerente_cpf, created_at)
      VALUES ($checklist_grupo_id, $checklist_estrutura_id, $centro_custo_id,
              $localidade_cidade_id, $equipe_id, $veiculo_id, $area, $date,
              NULLIF($encarregado_cpf, ''), NULLIF($supervisor_cpf, ''), NULLIF($coordenador_cpf, ''),
              NULLIF($gerente_cpf, ''), datetime('now'))`
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
          $date: data.date.toISOString(),
          $date_fim: data.date_fim ? data.date_fim.toISOString() : null,
          $observacao: data.observacao || "",
          $encarregado_cpf: data.encarregado_cpf,
          $supervisor_cpf: data.supervisor_cpf,
          $coordenador_cpf: data.coordenador_cpf,
          $gerente_cpf: data.gerente_cpf,
          $is_finalizado: data.is_finalizado ? 1 : 0,
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
          coordenadores.nome AS coordenador_nome,
          gerentes.nome AS gerente_nome
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
          LEFT JOIN funcionarios as gerentes ON checklist_realizados.gerente_cpf = gerentes.cpf
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
          encarregado_cpf = $encarregado_cpf,
          supervisor_cpf = $supervisor_cpf,
          coordenador_cpf = $coordenador_cpf,
          gerente_cpf = $gerente_cpf
        WHERE id = $id`
    )

    try {
      await statement.executeAsync({
        $localidade_cidade_id: data.localidade_cidade_id,
        $equipe_id: data.equipe_id,
        $veiculo_id: data.veiculo_id,
        $area: data.area,
        $encarregado_cpf: data.encarregado_cpf,
        $supervisor_cpf: data.supervisor_cpf,
        $coordenador_cpf: data.coordenador_cpf,
        $gerente_cpf: data.gerente_cpf,
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
          coordenador_cpf = $coordenador_cpf, 
          gerente_cpf = $gerente_cpf
        WHERE id = $id`
    )

    try {
      await statement.executeAsync({
        $encarregado_cpf: data.encarregado_cpf,
        $supervisor_cpf: data.supervisor_cpf,
        $coordenador_cpf: data.coordenador_cpf,
        $gerente_cpf: data.gerente_cpf,
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
          finalizado_at = datetime('now'),
          finalizado_by = $user_id
        WHERE id = $id`
    )

    try {
      await statement.executeAsync({
        $is_user_declarou_conformidade: is_user_declarou_conformidade ? 1 : 0,
        $date_fim: new Date().toISOString(),
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

  return {
    create,
    getAll,
    getFinalizados,
    show,
    updateDadosGerais,
    updateLideranca,
    updateFinished,
    updatedUnfinished,
    remove
  }
}

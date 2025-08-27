import { useSQLiteContext } from "expo-sqlite"

export type ChecklistRealizadoItemsDatabase = {
  id: number
  checklist_realizado_id: number
  checklist_estrutura_item_id: number
  checklist_item_id: number
  resposta?: string
  descricao?: string
  foto_path?: string
  is_respondido: boolean
  is_inconforme: boolean
  inconformidade_funcionarios?: string
  inconformidade_funcionarios_array?: string[]
}

export type ChecklistRealizadoItemsDatabaseWithItem = ChecklistRealizadoItemsDatabase & {
  checklist_estrutura_id: number
  checklist_item_nome: string
  checklist_sub_grupo?: string
  checklist_alternativas: string
  checklist_alternativas_array?: string[]
  alternativa_inconformidades?: string
  alternativa_inconformidades_array?: string[]
  is_foto_obrigatoria: boolean
  is_desc_nconf_required: boolean
  checklist_estrutura_nome: string
  is_gera_nao_conformidade: boolean
  is_respostas_obrigatoria: boolean
}

export const useChecklisRealizadoItemsDatabase = () => {
  const database = useSQLiteContext();

  const getAll = async (): Promise<ChecklistRealizadoItemsDatabase[]> => {
    const query = `SELECT * FROM checklist_realizado_items`;
    return await database.getAllAsync<ChecklistRealizadoItemsDatabase>(query);
  }

  const getByChecklistRealizadoId = async (checklistRealizadoId: number) => {
    const query =
      `SELECT cri.*,
      cei.checklist_estrutura_id, cei.checklist_item_nome, cei.checklist_sub_grupo, cei.checklist_alternativas, cei.alternativa_inconformidades, cri.inconformidade_funcionarios,
      cei.is_foto_obrigatoria, cei.is_desc_nconf_required, cei.equipamento_id,
      ce.modelo as checklist_estrutura_nome, ce.is_gera_nao_conformidade, ce.is_respostas_obrigatoria
      FROM checklist_realizado_items as cri
        INNER JOIN checklist_estrutura_items as cei ON cri.checklist_estrutura_item_id = cei.id
        INNER JOIN checklist_estruturas as ce ON cei.checklist_estrutura_id = ce.id
       WHERE cri.checklist_realizado_id = $checklistRealizadoId
      ORDER BY cei.checklist_sub_grupo, cei.num_ordem`;
    try {
      const response = await database.getAllAsync<any>(query, [checklistRealizadoId]);

      const transformedResponse: ChecklistRealizadoItemsDatabaseWithItem[] = response.map((item: any) => ({
        ...item,
        is_respondido: Boolean(item.is_respondido),
        is_inconforme: Boolean(item.is_inconforme),
        is_foto_obrigatoria: Boolean(item.is_foto_obrigatoria),
        is_desc_nconf_required: Boolean(item.is_desc_nconf_required),
        is_gera_nao_conformidade: Boolean(item.is_gera_nao_conformidade),
        is_respostas_obrigatoria: Boolean(item.is_respostas_obrigatoria),
        checklist_alternativas_array: item.checklist_alternativas?.length > 0
          ? item.checklist_alternativas.split(',').map((alt: string) => alt.trim()) : undefined,
        alternativa_inconformidades_array: item.alternativa_inconformidades?.length > 0
          ? item.alternativa_inconformidades.split(',').map((alt: string) => alt.trim()) : undefined,
        inconformidade_funcionarios_array: item.inconformidade_funcionarios?.length > 0
          ? item.inconformidade_funcionarios.split(',').map((funcionario: string) => funcionario.trim()) : undefined
      }));

      return transformedResponse;
    } catch (error) {
      throw error;
    }
  }

  const create = async (data: Omit<ChecklistRealizadoItemsDatabase, "id">) => {
    const statement = await database.prepareAsync(
      `INSERT INTO checklist_realizado_items 
        (checklist_estrutura_item_id, checklist_realizado_id, checklist_item_id)
        VALUES ($checklist_estrutura_item_id, $checklist_realizado_id, $checklist_item_id)`
    );
    try {
      await statement.executeAsync({
        $checklist_estrutura_item_id: data.checklist_estrutura_item_id,
        $checklist_realizado_id: data.checklist_realizado_id,
        $checklist_item_id: data.checklist_item_id
      });
    } catch (error) {
      throw error;
    } finally {
      await statement.finalizeAsync();
    }
  }

  const update = async (data: ChecklistRealizadoItemsDatabase) => {
    const statement = await database.prepareAsync(
      `UPDATE checklist_realizado_items 
        SET 
          resposta = $resposta,
          inconformidade_funcionarios = $inconformidade_funcionarios,
          descricao = $descricao,
          foto_path = $foto_path,
          is_respondido = $is_respondido,
          is_inconforme = $is_inconforme
        WHERE id = $id`
    );
    try {
      await statement.executeAsync({
        $resposta: data.resposta ?? null,
        $inconformidade_funcionarios: data.inconformidade_funcionarios ?? null,
        $descricao: data.descricao ?? null,
        $foto_path: data.foto_path ?? null,
        $is_respondido: data.is_respondido,
        $is_inconforme: data.is_inconforme,
        $id: data.id
      });
    } catch (error) {
      throw error;
    } finally {
      await statement.finalizeAsync();
    }
  }

  const clearByChecklistRealizadoId = async (checklistRealizadoId: number) => {
    const statement = await database.prepareAsync(
      `UPDATE checklist_realizado_items 
        SET 
          resposta = NULL,
          inconformidade_funcionarios = NULL,
          descricao = NULL,
          foto_path = NULL
        WHERE checklist_realizado_id = $checklist_realizado_id`
    );
    try {
      await statement.executeAsync({
        $checklist_realizado_id: checklistRealizadoId
      });
    } catch (error) {
      throw error;
    } finally {
      await statement.finalizeAsync();
    }
  }

  const removeByChecklistRealizadoId = async (checklistRealizadoId: number) => {
    const statement = await database.prepareAsync(
      `DELETE FROM checklist_realizado_items 
        WHERE checklist_realizado_id = $checklist_realizado_id`
    );
    try {
      await statement.executeAsync({
        $checklist_realizado_id: checklistRealizadoId
      });
    } catch (error) {
      throw error;
    } finally {
      await statement.finalizeAsync();
    }
  }

  return { getAll, getByChecklistRealizadoId, create, update, clearByChecklistRealizadoId, removeByChecklistRealizadoId }
}

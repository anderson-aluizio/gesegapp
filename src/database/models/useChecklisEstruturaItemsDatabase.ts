import { useSQLiteContext } from "expo-sqlite"

export type ChecklistEstruturaItemsDatabase = {
  id: number
  checklist_estrutura_id: number
  checklist_grupo_id: number
  checklist_sub_grupo?: string
  checklist_item_id: number
  checklist_item_nome: string
  checklist_alternativa_id?: number
  checklist_alternativas?: string
  alternativa_inconformidades?: string
  is_foto_obrigatoria: boolean
  is_desc_nconf_required: boolean
  num_ordem?: number
  equipamento_id?: number
}

export const useChecklisEstruturaItemsDatabase = () => {
  const database = useSQLiteContext();

  const getItemsByEstruturaId = async (checklistEstruturaId: number) => {
    const query = `SELECT * FROM checklist_estrutura_items WHERE checklist_estrutura_id = $checklistEstruturaId ORDER BY num_ordem`;
    try {
      const response = await database.getAllAsync<ChecklistEstruturaItemsDatabase>(query, [checklistEstruturaId]);
      return response;
    } catch (error) {
      throw error;
    }
  }

  const getOneRow = async () => {
    const query = `SELECT * FROM checklist_estrutura_items LIMIT 1`;
    try {
      const response = await database.getFirstAsync<ChecklistEstruturaItemsDatabase>(query);
      return response;
    } catch (error) {
      throw error;
    }
  }

  return { getItemsByEstruturaId, getOneRow };
}

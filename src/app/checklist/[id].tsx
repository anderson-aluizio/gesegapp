import { useEffect, useState } from 'react';
import { BottomNavigation, Button, Dialog, Portal, Text, ActivityIndicator, MD2Colors } from 'react-native-paper';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import DadosGeraisScreen from './partials/dadosGerais';
import LiderancaScreen from './partials/lideranca';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ChecklistRealizadoDatabaseWithRelations, useChecklisRealizadoDatabase } from '@/database/Models/useChecklisRealizadoDatabase';
import FuncionariosScreen from './partials/funcionarios';
import ItensScreen from './partials/itens';
import Checkbox from 'expo-checkbox';
import { useChecklistRealizadoFuncionarioDatabase } from '@/database/Models/useChecklistRealizadoFuncionarioDatabase';
import { useChecklisRealizadoItemsDatabase } from '@/database/Models/useChecklisRealizadoItemsDatabase';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

export default function EditChecklistRealizado() {
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'dadosGerais', title: 'Dados Gerais', focusedIcon: 'file-document-edit', unfocusedIcon: 'file-document-edit-outline' },
    { key: 'lideranca', title: 'Liderança', focusedIcon: 'account-supervisor', unfocusedIcon: 'account-supervisor-outline' },
    { key: 'colaborador', title: 'Colaboradores', focusedIcon: 'account-group', unfocusedIcon: 'account-group-outline' },
    { key: 'itens', title: 'Itens', focusedIcon: 'clipboard-list', unfocusedIcon: 'clipboard-list-outline' },
  ]);

  const { user } = useAuth();
  const [checklistRealizado, setChecklistRealizado] = useState<ChecklistRealizadoDatabaseWithRelations>({} as ChecklistRealizadoDatabaseWithRelations);
  const [isChecklistRealizadoTipoObservacao, setIsChecklistRealizadoTipoObservacao] = useState<boolean>(false);
  const checklistRealizadoDb = useChecklisRealizadoDatabase();
  const checklistRealizadoFuncionarioDb = useChecklistRealizadoFuncionarioDatabase();
  const useChecklisRealizadoItemsDb = useChecklisRealizadoItemsDatabase();
  const { id } = useLocalSearchParams<{ id: string }>();

  const getChecklistRealizado = async () => {
    checklistRealizadoDb.show(Number(id)).then((response) => {
      if (response) {
        setChecklistRealizado(response);
        if (response.checklist_grupo_nome_interno === 'checklist_observacao_comportamental_stop_work') {
          setIsChecklistRealizadoTipoObservacao(true);
        } else {
          setIsChecklistRealizadoTipoObservacao(false);
        }
      }
    })
  };

  useEffect(() => {
    if (id) {
      getChecklistRealizado();
    }
  }, [id]);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isReloadList, setisReloadList] = useState<boolean>(false);
  const [isdialogFinishShow, setIsdialogFinishShow] = useState<boolean>(false);
  const [dialogDesc, setDialogDesc] = useState<string>('');
  const [isUserDeclarouConformidade, setIsUserDeclarouConformidade] = useState<boolean>(false);

  type Route = { key: string; title: string; focusedIcon: string; unfocusedIcon: string };
  const renderScene = ({ route }: { route: Route }) => {
    const isActive = routes[index].key === route.key;

    switch (route.key) {
      case 'dadosGerais':
        return <DadosGeraisScreen checklistRealizado={checklistRealizado} formUpdated={getChecklistRealizado} />;
      case 'lideranca':
        return <LiderancaScreen checklistRealizado={checklistRealizado} formUpdated={getChecklistRealizado} />;
      case 'colaborador':
        return <FuncionariosScreen checklistRealizado={checklistRealizado} formUpdated={getChecklistRealizado} setReloadList={setisReloadList} />;
      case 'itens':
        return <ItensScreen checklistRealizado={checklistRealizado} formUpdated={getChecklistRealizado}
          isActive={isActive} reloadList={isReloadList} setReloadList={setisReloadList} />;
      default:
        return null;
    }
  };

  const checkDadosGeraisIsValid = async () => {
    if (!checklistRealizado.checklist_grupo_id || !checklistRealizado.checklist_estrutura_id ||
      !checklistRealizado.localidade_cidade_id || !checklistRealizado.date || !checklistRealizado.area ||
      !checklistRealizado.equipe_id) {
      setDialogDesc('Preencha todos os campos obrigatórios em Dados Gerais.');
      return false;
    }
    return true;
  }

  const checkliderancaIsValid = async () => {
    if (!checklistRealizado.supervisor_cpf || !checklistRealizado.coordenador_cpf || !checklistRealizado.gerente_cpf) {
      setDialogDesc('Preencha todos os campos obrigatórios em Liderança.');
      return false;
    }
    return true;
  }

  const checkFuncionariosIsValid = async () => {
    const responseFuncionarios = await checklistRealizadoFuncionarioDb.getByChecklistRealizadoId(checklistRealizado.id);
    if (responseFuncionarios.length === 0) {
      setDialogDesc('Adicione pelo menos um colaborador.');
      return false;
    }
    return true;
  }

  const checkItensIsValid = async () => {
    const responseItems = await useChecklisRealizadoItemsDb.getByChecklistRealizadoId(checklistRealizado.id);
    const hasSomeInconforme = responseItems.some(item => item.is_inconforme);
    if (!Boolean(checklistRealizado.is_respostas_obrigatoria)) {
      return { valid: true, hasInconformidades: hasSomeInconforme };
    }
    const itemsValid = responseItems.every(item => item.is_respondido);
    if (!itemsValid) {
      setDialogDesc('Responda todos os itens.');
      return { valid: false, hasInconformidades: hasSomeInconforme };
    }
    const totalItemsInconformesDescricaoRequired = responseItems.filter(item =>
      item.is_desc_nconf_required && item.is_inconforme
    ).length;
    const totalItemsDescricaoFilled = responseItems.filter(item => String(item.descricao)?.length > 0).length;
    const possuiDescricoesPendentes = totalItemsInconformesDescricaoRequired > 0 && totalItemsDescricaoFilled < totalItemsInconformesDescricaoRequired;
    if (hasSomeInconforme && checklistRealizado.is_gera_nao_conformidade && possuiDescricoesPendentes) {
      setDialogDesc('Existem itens com não conformidades pendentes de descrição.');
      return { valid: false, hasInconformidades: hasSomeInconforme };
    }
    return { valid: true, hasInconformidades: hasSomeInconforme };
  }

  const validateFinish = async () => {
    const isDadosGeraisValid = await checkDadosGeraisIsValid();
    if (!isDadosGeraisValid) return false;
    const isLiderancaValid = await checkliderancaIsValid();
    if (!isLiderancaValid) return false;
    const isFuncionariosValid = await checkFuncionariosIsValid();
    if (!isFuncionariosValid) return false;
    const { valid: isItensValid, hasInconformidades } = await checkItensIsValid();
    if (!isItensValid) return false;

    if (isChecklistRealizadoTipoObservacao) {
      if (!hasInconformidades && !isUserDeclarouConformidade) {
        setDialogDesc('É necessário declarar conformidade para continuar.');
        return false;
      }

      if (hasInconformidades && isUserDeclarouConformidade) {
        setDialogDesc('Não é possível declarar conformidade quando existem inconformidades registradas.');
        return false;
      }
    }

    return true;
  };

  const handleFinish = async () => {
    setIsLoading(true);
    setIsdialogFinishShow(false);
    const isValid = await validateFinish();
    setIsLoading(false);
    if (!isValid) {
      return;
    }
    if (!user || !user.id) {
      setDialogDesc('Usuário não autenticado. Por favor, faça login novamente.');
      return;
    }
    checklistRealizadoDb.updateFinished(checklistRealizado.id, user.id, isUserDeclarouConformidade)
      .then(() => {
        router.dismissAll();
        router.push('/checklist-list');
      })
      .catch((error) => {
        console.error('Erro ao finalizar checklist:', error);
        setDialogDesc('Erro ao finalizar. Tente novamente mais tarde.');
      }
      );
  };

  return (
    <ProtectedRoute>
      <>
        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator animating={true} color={MD2Colors.blue500} size="large" />
          </View>
        ) : (
          <View style={styles.container}>
            <Stack.Screen
              options={{
                title: 'Editar',
                headerRight: () => (
                  <Button icon="checkbox-marked-circle-outline" onPress={() => setIsdialogFinishShow(true)} textColor="green">
                    Finalizar
                  </Button>
                ),
              }}
            />
            <BottomNavigation
              navigationState={{ index, routes }}
              onIndexChange={setIndex}
              renderScene={renderScene}
            />
            <Portal>
              <Dialog visible={isdialogFinishShow} onDismiss={() => setIsdialogFinishShow(false)}>
                <Dialog.Title>Finalizar Registro</Dialog.Title>
                <Dialog.Content>
                  <Text variant="bodySmall">
                    Antes de finalizar confira se todas as informações estão corretas. Se o botão "Atualizar" estiver habilitado é porque
                    o checklist possui alterações não salvas.
                  </Text>
                  {isChecklistRealizadoTipoObservacao && (
                    <View style={styles.section}>
                      <Checkbox
                        style={styles.checkbox}
                        value={isUserDeclarouConformidade}
                        onValueChange={(value) => setIsUserDeclarouConformidade(value)}
                        color={isUserDeclarouConformidade ? '#4630EB' : undefined}
                      />
                      <TouchableOpacity onPress={() => setIsUserDeclarouConformidade(!isUserDeclarouConformidade)}>
                        <Text style={styles.paragraph}>Declaro que esta observação não gerou nenhum desvio</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </Dialog.Content>
                <Dialog.Actions>
                  <Button onPress={() => setIsdialogFinishShow(false)}>Fechar</Button>
                  <Button onPress={handleFinish}>Finalizar</Button>
                </Dialog.Actions>
              </Dialog>
            </Portal>
            <Portal>
              <Dialog visible={Boolean(dialogDesc.length)} onDismiss={() => setDialogDesc('')}>
                <Dialog.Title>Atenção</Dialog.Title>
                <Dialog.Content>
                  <Text variant="bodyMedium">
                    {dialogDesc}
                  </Text>
                </Dialog.Content>
                <Dialog.Actions>
                  <Button onPress={() => setDialogDesc('')}>Fechar</Button>
                </Dialog.Actions>
              </Dialog>
            </Portal>
          </View>
        )}
      </>
    </ProtectedRoute>
  );
};

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    zIndex: 10,
    width: '100%',
    height: '100%'
  },
  container: {
    flex: 1,
    backgroundColor: '#f6f6f6',
  },
  section: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paragraph: {
    fontSize: 15,
  },
  checkbox: {
    marginRight: 8,
    borderRadius: 4,
    borderWidth: 1,
    width: 24,
    height: 24,
    backgroundColor: '#fff',
    borderColor: '#ccc',
  },
});

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { Button, Dialog, Portal, Text, ActivityIndicator } from 'react-native-paper';
import { StyleSheet, View, TouchableOpacity, ScrollView, Pressable } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import DadosGeraisScreen from '@/components/checklist/dadosGerais';
import LiderancaScreen from '@/components/checklist/lideranca';
import RiscosScreen from '@/components/checklist/riscos';
import AcaoCamposScreen from '@/components/checklist/acaoCampos';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ChecklistRealizadoDatabaseWithRelations, useChecklisRealizadoDatabase } from '@/database/models/useChecklisRealizadoDatabase';
import FuncionariosScreen from '@/components/checklist/funcionarios';
import ItensScreen from '@/components/checklist/itens';
import Checkbox from 'expo-checkbox';
import { useChecklistRealizadoFuncionarioDatabase } from '@/database/models/useChecklistRealizadoFuncionarioDatabase';
import { useChecklisRealizadoItemsDatabase } from '@/database/models/useChecklisRealizadoItemsDatabase';
import ProtectedRoute from '@/components/guards/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useDialog } from '@/hooks/useDialog';
import InfoDialog from '@/components/ui/dialogs/InfoDialog';
import { useTheme, ThemeColors } from '@/contexts/ThemeContext';

export default function EditChecklistRealizado() {
  const { user } = useAuth();
  const dialog = useDialog();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [index, setIndex] = useState(0);

  const allRoutes = [
    { key: 'dadosGerais', title: 'Dados Gerais', icon: 'file-document-edit-outline' },
    { key: 'lideranca', title: 'Liderança', icon: 'account-supervisor-outline' },
    { key: 'colaborador', title: 'Colaboradores', icon: 'account-group-outline' },
    { key: 'itens', title: 'Itens', icon: 'clipboard-list-outline' },
    { key: 'riscos', title: 'Riscos', icon: 'alert-outline' },
    { key: 'acaoCampos', title: 'Serviços', icon: 'notebook-edit-outline' },
  ];

  const [checklistRealizado, setChecklistRealizado] = useState<ChecklistRealizadoDatabaseWithRelations>({} as ChecklistRealizadoDatabaseWithRelations);

  const routes = useMemo(() => {
    const isAprChecklist = checklistRealizado.checklist_grupo_nome_interno === 'checklist_apr';
    const isUserOperacao = user?.is_operacao;

    return allRoutes.filter(route => {
      if (route.key === 'riscos' && (!isUserOperacao || !isAprChecklist)) return false;
      if (route.key === 'acaoCampos' && (!isUserOperacao || !isAprChecklist)) return false;
      return true;
    });
  }, [user?.is_operacao, checklistRealizado.checklist_grupo_nome_interno]);
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
  const [isUserDeclarouConformidade, setIsUserDeclarouConformidade] = useState<boolean>(false);

  const tabScrollRef = useRef<ScrollView>(null);
  const tabItemRefs = useRef<{ [key: number]: View | null }>({});

  const handleTabPress = useCallback((tabIndex: number) => {
    setIndex(tabIndex);
    // Scroll tab bar to make the selected tab visible
    const tabView = tabItemRefs.current[tabIndex];
    if (tabView && tabScrollRef.current) {
      tabView.measureLayout(
        tabScrollRef.current.getInnerViewRef(),
        (x) => {
          tabScrollRef.current?.scrollTo({ x: Math.max(0, x - 40), animated: true });
        },
        () => { }
      );
    }
  }, []);

  const renderActiveScene = () => {
    const activeRoute = routes[index];
    if (!activeRoute) return null;

    switch (activeRoute.key) {
      case 'dadosGerais':
        return <DadosGeraisScreen checklistRealizado={checklistRealizado} formUpdated={getChecklistRealizado} isUserOperacao={user?.is_operacao || false} />;
      case 'lideranca':
        return <LiderancaScreen checklistRealizado={checklistRealizado} formUpdated={getChecklistRealizado} isUserOperacao={user?.is_operacao || false} />;
      case 'colaborador':
        return <FuncionariosScreen checklistRealizado={checklistRealizado} formUpdated={getChecklistRealizado} setReloadList={setisReloadList} />;
      case 'itens':
        return <ItensScreen checklistRealizado={checklistRealizado} formUpdated={getChecklistRealizado}
          isActive={true} reloadList={isReloadList} setReloadList={setisReloadList} />;
      case 'riscos':
        return <RiscosScreen checklistRealizado={checklistRealizado} formUpdated={getChecklistRealizado} />;
      case 'acaoCampos':
        return <AcaoCamposScreen checklistRealizado={checklistRealizado} formUpdated={getChecklistRealizado} />;
      default:
        return null;
    }
  };

  const checkDadosGeraisIsValid = async () => {
    if (!checklistRealizado.checklist_grupo_id || !checklistRealizado.checklist_estrutura_id ||
      !checklistRealizado.localidade_cidade_id || !checklistRealizado.date || !checklistRealizado.area ||
      !checklistRealizado.equipe_id) {
      dialog.show('⚠️ Atenção', 'Preencha todos os campos obrigatórios em Dados Gerais.');
      return false;
    }
    return true;
  }

  const checkliderancaIsValid = async () => {
    if (!checklistRealizado.supervisor_cpf || !checklistRealizado.coordenador_cpf) {
      dialog.show('⚠️ Atenção', 'Preencha todos os campos obrigatórios em Liderança.');
      return false;
    }
    return true;
  }

  const checkFuncionariosIsValid = async () => {
    const responseFuncionarios = await checklistRealizadoFuncionarioDb.getByChecklistRealizadoId(checklistRealizado.id);
    if (responseFuncionarios.length === 0) {
      dialog.show('⚠️ Atenção', 'Adicione pelo menos um colaborador.');
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
      // Find the first unanswered item to show to the user
      const firstUnansweredItem = responseItems.find(item => !item.is_respondido);
      const itemName = firstUnansweredItem?.checklist_item_nome || 'Item';
      dialog.show('⚠️ Atenção', `Responda todos os itens.\n\nConfira se preencheu todos os campos obrigatórios(possuem um asterisco vermelho).\n\nItem não respondido:\n"${itemName}"`);
      return { valid: false, hasInconformidades: hasSomeInconforme };
    }
    const totalItemsInconformesDescricaoRequired = responseItems.filter(item =>
      item.is_desc_nconf_required && item.is_inconforme
    ).length;
    const totalItemsDescricaoFilled = responseItems.filter(item => String(item.descricao)?.length > 0).length;
    const possuiDescricoesPendentes = totalItemsInconformesDescricaoRequired > 0 && totalItemsDescricaoFilled < totalItemsInconformesDescricaoRequired;
    if (hasSomeInconforme && checklistRealizado.is_gera_nao_conformidade && possuiDescricoesPendentes) {
      dialog.show('⚠️ Atenção', 'Existem itens com não conformidades pendentes de descrição.');
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
        dialog.show('⚠️ Atenção', 'É necessário declarar conformidade para continuar.');
        return false;
      }

      if (hasInconformidades && isUserDeclarouConformidade) {
        dialog.show('⚠️ Atenção', 'Não é possível declarar conformidade quando existem inconformidades registradas.');
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
      dialog.show('⚠️ Atenção', 'Usuário não autenticado. Por favor, faça login novamente.');
      return;
    }

    const isAprChecklist = checklistRealizado.checklist_grupo_nome_interno === 'checklist_apr';
    const isAutoChecklist = checklistRealizado.checklist_grupo_nome_interno === 'checklist_auto_checklist';
    const isUserOperacao = user?.is_operacao;

    if ((isAprChecklist || isAutoChecklist) && isUserOperacao) {
      const funcionarios = await checklistRealizadoFuncionarioDb.getByChecklistRealizadoId(checklistRealizado.id);
      const unsignedFuncionarios = funcionarios.filter(f => !f.assinatura);
      if (unsignedFuncionarios.length > 0) {
        const checklistType = isAprChecklist ? 'APR' : 'Auto Checklist';
        dialog.show('⚠️ Atenção', `Todos os colaboradores precisam assinar antes de finalizar o ${checklistType}.`);
        return;
      }
    }

    finalizeChecklist();
  };

  const finalizeChecklist = () => {
    if (!user || !user.id) {
      dialog.show('⚠️ Atenção', 'Usuário não autenticado. Por favor, faça login novamente.');
      return;
    }

    checklistRealizadoDb.updateFinished(checklistRealizado.id, user.id, isUserDeclarouConformidade)
      .then(() => {
        router.replace('/checklist-list');
      })
      .catch((error) => {
        console.error('Erro ao finalizar checklist:', error);
        dialog.show('❌ Erro', 'Erro ao finalizar. Tente novamente mais tarde.');
      }
      );
  };

  const hasPrev = index > 0;
  const hasNext = index < routes.length - 1;

  return (
    <ProtectedRoute>
      <>
        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator animating={true} color={colors.primary} size="large" />
          </View>
        ) : (
          <View style={styles.container}>
            <Stack.Screen
              options={{
                headerTitle: () => (
                  <Text style={styles.headerTitle} numberOfLines={1}>
                    {checklistRealizado.checklist_grupo_nome || 'Editar Checklist'}
                  </Text>
                ),
                headerLeft: () => (
                  <Pressable
                    style={styles.headerBackButton}
                    onPress={() => {
                      router.dismissAll();
                      router.push('/checklist-list');
                    }}
                  >
                    <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
                    <Text style={styles.headerBackText}>Voltar</Text>
                  </Pressable>
                ),
                headerRight: () => (
                  <Pressable
                    style={styles.headerFinishButton}
                    onPress={() => setIsdialogFinishShow(true)}
                  >
                    <MaterialCommunityIcons name="check-circle-outline" size={20} color={colors.textOnPrimary} />
                    <Text style={styles.headerFinishText}>Finalizar</Text>
                  </Pressable>
                ),
              }}
            />

            {/* Tab Bar */}
            <View style={styles.tabBarContainer}>
              <ScrollView
                ref={tabScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tabBarContent}
              >
                {routes.map((route, i) => {
                  const isActive = i === index;
                  return (
                    <Pressable
                      key={route.key}
                      ref={(ref) => { tabItemRefs.current[i] = ref; }}
                      style={[styles.tabItem, isActive && styles.tabItemActive]}
                      onPress={() => handleTabPress(i)}
                    >
                      <Text style={[
                        styles.tabLabel,
                        isActive && styles.tabLabelActive,
                      ]}
                        numberOfLines={1}
                      >
                        {route.title}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Scene Content */}
            <View style={styles.sceneContainer}>
              {renderActiveScene()}
            </View>

            {/* Bottom Navigation Bar */}
            <View style={styles.bottomBar}>
              {hasPrev ? (
                <Pressable
                  style={styles.navButton}
                  onPress={() => handleTabPress(index - 1)}
                >
                  <MaterialCommunityIcons name="arrow-left" size={18} color={colors.primary} />
                  <Text style={styles.navButtonText} numberOfLines={1}>
                    {routes[index - 1].title}
                  </Text>
                </Pressable>
              ) : (
                <View style={styles.navButtonPlaceholder} />
              )}

              <Text style={styles.stepIndicator}>
                {index + 1} / {routes.length}
              </Text>

              {hasNext ? (
                <Pressable
                  style={styles.navButtonEnd}
                  onPress={() => handleTabPress(index + 1)}
                >
                  <Text style={styles.navButtonText} numberOfLines={1}>
                    {routes[index + 1].title}
                  </Text>
                  <MaterialCommunityIcons name="arrow-right" size={18} color={colors.primary} />
                </Pressable>
              ) : (
                <View style={styles.navButtonPlaceholder} />
              )}
            </View>

            <Portal>
              <Dialog visible={isdialogFinishShow} onDismiss={() => setIsdialogFinishShow(false)}>
                <Dialog.Title>Finalizar Registro</Dialog.Title>
                <Dialog.Content>
                  <Text variant="bodySmall" style={{ textAlign: 'justify' }}>
                    Antes de finalizar confira se todas as informações estão corretas. Se o botão &quot;Atualizar&quot; estiver habilitado é porque
                    o formulário possui alterações não salvas.
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

            <InfoDialog
              visible={dialog.visible}
              description={dialog.description}
              title={dialog.title}
              onDismiss={dialog.hide}
            />
          </View>
        )}
      </>
    </ProtectedRoute>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    zIndex: 10,
    width: '100%',
    height: '100%',
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    maxWidth: 160,
  },
  headerBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingRight: 8,
  },
  headerBackText: {
    fontSize: 15,
    color: colors.text,
  },
  headerFinishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.success,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  headerFinishText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textOnPrimary,
  },

  // Tab Bar
  tabBarContainer: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabBarContent: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 6,
  },
  tabItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surfaceVariant,
  },
  tabItemActive: {
    backgroundColor: colors.primary,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  tabLabelActive: {
    color: colors.textOnPrimary,
    fontWeight: '700',
  },

  // Scene
  sceneContainer: {
    flex: 1,
  },

  // Bottom Navigation Bar
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    justifyContent: 'flex-start',
  },
  navButtonEnd: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    justifyContent: 'flex-end',
  },
  navButtonPlaceholder: {
    flex: 1,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  stepIndicator: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    textAlign: 'center',
    minWidth: 50,
  },

  // Dialog
  section: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paragraph: {
    fontSize: 15,
    color: colors.text,
  },
  checkbox: {
    marginRight: 8,
    borderRadius: 4,
    borderWidth: 1,
    width: 24,
    height: 24,
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
});

import { StyleSheet, View, ScrollView, Pressable, Dimensions, Image, StatusBar } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';
import { useEquipeTurnoDatabase } from '@/database/Models/useEquipeTurnoDatabase';
import { useChecklisEstruturaItemsDatabase } from '@/database/Models/useChecklisEstruturaItemsDatabase';
import { useCentroCustoDatabase } from '@/database/Models/useCentroCustoDatabase';
import { InfoDialog, ConfirmDialog } from '@/components/sync-data';

const { width } = Dimensions.get('window');
const CARD_SPACING = 12;
const CARD_WIDTH = (width - 48 - CARD_SPACING) / 2;

type ModuleCardData = {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  colors: [string, string];
  requiresOperational?: boolean;
};

export default function HomeScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false);
  const [infoDialogVisible, setInfoDialogVisible] = useState(false);
  const [infoDialogMessage, setInfoDialogMessage] = useState('');
  const [confirmDialogVisible, setConfirmDialogVisible] = useState(false);
  const [confirmDialogConfig, setConfirmDialogConfig] = useState({
    title: '',
    description: '',
    onConfirm: () => {},
    confirmText: 'Confirmar',
  });

  const turnoDb = useEquipeTurnoDatabase();
  const checklistEstruturaItemsDb = useChecklisEstruturaItemsDatabase();
  const centroCustoDb = useCentroCustoDatabase();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const modules: ModuleCardData[] = [
    {
      id: 'checklist',
      title: 'Checklist',
      description: 'Realizar e visualizar checklists',
      icon: 'clipboard-check-outline',
      route: '/checklist-list',
      colors: ['#667eea', '#764ba2'],
    },
    {
      id: 'turno',
      title: 'Turno de Equipe',
      description: 'Gerenciar turnos de trabalho',
      icon: 'clock-outline',
      route: '/turno-equipe',
      colors: ['#ffb444ff', '#ff7300ff'],
      requiresOperational: true,
    },
    {
      id: 'sync',
      title: 'Sincronização',
      description: 'Atualizar dados do servidor',
      icon: 'sync',
      route: '/sync-data',
      colors: ['#4facfe', '#00f2fe'],
    },
    {
      id: 'reports',
      title: 'Relatórios',
      description: 'Em breve - Visualizar relatórios',
      icon: 'chart-bar',
      route: '#',
      colors: ['#43e97b', '#38f9d7'],
    },
  ];

  const filteredModules = modules.filter(
    module => !module.requiresOperational || user?.is_operacao
  );

  const handleModulePress = (route: string) => {
    if (route === '#') {
      return;
    }
    router.push(route as any);
  };

  const showInfoDialog = (message: string) => {
    setInfoDialogMessage(message);
    setInfoDialogVisible(true);
  };

  const showConfirmDialog = (title: string, description: string, onConfirm: () => void, confirmText: string = 'Confirmar') => {
    setConfirmDialogConfig({ title, description, onConfirm, confirmText });
    setConfirmDialogVisible(true);
  };

  const handleLogout = () => {
    setLogoutDialogVisible(true);
  };

  const confirmLogout = () => {
    setLogoutDialogVisible(false);
    logout();
  };

  const handleQuickChecklistCreate = async () => {
    try {
      const hasChecklistEstruturaItem = await checklistEstruturaItemsDb.getOneRow();
      const hasCentroCustoSynced = await centroCustoDb.getWithChecklistEstrutura();
      const dataSynced = !!(hasChecklistEstruturaItem && hasCentroCustoSynced && hasCentroCustoSynced.length > 0);

      if (!dataSynced) {
        showConfirmDialog(
          '📊 Dados não sincronizados',
          'É necessário sincronizar os dados antes de criar um checklist. Deseja ir para a tela de sincronização?',
          () => {
            setConfirmDialogVisible(false);
            router.push('/sync-data');
          },
          'Sincronizar'
        );
        return;
      }

      if (user?.is_operacao) {
        const hasTurno = await turnoDb.hasTodayTurno();

        if (!hasTurno) {
          showConfirmDialog(
            '⏰ Turno não iniciado',
            'É necessário abrir o turno do dia antes de criar um checklist. Deseja abrir o turno agora?',
            () => {
              setConfirmDialogVisible(false);
              router.push('/turno-equipe/create');
            },
            'Abrir Turno'
          );
          return;
        }
      }

      router.push('/checklist/create');
    } catch (error) {
      console.error('Erro ao validar requisitos:', error);
      showInfoDialog('❌ Erro\n\nOcorreu um erro ao validar os requisitos. Tente novamente.');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" translucent={false} />

      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerTop}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../../assets/images/geseg-logo-nobg.png')}
              style={styles.headerLogo}
              resizeMode="contain"
            />
          </View>
        </View>

        <View style={styles.userInfoContainer}>
          <View style={styles.userBadge}>
            <IconButton
              icon="logout"
              iconColor="#fff"
              size={18}
              onPress={handleLogout}
              style={styles.logoutButton}
            />
            <Text style={styles.userText} numberOfLines={1}>
              {user?.email}
            </Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.modulesGrid,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {filteredModules.map((module, index) => {
            const isDisabled = module.route === '#';
            const animatedStyle = {
              opacity: fadeAnim,
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 30],
                    outputRange: [0, 30 + (index * 10)],
                    extrapolate: 'clamp',
                  })
                }
              ]
            };

            return (
              <Animated.View
                key={module.id}
                style={[styles.cardWrapper, animatedStyle]}
              >
                <Pressable
                  onPress={() => handleModulePress(module.route)}
                  disabled={isDisabled}
                  style={({ pressed }) => [
                    styles.cardPressable,
                    pressed && !isDisabled && styles.cardPressed,
                    isDisabled && styles.cardDisabled,
                  ]}
                >
                  <LinearGradient
                    colors={isDisabled ? ['#cccccc', '#999999'] : module.colors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.cardGradient}
                  >
                    <View style={styles.cardContent}>
                      <View style={styles.iconContainer}>
                        <IconButton
                          icon={module.icon}
                          size={30}
                          iconColor="#ffffff"
                          style={styles.moduleIcon}
                        />
                      </View>

                      <View style={styles.cardTextContainer}>
                        <Text style={styles.cardTitle} numberOfLines={2}>
                          {module.title}
                        </Text>
                        <Text style={styles.cardDescription} numberOfLines={2}>
                          {module.description}
                        </Text>
                      </View>
                    </View>
                  </LinearGradient>
                </Pressable>
              </Animated.View>
            );
          })}
        </Animated.View>

        <View style={styles.footerSpacer} />
      </ScrollView>

      {/* Quick Action FAB */}
      <IconButton
        icon="plus"
        iconColor="#fff"
        mode="contained"
        style={styles.fabButton}
        size={40}
        onPress={handleQuickChecklistCreate}
      />

      {/* Dialogs */}
      <ConfirmDialog
        visible={logoutDialogVisible}
        title="🚪 Confirmar Logout"
        description="Ao sair, todos os dados não sincronizados serão deletados. Deseja continuar?"
        onConfirm={confirmLogout}
        onDismiss={() => setLogoutDialogVisible(false)}
        confirmText="Sair"
        cancelText="Cancelar"
        confirmColor="#e74c3c"
      />

      <ConfirmDialog
        visible={confirmDialogVisible}
        title={confirmDialogConfig.title}
        description={confirmDialogConfig.description}
        onConfirm={confirmDialogConfig.onConfirm}
        onDismiss={() => setConfirmDialogVisible(false)}
        confirmText={confirmDialogConfig.confirmText}
        cancelText="Cancelar"
      />

      <InfoDialog
        visible={infoDialogVisible}
        description={infoDialogMessage}
        onDismiss={() => setInfoDialogVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerContainer: {
    backgroundColor: '#667eea',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerLogo: {
    width: 140,
    height: 70,
    borderRadius: 8,
  },
  userInfoContainer: {
    alignItems: 'center',
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 0,
    borderRadius: 25,
  },
  userText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 25,
    elevation: 2,
    transform: [{ scaleX: -1 }],
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 100,
  },
  welcomeSection: {
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_SPACING,
    justifyContent: 'space-between',
  },
  cardWrapper: {
    width: CARD_WIDTH,
    marginBottom: 12,
  },
  cardPressable: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  cardDisabled: {
    opacity: 0.6,
  },
  cardGradient: {
    minHeight: 135,
    padding: 8,
    justifyContent: 'space-between',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  iconContainer: {
    marginBottom: 6,
  },
  moduleIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 16,
    margin: 0,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 6,
    lineHeight: 22,
  },
  cardDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 18,
  },
  chevronIcon: {
    alignSelf: 'flex-end',
    margin: 0,
    marginTop: 8,
  },
  footerSpacer: {
    height: 20,
  },
  fabButton: {
    position: 'absolute',
    right: 16,
    bottom: 40,
    borderRadius: 30,
    backgroundColor: '#0439c9',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
});

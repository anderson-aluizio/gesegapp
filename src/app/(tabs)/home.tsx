import { StyleSheet, View, ScrollView, Pressable, Dimensions, Image, Platform, StatusBar } from 'react-native';
import { Text, Surface, IconButton, Card } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect, useRef } from 'react';
import { Animated } from 'react-native';

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
      colors: ['#f093fb', '#f5576c'],
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
      return; // Módulo não disponível ainda
    }
    router.push(route as any);
  };

  const handleQuickChecklistCreate = async () => {
    router.push('/checklist/create');
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
              onPress={logout}
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
            styles.welcomeSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={styles.welcomeTitle}>Bem-vindo ao GESEG</Text>
          <Text style={styles.welcomeSubtitle}>
            Selecione um módulo para começar
          </Text>
        </Animated.View>

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
                          size={40}
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

                      {!isDisabled && (
                        <IconButton
                          icon="chevron-right"
                          size={20}
                          iconColor="rgba(255, 255, 255, 0.7)"
                          style={styles.chevronIcon}
                        />
                      )}
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
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 100,
  },
  welcomeSection: {
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
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
    minHeight: 180,
    padding: 16,
    justifyContent: 'space-between',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  iconContainer: {
    marginBottom: 12,
  },
  moduleIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 16,
    margin: 0,
  },
  cardTextContainer: {
    flex: 1,
    justifyContent: 'flex-end',
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

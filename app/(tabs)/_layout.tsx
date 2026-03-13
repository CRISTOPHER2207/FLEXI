import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// 🎨 NUEVA PALETA DE COLORES (Turquesa / Violeta / Negro)
export const COLORS = {
  bg: '#101010',          // Negro profundo
  navbarBg: '#181818',    // Fondo fijo del navbar (no flotante)
  // DEGRADADO TURQUESA-AZUL-VIOLETA
  gradient: ['#00E5FF', '#2979FF', '#AA00FF'],
  text: '#FFFFFF',
  textMuted: '#AAAAAA',
};

// Medidas del Navbar Fijo e Integrado
const TABS_COUNT = 4;
const SINGLE_TAB_WIDTH = width / TABS_COUNT;

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const translateX = useSharedValue(0);

  // 🔥 ANIMACIÓN ULTRARRÁPIDA: Ajustamos la física del resorte (spring)
  useEffect(() => {
    translateX.value = withSpring(state.index * SINGLE_TAB_WIDTH, {
      damping: 20,       // Menos amortiguación (rebotito más rápido)
      stiffness: 300,    // Mucho más rígido (reacción inmediata, sin demora)
      mass: 0.5,         // Menos masa (el objeto es más ligero y rápido)
    });
  }, [state.index]);

  const animatedIndicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    // Fijo abajo, no flotante. Borde curvo superior.
    <View style={[styles.navbarContainer, { paddingBottom: insets.bottom }]}>
      
      {/* Indicador de Línea Activa (Fast Spring) */}
      <Animated.View style={[styles.activeIndicatorLine, animatedIndicatorStyle, { width: SINGLE_TAB_WIDTH }]} />

      <View style={styles.tabsFlex}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          let iconName: keyof typeof Ionicons.glyphMap = 'cube-outline';
          if (route.name === 'reels') iconName = isFocused ? 'play-circle' : 'play-circle-outline';
          if (route.name === 'shop') iconName = isFocused ? 'shirt' : 'shirt-outline';
          if (route.name === 'outfit-creator') iconName = isFocused ? 'color-palette' : 'color-palette-outline';
          if (route.name === 'profile') iconName = isFocused ? 'person' : 'person-outline';

          return (
            <TouchableOpacity key={index} onPress={onPress} style={styles.tabItem} activeOpacity={1}>
              <Ionicons
                name={iconName}
                size={26}
                color={isFocused ? '#FFF' : COLORS.textMuted} // El ícono es blanco si está activo
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false, animation: 'fade' }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen name="reels" options={{ title: 'Feed' }} />
      <Tabs.Screen name="shop" options={{ title: 'Tienda' }} />
      <Tabs.Screen name="outfit-creator" options={{ title: 'Probar' }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  navbarContainer: {
    position: 'absolute',
    bottom: 0,
    width: width,
    backgroundColor: COLORS.navbarBg,
    borderTopLeftRadius: 35, // Curva superior para sofisticación, pero no flota
    borderTopRightRadius: 35,
    elevation: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.5, shadowRadius: 15,
  },
  tabsFlex: {
    flexDirection: 'row',
    height: 70,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  activeIndicatorLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 3,
    backgroundColor: '#00E5FF', // Color del degradado turquesa
    borderRadius: 3,
  },
});
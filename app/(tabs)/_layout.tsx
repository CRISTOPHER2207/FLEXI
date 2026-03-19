import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// 🎨 PALETA FLEXI: Turquesa -> Azul -> Violeta
export const COLORS = {
  bg: '#101010',          
  navbarBg: '#181818',    
  gradient: ['#00E5FF', '#2979FF', '#AA00FF'],
  text: '#FFFFFF',
  textMuted: '#AAAAAA',
  accent: '#00E5FF', 
};

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  
  // 🔥 FIX 1: Usar el Hook en lugar de Dimensions.get('window'). 
  // Esto obliga a React Native a actualizar el tamaño correctamente al abrir la app.
  const { width } = useWindowDimensions(); 
  
  // Calculamos el ancho aquí adentro
  const TAB_BAR_WIDTH = width - 40; 
  const TABS_COUNT = 5;
  const SINGLE_TAB_WIDTH = TAB_BAR_WIDTH / TABS_COUNT;

  const translateX = useSharedValue(0);

  useEffect(() => {
    translateX.value = withSpring(state.index * SINGLE_TAB_WIDTH, {
      damping: 20,       
      stiffness: 300,    
      mass: 0.5,         
    });
  }, [state.index, SINGLE_TAB_WIDTH]);

  const animatedIndicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const bottomPosition = Math.max(insets.bottom + 15, 25);

  return (
    // 🔥 FIX 2: collapsable={false} evita que Android desactive la caja táctil de este contenedor.
    <View 
      collapsable={false} 
      style={[styles.navbarContainer, { bottom: bottomPosition, width: TAB_BAR_WIDTH }]}
    >
      
      <Animated.View 
        pointerEvents="none" 
        style={[styles.activeIndicatorWrapper, animatedIndicatorStyle, { width: SINGLE_TAB_WIDTH }]}
      >
        <View style={styles.indicatorLine} />
      </Animated.View>

      {/* 🔥 FIX 3: También evitamos el colapso en el contenedor flex de los botones */}
      <View collapsable={false} style={styles.tabsFlex}>
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
          if (route.name === 'outfit-creator') iconName = isFocused ? 'color-palette' : 'color-palette-outline';
          if (route.name === 'combine') iconName = isFocused ? 'add-circle' : 'add-circle-outline';
          if (route.name === 'profile') iconName = isFocused ? 'person' : 'person-outline';
          if (route.name === 'index') iconName = isFocused ? 'shirt' : 'shirt-outline';

          return (
            <TouchableOpacity 
              key={index} 
              onPress={onPress} 
              style={styles.tabButton} 
              activeOpacity={0.6}
            >
              <Ionicons
                name={iconName}
                size={26}
                color={isFocused ? '#FFF' : COLORS.textMuted}
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
      screenOptions={{ 
        headerShown: false, 
        animation: 'fade',
      }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen name="reels" options={{ title: 'Feed' }} />
      <Tabs.Screen name="outfit-creator" options={{ title: 'Probar' }} />
      <Tabs.Screen name="combine" options={{ title: 'Crear' }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil' }} />
      <Tabs.Screen name="index" options={{ title: 'Tienda' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  navbarContainer: {
    position: 'absolute',
    left: 20, 
    // width se asigna de forma dinámica arriba
    height: 70, 
    backgroundColor: COLORS.navbarBg,
    borderRadius: 35, 
    elevation: 15,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 8 }, 
    shadowOpacity: 0.5, 
    shadowRadius: 15,
  },
  tabsFlex: {
    flex: 1, 
    flexDirection: 'row',
  },
  tabButton: {
    flex: 1, 
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent', 
  },
  activeIndicatorWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 4, 
    alignItems: 'center', 
  },
  indicatorLine: {
    width: 35, 
    height: 4,
    backgroundColor: COLORS.accent, 
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
});
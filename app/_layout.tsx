import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { openDatabaseSync } from 'expo-sqlite';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
// 🔥 1. IMPORTAMOS EL INYECTOR DE LA BASE DE DATOS
import { setupDatabase } from '../src/db/setup';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  // 🔥 2. INICIALIZAMOS LA BASE DE DATOS Y CARGAMOS CLOUDINARY
  useEffect(() => {
    const setupDB = () => {
      try {
        const db = openDatabaseSync('flexi_v1.db');
        db.execSync('PRAGMA foreign_keys = ON;');
        
        // Ejecutamos la inyección de tablas y prendas
        setupDatabase(db);
        
        console.log("💾 Database: Motor SQLite local iniciado y datos inyectados");
      } catch (e) {
        console.error("❌ Error al arrancar la base de datos:", e);
      }
    };

    setupDB();
  }, []);

  // Ocultamos el Splash Screen solo cuando las fuentes hayan cargado
  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) return null;

  return <RootLayoutNav />;
}

// 🔥 3. EL COMPONENTE DE NAVEGACIÓN (Lo que faltaba)
function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
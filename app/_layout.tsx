import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { openDatabaseSync } from 'expo-sqlite'; // 🔥 1. IMPORTAMOS EL MOTOR SQLITE
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';

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

  // 🔥 2. INICIALIZAMOS LA BASE DE DATOS DE FLEXI
  useEffect(() => {
    const setupDB = () => {
      try {
        // Abre (o crea si no existe) el archivo físico en el almacenamiento de la tablet
        const db = openDatabaseSync('flexi_v1.db');
        
        // Activamos las claves foráneas (necesario para relacionar Reels con Prendas)
        db.execSync('PRAGMA foreign_keys = ON;');
        
        console.log("💾 Database: Motor SQLite local iniciado correctamente");
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

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

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
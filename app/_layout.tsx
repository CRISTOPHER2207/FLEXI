import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import * as Linking from 'expo-linking';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';

// 🔥 IMPORTACIONES PARA AWS AMPLIFY
import { Amplify } from 'aws-amplify';
import 'react-native-get-random-values';

const redirectUri = Linking.createURL('/');
console.log("👉 URL DE REDIRECCIÓN REAL:", redirectUri);

// 🔥 CONFIGURACIÓN DE AWS COGNITO CON GOOGLE OAUTH
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'us-east-1_Y6T9GJioU', 
      userPoolClientId: '7u099tbugf5rcbojodvrt44trh', 
      loginWith: {
        oauth: {
          domain: 'us-east-1y6t9gjiou.auth.us-east-1.amazoncognito.com', 
          scopes: ['email', 'profile', 'openid'],
          redirectSignIn: [redirectUri, 'flexi://'],
          redirectSignOut: [redirectUri, 'flexi://'],
          responseType: 'code'
        }
      }
    }
  }
});

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(auth)', 
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) return null;

  return <RootLayoutNav />;
}

// 🔥 EL COMPONENTE DE NAVEGACIÓN GLOBAL
function RootLayoutNav() {
  const colorScheme = useColorScheme();

  // 🧹 Hemos limpiado el simulador de sesión que forzaba el redireccionamiento falso.
  // Ahora la navegación fluye naturalmente y confía en el código de tu login.tsx.

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Declaramos las dos zonas de Flexi y ocultamos las cabeceras */}
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
// 🔥 AGREGAMOS getCurrentUser y Hub
import { getCurrentUser, signIn, signInWithRedirect } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import { router } from 'expo-router';
// 🔥 AGREGAMOS useEffect
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const FLEXI_COLOR = '#1A1A1A';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // =====================================================================
  // 🕵️‍♂️ EL VIGILANTE: Escucha si hay sesiones activas o si volvemos de Google
  // =====================================================================
  useEffect(() => {
    // 1. Revisamos silenciosamente si el usuario ya estaba logueado
    checkCurrentUser();

    // 2. Escuchamos los eventos de autenticación (ej: cuando regresas de Google)
    const unsubscribe = Hub.listen('auth', ({ payload }) => {
      console.log("🔔 Evento de Auth detectado:", payload.event);
      
      if (payload.event === 'signedIn' || payload.event === 'signInWithRedirect') {
        console.log("✅ ¡Login por Google exitoso! Redirigiendo...");
        // 👇 CAMBIO AQUÍ
        router.replace('/(tabs)' as any); 
      }
    });

    return () => unsubscribe();
  }, []);

  const checkCurrentUser = async () => {
    try {
      const user = await getCurrentUser();
      console.log("👋 ¡Usuario ya estaba logueado! ID:", user.userId);
      // 👇 CAMBIO AQUÍ
      router.replace('/(tabs)' as any); 
    } catch (error) {
      console.log("⚪ No hay sesión activa, mostrando pantalla de login.");
    }
  };
  // =====================================================================

  const handleLogin = async () => {
    // Validar que los campos no estén vacíos
    if (!email || !password) {
      Alert.alert("Campos incompletos", "Por favor, ingresa tu correo y contraseña.");
      return;
    }

    setIsLoading(true);

    try {
      console.log("Iniciando sesión en AWS...");
      
      // Llamada a AWS Cognito
      const { isSignedIn, nextStep } = await signIn({
        username: email,
        password: password
      });

      if (isSignedIn) {
        // Redirigir a la aplicación principal
        router.replace('/'); 
      } else {
        console.log("Siguiente paso AWS:", nextStep);
        // Manejar casos especiales como cuando falta confirmar el email
        if (nextStep?.signInStep === 'CONFIRM_SIGN_UP') {
          Alert.alert("Verificación pendiente", "Por favor, revisa tu correo y verifica tu cuenta antes de iniciar sesión.");
          // Opcional: Aquí podrías mandarlo a router.push('/verify') como en el registro
        }
      }

    } catch (error: any) {
      console.error("Error al iniciar sesión", error);
      
      // Mensajes de error en español para los casos más comunes
      let errorMessage = "Ocurrió un error inesperado al intentar iniciar sesión.";
      if (error.name === 'NotAuthorizedException' || error.name === 'UserNotFoundException') {
        errorMessage = "Correo electrónico o contraseña incorrectos.";
      } else if (error.name === 'UserNotConfirmedException') {
        errorMessage = "Tu cuenta aún no está confirmada. Revisa tu correo electrónico.";
      }
      
      Alert.alert("Error de inicio de sesión", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      console.log("🚀 Intentando abrir la pasarela de Google...");
      await signInWithRedirect({ provider: 'Google' });
    } catch (error: any) {
      console.error("❌ Error al abrir Google:", error);
      Alert.alert("Error de Google", error.message || "No se pudo conectar con Google");
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={[styles.brandText, { color: FLEXI_COLOR }]}>FLEXI</Text>
        <Text style={styles.subtitle}>Tu armario, tu estilo.</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Correo electrónico"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity 
          style={[styles.primaryButton, { backgroundColor: FLEXI_COLOR, opacity: isLoading ? 0.7 : 1 }]} 
          onPress={handleLogin}
          disabled={isLoading}
        >
          <Text style={styles.primaryButtonText}>
            {isLoading ? "Cargando..." : "Iniciar Sesión"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin}>
          <Text style={styles.googleButtonText}>Continuar con Google</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>¿No tienes cuenta? </Text>
        <TouchableOpacity onPress={() => router.push('/register' as any)}>
          <Text style={[styles.linkText, { color: FLEXI_COLOR }]}>Regístrate</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', paddingHorizontal: 30, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 50 },
  brandText: { fontSize: 42, fontWeight: '800', letterSpacing: 2 },
  subtitle: { fontSize: 16, color: '#666', marginTop: 8 },
  form: { width: '100%' },
  input: { 
    backgroundColor: '#F5F5F5', 
    borderRadius: 12, 
    padding: 18, 
    marginBottom: 16, 
    fontSize: 16,
    color: '#333'
  },
  primaryButton: { borderRadius: 12, padding: 18, alignItems: 'center', marginTop: 10 },
  primaryButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  googleButton: { 
    borderRadius: 12, 
    padding: 18, 
    alignItems: 'center', 
    marginTop: 16, 
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0'
  },
  googleButtonText: { color: '#333', fontSize: 16, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 40 },
  footerText: { color: '#666', fontSize: 14 },
  linkText: { fontSize: 14, fontWeight: '700' }
});
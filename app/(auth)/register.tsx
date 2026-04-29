import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// 🔥 IMPORTACIÓN DE AWS AMPLIFY
import { confirmSignUp } from 'aws-amplify/auth';

const FLEXI_COLOR = '#1A1A1A';

export default function VerifyScreen() {
  // Recibimos el correo que nos mandó la pantalla de registro
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = async () => {
    if (!code) {
      Alert.alert("Código vacío", "Por favor ingresa el código numérico.");
      return;
    }

    setIsLoading(true);

    try {
      console.log("Verificando código en AWS...");
      
      const { isSignUpComplete } = await confirmSignUp({
        username: email as string,
        confirmationCode: code
      });

      if (isSignUpComplete) {
        Alert.alert(
          "¡Cuenta Activada!", 
          "Ya puedes iniciar sesión con tus credenciales.",
          [{ text: "Ir al Login", onPress: () => router.replace('/') }] // Asumiendo que '/' es tu login
        );
      }
    } catch (error: any) {
      console.error("Error al verificar:", error);
      let errorMessage = error.message;
      
      if (error.name === 'CodeMismatchException') {
        errorMessage = "El código es incorrecto. Por favor, revísalo.";
      } else if (error.name === 'ExpiredCodeException') {
        errorMessage = "El código ha expirado. Necesitas solicitar uno nuevo.";
      }
      
      Alert.alert("Error de verificación", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Verifica tu cuenta</Text>
        <Text style={styles.subtitle}>
          Ingresa el código de 6 dígitos que enviamos a:{'\n'}
          <Text style={{ fontWeight: 'bold', color: '#333' }}>{email}</Text>
        </Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Código de verificación"
          placeholderTextColor="#999"
          value={code}
          onChangeText={setCode}
          keyboardType="numeric"
          maxLength={6}
          textAlign="center"
        />

        <TouchableOpacity 
          style={[styles.primaryButton, { backgroundColor: FLEXI_COLOR, opacity: isLoading ? 0.7 : 1 }]} 
          onPress={handleVerify}
          disabled={isLoading}
        >
          <Text style={styles.primaryButtonText}>
            {isLoading ? "Verificando..." : "Confirmar Cuenta"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', paddingHorizontal: 30, justifyContent: 'center' },
  header: { marginBottom: 40, alignItems: 'center' },
  title: { fontSize: 32, fontWeight: '800', color: '#1A1A1A', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', lineHeight: 24 },
  form: { width: '100%' },
  input: { 
    backgroundColor: '#F5F5F5', 
    borderRadius: 12, 
    padding: 18, 
    marginBottom: 24, 
    fontSize: 24,
    letterSpacing: 8, // Da un pequeño espacio entre los números
    fontWeight: 'bold',
    color: '#333'
  },
  primaryButton: { borderRadius: 12, padding: 18, alignItems: 'center' },
  primaryButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
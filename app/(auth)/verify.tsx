import { confirmSignUp } from 'aws-amplify/auth';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Button, Text, TextInput, View } from 'react-native';

export default function VerifyScreen() {
  // Recibimos el email que pasamos desde la pantalla de registro
  const { email } = useLocalSearchParams(); 
  const [code, setCode] = useState('');

  const handleVerify = async () => {
    try {
      const { isSignUpComplete, nextStep } = await confirmSignUp({
        username: email as string,
        confirmationCode: code
      });

      if (isSignUpComplete) {
        Alert.alert("¡Éxito!", "Cuenta verificada correctamente.");
        // Lo mandamos al login para que entre con su nueva cuenta
        router.replace('/'); // O la ruta que sea tu pantalla de login
      }
    } catch (error) {
      Alert.alert("Error", "Código incorrecto o expirado.");
      console.log('Error verificando:', error);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text>Ingresa el código que enviamos a: {email}</Text>
      
      <TextInput
        placeholder="Código de 6 dígitos"
        value={code}
        onChangeText={setCode}
        keyboardType="numeric"
        style={{ borderWidth: 1, padding: 10, marginVertical: 20 }}
      />
      
      <Button title="Verificar Cuenta" onPress={handleVerify} />
    </View>
  );
}
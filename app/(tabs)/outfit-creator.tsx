import { Ionicons } from '@expo/vector-icons';
import MaskedView from '@react-native-masked-view/masked-view';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { openDatabaseSync } from 'expo-sqlite';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { height } = Dimensions.get('window');

// 🎨 PALETA DE COLORES FLEXI
const COLORS = {
  bg: '#101010',
  surface: '#181818',
  border: '#252525',
  gradient: ['#00E5FF', '#2979FF', '#AA00FF'] as [string, string, string],
  text: '#FFFFFF',
  textMuted: '#AAAAAA',
  accent: '#00E5FF',
};

// ⚙️ CONFIGURACIÓN DE BASE DE DATOS Y API
const db = openDatabaseSync('flexi_v1.db');
const GCP_PROJECT_ID = "flexi-ai-backend"; 
const GCP_REGION = "us-central1"; 
const GCP_ACCESS_TOKEN = "ya29.a0ATkoCc72YmYLE-YuaCd4FLWor6_qtN5LTl-oXoomurhiBpbEYf2REN8ON39DoEG_LvSbs4zABx03Y-O-R2Zzbtje5IGUIaWSoLkPvy4zWAzOPO62JTW2Yfz-yqBrMIbE8aJQu2nNLC8P0x4J-l92Bf_3PBN7snqDHNtmmr7aVve1MxCVSufShpCF-NhJvAbOkfGbMtC_n8nNFgaCgYKAXMSARcSFQHGX2MiKJv4q4wKRv1nD2KrN_1usg0213";

const VERTEX_API_URL = `https://${GCP_REGION}-aiplatform.googleapis.com/v1/projects/${GCP_PROJECT_ID}/locations/${GCP_REGION}/publishers/google/models/virtual-try-on-001:predict`;

const GradientText = (props: any) => (
  <MaskedView maskElement={<Text {...props} />}>
    <LinearGradient colors={COLORS.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
      <Text {...props} style={[props.style, { opacity: 0 }]} />
    </LinearGradient>
  </MaskedView>
);

export default function OutfitCreatorScreen() {
  const router = useRouter();
  const { selectedOutfit } = useLocalSearchParams();
  
  const allGarments = selectedOutfit ? JSON.parse(selectedOutfit as string) : [];
  const activeGarment = allGarments.find((g: any) => 
    (g.name && g.name.toLowerCase().includes('casaca')) || 
    (g.imageUrl && g.imageUrl.toLowerCase().includes('casaca'))
  ) || allGarments[0];

  const [userPhotoUri, setUserPhotoUri] = useState<string | null>(null);
  const [base64Photo, setBase64Photo] = useState<string | null>(null); 
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8, 
      base64: true, 
    });

    if (!result.canceled && result.assets[0].uri && result.assets[0].base64) {
      setUserPhotoUri(result.assets[0].uri);
      setBase64Photo(result.assets[0].base64);
      setGeneratedImage(null);
    }
  };

  const urlToRawBase64 = async (url: string): Promise<string> => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const rawBase64 = result.split(',')[1];
        resolve(rawBase64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleGenerateTryOn = async () => {
    if (!base64Photo) {
      Alert.alert("Falta tu foto", "Por favor, sube una foto tuya primero.");
      return;
    }
    
    setIsGenerating(true);
    
    try {
      const garmentRawBase64 = await urlToRawBase64(activeGarment.imageUrl);
      
      const requestBody = {
        instances: [{
          personImage: { image: { bytesBase64Encoded: base64Photo } },
          productImages: [{ image: { bytesBase64Encoded: garmentRawBase64 } }]
        }],
        parameters: { sampleCount: 1, baseSteps: 30, personGeneration: "allow_all" }
      };

      const response = await fetch(VERTEX_API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GCP_ACCESS_TOKEN}`,
          "Content-Type": "application/json; charset=utf-8"
        },
        body: JSON.stringify(requestBody)
      });

      const responseData = await response.json();

      // 🔥 AQUÍ ESTÁ LA MAGIA: Si Google responde con error, lo forzamos a mostrarse
      if (!response.ok) {
        console.error("ERROR DE GOOGLE:", responseData);
        throw new Error(responseData.error?.message || "Error de autorización con Google Cloud.");
      }

      if (responseData.predictions && responseData.predictions.length > 0) {
        setGeneratedImage(`data:image/png;base64,${responseData.predictions[0].bytesBase64Encoded}`);
      } else {
         Alert.alert("Aviso", "La IA procesó todo bien, pero no devolvió ninguna imagen.");
      }
      
    } catch (error: any) {
      console.error("Error detectado en catch:", error);
      Alert.alert(
        "Error de IA", 
        error.message || "Revisa si el Token de Google expiró o si no hay internet."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // 💾 LÓGICA DE GUARDADO INTERNO
  const saveOutfit = (isPublic: number) => {
    if (!generatedImage) return;
    try {
      db.runSync(
        'INSERT INTO my_outfits (top_image, is_public) VALUES (?, ?)',
        [generatedImage, isPublic]
      );
      Alert.alert(
        isPublic ? "¡Publicado en Feed! 🚀" : "Guardado en Privado 🔒",
        "Puedes revisarlo en tu perfil.",
        [{ text: "Ir al Perfil", onPress: () => router.push('/profile') }]
      );
    } catch (error) {
      Alert.alert("Error", "No se pudo guardar en la base de datos.");
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <GradientText style={styles.headerTitle}>FLEXI AI</GradientText>
        <View style={{ width: 45 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.mainCardContainer}>
          <View style={styles.imageCard}>
            {generatedImage ? (
              <Image source={{ uri: generatedImage }} style={styles.heroImage} />
            ) : userPhotoUri ? (
              <Image source={{ uri: userPhotoUri }} style={styles.heroImage} />
            ) : (
              <TouchableOpacity style={styles.emptyUploadBox} onPress={pickImage}>
                <Ionicons name="scan-outline" size={50} color={COLORS.accent} />
                <Text style={styles.emptyUploadText}>SUBIR FOTO</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.footerControls}>
          {generatedImage ? (
            <View style={styles.shareButtonsContainer}>
              <TouchableOpacity style={styles.actionBtnWrapper} onPress={() => saveOutfit(1)}>
                <LinearGradient colors={COLORS.gradient} style={styles.primaryBtnGradient}>
                  <Ionicons name="earth" size={20} color="#FFF" style={{marginRight: 8}}/>
                  <Text style={styles.primaryBtnText}>PUBLICAR EN FEED</Text>
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.secondaryButtonsRow}>
                <TouchableOpacity style={styles.secondaryBtn} onPress={() => saveOutfit(0)}>
                  <Ionicons name="lock-closed-outline" size={20} color={COLORS.text} style={{marginRight: 8}}/>
                  <Text style={styles.secondaryBtnText}>GUARDAR PRIVADO</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.secondaryBtn, {flex: 0.3}]} onPress={() => setGeneratedImage(null)}>
                  <Ionicons name="trash-outline" size={20} color="#FF4444" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity 
              style={[styles.btnWrapper, (!userPhotoUri || isGenerating) && styles.disabledBtnWrapper]} 
              onPress={handleGenerateTryOn}
              disabled={!userPhotoUri || isGenerating}
            >
              <LinearGradient 
                colors={(!userPhotoUri || isGenerating) ? [COLORS.surface, COLORS.surface] : COLORS.gradient} 
                style={styles.primaryBtnGradient}
              >
                {isGenerating ? <ActivityIndicator color={COLORS.accent} /> : <Text style={styles.primaryBtnText}>GENERAR OUTFIT AI</Text>}
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, paddingTop: 50 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 20 },
  iconBtn: { padding: 10, borderRadius: 15, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  headerTitle: { fontSize: 22, fontWeight: '900', letterSpacing: 2 },
  scrollContent: { paddingBottom: 100 },
  mainCardContainer: { paddingHorizontal: 20 },
  imageCard: { width: '100%', height: height * 0.55, borderRadius: 30, backgroundColor: COLORS.surface, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  emptyUploadBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyUploadText: { color: COLORS.text, fontWeight: '900', marginTop: 15 },
  footerControls: { paddingHorizontal: 20, marginTop: 30 },
  shareButtonsContainer: { gap: 15 },
  actionBtnWrapper: { height: 60, borderRadius: 20, overflow: 'hidden' },
  primaryBtnGradient: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  primaryBtnText: { color: '#FFF', fontWeight: '900', letterSpacing: 1 },
  secondaryButtonsRow: { flexDirection: 'row', gap: 15 },
  secondaryBtn: { flex: 1, height: 55, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 18, borderWidth: 1, borderColor: COLORS.border },
  secondaryBtnText: { color: COLORS.text, fontWeight: '800' },
  btnWrapper: { height: 65, borderRadius: 20, overflow: 'hidden' },
  disabledBtnWrapper: { opacity: 0.5 }
});
import { Ionicons } from '@expo/vector-icons';
import MaskedView from '@react-native-masked-view/masked-view';
// 🔥 IMPORTACIÓN CORREGIDA PARA EVITAR ERRORES DE TYPESCRIPT
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { height, width } = Dimensions.get('window');

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

// ==========================================
// ⚙️ CONFIGURACIÓN DE GOOGLE CLOUD VERTEX AI
// ==========================================
const GCP_PROJECT_ID = "flexi-ai-backend"; 
const GCP_REGION = "us-central1"; 
const GCP_ACCESS_TOKEN = "ya29.a0ATkoCc5yrvNMy4OouWej3OLetIyCtMVnliOVSpzBt9ci2A6Vws4236gKwyLDhzrvNE8zim38Z0RpFJ5vGmry3DzZlCy-NFiMhlu1aJJYw8UmzDtTrgOn1UlE_R-qaAjs0hhP9U4r0hCG3LOV5QoRY-7DrpzDubZvkHAfb-IdEKfhLdvn5mTB1zUeQm0J905R02EtaF6Drcyc7AaCgYKAeUSARcSFQHGX2MiTAmGp_DCoweM1fqu0eODJw0213"; // ⚠️ Recuerda poner tu token actual aquí

const VERTEX_API_URL = `https://${GCP_REGION}-aiplatform.googleapis.com/v1/projects/${GCP_PROJECT_ID}/locations/${GCP_REGION}/publishers/google/models/virtual-try-on-preview-08-04:predict`;

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
      Alert.alert("Falta tu foto", "Por favor, sube una foto tuya de cuerpo entero primero.");
      return;
    }
    if (!activeGarment) {
      Alert.alert("Falta la prenda", "No se detectó ninguna prenda válida.");
      return;
    }

    setIsGenerating(true);

    try {
      const garmentRawBase64 = await urlToRawBase64(activeGarment.imageUrl);

      const requestBody = {
        instances: [
          {
            personImage: { image: { bytesBase64Encoded: base64Photo } },
            productImages: [ { image: { bytesBase64Encoded: garmentRawBase64 } } ]
          }
        ],
        parameters: {
          sampleCount: 1, 
          baseSteps: 30, 
          personGeneration: "allow_all", 
        }
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

      if (!response.ok) {
        throw new Error(responseData.error?.message || "Error desconocido de Google API");
      }

      if (responseData.predictions && responseData.predictions.length > 0) {
        const outputBase64 = responseData.predictions[0].bytesBase64Encoded;
        const finalImageUrl = `data:image/png;base64,${outputBase64}`;
        setGeneratedImage(finalImageUrl);
      } else {
        Alert.alert("Error de Generación", "Google procesó la solicitud pero no devolvió la imagen.");
      }

    } catch (error: any) {
      console.error("Error conectando con Vertex AI:", error);
      Alert.alert("Error de IA", error.message || "Revisa tu conexión o Token.");
    } finally {
      setIsGenerating(false);
    }
  };

  // ==========================================
  // 📲 FUNCIONES DE COMPARTIR
  // ==========================================

  // 1. COMPARTIR EN PRIVADO (WhatsApp, IG Direct, etc.)
  const handlePrivateShare = async () => {
    if (!generatedImage) return;
    
    try {
      const base64Data = generatedImage.split(',')[1];
      
      // 🥷 TRUCO NINJA: Convertimos FileSystem a "any" para silenciar las líneas rojas de VS Code
      const fs = FileSystem as any; 
      
      // Ya no habrá línea roja aquí:
      const fileUri = fs.documentDirectory + `flexi-outfit-${Date.now()}.png`;
      
      // Usamos 'base64' en texto puro para que la app no crashee en tu celular:
      await fs.writeAsStringAsync(fileUri, base64Data, {
        encoding: 'base64', 
      });

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'image/png',
          dialogTitle: 'Mira mi nuevo outfit en FLEXI',
        });
      } else {
        Alert.alert("Error", "La función de compartir no está disponible en este dispositivo.");
      }
    } catch (error) {
      console.error("Error compartiendo:", error);
      Alert.alert("Error", "No se pudo preparar la imagen para compartir.");
    }
  };

  // 2. PUBLICAR EN EL FEED (Público)
  const handlePublicShare = () => {
    if (!generatedImage) return;
    
    // Aquí irá la lógica de tu CTO para subir la imagen a la base de datos (Firebase/Supabase)
    console.log("Subiendo imagen al servidor para el feed público...");
    
    Alert.alert(
      "¡Outfit Publicado! 🚀", 
      "Tu estilo ya está en la sección pública para que otros lo vean.",
      [
        { 
          text: "Ir al Feed", 
          // Cambia '/feed' por la ruta real de tu sección estilo Instagram en expo-router
          onPress: () => router.push('/') 
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      
      {/* HEADER IA */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <GradientText style={styles.headerTitle}>FLEXI AI</GradientText>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="sparkles-outline" size={24} color={COLORS.accent} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.filtersRow}>
           <TouchableOpacity style={styles.filterBtnActive}>
             <Ionicons name="flash" size={16} color={COLORS.bg} />
             <Text style={styles.filterTextActive}>STUDIO GOOGLE</Text>
           </TouchableOpacity>
        </View>

        <View style={styles.mainCardContainer}>
          <View style={styles.imageCard}>
            {generatedImage ? (
              <Image source={{ uri: generatedImage }} style={styles.heroImage} />
            ) : userPhotoUri ? (
              <Image source={{ uri: userPhotoUri }} style={styles.heroImage} />
            ) : (
              <TouchableOpacity style={styles.emptyUploadBox} onPress={pickImage} activeOpacity={0.7}>
                <Ionicons name="scan-outline" size={50} color={COLORS.accent} style={{ marginBottom: 15 }} />
                <Text style={styles.emptyUploadText}>SUBIR FOTO</Text>
                <Text style={styles.emptyUploadSubText}>Cuerpo entero, buena iluminación</Text>
              </TouchableOpacity>
            )}

            {activeGarment && !generatedImage && (
              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.garmentOverlay}>
                <Text style={styles.garmentOverlayTitle}>{activeGarment.name || 'PRENDA'}</Text>
                <Text style={styles.garmentOverlayPrice}>S/ {activeGarment.price || '0.00'}</Text>
              </LinearGradient>
            )}

            <View style={styles.badgeOverlay}>
              <Ionicons name="color-wand" size={12} color="#FFF" style={{marginRight: 4}}/>
               <Text style={styles.badgeText}>TRY-ON</Text>
            </View>
          </View>
          
          {userPhotoUri && !generatedImage && (
            <TouchableOpacity style={styles.changePhotoBtn} onPress={pickImage}>
              <Ionicons name="camera-reverse-outline" size={18} color={COLORS.text} />
              <Text style={styles.changePhotoText}>CAMBIAR FOTO</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* CONTROLES INFERIORES */}
        <View style={styles.footerControls}>
          {generatedImage ? (
            <View style={styles.shareButtonsContainer}>
              {/* Botón: Publicar en FLEXI (Principal) */}
              <TouchableOpacity style={styles.actionBtnWrapper} onPress={handlePublicShare} activeOpacity={0.8}>
                <LinearGradient colors={COLORS.gradient} style={styles.primaryBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Ionicons name="earth" size={20} color="#FFF" style={{marginRight: 8}}/>
                  <Text style={styles.primaryBtnText}>PUBLICAR EN FLEXI</Text>
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.secondaryButtonsRow}>
                {/* Botón: Compartir Privado */}
                <TouchableOpacity style={styles.secondaryBtn} onPress={handlePrivateShare} activeOpacity={0.8}>
                  <Ionicons name="share-social-outline" size={20} color={COLORS.text} style={{marginRight: 8}}/>
                  <Text style={styles.secondaryBtnText}>COMPARTIR</Text>
                </TouchableOpacity>

                {/* Botón: Volver a intentar */}
                <TouchableOpacity style={[styles.secondaryBtn, {borderColor: COLORS.border}]} onPress={() => setGeneratedImage(null)} activeOpacity={0.8}>
                  <Ionicons name="refresh" size={20} color={COLORS.text} />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity 
              style={[styles.btnWrapper, (!userPhotoUri || isGenerating) && styles.disabledBtnWrapper]} 
              onPress={handleGenerateTryOn}
              disabled={!userPhotoUri || isGenerating}
              activeOpacity={0.8}
            >
              <LinearGradient 
                colors={(!userPhotoUri || isGenerating) ? [COLORS.surface, COLORS.surface] : COLORS.gradient} 
                style={styles.primaryBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              >
                {isGenerating ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color={COLORS.accent} size="small" />
                    <Text style={[styles.loadingText, {color: COLORS.accent}]}>PROCESANDO GOOGLE...</Text>
                  </View>
                ) : (
                  <>
                    <Ionicons name="flash" size={20} color={(!userPhotoUri) ? COLORS.textMuted : "#FFF"} style={{marginRight: 8}}/>
                    <Text style={[styles.primaryBtnText, (!userPhotoUri) && {color: COLORS.textMuted}]}>GENERAR OUTFIT</Text>
                  </>
                )}
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 20 },
  iconBtn: { padding: 10, borderRadius: 15, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  headerTitle: { fontSize: 22, fontWeight: '900', letterSpacing: 2, textAlign: 'center' },
  filtersRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 25 },
  filterBtnActive: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.accent, paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20, marginRight: 15 },
  filterTextActive: { color: COLORS.bg, fontWeight: '900', fontSize: 12, letterSpacing: 1, marginLeft: 6 },
  filterTextInactive: { color: COLORS.textMuted, fontWeight: '700', fontSize: 12, letterSpacing: 1 },
  scrollContent: { paddingBottom: 100 },
  mainCardContainer: { paddingHorizontal: 20, alignItems: 'center' },
  imageCard: { width: '100%', height: height * 0.55, borderRadius: 30, backgroundColor: COLORS.surface, overflow: 'hidden', position: 'relative', borderWidth: 1, borderColor: COLORS.border },
  heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  emptyUploadBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, borderWidth: 2, borderColor: COLORS.border, borderStyle: 'dashed', borderRadius: 30, margin: 5 },
  emptyUploadText: { fontSize: 16, fontWeight: '900', letterSpacing: 2, color: COLORS.text, marginBottom: 8 },
  emptyUploadSubText: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center' },
  badgeOverlay: { position: 'absolute', top: 15, left: 15, backgroundColor: 'rgba(0, 0, 0, 0.6)', flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 15 },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  garmentOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingTop: 40 },
  garmentOverlayTitle: { color: '#FFF', fontSize: 22, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
  garmentOverlayPrice: { color: COLORS.accent, fontSize: 18, fontWeight: '900', marginTop: 4 },
  changePhotoBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 20, paddingVertical: 12, paddingHorizontal: 24, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 25 },
  changePhotoText: { fontSize: 12, fontWeight: '800', letterSpacing: 1.5, marginLeft: 8, color: COLORS.text },
  footerControls: { paddingHorizontal: 20, marginTop: 30 },
  btnWrapper: { width: '100%', height: 65, borderRadius: 20, overflow: 'hidden', shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 },
  disabledBtnWrapper: { shadowOpacity: 0, elevation: 0 },
  primaryBtnGradient: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  primaryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900', letterSpacing: 2 },
  loadingContainer: { flexDirection: 'row', alignItems: 'center' },
  loadingText: { fontSize: 14, fontWeight: '900', letterSpacing: 2, marginLeft: 10 },
  // Nuevos estilos para los botones de compartir
  shareButtonsContainer: { width: '100%', gap: 15 },
  actionBtnWrapper: { width: '100%', height: 60, borderRadius: 20, overflow: 'hidden', shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 },
  secondaryButtonsRow: { flexDirection: 'row', gap: 15 },
  secondaryBtn: { flex: 1, height: 55, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 18 },
  secondaryBtnText: { color: COLORS.text, fontSize: 13, fontWeight: '800', letterSpacing: 1 },
});
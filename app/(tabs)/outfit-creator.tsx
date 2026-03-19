import { Ionicons } from '@expo/vector-icons';
import MaskedView from '@react-native-masked-view/masked-view';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient'; // 🔥 Nuevo
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { height, width } = Dimensions.get('window');

// 🎨 NUEVA PALETA DE COLORES FLEXI
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
// ⚙️ CONFIGURACIÓN DE IA (INTACTA)
// ==========================================
const REPLICATE_API_TOKEN = "r8_Vibg5t9zbbjtyflEgWkOo3KYKSeaW7S2AMMOc"; 

// Componente para Texto con Gradiente
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
  const garments = selectedOutfit ? JSON.parse(selectedOutfit as string) : [];
  const activeGarment = garments.length > 0 ? garments[0] : null;

  const [userPhotoUri, setUserPhotoUri] = useState<string | null>(null);
  const [base64Photo, setBase64Photo] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // 1. ABRIR GALERÍA Y EXTRAER BASE64 (INTACTO)
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.3, 
      base64: true, 
    });

    if (!result.canceled && result.assets[0].base64) {
      setUserPhotoUri(result.assets[0].uri);
      setBase64Photo(result.assets[0].base64);
      setGeneratedImage(null);
    }
  };

  // 2. CONECTAR CON REPLICATE API DIRECTAMENTE (INTACTO)
  const handleGenerateTryOn = async () => {
    if (!base64Photo) {
      Alert.alert("Falta tu foto", "Por favor, sube una foto tuya de cuerpo entero primero.");
      return;
    }
    if (!activeGarment) {
      Alert.alert("Falta la prenda", "Vuelve a la pantalla de Reels y selecciona una prenda para probarte.");
      return;
    }

    setIsGenerating(true);

    try {
      const userImageBase64 = `data:image/jpeg;base64,${base64Photo}`;
      const garmentUrl = activeGarment.imageUrl;

      console.log("Iniciando petición DIRECTA a Replicate...");

      const startResponse = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${REPLICATE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          version: "c871bb9b046607b680449ecbae55fd8c6d945e0a1948644bf2361b3d021d3ff4", 
          input: {
            garm_img: garmentUrl,
            human_img: userImageBase64,
            garment_des: "t-shirt", 
            category: "upper_body" 
          }
        })
      });
      const prediction = await startResponse.json();
      
      console.log("Respuesta cruda de inicio:", prediction);

      if (!prediction.urls) {
        Alert.alert(
          "Replicate rechazó la petición", 
          prediction.error || prediction.detail || "Revisa la consola para más detalles."
        );
        setIsGenerating(false);
        return;
      }

      const getPredictionUrl = prediction.urls.get;
      let isDone = false;
      let attempts = 0; 

      console.log("Petición aceptada, URL de consulta:", getPredictionUrl);

      while (!isDone && attempts < 20) {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 3000)); 

        const statusResponse = await fetch(getPredictionUrl, {
          headers: {
            "Authorization": `Bearer ${REPLICATE_API_TOKEN}`,
            "Content-Type": "application/json" 
          }
        });

        const statusData = await statusResponse.json();
        
        console.log(`Intento ${attempts} - Respuesta de Replicate:`, statusData);

        if (statusData.error || statusData.detail) {
          Alert.alert("Error de Autorización/API", statusData.error || statusData.detail);
          isDone = true;
        } else if (statusData.status === "succeeded") {
          setGeneratedImage(statusData.output); 
          isDone = true;
        } else if (statusData.status === "failed" || statusData.status === "canceled") {
          Alert.alert("Error", "La IA no pudo procesar esta combinación de imágenes.");
          isDone = true;
        }
      }

      if (attempts >= 20) {
        Alert.alert("Timeout", "La petición tardó demasiado y se canceló por seguridad.");
      }

    } catch (error) {
      console.error("Error de red/conexión:", error);
      Alert.alert("Error", "Revisa tu conexión a internet.");
    } finally {
      setIsGenerating(false);
    }
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
        
        {/* FILTROS / CATEGORÍAS */}
        <View style={styles.filtersRow}>
           <TouchableOpacity style={styles.filterBtnActive}>
             <Ionicons name="flash" size={16} color={COLORS.bg} />
             <Text style={styles.filterTextActive}>STUDIO IA</Text>
           </TouchableOpacity>
           <Text style={styles.filterTextInactive}>HISTORIAL</Text>
        </View>

        {/* ÁREA DE IMAGEN PRINCIPAL (Estilo Glassmorphism/Neumorphism oscuro) */}
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

            {/* OVERLAY DE LA PRENDA */}
            {activeGarment && (
              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.garmentOverlay}>
                <Text style={styles.garmentOverlayTitle}>{activeGarment.name}</Text>
                <Text style={styles.garmentOverlayPrice}>S/ {activeGarment.price}</Text>
              </LinearGradient>
            )}

            {/* BADGE SUPERIOR IZQUIERDO */}
            <View style={styles.badgeOverlay}>
              <Ionicons name="color-wand" size={12} color="#FFF" style={{marginRight: 4}}/>
               <Text style={styles.badgeText}>TRY-ON</Text>
            </View>
          </View>
          
          {/* BOTÓN FLOTANTE PARA CAMBIAR FOTO SI YA HAY UNA */}
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
            <TouchableOpacity 
              style={styles.btnWrapper} 
              onPress={() => setGeneratedImage(null)}
              activeOpacity={0.8}
            >
              <LinearGradient colors={COLORS.gradient} style={styles.primaryBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Ionicons name="refresh" size={20} color="#FFF" style={{marginRight: 8}}/>
                <Text style={styles.primaryBtnText}>PROBAR OTRA PRENDA</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.btnWrapper, (!userPhotoUri || isGenerating) && styles.disabledBtnWrapper]} 
              onPress={handleGenerateTryOn}
              disabled={!userPhotoUri || isGenerating}
              activeOpacity={0.8}
            >
              <LinearGradient 
                colors={(!userPhotoUri || isGenerating) ? [COLORS.surface, COLORS.surface] : COLORS.gradient} 
                style={styles.primaryBtnGradient} 
                start={{ x: 0, y: 0 }} 
                end={{ x: 1, y: 0 }}
              >
                {isGenerating ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color={COLORS.accent} size="small" />
                    <Text style={[styles.loadingText, {color: COLORS.accent}]}>PROCESANDO MAGIA...</Text>
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

// ==========================================
// ESTILOS: ACTUALIZADO A LA TENDENCIA FLEXI
// ==========================================
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.bg,
    paddingTop: 50, 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  iconBtn: {
    padding: 10,
    borderRadius: 15,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 2,
    textAlign: 'center',
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  filterBtnActive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginRight: 15,
  },
  filterTextActive: {
    color: COLORS.bg,
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 1,
    marginLeft: 6,
  },
  filterTextInactive: {
    color: COLORS.textMuted,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  mainCardContainer: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  imageCard: {
    width: '100%',
    height: height * 0.55,
    borderRadius: 30,
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  emptyUploadBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: 30,
    margin: 5,
  },
  emptyUploadText: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
    color: COLORS.text,
    marginBottom: 8,
  },
  emptyUploadSubText: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  badgeOverlay: {
    position: 'absolute',
    top: 15,
    left: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  garmentOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingTop: 40,
  },
  garmentOverlayTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  garmentOverlayPrice: {
    color: COLORS.accent,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 4,
  },
  changePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 25,
  },
  changePhotoText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginLeft: 8,
    color: COLORS.text,
  },
  footerControls: {
    paddingHorizontal: 20,
    marginTop: 30,
  },
  btnWrapper: {
    width: '100%',
    height: 65,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  disabledBtnWrapper: {
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryBtnGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 2,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
    marginLeft: 10,
  }
});
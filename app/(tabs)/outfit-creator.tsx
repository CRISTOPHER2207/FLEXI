import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { height, width } = Dimensions.get('window');

// ==========================================
// ⚙️ CONFIGURACIÓN DE IA
// ==========================================
const REPLICATE_API_TOKEN = "r8_Vibg5t9zbbjtyflEgWkOo3KYKSeaW7S2AMMOc"; 

export default function OutfitCreatorScreen() {
  const router = useRouter();
  const { selectedOutfit } = useLocalSearchParams();
  const garments = selectedOutfit ? JSON.parse(selectedOutfit as string) : [];
  const activeGarment = garments.length > 0 ? garments[0] : null;

  const [userPhotoUri, setUserPhotoUri] = useState<string | null>(null);
  const [base64Photo, setBase64Photo] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // 1. ABRIR GALERÍA Y EXTRAER BASE64
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

  // 2. CONECTAR CON REPLICATE API DIRECTAMENTE
  const handleGenerateTryOn = async () => {
    
    // 🔥 VALIDACIONES DE UX: Avisamos al usuario si falta algo
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

      // 🔥 PRIMER FETCH: Sin corsproxy (Conexión nativa directa)
      // 🔥 LA NUEVA ESTRUCTURA QUE ENCONTRASTE (Apunta al probador de ropa)
      const startResponse = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${REPLICATE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // Este código larguísimo es la "llave" exacta del modelo IDM-VTON
          version: "c871bb9b046607b680449ecbae55fd8c6d945e0a1948644bf2361b3d021d3ff4", 
          input: {
            garm_img: garmentUrl,
            human_img: userImageBase64,
            garment_des: "t-shirt", // Mejor poner t-shirt para polos
            category: "upper_body" 
          }
        })
      });
      const prediction = await startResponse.json();
      
      // 🔥 NUEVO LOG PARA VER EL PORTAZO EXACTO DE REPLICATE
      console.log("Respuesta cruda de inicio:", prediction);

      // Nueva validación a prueba de balas
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

      // Consultamos el estado cada 3 segundos, máximo 20 veces (1 minuto)
      while (!isDone && attempts < 20) {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 3000)); 

        // 🔥 SEGUNDO FETCH: Sin corsproxy (Conexión nativa directa)
        const statusResponse = await fetch(getPredictionUrl, {
          headers: {
            "Authorization": `Bearer ${REPLICATE_API_TOKEN}`,
            "Content-Type": "application/json" 
          }
        });

        const statusData = await statusResponse.json();
        
        console.log(`Intento ${attempts} - Respuesta de Replicate:`, statusData);

        // Evaluamos la respuesta
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
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      
      {/* HEADER TIPO QUANTUMPULSE */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="grid-outline" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>FLEXI{'\n'}FASHION</Text>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="search-outline" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* FILTROS / CATEGORÍAS */}
        <View style={styles.filtersRow}>
           <TouchableOpacity style={styles.filterBtnActive}>
             <Ionicons name="options-outline" size={20} color="#FFF" />
           </TouchableOpacity>
           <Text style={styles.filterTextActive}>NEW RELEASES</Text>
           <Text style={styles.filterTextInactive}>MOST VIEWED</Text>
        </View>

        {/* ÁREA DE IMAGEN PRINCIPAL (Estilo Tarjeta Elevada) */}
        <View style={styles.mainCardContainer}>
          <View style={styles.imageCard}>
            {generatedImage ? (
              <Image source={{ uri: generatedImage }} style={styles.heroImage} />
            ) : userPhotoUri ? (
              <Image source={{ uri: userPhotoUri }} style={styles.heroImage} />
            ) : (
              <TouchableOpacity style={styles.emptyUploadBox} onPress={pickImage}>
                <Ionicons name="camera" size={40} color="#FF5722" style={{ marginBottom: 15 }} />
                <Text style={styles.emptyUploadText}>UPLOAD PHOTO</Text>
                <Text style={styles.emptyUploadSubText}>Full body, clear lighting</Text>
              </TouchableOpacity>
            )}

            {/* OVERLAY DE LA PRENDA */}
            {activeGarment && (
              <View style={styles.garmentOverlay}>
                <Text style={styles.garmentOverlayTitle}>{activeGarment.name}</Text>
                <Text style={styles.garmentOverlayPrice}>S/ {activeGarment.price}</Text>
              </View>
            )}

            {/* BADGE SUPERIOR IZQUIERDO */}
            <View style={styles.badgeOverlay}>
               <Text style={styles.badgeText}>TRY-ON</Text>
            </View>
          </View>
          
          {/* BOTÓN FLOTANTE PARA CAMBIAR FOTO SI YA HAY UNA */}
          {userPhotoUri && !generatedImage && (
            <TouchableOpacity style={styles.changePhotoBtn} onPress={pickImage}>
              <Ionicons name="refresh-outline" size={18} color="#FFF" />
              <Text style={styles.changePhotoText}>CHANGE PHOTO</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* CONTROLES INFERIORES */}
        <View style={styles.footerControls}>
          {generatedImage ? (
            <TouchableOpacity 
              style={styles.primaryBtn} 
              onPress={() => setGeneratedImage(null)}
            >
              <Text style={styles.primaryBtnText}>TRY ANOTHER ITEM</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.primaryBtn, (!userPhotoUri || isGenerating) && styles.disabledBtn]} 
              onPress={handleGenerateTryOn}
              disabled={!userPhotoUri || isGenerating}
            >
              {isGenerating ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="#FFF" size="small" />
                  <Text style={styles.loadingText}>PROCESSING FIT...</Text>
                </View>
              ) : (
                <Text style={styles.primaryBtnText}>GENERATE OUTFIT</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ==========================================
// ESTILOS: DARK MODE & ELEGANCIA TECNOLÓGICA
// ==========================================
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#121212',
    paddingTop: 50, 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  iconBtn: {
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2,
    color: '#FFF',
    textAlign: 'center',
    lineHeight: 24,
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  filterBtnActive: {
    backgroundColor: '#2A2A2A',
    padding: 10,
    borderRadius: 12,
    marginRight: 15,
  },
  filterTextActive: {
    color: '#FF5722',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 1,
    marginRight: 15,
  },
  filterTextInactive: {
    color: '#888',
    fontWeight: '700',
    fontSize: 13,
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
    borderRadius: 32,
    backgroundColor: '#1E1E1E',
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#2A2A2A',
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
  },
  emptyUploadText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
    color: '#FFF',
    marginBottom: 8,
  },
  emptyUploadSubText: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
  },
  badgeOverlay: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  garmentOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  garmentOverlayTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  garmentOverlayPrice: {
    color: '#FF5722',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
  changePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#2A2A2A',
    borderRadius: 20,
  },
  changePhotoText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginLeft: 8,
    color: '#FFF',
  },
  footerControls: {
    paddingHorizontal: 20,
    marginTop: 30,
  },
  primaryBtn: {
    backgroundColor: '#FF5722',
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    borderRadius: 20,
    shadowColor: '#FF5722',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  disabledBtn: {
    backgroundColor: '#2A2A2A',
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
    marginLeft: 10,
  }
});
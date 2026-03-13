import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native'; // 🔥 1. IMPORTAMOS ESTO
import { ResizeMode, Video } from 'expo-av';
import { useRouter } from 'expo-router';
import { openDatabaseSync } from 'expo-sqlite';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { height, width } = Dimensions.get('window');

// Altura ajustada
const REEL_HEIGHT = height - 80; 

export default function ReelsScreen() {
  const router = useRouter();
  const [reelsData, setReelsData] = useState<any[]>([]);
  
  // 🔥 2. CONTROLADORES DE REPRODUCCIÓN
  const isFocused = useIsFocused(); // ¿El usuario está en esta pestaña ahora mismo?
  const [currentIndex, setCurrentIndex] = useState(0); // ¿Qué video específico está viendo?

  // Detecta cuál video está enfocado al hacer scroll
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50, // Se activa si al menos el 50% del video es visible
  }).current;

  // 3. OBTENER DATOS DE LA BASE DE DATOS
  useEffect(() => {
    const fetchReels = () => {
      try {
        const db = openDatabaseSync('flexi_v1.db');
        const reels = db.getAllSync('SELECT * FROM reels');
        
        const reelsWithGarments = reels.map((reel: any) => {
          const garments = db.getAllSync(`
            SELECT garments.* FROM garments 
            JOIN reel_garments ON garments.id = reel_garments.garment_id 
            WHERE reel_garments.reel_id = ?
          `, [reel.id]);

          const formattedGarments = garments.map((g: any) => ({
            id: g.id,
            name: g.name,
            imageUrl: g.image_url, 
            category: g.category,
            price: g.price
          }));

          return { ...reel, garments: formattedGarments };
        });

        setReelsData(reelsWithGarments);
      } catch (error) {
        console.error("Error leyendo la base de datos:", error);
      }
    };

    fetchReels();
  }, []);

  const handleTryOutfit = (garments: any[]) => {
    router.push({
      pathname: "/outfit-creator",
      params: { selectedOutfit: JSON.stringify(garments) }
    });
  };

  // 4. RENDERIZAR CADA REEL INDIVIDUAL (Añadimos el "index")
  const renderItem = ({ item, index }: { item: any, index: number }) => {
    // 🔥 LA MAGIA: Solo reproduce si la pestaña está enfocada Y si es el video actual
    const isPlaying = isFocused && currentIndex === index;

    return (
      <View style={styles.reelContainer}>
        {/* Reproductor de Video */}
        <Video
          source={{ uri: item.video_url }}
          style={styles.video}
          shouldPlay={isPlaying} // <--- CONTROLADO DINÁMICAMENTE
          isLooping
          resizeMode={ResizeMode.COVER}
        />

        <View style={styles.overlay} />

        {/* Botones Laterales */}
        <View style={styles.sideControls}>
          <TouchableOpacity style={styles.controlBtn}>
            <Ionicons name="heart" size={32} color="#FFF" />
            <Text style={styles.controlText}>1.2k</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlBtn}>
            <Ionicons name="chatbubble-ellipses" size={30} color="#FFF" />
            <Text style={styles.controlText}>45</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlBtn}>
            <Ionicons name="bookmark" size={30} color="#FFF" />
            <Text style={styles.controlText}>Guardar</Text>
          </TouchableOpacity>
        </View>

        {/* Controles Inferiores */}
        <View style={styles.bottomControls}>
          <Text style={styles.description}>{item.description}</Text>
          <Text style={styles.garmentTitle}>PRENDAS EN ESTE VIDEO:</Text>
          
          <FlatList
            horizontal
            data={item.garments}
            keyExtractor={(g) => g.id.toString()}
            showsHorizontalScrollIndicator={false}
            style={styles.garmentList}
            renderItem={({ item: garment }) => (
              <View style={styles.garmentCard}>
                <Image source={{ uri: garment.imageUrl }} style={styles.garmentImage} />
                <View style={styles.garmentInfo}>
                  <Text style={styles.garmentName} numberOfLines={1}>{garment.name}</Text>
                  <Text style={styles.garmentPrice}>S/ {garment.price}</Text>
                </View>
              </View>
            )}
          />

          {/* EL BOTÓN MÁGICO (Actualizado a Verde) */}
          <TouchableOpacity 
            style={styles.tryOnButton}
            onPress={() => handleTryOutfit(item.garments)}
          >
            <Ionicons name="shirt-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.tryOnText}>PROBAR OUTFIT</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {reelsData.length > 0 ? (
        <FlatList
          data={reelsData}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          snapToInterval={REEL_HEIGHT}
          snapToAlignment="start"
          decelerationRate="fast"
          // 🔥 DETECTAMOS EL SCROLL AQUÍ
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
        />
      ) : (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando Colección...</Text>
        </View>
      )}
    </View>
  );
}

// ESTILOS ACTUALIZADOS A LA PALETA "DARK URBAN GREEN"
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#101010' },
  loadingText: { color: '#4CAF50', fontSize: 16, fontWeight: 'bold', letterSpacing: 2 },
  reelContainer: { width: width, height: REEL_HEIGHT, position: 'relative' },
  video: { width: '100%', height: '100%' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
  sideControls: { position: 'absolute', right: 15, bottom: 150, alignItems: 'center' },
  controlBtn: { alignItems: 'center', marginBottom: 20 },
  controlText: { color: '#FFF', fontSize: 12, fontWeight: 'bold', marginTop: 5 },
  bottomControls: { position: 'absolute', bottom: 20, left: 15, right: 70 },
  description: { color: '#FFF', fontSize: 16, fontWeight: '600', marginBottom: 15, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 },
  garmentTitle: { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 8 },
  garmentList: { marginBottom: 15 },
  garmentCard: { flexDirection: 'row', backgroundColor: 'rgba(30,30,30,0.8)', borderRadius: 12, padding: 6, marginRight: 10, alignItems: 'center', width: 160, borderWidth: 1, borderColor: '#333' },
  garmentImage: { width: 40, height: 40, borderRadius: 8, marginRight: 8 },
  garmentInfo: { flex: 1 },
  garmentName: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  garmentPrice: { color: '#4CAF50', fontSize: 11, fontWeight: '900' },
  tryOnButton: { flexDirection: 'row', backgroundColor: '#2E7D32', paddingVertical: 14, borderRadius: 30, justifyContent: 'center', alignItems: 'center', shadowColor: '#4CAF50', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 5, elevation: 6 },
  tryOnText: { color: '#FFF', fontSize: 14, fontWeight: '900', letterSpacing: 2 }
});
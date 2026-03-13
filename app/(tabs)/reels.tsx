import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router'; // <-- Importamos useFocusEffect
import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useCallback } from 'react'; // <-- Importamos useCallback
import { Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { height, width } = Dimensions.get('window');

// ==========================================
// 1. TUS DATOS REALES (VIDEO Y ROPA)
// ==========================================
const reelsData = [
  {
    id: '1',
    description: 'Mi primer drop exclusivo Flexi 🔥',
    videoSource: require('../../assets/videos/reels/reel1.mp4'), 
    outfit: [
      { 
        id: 'p1', 
        name: 'Mi Polo Oversized', 
        price: '89.00',
        imageUrl: 'https://i.postimg.cc/z3m1Vv48/Gemini_Generated_Image_i2dlcbi2dlcbi2dl.png' // Recuerda cambiar esto por el enlace directo .jpg
      }
    ]
  }
];

// ==========================================
// 2. REPRODUCTOR DE VIDEO
// ==========================================
const ReelItem = ({ item }: { item: any }) => {
  const router = useRouter();
  
  // 1. Cargamos el video y lo ponemos en bucle
  const player = useVideoPlayer(item.videoSource, player => {
    player.loop = true;
  });

  // 2. 🔥 LÓGICA DE FOCO: Se reproduce al entrar, se pausa al salir
  useFocusEffect(
    useCallback(() => {
      // Cuando la pantalla está activa (el usuario la está viendo)
      player.play();

      return () => {
        // Cuando el usuario se va a otra pestaña (clean up)
        player.pause();
      };
    }, [player])
  );

  // Función que envía los datos y PAUSA el video al ir al probador
  const goToProbador = () => {
    player.pause(); // Pausa instantánea al hacer clic
    router.push({
      pathname: '/(tabs)/outfit-creator',
      params: { selectedOutfit: JSON.stringify(item.outfit) }
    });
  };

  return (
    <View style={styles.videoContainer}>
      {/* El reproductor de video real */}
      <VideoView style={styles.video} player={player} nativeControls={false} />
      
      {/* La información sobre el video */}
      <View style={styles.overlay}>
        <Text style={styles.description}>{item.description}</Text>
        <TouchableOpacity style={styles.tryBtn} onPress={goToProbador}>
          <Text style={styles.tryBtnText}>Probar Outfit</Text>
          <Ionicons name="shirt-outline" size={18} color="black" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ==========================================
// 3. LA PANTALLA PRINCIPAL
// ==========================================
export default function ReelsScreen() {
  return (
    <View style={styles.container}>
      <FlatList
        data={reelsData}
        pagingEnabled // Efecto TikTok
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <ReelItem item={item} />}
        keyExtractor={item => item.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  videoContainer: { height: height - 80, width: width, justifyContent: 'center', backgroundColor: 'black' },
  video: { flex: 1, width: '100%', height: '100%' },
  overlay: { position: 'absolute', bottom: 40, left: 20, right: 20 },
  description: { color: 'white', fontSize: 16, marginBottom: 15, fontWeight: 'bold' },
  tryBtn: { flexDirection: 'row', backgroundColor: 'white', padding: 12, borderRadius: 25, alignItems: 'center', alignSelf: 'flex-start' },
  tryBtnText: { color: 'black', marginRight: 8, fontWeight: 'bold' }
});
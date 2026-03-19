import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { ResizeMode, Video } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';

const COLORS = {
  bg: '#101010',
  text: '#FFFFFF',
  textMuted: '#AAAAAA',
  accent: '#00E5FF',
  gradient: ['#00E5FF', '#2979FF', '#AA00FF'] as [string, string, string],
};

const CLOUD_NAME = "deib2yim8"; 

function generarReelAutomatico(reelId: string, description: string) {
  const baseVideoUrl = `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/v1/flexi/reels/${reelId}`;
  const baseImageUrl = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/v3/flexi/reels/${reelId}`;

  const timestamp = Date.now();

  return {
    id: reelId,
    video_url: `${baseVideoUrl}/video.mp4`,
    description: description,
    garments: [
      { id: `${reelId}_gorro`, name: 'gorro', imageUrl: `${baseImageUrl}/gorro.png?t=${timestamp}`, price: '45.00' },
      { id: `${reelId}_casaca`, name: 'casaca', imageUrl: `${baseImageUrl}/casaca.png?t=${timestamp}`, price: '180.00' },
      { id: `${reelId}_pantalon`, name: 'pantalón', imageUrl: `${baseImageUrl}/pantalon.png?t=${timestamp}`, price: '120.00' },
      { id: `${reelId}_zapatillas`, name: 'zapatillas', imageUrl: `${baseImageUrl}/zapatillas.png?t=${timestamp}`, price: '250.00' }
    ]
  };
}

export default function ReelsScreen() {
  const router = useRouter();
  const [reelsData, setReelsData] = useState<any[]>([]);
  
  const { height, width } = useWindowDimensions();
  const REEL_HEIGHT = height - 65; 
  
  const isFocused = useIsFocused();
  const [currentIndex, setCurrentIndex] = useState(0);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  useEffect(() => {
    const loadReels = () => {
      const REELS_CLOUDINARY = [
        generarReelAutomatico("reel_001", "Drop exclusivo. Listos para la calle. 🔥"),
        generarReelAutomatico("reel_002", "Vibras oversized para el fin de semana. 🧊"),
        generarReelAutomatico("reel_003", "Elevando el streetwear a otro nivel. 🚀")
      ];
      setReelsData(REELS_CLOUDINARY);
    };
    loadReels();
  }, []);

  // Función 1: Va a la ventana IA independiente
  const handleTryOutfit = (garments: any[]) => {
    router.push({
      pathname: "/outfit-creator",
      params: { selectedOutfit: JSON.stringify(garments) }
    });
  };

  // 🔥 Función 2 (NUEVA): Va a la pestaña del "+" (Asegúrate de que la ruta sea "/create" o la que uses para tu tab)
  const handleMixOutfit = (garments: any[]) => {
    router.push({
      pathname: "/combine", 
      params: { selectedOutfit: JSON.stringify(garments) }
    });
  };

  const renderItem = ({ item, index }: { item: any, index: number }) => {
    const isPlaying = isFocused && currentIndex === index;

    return (
      <View style={[styles.reelContainer, { width: width, height: REEL_HEIGHT }]}>
        <Video
          source={{ uri: item.video_url }}
          style={styles.video}
          shouldPlay={isPlaying}
          isLooping
          resizeMode={ResizeMode.COVER}
          useNativeControls={false}
          onError={(error) => console.log(`❌ Error en video ${item.id}:`, error)}
        />

        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)', '#000']} style={styles.bottomGradientOverlay} />

        <View style={styles.topHeader}>
          <Text style={styles.logoText}>Reels</Text>
          <Ionicons name="camera-outline" size={28} color={COLORS.text} />
        </View>

        <View style={styles.sideControls}>
          <TouchableOpacity style={styles.controlBtn}>
            <Ionicons name="heart" size={34} color={COLORS.text} />
            <Text style={styles.controlText}>1.2k</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.controlBtn}>
            <Ionicons name="chatbubble-outline" size={32} color={COLORS.text} />
            <Text style={styles.controlText}>45</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.controlBtn}>
            <Ionicons name="paper-plane-outline" size={32} color={COLORS.text} />
            <Text style={styles.controlText}>Share</Text>
          </TouchableOpacity>

          {/* BOTÓN 1: IA Mágica */}
          <TouchableOpacity style={styles.controlBtn} onPress={() => handleTryOutfit(item.garments)}>
            <LinearGradient colors={COLORS.gradient} style={styles.sideAiGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Ionicons name="color-wand" size={22} color="#FFF" />
            </LinearGradient>
            <Text style={[styles.controlText, { color: COLORS.accent, fontWeight: 'bold' }]}>Crear IA</Text>
          </TouchableOpacity>

          {/* 🔥 BOTÓN 2 NUEVO: LÁPIZ PARA EL SÍMBOLO "+" 🔥 */}
          <TouchableOpacity style={styles.controlBtn} onPress={() => handleMixOutfit(item.garments)}>
            <View style={styles.sideEditBtn}>
              <Ionicons name="pencil-outline" size={22} color="#FFF" />
            </View>
            <Text style={styles.controlText}>Armar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlBtn}>
            <Ionicons name="ellipsis-horizontal" size={28} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.bottomControls}>
          <View style={styles.userRow}>
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={16} color={COLORS.bg} />
            </View>
            <Text style={styles.usernameText}>flexi_official</Text>
            <TouchableOpacity style={styles.followButton}>
              <Text style={styles.followText}>Seguir</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.description}>{item.description}</Text>
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
          showsVerticalScrollIndicator={false}
          snapToInterval={REEL_HEIGHT}
          snapToAlignment="start"
          decelerationRate="fast"
          disableIntervalMomentum={true}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
        />
      ) : (
        <View style={styles.loadingContainer}>
          <Ionicons name="shirt-outline" size={40} color={COLORS.accent} style={{marginBottom: 10}} />
          <Text style={styles.loadingText}>Cargando feed...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg },
  loadingText: { color: COLORS.textMuted, fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  reelContainer: { position: 'relative' },
  video: { width: '100%', height: '100%' },
  bottomGradientOverlay: { position: 'absolute', bottom: 0, width: '100%', height: '50%' },
  topHeader: { position: 'absolute', top: 50, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logoText: { color: COLORS.text, fontSize: 24, fontWeight: 'bold', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 },
  sideControls: { position: 'absolute', right: 12, bottom: 110, alignItems: 'center' },
  controlBtn: { alignItems: 'center', marginBottom: 20 },
  controlText: { color: COLORS.text, fontSize: 12, fontWeight: '600', marginTop: 4, textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  
  sideAiGradient: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 2, elevation: 5, shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 10 },
  // 🔥 ESTILO DEL NUEVO BOTÓN LÁPIZ
  sideEditBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 2, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },

  bottomControls: { position: 'absolute', bottom: 25, left: 15, right: 75 },
  userRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatarPlaceholder: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.text, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  usernameText: { color: COLORS.text, fontWeight: 'bold', fontSize: 15, marginRight: 10, textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 },
  followButton: { borderWidth: 1, borderColor: COLORS.text, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  followText: { color: COLORS.text, fontSize: 11, fontWeight: 'bold' },
  description: { color: COLORS.text, fontSize: 14, fontWeight: '400', marginBottom: 15, lineHeight: 20, textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 },
});
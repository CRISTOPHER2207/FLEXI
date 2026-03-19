import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { openDatabaseSync } from 'expo-sqlite';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, FlatList, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView, PinchGestureHandler, State } from 'react-native-gesture-handler';

const { width } = Dimensions.get('window');

const COLORS = {
  bg: '#101010',
  surface: '#1A1A1A',
  text: '#FFFFFF',
  textMuted: '#AAAAAA',
  accent: '#00E5FF',
  gradient: ['#00E5FF', '#2979FF', '#AA00FF'] as [string, string, string],
};

const CLOUD_NAME = "deib2yim8";

function generarCatalogo() {
  const reels = ["reel_001", "reel_002", "reel_003"];
  let catalogo: any[] = [];

  reels.forEach(reelId => {
    const baseUrl = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/v3/flexi/reels/${reelId}`;
    catalogo.push(
      { id: `${reelId}_casaca`, name: 'Casaca', category: 'casaca', imageUrl: `${baseUrl}/casaca.png` },
      { id: `${reelId}_pantalon`, name: 'Pantalón', category: 'pantalon', imageUrl: `${baseUrl}/pantalon.png` },
      { id: `${reelId}_zapatillas`, name: 'Zapatillas', category: 'zapatillas', imageUrl: `${baseUrl}/zapatillas.png` }
    );
  });

  return catalogo;
}

const ALL_GARMENTS = generarCatalogo();

const db = openDatabaseSync('flexi_v1.db');

db.execSync(`
  CREATE TABLE IF NOT EXISTS my_outfits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    top_image TEXT,
    bottom_image TEXT,
    shoes_image TEXT,
    is_public INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

export default function CreateOutfitTab() {
  const params = useLocalSearchParams();

  const [selectedTop, setSelectedTop] = useState<any>(null);
  const [selectedBottom, setSelectedBottom] = useState<any>(null);
  const [selectedShoes, setSelectedShoes] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState('casaca');

  const [shareModalVisible, setShareModalVisible] = useState(false);

  const scale = useRef(new Animated.Value(1)).current;

  const onPinchEvent = Animated.event(
    [{ nativeEvent: { scale: scale } }],
    { useNativeDriver: true }
  );

  const onPinchStateChange = (event: any) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        bounciness: 8,
      }).start();
    }
  };

  useEffect(() => {
    if (params.selectedOutfit) {
      try {
        const passedGarments = JSON.parse(params.selectedOutfit as string);
        const top = passedGarments.find((g: any) => g.name.toLowerCase().includes('casaca'));
        const bottom = passedGarments.find((g: any) => g.name.toLowerCase().includes('pantalón') || g.name.toLowerCase().includes('pantalon'));
        const shoes = passedGarments.find((g: any) => g.name.toLowerCase().includes('zapatilla'));

        if (top) setSelectedTop(top);
        if (bottom) setSelectedBottom(bottom);
        if (shoes) setSelectedShoes(shoes);
      } catch (error) {
        console.error("Error leyendo el outfit pasado:", error);
      }
    } else {
      setSelectedTop(ALL_GARMENTS.find(g => g.category === 'casaca'));
      setSelectedBottom(ALL_GARMENTS.find(g => g.category === 'pantalon'));
      setSelectedShoes(ALL_GARMENTS.find(g => g.category === 'zapatillas'));
    }
  }, [params.selectedOutfit]);

  const filteredGarments = ALL_GARMENTS.filter(g => g.category === activeCategory);

  const handleSelectGarment = (item: any) => {
    if (item.category === 'casaca') setSelectedTop(item);
    if (item.category === 'pantalon') setSelectedBottom(item);
    if (item.category === 'zapatillas') setSelectedShoes(item);
  };

  const handleClearMannequin = () => {
    setSelectedTop(null);
    setSelectedBottom(null);
    setSelectedShoes(null);
  };

  const handleSavePrivate = () => {
    if (!selectedTop && !selectedBottom && !selectedShoes) {
      Alert.alert("Aviso", "Añade al menos una prenda antes de guardar.");
      return;
    }
    try {
      db.runSync(
        'INSERT INTO my_outfits (top_image, bottom_image, shoes_image, is_public) VALUES (?, ?, ?, ?)',
        [selectedTop?.imageUrl, selectedBottom?.imageUrl, selectedShoes?.imageUrl, 0]
      );
      setShareModalVisible(false);
      Alert.alert("¡Outfit Guardado! 🔒", "Se ha guardado en tu armario privado del Perfil.");
    } catch (error) {
      console.error("Error guardando privado:", error);
      Alert.alert("Error", "Hubo un problema al guardar tu outfit.");
    }
  };

  const handlePublishFeed = () => {
    if (!selectedTop && !selectedBottom && !selectedShoes) {
      Alert.alert("Aviso", "Añade al menos una prenda antes de publicar.");
      return;
    }
    try {
      db.runSync(
        'INSERT INTO my_outfits (top_image, bottom_image, shoes_image, is_public) VALUES (?, ?, ?, ?)',
        [selectedTop?.imageUrl, selectedBottom?.imageUrl, selectedShoes?.imageUrl, 1]
      );
      setShareModalVisible(false);
      Alert.alert("¡Publicado! 🌍", "Tu combinación ahora es pública en el Feed.");
    } catch (error) {
      console.error("Error publicando:", error);
      Alert.alert("Error", "Hubo un problema al publicar tu outfit.");
    }
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.header}>
        <View style={{ width: 30 }} />
        <View style={styles.titleContainer}>
          <Text style={styles.headerTitle}>Arma tu Outfit</Text>
          <Ionicons name="shirt-outline" size={24} color={COLORS.accent} />
        </View>
        <TouchableOpacity style={styles.clearBtn} onPress={handleClearMannequin}>
          <Ionicons name="trash-bin-outline" size={22} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      <View style={styles.canvasContainer}>
        <PinchGestureHandler onGestureEvent={onPinchEvent} onHandlerStateChange={onPinchStateChange}>
          <Animated.View style={[styles.mannequin, { transform: [{ scale: scale }] }]}>
            {selectedTop ? (
              <Image source={{ uri: selectedTop.imageUrl }} style={styles.garmentTop} />
            ) : (
              <View style={[styles.garmentPlaceholder, styles.garmentTop]}>
                <Text style={styles.placeholderText}>Sin Casaca</Text>
              </View>
            )}

            {selectedBottom ? (
              <Image source={{ uri: selectedBottom.imageUrl }} style={styles.garmentBottom} />
            ) : (
              <View style={[styles.garmentPlaceholder, styles.garmentBottom]}>
                <Text style={styles.placeholderText}>Sin Pantalón</Text>
              </View>
            )}

            {selectedShoes ? (
              <Image source={{ uri: selectedShoes.imageUrl }} style={styles.garmentShoes} />
            ) : (
              <View style={[styles.garmentPlaceholder, styles.garmentShoes]}>
                <Text style={styles.placeholderText}>Sin Zapatillas</Text>
              </View>
            )}
          </Animated.View>
        </PinchGestureHandler>
      </View>

      <View style={styles.selectorPanel}>
        <View style={styles.tabsContainer}>
          <TouchableOpacity style={[styles.tab, activeCategory === 'casaca' && styles.activeTab]} onPress={() => setActiveCategory('casaca')}>
            <Text style={[styles.tabText, activeCategory === 'casaca' && styles.activeTabText]}>Casacas</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeCategory === 'pantalon' && styles.activeTab]} onPress={() => setActiveCategory('pantalon')}>
            <Text style={[styles.tabText, activeCategory === 'pantalon' && styles.activeTabText]}>Pantalones</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeCategory === 'zapatillas' && styles.activeTab]} onPress={() => setActiveCategory('zapatillas')}>
            <Text style={[styles.tabText, activeCategory === 'zapatillas' && styles.activeTabText]}>Zapatillas</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          horizontal
          data={filteredGarments}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.garmentList}
          renderItem={({ item }) => {
            const isSelected = selectedTop?.id === item.id || selectedBottom?.id === item.id || selectedShoes?.id === item.id;
            return (
              <TouchableOpacity style={[styles.garmentOption, isSelected && styles.garmentOptionSelected]} onPress={() => handleSelectGarment(item)}>
                <Image source={{ uri: item.imageUrl }} style={styles.garmentOptionImage} />
                {isSelected && (
                  <View style={styles.checkBadge}>
                    <Ionicons name="checkmark" size={12} color="#000" />
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />

        <View style={styles.actionButtonsRow}>
          <TouchableOpacity style={styles.halfButtonWrapper}>
            <LinearGradient colors={COLORS.gradient} style={styles.halfButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Ionicons name="color-wand" size={20} color="#FFF" />
              <Text style={styles.halfButtonText}>USAR IA</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.halfButtonWrapper} onPress={() => setShareModalVisible(true)}>
            <View style={[styles.halfButton, { backgroundColor: '#333' }]}>
              <Ionicons name="share-social-outline" size={20} color="#FFF" />
              <Text style={styles.halfButtonText}>COMPARTIR</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={shareModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>¿Qué deseas hacer con este outfit?</Text>
            
            <TouchableOpacity style={styles.modalOption} onPress={handleSavePrivate}>
              <Ionicons name="lock-closed-outline" size={24} color={COLORS.text} style={{ width: 30 }} />
              <Text style={styles.modalOptionText}>Guardar en Privado</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalOption} onPress={handlePublishFeed}>
              <Ionicons name="earth" size={24} color={COLORS.accent} style={{ width: 30 }} />
              <Text style={[styles.modalOptionText, { color: COLORS.accent }]}>Publicar en el Feed Público</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalCancelButton} onPress={() => setShareModalVisible(false)}>
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingBottom: 15, paddingHorizontal: 20 },
  titleContainer: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { color: COLORS.text, fontSize: 18, fontWeight: 'bold', letterSpacing: 1, marginRight: 10 },
  clearBtn: { padding: 5, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10 },
  canvasContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#151515', overflow: 'hidden' },
  mannequin: { alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
  garmentTop: { width: 250, height: 250, resizeMode: 'contain', zIndex: 3 },
  garmentBottom: { width: 200, height: 280, resizeMode: 'contain', zIndex: 2, marginTop: -75 },
  garmentShoes: { width: 180, height: 130, resizeMode: 'contain', zIndex: 1, marginTop: -40 },
  garmentPlaceholder: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderStyle: 'dashed' },
  placeholderText: { color: COLORS.textMuted, fontSize: 12, fontWeight: '600' },
  selectorPanel: { backgroundColor: COLORS.surface, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingTop: 20, paddingHorizontal: 15, paddingBottom: 100, elevation: 20, shadowColor: '#000', shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.3, shadowRadius: 10, zIndex: 10 },
  tabsContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  tab: { paddingVertical: 10, paddingHorizontal: 15, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: COLORS.accent },
  tabText: { color: COLORS.textMuted, fontSize: 14, fontWeight: '600' },
  activeTabText: { color: COLORS.accent, fontWeight: 'bold' },
  garmentList: { paddingLeft: 5, paddingBottom: 20 },
  garmentOption: { width: 80, height: 80, backgroundColor: COLORS.bg, borderRadius: 15, marginRight: 15, alignItems: 'center', justifyContent: 'center', position: 'relative', borderWidth: 2, borderColor: 'transparent' },
  garmentOptionSelected: { borderColor: COLORS.accent },
  garmentOptionImage: { width: 65, height: 65, resizeMode: 'contain' },
  checkBadge: { position: 'absolute', top: -5, right: -5, backgroundColor: COLORS.accent, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  actionButtonsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
  halfButtonWrapper: { width: '48%', borderRadius: 25, overflow: 'hidden' },
  halfButton: { flexDirection: 'row', paddingVertical: 14, justifyContent: 'center', alignItems: 'center' },
  halfButtonText: { color: '#FFF', fontSize: 13, fontWeight: '900', letterSpacing: 1, marginLeft: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  modalContent: { backgroundColor: COLORS.surface, width: '100%', borderRadius: 25, padding: 25, borderWidth: 1, borderColor: '#333' },
  modalTitle: { color: COLORS.text, fontSize: 16, fontWeight: 'bold', marginBottom: 25, textAlign: 'center' },
  modalOption: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#222', padding: 15, borderRadius: 15, marginBottom: 15 },
  modalOptionText: { color: COLORS.text, fontSize: 15, fontWeight: '600' },
  modalCancelButton: { marginTop: 10, paddingVertical: 10 },
  modalCancelText: { color: COLORS.textMuted, textAlign: 'center', fontSize: 15, fontWeight: 'bold' },
});
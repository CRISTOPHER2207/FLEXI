import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { openDatabaseSync } from 'expo-sqlite';
import React, { useEffect, useState } from 'react';
import { Dimensions, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

const COLORS = {
  bg: '#101010',
  surface: '#1A1A1A',
  text: '#FFFFFF',
  textMuted: '#AAAAAA',
  accent: '#00E5FF',
};

const db = openDatabaseSync('flexi_v1.db');

export default function ProfileScreen() {
  const [outfits, setOutfits] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<number>(0); 
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) cargarOutfits();
  }, [isFocused, activeTab]);

  const cargarOutfits = () => {
    try {
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
      const data = db.getAllSync(
        'SELECT * FROM my_outfits WHERE is_public = ? ORDER BY created_at DESC', 
        [activeTab]
      );
      setOutfits(data);
    } catch (error) {
      console.error("Error cargando outfits:", error);
    }
  };

  const handleDelete = (id: number) => {
    try {
      db.runSync('DELETE FROM my_outfits WHERE id = ?', [id]);
      cargarOutfits(); 
    } catch (error) {
      console.error("Error borrando:", error);
    }
  };

  // 🖼️ NUEVO DISEÑO: Cuadrícula estilo Instagram
  const renderOutfitItem = ({ item }: { item: any }) => (
    <View style={styles.outfitCard}>
      {/* Muestra la imagen generada por IA cubriendo todo el cuadrado */}
      {item.top_image ? (
        <Image source={{ uri: item.top_image }} style={styles.gridImage} />
      ) : (
        <View style={styles.placeholderImage}>
           <Ionicons name="image-outline" size={24} color={COLORS.textMuted} />
        </View>
      )}

      {/* Botón de eliminar más discreto */}
      <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
        <Ionicons name="trash" size={14} color="#FFF" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* 👤 HEADER DEL PERFIL */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <Image source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80' }} style={styles.avatar} />
        </View>
        <Text style={styles.username}>@flexi_user</Text>
        <Text style={styles.bio}>Explorando el mejor streetwear 🔥</Text>
      </View>

      {/* 🗂️ PESTAÑAS */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity style={[styles.tab, activeTab === 0 && styles.activeTab]} onPress={() => setActiveTab(0)}>
          <Ionicons name="lock-closed" size={18} color={activeTab === 0 ? COLORS.text : COLORS.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 1 && styles.activeTab]} onPress={() => setActiveTab(1)}>
          <Ionicons name="grid-outline" size={18} color={activeTab === 1 ? COLORS.text : COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      {/* 📸 CUADRÍCULA DE OUTFITS */}
      {outfits.length > 0 ? (
        <FlatList
          data={outfits}
          keyExtractor={(item) => item.id.toString()}
          numColumns={3} // Cambiado a 3 columnas estilo IG
          contentContainerStyle={styles.gridContainer}
          renderItem={renderOutfitItem}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="camera-outline" size={60} color={COLORS.surface} />
          <Text style={styles.emptyStateText}>Aún no hay publicaciones</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  profileHeader: { alignItems: 'center', paddingTop: 60, paddingBottom: 20 },
  avatarContainer: { width: 90, height: 90, borderRadius: 45, borderWidth: 2, borderColor: COLORS.surface, overflow: 'hidden', marginBottom: 10 },
  avatar: { width: '100%', height: '100%' },
  username: { color: COLORS.text, fontSize: 20, fontWeight: 'bold' },
  bio: { color: COLORS.textMuted, fontSize: 14, marginTop: 5 },
  tabsContainer: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: COLORS.surface },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: COLORS.text },
  
  // Estilos de la nueva cuadrícula
  gridContainer: { paddingBottom: 100 }, 
  outfitCard: { 
    width: width / 3, // Exactamente 1/3 de la pantalla
    height: width / 3, // Cuadrado perfecto
    padding: 1, // Espaciado mínimo entre fotos como en IG
    position: 'relative' 
  },
  gridImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  placeholderImage: { width: '100%', height: '100%', backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center' },
  deleteBtn: { position: 'absolute', top: 5, right: 5, backgroundColor: 'rgba(0,0,0,0.5)', padding: 6, borderRadius: 15, zIndex: 10 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  emptyStateText: { color: COLORS.textMuted, fontSize: 16, marginTop: 15 },
});
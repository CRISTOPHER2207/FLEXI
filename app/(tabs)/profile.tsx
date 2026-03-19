import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { openDatabaseSync } from 'expo-sqlite';
import React, { useEffect, useState } from 'react';
import { Dimensions, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

// 🎨 PALETA DE COLORES FLEXI
const COLORS = {
  bg: '#101010',
  surface: '#1A1A1A',
  text: '#FFFFFF',
  textMuted: '#AAAAAA',
  accent: '#00E5FF',
  gradient: ['#00E5FF', '#2979FF', '#AA00FF'] as [string, string, string],
};

// 🔥 CONECTAMOS LA BASE DE DATOS
const db = openDatabaseSync('flexi_v1.db');

export default function ProfileScreen() {
  const [outfits, setOutfits] = useState<any[]>([]);
  // 0 = Privado, 1 = Público
  const [activeTab, setActiveTab] = useState<number>(0); 
  
  // Esto detecta si el usuario acaba de entrar a la pantalla para refrescar los datos automáticamente
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      cargarOutfits();
    }
  }, [isFocused, activeTab]);

  const cargarOutfits = () => {
    try {
      // Por si acaso el usuario entra aquí antes de guardar nada, nos aseguramos de que la tabla exista
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

      // Leemos de la base de datos según la pestaña activa (Privado o Público)
      const data = db.getAllSync(
        'SELECT * FROM my_outfits WHERE is_public = ? ORDER BY created_at DESC', 
        [activeTab]
      );
      setOutfits(data);
    } catch (error) {
      console.error("Error cargando outfits:", error);
    }
  };

  // Función para borrar un outfit si ya no le gusta
  const handleDelete = (id: number) => {
    try {
      db.runSync('DELETE FROM my_outfits WHERE id = ?', [id]);
      cargarOutfits(); // Recargamos la lista
    } catch (error) {
      console.error("Error borrando:", error);
    }
  };

  // 🖼️ Cómo se ve cada "Mini Outfit" en la galería
  const renderOutfitItem = ({ item }: { item: any }) => (
    <View style={styles.outfitCard}>
      <TouchableOpacity 
        style={styles.deleteBtn} 
        onPress={() => handleDelete(item.id)}
      >
        <Ionicons name="trash-outline" size={16} color="#FF4444" />
      </TouchableOpacity>

      {/* Mini Maniquí Apilado */}
      <View style={styles.miniMannequin}>
        {item.top_image && <Image source={{ uri: item.top_image }} style={styles.miniTop} />}
        {item.bottom_image && <Image source={{ uri: item.bottom_image }} style={styles.miniBottom} />}
        {item.shoes_image && <Image source={{ uri: item.shoes_image }} style={styles.miniShoes} />}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      
      {/* 👤 HEADER DEL PERFIL */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80' }} 
            style={styles.avatar} 
          />
        </View>
        <Text style={styles.username}>@flexi_user</Text>
        <Text style={styles.bio}>Explorando el mejor streetwear 🔥</Text>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>845</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>1.2k</Text>
            <Text style={styles.statLabel}>Likes</Text>
          </View>
        </View>
      </View>

      {/* 🗂️ PESTAÑAS (PRIVADOS / PUBLICADOS) */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 0 && styles.activeTab]} 
          onPress={() => setActiveTab(0)}
        >
          <Ionicons name="lock-closed" size={18} color={activeTab === 0 ? COLORS.accent : COLORS.textMuted} />
          <Text style={[styles.tabText, activeTab === 0 && styles.activeTabText]}>Privados</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 1 && styles.activeTab]} 
          onPress={() => setActiveTab(1)}
        >
          <Ionicons name="earth" size={18} color={activeTab === 1 ? COLORS.accent : COLORS.textMuted} />
          <Text style={[styles.tabText, activeTab === 1 && styles.activeTabText]}>Públicos</Text>
        </TouchableOpacity>
      </View>

      {/* 📸 CUADRÍCULA DE OUTFITS (GALERÍA) */}
      {outfits.length > 0 ? (
        <FlatList
          data={outfits}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.gridContainer}
          renderItem={renderOutfitItem}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="shirt-outline" size={60} color={COLORS.surface} />
          <Text style={styles.emptyStateText}>
            Aún no tienes outfits en esta sección.
          </Text>
          <Text style={styles.emptyStateSubText}>
            Ve a la pestaña "+" para crear uno nuevo.
          </Text>
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  
  // Header Perfil
  profileHeader: { alignItems: 'center', paddingTop: 60, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: COLORS.surface },
  avatarContainer: { width: 90, height: 90, borderRadius: 45, borderWidth: 2, borderColor: COLORS.accent, overflow: 'hidden', marginBottom: 10 },
  avatar: { width: '100%', height: '100%' },
  username: { color: COLORS.text, fontSize: 20, fontWeight: 'bold' },
  bio: { color: COLORS.textMuted, fontSize: 14, marginTop: 5 },
  
  statsRow: { flexDirection: 'row', width: '70%', justifyContent: 'space-between', marginTop: 20 },
  statItem: { alignItems: 'center' },
  statNumber: { color: COLORS.text, fontSize: 18, fontWeight: 'bold' },
  statLabel: { color: COLORS.textMuted, fontSize: 12 },

  // Pestañas
  tabsContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.surface },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, borderBottomWidth: 2, borderBottomColor: 'transparent', gap: 5 },
  activeTab: { borderBottomColor: COLORS.accent },
  tabText: { color: COLORS.textMuted, fontSize: 14, fontWeight: 'bold' },
  activeTabText: { color: COLORS.accent },

  // Cuadrícula y Tarjetas
  gridContainer: { padding: 10, paddingBottom: 100 }, // paddingBottom 100 por la navbar flotante
  outfitCard: { flex: 1, margin: 5, backgroundColor: COLORS.surface, borderRadius: 20, alignItems: 'center', paddingVertical: 15, position: 'relative', height: 220 },
  
  deleteBtn: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(255,0,0,0.1)', padding: 6, borderRadius: 12, zIndex: 10 },

  // Mini Maniquí Matemático
  miniMannequin: { alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  miniTop: { width: 100, height: 100, resizeMode: 'contain', zIndex: 3 },
  miniBottom: { width: 80, height: 110, resizeMode: 'contain', zIndex: 2, marginTop: -30 },
  miniShoes: { width: 70, height: 50, resizeMode: 'contain', zIndex: 1, marginTop: -15 },

  // Estado Vacío
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyStateText: { color: COLORS.text, fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginTop: 15 },
  emptyStateSubText: { color: COLORS.textMuted, fontSize: 14, textAlign: 'center', marginTop: 5 },
});
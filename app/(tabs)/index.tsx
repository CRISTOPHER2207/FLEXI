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

export default function FeedScreen() {
  const [publicPosts, setPublicPosts] = useState<any[]>([]);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      cargarFeed();
    }
  }, [isFocused]);

  const cargarFeed = () => {
    try {
      // Aseguramos que la tabla exista por si es la primera vez que se abre la app
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
      // 1 significa Público
      const data = db.getAllSync('SELECT * FROM my_outfits WHERE is_public = 1 ORDER BY created_at DESC');
      setPublicPosts(data);
    } catch (error) {
      console.error("Error cargando feed:", error);
    }
  };

  const renderPost = ({ item }: { item: any }) => (
    <View style={styles.postContainer}>
      {/* Cabecera del Post */}
      <View style={styles.postHeader}>
        <Image source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80' }} style={styles.avatar} />
        <Text style={styles.username}>flexi_user</Text>
        <Ionicons name="ellipsis-horizontal" size={20} color={COLORS.text} style={{ marginLeft: 'auto' }} />
      </View>

      {/* Imagen Generada IA */}
      <Image source={{ uri: item.top_image }} style={styles.postImage} />

      {/* Botones de Acción */}
      <View style={styles.postActions}>
        <View style={styles.actionGroup}>
          <TouchableOpacity><Ionicons name="heart-outline" size={28} color={COLORS.text} style={styles.actionIcon} /></TouchableOpacity>
          <TouchableOpacity><Ionicons name="chatbubble-outline" size={26} color={COLORS.text} style={styles.actionIcon} /></TouchableOpacity>
          <TouchableOpacity><Ionicons name="paper-plane-outline" size={26} color={COLORS.text} /></TouchableOpacity>
        </View>
        <TouchableOpacity><Ionicons name="bookmark-outline" size={26} color={COLORS.text} /></TouchableOpacity>
      </View>

      {/* Descripción / Likes */}
      <View style={styles.postFooter}>
        <Text style={styles.likesText}>Les gusta a 124 personas</Text>
        <Text style={styles.descriptionText}>
          <Text style={styles.usernameBold}>flexi_user </Text> 
          Probando la nueva IA de Flexi. ¡El fit quedó perfecto! 🔥
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header Fijo */}
      <View style={styles.header}>
        <Text style={styles.logoText}>FLEXI</Text>
        <View style={styles.headerIcons}>
          <Ionicons name="heart-outline" size={26} color={COLORS.text} style={{marginRight: 15}}/>
          <Ionicons name="chatbubble-ellipses-outline" size={24} color={COLORS.text} />
        </View>
      </View>

      {publicPosts.length > 0 ? (
        <FlatList
          data={publicPosts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderPost}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="earth-outline" size={60} color={COLORS.surface} />
          <Text style={styles.emptyStateText}>No hay publicaciones públicas aún.</Text>
          <Text style={styles.emptyStateSub}>Ve a la IA y publica tu primer outfit en el Feed.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingTop: 50, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: COLORS.surface },
  logoText: { color: COLORS.text, fontSize: 24, fontWeight: '900', letterSpacing: 2 },
  headerIcons: { flexDirection: 'row', alignItems: 'center' },
  
  // Estilos del Post (Instagram)
  postContainer: { borderBottomWidth: 1, borderBottomColor: COLORS.surface, paddingBottom: 15, marginBottom: 10 },
  postHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 10 },
  avatar: { width: 32, height: 32, borderRadius: 16, marginRight: 10 },
  username: { color: COLORS.text, fontWeight: 'bold', fontSize: 14 },
  
  // La imagen tomará el ancho total de la pantalla y será cuadrada 1:1
  postImage: { width: width, height: width, resizeMode: 'cover' },
  
  postActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, marginTop: 10 },
  actionGroup: { flexDirection: 'row', alignItems: 'center' },
  actionIcon: { marginRight: 15 },
  
  postFooter: { paddingHorizontal: 15, marginTop: 8 },
  likesText: { color: COLORS.text, fontWeight: 'bold', fontSize: 13, marginBottom: 4 },
  descriptionText: { color: COLORS.text, fontSize: 13, lineHeight: 18 },
  usernameBold: { fontWeight: 'bold' },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyStateText: { color: COLORS.text, fontSize: 16, fontWeight: 'bold', marginTop: 15 },
  emptyStateSub: { color: COLORS.textMuted, textAlign: 'center', marginTop: 8 },
});
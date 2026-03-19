import { Ionicons } from '@expo/vector-icons';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

// 🎨 PALETA FLEXI: Turquesa -> Azul -> Violeta
const COLORS = {
  bg: '#101010',          
  surface: '#181818',     
  border: '#252525',
  gradient: ['#00E5FF', '#2979FF', '#AA00FF'] as [string, string, string],
  text: '#FFFFFF',
  textMuted: '#AAAAAA',
  accent: '#00E5FF',
};

// Datos de muestra con estética Streetwear / Oversized
const STORIES = [
  { id: 1, name: 'Tu historia', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&q=80', isUser: true },
  { id: 2, name: 'Flexi Drops', image: 'https://images.unsplash.com/photo-1523398002811-999aa8e9f5b9?w=400&q=80' },
  { id: 3, name: 'Streetwear', image: 'https://images.unsplash.com/photo-1550614000-4b95d466f25b?w=400&q=80' },
  { id: 4, name: 'New Fit', image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=400&q=80' },
  { id: 5, name: 'Oversized', image: 'https://images.unsplash.com/photo-1434389678240-61d06e232924?w=400&q=80' },
  { id: 6, name: 'Urban', image: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=400&q=80' },
];

const POSTS = [
  {
    id: 1,
    user: 'flexi_official',
    avatar: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=100&q=80',
    image: 'https://images.unsplash.com/photo-1516826957135-700ede19c6ce?w=800&q=80',
    likes: '1,240',
    caption: 'La nueva colección oversized ya está disponible. Drop limitado. 🚀',
    price: 120.00
  },
  {
    id: 2,
    user: 'street_hype',
    avatar: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=100&q=80',
    image: 'https://images.unsplash.com/photo-1550614000-4b95d466f25b?w=800&q=80',
    likes: '890',
    caption: 'Vibras urbanas para el fin de semana. Combina la T-Shirt con los nuevos cargo. 🧊',
    price: 95.00
  },
  {
    id: 3,
    user: 'urban_fits',
    avatar: 'https://images.unsplash.com/photo-1434389678240-61d06e232924?w=100&q=80',
    image: 'https://images.unsplash.com/photo-1523398002811-999aa8e9f5b9?w=800&q=80',
    likes: '3,450',
    caption: 'Detalles 3D y corte premium. Elevando los básicos. 🔥',
    price: 150.00
  }
];

const GradientText = (props: any) => (
  <MaskedView maskElement={<Text {...props} />}>
    <LinearGradient colors={COLORS.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
      <Text {...props} style={[props.style, { opacity: 0 }]} />
    </LinearGradient>
  </MaskedView>
);

export default function ShopProductDetailScreen() {
  return (
    <View style={styles.container}>
      {/* HEADER ESTILO INSTAGRAM */}
      <View style={styles.header}>
        <GradientText style={styles.logoText}>FLEXI</GradientText>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="heart-outline" size={26} color={COLORS.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="chatbubble-ellipses-outline" size={26} color={COLORS.text} />
            <View style={[styles.badge, { backgroundColor: COLORS.accent }]} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* SECCIÓN DE HISTORIAS */}
        <View style={styles.storiesSection}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={{ paddingHorizontal: 15, paddingRight: 30 }}
          >
            {STORIES.map((story) => (
              <TouchableOpacity key={story.id} style={styles.storyWrapper} activeOpacity={0.8}>
                <LinearGradient colors={COLORS.gradient} style={styles.storyGradient}>
                  <View style={styles.storyImageInner}>
                    <Image source={{ uri: story.image }} style={styles.storyImage} />
                  </View>
                </LinearGradient>
                <Text style={styles.storyName} numberOfLines={1}>{story.name}</Text>
                {story.isUser && (
                  <View style={styles.addStoryBadge}>
                    <Ionicons name="add" size={14} color="#FFF" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* FEED DE PUBLICACIONES */}
        {POSTS.map((post) => (
          <View key={post.id} style={styles.postContainer}>
            <View style={styles.postHeader}>
              <Image source={{ uri: post.avatar }} style={styles.userAvatar} />
              <Text style={styles.userName}>{post.user}</Text>
              <Ionicons name="ellipsis-horizontal" size={20} color={COLORS.text} style={{ marginLeft: 'auto' }} />
            </View>

            <View style={styles.imageContainer}>
              <Image source={{ uri: post.image }} style={styles.mainImage} resizeMode="cover" />
            </View>

            <View style={styles.postActions}>
              <View style={styles.leftActions}>
                <Ionicons name="heart-outline" size={28} color={COLORS.text} />
                <Ionicons name="chatbubble-outline" size={26} color={COLORS.text} />
                <Ionicons name="paper-plane-outline" size={26} color={COLORS.text} />
              </View>
              <Ionicons name="bookmark-outline" size={28} color={COLORS.text} />
            </View>

            <View style={styles.postInfo}>
              <Text style={styles.likesText}>{post.likes} Me gusta</Text>
              <Text style={styles.caption}>
                <Text style={styles.userName}>{post.user} </Text> 
                {post.caption}
              </Text>
              <TouchableOpacity style={styles.shopButton}>
                <Ionicons name="cart-outline" size={16} color={COLORS.bg} />
                <Text style={styles.shopButtonText}>Comprar por S/ {post.price.toFixed(2)}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, paddingTop: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, height: 55 },
  logoText: { fontSize: 28, fontWeight: '900', letterSpacing: -1 },
  headerIcons: { flexDirection: 'row', gap: 20 },
  iconBtn: { position: 'relative' },
  badge: { position: 'absolute', top: -2, right: -4, width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: COLORS.bg },
  
  storiesSection: { paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  storyWrapper: { alignItems: 'center', marginRight: 18, width: 75, position: 'relative' },
  storyGradient: { width: 74, height: 74, borderRadius: 37, padding: 2.5, justifyContent: 'center', alignItems: 'center' },
  storyImageInner: { width: '100%', height: '100%', borderRadius: 35, backgroundColor: COLORS.bg, padding: 3 },
  storyImage: { width: '100%', height: '100%', borderRadius: 32 },
  storyName: { color: COLORS.text, fontSize: 11, marginTop: 6, fontWeight: '500' },
  addStoryBadge: { position: 'absolute', bottom: 20, right: 0, backgroundColor: COLORS.accent, borderRadius: 12, borderWidth: 2, borderColor: COLORS.bg, width: 22, height: 22, justifyContent: 'center', alignItems: 'center' },

  postContainer: { marginBottom: 20, borderBottomWidth: 0.5, borderBottomColor: COLORS.border, paddingBottom: 15 },
  postHeader: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  userAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10, borderWidth: 1, borderColor: COLORS.border },
  userName: { color: COLORS.text, fontWeight: 'bold', fontSize: 14 },
  imageContainer: { width: width, height: width * 1.1 }, // Proporción 4:5 estilo Instagram
  mainImage: { width: '100%', height: '100%' },
  postActions: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 12 },
  leftActions: { flexDirection: 'row', gap: 18, alignItems: 'center' },
  postInfo: { paddingHorizontal: 15 },
  likesText: { color: COLORS.text, fontWeight: 'bold', marginBottom: 5, fontSize: 14 },
  caption: { color: COLORS.text, lineHeight: 20, fontSize: 14 },
  shopButton: { flexDirection: 'row', backgroundColor: COLORS.accent, paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20, alignSelf: 'flex-start', marginTop: 12, alignItems: 'center', gap: 5 },
  shopButtonText: { color: COLORS.bg, fontWeight: 'bold', fontSize: 13 },
});
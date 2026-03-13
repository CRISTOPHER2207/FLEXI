import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const categories = ["Todos", "Oversized", "Streetwear", "Zapatillas", "Accesorios"];
const products = [
  { id: '1', name: 'Polo Oversized Black', price: '89.00', imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f' },
  { id: '2', name: 'Pantalón Cargo', price: '120.00', imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f' }
];

export default function MarketplaceScreen() {
  const [selectedCategory, setSelectedCategory] = useState("Todos");

  return (
    <ScrollView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Image source="https://i.pravatar.cc/150?img=12" style={styles.avatar} />
          <View>
            <Text style={styles.welcome}>Bienvenido de nuevo,</Text>
            <Text style={styles.username}>Cristopher Jans</Text>
          </View>
        </View>
        <TouchableOpacity>
          <Ionicons name="notifications-outline" size={24} color="black" />
        </TouchableOpacity>
      </View>

      {/* SEARCH SECTION */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="gray" />
          <TextInput placeholder="Buscar prendas..." style={styles.searchInput} />
        </View>
        <TouchableOpacity style={styles.filterBtn}>
          <Ionicons name="options-outline" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* PROMO BANNER */}
      <View style={styles.promoBanner}>
        <View>
          <Text style={styles.tag}>NUEVA COLECCIÓN</Text>
          <Text style={styles.promoTitle}>Oferta de Verano</Text>
          <Text style={styles.promoDesc}>Descuentos del 50%</Text>
        </View>
      </View>

      {/* CATEGORIES */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
        {categories.map((cat) => (
          <TouchableOpacity 
            key={cat} 
            style={[styles.categoryPill, cat === selectedCategory && styles.activePill]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text style={[styles.categoryText, cat === selectedCategory && styles.activeText]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* PRODUCT GRID */}
      <Text style={styles.sectionTitle}>Populares</Text>
      <View style={styles.productGrid}>
        {products.map((p) => (
          <View key={p.id} style={styles.productCard}>
            <Image source={p.imageUrl} style={styles.productImage} />
            <Text style={styles.productName}>{p.name}</Text>
            <Text style={styles.productPrice}>S/ {p.price}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );

}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20, paddingTop: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  welcome: { fontSize: 12, color: 'gray' },
  username: { fontSize: 16, fontWeight: 'bold' },
  searchSection: { flexDirection: 'row', marginBottom: 20 },
  searchBar: { flex: 1, flexDirection: 'row', backgroundColor: '#f0f0f0', borderRadius: 10, padding: 10, alignItems: 'center' },
  searchInput: { marginLeft: 10, flex: 1 },
  filterBtn: { backgroundColor: 'black', padding: 10, borderRadius: 10, marginLeft: 10, justifyContent: 'center' },
  promoBanner: { backgroundColor: '#ffe4e1', padding: 20, borderRadius: 15, marginBottom: 20 },
  tag: { fontSize: 10, fontWeight: 'bold', color: 'red' },
  promoTitle: { fontSize: 20, fontWeight: 'bold', marginVertical: 5 },
  promoDesc: { fontSize: 14 },
  categoriesScroll: { marginBottom: 20 },
  categoryPill: { paddingHorizontal: 15, paddingVertical: 8, backgroundColor: '#f0f0f0', borderRadius: 20, marginRight: 10 },
  activePill: { backgroundColor: 'black' },
  categoryText: { color: 'black' },
  activeText: { color: 'white' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingBottom: 40 },
  productCard: { width: '48%', backgroundColor: '#f9f9f9', borderRadius: 10, padding: 10, marginBottom: 15 },
  productImage: { width: '100%', height: 150, borderRadius: 10, marginBottom: 10 },
  productName: { fontSize: 14, fontWeight: 'bold' },
  productPrice: { fontSize: 14, color: 'gray', marginTop: 5 }
  
});
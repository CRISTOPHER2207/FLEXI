import { Ionicons } from '@expo/vector-icons';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { openDatabaseSync } from 'expo-sqlite';
import React, { useEffect, useState } from 'react';
import { Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

const COLORS = {
  bg: '#101010',          
  surface: '#181818',     
  border: '#333333',
  // 🔥 EL FIX: Le aseguramos a TypeScript que siempre habrá 3 colores
  gradient: ['#00E5FF', '#2979FF', '#AA00FF'] as [string, string, string],
  text: '#FFFFFF',
  textMuted: '#AAAAAA',
};

const SIZES = ['S', 'M', 'L', 'XL'];

const GradientText = (props: any) => (
  <MaskedView maskElement={<Text {...props} />}>
    <LinearGradient colors={COLORS.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
      <Text {...props} style={[props.style, { opacity: 0 }]} />
    </LinearGradient>
  </MaskedView>
);

interface Product {
  id: number;
  name: string;
  image_url: string;
  price: number;
  description: string;
}

export default function ShopProductDetailScreen() {
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState('M');

  useEffect(() => {
    try {
      const db = openDatabaseSync('flexi_v1.db');
      const data = db.getAllSync('SELECT * FROM garments WHERE id = 1 LIMIT 1');
      
      if (data.length > 0) {
        const dbProduct = data[0] as any;
        setProduct({
          id: dbProduct.id,
          name: 'Flexi-Manga T-Shirt',
          image_url: dbProduct.image_url,
          price: 120.00,
          description: 'A contemporary take on a street style staple. A dropped shoulder with a cropped body, the Flexi-Manga T-Shirt is finished with a ribbed mock neck and signature 3D print branding.'
        });
      }
    } catch (error) {
      console.error("Error leyendo product detail:", error);
    }
  }, []);

  if (!product) return <View style={styles.loading}><Text style={styles.loadingText}>Cargando...</Text></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="menu" size={26} color={COLORS.text} />
        <Text style={styles.logoText}>FLEXI<Text style={styles.logoSlash}> / SHOP</Text></Text>
        <View style={styles.headerRightIcons}>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="search" size={20} color={COLORS.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="cart" size={20} color={COLORS.text} />
            <View style={styles.cartBadge}><Text style={styles.cartBadgeText}>2</Text></View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.productImageContainer}>
          <Image source={{ uri: product.image_url }} style={styles.productImage} resizeMode="cover" />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={styles.imageOverlay} />
        </View>

        <View style={styles.productDetails}>
          <GradientText style={styles.productName}>{product.name}</GradientText>
          
          <View style={styles.priceRow}>
            <Text style={styles.priceCurrency}>S/ </Text>
            <GradientText style={styles.productPrice}>{product.price.toFixed(2)}</GradientText>
          </View>

          <Text style={styles.descriptionLabel}>DESCRIPTION</Text>
          <Text style={styles.descriptionText}>{product.description}</Text>
          
          <Text style={styles.sizesLabel}>SIZES</Text>
          <View style={styles.sizesRow}>
            {SIZES.map((size) => (
              <TouchableOpacity 
                key={size} 
                style={[styles.sizeOption, selectedSize === size && styles.selectedSizeOption]}
                onPress={() => setSelectedSize(size)}
              >
                {selectedSize === size ? (
                  <LinearGradient colors={COLORS.gradient} style={styles.selectedSizeGradientBorder}>
                    <Text style={styles.selectedSizeText}>{size}</Text>
                  </LinearGradient>
                ) : (
                  <Text style={styles.sizeText}>{size}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.addToCartButton}>
            <LinearGradient colors={COLORS.gradient} style={styles.addToCartGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Ionicons name="cart-outline" size={22} color="#FFF" style={{marginRight: 10}} />
              <Text style={styles.addToCartText}>AÑADIR AL CARRITO</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, paddingTop: 60 },
  loading: { flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: COLORS.textMuted },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 25 },
  logoText: { color: COLORS.text, fontSize: 18, fontWeight: '900', letterSpacing: 2 },
  logoSlash: { color: COLORS.textMuted },
  headerRightIcons: { flexDirection: 'row', gap: 15 },
  iconBtn: { width: 40, height: 40, backgroundColor: COLORS.surface, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, position: 'relative' },
  cartBadge: { position: 'absolute', top: -3, right: -3, backgroundColor: '#00E5FF', width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  cartBadgeText: { color: COLORS.bg, fontSize: 10, fontWeight: 'bold' },
  productImageContainer: { width: width * 0.9, height: 350, alignSelf: 'center', borderRadius: 25, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border, position: 'relative', marginBottom: 20 },
  productImage: { width: '100%', height: '100%' },
  imageOverlay: { ...StyleSheet.absoluteFillObject },
  productDetails: { paddingHorizontal: width * 0.05 },
  productName: { fontSize: 24, fontWeight: '900', letterSpacing: 1, marginBottom: 10 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 20 },
  priceCurrency: { color: '#00E5FF', fontSize: 16, fontWeight: 'bold' },
  productPrice: { fontSize: 28, fontWeight: '900' },
  descriptionLabel: { color: COLORS.textMuted, fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 8 },
  descriptionText: { color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 20, marginBottom: 25 },
  sizesLabel: { color: COLORS.textMuted, fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 12 },
  sizesRow: { flexDirection: 'row', gap: 15, marginBottom: 35 },
  sizeOption: { width: 45, height: 45, borderRadius: 10, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center' },

  selectedSizeOption: { borderWidth: 0, backgroundColor: 'transparent' },
  sizeText: { color: COLORS.text, fontSize: 14, fontWeight: 'bold' },
  selectedSizeGradientBorder: { width: 45, height: 45, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  selectedSizeText: { color: '#FFF', fontSize: 14, fontWeight: '900' },
  addToCartButton: { width: '100%', height: 60, borderRadius: 30, overflow: 'hidden' },
  addToCartGradient: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  addToCartText: { color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 2 },


  
});
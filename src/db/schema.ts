import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// Tabla de Prendas (Tu catálogo)
export const garments = sqliteTable('garments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  imageUrl: text('image_url').notNull(), // URL local o remota de la prenda
  category: text('category').notNull(), // 'upper_body', 'lower_body', etc.
  price: integer('price'), 
});

// Tabla de Reels
export const reels = sqliteTable('reels', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  videoUrl: text('video_url').notNull(),
  description: text('description'),
});

// Tabla Intermedia: Enlaza Reels con Prendas (Relación N a N)
export const reelGarments = sqliteTable('reel_garments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reelId: integer('reel_id').references(() => reels.id),
  garmentId: integer('garment_id').references(() => garments.id),
});
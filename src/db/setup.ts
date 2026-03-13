import { SQLiteDatabase } from 'expo-sqlite';

export const setupDatabase = (db: SQLiteDatabase) => {
  try {
    // 🔥 PASO CLAVE: Borramos las tablas anteriores para forzar la inyección de tus datos reales.
    // (Ojo: En producción esto se quita, pero para desarrollo es genial para resetear la base de datos).
    db.execSync(`
      DROP TABLE IF EXISTS reel_garments;
      DROP TABLE IF EXISTS reels;
      DROP TABLE IF EXISTS garments;
    `);

    // 1. CREAR LAS TABLAS FÍSICAS (Estructura Relacional)
    db.execSync(`
      CREATE TABLE IF NOT EXISTS garments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        image_url TEXT NOT NULL,
        category TEXT NOT NULL,
        price INTEGER
      );

      CREATE TABLE IF NOT EXISTS reels (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        video_url TEXT NOT NULL,
        description TEXT
      );

      CREATE TABLE IF NOT EXISTS reel_garments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reel_id INTEGER REFERENCES reels(id),
        garment_id INTEGER REFERENCES garments(id)
      );
    `);

    console.log("👗 Inyectando tu catálogo REAL desde Cloudinary...");

    // 2. INSERTAR TUS 3 PRENDAS (Catálogo)
    // Nota: A todas les puse 'upper_body' para que la IA de Replicate no falle al probártelas.
    db.execSync(`
      INSERT INTO garments (id, name, image_url, category, price) VALUES 
      (1, 'Top Urbano D3', 'https://res.cloudinary.com/deib2yim8/image/upload/v1773420502/d3_mgt7bc.png', 'upper_body', 45),
      (2, 'Prenda Exclusiva Flexi', 'https://res.cloudinary.com/deib2yim8/image/upload/v1773420502/Gemini_Generated_Image_i2dlcbi2dlcbi2dl-Photoroom_zjvdbv.png', 'upper_body', 60),
      (3, 'Chaqueta D2', 'https://res.cloudinary.com/deib2yim8/image/upload/v1773420501/d2_jagyc7.png', 'upper_body', 85);
    `);

    // 3. INSERTAR TU REEL (El video principal)
    db.execSync(`
      INSERT INTO reels (id, video_url, description) VALUES 
      (1, 'https://res.cloudinary.com/deib2yim8/video/upload/v1773420454/reel1_csesf6.mp4', 'Colección Flexi - Drop 01');
    `);

    // 4. ENLAZAR EL REEL CON LAS 3 PRENDAS (Magia Relacional)
    // Aquí le decimos a SQLite: "Cuando el usuario vea el Reel 1, muéstrale las prendas 1, 2 y 3"
    db.execSync(`
      INSERT INTO reel_garments (reel_id, garment_id) VALUES 
      (1, 1), 
      (1, 2),
      (1, 3);
    `);

    console.log("✅ Datos reales de Cloudinary inyectados con éxito.");

  } catch (error) {
    console.error("❌ Error configurando la base de datos:", error);
  }
};
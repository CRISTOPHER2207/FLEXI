import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from './schema';

// Creamos o abrimos el archivo físico en el dispositivo
const expoDb = openDatabaseSync('flexi_v1.db');

export const db = drizzle(expoDb, { schema });
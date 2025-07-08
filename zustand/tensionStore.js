import { create } from 'zustand';
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('tension.db');

db.execSync(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS tension_measurements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sistolica REAL NOT NULL, 
    diastolica REAL NOT NULL,
    pulsaciones INTEGER NOT NULL,
    fecha TEXT NOT NULL,
    hora TEXT NOT NULL,
    timestamp INTEGER NOT NULL
  );
`);

const useTensionStore = create((set, get) => ({
  measurements: [],
  loading: true,

  loadMeasurements: async () => {
    try {
      const measurements = await db.getAllAsync(
        'SELECT * FROM tension_measurements ORDER BY timestamp DESC;'
      );
      set({ measurements, loading: false });
    } catch (error) {
      console.error('Error loading measurements:', error);
      set({ loading: false });
    }
  },

  // En tensionStore.js, modifica addMeasurement:
  addMeasurement: async ({ sistolica, diastolica, pulsaciones, fecha, hora }) => {
    try {
      const timestamp = Date.now();
      const result = await db.runAsync(
        'INSERT INTO tension_measurements (sistolica, diastolica, pulsaciones, fecha, hora, timestamp) VALUES (?, ?, ?, ?, ?, ?);',
        [sistolica, diastolica, pulsaciones, fecha, hora, timestamp]
      );

      // Obtener el ID insertado
      const id = result.lastInsertRowId;

      const { measurements } = get();
      set({
        measurements: [
          {
            id,
            sistolica: Number(sistolica),  
            diastolica: Number(diastolica),
            pulsaciones,
            fecha,
            hora,
            timestamp,
          },
          ...measurements,
        ],
      });
      return true;
    } catch (error) {
      console.error('Error adding measurement:', error);
      return false;
    }
  },

  deleteMeasurement: async (id) => {
    try {
      await db.runAsync('DELETE FROM tension_measurements WHERE id = ?;', [id]);
      const { measurements } = get();
      set({
        measurements: measurements.filter((m) => m.id !== id),
      });
      return true;
    } catch (error) {
      console.error('Error deleting measurement:', error);
      return false;
    }
  },

  getFormattedMeasurement: (value) => {
    return Number.isInteger(value) ? value.toString() : value.toFixed(1);
  },
}));

export default useTensionStore;
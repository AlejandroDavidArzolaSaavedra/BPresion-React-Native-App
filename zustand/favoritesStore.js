import { create } from 'zustand';
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('favorites.db');

db.execSync(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY NOT NULL,
    recipeData TEXT NOT NULL,
    timestamp INTEGER NOT NULL
  );
`);

const useFavoritesStore = create((set, get) => ({
  favorites: [],
  loading: true,

  loadFavorites: async () => {
    try {
      const favorites = await db.getAllAsync('SELECT * FROM favorites;');
      set({
        favorites: favorites.map(fav => JSON.parse(fav.recipeData)),
        loading: false
      });
    } catch (error) {
      console.error('Error loading favorites:', error);
      set({ loading: false });
    }
  },
  
  toggleFavorite: async (recipe) => {
    try {
      const { favorites } = get();
      const isFav = favorites.some(fav => fav.id === recipe.id);
      
      if (isFav) {
        await db.runAsync('DELETE FROM favorites WHERE id = ?;', [recipe.id]);
        set({
          favorites: favorites.filter(fav => fav.id !== recipe.id)
        });
      } else {
        await db.runAsync(
          'INSERT INTO favorites (id, recipeData, timestamp) VALUES (?, ?, ?);',
          [recipe.id, JSON.stringify(recipe), Date.now()]
        );
        set({
          favorites: [...favorites, recipe]
        });
      }
      return !isFav;
    } catch (error) {
      console.error('Error toggling favorite:', error);
      return false;
    }
  },

  isFavorite: (recipeId) => {
    const { favorites } = get();
    return favorites.some(fav => fav.id === recipeId);
  }
}));

export default useFavoritesStore;
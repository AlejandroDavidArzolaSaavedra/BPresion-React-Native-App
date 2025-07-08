import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, Button, Alert, Modal, ScrollView } from 'react-native';
import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_KEY } from '../config'; 
import useFavoritesStore from '../zustand/favoritesStore';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MEAL_TYPES = [
  { 
    id: 'breakfast', 
    name: 'Desayuno', 
    filters: { 
      type: 'breakfast',
      maxSodium: 300,
      minPotassium: 200,
      minMagnesium: 50
    } 
  },
  { 
    id: 'lunch', 
    name: 'Comida', 
    filters: { 
      type: 'main course',
      maxSodium: 500,
      minPotassium: 300,
      minMagnesium: 70
    } 
  },
  { 
    id: 'snack', 
    name: 'Merienda', 
    filters: { 
      type: 'snack',
      maxSodium: 200,
      minPotassium: 150,
      minMagnesium: 30
    } 
  },
  { 
    id: 'dinner', 
    name: 'Cena', 
    filters: { 
      type: 'dinner',
      maxSodium: 400,
      minPotassium: 250,
      minMagnesium: 60
    } 
  },
];

const Receip = () => {
  const [recipes, setRecipes] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedMeal, setSelectedMeal] = useState('breakfast');
  const [expandedRecipe, setExpandedRecipe] = useState(null);
  const [db, setDb] = useState(null);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const { 
    favorites, 
    loading: loadingFavorites, 
    loadFavorites, 
    toggleFavorite, 
    isFavorite 
  } = useFavoritesStore();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    async function init() {
      await loadFavorites(); 
      const database = await SQLite.openDatabaseAsync('recipes.db');
      setDb(database);
      
      await database.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS recipes (
          id INTEGER PRIMARY KEY NOT NULL, 
          mealType TEXT NOT NULL, 
          data TEXT NOT NULL, 
          timestamp INTEGER NOT NULL
        );
      `);
      
      await loadCachedRecipes(database);
    }
    
    init();
  }, []);

  useEffect(() => {
    loadFavorites();
  }, []);

  useEffect(() => {
    const checkFavorites = async () => {
      const status = {};
      if (recipes[selectedMeal]) {
        for (const recipe of recipes[selectedMeal]) {
          status[recipe.id] = await isFavorite(recipe.id);
        }
        setFavoriteStatus(status);
      }
    };
    checkFavorites();
  }, [recipes, selectedMeal]);


  const loadCachedRecipes = async (database) => {
    try {
      const allRows = await database.getAllAsync('SELECT * FROM recipes;');
      const cachedRecipes = {};
      
      allRows.forEach(row => {
        if (!cachedRecipes[row.mealType]) {
          cachedRecipes[row.mealType] = [];
        }
        cachedRecipes[row.mealType].push(JSON.parse(row.data));
      });
      
      if (Object.keys(cachedRecipes).length > 0) {
        setRecipes(cachedRecipes);
      }
      
      await fetchRecipes(database);
    } catch (error) {
      console.error('Error loading cached recipes:', error);
      await fetchRecipes(database);
    }
  };

  const fetchRecipes = async (database) => {
    setLoading(true);
    
    try {
      const lastApiCall = await AsyncStorage.getItem('lastApiCall');
      const now = Date.now();
      const twoWeeks = 14 * 24 * 60 * 60 * 1000;
      
      if (lastApiCall && (now - parseInt(lastApiCall) < twoWeeks)) {
        setLoading(false);
        return;
      }
      
      await AsyncStorage.setItem('lastApiCall', now.toString());
      
      for (const mealType of MEAL_TYPES) {
        await fetchRecipesFromAPI(database, mealType);
      }
    } catch (error) {
      console.error('Error checking last update:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecipesFromAPI = async (database, mealType) => {
    try {
      const { id, filters } = mealType;
      const queryParams = new URLSearchParams({
        ...filters,
        diet: 'vegetarian,low-fat',
        intolerances: 'dairy',
        number: '5',
        addRecipeInformation: 'true',
        addRecipeNutrition: 'true',
        apiKey: API_KEY,
      });

      const response = await fetch(`https://api.spoonacular.com/recipes/complexSearch?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        await database.withTransactionAsync(async () => {
          await database.runAsync('DELETE FROM recipes WHERE mealType = ?;', [id]);        
          for (const recipe of data.results) {
            const optimizedRecipe = {
              ...recipe,
              image: recipe.image?.replace(/-\d+x\d+\./, '-636x393.') || 'https://spoonacular.com/recipeImages/placeholder-636x393.png'
            };
            
            await database.runAsync(
              'INSERT INTO recipes (mealType, data, timestamp) VALUES (?, ?, ?);',
              [id, JSON.stringify(optimizedRecipe), Date.now()]
            );
          }
        });
        
        setRecipes(prev => ({
          ...prev,
          [id]: data.results.map(recipe => ({
            ...recipe,
            image: recipe.image?.replace(/-\d+x\d+\./, '-636x393.') || 'https://spoonacular.com/recipeImages/placeholder-636x393.png'
          })),
        }));
      }
    } catch (error) {
      console.error('Error fetching recipes:', error);
      Alert.alert('Error', 'No se pudieron cargar las recetas. Verifica tu conexión a internet.');
    }
  };

  const handleRefresh = async () => {
    if (!db) return;
    
    Alert.alert(
      'Actualizar recetas',
      '¿Estás seguro que quieres actualizar todas las recetas ahora?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Actualizar', 
          onPress: async () => {
            setLoading(true);
            try {
              await AsyncStorage.setItem('lastApiCall', Date.now().toString());
              for (const mealType of MEAL_TYPES) {
                await fetchRecipesFromAPI(db, mealType);
              }
            } finally {
              setLoading(false);
            }
          } 
        }
      ]
    );
  };

  const renderRecipe = ({ item }) => (
    <TouchableOpacity 
      style={styles.recipeCard}
      onPress={() => setExpandedRecipe(expandedRecipe === item.id ? null : item.id)}
    >
      <Image 
        source={{ uri: item.image }} 
        style={styles.recipeImage}
        resizeMode="cover"
      />
      <View style={styles.recipeInfo}>
      <View style={styles.recipeHeader}>
        <Text style={styles.recipeTitle}>{item.title}</Text>
        <TouchableOpacity 
          onPress={async (e) => {
            e.stopPropagation();
            await toggleFavorite(item);
          }}
        >
          <Ionicons 
            name={isFavorite(item.id) ? "heart" : "heart-outline"} 
            size={24} 
            color={isFavorite(item.id) ? "red" : "gray"} 
          />
        </TouchableOpacity>
        </View>

        {expandedRecipe === item.id && (
          <View style={styles.recipeDetails}>
            <Text style={styles.recipeSummary} numberOfLines={4}>
              {item.summary?.replace(/<[^>]+>/g, '') || 'Descripción no disponible.'}
            </Text>
            <TouchableOpacity 
            style={styles.moreInfoButton}
            onPress={() => setSelectedRecipe(item)}
          >
            <Text style={styles.moreInfoText}>Más información</Text>
          </TouchableOpacity>
            
            {item.nutrition && (
              <View style={styles.nutritionFacts}>
                <Text style={styles.nutritionTitle}>Información Nutricional:</Text>
                <Text>Calorías: {Math.round(item.nutrition.nutrients.find(n => n.name === 'Calories')?.amount || 0)}</Text>
                <Text>Sodio: {Math.round(item.nutrition.nutrients.find(n => n.name === 'Sodium')?.amount || 0)}mg</Text>
                <Text>Potasio: {Math.round(item.nutrition.nutrients.find(n => n.name === 'Potassium')?.amount || 0)}mg</Text>
                <Text>Magnesio: {Math.round(item.nutrition.nutrients.find(n => n.name === 'Magnesium')?.amount || 0)}mg</Text>
              </View>
            )}
            
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Recetas para Controlar la Tensión</Text>
      
      <View style={styles.mealSelector}>
        {MEAL_TYPES.map(meal => (
          <TouchableOpacity
            key={meal.id}
            style={[
              styles.mealButton,
              selectedMeal === meal.id && styles.selectedMealButton
            ]}
            onPress={() => setSelectedMeal(meal.id)}
          >
            <Text style={selectedMeal === meal.id ? styles.selectedMealText : styles.mealText}>
              {meal.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#30a99e" />
          <Text>Cargando recetas saludables...</Text>
        </View>
      ) : (
        <FlatList
          data={recipes[selectedMeal] || []}
          renderItem={renderRecipe}
          keyExtractor={item => item.id.toString()}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text>No hay recetas disponibles.</Text>
              <Button 
                title="Recargar" 
                onPress={handleRefresh} 
                color="#30a99e"
              />
            </View>
          }
          contentContainerStyle={styles.listContainer}
        />
      )}
      
      <TouchableOpacity 
        style={styles.refreshButton}
        onPress={handleRefresh}
      >
        <Text style={styles.refreshText}>Actualizar Recetas</Text>
      </TouchableOpacity>


      <Modal
      visible={!!selectedRecipe}
      animationType="slide"
      transparent={false}
      onRequestClose={() => setSelectedRecipe(null)}
    >
      {selectedRecipe && (
        <View style={styles.modalContainer}>
          <ScrollView>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedRecipe.title}</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setSelectedRecipe(null)}
              >
                <Text style={styles.closeButtonText}>X</Text>
              </TouchableOpacity>
            </View>
            
            <Image 
              source={{ uri: selectedRecipe.image }} 
              style={styles.modalImage}
              resizeMode="cover"
            />
            
            <View style={styles.modalContent}>
              <Text style={styles.sectionTitle}>Descripción:</Text>
              <Text style={styles.modalText}>
                {selectedRecipe.summary?.replace(/<[^>]+>/g, '') || 'Descripción no disponible.'}
              </Text>
              
              {selectedRecipe.instructions && (
                <>
                  <Text style={styles.sectionTitle}>Instrucciones:</Text>
                  <Text style={styles.modalText}>
                    {selectedRecipe.instructions.replace(/<[^>]+>/g, '\n')}
                  </Text>
                </>
              )}
              
              {selectedRecipe.nutrition && (
                <>
                  <Text style={styles.sectionTitle}>Información Nutricional:</Text>
                  {selectedRecipe.nutrition.nutrients.map(nutrient => (
                    <Text key={nutrient.name} style={styles.modalText}>
                      {nutrient.name}: {Math.round(nutrient.amount)}{nutrient.unit}
                    </Text>
                  ))}
                </>
              )}
              
              {selectedRecipe.extendedIngredients && (
                <>
                  <Text style={styles.sectionTitle}>Ingredientes:</Text>
                  {selectedRecipe.extendedIngredients.map(ingredient => (
                    <Text key={ingredient.id} style={styles.modalText}>
                      • {ingredient.original}
                    </Text>
                  ))}
                </>
              )}
            </View>
          </ScrollView>
        </View>
      )}
    </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#30a99e',
    marginBottom: 15,
    textAlign: 'center',
  },
  mealSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  mealButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: '#e0f7fa',
  },
  selectedMealButton: {
    backgroundColor: '#30a99e',
  },
  mealText: {
    color: '#00796b',
  },
  selectedMealText: {
    color: 'white',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  listContainer: {
    paddingBottom: 20,
  },
  recipeCard: {
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    backgroundColor: '#fafafa',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    borderWidth: 0.5,
    borderColor: '#e0e0e0',
    width: '100%', 
    maxWidth: 500,
    alignSelf: 'center', 
  },  
  recipeImage: {
    width: '100%',
    aspectRatio: 2, 
    borderRadius: 8,
    alignSelf: 'center',
  },
  recipeInfo: {
    padding: 10,
    width: '100%', 
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
    flex: 1, 
    marginRight: 10,
  },
  recipeDetails: {
    marginTop: 10,
  },
  recipeSummary: {
    color: '#666',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  nutritionFacts: {
    marginVertical: 10,
    padding: 10,
    backgroundColor: '#e0f7fa',
    borderRadius: 8,
  },
  nutritionTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#30a99e',
  },
  refreshButton: {
    backgroundColor: '#30a99e',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  refreshText: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    marginTop: "10%",
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#30a99e',
    flex: 1,
  },
  closeButton: {
    padding: 10,
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#30a99e',
  },
  modalImage: {
    width: '100%',
    height: 250,
    borderRadius: 10,
    marginBottom: 15,
  },
  modalContent: {
    paddingBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#30a99e',
    marginTop: 15,
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  moreInfoButton: {
    backgroundColor: '#30a99e',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  moreInfoText: {
    color: 'white',
    fontWeight: 'bold',
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%', 
  },
  favoriteButton: {
    padding: 5,
  },
});

export default Receip;
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import useFavoritesStore from '../zustand/favoritesStore';
import { Ionicons } from '@expo/vector-icons';

const Favorites = () => {
  const { favorites, loading, loadFavorites, toggleFavorite } = useFavoritesStore();
  const [expandedRecipe, setExpandedRecipe] = useState(null);

  useEffect(() => {
    loadFavorites();
  }, []);

  const renderFavorite = ({ item }) => (
    <TouchableOpacity 
      style={styles.recipeCard}
      onPress={() => setExpandedRecipe(expandedRecipe === item.id ? null : item.id)}
    >
      <Image 
        source={{ uri: item.image }} 
        style={{
            width: expandedRecipe === item.id ? '100%' : 400,
            height: 200,
            alignSelf: expandedRecipe === item.id ? 'stretch' : 'center',
          }}
        resizeMode="cover"
      />
      <View style={styles.recipeInfo}>
        <View style={styles.recipeHeader}>
          <Text style={styles.recipeTitle}>{item.title}</Text>
          <TouchableOpacity 
            onPress={(e) => {
                e.stopPropagation();
                toggleFavorite(item).then(() => loadFavorites());
              }}
            style={styles.favoriteButton}
          >
            <Ionicons name="heart" size={24} color="red" />
          </TouchableOpacity>
        </View>
        
        {expandedRecipe === item.id && (
          <View style={styles.recipeDetails}>
            <Text style={styles.recipeSummary}>
              {item.summary?.replace(/<[^>]+>/g, '') || 'Descripción no disponible.'}
            </Text>
            
            {item.nutrition && (
              <View style={styles.nutritionFacts}>
                <Text style={styles.nutritionTitle}>Información Nutricional:</Text>
                <Text>Calorías: {Math.round(item.nutrition.nutrients.find(n => n.name === 'Calories')?.amount || 0)}</Text>
                <Text>Sodio: {Math.round(item.nutrition.nutrients.find(n => n.name === 'Sodium')?.amount || 0)}mg</Text>
                <Text>Potasio: {Math.round(item.nutrition.nutrients.find(n => n.name === 'Potassium')?.amount || 0)}mg</Text>
                <Text>Magnesio: {Math.round(item.nutrition.nutrients.find(n => n.name === 'Magnesium')?.amount || 0)}mg</Text>
              </View>
            )}
            
            {item.extendedIngredients && (
              <View style={styles.ingredientsContainer}>
                <Text style={styles.sectionTitle}>Ingredientes:</Text>
                {item.extendedIngredients.map(ingredient => (
                  <Text key={ingredient.id} style={styles.ingredientText}>
                    • {ingredient.original}
                  </Text>
                ))}
              </View>
            )}
            
            {item.instructions && (
              <View style={styles.instructionsContainer}>
                <Text style={styles.sectionTitle}>Instrucciones:</Text>
                <Text style={styles.instructionsText}>
                  {item.instructions.replace(/<[^>]+>/g, '\n')}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Tus Recetas Favoritas</Text>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text>Cargando favoritos...</Text>
        </View>
      ) : favorites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text>No tienes recetas favoritas todavía</Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          renderItem={renderFavorite}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContainer}
        />
      )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    alignContent: 'center',
  },  
  recipeInfo: {
    padding: 15,
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  favoriteButton: {
    padding: 5,
    marginLeft: 10,
  },
  recipeDetails: {
    marginTop: 10,
  },
  recipeSummary: {
    color: '#666',
    marginBottom: 15,
    lineHeight: 22,
  },
  nutritionFacts: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#e0f7fa',
    borderRadius: 8,
  },
  nutritionTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#30a99e',
  },
  ingredientsContainer: {
    marginBottom: 15,
  },
  ingredientText: {
    marginLeft: 10,
    marginBottom: 5,
    lineHeight: 22,
  },
  instructionsContainer: {
    marginBottom: 10,
  },
  instructionsText: {
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#30a99e',
    marginBottom: 8,
  },
});

export default Favorites;
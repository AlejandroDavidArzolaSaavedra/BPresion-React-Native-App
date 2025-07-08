import React from 'react';
import { View, Text, StyleSheet, Image, FlatList } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const foodsData = [
    { 
      id: 1, 
      name: 'Limón', 
      benefits: 'Rico en vitamina C y flavonoides que fortalecen los vasos sanguíneos',
      image: { uri: 'https://www.lavanguardia.com/files/og_thumbnail/uploads/2018/08/14/5e9977ec9aef6.jpeg'}
    },
    { 
      id: 2, 
      name: 'Avena', 
      benefits: 'Contiene beta-glucanos que ayudan a reducir el colesterol y la presión',
      image: { uri: 'https://nutrimill.com/cdn/shop/articles/The_Benefits_of_Oat_Grain_and_Flour.png?v=1687292901&width=1500'}
    },
    { 
      id: 3, 
      name: 'Espinacas', 
      benefits: 'Alto contenido en potasio, magnesio y luteína beneficiosos para el corazón',
      image:  { uri: 'https://i.blogs.es/10d3c5/espinacas-rec/450_1000.jpg'}
    },
    { 
      id: 4, 
      name: 'Salmón', 
      benefits: 'Ácidos grasos omega-3 que reducen la inflamación y mejoran la circulación',
      image:  { uri: 'https://imag.bonviveur.com/salmon-a-la-plancha-facil-foto-cerca.jpg'}
    },
    { 
      id: 5, 
      name: 'Aguacate', 
      benefits: 'Grasas saludables y potasio que ayudan a regular la presión arterial',
      image:  { uri: 'https://s3-eu-west-1.amazonaws.com/yara-links/civd.jpg'}
    },
    { 
      id: 6, 
      name: 'Nueces', 
      benefits: 'Contienen arginina, un aminoácido que ayuda a relajar los vasos sanguíneos',
      image:  { uri: 'https://static-cla-nys.pro.centrallecheraasturiana.es/uploads/2021/03/bol-nueces.jpg'}
    },
    { 
      id: 7, 
      name: 'Remolacha', 
      benefits: 'Fuente natural de nitratos que mejoran el flujo sanguíneo',
      image:  { uri: 'https://i.blogs.es/08042d/remolachas/840_560.jpg'}
    },
    { 
      id: 8, 
      name: 'Ajo', 
      benefits: 'Contiene alicina, compuesto que ayuda a relajar los vasos sanguíneos',
      image:  { uri: 'https://www.salud.mapfre.es/wp-content/uploads/2016/07/ajo-3.jpg'}
    }
];

const FoodItem = ({ image, name, benefits }) => (
  <View style={styles.foodItem}>
    <Image source={image} style={styles.foodImage} />
    <View style={styles.foodTextContainer}>
      <Text style={styles.foodName}>{name}</Text>
      <View style={styles.benefitsContainer}>
        <Ionicons name="heart" size={16} color="#30a99e" />
        <Text style={styles.foodBenefits}>{benefits}</Text>
      </View>
    </View>
  </View>
);

const FoodList = () => {
  return (
    <View style={styles.container}>
      <FlatList
        data={foodsData}
        renderItem={({ item }) => (
          <FoodItem 
            image={item.image} 
            name={item.name} 
            benefits={item.benefits}
          />
        )}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <Text style={styles.header}>Alimentos para controlar la tensión</Text>
            <Text style={styles.subheader}>Estos alimentos ayudan a mantener una presión arterial saludable</Text>
          </>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    fontSize: 24,
    fontWeight: '600',
    color: '#30a99e',
    textAlign: 'center',
    marginBottom: 8,
    paddingTop: 16,
  },
  subheader: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  foodItem: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#30a99e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  foodImage: {
    width: 80,
    height: 80,
    borderTopLeftRadius: 16, 
    borderBottomLeftRadius: 16,
  },
  foodTextContainer: {
    flex: 1,
    padding: 12,
  },
  foodName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  benefitsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  foodBenefits: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
    lineHeight: 20,
  },
});

export default FoodList;
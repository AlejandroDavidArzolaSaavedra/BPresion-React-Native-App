import { View, StyleSheet } from 'react-native';
import FoodList from '../../src/FoodList';

export default function FoodTab() {
  return (
    <View style={styles.container}>
      <FoodList />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
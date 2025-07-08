import { View, StyleSheet } from 'react-native';
import Favorites from '../../src/Favorites';

export default function FavoriteTab() {
  return (
    <View style={styles.container}>
      <Favorites />
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
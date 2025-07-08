import { View, StyleSheet } from 'react-native';
import HomeComponent from '../../src/Home';

export default function Home() {
  return (
    <View style={styles.container}>
      <HomeComponent />
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
import { View, StyleSheet } from 'react-native';
import Receip from '../../src/Receip';

export default function ReceipTab() {
  return (
    <View style={styles.container}>
      <Receip />
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
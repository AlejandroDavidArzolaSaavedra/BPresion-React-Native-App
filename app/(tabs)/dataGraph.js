import { View, StyleSheet } from 'react-native';
import DataGraphComponent from '../../src/DataGraph'; 

export default function DataGraph() {
  return (
    <View style={styles.container}>
      <DataGraphComponent />
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
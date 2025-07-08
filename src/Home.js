import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import useTensionStore from '../zustand/tensionStore';
import FontAwesome from '@expo/vector-icons/FontAwesome';

const Home = () => {
  const [sistolica, setSistolica] = useState('');
  const [diastolica, setDiastolica] = useState('');
  const [pulsaciones, setPulsaciones] = useState('');
  
  const {
    measurements,
    loadMeasurements,
    addMeasurement,
    deleteMeasurement,
    getFormattedMeasurement
  } = useTensionStore();

  useEffect(() => {
    loadMeasurements();
  }, []);

  const ultimosRegistros = measurements.slice(0, 3);

  const validarCampos = () => {
    const regexPresion = /^\d{1,3}([.,]\d)?$/;
    const regexPulso = /^\d{1,3}$/;

    if (!sistolica || !diastolica || !pulsaciones) {
      Alert.alert('Campos incompletos', 'Por favor, completa todos los campos.');
      return false;
    }

    if (!regexPresion.test(sistolica)) {
      Alert.alert('Dato incorrecto', 'Presión sistólica debe ser un número (ej: 120 o 120,5).');
      return false;
    }

    if (!regexPresion.test(diastolica)) {
      Alert.alert('Dato incorrecto', 'Presión diastólica debe ser un número (ej: 80 o 80,5).');
      return false;
    }

    if (!regexPulso.test(pulsaciones)) {
      Alert.alert('Dato incorrecto', 'Pulsaciones deben ser un número entero de hasta 3 dígitos.');
      return false;
    }

    return true;
  };

  const generateTxtContent = () => {
    let content = "Registros de presión arterial y pulsaciones\n\n";
    content += "Fecha\tHora\tSistólica\tDiastólica\tPulsaciones\n";
    
    measurements.forEach(item => {
      content += `${item.fecha}\t${item.hora}\t${item.sistolica}\t${item.diastolica}\t${item.pulsaciones}\n`;
    });
    
    return content;
  };

  const generateCsvContent = () => {
    let content = "Fecha,Hora,Sistólica,Diastólica,Pulsaciones\n";
    
    measurements.forEach(item => {
      content += `${item.fecha},${item.hora},${item.sistolica},${item.diastolica},${item.pulsaciones}\n`;
    });
    
    return content;
  };

  const handleDownloadTxt = async () => {
    try {
      const content = generateTxtContent();
      const fileUri = FileSystem.documentDirectory + 'registros_presion.txt';
      
      await FileSystem.writeAsStringAsync(fileUri, content, {
        encoding: FileSystem.EncodingType.UTF8
      });
      
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/plain',
        dialogTitle: 'Compartir registros en formato TXT',
        UTI: 'public.plain-text'
      });
      
    } catch (error) {
      Alert.alert('Error', 'No se pudo generar el archivo TXT');
      console.error(error);
    }
  };

  const handleDownloadExcel = async () => {
    try {
      const content = generateCsvContent();
      const fileUri = FileSystem.documentDirectory + 'registros_presion.csv';
      
      await FileSystem.writeAsStringAsync(fileUri, content, {
        encoding: FileSystem.EncodingType.UTF8
      });
      
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: 'Compartir registros en formato CSV',
        UTI: 'public.comma-separated-values-text'
      });
      
    } catch (error) {
      Alert.alert('Error', 'No se pudo generar el archivo CSV');
      console.error(error);
    }
  };

  const agregarRegistro = async () => {
    if (!validarCampos()) return;

    const sistolicaNum = sistolica.replace(',', '.');
    const diastolicaNum = diastolica.replace(',', '.');

    const ahora = new Date();
    const fecha = ahora.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\//g, '/');
    const hora = ahora.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const success = await addMeasurement({
      sistolica: sistolicaNum,
      diastolica: diastolicaNum,
      pulsaciones,
      fecha,
      hora
    });

    if (success) {
      setSistolica('');
      setDiastolica('');
      setPulsaciones('');
    }
  };

  const eliminarRegistro = async (id) => {
    Alert.alert(
      'Eliminar registro',
      '¿Estás seguro de que quieres eliminar esta medición?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          onPress: async () => {
            const success = await deleteMeasurement(id);
            if (success) {
              Alert.alert('Éxito', 'Medición eliminada correctamente');
            } else {
              Alert.alert('Error', 'No se pudo eliminar la medición');
            }
          },
          style: 'destructive',
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Image source={require("../assets/logo.png")} style={styles.image} />
          <Text style={styles.title}>BPresion</Text>
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.subtitle}>Toma nota tu presión arterial y tus pulsaciones.</Text>
          <Text style={styles.sectionSubtitle}>
            Ver todo tu historial
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity onPress={handleDownloadExcel} style={styles.button}>
            <Text style={styles.buttonText}><FontAwesome name="download" size={24} color="white" /> Excel</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleDownloadTxt} style={styles.button}>
            <Text style={styles.buttonText}><FontAwesome name="download" size={24} color="white" /> TXT</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="Presión sistólica (mmHg)"
            value={sistolica}
            onChangeText={setSistolica}
            placeholderTextColor="#999"
          />
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="Presión diastólica (mmHg)"
            value={diastolica}
            onChangeText={setDiastolica}
            placeholderTextColor="#999"
          />
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="Pulsaciones"
            value={pulsaciones}
            onChangeText={setPulsaciones}
            placeholderTextColor="#999"
          />

          <TouchableOpacity 
            style={styles.addButton}
            onPress={agregarRegistro}
          >
            <Text style={styles.addButtonText}>Agregar Registro</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Últimos registros:</Text>
        
        {ultimosRegistros.length === 0 ? (
          <Text style={styles.emptyText}>No hay registros recientes</Text>
        ) : (
          <View>
            {ultimosRegistros.map((item) => (
              <View key={item.id.toString()} style={styles.registroContainer}>
                <View style={styles.registroContent}>
                  <Text style={styles.registroTexto}>
                    {getFormattedMeasurement(item.sistolica)}/{getFormattedMeasurement(item.diastolica)} mmHg
                  </Text>
                  <Text style={styles.registroSubtexto}>
                    {item.pulsaciones} pulsaciones • {item.fecha} - {item.hora}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={() => eliminarRegistro(item.id)}
                >
                  <Text style={styles.deleteButtonText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  scrollContainer: {
    padding: 25,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#30a99e',
    marginBottom: 10,
    textAlign: 'left',
  },
  subtitle: {
    fontSize: 18,
    color: '#555',
    textAlign: 'left',
  },
  sectionSubtitle: {
    fontSize: 20,
    color: '#30a99e',
    marginBottom: 15,
    marginTop: 15,
    textAlign: 'center',
    fontWeight: '600',
  },
  inputContainer: {
    backgroundColor: '#ffffff',
    padding: 25,
    borderRadius: 12,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
    width: '100%',
  },
  input: {
    borderBottomWidth: 2,
    borderBottomColor: '#30a99e',
    marginBottom: 20,
    paddingVertical: 12,
    fontSize: 18,
    color: '#333',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 15,
    color: '#30a99e',
    marginTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center', 
    alignSelf: "center",
    marginBottom: 30,
    width: '100%',
  },
  image: {
    width: 200,
    height: 150,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 25,
    width: '100%',
  },
  button: {
    backgroundColor: '#30a99e',
    padding: 15,
    borderRadius: 10,
    minWidth: 160,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#30a99e',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  registroContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 18,
    borderRadius: 10,
    marginBottom: 15,
    borderLeftWidth: 5,
    borderLeftColor: '#30a99e',
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  registroContent: {
    flex: 1,
  },
  registroTexto: {
    fontSize: 18,
    color: '#333',
    fontWeight: '500',
  },
  registroSubtexto: {
    fontSize: 14,
    color: '#666',
    marginTop: 6,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 15,
  },
  deleteButtonText: {
    color: '#aaa',
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 28,
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    marginTop: 30,
    fontStyle: 'italic',
    fontSize: 16,
    padding: 20,
  },
});

export default Home;
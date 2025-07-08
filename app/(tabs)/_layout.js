import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, paddingTop: insets.top, }}>
      {/* Configuración del StatusBar */}
      <StatusBar style="dark" backgroundColor="#EEEFEF" />
      
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#30a99e',
          tabBarStyle: {
            paddingBottom: insets.bottom,
            height: 60 + insets.bottom,
          },
        }}
      >
        <Tabs.Screen
          name="favorites"
          options={{
            title: 'Favoritos',
            headerShown: false,
            tabBarIcon: ({ color }) => <FontAwesome size={28} name="heart" color={color} />,
          }}
        />
        <Tabs.Screen
          name="receip"
          options={{
            title: 'Recetas',
            headerShown: false,
            tabBarIcon: ({ color }) => <FontAwesome size={28} name="cutlery" color={color} />,
          }}
        />
        <Tabs.Screen
          name="index"
          options={{
            title: 'Inicio',
            headerShown: false,
            tabBarIcon: ({ color }) => <FontAwesome size={28} name="home" color={color} />,
          }}
        />
        <Tabs.Screen
          name="foodList"
          options={{
            title: 'Alimentos',
            headerShown: false,
            tabBarIcon: ({ color }) => <FontAwesome size={28} name="home" color={color} />,
          }}
        />
        <Tabs.Screen
          name="dataGraph"
          options={{
            title: 'Evolución',
            headerShown: false,
            tabBarIcon: ({ color }) => <FontAwesome size={28} name="bar-chart" color={color} />,
          }}
        />
      </Tabs>
    </View>
  );
}

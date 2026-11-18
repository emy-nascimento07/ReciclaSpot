import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';

import { colors, fonts } from './src/theme';
import { MainTabParamList, RootStackParamList } from './src/navigation/types';
import { useEffect } from 'react';
import { UserProvider } from './src/context/UserContext';
import { EcopontosProvider, useEcopontos } from './src/context/EcopontosContext';
import SplashScreen from './src/screens/SplashScreen';
import IntermediariaScreen from './src/screens/IntermediariaScreen';
import LoginScreen from './src/screens/LoginScreen';
import CadastroScreen from './src/screens/CadastroScreen';
import HomeScreen from './src/screens/HomeScreen';
import EcopontoScreen from './src/screens/EcopontoScreen';
import PerfilScreen from './src/screens/PerfilScreen';
import MapaScreen from './src/screens/MapaScreen';
import RegistrarDescarteScreen from './src/screens/RegistrarDescarteScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  const { iniciar } = useEcopontos();
  // pede a localização assim que o usuário entra no app (depois do login)
  useEffect(() => {
    iniciar();
  }, [iniciar]);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.green,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 11 },
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons
            name={
              route.name === 'Explorar' ? 'compass-outline' : route.name === 'Mapa' ? 'map-outline' : 'account-outline'
            }
            size={size}
            color={color}
          />
        ),
      })}
    >
      <Tab.Screen name="Explorar" component={HomeScreen} />
      <Tab.Screen name="Mapa" component={MapaScreen} />
      <Tab.Screen name="Perfil" component={PerfilScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator color={colors.green} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <UserProvider>
        <EcopontosProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#fff' } }}>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Intermediaria" component={IntermediariaScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Cadastro" component={CadastroScreen} />
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="Ecoponto" component={EcopontoScreen} />
            <Stack.Screen name="RegistrarDescarte" component={RegistrarDescarteScreen} />
          </Stack.Navigator>
        </NavigationContainer>
        </EcopontosProvider>
        <StatusBar style="dark" />
      </UserProvider>
    </SafeAreaProvider>
  );
}

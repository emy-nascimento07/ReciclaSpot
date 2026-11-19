import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Role } from '../types';

export type RootStackParamList = {
  Splash: undefined;
  Intermediaria: undefined;
  Login: { role: Role };
  Cadastro: { role: Role };
  Main: undefined;
  Ecoponto: { id: string };
  RegistrarDescarte: { fotoUri: string };
};

export type MainTabParamList = {
  Explorar: undefined;
  Mapa: undefined;
  Favoritos: undefined;
  Perfil: undefined;
};

export type StackProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;

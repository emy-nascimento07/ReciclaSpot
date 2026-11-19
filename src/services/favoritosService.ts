import AsyncStorage from '@react-native-async-storage/async-storage';
import { PontoColeta } from '../types';

const STORAGE_KEY = '@reciclaspot:favoritos';

export async function getFavoritos(): Promise<PontoColeta[]> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    return json ? JSON.parse(json) : [];
  } catch (error) {
    console.error('Erro ao ler favoritos:', error);
    return [];
  }
}

export async function isFavorito(id: string): Promise<boolean> {
  const lista = await getFavoritos();
  return lista.some((item) => item.id === id);
}

export async function toggleFavorito(ponto: PontoColeta): Promise<boolean> {
  try {
    const lista = await getFavoritos();
    const existe = lista.some((item) => item.id === ponto.id);

    const novaLista = existe
      ? lista.filter((item) => item.id !== ponto.id)
      : [...lista, ponto];

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(novaLista));
    return !existe;
  } catch (error) {
    console.error('Erro ao salvar favorito:', error);
    return false;
  }
}

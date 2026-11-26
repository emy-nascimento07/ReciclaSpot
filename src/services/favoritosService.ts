import { PontoColeta } from '../types';
import {
  alternarFavoritoDb,
  ehFavoritoDb,
  listarFavoritosDb,
} from './database';

export async function getFavoritos(): Promise<PontoColeta[]> {
  try {
    return await listarFavoritosDb();
  } catch (error) {
    console.error('Erro ao ler favoritos no SQLite:', error);
    return [];
  }
}

export async function isFavorito(id: string): Promise<boolean> {
  try {
    return await ehFavoritoDb(id);
  } catch (error) {
    console.error('Erro ao verificar favorito no SQLite:', error);
    return false;
  }
}

export async function toggleFavorito(ponto: PontoColeta): Promise<boolean> {
  try {
    return await alternarFavoritoDb(ponto);
  } catch (error) {
    console.error('Erro ao salvar favorito no SQLite:', error);
    return false;
  }
}

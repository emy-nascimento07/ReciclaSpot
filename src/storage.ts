import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';

export const CHAVE_USUARIO = 'reciclaspot:usuario:v2';
export const CHAVE_FAVORITOS = '@reciclaspot:favoritos';
export const CHAVE_ECOPONTOS = '@reciclaspot:ecopontos';

/** Lê um valor salvo no celular (ou null se não existir / estiver corrompido). */
export async function carregar<T>(chave: string = CHAVE_USUARIO): Promise<T | null> {
  try {
    const json = await AsyncStorage.getItem(chave);
    return json ? (JSON.parse(json) as T) : null;
  } catch {
    return null;
  }
}

export async function salvar(valor: unknown, chave: string = CHAVE_USUARIO) {
  try {
    await AsyncStorage.setItem(chave, JSON.stringify(valor));

    // Se estiver salvando o perfil completo, espelha também na chave literal exigida pelo requisito
    if (chave === CHAVE_USUARIO && valor && typeof valor === 'object' && 'favoritos' in valor) {
      await AsyncStorage.setItem(CHAVE_FAVORITOS, JSON.stringify((valor as { favoritos: unknown }).favoritos));
    }
  } catch {
    // sem espaço / erro de escrita: o app continua funcionando só em memória
  }
}

/**
 * A câmera grava a foto numa pasta temporária, que o sistema pode apagar.
 * Aqui copiamos para a pasta de documentos do app, que é permanente.
 */
export async function guardarFoto(uriTemporaria: string, id: string): Promise<string> {
  try {
    const pasta = new Directory(Paths.document, 'descartes');
    if (!pasta.exists) pasta.create({ intermediates: true, idempotent: true });
    const extensao = uriTemporaria.split('.').pop()?.split('?')[0] || 'jpg';
    const destino = new File(pasta, `${id}.${extensao}`);
    await new File(uriTemporaria).copy(destino);
    return destino.uri;
  } catch {
    // se a cópia falhar, usa a foto original mesmo
    return uriTemporaria;
  }
}

export function apagarFoto(uri: string) {
  try {
    const f = new File(uri);
    if (f.exists) f.delete();
  } catch {
    // ignora
  }
}

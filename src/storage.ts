import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';

const CHAVE = 'reciclaspot:usuario:v2';

/** Lê um valor salvo no celular (ou null se não existir / estiver corrompido). */
export async function carregar<T>(): Promise<T | null> {
  try {
    const json = await AsyncStorage.getItem(CHAVE);
    return json ? (JSON.parse(json) as T) : null;
  } catch {
    return null;
  }
}

export async function salvar(valor: unknown) {
  try {
    await AsyncStorage.setItem(CHAVE, JSON.stringify(valor));
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

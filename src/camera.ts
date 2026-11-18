import { Alert, Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

/**
 * Pede permissão e abre a câmera do celular.
 * Retorna o endereço (uri) da foto tirada, ou null se o usuário cancelar / negar.
 */
export async function tirarFoto(): Promise<string | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) {
    Alert.alert(
      'Câmera bloqueada',
      'Para registrar um descarte, permita o acesso à câmera nas configurações do celular.',
      perm.canAskAgain
        ? [{ text: 'OK' }]
        : [
            { text: 'Agora não', style: 'cancel' },
            { text: 'Abrir configurações', onPress: () => Linking.openSettings() },
          ],
    );
    return null;
  }

  try {
    const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.6 });
    if (res.canceled || !res.assets?.length) return null;
    return res.assets[0].uri;
  } catch {
    // ex.: simulador do iPhone, que não tem câmera
    Alert.alert('Câmera indisponível', 'Não foi possível abrir a câmera neste aparelho.');
    return null;
  }
}

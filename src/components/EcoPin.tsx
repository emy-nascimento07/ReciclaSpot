import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme';

/** Pino verde com o símbolo de reciclagem, usado como marcador no mapa. */
export default function EcoPin({ ativo = false }: { ativo?: boolean }) {
  const cor = ativo ? colors.blue : colors.green;
  return (
    <View style={s.wrap}>
      <View style={[s.circle, { backgroundColor: cor }, ativo && s.circleAtivo]}>
        <MaterialCommunityIcons name="recycle-variant" size={ativo ? 24 : 20} color={colors.white} />
      </View>
      <View style={[s.tip, { borderTopColor: cor }]} />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { alignItems: 'center' },
  circle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.white,
  },
  circleAtivo: { width: 46, height: 46, borderRadius: 23 },
  tip: {
    width: 0,
    height: 0,
    marginTop: -2,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
});

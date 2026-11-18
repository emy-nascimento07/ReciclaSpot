import { Image, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { BackButton, CategoryRow, Screen } from '../components/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import EcoPin from '../components/EcoPin';
import { colors, fonts } from '../theme';
import { useEcopontos } from '../context/EcopontosContext';
import { StackProps } from '../navigation/types';

const foto = require('../../assets/images/ecoponto.png');
const wordmark = require('../../assets/images/wordmark.png');

const FOTO_RATIO = 443 / 855;
const MARGEM = 16;

export default function EcopontoScreen({ route }: StackProps<'Ecoponto'>) {
  const { ecopontos } = useEcopontos();
  const eco = ecopontos.find((e) => e.id === route.params.id) ?? ecopontos[0];
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const fotoW = width - MARGEM * 2;
  const fotoH = Math.min(fotoW * FOTO_RATIO, 240);

  return (
    <Screen edges={['top', 'right', 'left']}>
      <View style={s.header}>
        <BackButton inline />
        <Image source={wordmark} style={s.headerLogo} resizeMode="contain" />
        {/* espaço do mesmo tamanho da seta, para o logo ficar centralizado */}
        <View style={{ width: 34 }} />
      </View>

      <ScrollView contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 32 }]}>
        <Image source={foto} style={[s.foto, { width: fotoW, height: fotoH }]} resizeMode="cover" />

        <Text style={s.title}>{eco.nomeCompleto}</Text>
        <View style={s.info}>
          <Text style={s.infoText}>
            <Text style={s.bold}>Horários: </Text>
            {eco.horarios}
          </Text>
          <Text style={s.infoText}>
            <Text style={s.bold}>Endereço: </Text>
            {eco.endereco}
          </Text>
          <Text style={s.infoText}>
            <Text style={s.bold}>Distância: </Text>
            {eco.distancia} de você
          </Text>
        </View>

        <Text style={s.section}>O que pode descartar aqui</Text>
        <CategoryRow only={eco.aceita} />

        <Text style={s.section}>Localização</Text>
        <View style={s.mapBox}>
          <MapView
            key={`${eco.latitude},${eco.longitude}`}
            style={StyleSheet.absoluteFill}
            initialRegion={{ latitude: eco.latitude, longitude: eco.longitude, latitudeDelta: 0.012, longitudeDelta: 0.012 }}
            scrollEnabled={false}
            zoomEnabled={false}
            rotateEnabled={false}
            pitchEnabled={false}
            toolbarEnabled={false}
          >
            <Marker coordinate={{ latitude: eco.latitude, longitude: eco.longitude }} anchor={{ x: 0.5, y: 1 }}>
              <EcoPin ativo />
            </Marker>
          </MapView>
        </View>
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 10,
  },
  headerLogo: { width: 120, height: 120 * (138 / 549) },
  scroll: { paddingHorizontal: MARGEM, paddingBottom: 32 },
  foto: { borderRadius: 12, backgroundColor: colors.bgArc },
  title: { fontFamily: fonts.semibold, fontSize: 22, lineHeight: 30, color: colors.black, marginTop: 16 },
  info: { marginTop: 8, gap: 4 },
  infoText: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: colors.black },
  bold: { fontFamily: fonts.semibold },
  mapBox: { height: 180, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.bgArc },
  section: { fontFamily: fonts.medium, fontSize: 15, color: colors.black, marginTop: 24, marginBottom: 14 },
});

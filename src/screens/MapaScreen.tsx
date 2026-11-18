import { useEffect, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import EcoPin from '../components/EcoPin';
import { Button, Tag } from '../components/ui';
import { colors, fonts, shadow } from '../theme';
import { categories, Category, Ecoponto } from '../data';
import { useEcopontos } from '../context/EcopontosContext';
import { RootStackParamList } from '../navigation/types';

const wordmark = require('../../assets/images/wordmark.png');
const labelOf = (id: Category) => categories.find((c) => c.id === id)!.label;

export default function MapaScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const { ecopontos, regiao, status, cidade } = useEcopontos();
  const [selId, setSelId] = useState<string | null>(null);
  const selecionado = ecopontos.find((e) => e.id === selId) ?? null;
  const setSelecionado = (e: Ecoponto | null) => setSelId(e?.id ?? null);

  // quando a localização chega, centraliza o mapa no usuário
  useEffect(() => {
    if (status === 'ok') mapRef.current?.animateToRegion(regiao, 600);
  }, [status, regiao]);

  const selecionar = (e: Ecoponto) => {
    setSelecionado(e);
    mapRef.current?.animateToRegion(
      // desloca um pouco para baixo para o pino não ficar escondido atrás do card
      { latitude: e.latitude - 0.006, longitude: e.longitude, latitudeDelta: 0.04, longitudeDelta: 0.04 },
      400,
    );
  };

  const centralizar = () => {
    setSelecionado(null);
    mapRef.current?.animateToRegion(regiao, 400);
  };

  return (
    <View style={s.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={regiao}
        showsUserLocation={status === 'ok'}
        showsMyLocationButton={false}
        onPress={(ev) => {
          // toque no mapa vazio fecha o card (toque em marcador tem action 'marker-press')
          if (ev.nativeEvent.action !== 'marker-press') setSelecionado(null);
        }}
        showsPointsOfInterests={false}
        toolbarEnabled={false}
      >
        {ecopontos.map((e) => (
          <Marker
            key={e.id}
            coordinate={{ latitude: e.latitude, longitude: e.longitude }}
            anchor={{ x: 0.5, y: 1 }}
            onPress={() => selecionar(e)}
          >
            <EcoPin ativo={selecionado?.id === e.id} />
          </Marker>
        ))}
      </MapView>

      {/* Cabeçalho flutuante com o logo */}
      <View style={[s.header, { top: insets.top + 8 }]}>
        <Image source={wordmark} style={s.wordmark} resizeMode="contain" />
        <Text style={s.headerSub}>
          {status === 'carregando'
            ? 'Buscando sua localização...'
            : status === 'ok'
              ? `${ecopontos.length} ecopontos perto de você${cidade ? ` em ${cidade}` : ''}`
              : 'Localização desativada · pontos de exemplo'}
        </Text>
      </View>

      <Pressable style={[s.fab, { top: insets.top + 8 }]} onPress={centralizar} accessibilityLabel="Centralizar em mim">
        <MaterialCommunityIcons name="crosshairs-gps" size={22} color={colors.black} />
      </Pressable>

      {selecionado && (
        <View style={s.card}>
          <Text style={s.cardTitle}>{selecionado.nome}</Text>
          <View style={s.row}>
            <MaterialCommunityIcons name="map-marker-outline" size={20} color={colors.muted} />
            <Text style={s.cardText}>
              {selecionado.distancia} · {selecionado.endereco}
            </Text>
          </View>
          <View style={[s.row, { gap: 6, marginTop: 8 }]}>
            {selecionado.aceita.map((c) => (
              <Tag key={c} label={labelOf(c)} />
            ))}
          </View>
          <View style={{ marginTop: 14 }}>
            <Button
              title="Ver detalhes"
              color={colors.green}
              onPress={() => navigation.navigate('Ecoponto', { id: selecionado.id })}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: {
    position: 'absolute',
    left: 16,
    right: 76,
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    ...shadow,
  },
  wordmark: { width: 120, height: 120 * (138 / 549) },
  headerSub: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, marginTop: 4 },
  fab: {
    position: 'absolute',
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  card: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
    ...shadow,
  },
  cardTitle: { fontFamily: fonts.semibold, fontSize: 19, color: colors.black },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' },
  cardText: { fontFamily: fonts.regular, fontSize: 14, color: colors.text, flexShrink: 1 },
});

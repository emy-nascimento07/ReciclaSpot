import { useCallback, useEffect, useState } from 'react';
import {
  Image,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  BackButton,
  CategoryRow,
  ErrorState,
  FavoritoButton,
  Screen,
} from '../components/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import EcoPin from '../components/EcoPin';
import { colors, fonts } from '../theme';
import { useEcopontos, useUser } from '../hooks';
import { StackProps } from '../navigation/types';
import { getEcoponto } from '../services/api';
import { toggleFavorito } from '../services/favoritosService';
import { PontoColetaComDistancia } from '../types';

const fotoPadrao = require('../../assets/images/ecoponto.png');
const wordmark = require('../../assets/images/wordmark.png');

const FOTO_RATIO = 443 / 855;
const MARGEM = 16;
const MAP_DELTA = 0.012;

export default function EcopontoScreen({ route }: StackProps<'Ecoponto'>) {
  const { ecopontos, recarregar } = useEcopontos();
  const { ehFavorito, alternarFavorito } = useUser();
  const ecoLocal = ecopontos.find((e) => e.id === route.params.id) ?? ecopontos[0];

  const [ecoDetalhe, setEcoDetalhe] = useState<PontoColetaComDistancia>(ecoLocal);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState(false);
  const [fotoFalhou, setFotoFalhou] = useState(false);

  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const eco = ecoDetalhe ?? ecoLocal;
  const favoritado = ehFavorito(eco.id);
  const fotoW = width - MARGEM * 2;
  const fotoH = Math.min(fotoW * FOTO_RATIO, 240);
  const telefoneDigitos = eco.telefoneContato.replace(/\D/g, '');

  const carregarDetalhes = useCallback(async () => {
    try {
      const remoto = await getEcoponto(route.params.id);
      setEcoDetalhe((prev) => ({
        ...remoto,
        distanciaKm: prev?.distanciaKm ?? ecoLocal.distanciaKm,
        distancia: prev?.distancia ?? ecoLocal.distancia,
      }));
    } catch {
      setEcoDetalhe(ecoLocal);
    }
  }, [route.params.id, ecoLocal]);

  useEffect(() => {
    carregarDetalhes();
  }, [carregarDetalhes]);

  const onRefresh = useCallback(async () => {
    setAtualizando(true);
    setErro(false);

    try {
      await Promise.all([recarregar(), getEcoponto(route.params.id).then((remoto) => {
        setEcoDetalhe((prev) => ({
          ...remoto,
          distanciaKm: prev?.distanciaKm ?? ecoLocal.distanciaKm,
          distancia: prev?.distancia ?? ecoLocal.distancia,
        }));
      })]);
      setFotoFalhou(false);
    } catch {
      setErro(true);
    } finally {
      setAtualizando(false);
    }
  }, [recarregar, route.params.id, ecoLocal]);

  const handleToggleFavorito = async () => {
    alternarFavorito(eco.id);
    await toggleFavorito(eco);
  };

  return (
    <Screen edges={['top', 'right', 'left']}>
      <View style={s.header}>
        <BackButton inline />
        <Image source={wordmark} style={s.headerLogo} resizeMode="contain" />
        <View style={s.headerAcao}>
          <FavoritoButton pontoId={eco.id} size={30} />
        </View>
      </View>

      {erro ? (
        <ErrorState onRetry={onRefresh} />
      ) : (
        <ScrollView
          contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 32 }]}
          refreshControl={
            <RefreshControl
              refreshing={atualizando}
              onRefresh={onRefresh}
              colors={[colors.greenDark]}
              tintColor={colors.greenDark}
            />
          }
        >
          <Image
            source={fotoFalhou ? fotoPadrao : { uri: eco.imagemUri }}
            onError={() => setFotoFalhou(true)}
            style={[s.foto, { width: fotoW, height: fotoH }]}
            resizeMode="cover"
          />

          <Text style={s.title}>{eco.nome}</Text>

          <Pressable
            onPress={handleToggleFavorito}
            style={[s.favButton, favoritado && s.favButtonActive]}
          >
            <MaterialCommunityIcons
              name={favoritado ? 'heart' : 'heart-outline'}
              size={20}
              color={favoritado ? colors.white : colors.greenDark}
            />
            <Text style={[s.favText, favoritado && s.favTextActive]}>
              {favoritado ? 'Remover dos Favoritos' : 'Favoritar Ponto'}
            </Text>
          </Pressable>

          <View style={s.info}>
            <Text style={s.infoText}>
              <Text style={s.bold}>Horários: </Text>
              {eco.horarioFuncionamento}
            </Text>
            <Text style={s.infoText}>
              <Text style={s.bold}>Endereço: </Text>
              {eco.endereco} - {eco.bairro}
            </Text>
            <Text style={s.infoText}>
              <Text style={s.bold}>Telefone: </Text>
              <Text style={s.link} onPress={() => Linking.openURL(`tel:${telefoneDigitos}`)}>
                {eco.telefoneContato}
              </Text>
            </Text>
            <Text style={s.infoText}>
              <Text style={s.bold}>Distância: </Text>
              {eco.distancia} de você
            </Text>
            <Text style={s.infoText}>
              <Text style={s.bold}>Aceita entulho: </Text>
              {eco.aceitaEntulho ? 'Sim' : 'Não'}
            </Text>
          </View>

          <Text style={s.section}>O que pode descartar aqui</Text>
          <CategoryRow only={[eco.categoria]} />

          <Text style={s.section}>Localização</Text>
          <View style={s.mapBox}>
            <MapView
              key={`${eco.latitude},${eco.longitude}`}
              style={StyleSheet.absoluteFill}
              initialRegion={{
                latitude: eco.latitude,
                longitude: eco.longitude,
                latitudeDelta: MAP_DELTA,
                longitudeDelta: MAP_DELTA,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
              rotateEnabled={false}
              pitchEnabled={false}
              toolbarEnabled={false}
            >
              <Marker
                coordinate={{ latitude: eco.latitude, longitude: eco.longitude }}
                anchor={{ x: 0.5, y: 1 }}
              >
                <EcoPin ativo />
              </Marker>
            </MapView>
          </View>
        </ScrollView>
      )}
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
  headerAcao: { width: 34, alignItems: 'flex-end' },
  scroll: { paddingHorizontal: MARGEM, paddingBottom: 32 },
  foto: { borderRadius: 12, backgroundColor: colors.bgArc },
  title: {
    fontFamily: fonts.semibold,
    fontSize: 22,
    lineHeight: 30,
    color: colors.black,
    marginTop: 16,
  },
  favButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.greenDark,
    backgroundColor: colors.white,
    marginTop: 12,
    marginBottom: 4,
  },
  favButtonActive: { backgroundColor: colors.greenDark },
  favText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.greenDark },
  favTextActive: { color: colors.white },
  info: { marginTop: 8, gap: 4 },
  infoText: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: colors.black },
  bold: { fontFamily: fonts.semibold },
  link: { color: colors.greenDark, textDecorationLine: 'underline' },
  mapBox: { height: 180, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.bgArc },
  section: { fontFamily: fonts.medium, fontSize: 15, color: colors.black, marginTop: 24, marginBottom: 6 },
});

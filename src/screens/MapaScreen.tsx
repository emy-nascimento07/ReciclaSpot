import { useEffect, useRef, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import MapView, { Callout, Marker } from "react-native-maps";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import EcoPin from "../components/EcoPin";
import { Tag } from "../components/ui";
import { colors, fonts, shadow } from "../theme";
import { PontoColetaComDistancia } from "../types";
import { useEcopontos } from "../context/EcopontosContext";
import { RootStackParamList } from "../navigation/types";

const wordmark = require("../../assets/images/wordmark.png");

export default function MapaScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const { ecopontos, regiao, status, cidade } = useEcopontos();
  const [selId, setSelId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "ok") mapRef.current?.animateToRegion(regiao, 600);
  }, [status, regiao]);

  const selecionar = (e: PontoColetaComDistancia) => {
    setSelId(e.id);
    mapRef.current?.animateToRegion(
      {
        latitude: e.latitude + 0.004,
        longitude: e.longitude,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      },
      400,
    );
  };

  const centralizar = () => {
    setSelId(null);
    mapRef.current?.animateToRegion(regiao, 400);
  };

  return (
    <View style={s.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={regiao}
        showsUserLocation={status === "ok"}
        showsMyLocationButton={false}
        onPress={(ev) => {
          if (ev.nativeEvent.action !== "marker-press") setSelId(null);
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
            tracksViewChanges={selId === e.id}
          >
            <EcoPin ativo={selId === e.id} />

            <Callout
              tooltip
              onPress={() => navigation.navigate("Ecoponto", { id: e.id })}
            >
              <View style={s.calloutCard}>
                <Text style={s.cardTitle}>{e.nome}</Text>

                <View style={s.row}>
                  <MaterialCommunityIcons
                    name="map-marker-outline"
                    size={16}
                    color={colors.muted}
                  />
                  <Text style={s.cardText} numberOfLines={2}>
                    {e.distancia} · {e.endereco} - {e.bairro}
                  </Text>
                </View>

                <View style={[s.row, { gap: 6, marginTop: 8 }]}>
                  <Tag label={e.categoria} />
                  {e.aceitaEntulho && <Tag label="Aceita entulho" />}
                </View>

                <View style={s.calloutBtn}>
                  <Text style={s.calloutBtnText}>Ver detalhes</Text>
                  <MaterialCommunityIcons
                    name="arrow-right"
                    size={16}
                    color={colors.white}
                  />
                </View>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      <View style={[s.header, { top: insets.top + 8 }]}>
        <Image source={wordmark} style={s.wordmark} resizeMode="contain" />
        <Text style={s.headerSub}>
          {status === "carregando"
            ? "Buscando sua localização..."
            : status === "ok"
              ? `${ecopontos.length} ecopontos perto de você${cidade ? ` em ${cidade}` : ""}`
              : "Localização desativada · pontos de exemplo"}
        </Text>
      </View>

      <Pressable
        style={[s.fab, { top: insets.top + 8 }]}
        onPress={centralizar}
        accessibilityLabel="Centralizar em mim"
      >
        <MaterialCommunityIcons
          name="crosshairs-gps"
          size={22}
          color={colors.black}
        />
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: {
    position: "absolute",
    left: 16,
    right: 76,
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    ...shadow,
  },
  wordmark: { width: 120, height: 120 * (138 / 549) },
  headerSub: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.muted,
    marginTop: 4,
  },
  fab: {
    position: "absolute",
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    ...shadow,
  },
  calloutCard: {
    width: 260,
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 6,
    ...shadow,
  },
  cardTitle: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.black,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
    flexWrap: "wrap",
  },
  cardText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.text,
    flexShrink: 1,
  },
  calloutBtn: {
    marginTop: 12,
    backgroundColor: colors.green,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  calloutBtnText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.white,
  },
});

import { useCallback, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Button, Logo, PontoCard, Screen } from "../components/ui";
import { colors, fonts } from "../theme";
import { useFavoritos } from "../hooks/useFavoritos";
import { useEcopontos } from "../context/EcopontosContext";
import { RootStackParamList } from "../navigation/types";
import { pluralizar } from "../utils";

const PADDING_H = 20;

export default function FavoritosScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { favoritos } = useFavoritos();
  const { recarregar } = useEcopontos();

  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState(false);

  const subtitulo =
    favoritos.length === 0
      ? "Você ainda não salvou nenhum local"
      : pluralizar(favoritos.length, "local salvo", "locais salvos");

  const onRefresh = useCallback(async () => {
    setAtualizando(true);
    setErro(false);

    try {
      await recarregar();
    } catch {
      setErro(true);
    } finally {
      setAtualizando(false);
    }
  }, [recarregar]);

  if (erro) {
    return (
      <Screen edges={["top", "right", "left"]}>
        <View style={s.errorContainer}>
          <MaterialCommunityIcons
            name="wifi-off"
            size={48}
            color={colors.muted}
          />
          <Text style={s.errorText}>
            Erro ao carregar dados. Verifique sua conexão
          </Text>
          <View style={s.errorButtonWrapper}>
            <Button
              title="Tentar Novamente"
              color={colors.greenDark}
              onPress={onRefresh}
            />
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={["top", "right", "left"]}>
      <FlatList
        data={favoritos}
        keyExtractor={(e) => e.id}
        contentContainerStyle={s.container}
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={onRefresh}
            colors={[colors.greenDark]}
            tintColor={colors.greenDark}
          />
        }
        ListHeaderComponent={
          <View>
            <Logo size={100} />
            <Text style={s.title}>Meus Favoritos</Text>
            <Text style={s.subtitle}>{subtitulo}</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={s.empty}>
            <MaterialCommunityIcons
              name="heart-outline"
              size={56}
              color={colors.searchBg}
            />
            <Text style={s.emptyText}>
              Toque no coração de um ecoponto, na aba Explorar ou nos detalhes,
              para salvá-lo aqui.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <PontoCard
            ponto={item}
            onPress={() => navigation.navigate("Ecoponto", { id: item.id })}
          />
        )}
      />
    </Screen>
  );
}

const s = StyleSheet.create({
  container: {
    paddingHorizontal: PADDING_H,
    paddingTop: 32,
    paddingBottom: 24,
    gap: 14,
  },
  title: {
    fontFamily: fonts.semibold,
    fontSize: 23,
    color: colors.black,
    textAlign: "center",
    marginTop: 8,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.muted,
    textAlign: "center",
    marginBottom: 6,
  },
  empty: {
    alignItems: "center",
    gap: 12,
    marginTop: 32,
    paddingHorizontal: 24,
  },
  emptyText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.muted,
    textAlign: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    gap: 12,
  },
  errorText: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    textAlign: "center",
    color: colors.black,
  },
  errorButtonWrapper: {
    marginTop: 8,
    width: "100%",
  },
});

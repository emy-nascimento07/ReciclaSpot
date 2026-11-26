import { useCallback, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Button, ErrorState, Logo, Screen } from "../components/ui";
import { colors, fonts } from "../theme";
import { StackProps } from "../navigation/types";
import { useEcopontos } from "../hooks";

export default function SplashScreen({ navigation }: StackProps<"Splash">) {
  const { recarregar } = useEcopontos();
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState(false);

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

  return (
    <Screen style={s.container}>
      {erro ? (
        <ErrorState onRetry={onRefresh} />
      ) : (
        <ScrollView
          contentContainerStyle={s.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={atualizando}
              onRefresh={onRefresh}
              colors={[colors.greenDark]}
              tintColor={colors.greenDark}
            />
          }
        >
          <View style={{ marginTop: 48 }}>
            <Logo size={180} />
          </View>

          <Text style={s.title}>
            O ponto de encontro entre você e o descarte correto.
          </Text>
          <Text style={s.subtitle}>
            Conectamos você aos pontos de coleta mais próximos para transformar
            a logística reversa da nossa cidade. Inteligência urbana a favor do
            planeta.
          </Text>

          <View style={s.footer}>
            <Button
              title="Encontrar pontos de coleta"
              color={colors.green}
              onPress={() => navigation.navigate("Intermediaria")}
              iconRight={
                <MaterialCommunityIcons
                  name="chevron-down"
                  size={18}
                  color={colors.black}
                />
              }
            />
          </View>
        </ScrollView>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  container: { paddingHorizontal: 28 },
  scrollContent: { flexGrow: 1 },
  title: {
    fontFamily: fonts.medium,
    fontSize: 25,
    lineHeight: 38,
    textAlign: "center",
    color: colors.black,
    marginTop: 36,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    color: colors.muted,
    marginTop: 28,
    paddingHorizontal: 8,
  },
  footer: { flex: 1, justifyContent: "flex-end", paddingBottom: 32 },
});

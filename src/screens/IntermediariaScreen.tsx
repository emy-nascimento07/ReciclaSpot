import { ReactNode, useCallback, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { BackButton, ErrorState, Screen } from "../components/ui";
import { colors, fonts, shadow } from "../theme";
import { StackProps } from "../navigation/types";
import { useEcopontos } from "../hooks";

function RoleCircle({
  icon,
  title,
  description,
  onPress,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        s.circle,
        pressed && { transform: [{ scale: 0.97 }] },
      ]}
    >
      <View style={s.iconBox}>{icon}</View>
      <Text style={s.title}>{title}</Text>
      <Text style={s.desc}>{description}</Text>
    </Pressable>
  );
}

export default function IntermediariaScreen({
  navigation,
}: StackProps<"Intermediaria">) {
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
    <Screen>
      <BackButton />

      {erro ? (
        <ErrorState onRetry={onRefresh} />
      ) : (
        <ScrollView
          contentContainerStyle={s.content}
          refreshControl={
            <RefreshControl
              refreshing={atualizando}
              onRefresh={onRefresh}
              colors={[colors.greenDark]}
              tintColor={colors.greenDark}
            />
          }
        >
          <RoleCircle
            title="Sou cidadão"
            description="Para quem quer descartar resíduos de forma prática"
            onPress={() => navigation.navigate("Login", { role: "cidadao" })}
            icon={
              <View>
                <Feather name="user" size={84} color={colors.black} />
                <MaterialCommunityIcons
                  name="recycle-variant"
                  size={30}
                  color={colors.green}
                  style={s.badgeTopRight}
                />
              </View>
            }
          />
          <RoleCircle
            title="Sou Voluntário"
            description="Para quem quer gerenciar pontos de coleta e ajudar a cidade"
            onPress={() => navigation.navigate("Login", { role: "voluntario" })}
            icon={
              <View>
                <MaterialCommunityIcons
                  name="factory"
                  size={84}
                  color={colors.black}
                />
                <MaterialCommunityIcons
                  name="cog-outline"
                  size={26}
                  color={colors.black}
                  style={s.badgeTopRight}
                />
                <Feather
                  name="arrow-right-circle"
                  size={26}
                  color={colors.green}
                  style={s.badgeBottomRight}
                />
              </View>
            }
          />
        </ScrollView>
      )}
    </Screen>
  );
}

const SIZE = 230;

const s = StyleSheet.create({
  content: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "space-evenly",
    paddingTop: 56,
    paddingBottom: 16,
  },
  circle: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    ...shadow,
  },
  iconBox: { marginBottom: 4 },
  badgeTopRight: { position: "absolute", top: -6, right: -34 },
  badgeBottomRight: { position: "absolute", bottom: 0, right: -34 },
  title: { fontFamily: fonts.semibold, fontSize: 21, color: colors.black },
  desc: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
    color: colors.muted,
    marginTop: 4,
  },
});

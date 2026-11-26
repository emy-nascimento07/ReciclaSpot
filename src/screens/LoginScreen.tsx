import { useCallback, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BackButton, Button, ErrorState, Input, Logo, Screen } from "../components/ui";
import { colors, fonts, roleInfo } from "../theme";
import { StackProps } from "../navigation/types";
import { useEcopontos, useUser } from "../hooks";
import { buscarUsuarioPorEmailDb } from "../services/database";
import { camposPreenchidos, emailValido } from "../utils";

export default function LoginScreen({
  navigation,
  route,
}: StackProps<"Login">) {
  const { role } = route.params;
  const info = roleInfo[role];
  const { entrar } = useUser();
  const { recarregar } = useEcopontos();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
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

  const onEntrar = async () => {
    if (!camposPreenchidos(email, senha)) {
      Alert.alert("Atenção", "Preencha e-mail e senha para continuar.");
      return;
    }
    if (!emailValido(email)) {
      Alert.alert("Atenção", "Digite um e-mail válido (ex.: nome@email.com).");
      return;
    }
    const emailLimpo = email.trim();
    const usuarioDb = await buscarUsuarioPorEmailDb(emailLimpo, role).catch(() => null);
    entrar(role, {
      nome: usuarioDb?.nome,
      email: emailLimpo,
    });
    navigation.reset({ index: 0, routes: [{ name: "Main" }] });
  };

  return (
    <Screen>
      <BackButton />

      {erro ? (
        <ErrorState onRetry={onRefresh} buttonColor={info.color} />
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={s.container}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl
                refreshing={atualizando}
                onRefresh={onRefresh}
                colors={[info.color]}
                tintColor={info.color}
              />
            }
          >
            <Logo size={110} />
            <Text style={s.title}>
              Bem-Vindo de Volta,{"\n"}
              {info.label}!
            </Text>
            <Text style={s.subtitle}>
              Entre para continuar ajudando a trasnformar nossa cidade
            </Text>

            <View style={s.form}>
              <Input
                icon="email-outline"
                placeholder="E-mail"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                value={email}
                onChangeText={setEmail}
              />
              <Input
                icon="lock-outline"
                placeholder="Senha"
                secureTextEntry
                value={senha}
                onChangeText={setSenha}
              />
            </View>

            <Pressable
              onPress={() =>
                Alert.alert(
                  "Recuperar senha",
                  "Enviaremos um link para o seu e-mail.",
                )
              }
            >
              <Text style={s.forgot}>Esqueceu sua senha?</Text>
            </Pressable>

            <View style={{ marginTop: 34 }}>
              <Button
                title={`Entrar como ${info.label}`}
                color={info.color}
                onPress={onEntrar}
              />
            </View>

            <Text style={s.footer}>
              Não tem uma conta?{" "}
              <Text
                style={s.footerLink}
                onPress={() => navigation.replace("Cadastro", { role })}
              >
                Cadastre-se
              </Text>
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  container: { paddingHorizontal: 24, paddingTop: 48, paddingBottom: 32 },
  title: {
    fontFamily: fonts.semibold,
    fontSize: 26,
    lineHeight: 38,
    textAlign: "center",
    color: colors.black,
    marginTop: 16,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    color: colors.muted,
    marginTop: 6,
    paddingHorizontal: 8,
  },
  form: { gap: 16, marginTop: 36 },
  forgot: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.greenDark,
    marginTop: 16,
  },
  footer: {
    fontFamily: fonts.regular,
    fontSize: 14,
    textAlign: "center",
    color: colors.black,
    marginTop: 16,
  },
  footerLink: { fontFamily: fonts.bold },
});

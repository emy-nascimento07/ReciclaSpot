import { useCallback, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Button, Logo, Screen } from "../components/ui";
import { colors, fonts, roleInfo, shadow } from "../theme";
import { useUser } from "../hooks/useUser";
import { useEcopontos } from "../hooks/useEcopontos";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { tirarFoto } from "../camera";
import { formatarData, camposPreenchidos, emailValido } from "../utils";
import { Role } from "../types";

const avatar = require("../../assets/images/avatar.png");

const PADDING_H = 28;
const AVATAR_SIZE = 104;
const AVATAR_RADIUS = AVATAR_SIZE / 2;
const CAMERA_BADGE_SIZE = 30;
const THUMB_SIZE = 52;

export default function PerfilScreen() {
  const { user, removerDescarte, atualizarFotoPerfil, atualizarPerfil } =
    useUser();
  const { recarregar } = useEcopontos();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [abrindoCamera, setAbrindoCamera] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [nomeEdit, setNomeEdit] = useState(user.nome);
  const [emailEdit, setEmailEdit] = useState(user.email);
  const [roleEdit, setRoleEdit] = useState<Role>(user.role);
  const [salvando, setSalvando] = useState(false);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState(false);

  const rolesDisponiveis = Object.keys(roleInfo) as Role[];

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

  const abrirModalEdicao = () => {
    setNomeEdit(user.nome);
    setEmailEdit(user.email);
    setRoleEdit(user.role);
    setModalEditar(true);
  };

  const salvarPerfil = async () => {
    const nomeLimpo = nomeEdit.trim();
    const emailLimpo = emailEdit.trim();

    if (!camposPreenchidos(nomeLimpo)) {
      Alert.alert("Atenção", "O nome não pode ficar em branco.");
      return;
    }
    if (!emailValido(emailLimpo)) {
      Alert.alert("Atenção", "Digite um e-mail válido.");
      return;
    }
    try {
      setSalvando(true);
      await atualizarPerfil({
        nome: nomeLimpo,
        email: emailLimpo,
        role: roleEdit,
      });
      setModalEditar(false);
    } catch {
      Alert.alert("Erro", "Não foi possível salvar as alterações.");
    } finally {
      setSalvando(false);
    }
  };

  const confirmarRemocao = (id: string) =>
    Alert.alert(
      "Apagar descarte?",
      "A foto e o registro serão removidos do seu histórico.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Apagar",
          style: "destructive",
          onPress: () => removerDescarte(id),
        },
      ],
    );

  const registrar = async () => {
    setAbrindoCamera(true);
    try {
      const fotoUri = await tirarFoto();
      if (fotoUri) navigation.navigate("RegistrarDescarte", { fotoUri });
    } finally {
      setAbrindoCamera(false);
    }
  };

  const alterarFotoPerfil = async () => {
    if (abrindoCamera) return;
    setAbrindoCamera(true);
    try {
      const fotoUri = await tirarFoto();
      if (fotoUri) {
        await atualizarFotoPerfil(fotoUri);
      }
    } finally {
      setAbrindoCamera(false);
    }
  };

  const fotoAtual = user.fotoPerfilUri;

  return (
    <Screen edges={["top", "right", "left"]}>
      {erro ? (
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
      ) : (
        <ScrollView
          contentContainerStyle={s.container}
          refreshControl={
            <RefreshControl
              refreshing={atualizando}
              onRefresh={onRefresh}
              colors={[colors.greenDark]}
              tintColor={colors.greenDark}
            />
          }
        >
          <Logo size={100} />

          <Pressable onPress={alterarFotoPerfil} style={s.avatarWrapper}>
            <Image
              source={fotoAtual ? { uri: fotoAtual } : avatar}
              style={s.avatar}
            />
            <View style={s.cameraBadge}>
              <MaterialCommunityIcons
                name="camera"
                size={16}
                color={colors.white}
              />
            </View>
          </Pressable>

          <Text style={s.name}>{user.nome}</Text>
          <Text style={s.role}>{roleInfo[user.role].title}</Text>
          <Text style={s.email}>{user.email}</Text>
          <Pressable style={s.edit} hitSlop={8} onPress={abrirModalEdicao}>
            <Text style={s.editText}>Editar Perfil</Text>
            <MaterialCommunityIcons
              name="pencil-outline"
              size={14}
              color={colors.muted}
            />
          </Pressable>

          <View style={s.stat}>
            <Text style={s.statNumber}>{user.pontosReciclagem}</Text>
            <Text style={s.statLabel}>
              Descartes conscientes{"\n"}realizados
            </Text>
          </View>

          <View style={{ marginTop: 40 }}>
            <Button
              title="Registrar Novo Descarte"
              color={colors.green}
              onPress={registrar}
              icon={
                <MaterialCommunityIcons
                  name="camera-outline"
                  size={22}
                  color={colors.black}
                />
              }
            />
          </View>

          {user.historico.length > 0 && (
            <>
              <Text style={s.section}>Últimos descartes</Text>
              <Text style={s.dica}>Segure um item para apagar</Text>
              <View style={{ gap: 10 }}>
                {user.historico.map((d) => (
                  <Pressable
                    key={d.id}
                    onLongPress={() => confirmarRemocao(d.id)}
                    style={({ pressed }) => [
                      s.item,
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    <Image source={{ uri: d.fotoUri }} style={s.thumb} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.itemTitle}>{d.categoria}</Text>
                      <Text style={s.itemSub} numberOfLines={1}>
                        {d.pontoNome} · {formatarData(d.data)}
                      </Text>
                    </View>
                    <MaterialCommunityIcons
                      name="check-decagram"
                      size={22}
                      color={colors.green}
                    />
                  </Pressable>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      )}

      <Modal
        visible={modalEditar}
        transparent
        animationType="fade"
        onRequestClose={() => setModalEditar(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={s.modalOverlay}
        >
          <View style={s.modalBox}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Editar Perfil</Text>
              <Pressable onPress={() => setModalEditar(false)} hitSlop={8}>
                <MaterialCommunityIcons
                  name="close"
                  size={22}
                  color={colors.muted}
                />
              </Pressable>
            </View>

            <Text style={s.label}>Nome</Text>
            <TextInput
              style={s.input}
              value={nomeEdit}
              onChangeText={setNomeEdit}
              placeholder="Seu nome"
              placeholderTextColor={colors.muted}
              autoCapitalize="words"
            />

            <Text style={s.label}>E-mail</Text>
            <TextInput
              style={s.input}
              value={emailEdit}
              onChangeText={setEmailEdit}
              placeholder="seu@email.com"
              placeholderTextColor={colors.muted}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={s.label}>Tipo de perfil</Text>
            <View style={s.roleList}>
              {rolesDisponiveis.map((r) => {
                const selecionado = roleEdit === r;
                return (
                  <Pressable
                    key={r}
                    onPress={() => setRoleEdit(r)}
                    style={[s.roleChip, selecionado && s.roleChipAtivo]}
                  >
                    <Text
                      style={[
                        s.roleChipText,
                        selecionado && s.roleChipTextAtivo,
                      ]}
                    >
                      {roleInfo[r].title}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={s.modalActions}>
              <Pressable
                style={s.cancelBtn}
                onPress={() => setModalEditar(false)}
                disabled={salvando}
              >
                <Text style={s.cancelBtnText}>Cancelar</Text>
              </Pressable>
              <View style={{ flex: 1 }}>
                <Button
                  title={salvando ? "Salvando..." : "Salvar"}
                  color={colors.green}
                  onPress={salvarPerfil}
                />
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Screen>
  );
}

const s = StyleSheet.create({
  container: {
    paddingHorizontal: PADDING_H,
    paddingTop: 32,
    paddingBottom: 32,
    alignItems: "stretch",
  },
  avatarWrapper: { alignSelf: "center", marginTop: 12, position: "relative" },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_RADIUS,
  },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: colors.green,
    width: CAMERA_BADGE_SIZE,
    height: CAMERA_BADGE_SIZE,
    borderRadius: CAMERA_BADGE_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.white,
  },
  name: {
    fontFamily: fonts.semibold,
    fontSize: 22,
    color: colors.black,
    textAlign: "center",
    marginTop: 12,
  },
  role: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.greenDark,
    textAlign: "center",
    marginTop: 2,
  },
  email: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.muted,
    textAlign: "center",
    marginTop: 2,
  },
  edit: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginTop: 8,
  },
  editText: { fontFamily: fonts.medium, fontSize: 13, color: colors.muted },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginTop: 24,
    ...shadow,
  },
  statNumber: { fontFamily: fonts.bold, fontSize: 34, color: colors.greenDark },
  statLabel: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.black,
  },
  section: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.black,
    marginTop: 28,
  },
  dica: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
    marginBottom: 10,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 10,
    ...shadow,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 8,
    backgroundColor: colors.searchBg,
  },
  itemTitle: { fontFamily: fonts.semibold, fontSize: 14, color: colors.black },
  itemSub: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  modalBox: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: { fontFamily: fonts.semibold, fontSize: 18, color: colors.black },
  label: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.black,
    marginTop: 10,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.searchBg,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.black,
  },
  roleList: { flexDirection: "row", gap: 8, marginTop: 4 },
  roleChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.searchBg,
    alignItems: "center",
  },
  roleChipAtivo: { backgroundColor: colors.green, borderColor: colors.green },
  roleChipText: { fontFamily: fonts.medium, fontSize: 13, color: colors.muted },
  roleChipTextAtivo: { color: colors.black, fontFamily: fonts.semibold },
  modalActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 20,
  },
  cancelBtn: { paddingVertical: 12, paddingHorizontal: 16 },
  cancelBtnText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.muted,
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

import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Button, Logo, Screen } from "../components/ui";
import { colors, fonts, roleInfo, shadow } from "../theme";
import { useUser } from "../context/UserContext";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { tirarFoto } from "../camera";

const avatar = require("../../assets/images/avatar.png");

const formatarData = (iso: string) => {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)} às ${p(d.getHours())}:${p(d.getMinutes())}`;
};

export default function PerfilScreen() {
  const { user, removerDescarte, atualizarFotoPerfil, atualizarPerfil } =
    useUser();
  const [abrindoCamera, setAbrindoCamera] = useState(false);

  // Estados do modal de edição
  const [modalEditar, setModalEditar] = useState(false);
  const [nomeEdit, setNomeEdit] = useState(user.nome);
  const [emailEdit, setEmailEdit] = useState(user.email);
  const [roleEdit, setRoleEdit] = useState(user.role);
  const [salvando, setSalvando] = useState(false);

  const abrirModalEdicao = () => {
    setNomeEdit(user.nome);
    setEmailEdit(user.email);
    setRoleEdit(user.role);
    setModalEditar(true);
  };

  const salvarPerfil = async () => {
    const nomeLimpo = nomeEdit.trim();
    const emailLimpo = emailEdit.trim();

    if (!nomeLimpo) {
      Alert.alert("Atenção", "O nome não pode ficar em branco.");
      return;
    }

    if (!emailLimpo || !emailLimpo.includes("@")) {
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

  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const registrar = async () => {
    setAbrindoCamera(true);
    try {
      const fotoUri = await tirarFoto();
      if (fotoUri) {
        navigation.navigate("RegistrarDescarte", { fotoUri });
      }
    } finally {
      setAbrindoCamera(false);
    }
  };

  const [fotoPerfilLocal, setFotoPerfilLocal] = useState<string | null>(null);

  const alterarFotoPerfil = async () => {
    if (abrindoCamera) return;
    setAbrindoCamera(true);
    const fotoUri = await tirarFoto();
    setAbrindoCamera(false);
    if (fotoUri) {
      setFotoPerfilLocal(fotoUri);
      await atualizarFotoPerfil(fotoUri);
    }
  };

  const rolesDisponiveis = Object.keys(roleInfo) as Array<typeof user.role>;

  return (
    <Screen edges={["top", "right", "left"]}>
      <ScrollView contentContainerStyle={s.container}>
        <Logo size={100} />

        <Pressable onPress={alterarFotoPerfil} style={s.avatarWrapper}>
          <Image
            source={
              fotoPerfilLocal || user.fotoPerfilUri
                ? { uri: (fotoPerfilLocal || user.fotoPerfilUri)! }
                : avatar
            }
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
          <Text style={s.statLabel}>Descartes conscientes{"\n"}realizados</Text>
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

      {/* Modal de Edição de Perfil */}
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
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 32,
    alignItems: "stretch",
  },
  avatarWrapper: { alignSelf: "center", marginTop: 12, position: "relative" },
  avatar: { width: 104, height: 104, borderRadius: 52 },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: colors.green,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.white,
  },
  section: {
    fontFamily: fonts.semibold,
    fontSize: 17,
    color: colors.black,
    marginTop: 32,
  },
  dica: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.muted,
    marginBottom: 12,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 10,
    ...shadow,
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: colors.bgArc,
  },
  itemTitle: { fontFamily: fonts.medium, fontSize: 15, color: colors.black },
  itemSub: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted },
  name: {
    fontFamily: fonts.semibold,
    fontSize: 23,
    color: colors.black,
    textAlign: "center",
    marginTop: 6,
  },
  role: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.green,
    textAlign: "center",
    lineHeight: 22,
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
    marginTop: 4,
  },
  editText: {
    fontFamily: fonts.regular,
    fontStyle: "italic",
    fontSize: 14,
    color: colors.muted,
  },
  stat: {
    backgroundColor: colors.white,
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 20,
    marginTop: 20,
    ...shadow,
  },
  statNumber: {
    fontFamily: fonts.bold,
    fontSize: 68,
    lineHeight: 80,
    color: colors.greenStat,
  },
  statLabel: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 21,
    textAlign: "center",
    color: colors.black,
  },
  // Estilos do Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  modalBox: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 22,
    ...shadow,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  modalTitle: {
    fontFamily: fonts.semibold,
    fontSize: 19,
    color: colors.black,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.black,
    marginTop: 10,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.black,
    backgroundColor: "#FAFAFA",
  },
  roleList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  roleChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: colors.white,
  },
  roleChipAtivo: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  roleChipText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.muted,
  },
  roleChipTextAtivo: {
    fontFamily: fonts.semibold,
    color: colors.black,
  },
  modalActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 22,
  },
  cancelBtn: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  cancelBtnText: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.muted,
  },
});
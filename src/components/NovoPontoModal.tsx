import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Location from "expo-location";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Button } from "./ui";
import { colors, fonts, shadow } from "../theme";
import { Categoria, Coords } from "../types";
import { categorias } from "../constants/categorias";
import { useEcopontos } from "../context/EcopontosContext";
import { regiaoPadrao } from "../services/mockPontos";
import { tirarFoto } from "../camera";

type Props = {
  visible: boolean;
  coordenadaInicial?: Coords | null;
  onClose: () => void;
};

export default function NovoPontoModal({
  visible,
  coordenadaInicial,
  onClose,
}: Props) {
  const { usuario, adicionarPonto } = useEcopontos();

  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState<Categoria>("Recicláveis Gerais");
  const [endereco, setEndereco] = useState("");
  const [bairro, setBairro] = useState("");
  const [horario, setHorario] = useState("Seg a Sex, 08h às 17h");
  const [telefone, setTelefone] = useState("");
  const [aceitaEntulho, setAceitaEntulho] = useState(false);
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const coordBase: Coords = coordenadaInicial ?? usuario ?? regiaoPadrao;

  // Limpa o formulário e busca o endereço aproximado da coordenada ao abrir
  useEffect(() => {
    if (!visible) return;

    setNome("");
    setCategoria("Recicláveis Gerais");
    setEndereco("");
    setBairro("");
    setHorario("Seg a Sex, 08h às 17h");
    setTelefone("");
    setAceitaEntulho(false);
    setFotoUri(null);

    Location.reverseGeocodeAsync(coordBase)
      .then(([a]) => {
        if (!a) return;
        const rua = a.street ?? a.name;
        if (rua) {
          setEndereco(`${rua}${a.streetNumber ? `, ${a.streetNumber}` : ""}`);
        }
        const b = a.district ?? a.subregion ?? a.city;
        if (b) setBairro(b);
      })
      .catch(() => {});
  }, [visible]);

  const capturarFoto = async () => {
    const uri = await tirarFoto();
    if (uri) setFotoUri(uri);
  };

  const salvarPonto = async () => {
    if (!nome.trim()) {
      Alert.alert("Atenção", "Digite o nome do ponto de coleta.");
      return;
    }
    if (!endereco.trim() || !bairro.trim()) {
      Alert.alert("Atenção", "Preencha o endereço e o bairro.");
      return;
    }

    try {
      setSalvando(true);
      await adicionarPonto({
        nome,
        categoria,
        endereco,
        bairro,
        horarioFuncionamento: horario,
        latitude: coordBase.latitude,
        longitude: coordBase.longitude,
        imagemUri: fotoUri,
        telefoneContato: telefone,
        aceitaEntulho,
      });
      Alert.alert("Sucesso", "Novo ponto de coleta cadastrado!");
      onClose();
    } catch {
      Alert.alert("Erro", "Não foi possível salvar o ponto de coleta.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={s.overlay}
      >
        <View style={s.box}>
          <View style={s.header}>
            <Text style={s.title}>Novo Ponto de Coleta</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={colors.muted}
              />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 12 }}
          >
            <Text style={s.coordInfo}>
              Localização: {coordBase.latitude.toFixed(5)},{" "}
              {coordBase.longitude.toFixed(5)}
            </Text>

            <Text style={s.label}>Nome do Ecoponto *</Text>
            <TextInput
              style={s.input}
              placeholder="Ex: Ecoponto Praça Central"
              placeholderTextColor={colors.muted}
              value={nome}
              onChangeText={setNome}
            />

            <Text style={s.label}>Categoria principal *</Text>
            <View style={s.catGrid}>
              {categorias.map((c) => {
                const ativo = categoria === c.nome;
                return (
                  <Pressable
                    key={c.nome}
                    onPress={() => setCategoria(c.nome)}
                    style={[s.chip, ativo && s.chipAtivo]}
                  >
                    <MaterialCommunityIcons
                      name={c.icone}
                      size={16}
                      color={ativo ? colors.black : colors.muted}
                    />
                    <Text style={[s.chipText, ativo && s.chipTextAtivo]}>
                      {c.nome}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={s.label}>Endereço *</Text>
            <TextInput
              style={s.input}
              placeholder="Rua e número"
              placeholderTextColor={colors.muted}
              value={endereco}
              onChangeText={setEndereco}
            />

            <Text style={s.label}>Bairro *</Text>
            <TextInput
              style={s.input}
              placeholder="Nome do bairro"
              placeholderTextColor={colors.muted}
              value={bairro}
              onChangeText={setBairro}
            />

            <Text style={s.label}>Horário de funcionamento</Text>
            <TextInput
              style={s.input}
              placeholder="Seg a Sex, 08h às 17h"
              placeholderTextColor={colors.muted}
              value={horario}
              onChangeText={setHorario}
            />

            <Text style={s.label}>Telefone de contato</Text>
            <TextInput
              style={s.input}
              placeholder="(00) 00000-0000"
              placeholderTextColor={colors.muted}
              keyboardType="phone-pad"
              value={telefone}
              onChangeText={setTelefone}
            />

            <View style={s.switchRow}>
              <Text style={s.switchLabel}>Aceita entulho?</Text>
              <Switch
                value={aceitaEntulho}
                onValueChange={setAceitaEntulho}
                trackColor={{ false: "#D1D5DB", true: colors.green }}
                thumbColor={colors.white}
              />
            </View>

            <Pressable style={s.fotoBtn} onPress={capturarFoto}>
              <MaterialCommunityIcons
                name="camera-outline"
                size={20}
                color={colors.black}
              />
              <Text style={s.fotoBtnText}>
                {fotoUri ? "Trocar foto do local" : "Tirar foto do local (opcional)"}
              </Text>
            </Pressable>

            {fotoUri && (
              <Image source={{ uri: fotoUri }} style={s.fotoPreview} />
            )}

            <View style={s.actions}>
              <Pressable style={s.cancelBtn} onPress={onClose} disabled={salvando}>
                <Text style={s.cancelText}>Cancelar</Text>
              </Pressable>
              <View style={{ flex: 1 }}>
                <Button
                  title={salvando ? "Salvando..." : "Cadastrar Ponto"}
                  color={colors.green}
                  onPress={salvarPonto}
                />
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  box: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 22,
    maxHeight: "90%",
    ...shadow,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontFamily: fonts.semibold,
    fontSize: 20,
    color: colors.black,
  },
  coordInfo: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.muted,
    marginBottom: 6,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.black,
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.black,
    backgroundColor: "#FAFAFA",
  },
  catGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: colors.white,
  },
  chipAtivo: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  chipText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.muted,
  },
  chipTextAtivo: {
    fontFamily: fonts.semibold,
    color: colors.black,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    paddingVertical: 4,
  },
  switchLabel: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.black,
  },
  fotoBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.muted,
  },
  fotoBtnText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.black,
  },
  fotoPreview: {
    width: "100%",
    height: 140,
    borderRadius: 10,
    marginTop: 10,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 22,
  },
  cancelBtn: {
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  cancelText: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.muted,
  },
});
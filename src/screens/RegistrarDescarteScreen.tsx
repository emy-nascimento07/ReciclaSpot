import { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackButton, Button, CategoryRow, Screen } from '../components/ui';
import { colors, fonts, shadow } from '../theme';
import { Category } from '../data';
import { StackProps } from '../navigation/types';
import { useUser } from '../context/UserContext';
import { useEcopontos } from '../context/EcopontosContext';
import { tirarFoto } from '../camera';

const MARGEM = 20;

export default function RegistrarDescarteScreen({ navigation, route }: StackProps<'RegistrarDescarte'>) {
  const { registrarDescarte } = useUser();
  const { ecopontos } = useEcopontos();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [foto, setFoto] = useState(route.params.fotoUri);
  const [salvando, setSalvando] = useState(false);
  const [categoria, setCategoria] = useState<Category | null>(null);
  const [ecopontoId, setEcopontoId] = useState<string | null>(ecopontos[0]?.id ?? null);

  // só mostra ecopontos que aceitam o material escolhido
  const opcoes = categoria ? ecopontos.filter((e) => e.aceita.includes(categoria)) : ecopontos;
  const ecoValido = opcoes.some((e) => e.id === ecopontoId) ? ecopontoId : null;

  const escolherCategoria = (c: Category) => {
    setCategoria(c);
    if (!ecopontos.find((e) => e.id === ecopontoId)?.aceita.includes(c)) {
      setEcopontoId(ecopontos.find((e) => e.aceita.includes(c))?.id ?? null);
    }
  };

  const refazer = async () => {
    const uri = await tirarFoto();
    if (uri) setFoto(uri);
  };

  const confirmar = async () => {
    if (salvando) return;
    if (!categoria) return Alert.alert('Falta pouco', 'Escolha o tipo de material que você descartou.');
    const eco = ecopontos.find((e) => e.id === ecoValido);
    if (!eco) return Alert.alert('Falta pouco', 'Escolha o ecoponto onde você fez o descarte.');
    setSalvando(true);
    await registrarDescarte({ fotoUri: foto, categoria, ecopontoId: eco.id, ecopontoNome: eco.nome });
    setSalvando(false);
    Alert.alert('Descarte registrado! 🌱', 'Obrigado por ajudar a transformar nossa cidade.', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  const fotoW = width - MARGEM * 2;

  return (
    <Screen edges={['top', 'right', 'left']}>
      <View style={s.header}>
        <BackButton inline />
        <Text style={s.headerTitle}>Registrar Descarte</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 32 }]}>
        <View>
          <Image source={{ uri: foto }} style={[s.foto, { width: fotoW, height: fotoW * 0.75 }]} />
          <Pressable style={s.refazer} onPress={refazer} hitSlop={8}>
            <MaterialCommunityIcons name="camera-retake-outline" size={18} color={colors.black} />
            <Text style={s.refazerText}>Tirar outra</Text>
          </Pressable>
        </View>

        <Text style={s.section}>O que você descartou?</Text>
        <CategoryRow selected={categoria ? [categoria] : []} onToggle={escolherCategoria} />

        <Text style={s.section}>Em qual ecoponto?</Text>
        {opcoes.length === 0 && <Text style={s.vazio}>Nenhum ecoponto próximo aceita esse material.</Text>}
        <View style={{ gap: 10 }}>
          {opcoes.map((e) => {
            const ativo = e.id === ecoValido;
            return (
              <Pressable key={e.id} onPress={() => setEcopontoId(e.id)} style={[s.opcao, ativo && s.opcaoAtiva]}>
                <MaterialCommunityIcons
                  name={ativo ? 'radiobox-marked' : 'radiobox-blank'}
                  size={22}
                  color={ativo ? colors.green : colors.muted}
                />
                <View style={{ flex: 1 }}>
                  <Text style={s.opcaoTitle}>{e.nome}</Text>
                  <Text style={s.opcaoSub} numberOfLines={1}>
                    {e.distancia} · {e.endereco}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={{ marginTop: 28 }}>
          <Button
            title={salvando ? 'Salvando...' : 'Confirmar descarte'}
            color={colors.green}
            onPress={confirmar}
            icon={<MaterialCommunityIcons name="check-circle-outline" size={20} color={colors.black} />}
          />
        </View>
      </ScrollView>
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
  headerTitle: { fontFamily: fonts.semibold, fontSize: 18, color: colors.black },
  scroll: { paddingHorizontal: MARGEM },
  foto: { borderRadius: 14, backgroundColor: colors.bgArc },
  refazer: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.white,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    ...shadow,
  },
  refazerText: { fontFamily: fonts.medium, fontSize: 13, color: colors.black },
  section: { fontFamily: fonts.semibold, fontSize: 17, color: colors.black, marginTop: 24, marginBottom: 14 },
  vazio: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted },
  opcao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
    ...shadow,
  },
  opcaoAtiva: { borderColor: colors.green },
  opcaoTitle: { fontFamily: fonts.medium, fontSize: 15, color: colors.black },
  opcaoSub: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted },
});

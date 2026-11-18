import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BackButton, CategoryRow, Logo, Screen, Tag } from '../components/ui';
import { colors, fonts, shadow } from '../theme';
import { categories, Category } from '../data';
import { useEcopontos } from '../context/EcopontosContext';
import { RootStackParamList } from '../navigation/types';

const labelOf = (id: Category) => categories.find((c) => c.id === id)!.label;

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { ecopontos, status, cidade } = useEcopontos();
  const [busca, setBusca] = useState('');
  const [filtros, setFiltros] = useState<Category[]>([]);

  const toggle = (c: Category) => setFiltros((f) => (f.includes(c) ? f.filter((x) => x !== c) : [...f, c]));

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return ecopontos.filter(
      (e) =>
        (!q || e.nome.toLowerCase().includes(q) || e.endereco.toLowerCase().includes(q)) &&
        filtros.every((f) => e.aceita.includes(f)),
    );
  }, [busca, filtros, ecopontos]);

  const avisoLocal =
    status === 'carregando'
      ? 'Buscando sua localização...'
      : status === 'ok'
        ? `Ecopontos perto de você${cidade ? ` em ${cidade}` : ''}`
        : status === 'negado' || status === 'erro'
          ? 'Ative a localização para ver os ecopontos perto de você'
          : null;

  return (
    <Screen edges={['top', 'right', 'left']}>
      <BackButton onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Intermediaria' }] })} />
      <FlatList
        data={lista}
        keyExtractor={(e) => e.id}
        contentContainerStyle={s.container}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View>
            <Logo size={100} />
            <View style={s.search}>
              <MaterialCommunityIcons name="magnify" size={28} color={colors.black} />
              <TextInput
                placeholder="Buscar Ecopontos..."
                placeholderTextColor={colors.text}
                value={busca}
                onChangeText={setBusca}
                style={s.searchInput}
                returnKeyType="search"
              />
            </View>
            {avisoLocal && (
              <View style={s.aviso}>
                <MaterialCommunityIcons
                  name={status === 'ok' ? 'map-marker-radius-outline' : 'map-marker-off-outline'}
                  size={16}
                  color={status === 'ok' ? colors.greenDark : colors.muted}
                />
                <Text style={[s.avisoText, status === 'ok' && { color: colors.greenDark }]}>{avisoLocal}</Text>
              </View>
            )}
            <View style={{ marginTop: 16, marginBottom: 8 }}>
              <CategoryRow selected={filtros} onToggle={toggle} />
            </View>
          </View>
        }
        ListEmptyComponent={<Text style={s.empty}>Nenhum ecoponto encontrado.</Text>}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate('Ecoponto', { id: item.id })}
            style={({ pressed }) => [s.card, pressed && { opacity: 0.9 }]}
          >
            <Text style={s.cardTitle}>{item.nome}</Text>
            <View style={s.row}>
              <MaterialCommunityIcons name="map-marker-outline" size={22} color={colors.muted} />
              <Text style={s.dist}>{item.distancia}</Text>
            </View>
            <View style={[s.row, { gap: 6, marginTop: 8 }]}>
              {item.aceita.map((c) => (
                <Tag key={c} label={labelOf(c)} />
              ))}
            </View>
          </Pressable>
        )}
      />
    </Screen>
  );
}

const s = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingTop: 48, paddingBottom: 24, gap: 14 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.searchBg,
    borderRadius: 24,
    height: 48,
    paddingHorizontal: 16,
    gap: 8,
    marginTop: 16,
  },
  aviso: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, paddingHorizontal: 4 },
  avisoText: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, flexShrink: 1 },
  searchInput: { flex: 1, fontFamily: fonts.regular, fontSize: 16, color: colors.text, paddingVertical: 0 },
  card: { backgroundColor: colors.white, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 14, ...shadow },
  cardTitle: { fontFamily: fonts.medium, fontSize: 19, color: colors.black },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  dist: { fontFamily: fonts.regular, fontSize: 15, color: colors.text },
  empty: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: 20 },
});

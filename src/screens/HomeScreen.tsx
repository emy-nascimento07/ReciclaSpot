import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BackButton, CategoryRow, Logo, PontoCard, Screen } from '../components/ui';
import { colors, fonts } from '../theme';
import { Categoria } from '../types';
import { useEcopontos } from '../context/EcopontosContext';
import { RootStackParamList } from '../navigation/types';

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { ecopontos, status, cidade } = useEcopontos();
  const [busca, setBusca] = useState('');
  const [filtros, setFiltros] = useState<Categoria[]>([]);

  const toggle = (c: Categoria) => setFiltros((f) => (f.includes(c) ? f.filter((x) => x !== c) : [...f, c]));

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return ecopontos.filter(
      (e) =>
        (!q ||
          e.nome.toLowerCase().includes(q) ||
          e.endereco.toLowerCase().includes(q) ||
          e.bairro.toLowerCase().includes(q)) &&
        (filtros.length === 0 || filtros.includes(e.categoria)),
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
            <View style={{ marginTop: 12 }}>
              <CategoryRow selected={filtros} onToggle={toggle} />
            </View>
          </View>
        }
        ListEmptyComponent={<Text style={s.empty}>Nenhum ecoponto encontrado.</Text>}
        renderItem={({ item }) => (
          <PontoCard ponto={item} onPress={() => navigation.navigate('Ecoponto', { id: item.id })} />
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
  empty: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: 20 },
});

import { useCallback, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  BackButton,
  CategoryRow,
  ErrorState,
  Logo,
  PontoCard,
  Screen,
} from '../components/ui';
import NovoPontoModal from '../components/NovoPontoModal';
import { colors, fonts, shadow } from '../theme';
import { useEcopontos, usePontosFiltrados, useUser } from '../hooks';
import { RootStackParamList } from '../navigation/types';

const PADDING_H = 20;
const SEARCH_HEIGHT = 48;
const SEARCH_RADIUS = 24;

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { status, cidade, recarregar } = useEcopontos();
  const { user } = useUser();
  const { lista, busca, setBusca, filtros, toggleFiltro } = usePontosFiltrados();

  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState(false);

  const isVoluntario = user.role === 'voluntario';

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

      {erro ? (
        <ErrorState onRetry={onRefresh} />
      ) : (
        <FlatList
          data={lista}
          keyExtractor={(e) => e.id}
          contentContainerStyle={s.container}
          keyboardShouldPersistTaps="handled"
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
                  <Text style={[s.avisoText, status === 'ok' && { color: colors.greenDark }]}>
                    {avisoLocal}
                  </Text>
                </View>
              )}
              {isVoluntario && (
                <Pressable style={s.novoPontoBtn} onPress={() => setModalNovoAberto(true)}>
                  <MaterialCommunityIcons name="plus-circle-outline" size={20} color={colors.black} />
                  <Text style={s.novoPontoText}>Cadastrar Novo Ponto de Coleta</Text>
                </Pressable>
              )}
              <View style={{ marginTop: 12 }}>
                <CategoryRow selected={filtros} onToggle={toggleFiltro} />
              </View>
            </View>
          }
          ListEmptyComponent={<Text style={s.empty}>Nenhum ecoponto encontrado.</Text>}
          renderItem={({ item }) => (
            <PontoCard ponto={item} onPress={() => navigation.navigate('Ecoponto', { id: item.id })} />
          )}
        />
      )}

      <NovoPontoModal
        visible={modalNovoAberto}
        onClose={() => setModalNovoAberto(false)}
      />
    </Screen>
  );
}

const s = StyleSheet.create({
  container: { paddingHorizontal: PADDING_H, paddingTop: 48, paddingBottom: 24, gap: 14 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.searchBg,
    borderRadius: SEARCH_RADIUS,
    height: SEARCH_HEIGHT,
    paddingHorizontal: 16,
    gap: 8,
    marginTop: 16,
  },
  aviso: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, paddingHorizontal: 4 },
  avisoText: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, flexShrink: 1 },
  novoPontoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.green,
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 12,
    ...shadow,
  },
  novoPontoText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.black },
  searchInput: { flex: 1, fontFamily: fonts.regular, fontSize: 16, color: colors.text, paddingVertical: 0 },
  empty: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: 20 },
});

import { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Logo, PontoCard, Screen } from '../components/ui';
import { colors, fonts } from '../theme';
import { useEcopontos } from '../context/EcopontosContext';
import { useUser } from '../context/UserContext';
import { RootStackParamList } from '../navigation/types';

export default function FavoritosScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { ecopontos } = useEcopontos();
  const { user } = useUser();

  const lista = useMemo(() => ecopontos.filter((e) => user.favoritos.includes(e.id)), [ecopontos, user.favoritos]);

  return (
    <Screen edges={['top', 'right', 'left']}>
      <FlatList
        data={lista}
        keyExtractor={(e) => e.id}
        contentContainerStyle={s.container}
        ListHeaderComponent={
          <View>
            <Logo size={100} />
            <Text style={s.title}>Meus Favoritos</Text>
            <Text style={s.subtitle}>
              {lista.length === 0
                ? 'Você ainda não salvou nenhum local'
                : `${lista.length} ${lista.length === 1 ? 'local salvo' : 'locais salvos'}`}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={s.empty}>
            <MaterialCommunityIcons name="heart-outline" size={56} color={colors.searchBg} />
            <Text style={s.emptyText}>
              Toque no coração de um ecoponto, na aba Explorar ou nos detalhes, para salvá-lo aqui.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <PontoCard ponto={item} onPress={() => navigation.navigate('Ecoponto', { id: item.id })} />
        )}
      />
    </Screen>
  );
}

const s = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingTop: 32, paddingBottom: 24, gap: 14 },
  title: { fontFamily: fonts.semibold, fontSize: 23, color: colors.black, textAlign: 'center', marginTop: 8 },
  subtitle: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted, textAlign: 'center', marginBottom: 6 },
  empty: { alignItems: 'center', gap: 12, marginTop: 32, paddingHorizontal: 24 },
  emptyText: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: colors.muted, textAlign: 'center' },
});

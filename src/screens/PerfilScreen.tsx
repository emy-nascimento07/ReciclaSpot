import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Logo, Screen } from '../components/ui';
import { colors, fonts, roleInfo, shadow } from '../theme';
import { useUser } from '../context/UserContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { categories } from '../data';
import { tirarFoto } from '../camera';

const avatar = require('../../assets/images/avatar.png');

const formatarData = (iso: string) => {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)} às ${p(d.getHours())}:${p(d.getMinutes())}`;
};

export default function PerfilScreen() {
  const { user, removerDescarte } = useUser();

  const confirmarRemocao = (id: string) =>
    Alert.alert('Apagar descarte?', 'A foto e o registro serão removidos do seu histórico.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Apagar', style: 'destructive', onPress: () => removerDescarte(id) },
    ]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const registrar = async () => {
    const fotoUri = await tirarFoto();
    if (fotoUri) navigation.navigate('RegistrarDescarte', { fotoUri });
  };

  return (
    <Screen edges={['top', 'right', 'left']}>
      <ScrollView contentContainerStyle={s.container}>
        <Logo size={100} />
        <Image source={avatar} style={s.avatar} />
        <Text style={s.name}>{user.nome}</Text>
        <Text style={s.role}>{roleInfo[user.role].title}</Text>
        <Pressable
          style={s.edit}
          hitSlop={8}
          onPress={() => Alert.alert('Editar Perfil', 'Em breve você poderá editar seus dados.')}
        >
          <Text style={s.editText}>Editar Perfil</Text>
          <MaterialCommunityIcons name="pencil-outline" size={14} color={colors.muted} />
        </Pressable>

        <View style={s.stat}>
          <Text style={s.statNumber}>{user.descartes}</Text>
          <Text style={s.statLabel}>Descartes conscientes{'\n'}realizados</Text>
        </View>

        <View style={{ marginTop: 40 }}>
          <Button
            title="Registrar Novo Descarte"
            color={colors.green}
            onPress={registrar}
            icon={<MaterialCommunityIcons name="camera-outline" size={22} color={colors.black} />}
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
                  style={({ pressed }) => [s.item, pressed && { opacity: 0.85 }]}
                >
                  <Image source={{ uri: d.fotoUri }} style={s.thumb} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.itemTitle}>{categories.find((c) => c.id === d.categoria)?.label}</Text>
                    <Text style={s.itemSub} numberOfLines={1}>
                      {d.ecopontoNome} · {formatarData(d.data)}
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="check-decagram" size={22} color={colors.green} />
                </Pressable>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  container: { paddingHorizontal: 28, paddingTop: 32, paddingBottom: 32, alignItems: 'stretch' },
  section: { fontFamily: fonts.semibold, fontSize: 17, color: colors.black, marginTop: 32 },
  dica: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted, marginBottom: 12 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 10,
    ...shadow,
  },
  thumb: { width: 52, height: 52, borderRadius: 8, backgroundColor: colors.bgArc },
  itemTitle: { fontFamily: fonts.medium, fontSize: 15, color: colors.black },
  itemSub: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted },
  avatar: { width: 104, height: 104, borderRadius: 52, alignSelf: 'center', marginTop: 12 },
  name: { fontFamily: fonts.semibold, fontSize: 23, color: colors.black, textAlign: 'center', marginTop: 6 },
  role: { fontFamily: fonts.regular, fontSize: 16, color: colors.green, textAlign: 'center', lineHeight: 22 },
  edit: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 4 },
  editText: { fontFamily: fonts.regular, fontStyle: 'italic', fontSize: 14, color: colors.muted },
  stat: {
    backgroundColor: colors.white,
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 20,
    marginTop: 20,
    ...shadow,
  },
  statNumber: { fontFamily: fonts.bold, fontSize: 68, lineHeight: 80, color: colors.greenStat },
  statLabel: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, textAlign: 'center', color: colors.black },
});

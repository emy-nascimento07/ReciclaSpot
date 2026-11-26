import { ReactNode } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { Edge, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, fonts, shadow } from '../theme';
import { Categoria, PontoColetaComDistancia } from '../types';
import { categorias } from '../constants/categorias';
import { useUser } from '../context/UserContext';

const logo = require('../../assets/images/logo.png');

/** Fundo branco com os arcos cinza decorativos do Figma. */
export function Screen({
  children,
  style,
  edges = ['top', 'right', 'bottom', 'left'],
}: {
  children: ReactNode;
  style?: ViewStyle;
  /** Telas dentro das abas usam ['top', 'right', 'left']: a barra de abas já protege a parte de baixo. */
  edges?: Edge[];
}) {
  return (
    <View style={styles.screen}>
      <View pointerEvents="none" style={[styles.arc, styles.arcTop]} />
      <View pointerEvents="none" style={[styles.arc, styles.arcBottom]} />
      <SafeAreaView edges={edges} style={[{ flex: 1 }, style]}>
        {children}
      </SafeAreaView>
    </View>
  );
}

/**
 * Seta de voltar. Por padrão fica fixa no canto superior esquerdo, abaixo da barra de status.
 * Com `inline`, entra no fluxo normal do layout (ex.: dentro de um cabeçalho).
 */
export function BackButton({ onPress, style, inline }: { onPress?: () => void; style?: ViewStyle; inline?: boolean }) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  return (
    <Pressable
      onPress={onPress ?? (() => navigation.canGoBack() && navigation.goBack())}
      hitSlop={12}
      style={[inline ? null : [styles.back, { top: insets.top + 8 }], style]}
      accessibilityLabel="Voltar"
    >
      <MaterialCommunityIcons name="arrow-left-circle-outline" size={34} color={colors.black} />
    </Pressable>
  );
}

export function Logo({ size = 110 }: { size?: number }) {
  return <Image source={logo} style={{ width: size, height: size * (571 / 553), alignSelf: 'center' }} resizeMode="contain" />;
}

type InputProps = TextInputProps & { icon: keyof typeof MaterialCommunityIcons.glyphMap };

export function Input({ icon, style, ...rest }: InputProps) {
  return (
    <View style={styles.input}>
      <MaterialCommunityIcons name={icon} size={30} color={colors.black} />
      <TextInput placeholderTextColor={colors.text} style={[styles.inputText, style]} {...rest} />
    </View>
  );
}

export function Button({
  title,
  color,
  onPress,
  icon,
  iconRight,
}: {
  title: string;
  color: string;
  onPress: () => void;
  icon?: ReactNode;
  iconRight?: ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.button, { backgroundColor: color, opacity: pressed ? 0.85 : 1 }]}
    >
      {icon}
      <Text style={styles.buttonText}>{title}</Text>
      {iconRight}
    </Pressable>
  );
}

export function Tag({ label }: { label: string }) {
  return (
    <View style={styles.tag}>
      <Text style={styles.tagText}>{label}</Text>
    </View>
  );
}

/** Círculos de categoria. Com as 5 categorias, rola na horizontal em telas estreitas. */
export function CategoryRow({
  selected,
  onToggle,
  only,
}: {
  selected?: Categoria[];
  onToggle?: (c: Categoria) => void;
  only?: Categoria[];
}) {
  const list = only ? categorias.filter((c) => only.includes(c.nome)) : categorias;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.catRow}
      style={styles.catScroll}
    >
      {list.map((c) => {
        const active = selected?.includes(c.nome);
        return (
          <Pressable
            key={c.nome}
            onPress={() => onToggle?.(c.nome)}
            disabled={!onToggle}
            style={styles.catItem}
            accessibilityState={{ selected: !!active }}
          >
            <View style={[styles.catCircle, active && { borderColor: colors.green, borderWidth: 2 }]}>
              <MaterialCommunityIcons name={c.icone} size={32} color={colors.black} />
            </View>
            <Text style={styles.catLabel} numberOfLines={2}>
              {c.nome}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/** Coração para salvar/remover um ponto dos Favoritos. */
export function FavoritoButton({ pontoId, size = 26 }: { pontoId: string; size?: number }) {
  const { ehFavorito, alternarFavorito } = useUser();
  const ativo = ehFavorito(pontoId);
  return (
    <Pressable
      onPress={() => alternarFavorito(pontoId)}
      hitSlop={10}
      accessibilityLabel={ativo ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
    >
      <MaterialCommunityIcons name={ativo ? 'heart' : 'heart-outline'} size={size} color={ativo ? '#E5484D' : colors.muted} />
    </Pressable>
  );
}

/** Card de ponto de coleta usado no feed (Explorar) e nos Favoritos. */
export function PontoCard({ ponto, onPress }: { ponto: PontoColetaComDistancia; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {ponto.nome}
        </Text>
        <FavoritoButton pontoId={ponto.id} />
      </View>
      <View style={styles.cardRow}>
        <MaterialCommunityIcons name="map-marker-outline" size={20} color={colors.muted} />
        <Text style={styles.cardText} numberOfLines={1}>
          {ponto.distancia} · {ponto.bairro}
        </Text>
      </View>
      <View style={[styles.cardRow, { gap: 6, marginTop: 8 }]}>
        <Tag label={ponto.categoria} />
        {ponto.aceitaEntulho && <Tag label="Aceita entulho" />}
      </View>
    </Pressable>
  );
}

/** Estado visual de erro de rede com botão de nova tentativa. */
export function ErrorState({
  onRetry,
  message = 'Erro ao carregar dados. Verifique sua conexão',
  buttonColor = colors.greenDark,
}: {
  onRetry: () => void;
  message?: string;
  buttonColor?: string;
}) {
  return (
    <View style={styles.errorContainer}>
      <MaterialCommunityIcons name="wifi-off" size={48} color={colors.muted} />
      <Text style={styles.errorText}>{message}</Text>
      <View style={styles.errorButtonWrapper}>
        <Button title="Tentar Novamente" color={buttonColor} onPress={onRetry} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white, overflow: 'hidden' },
  arc: { position: 'absolute', borderRadius: 9999, borderWidth: 34, borderColor: colors.bgArc },
  arcTop: { width: 520, height: 520, top: -150, left: 90 },
  arcBottom: { width: 620, height: 620, top: 380, right: 80 },
  back: { position: 'absolute', left: 20, zIndex: 10 },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    height: 54,
    paddingHorizontal: 10,
    backgroundColor: colors.white,
    gap: 10,
  },
  inputText: { flex: 1, fontFamily: fonts.regular, fontSize: 16, color: colors.text, paddingVertical: 0 },
  button: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    borderRadius: 8,
    height: 48,
    paddingHorizontal: 28,
    minWidth: 230,
  },
  buttonText: { fontFamily: fonts.regular, fontSize: 16, color: colors.black },
  tag: { backgroundColor: colors.green, borderRadius: 5, paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { fontFamily: fonts.regular, fontSize: 13, color: colors.black },
  catScroll: { flexGrow: 0, marginHorizontal: -20 },
  catRow: { flexGrow: 1, justifyContent: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 8 },
  catItem: { alignItems: 'center', gap: 6, width: 78 },
  card: { backgroundColor: colors.white, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 14, ...shadow },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  cardTitle: { flex: 1, fontFamily: fonts.medium, fontSize: 18, lineHeight: 25, color: colors.black },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' },
  cardText: { flexShrink: 1, fontFamily: fonts.regular, fontSize: 14, color: colors.text },
  catCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  catLabel: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16, textAlign: 'center', color: colors.text },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  errorText: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    textAlign: 'center',
    color: colors.black,
  },
  errorButtonWrapper: {
    marginTop: 8,
    width: '100%',
  },
});

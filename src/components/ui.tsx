import { ReactNode } from 'react';
import {
  Image,
  Pressable,
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
import { Category, categories } from '../data';

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

/** Círculos de categoria (Eletrônicos, Vidro, Pilhas). */
export function CategoryRow({
  selected,
  onToggle,
  only,
}: {
  selected?: Category[];
  onToggle?: (c: Category) => void;
  only?: Category[];
}) {
  const list = only ? categories.filter((c) => only.includes(c.id)) : categories;
  return (
    <View style={styles.catRow}>
      {list.map((c) => {
        const active = selected?.includes(c.id);
        return (
          <Pressable key={c.id} onPress={() => onToggle?.(c.id)} disabled={!onToggle} style={styles.catItem}>
            <View style={[styles.catCircle, active && { borderColor: colors.green, borderWidth: 2 }]}>
              <MaterialCommunityIcons name={c.icon} size={36} color={colors.black} />
            </View>
            <Text style={styles.catLabel}>{c.label}</Text>
          </Pressable>
        );
      })}
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
  catRow: { flexDirection: 'row', justifyContent: 'center', gap: 28 },
  catItem: { alignItems: 'center', gap: 6, width: 80 },
  catCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  catLabel: { fontFamily: fonts.regular, fontSize: 14, color: colors.text },
});

import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BackButton, Button, Input, Logo, Screen } from '../components/ui';
import { colors, fonts, roleInfo } from '../theme';
import { StackProps } from '../navigation/types';
import { useUser } from '../context/UserContext';

export default function LoginScreen({ navigation, route }: StackProps<'Login'>) {
  const { role } = route.params;
  const info = roleInfo[role];
  const { entrar } = useUser();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const onEntrar = () => {
    if (!email.trim() || !senha) {
      Alert.alert('Atenção', 'Preencha e-mail e senha para continuar.');
      return;
    }
    entrar(role);
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  };

  return (
    <Screen>
      <BackButton />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
          <Logo size={110} />
          <Text style={s.title}>Bem-Vindo de Volta,{'\n'}{info.label}!</Text>
          <Text style={s.subtitle}>Entre para continuar ajudando a trasnformar nossa cidade</Text>

          <View style={s.form}>
            <Input
              icon="email-outline"
              placeholder="E-mail"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              value={email}
              onChangeText={setEmail}
            />
            <Input icon="lock-outline" placeholder="Senha" secureTextEntry value={senha} onChangeText={setSenha} />
          </View>

          <Pressable onPress={() => Alert.alert('Recuperar senha', 'Enviaremos um link para o seu e-mail.')}>
            <Text style={s.forgot}>Esqueceu sua senha?</Text>
          </Pressable>

          <View style={{ marginTop: 34 }}>
            <Button title={`Entrar como ${info.label}`} color={info.color} onPress={onEntrar} />
          </View>

          <Text style={s.footer}>
            Não tem uma conta?{' '}
            <Text style={s.footerLink} onPress={() => navigation.replace('Cadastro', { role })}>
              Cadastre-se
            </Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const s = StyleSheet.create({
  container: { paddingHorizontal: 24, paddingTop: 48, paddingBottom: 32 },
  title: { fontFamily: fonts.semibold, fontSize: 26, lineHeight: 38, textAlign: 'center', color: colors.black, marginTop: 16 },
  subtitle: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, textAlign: 'center', color: colors.muted, marginTop: 6, paddingHorizontal: 8 },
  form: { gap: 16, marginTop: 36 },
  forgot: { fontFamily: fonts.semibold, fontSize: 15, color: colors.greenDark, marginTop: 16 },
  footer: { fontFamily: fonts.regular, fontSize: 14, textAlign: 'center', color: colors.black, marginTop: 16 },
  footerLink: { fontFamily: fonts.bold },
});

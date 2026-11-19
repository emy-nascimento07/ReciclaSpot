import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BackButton, Button, Input, Logo, Screen } from '../components/ui';
import { colors, fonts, roleInfo } from '../theme';
import { StackProps } from '../navigation/types';
import { useUser } from '../context/UserContext';

export default function CadastroScreen({ navigation, route }: StackProps<'Cadastro'>) {
  const { role } = route.params;
  const info = roleInfo[role];
  const { entrar } = useUser();
  const [usuario, setUsuario] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const onCadastrar = () => {
    if (!usuario.trim() || !email.trim() || !senha) {
      Alert.alert('Atenção', 'Preencha todos os campos para criar sua conta.');
      return;
    }
    entrar(role, { nome: usuario, email });
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  };

  return (
    <Screen>
      <BackButton />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
          <Logo size={100} />
          <Text style={s.title}>Criar sua conta como{'\n'}{info.label}</Text>
          <Text style={s.subtitle}>Falta pouco para você começar a descartar de forma inteligente</Text>

          <View style={s.form}>
            <Input icon="account-outline" placeholder="Usuário" value={usuario} onChangeText={setUsuario} />
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

          <View style={{ marginTop: 32 }}>
            <Button title={`Ser um ${info.label}`} color={info.color} onPress={onCadastrar} />
          </View>

          <Text style={s.footer}>
            Já tem uma conta?{' '}
            <Text style={s.footerLink} onPress={() => navigation.replace('Login', { role })}>
              Faça login
            </Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const s = StyleSheet.create({
  container: { paddingHorizontal: 24, paddingTop: 48, paddingBottom: 32 },
  title: { fontFamily: fonts.semibold, fontSize: 25, lineHeight: 36, textAlign: 'center', color: colors.black, marginTop: 12 },
  subtitle: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, textAlign: 'center', color: colors.muted, marginTop: 6, paddingHorizontal: 8 },
  form: { gap: 14, marginTop: 28 },
  footer: { fontFamily: fonts.regular, fontSize: 14, textAlign: 'center', color: colors.black, marginTop: 16 },
  footerLink: { fontFamily: fonts.bold },
});

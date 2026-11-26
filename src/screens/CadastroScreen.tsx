import { useCallback, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BackButton, Button, ErrorState, Input, Logo, Screen } from '../components/ui';
import { colors, fonts, roleInfo } from '../theme';
import { StackProps } from '../navigation/types';
import { useEcopontos, useUser } from '../hooks';
import { cadastrarUsuario } from '../services/api';
import { inserirUsuarioDb, listarUsuariosDb } from '../services/database';
import { camposPreenchidos, emailValido } from '../utils';

const PADDING_H = 24;

export default function CadastroScreen({ navigation, route }: StackProps<'Cadastro'>) {
  const { role } = route.params;
  const info = roleInfo[role];
  const { entrar } = useUser();
  const { recarregar } = useEcopontos();

  const [usuario, setUsuario] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState(false);

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

  const onCadastrar = async () => {
    if (!camposPreenchidos(usuario, email, senha)) {
      Alert.alert('Atenção', 'Preencha todos os campos para criar sua conta.');
      return;
    }
    if (!emailValido(email.trim())) {
      Alert.alert('Atenção', 'Digite um e-mail válido.');
      return;
    }
    setCarregando(true);
    const nomeLimpo = usuario.trim();
    const emailLimpo = email.trim();

    try {
      const resposta = await cadastrarUsuario({
        nome: nomeLimpo,
        email: emailLimpo,
        senha,
        role,
      });
      await inserirUsuarioDb({
        id: resposta.id,
        nome: resposta.nome,
        email: resposta.email,
        role: resposta.role,
        criadoEm: new Date().toISOString(),
      }).catch(() => {});
      entrar(role, { nome: resposta.nome, email: resposta.email });
    } catch {
      await inserirUsuarioDb({
        id: `local_${Date.now()}`,
        nome: nomeLimpo,
        email: emailLimpo,
        role,
        criadoEm: new Date().toISOString(),
      }).catch(() => {});
      entrar(role, { nome: nomeLimpo, email: emailLimpo });
    } finally {
      const cadastrados = await listarUsuariosDb().catch(() => []);
      console.log('[SQLite SELECT usuarios]:', cadastrados);
      setCarregando(false);
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    }
  };

  return (
    <Screen>
      <BackButton />

      {erro ? (
        <ErrorState onRetry={onRefresh} buttonColor={info.color} />
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={s.container}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl
                refreshing={atualizando}
                onRefresh={onRefresh}
                colors={[info.color]}
                tintColor={info.color}
              />
            }
          >
            <Logo size={100} />
            <Text style={s.title}>
              Criar sua conta como{'\n'}
              {info.label}
            </Text>
            <Text style={s.subtitle}>
              Falta pouco para você começar a descartar de forma inteligente
            </Text>

            <View style={s.form}>
              <Input
                icon="account-outline"
                placeholder="Usuário"
                value={usuario}
                onChangeText={setUsuario}
              />
              <Input
                icon="email-outline"
                placeholder="E-mail"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                value={email}
                onChangeText={setEmail}
              />
              <Input
                icon="lock-outline"
                placeholder="Senha"
                secureTextEntry
                value={senha}
                onChangeText={setSenha}
              />
            </View>

            <View style={{ marginTop: 32 }}>
              <Button
                title={carregando ? 'Criando conta...' : `Ser um ${info.label}`}
                color={info.color}
                onPress={onCadastrar}
              />
            </View>

            <Text style={s.footer}>
              Já tem uma conta?{' '}
              <Text
                style={s.footerLink}
                onPress={() => navigation.replace('Login', { role })}
              >
                Faça login
              </Text>
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  container: { paddingHorizontal: PADDING_H, paddingTop: 48, paddingBottom: 32 },
  title: {
    fontFamily: fonts.semibold,
    fontSize: 25,
    lineHeight: 36,
    textAlign: 'center',
    color: colors.black,
    marginTop: 12,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    color: colors.muted,
    marginTop: 6,
    paddingHorizontal: 8,
  },
  form: { gap: 14, marginTop: 28 },
  footer: {
    fontFamily: fonts.regular,
    fontSize: 14,
    textAlign: 'center',
    color: colors.black,
    marginTop: 16,
  },
  footerLink: { fontFamily: fonts.bold },
});

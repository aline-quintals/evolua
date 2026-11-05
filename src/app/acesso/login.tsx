import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, Ellipse, Mask, Rect } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AZUL_ICONE = '#7E92F7';
const AZUL_BOTAO = '#4D63E8';
const AZUL_LINK = '#4A63E0';

// Lua crescente com nuvens e estrelas
function LuaNuvens() {
  return (
    <View style={styles.luaBox}>
      <Svg width={220} height={130} viewBox="0 0 220 130">
        <Defs>
          <Mask id="corte">
            <Rect x="0" y="0" width="220" height="130" fill="#FFFFFF" />
            <Circle cx="126" cy="46" r="46" fill="#000000" />
          </Mask>
        </Defs>

        <Circle cx="105" cy="62" r="50" fill="#FFFFFF" mask="url(#corte)" />

        {/* Nuvens */}
        <Ellipse cx="45" cy="100" rx="38" ry="14" fill="#C9DDF2" opacity={0.9} />
        <Ellipse cx="70" cy="92" rx="24" ry="14" fill="#C9DDF2" opacity={0.9} />
        <Ellipse cx="170" cy="100" rx="36" ry="13" fill="#C9DDF2" opacity={0.9} />
        <Ellipse cx="192" cy="93" rx="20" ry="12" fill="#C9DDF2" opacity={0.9} />
      </Svg>

      {/* Estrelas */}
      <Text style={[styles.estrela, { left: 58, top: 6, fontSize: 11 }]}>☆</Text>
      <Text style={[styles.estrela, { left: 106, top: 12, fontSize: 18 }]}>★</Text>
      <Text style={[styles.estrela, { left: 148, top: 24, fontSize: 15 }]}>☆</Text>
      <Text style={[styles.estrela, { left: 136, top: 46, fontSize: 10 }]}>★</Text>
    </View>
  );
}

export default function Login() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const entrar = () => {
    // Por enquanto sem validação: só leva para a tela principal
    router.replace('/principal/home');
  };

  return (
    <LinearGradient
      colors={['#4A74B5', '#A7C4EB', '#4A74B5']}
      locations={[0, 0.5, 1]}
      style={styles.fundo}
    >
      <KeyboardAvoidingView
        style={styles.fundo}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.conteudo,
            { paddingTop: insets.top + 50, paddingBottom: insets.bottom + 20 },
          ]}
        >
          <LuaNuvens />

          <Text style={styles.titulo}>Bem vindo(a)!</Text>
          <Text style={styles.subtitulo}>Acesse sua conta</Text>

          {/* Usuário */}
          <View style={styles.campo}>
            <Ionicons name="person" size={26} color={AZUL_ICONE} />
            <TextInput
              style={styles.input}
              placeholder="E-mail ou usuário"
              placeholderTextColor="#A7A7B0"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              value={usuario}
              onChangeText={setUsuario}
            />
          </View>

          {/* Senha */}
          <View style={styles.campo}>
            <TouchableOpacity
              onPress={() => setMostrarSenha(!mostrarSenha)}
              hitSlop={10}
              accessibilityLabel={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
            >
              <Ionicons
                name={mostrarSenha ? 'eye' : 'eye-off'}
                size={26}
                color={AZUL_ICONE}
              />
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder="********"
              placeholderTextColor="#A7A7B0"
              secureTextEntry={!mostrarSenha}
              autoCapitalize="none"
              value={senha}
              onChangeText={setSenha}
              onSubmitEditing={entrar}
            />
          </View>

          {/* Botão */}
          <TouchableOpacity style={styles.botao} onPress={entrar} activeOpacity={0.85}>
            <Text style={styles.botaoTexto}>Entrar</Text>
          </TouchableOpacity>

          {/* Links */}
          <TouchableOpacity onPress={() => router.push('/acesso/recuperar-senha')}>
            <Text style={styles.link}>Esqueceu a senha?</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/acesso/cadastro')}>
            <Text style={styles.link}>Criar conta</Text>
          </TouchableOpacity>

          <Text style={styles.rodape}>Aplicativo criado por NubyTech • 2026</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fundo: {
    flex: 1,
  },

  conteudo: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 30,
  },

  luaBox: {
    width: 220,
    height: 130,
    marginBottom: 28,
  },

  estrela: {
    position: 'absolute',
    color: '#FFFFFF',
  },

  titulo: {
    fontSize: 34,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 14,
  },

  subtitulo: {
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 30,
  },

  campo: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 420,
    height: 62,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 20,
    marginBottom: 34,
  },

  input: {
    flex: 1,
    marginLeft: 14,
    fontSize: 20,
    color: '#2B2F45',
    // remove o contorno azul do navegador ao focar (web)
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {}),
  },

  botao: {
    width: '100%',
    maxWidth: 420,
    height: 54,
    backgroundColor: AZUL_BOTAO,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -4,
    marginBottom: 32,
  },

  botaoTexto: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },

  link: {
    color: AZUL_LINK,
    fontSize: 19,
    marginBottom: 18,
  },

  rodape: {
    marginTop: 'auto',
    paddingTop: 30,
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'center',
  },
});
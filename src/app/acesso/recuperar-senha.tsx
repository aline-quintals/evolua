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
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AZUL_ICONE = '#7E92F7';
const AZUL_BOTAO = '#4D63E8';

function validar(texto: string): string {
  const valor = texto.trim();

  if (!valor) return 'Digite seu e-mail ou usuário.';

  if (valor.includes('@')) {
    if (!/^\S+@\S+\.\S+$/.test(valor)) return 'Digite um e-mail válido.';
    return '';
  }

  if (valor.length < 3 || /\s/.test(valor)) {
    return 'Digite um usuário válido, sem espaços.';
  }

  return '';
}

export default function RecuperarSenha() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [usuario, setUsuario] = useState('');
  const [erro, setErro] = useState('');

  const voltar = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/acesso/login');
  };

  const enviar = () => {
    const mensagem = validar(usuario);
    if (mensagem) {
      setErro(mensagem);
      return;
    }

    // TODO: aqui entra o pedido ao servidor para enviar o link de redefinição.
    // Por enquanto, só leva para a tela "link enviado".
    router.push('/acesso/link-enviado');
  };

  return (
    <View style={styles.externo}>
      <LinearGradient
        colors={['#4A74B5', '#A7C4EB', '#4A74B5']}
        locations={[0, 0.5, 1]}
        style={styles.coluna}
      >
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.conteudo,
              { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 20 },
            ]}
          >
            {/* Voltar */}
            <View style={styles.linhaVoltar}>
              <TouchableOpacity
                onPress={voltar}
                hitSlop={12}
                accessibilityLabel="Voltar"
              >
                <Ionicons name="arrow-back" size={38} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <Text style={styles.titulo}>Redefinir senha</Text>

            <Text style={styles.subtitulo}>
              Preencha seu e-mail ou usuário para receber o link de redefinir
              senha
            </Text>

            {/* Campo */}
            <View style={styles.campo}>
              <Ionicons name="person" size={26} color={AZUL_ICONE} />
              <TextInput
                style={styles.input}
                placeholder="E-mail ou usuário"
                placeholderTextColor="#A7A7B0"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                returnKeyType="send"
                value={usuario}
                onChangeText={(t) => {
                  setUsuario(t);
                  setErro('');
                }}
                onSubmitEditing={enviar}
              />
            </View>

            {/* Mensagem de erro */}
            {erro ? (
              <View style={styles.erroCaixa}>
                <Text style={styles.erroTexto}>{erro}</Text>
              </View>
            ) : null}

            {/* Botão */}
            <TouchableOpacity
              style={styles.botao}
              onPress={enviar}
              activeOpacity={0.85}
            >
              <Text style={styles.botaoTexto}>Enviar</Text>
            </TouchableOpacity>

            <Text style={styles.rodape}>Aplicativo criado por NubyTech • 2026</Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  // Na web, em janela larga, vira uma coluna centralizada (como no celular)
  externo: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#1F3558',
  },
  coluna: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    overflow: 'hidden',
  },

  conteudo: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  linhaVoltar: {
    width: '100%',
    alignItems: 'flex-start',
    marginBottom: 4,
  },

  titulo: {
    fontSize: 46,
    lineHeight: 54,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    maxWidth: 260,
    marginBottom: 56,
  },

  subtitulo: {
    fontSize: 20,
    lineHeight: 30,
    color: '#FFFFFF',
    textAlign: 'center',
    maxWidth: 320,
    marginBottom: 36,
  },

  campo: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    height: 62,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 20,
  },

  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 19,
    color: '#2B2F45',
    // remove o contorno azul do navegador ao focar (web)
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {}),
  },

  erroCaixa: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 14,
  },
  erroTexto: {
    color: '#B3261E',
    fontSize: 14,
    textAlign: 'center',
  },

  botao: {
    width: '100%',
    maxWidth: 340,
    height: 52,
    backgroundColor: AZUL_BOTAO,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
  },
  botaoTexto: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },

  rodape: {
    marginTop: 'auto',
    paddingTop: 30,
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'center',
  },
});